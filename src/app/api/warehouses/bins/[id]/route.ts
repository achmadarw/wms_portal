import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT, successResponse, errorResponse } from '@/lib/api-utils';

// UPDATE bin
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

        const { id } = params;
        const { code, name, row, column, level, maxCapacity } =
            await request.json();

        if (
            !code ||
            !name ||
            row === undefined ||
            column === undefined ||
            level === undefined
        ) {
            return errorResponse('All bin fields are required', 400);
        }

        // Check if bin exists
        const existingBin = await prisma.bin.findUnique({
            where: { id },
        });

        if (!existingBin) {
            return errorResponse('Bin not found', 404);
        }

        // Check if new code conflicts with other bins in same warehouse
        if (code !== existingBin.code) {
            const codeConflict = await prisma.bin.findFirst({
                where: {
                    warehouseId: existingBin.warehouseId,
                    code,
                    id: { not: id },
                },
            });

            if (codeConflict) {
                return errorResponse(
                    'Bin code already exists in this warehouse',
                    409
                );
            }
        }

        const updatedBin = await prisma.bin.update({
            where: { id },
            data: {
                code,
                name,
                row,
                column,
                level,
                maxCapacity: maxCapacity || 100,
            },
        });

        return successResponse({ bin: updatedBin });
    } catch (error) {
        console.error('PUT bin error:', error);
        return errorResponse('Internal server error', 500);
    }
}

// DELETE bin
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

        const { id } = params;

        // Check if bin exists
        const existingBin = await prisma.bin.findUnique({
            where: { id },
        });

        if (!existingBin) {
            return errorResponse('Bin not found', 404);
        }

        // Check if bin has stock
        if (existingBin.currentQty > 0) {
            return errorResponse(
                'Cannot delete bin with existing stock. Please move items first.',
                400
            );
        }

        // Soft delete by setting active to false
        const deletedBin = await prisma.bin.update({
            where: { id },
            data: { active: false },
        });

        return successResponse({ bin: deletedBin });
    } catch (error) {
        console.error('DELETE bin error:', error);
        return errorResponse('Internal server error', 500);
    }
}
