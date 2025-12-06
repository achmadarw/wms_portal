import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT, successResponse, errorResponse } from '@/lib/api-utils';

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
