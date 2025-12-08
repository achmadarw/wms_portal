import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT, successResponse, errorResponse } from '@/lib/api-utils';

interface ImportBinRow {
    code: string;
    name: string;
    row: number;
    column: number;
    level: number;
    maxCapacity?: number;
}

// POST import bins from CSV/Excel
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

        const { warehouseId, bins } = await request.json();

        if (!warehouseId) {
            return errorResponse('Warehouse ID is required', 400);
        }

        if (!bins || !Array.isArray(bins) || bins.length === 0) {
            return errorResponse('Bins data is required', 400);
        }

        // Limit to prevent abuse
        if (bins.length > 1000) {
            return errorResponse(
                'Cannot import more than 1000 bins at once',
                400
            );
        }

        // Check if warehouse exists
        const warehouse = await prisma.warehouse.findUnique({
            where: { id: warehouseId },
        });

        if (!warehouse) {
            return errorResponse('Warehouse not found', 404);
        }

        // Get existing bins
        const existingBins = await prisma.bin.findMany({
            where: { warehouseId },
            select: {
                code: true,
                row: true,
                column: true,
                level: true,
            },
        });

        const existingCodesSet = new Set(existingBins.map((b) => b.code));
        const existingCoordsSet = new Set(
            existingBins.map((b) => `${b.row}-${b.column}-${b.level}`)
        );

        const binsToCreate: Array<{
            warehouseId: string;
            code: string;
            name: string;
            row: number;
            column: number;
            level: number;
            maxCapacity: number;
        }> = [];

        const errors: Array<{
            row: number;
            data: ImportBinRow;
            error: string;
        }> = [];

        const skipped: Array<{
            row: number;
            code: string;
            reason: string;
        }> = [];

        bins.forEach((bin: ImportBinRow, index: number) => {
            const rowNum = index + 1;

            // Validate required fields
            if (!bin.code || !bin.name) {
                errors.push({
                    row: rowNum,
                    data: bin,
                    error: 'Code and name are required',
                });
                return;
            }

            if (
                bin.row === undefined ||
                bin.column === undefined ||
                bin.level === undefined
            ) {
                errors.push({
                    row: rowNum,
                    data: bin,
                    error: 'Row, column, and level are required',
                });
                return;
            }

            // Validate types and ranges
            const row = Number(bin.row);
            const column = Number(bin.column);
            const level = Number(bin.level);
            const maxCapacity = bin.maxCapacity ? Number(bin.maxCapacity) : 100;

            if (
                isNaN(row) ||
                isNaN(column) ||
                isNaN(level) ||
                isNaN(maxCapacity)
            ) {
                errors.push({
                    row: rowNum,
                    data: bin,
                    error: 'Row, column, level, and maxCapacity must be numbers',
                });
                return;
            }

            if (row < 1 || column < 1 || level < 1 || maxCapacity < 1) {
                errors.push({
                    row: rowNum,
                    data: bin,
                    error: 'Row, column, level, and maxCapacity must be positive numbers',
                });
                return;
            }

            const code = bin.code.trim();
            const coords = `${row}-${column}-${level}`;

            // Check for duplicates
            if (existingCodesSet.has(code)) {
                skipped.push({
                    row: rowNum,
                    code,
                    reason: 'Code already exists',
                });
                return;
            }

            if (existingCoordsSet.has(coords)) {
                skipped.push({
                    row: rowNum,
                    code,
                    reason: `Coordinates (${row}, ${column}, ${level}) already exist`,
                });
                return;
            }

            binsToCreate.push({
                warehouseId,
                code,
                name: bin.name.trim(),
                row,
                column,
                level,
                maxCapacity,
            });

            // Add to sets to prevent duplicates within this batch
            existingCodesSet.add(code);
            existingCoordsSet.add(coords);
        });

        // Return validation errors if any
        if (errors.length > 0) {
            return errorResponse(
                `Validation failed for ${errors.length} rows`,
                400,
                { errors }
            );
        }

        if (binsToCreate.length === 0) {
            return errorResponse(
                'No bins to create. All bins already exist or were invalid.',
                400,
                { skipped }
            );
        }

        // Create bins in batch (SQLite doesn't support skipDuplicates)
        const result = await prisma.bin.createMany({
            data: binsToCreate,
        });

        return successResponse(
            {
                created: result.count,
                skipped: skipped.length,
                skippedDetails: skipped,
                total: bins.length,
                message: `Successfully imported ${result.count} bins. ${skipped.length} skipped.`,
            },
            201
        );
    } catch (error) {
        console.error('POST import bins error:', error);
        return errorResponse('Internal server error', 500);
    }
}
