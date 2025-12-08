import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { verifyAuthToken, isAdmin } from '@/lib/auth';
import { sendUserRegistrationEmail } from '@/lib/email';

// Validation schema for user creation
const createUserSchema = z.object({
    fullName: z.string().min(3, 'Full name must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['ADMIN', 'SUPERVISOR', 'OPERATOR']),
    warehouseId: z.string().optional(),
    phone: z.string().optional(),
});

// GET /api/users - List all users
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');
        const active = searchParams.get('active');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};
        if (role) where.role = role;
        if (active !== null && active !== undefined) {
            where.active = active === 'true';
        }

        // Fetch users with pagination
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    fullName: true,
                    role: true,
                    phone: true,
                    avatar: true,
                    warehouseId: true,
                    active: true,
                    lastLogin: true,
                    createdAt: true,
                    updatedAt: true,
                    warehouse: {
                        select: {
                            id: true,
                            code: true,
                            name: true,
                        },
                    },
                    managedWarehouse: {
                        select: {
                            id: true,
                            code: true,
                            name: true,
                        },
                    },
                },
            }),
            prisma.user.count({ where }),
        ]);

        // Calculate stats
        const stats = await prisma.user.groupBy({
            by: ['role'],
            _count: { role: true },
            where: { active: true },
        });

        return NextResponse.json({
            users,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
            stats: {
                total,
                byRole: stats.reduce((acc, item) => {
                    acc[item.role] = item._count.role;
                    return acc;
                }, {} as Record<string, number>),
            },
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
    try {
        // Check authentication and role
        const authHeader = request.headers.get('authorization');
        console.log('[DEBUG] Auth header:', authHeader ? 'Present' : 'Missing');

        const user = verifyAuthToken(authHeader || '');
        console.log('[DEBUG] Verified user:', user);

        if (!user) {
            console.log('[DEBUG] Authentication failed');
            return NextResponse.json(
                { error: 'Unauthorized - Please login' },
                { status: 401 }
            );
        }

        console.log('[DEBUG] User role:', user.role);
        if (!isAdmin(user.role)) {
            console.log('[DEBUG] Not admin:', user.role);
            return NextResponse.json(
                {
                    error: 'Forbidden - Only administrators can create users',
                    required: 'ADMIN',
                    current: user.role,
                },
                { status: 403 }
            );
        }

        const body = await request.json(); // Validate input
        const validationResult = createUserSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: 'Validation failed',
                    details: validationResult.error.issues,
                },
                { status: 400 }
            );
        }

        const { fullName, email, password, role, warehouseId, phone } =
            validationResult.data;

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'Email already exists' },
                { status: 409 }
            );
        }

        // Generate username from email
        const username =
            email.split('@')[0] + '_' + Math.random().toString(36).substring(7);

        // Check if username exists (retry if collision)
        const existingUsername = await prisma.user.findUnique({
            where: { username },
        });

        if (existingUsername) {
            // Retry with different random suffix
            return NextResponse.json(
                { error: 'Username generation failed, please try again' },
                { status: 500 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // If warehouseId provided, verify it exists
        if (warehouseId) {
            const warehouse = await prisma.warehouse.findUnique({
                where: { id: warehouseId },
                include: {
                    manager: true,
                },
            });

            if (!warehouse) {
                return NextResponse.json(
                    { error: 'Warehouse not found' },
                    { status: 404 }
                );
            }

            // Check if warehouse already has a manager (only for SUPERVISOR role)
            if (role === 'SUPERVISOR' && warehouse.manager) {
                return NextResponse.json(
                    {
                        error: `Warehouse already has a manager (${warehouse.manager.fullName}). Please remove the current manager first or choose a different warehouse.`,
                        currentManager: {
                            id: warehouse.manager.id,
                            fullName: warehouse.manager.fullName,
                            email: warehouse.manager.email,
                        },
                    },
                    { status: 409 }
                );
            }

            // Note: OPERATOR can be assigned to warehouse even if it already has users
            // Multiple operators can work in the same warehouse
        }

        // DEBUG: Log what we're about to create
        console.log('=== DEBUG: Creating User ===');
        console.log('Data:', { fullName, email, role, warehouseId });

        // DEBUG: Check existing users in this warehouse
        if (warehouseId) {
            const existingUsers = await prisma.user.findMany({
                where: { warehouseId },
                select: {
                    id: true,
                    fullName: true,
                    role: true,
                    warehouseId: true,
                },
            });
            console.log('Existing users in warehouse:', existingUsers);
        }

        // Create user
        const newUser = await prisma.user.create({
            data: {
                email,
                username,
                password: hashedPassword,
                fullName,
                role,
                phone,
                warehouseId: warehouseId || null,
                active: true,
            },
            select: {
                id: true,
                email: true,
                username: true,
                fullName: true,
                role: true,
                phone: true,
                warehouseId: true,
                active: true,
                createdAt: true,
            },
        });

        // DEBUG: User created successfully
        console.log('User created:', newUser);

        // If user is SUPERVISOR, also set as warehouse manager
        if (warehouseId && role === 'SUPERVISOR') {
            console.log('Setting as warehouse manager:', {
                warehouseId,
                userId: newUser.id,
            });
            await prisma.warehouse.update({
                where: { id: warehouseId },
                data: { managerId: newUser.id },
            });
        }

        // DEBUG: Check all users after creation
        if (warehouseId) {
            const allUsers = await prisma.user.findMany({
                where: { warehouseId },
                select: {
                    id: true,
                    fullName: true,
                    role: true,
                    warehouseId: true,
                },
            });
            console.log('All users in warehouse after creation:', allUsers);
        }

        // Log activity
        try {
            await prisma.activity.create({
                data: {
                    userId: newUser.id,
                    action: 'USER_CREATED',
                    entity: 'User',
                    entityId: newUser.id,
                    details: `User ${newUser.fullName} (${newUser.email}) created with role ${newUser.role} by ${user.email}`,
                },
            });
        } catch (activityError) {
            console.error('Failed to log activity:', activityError);
            // Don't fail the request if activity logging fails
        }

        // Send confirmation email
        try {
            const emailResult = await sendUserRegistrationEmail({
                fullName: newUser.fullName,
                email: newUser.email,
                username: newUser.username,
                role: newUser.role,
            });

            if (emailResult.success) {
                console.log(`[EMAIL] Confirmation email sent to: ${email}`);
            } else {
                console.log(
                    `[EMAIL] Email not sent (SMTP not configured): ${email}`
                );
                console.log(`[EMAIL] Message: ${emailResult.message}`);
            }
        } catch (emailError) {
            console.error('[EMAIL] Failed to send email:', emailError);
            // Don't fail the request if email fails
        }

        return NextResponse.json(
            {
                message: 'User created successfully',
                user: newUser,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json(
            { error: 'Failed to create user' },
            { status: 500 }
        );
    }
}
