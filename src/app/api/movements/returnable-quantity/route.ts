import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT, successResponse, errorResponse } from '@/lib/api-utils';

/**
 * GET /api/movements/returnable-quantity
 * Returns the maximum quantity that can be returned for a specific item
 * Based on OUTBOUND movements minus already RETURNED quantities
 */
export async function GET(request: NextRequest) {
    try {
        const auth = verifyJWT(request);
        if (!auth.authenticated) {
            return errorResponse(auth.error || 'Unauthorized', 401);
        }

        const { searchParams } = new URL(request.url);
        const itemId = searchParams.get('itemId'); // This is itemMasterId from frontend
        const warehouseId = searchParams.get('warehouseId');

        if (!itemId) {
            return errorResponse('Item ID is required', 400);
        }

        if (!warehouseId) {
            return errorResponse('Warehouse ID is required', 400);
        }

        // Get total OUTBOUND quantity for this itemMaster in this warehouse
        const totalOutbound = await prisma.movement.aggregate({
            where: {
                warehouseId,
                type: 'OUTBOUND',
                status: 'COMPLETED',
                item: {
                    itemMasterId: itemId, // Filter by itemMasterId through relation
                },
            },
            _sum: {
                quantity: true,
            },
        });

        // Get total RETURN quantity for this itemMaster in this warehouse
        const totalReturned = await prisma.movement.aggregate({
            where: {
                warehouseId,
                type: 'RETURN',
                status: 'COMPLETED',
                item: {
                    itemMasterId: itemId, // Filter by itemMasterId through relation
                },
            },
            _sum: {
                quantity: true,
            },
        });

        const outboundQty = totalOutbound._sum.quantity || 0;
        const returnedQty = totalReturned._sum.quantity || 0;
        const maxReturnable = Math.max(0, outboundQty - returnedQty);

        console.log('[RETURNABLE-QUANTITY] Calculation:', {
            itemMasterId: itemId,
            warehouseId,
            totalOutbound: outboundQty,
            totalReturned: returnedQty,
            maxReturnable,
        });

        return successResponse({
            maxReturnable,
            totalOutbound: outboundQty,
            totalReturned: returnedQty,
        });
    } catch (error) {
        console.error('GET returnable-quantity error:', error);
        return errorResponse('Internal server error', 500);
    }
}
