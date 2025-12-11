import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT, successResponse, errorResponse } from '@/lib/api-utils';

/**
 * GET /api/inventory/check-stock
 * Check available stock for a specific item in a warehouse/bin
 * Query params:
 * - itemId: The item master ID (required)
 * - warehouseId: The warehouse ID (required)
 * - binCode: The bin code (optional, if not provided returns warehouse total)
 */
export async function GET(request: NextRequest) {
    try {
        const auth = verifyJWT(request);
        if (!auth.authenticated) {
            return errorResponse(auth.error || 'Unauthorized', 401);
        }

        const { searchParams } = new URL(request.url);
        const itemId = searchParams.get('itemId');
        const warehouseId = searchParams.get('warehouseId');
        const binCode = searchParams.get('binCode');

        if (!itemId || !warehouseId) {
            return errorResponse('Item ID and Warehouse ID are required', 400);
        }

        // If binCode is provided, find the specific bin
        let binId: string | null = null;
        if (binCode) {
            const bin = await prisma.bin.findFirst({
                where: {
                    code: binCode,
                    warehouseId: warehouseId,
                },
            });

            if (!bin) {
                return errorResponse('Bin not found', 404);
            }

            binId = bin.id;
        }

        // If no binCode, get total stock across all bins in warehouse
        if (!binCode) {
            const inventoryItems = await prisma.inventoryItem.findMany({
                where: {
                    itemMasterId: itemId,
                    warehouseId: warehouseId,
                },
                include: {
                    itemMaster: {
                        select: {
                            sku: true,
                            name: true,
                            unitOfMeasure: true,
                        },
                    },
                    warehouse: {
                        select: {
                            name: true,
                            code: true,
                        },
                    },
                },
            });

            if (inventoryItems.length === 0) {
                return successResponse({
                    found: false,
                    availableQty: 0,
                    quantity: 0,
                    reservedQty: 0,
                    message:
                        'No inventory found for this item in the specified warehouse',
                });
            }

            // Sum up all quantities across bins
            const totalQty = inventoryItems.reduce(
                (sum, item) => sum + item.quantity,
                0
            );
            const totalAvailableQty = inventoryItems.reduce(
                (sum, item) => sum + item.availableQty,
                0
            );
            const totalReservedQty = inventoryItems.reduce(
                (sum, item) => sum + item.reservedQty,
                0
            );

            return successResponse({
                found: true,
                availableQty: totalAvailableQty,
                quantity: totalQty,
                reservedQty: totalReservedQty,
                item: inventoryItems[0].itemMaster,
                warehouse: inventoryItems[0].warehouse,
                totalBins: inventoryItems.length,
                message: `Total stock across ${inventoryItems.length} bin(s)`,
            });
        }

        // Find inventory item for specific bin
        const inventoryItem = await prisma.inventoryItem.findFirst({
            where: {
                itemMasterId: itemId,
                warehouseId: warehouseId,
                ...(binId && { binId: binId }),
            },
            include: {
                itemMaster: {
                    select: {
                        sku: true,
                        name: true,
                        unitOfMeasure: true,
                    },
                },
                warehouse: {
                    select: {
                        name: true,
                        code: true,
                    },
                },
                bin: {
                    select: {
                        code: true,
                        name: true,
                    },
                },
            },
        });

        if (!inventoryItem) {
            return successResponse({
                found: false,
                availableQty: 0,
                quantity: 0,
                reservedQty: 0,
                message:
                    'No inventory found for this item in the specified location',
            });
        }

        return successResponse({
            found: true,
            availableQty: inventoryItem.availableQty,
            quantity: inventoryItem.quantity,
            reservedQty: inventoryItem.reservedQty,
            item: inventoryItem.itemMaster,
            warehouse: inventoryItem.warehouse,
            bin: inventoryItem.bin,
        });
    } catch (error) {
        console.error('GET check-stock error:', error);
        return errorResponse('Internal server error', 500);
    }
}
