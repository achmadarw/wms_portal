import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT, successResponse, errorResponse } from '@/lib/api-utils';

// GET warehouse stock report
export async function GET(request: NextRequest) {
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

        const { searchParams } = new URL(request.url);
        const warehouseId = searchParams.get('warehouseId');

        if (!warehouseId) {
            return errorResponse('Warehouse ID is required', 400);
        }

        // Get current inventory data
        const inventory = await prisma.inventoryItem.findMany({
            where: { warehouseId },
            include: {
                itemMaster: true,
                bin: true,
            },
        });

        // Calculate report metrics
        const totalItems = inventory.length;
        const totalQty = inventory.reduce(
            (sum, item) => sum + item.quantity,
            0
        );
        const totalValue = inventory.reduce(
            (sum, item) =>
                sum + item.quantity * (item.itemMaster.unitCost || 0),
            0
        );

        // Store in database
        const report = await prisma.stockReport.create({
            data: {
                warehouseId,
                totalItems,
                totalQty,
                totalValue,
                details: JSON.stringify(inventory),
            },
        });

        return successResponse({
            report: {
                id: report.id,
                date: report.reportDate,
                totalItems,
                totalQty,
                totalValue,
                warehouse: warehouseId,
            },
            inventory,
        });
    } catch (error) {
        console.error('GET report error:', error);
        return errorResponse('Internal server error', 500);
    }
}
