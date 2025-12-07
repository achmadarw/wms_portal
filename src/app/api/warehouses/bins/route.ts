import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT, successResponse, errorResponse } from '@/lib/api-utils';

// GET bins by warehouse
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

        const bins = await prisma.bin.findMany({
            where: { warehouseId },
            orderBy: [{ row: 'asc' }, { column: 'asc' }, { level: 'asc' }],
        });

        return successResponse({ bins });
    } catch (error) {
        console.error('GET bins error:', error);
        return errorResponse('Internal server error', 500);
    }
}

// CREATE bin/location
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

        const { warehouseId, code, name, row, column, level, maxCapacity } =
            await request.json();

        if (
            !warehouseId ||
            !code ||
            !name ||
            row === undefined ||
            column === undefined ||
            level === undefined
        ) {
            return errorResponse('All bin fields are required', 400);
        }

        // Check if bin code exists in warehouse
        const existingBin = await prisma.bin.findFirst({
            where: { warehouseId, code },
        });

        if (existingBin) {
            return errorResponse(
                'Bin code already exists in this warehouse',
                409
            );
        }

        const newBin = await prisma.bin.create({
            data: {
                warehouseId,
                code,
                name,
                row,
                column,
                level,
                maxCapacity: maxCapacity || 100,
            },
        });

        return successResponse({ bin: newBin }, 201);
    } catch (error) {
        console.error('POST bin error:', error);
        return errorResponse('Internal server error', 500);
    }
}
