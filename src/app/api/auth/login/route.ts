import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, comparePassword, generateToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return errorResponse('Email and password are required', 400);
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return errorResponse('Invalid credentials', 401);
    }

    // Verify password
    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      return errorResponse('Invalid credentials', 401);
    }

    // Check if user is active
    if (!user.active) {
      return errorResponse('User account is inactive', 403);
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Log activity
    await prisma.activity.create({
      data: {
        action: 'LOGIN',
        entity: 'USER',
        entityId: user.id,
        userId: user.id,
      },
    });

    const { password: _, ...userWithoutPassword } = user;

    return successResponse({
      user: userWithoutPassword,
      token: {
        accessToken: token,
        expiresIn: 86400, // 24 hours
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('Internal server error', 500);
  }
}
