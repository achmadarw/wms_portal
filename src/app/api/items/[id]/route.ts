import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT, successResponse, errorResponse } from '@/lib/api-utils';

// GET single item
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const auth = verifyJWT(request);
        if (!auth.authenticated) {
            return errorResponse(auth.error || 'Unauthorized', 401);
        }

        const item = await prisma.itemMaster.findUnique({
            where: { id: params.id },
            include: {
                category: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
                inventoryItems: {
                    include: {
                        warehouse: true,
                        bin: true,
                    },
                },
            },
        });

        if (!item) {
            return errorResponse('Item not found', 404);
        }

        return successResponse({ item });
    } catch (error) {
        console.error('GET item error:', error);
        return errorResponse('Internal server error', 500);
    }
}

// UPDATE item
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const auth = verifyJWT(request);
        if (!auth.authenticated) {
            return errorResponse(auth.error || 'Unauthorized', 401);
        }

        if (auth.payload?.role === 'OPERATOR') {
            return errorResponse('Insufficient permissions', 403);
        }

        const {
            sku,
            barcode,
            name,
            description,
            categoryId,
            unitOfMeasure,
            weight,
            dimensions,
            unitCost,
            sellingPrice,
            minStockLevel,
            maxStockLevel,
            reorderPoint,
            reorderQty,
            manufacturer,
            supplier,
            imageUrl,
        } = await request.json();

        // Check if item exists
        const existingItem = await prisma.itemMaster.findUnique({
            where: { id: params.id },
        });

        if (!existingItem) {
            return errorResponse('Item not found', 404);
        }

        // Check SKU uniqueness (excluding current item)
        if (sku && sku !== existingItem.sku) {
            const duplicateSKU = await prisma.itemMaster.findFirst({
                where: {
                    sku,
                    id: { not: params.id },
                },
            });

            if (duplicateSKU) {
                return errorResponse('SKU already exists', 409);
            }
        }

        // Check barcode uniqueness (excluding current item)
        if (barcode && barcode !== existingItem.barcode) {
            const duplicateBarcode = await prisma.itemMaster.findFirst({
                where: {
                    barcode,
                    id: { not: params.id },
                },
            });

            if (duplicateBarcode) {
                return errorResponse('Barcode already exists', 409);
            }
        }

        const updatedItem = await prisma.itemMaster.update({
            where: { id: params.id },
            data: {
                sku: sku || existingItem.sku,
                barcode: barcode || existingItem.barcode,
                name: name || existingItem.name,
                description: description ?? existingItem.description,
                categoryId: categoryId ?? existingItem.categoryId,
                unitOfMeasure: unitOfMeasure || existingItem.unitOfMeasure,
                weight:
                    weight !== undefined
                        ? parseFloat(weight)
                        : existingItem.weight,
                dimensions: dimensions ?? existingItem.dimensions,
                unitCost:
                    unitCost !== undefined
                        ? parseFloat(unitCost)
                        : existingItem.unitCost,
                sellingPrice:
                    sellingPrice !== undefined
                        ? parseFloat(sellingPrice)
                        : existingItem.sellingPrice,
                minStockLevel:
                    minStockLevel !== undefined
                        ? parseInt(minStockLevel)
                        : existingItem.minStockLevel,
                maxStockLevel:
                    maxStockLevel !== undefined
                        ? parseInt(maxStockLevel)
                        : existingItem.maxStockLevel,
                reorderPoint:
                    reorderPoint !== undefined
                        ? parseInt(reorderPoint)
                        : existingItem.reorderPoint,
                reorderQty:
                    reorderQty !== undefined
                        ? parseInt(reorderQty)
                        : existingItem.reorderQty,
                manufacturer: manufacturer ?? existingItem.manufacturer,
                supplier: supplier ?? existingItem.supplier,
                imageUrl: imageUrl ?? existingItem.imageUrl,
            },
        });

        // Log activity
        await prisma.activity.create({
            data: {
                action: 'UPDATE_ITEM',
                entity: 'ITEM_MASTER',
                entityId: updatedItem.id,
                userId: auth.payload.userId,
            },
        });

        return successResponse({ item: updatedItem });
    } catch (error) {
        console.error('PUT item error:', error);
        return errorResponse('Internal server error', 500);
    }
}

// DELETE item (soft delete)
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const auth = verifyJWT(request);
        if (!auth.authenticated) {
            return errorResponse(auth.error || 'Unauthorized', 401);
        }

        if (auth.payload?.role !== 'ADMIN') {
            return errorResponse('Only admins can delete items', 403);
        }

        // Check if item exists
        const existingItem = await prisma.itemMaster.findUnique({
            where: { id: params.id },
            include: {
                inventoryItems: true,
            },
        });

        if (!existingItem) {
            return errorResponse('Item not found', 404);
        }

        // Check if item has inventory
        const hasInventory = existingItem.inventoryItems.some(
            (inv) => inv.quantity > 0
        );

        if (hasInventory) {
            return errorResponse(
                'Cannot delete item with existing inventory. Please adjust stock to zero first.',
                400
            );
        }

        // Soft delete
        const deletedItem = await prisma.itemMaster.update({
            where: { id: params.id },
            data: { active: false },
        });

        // Log activity
        await prisma.activity.create({
            data: {
                action: 'DELETE_ITEM',
                entity: 'ITEM_MASTER',
                entityId: deletedItem.id,
                userId: auth.payload.userId,
            },
        });

        return successResponse({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error('DELETE item error:', error);
        return errorResponse('Internal server error', 500);
    }
}
