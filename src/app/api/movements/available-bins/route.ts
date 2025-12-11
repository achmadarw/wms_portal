import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT, successResponse, errorResponse } from '@/lib/api-utils';

/**
 * GET /api/movements/available-bins
 * Returns warehouses and bins that have stock for a specific item
 * Query params:
 * - itemId: The item master ID (required)
 * - movementType: The movement type (required)
 */
export async function GET(request: NextRequest) {
    try {
        const auth = verifyJWT(request);
        if (!auth.authenticated) {
            return errorResponse(auth.error || 'Unauthorized', 401);
        }

        const { searchParams } = new URL(request.url);
        const itemId = searchParams.get('itemId');
        const movementType = searchParams.get('type');

        if (!itemId) {
            return errorResponse('Item ID is required', 400);
        }

        if (!movementType) {
            return errorResponse('Movement type is required', 400);
        }

        // For INBOUND and RETURN, return all warehouses and bins
        if (movementType === 'INBOUND' || movementType === 'RETURN') {
            const warehouses = await prisma.warehouse.findMany({
                where: { active: true },
                include: {
                    bins: {
                        where: { active: true },
                        select: {
                            id: true,
                            code: true,
                            name: true,
                            row: true,
                            column: true,
                            level: true,
                        },
                        orderBy: { code: 'asc' },
                    },
                },
                orderBy: { name: 'asc' },
            });

            return successResponse({ warehouses });
        }

        // For OUTBOUND, TRANSFER, ADJUSTMENT, DAMAGE, RETURN - only show warehouses/bins with stock
        const inventoryItems = await prisma.inventoryItem.findMany({
            where: {
                itemMasterId: itemId,
                availableQty: { gt: 0 },
                warehouse: { active: true },
            },
            select: {
                id: true,
                warehouseId: true,
                binId: true,
                availableQty: true,
                warehouse: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        address: true,
                    },
                },
            },
        });

        // Group by warehouse and get bins with stock
        const warehouseMap = new Map<string, any>();

        for (const inv of inventoryItems) {
            const warehouseId = inv.warehouseId;

            if (!warehouseMap.has(warehouseId)) {
                warehouseMap.set(warehouseId, {
                    ...inv.warehouse,
                    bins: [],
                });
            }

            const warehouse = warehouseMap.get(warehouseId);

            // Get the bin information
            if (inv.binId) {
                const bin = await prisma.bin.findUnique({
                    where: { id: inv.binId },
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        row: true,
                        column: true,
                        level: true,
                    },
                });
                if (bin && !warehouse.bins.find((b: any) => b.id === bin.id)) {
                    warehouse.bins.push({
                        ...bin,
                        availableQty: inv.availableQty,
                    });
                }
            }
        }

        const warehouses = Array.from(warehouseMap.values()).map((wh) => ({
            ...wh,
            bins: wh.bins.sort((a: any, b: any) =>
                a.code.localeCompare(b.code)
            ),
        }));

        return successResponse({ warehouses });
    } catch (error) {
        console.error('GET available-bins error:', error);
        return errorResponse('Internal server error', 500);
    }
}
