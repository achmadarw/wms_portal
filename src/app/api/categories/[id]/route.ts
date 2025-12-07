import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT, errorResponse, successResponse } from '@/lib/api-utils';

// GET /api/categories/[id] - Get single category
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = verifyJWT(request);
        if (!auth.authenticated) {
            return errorResponse(auth.error || 'Unauthorized', 401);
        }

        const { id } = await params;

        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                parent: true,
                children: {
                    include: {
                        children: true,
                        items: {
                            where: { active: true },
                        },
                    },
                },
                items: {
                    where: { active: true },
                    include: {
                        inventoryItems: {
                            include: {
                                warehouse: true,
                                bin: true,
                            },
                        },
                    },
                },
            },
        });

        if (!category) {
            return errorResponse('Category not found', 404);
        }

        return successResponse(category);
    } catch (error) {
        console.error('Error fetching category:', error);
        return errorResponse('Internal server error', 500);
    }
}

// PUT /api/categories/[id] - Update category
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = verifyJWT(request);
        if (!auth.authenticated) {
            return errorResponse(auth.error || 'Unauthorized', 401);
        }

        // Only ADMIN and SUPERVISOR can update categories
        if (auth.payload?.role === 'OPERATOR') {
            return errorResponse('Insufficient permissions', 403);
        }

        const { id } = await params;
        const body = await request.json();
        const { code, name, description, parentId, active } = body;

        // Check if category exists
        const existingCategory = await prisma.category.findUnique({
            where: { id },
        });

        if (!existingCategory) {
            return errorResponse('Category not found', 404);
        }

        // Check code uniqueness if code is being updated
        if (code && code !== existingCategory.code) {
            const codeExists = await prisma.category.findFirst({
                where: {
                    code,
                    id: { not: id },
                },
            });

            if (codeExists) {
                return errorResponse('Category code already exists', 409);
            }
        }

        // Validate parentId if provided
        if (parentId !== undefined && parentId !== null && parentId !== '') {
            // Cannot set self as parent
            if (parentId === id) {
                return errorResponse('Category cannot be its own parent', 400);
            }

            // Check if parent exists
            const parentCategory = await prisma.category.findUnique({
                where: { id: parentId },
            });

            if (!parentCategory) {
                return errorResponse('Parent category not found', 404);
            }

            // Check for circular reference (parent's parent cannot be this category)
            let currentParent = parentCategory;
            while (currentParent.parentId) {
                if (currentParent.parentId === id) {
                    return errorResponse(
                        'Circular category hierarchy detected',
                        400
                    );
                }
                const nextParent = await prisma.category.findUnique({
                    where: { id: currentParent.parentId },
                });
                if (!nextParent) break;
                currentParent = nextParent;
            }
        }

        // Update category
        const updatedCategory = await prisma.category.update({
            where: { id },
            data: {
                code: code ?? existingCategory.code,
                name: name ?? existingCategory.name,
                description: description ?? existingCategory.description,
                parentId:
                    parentId === ''
                        ? null
                        : parentId ?? existingCategory.parentId,
                active: active ?? existingCategory.active,
            },
            include: {
                parent: true,
                children: true,
            },
        });

        // Log activity
        await prisma.activity.create({
            data: {
                action: 'UPDATE_CATEGORY',
                entity: 'Category',
                entityId: updatedCategory.id,
                userId: auth.payload!.userId,
            },
        });

        return successResponse(updatedCategory);
    } catch (error) {
        console.error('Error updating category:', error);
        return errorResponse('Internal server error', 500);
    }
}

// DELETE /api/categories/[id] - Soft delete category
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = verifyJWT(request);
        if (!auth.authenticated) {
            return errorResponse(auth.error || 'Unauthorized', 401);
        }

        // Only ADMIN can delete categories
        if (auth.payload?.role !== 'ADMIN') {
            return errorResponse(
                'Insufficient permissions. Only ADMIN can delete categories.',
                403
            );
        }

        const { id } = await params;

        // Check if category exists
        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                items: {
                    where: { active: true },
                },
                children: {
                    where: { active: true },
                },
            },
        });

        if (!category) {
            return errorResponse('Category not found', 404);
        }

        // Check if category has active items
        if (category.items.length > 0) {
            return errorResponse(
                `Cannot delete category with ${category.items.length} active items. Please reassign items first.`,
                400
            );
        }

        // Check if category has active children
        if (category.children.length > 0) {
            return errorResponse(
                `Cannot delete category with ${category.children.length} active sub-categories. Please delete or reassign sub-categories first.`,
                400
            );
        }

        // Soft delete (set active = false)
        const deletedCategory = await prisma.category.update({
            where: { id },
            data: { active: false },
        });

        // Log activity
        await prisma.activity.create({
            data: {
                action: 'DELETE_CATEGORY',
                entity: 'Category',
                entityId: deletedCategory.id,
                userId: auth.payload!.userId,
            },
        });

        return successResponse({
            message: 'Category deleted successfully',
            category: deletedCategory,
        });
    } catch (error) {
        console.error('Error deleting category:', error);
        return errorResponse('Internal server error', 500);
    }
}
