import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { verifyAuthToken, isAdmin } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// Validation schema for user update
const updateUserSchema = z.object({
    fullName: z.string().min(3).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    role: z.enum(['ADMIN', 'SUPERVISOR', 'OPERATOR']).optional(),
    phone: z.string().optional(),
    active: z.boolean().optional(),
    warehouseId: z.string().nullable().optional(),
});

// PUT /api/users/[id] - Update user
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Check authentication and role
        const authHeader = request.headers.get('authorization');
        const user = verifyAuthToken(authHeader || '');

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized - Please login' },
                { status: 401 }
            );
        }

        if (!isAdmin(user.role)) {
            return NextResponse.json(
                {
                    error: 'Forbidden - Only administrators can update users',
                    required: 'ADMIN',
                    current: user.role,
                },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { id } = params;

        // Validate input
        const validationResult = updateUserSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: 'Validation failed',
                    details: validationResult.error.issues,
                },
                { status: 400 }
            );
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id },
        });

        if (!existingUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const updateData: any = {};

        // Check email uniqueness if changing email
        if (
            validationResult.data.email &&
            validationResult.data.email !== existingUser.email
        ) {
            const emailExists = await prisma.user.findUnique({
                where: { email: validationResult.data.email },
            });

            if (emailExists) {
                return NextResponse.json(
                    { error: 'Email already exists' },
                    { status: 409 }
                );
            }
            updateData.email = validationResult.data.email;
        }

        // Hash password if provided
        if (validationResult.data.password) {
            updateData.password = await bcrypt.hash(
                validationResult.data.password,
                10
            );
        }

        // Add other fields
        if (validationResult.data.fullName)
            updateData.fullName = validationResult.data.fullName;
        if (validationResult.data.role)
            updateData.role = validationResult.data.role;
        if (validationResult.data.phone !== undefined)
            updateData.phone = validationResult.data.phone;
        if (validationResult.data.active !== undefined)
            updateData.active = validationResult.data.active;

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                email: true,
                username: true,
                fullName: true,
                role: true,
                phone: true,
                active: true,
                updatedAt: true,
            },
        });

        // Update warehouse assignment if provided
        if (validationResult.data.warehouseId !== undefined) {
            if (validationResult.data.warehouseId === null) {
                // Remove warehouse assignment
                await prisma.warehouse.updateMany({
                    where: { managerId: id },
                    data: { managerId: null },
                });
            } else {
                // Assign warehouse
                await prisma.warehouse.update({
                    where: { id: validationResult.data.warehouseId },
                    data: { managerId: id },
                });
            }
        }

        // Log activity
        try {
            await prisma.activity.create({
                data: {
                    userId: user.userId,
                    action: 'USER_UPDATED',
                    entity: 'User',
                    entityId: id,
                    details: `User ${updatedUser.fullName} updated by ${user.email}`,
                },
            });
        } catch (activityError) {
            console.error('Failed to log activity:', activityError);
        }

        return NextResponse.json({
            message: 'User updated successfully',
            user: updatedUser,
        });
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json(
            { error: 'Failed to update user' },
            { status: 500 }
        );
    }
}

// DELETE /api/users/[id] - Deactivate user (soft delete)
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Check authentication and role
        const authHeader = request.headers.get('authorization');
        const user = verifyAuthToken(authHeader || '');

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized - Please login' },
                { status: 401 }
            );
        }

        if (!isAdmin(user.role)) {
            return NextResponse.json(
                {
                    error: 'Forbidden - Only administrators can delete users',
                    required: 'ADMIN',
                    current: user.role,
                },
                { status: 403 }
            );
        }

        const { id } = params;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id },
        });

        if (!existingUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Prevent deleting yourself
        if (id === user.userId) {
            return NextResponse.json(
                { error: 'Cannot delete your own account' },
                { status: 400 }
            );
        }

        // Soft delete - deactivate user
        const deletedUser = await prisma.user.update({
            where: { id },
            data: { active: false },
            select: {
                id: true,
                email: true,
                fullName: true,
                active: true,
            },
        });

        // Log activity
        try {
            await prisma.activity.create({
                data: {
                    userId: user.userId,
                    action: 'USER_DELETED',
                    entity: 'User',
                    entityId: id,
                    details: `User ${deletedUser.fullName} deactivated by ${user.email}`,
                },
            });
        } catch (activityError) {
            console.error('Failed to log activity:', activityError);
        }

        return NextResponse.json({
            message: 'User deactivated successfully',
            user: deletedUser,
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json(
            { error: 'Failed to delete user' },
            { status: 500 }
        );
    }
}
