import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT, errorResponse, successResponse } from '@/lib/api-utils';

// GET /api/categories - List all categories
export async function GET(request: NextRequest) {
    try {
        const auth = verifyJWT(request);
        if (!auth.authenticated) {
            return errorResponse(auth.error || 'Unauthorized', 401);
        }

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const parentId = searchParams.get('parentId');
        const active = searchParams.get('active');

        // Build where clause
        const where: any = {};

        if (parentId === 'null') {
            where.parentId = null; // Top-level categories
        } else if (parentId) {
            where.parentId = parentId;
        }

        if (active !== null && active !== undefined) {
            where.active = active === 'true';
        }

        const categories = await prisma.category.findMany({
            where,
            include: {
                parent: true,
                children: {
                    where: { active: true },
                    include: {
                        children: {
                            include: {
                                children: true,
                                items: {
                                    select: {
                                        id: true,
                                    },
                                },
                            },
                        },
                        items: {
                            select: {
                                id: true,
                            },
                        },
                    },
                },
                items: {
                    select: {
                        id: true,
                        name: true,
                        sku: true,
                    },
                },
            },
            orderBy: [{ code: 'asc' }],
        });

        // Recursive function to add itemCount to all levels
        const addItemCount = (cat: any): any => {
            const itemCount = cat.items?.length || 0;
            const children =
                cat.children?.map((child: any) => addItemCount(child)) || [];
            return {
                ...cat,
                itemCount,
                children,
            };
        };

        // Calculate item count for each category recursively
        const categoriesWithCount = categories.map((cat) => addItemCount(cat));

        return successResponse(categoriesWithCount);
    } catch (error) {
        console.error('Error fetching categories:', error);
        return errorResponse('Internal server error', 500);
    }
}

// POST /api/categories - Create new category
export async function POST(request: NextRequest) {
    try {
        const auth = verifyJWT(request);
        if (!auth.authenticated) {
            return errorResponse(auth.error || 'Unauthorized', 401);
        }

        // Only ADMIN and SUPERVISOR can create categories
        if (auth.payload?.role === 'OPERATOR') {
            return errorResponse('Insufficient permissions', 403);
        }

        const body = await request.json();
        const { code, name, description, parentId } = body;

        // Validate required fields
        if (!code || !name) {
            return errorResponse('Code and name are required', 400);
        }

        // Check if code already exists
        const existingCategory = await prisma.category.findUnique({
            where: { code },
        });

        if (existingCategory) {
            return errorResponse('Category code already exists', 409);
        }

        // If parentId provided, verify parent exists
        if (parentId) {
            const parentCategory = await prisma.category.findUnique({
                where: { id: parentId },
            });

            if (!parentCategory) {
                return errorResponse('Parent category not found', 404);
            }
        }

        // Create category
        const category = await prisma.category.create({
            data: {
                code,
                name,
                description,
                parentId: parentId || null,
            },
            include: {
                parent: true,
                children: true,
            },
        });

        // Log activity
        await prisma.activity.create({
            data: {
                action: 'CREATE_CATEGORY',
                entity: 'Category',
                entityId: category.id,
                userId: auth.payload!.userId,
            },
        });

        return successResponse(category, 201);
    } catch (error) {
        console.error('Error creating category:', error);
        return errorResponse('Internal server error', 500);
    }
}
