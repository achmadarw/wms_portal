import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import Papa from 'papaparse';
import { verifyAuthToken, isAdmin } from '@/lib/auth';
import { sendUserRegistrationEmail } from '@/lib/email';

interface CSVRow {
    fullName: string;
    email: string;
    password: string;
    role: string;
    phone?: string;
    warehouseCode?: string;
}

// POST /api/users/bulk-import - Import users from CSV
export async function POST(request: NextRequest) {
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
                    error: 'Forbidden - Only administrators can import users',
                    required: 'ADMIN',
                    current: user.role,
                },
                { status: 403 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Check file type
        if (!file.name.endsWith('.csv')) {
            return NextResponse.json(
                { error: 'Invalid file type. Please upload a CSV file' },
                { status: 400 }
            );
        }

        // Read file content
        const content = await file.text();

        // Parse CSV
        const parseResult = Papa.parse<CSVRow>(content, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim(),
        });

        if (parseResult.errors.length > 0) {
            return NextResponse.json(
                {
                    error: 'Failed to parse CSV file',
                    details: parseResult.errors,
                },
                { status: 400 }
            );
        }

        const rows = parseResult.data;

        if (rows.length === 0) {
            return NextResponse.json(
                { error: 'CSV file is empty' },
                { status: 400 }
            );
        }

        // Validate CSV headers
        const requiredHeaders = ['fullName', 'email', 'password', 'role'];
        const headers = Object.keys(rows[0]);
        const missingHeaders = requiredHeaders.filter(
            (h) => !headers.includes(h)
        );

        if (missingHeaders.length > 0) {
            return NextResponse.json(
                {
                    error: 'Missing required columns in CSV',
                    missing: missingHeaders,
                    required: requiredHeaders,
                },
                { status: 400 }
            );
        }

        // Validate and prepare data
        const validationErrors: any[] = [];
        const validRows: CSVRow[] = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const errors: string[] = [];

            // Validate full name
            if (!row.fullName || row.fullName.trim().length < 3) {
                errors.push('Full name must be at least 3 characters');
            }

            // Validate email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!row.email || !emailRegex.test(row.email)) {
                errors.push('Invalid email address');
            }

            // Validate password
            if (!row.password || row.password.length < 6) {
                errors.push('Password must be at least 6 characters');
            }

            // Validate role
            if (!['ADMIN', 'SUPERVISOR', 'OPERATOR'].includes(row.role)) {
                errors.push('Role must be ADMIN, SUPERVISOR, or OPERATOR');
            }

            if (errors.length > 0) {
                validationErrors.push({
                    row: i + 2, // +2 because row 1 is header and index starts at 0
                    data: row,
                    errors,
                });
            } else {
                validRows.push(row);
            }
        }

        if (validationErrors.length > 0) {
            return NextResponse.json(
                {
                    error: 'Validation failed for some rows',
                    validationErrors,
                    validCount: validRows.length,
                    errorCount: validationErrors.length,
                },
                { status: 400 }
            );
        }

        // Check for duplicate emails in CSV
        const emails = validRows.map((r) => r.email);
        const duplicateEmails = emails.filter(
            (email, index) => emails.indexOf(email) !== index
        );

        if (duplicateEmails.length > 0) {
            return NextResponse.json(
                {
                    error: 'Duplicate emails found in CSV',
                    duplicates: [...new Set(duplicateEmails)],
                },
                { status: 400 }
            );
        }

        // Check for existing emails in database
        const existingUsers = await prisma.user.findMany({
            where: {
                email: { in: emails },
            },
            select: { email: true },
        });

        if (existingUsers.length > 0) {
            return NextResponse.json(
                {
                    error: 'Some emails already exist in the database',
                    existing: existingUsers.map((u) => u.email),
                },
                { status: 409 }
            );
        }

        // Get warehouses if needed
        const warehouseCodes = validRows
            .map((r) => r.warehouseCode)
            .filter((code) => code);
        const warehouses =
            warehouseCodes.length > 0
                ? await prisma.warehouse.findMany({
                      where: {
                          code: { in: warehouseCodes as string[] },
                      },
                      select: { id: true, code: true },
                  })
                : [];

        const warehouseMap = new Map(warehouses.map((w) => [w.code, w.id]));

        // Create users
        const results = {
            success: [] as any[],
            failed: [] as any[],
        };

        for (const row of validRows) {
            try {
                // Generate username
                const username =
                    row.email.split('@')[0] +
                    '_' +
                    Math.random().toString(36).substring(7);

                // Hash password
                const hashedPassword = await bcrypt.hash(row.password, 10);

                // Get warehouse ID if provided
                const warehouseId = row.warehouseCode
                    ? warehouseMap.get(row.warehouseCode)
                    : undefined;

                // Create user
                const newUser = await prisma.user.create({
                    data: {
                        email: row.email,
                        username,
                        password: hashedPassword,
                        fullName: row.fullName,
                        role: row.role,
                        phone: row.phone || null,
                        active: true,
                    },
                    select: {
                        id: true,
                        email: true,
                        username: true,
                        fullName: true,
                        role: true,
                    },
                });

                // Assign warehouse if provided
                if (warehouseId) {
                    await prisma.warehouse.update({
                        where: { id: warehouseId },
                        data: { managerId: newUser.id },
                    });
                }

                // Send welcome email
                try {
                    await sendUserRegistrationEmail({
                        fullName: newUser.fullName,
                        email: newUser.email,
                        username: newUser.username,
                        role: newUser.role,
                    });
                } catch (emailError) {
                    console.error(
                        `[EMAIL] Failed to send email to ${newUser.email}:`,
                        emailError
                    );
                }

                results.success.push({
                    email: newUser.email,
                    username: newUser.username,
                    fullName: newUser.fullName,
                });
            } catch (error) {
                results.failed.push({
                    email: row.email,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Unknown error',
                });
            }
        }

        // Log activity
        try {
            await prisma.activity.create({
                data: {
                    userId: user.userId,
                    action: 'USERS_BULK_IMPORT',
                    entity: 'User',
                    entityId: user.userId,
                    details: `Bulk imported ${results.success.length} users (${results.failed.length} failed) by ${user.email}`,
                },
            });
        } catch (activityError) {
            console.error('Failed to log activity:', activityError);
        }

        return NextResponse.json({
            message: 'Bulk import completed',
            summary: {
                total: validRows.length,
                success: results.success.length,
                failed: results.failed.length,
            },
            results,
        });
    } catch (error) {
        console.error('Error importing users:', error);
        return NextResponse.json(
            { error: 'Failed to import users' },
            { status: 500 }
        );
    }
}
