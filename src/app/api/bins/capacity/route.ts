import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';

/**
 * GET /api/bins/capacity
 * Get bin capacity information including pending movements
 */
export async function GET(request: NextRequest) {
    try {
        // Verify authentication
        const user = await verifyJWT(request);
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const binCode = searchParams.get('binCode');
        const warehouseId = searchParams.get('warehouseId');

        if (!binCode || !warehouseId) {
            return NextResponse.json(
                { error: 'binCode and warehouseId are required' },
                { status: 400 }
            );
        }

        // Find the bin
        const bin = await prisma.bin.findFirst({
            where: {
                code: binCode,
                warehouseId: warehouseId,
            },
        });

        if (!bin) {
            return NextResponse.json(
                { error: 'Bin not found' },
                { status: 404 }
            );
        }

        // Calculate pending quantities that will be added to this bin
        const pendingInbound = await prisma.movement.aggregate({
            where: {
                toBin: bin.id,
                status: 'PENDING',
                type: {
                    in: ['INBOUND', 'RETURN', 'TRANSFER'],
                },
            },
            _sum: {
                quantity: true,
            },
        });

        const currentQty = bin.currentQty || 0;
        const maxCapacity = bin.maxCapacity || 0;
        const pendingQty = pendingInbound._sum.quantity || 0;
        const availableSpace = maxCapacity - (currentQty + pendingQty);

        return NextResponse.json({
            binCode: bin.code,
            binName: bin.name,
            currentQty,
            maxCapacity,
            pendingQty,
            availableSpace,
        });
    } catch (error) {
        console.error('[API] Error fetching bin capacity:', error);
        return NextResponse.json(
            { error: 'Failed to fetch bin capacity' },
            { status: 500 }
        );
    }
}
