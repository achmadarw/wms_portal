import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT, successResponse, errorResponse } from '@/lib/api-utils';

// POST /api/inventory/stock/adjust - Adjust stock quantity
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
            type, // 'ADD' or 'REMOVE'
            reason,
            batchNumber,
            expiryDate,
        } = await request.json();

        if (!itemMasterId || !warehouseId || !quantity || !type) {
            return errorResponse('Missing required fields', 400);
        }

        const quantityChange =
            type === 'ADD' ? Math.abs(quantity) : -Math.abs(quantity);

        // Find or create inventory item
        let inventoryItem = await prisma.inventoryItem.findFirst({
            where: {
                itemMasterId,
                warehouseId,
                binId: binId || null,
            },
        });

        if (!inventoryItem) {
            if (type === 'REMOVE') {
                return errorResponse(
                    'Cannot remove from non-existent inventory',
                    400
                );
            }

            inventoryItem = await prisma.inventoryItem.create({
                data: {
                    itemMasterId,
                    warehouseId,
                    binId,
                    quantity: quantityChange,
                    availableQty: quantityChange,
                    batchNumber,
                    expiryDate: expiryDate ? new Date(expiryDate) : null,
                },
            });
        } else {
            const newQuantity = inventoryItem.quantity + quantityChange;

            if (newQuantity < 0) {
                return errorResponse('Insufficient stock', 400);
            }

            inventoryItem = await prisma.inventoryItem.update({
                where: { id: inventoryItem.id },
                data: {
                    quantity: newQuantity,
                    availableQty: Math.max(
                        0,
                        inventoryItem.availableQty + quantityChange
                    ),
                },
            });
        }

        // Create movement record
        const referenceNo = `ADJ-${Date.now()}`;
        const movement = await prisma.movement.create({
            data: {
                referenceNo,
                type: 'ADJUSTMENT',
                quantity: Math.abs(quantity),
                notes: reason || `Stock ${type.toLowerCase()}`,
                status: 'COMPLETED',
                itemId: inventoryItem.id,
                warehouseId,
                createdById: auth.payload.userId,
            },
        });

        // Log activity
        await prisma.activity.create({
            data: {
                action: 'STOCK_ADJUSTMENT',
                entity: 'INVENTORY',
                entityId: inventoryItem.id,
                details: JSON.stringify({ type, quantity, reason }),
                userId: auth.payload.userId,
            },
        });

        return successResponse({ inventoryItem, movement }, 201);
    } catch (error) {
        console.error('POST stock adjust error:', error);
        return errorResponse('Internal server error', 500);
    }
}
