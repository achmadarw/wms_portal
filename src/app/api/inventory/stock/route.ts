import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT, successResponse, errorResponse } from '@/lib/api-utils';

// GET warehouse inventory
export async function GET(request: NextRequest) {
    try {
        const auth = verifyJWT(request);
        if (!auth.authenticated) {
            return errorResponse(auth.error || 'Unauthorized', 401);
        }

        const { searchParams } = new URL(request.url);
        const warehouseId = searchParams.get('warehouseId');

        if (!warehouseId) {
            return errorResponse('Warehouse ID is required', 400);
        }

        const inventory = await prisma.inventoryItem.findMany({
            where: { warehouseId },
            include: {
                itemMaster: true,
                bin: true,
            },
        });

        return successResponse({ inventory });
    } catch (error) {
        console.error('GET inventory error:', error);
        return errorResponse('Internal server error', 500);
    }
}

// ADD/UPDATE inventory
export async function POST(request: NextRequest) {
    try {
        const auth = verifyJWT(request);
        if (!auth.authenticated) {
            return errorResponse(auth.error || 'Unauthorized', 401);
        }

        if (
            auth.payload?.role !== 'ADMIN' &&
            auth.payload?.role !== 'SUPERVISOR'
        ) {
            return errorResponse('Insufficient permissions', 403);
        }

        const { itemMasterId, warehouseId, quantity, binId } =
            await request.json();

        if (!itemMasterId || !warehouseId || quantity === undefined) {
            return errorResponse(
                'Item ID, warehouse ID, and quantity are required',
                400
            );
        }

        // Check if inventory item exists
        const existingItem = await prisma.inventoryItem.findFirst({
            where: {
                itemMasterId,
                warehouseId,
                binId: binId || null,
            },
        });

        let inventoryItem;
        if (existingItem) {
            inventoryItem = await prisma.inventoryItem.update({
                where: { id: existingItem.id },
                data: { quantity },
            });
        } else {
            inventoryItem = await prisma.inventoryItem.create({
                data: {
                    itemMasterId,
                    warehouseId,
                    binId,
                    quantity,
                },
            });
        }

        return successResponse({ inventoryItem }, 201);
    } catch (error) {
        console.error('POST inventory error:', error);
        return errorResponse('Internal server error', 500);
    }
}
