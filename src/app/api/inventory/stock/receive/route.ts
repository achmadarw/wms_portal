import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT, successResponse, errorResponse } from '@/lib/api-utils';

// POST /api/inventory/stock/receive - Receive new stock (inbound)
export async function POST(request: NextRequest) {
    try {
        const auth = verifyJWT(request);
        if (!auth.authenticated) {
            return errorResponse(auth.error || 'Unauthorized', 401);
        }

        const {
            itemMasterId,
            warehouseId,
            binId,
            quantity,
            batchNumber,
            expiryDate,
            manufacturingDate,
            notes,
        } = await request.json();

        if (!itemMasterId || !warehouseId || !quantity) {
            return errorResponse('Missing required fields', 400);
        }

        if (quantity <= 0) {
            return errorResponse('Quantity must be positive', 400);
        }

        // Find or create inventory item
        let inventoryItem = await prisma.inventoryItem.findFirst({
            where: {
                itemMasterId,
                warehouseId,
                binId: binId || null,
                batchNumber: batchNumber || null,
            },
        });

        if (!inventoryItem) {
            inventoryItem = await prisma.inventoryItem.create({
                data: {
                    itemMasterId,
                    warehouseId,
                    binId,
                    quantity: parseInt(quantity),
                    availableQty: parseInt(quantity),
                    batchNumber,
                    expiryDate: expiryDate ? new Date(expiryDate) : null,
                    manufacturingDate: manufacturingDate
                        ? new Date(manufacturingDate)
                        : null,
                },
            });
        } else {
            inventoryItem = await prisma.inventoryItem.update({
                where: { id: inventoryItem.id },
                data: {
                    quantity: inventoryItem.quantity + parseInt(quantity),
                    availableQty:
                        inventoryItem.availableQty + parseInt(quantity),
                },
            });
        }

        // Create movement record
        const referenceNo = `IN-${Date.now()}`;
        const movement = await prisma.movement.create({
            data: {
                referenceNo,
                type: 'INBOUND',
                quantity: parseInt(quantity),
                notes: notes || 'Stock received',
                status: 'COMPLETED',
                toBin: binId || null,
                itemId: inventoryItem.id,
                warehouseId,
                createdById: auth.payload.userId,
            },
        });

        // Get item details
        const itemMaster = await prisma.itemMaster.findUnique({
            where: { id: itemMasterId },
        });

        // Log activity
        await prisma.activity.create({
            data: {
                action: 'RECEIVE_STOCK',
                entity: 'INVENTORY',
                entityId: inventoryItem.id,
                details: JSON.stringify({
                    item: itemMaster?.name,
                    quantity,
                    batchNumber,
                }),
                userId: auth.payload.userId,
            },
        });

        return successResponse(
            {
                inventoryItem,
                movement,
                itemMaster,
            },
            201
        );
    } catch (error) {
        console.error('POST stock receive error:', error);
        return errorResponse('Internal server error', 500);
    }
}
