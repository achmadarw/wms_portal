import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
    try {
        const { email, username, password, fullName, role } =
            await request.json();

        if (!email || !username || !password || !fullName) {
            return errorResponse('All fields are required', 400);
        }

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { username }],
            },
        });

        if (existingUser) {
            return errorResponse('Email or username already exists', 409);
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create new user
        const newUser = await prisma.user.create({
            data: {
                email,
                username,
                password: hashedPassword,
                fullName,
                role: role || 'OPERATOR',
                active: true,
            },
        });

        // Log activity
        await prisma.activity.create({
            data: {
                action: 'CREATE_USER',
                entity: 'USER',
                entityId: newUser.id,
                userId: newUser.id,
            },
        });

        const { password: _, ...userWithoutPassword } = newUser;

        return successResponse(
            {
                user: userWithoutPassword,
                message: 'User registered successfully',
            },
            201
        );
    } catch (error) {
        console.error('Register error:', error);
        return errorResponse('Internal server error', 500);
    }
}
