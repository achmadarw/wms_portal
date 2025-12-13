import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT, successResponse, errorResponse } from '@/lib/api-utils';

/**
 * GET /api/movements/available-items
 * Returns items filtered by movement type:
 * - For INBOUND/RETURN: Returns all active items from ItemMaster
 * - For other types: Returns only items that exist in inventory with stock > 0
 */
export async function GET(request: NextRequest) {
    try {
        const auth = verifyJWT(request);
        if (!auth.authenticated) {
            return errorResponse(auth.error || 'Unauthorized', 401);
        }

        const { searchParams } = new URL(request.url);
        const movementType = searchParams.get('type');
        const search = searchParams.get('search');

        if (!movementType) {
            return errorResponse('Movement type is required', 400);
        }

        // For INBOUND and RETURN, show all items
        if (movementType === 'INBOUND') {
            const where: any = { active: true };

            if (search) {
                where.OR = [
                    { sku: { contains: search } },
                    { name: { contains: search } },
                    { barcode: { contains: search } },
                ];
            }

            const items = await prisma.itemMaster.findMany({
                where,
                select: {
                    id: true,
                    sku: true,
                    name: true,
                    barcode: true,
                    unitOfMeasure: true,
                    category: {
                        select: {
                            name: true,
                        },
                    },
                },
                orderBy: { name: 'asc' },
            });

            return successResponse({ items });
        }

        // For RETURN, only show items that have been OUTBOUNDed
        if (movementType === 'RETURN') {
            const whereItemMaster: any = { active: true };

            if (search) {
                whereItemMaster.OR = [
                    { sku: { contains: search } },
                    { name: { contains: search } },
                    { barcode: { contains: search } },
                ];
            }

            // Get items that have completed OUTBOUND movements
            const outboundMovements = await prisma.movement.findMany({
                where: {
                    type: 'OUTBOUND',
                    status: 'COMPLETED',
                    item: {
                        itemMaster: whereItemMaster,
                    },
                },
                select: {
                    item: {
                        select: {
                            itemMasterId: true,
                            itemMaster: {
                                select: {
                                    id: true,
                                    sku: true,
                                    name: true,
                                    barcode: true,
                                    unitOfMeasure: true,
                                    category: {
                                        select: {
                                            name: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                distinct: ['itemId'],
            });

            // Extract unique items
            const items = outboundMovements
                .map((mov) => mov.item.itemMaster)
                .filter(
                    (item, index, self) =>
                        index === self.findIndex((t) => t.id === item.id)
                );

            return successResponse({ items });
        }

        // For OUTBOUND, TRANSFER, ADJUSTMENT, DAMAGE - only show items with inventory
        // Get distinct items that have inventory with availableQty > 0
        const whereItemMaster: any = { active: true };

        if (search) {
            whereItemMaster.OR = [
                { sku: { contains: search } },
                { name: { contains: search } },
                { barcode: { contains: search } },
            ];
        }

        const inventoryItems = await prisma.inventoryItem.findMany({
            where: {
                availableQty: { gt: 0 },
                itemMaster: whereItemMaster,
            },
            select: {
                itemMasterId: true,
                itemMaster: {
                    select: {
                        id: true,
                        sku: true,
                        name: true,
                        barcode: true,
                        unitOfMeasure: true,
                        category: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
            distinct: ['itemMasterId'],
        });

        // Extract unique items
        const items = inventoryItems
            .map((inv) => inv.itemMaster)
            .filter(
                (item, index, self) =>
                    index === self.findIndex((t) => t.id === item.id)
            );

        return successResponse({ items });
    } catch (error) {
        console.error('GET available-items error:', error);
        return errorResponse('Internal server error', 500);
    }
}
