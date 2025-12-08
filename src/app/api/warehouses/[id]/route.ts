import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT, successResponse, errorResponse } from '@/lib/api-utils';

// GET single warehouse by ID
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

        const warehouse = await prisma.warehouse.findUnique({
            where: { id },
            include: {
                bins: true,
                manager: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true,
                        email: true,
                    },
                },
            },
        });

        if (!warehouse) {
            return errorResponse('Warehouse not found', 404);
        }

        return successResponse({ warehouse });
    } catch (error) {
        console.error('GET warehouse error:', error);
        return errorResponse('Internal server error', 500);
    }
}

// UPDATE warehouse
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = verifyJWT(request);
        if (!auth.authenticated) {
            return errorResponse(auth.error || 'Unauthorized', 401);
        }

        // Check permissions: ADMIN can edit all, SUPERVISOR can edit assigned warehouse
        if (
            auth.payload?.role !== 'ADMIN' &&
            auth.payload?.role !== 'SUPERVISOR'
        ) {
            return errorResponse('Insufficient permissions', 403);
        }

        const { id } = await params;

        const {
            code,
            name,
            description,
            address,
            city,
            state,
            zipCode,
            country,
            managerId,
        } = await request.json();

        if (
            !code ||
            !name ||
            !address ||
            !city ||
            !state ||
            !zipCode ||
            !country
        ) {
            return errorResponse('All required fields must be provided', 400);
        }

        // Check if warehouse exists
        const existingWarehouse = await prisma.warehouse.findUnique({
            where: { id },
        });

        if (!existingWarehouse) {
            return errorResponse('Warehouse not found', 404);
        }

        // If SUPERVISOR, verify they can only edit their assigned warehouse
        if (auth.payload?.role === 'SUPERVISOR') {
            const user = await prisma.user.findUnique({
                where: { id: auth.payload.userId },
            });

            if (user?.warehouseId !== id) {
                return errorResponse(
                    'You can only edit your assigned warehouse',
                    403
                );
            }
        }

        // Check if code is being changed and if new code already exists
        if (code !== existingWarehouse.code) {
            const codeExists = await prisma.warehouse.findUnique({
                where: { code },
            });

            if (codeExists) {
                return errorResponse('Warehouse code already exists', 409);
            }
        }

        // Check if managerId is being changed and if it's already assigned to another warehouse
        if (managerId && managerId !== existingWarehouse.managerId) {
            const managerExists = await prisma.warehouse.findFirst({
                where: {
                    managerId,
                    id: { not: id }, // Exclude current warehouse
                },
            });

            if (managerExists) {
                const manager = await prisma.user.findUnique({
                    where: { id: managerId },
                    select: { fullName: true },
                });
                return errorResponse(
                    `Manager already assigned to warehouse "${managerExists.name}". A user can only manage one warehouse.`,
                    409
                );
            }
        }

        const updatedWarehouse = await prisma.warehouse.update({
            where: { id },
            data: {
                code,
                name,
                description,
                address,
                city,
                state,
                zipCode,
                country,
                managerId: managerId || null,
            },
            include: {
                bins: true,
                manager: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true,
                        email: true,
                    },
                },
            },
        });

        // Log activity
        await prisma.activity.create({
            data: {
                action: 'UPDATE_WAREHOUSE',
                entity: 'WAREHOUSE',
                entityId: updatedWarehouse.id,
                userId: auth.payload.userId,
                details: `Updated warehouse: ${updatedWarehouse.name}`,
            },
        });

        return successResponse({
            warehouse: updatedWarehouse,
            message: 'Warehouse updated successfully',
        });
    } catch (error) {
        console.error('UPDATE warehouse error:', error);
        return errorResponse('Internal server error', 500);
    }
}

// DELETE warehouse (soft delete - set active to false)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = verifyJWT(request);
        if (!auth.authenticated) {
            return errorResponse(auth.error || 'Unauthorized', 401);
        }

        // Only ADMIN can delete warehouses
        if (auth.payload?.role !== 'ADMIN') {
            return errorResponse('Insufficient permissions', 403);
        }

        const { id } = await params;

        const warehouse = await prisma.warehouse.findUnique({
            where: { id },
            include: {
                bins: true,
            },
        });

        if (!warehouse) {
            return errorResponse('Warehouse not found', 404);
        }

        // Check if warehouse has bins
        if (warehouse.bins && warehouse.bins.length > 0) {
            return errorResponse(
                'Cannot delete warehouse with existing bins. Please remove all bins first.',
                400
            );
        }

        // Soft delete - set active to false
        const deletedWarehouse = await prisma.warehouse.update({
            where: { id },
            data: { active: false },
        });

        // Log activity
        await prisma.activity.create({
            data: {
                action: 'DELETE_WAREHOUSE',
                entity: 'WAREHOUSE',
                entityId: deletedWarehouse.id,
                userId: auth.payload.userId,
                details: `Deleted warehouse: ${deletedWarehouse.name}`,
            },
        });

        return successResponse({
            message: 'Warehouse deleted successfully',
        });
    } catch (error) {
        console.error('DELETE warehouse error:', error);
        return errorResponse('Internal server error', 500);
    }
}
