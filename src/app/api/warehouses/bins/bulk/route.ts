import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT, successResponse, errorResponse } from '@/lib/api-utils';

interface BulkBinParams {
    warehouseId: string;
    prefix: string;
    startRow: number;
    endRow: number;
    startColumn: number;
    endColumn: number;
    startLevel: number;
    endLevel: number;
    maxCapacity?: number;
    nameTemplate?: string;
}

// Helper function to convert number to letter (1=A, 2=B, etc.)
function numberToLetter(num: number): string {
    let letter = '';
    while (num > 0) {
        const remainder = (num - 1) % 26;
        letter = String.fromCharCode(65 + remainder) + letter;
        num = Math.floor((num - 1) / 26);
    }
    return letter;
}

// Helper function to pad number with zeros
function padNumber(num: number, length: number = 2): string {
    return num.toString().padStart(length, '0');
}

// POST bulk create bins
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

        const params: BulkBinParams = await request.json();

        const {
            warehouseId,
            prefix,
            startRow,
            endRow,
            startColumn,
            endColumn,
            startLevel,
            endLevel,
            maxCapacity = 100,
            nameTemplate,
        } = params;

        // Validate required fields
        if (!warehouseId || !prefix) {
            return errorResponse('Warehouse ID and prefix are required', 400);
        }

        if (
            startRow === undefined ||
            endRow === undefined ||
            startColumn === undefined ||
            endColumn === undefined ||
            startLevel === undefined ||
            endLevel === undefined
        ) {
            return errorResponse('All range parameters are required', 400);
        }

        // Validate ranges
        if (
            startRow < 1 ||
            endRow < startRow ||
            startColumn < 1 ||
            endColumn < startColumn ||
            startLevel < 1 ||
            endLevel < startLevel
        ) {
            return errorResponse('Invalid range parameters', 400);
        }

        // Calculate total bins
        const totalBins =
            (endRow - startRow + 1) *
            (endColumn - startColumn + 1) *
            (endLevel - startLevel + 1);

        // Limit to prevent abuse
        if (totalBins > 1000) {
            return errorResponse(
                'Cannot create more than 1000 bins at once',
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

        // Get existing bins to check for duplicates
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

        // Generate bins data
        const binsToCreate: Array<{
            warehouseId: string;
            code: string;
            name: string;
            row: number;
            column: number;
            level: number;
            maxCapacity: number;
        }> = [];

        const skipped: Array<{
            code: string;
            row: number;
            column: number;
            level: number;
            reason: string;
        }> = [];

        for (let row = startRow; row <= endRow; row++) {
            for (let col = startColumn; col <= endColumn; col++) {
                for (let lvl = startLevel; lvl <= endLevel; lvl++) {
                    const rowLetter = numberToLetter(row);
                    const code = `${prefix}${rowLetter}-${padNumber(
                        col
                    )}-${padNumber(lvl)}`;
                    const coords = `${row}-${col}-${lvl}`;

                    // Check for duplicates
                    if (existingCodesSet.has(code)) {
                        skipped.push({
                            code,
                            row,
                            column: col,
                            level: lvl,
                            reason: 'Code already exists',
                        });
                        continue;
                    }

                    if (existingCoordsSet.has(coords)) {
                        skipped.push({
                            code,
                            row,
                            column: col,
                            level: lvl,
                            reason: 'Coordinates already exist',
                        });
                        continue;
                    }

                    const name =
                        nameTemplate ||
                        `${warehouse.name} - ${rowLetter}-${padNumber(
                            col
                        )}-${padNumber(lvl)}`;

                    binsToCreate.push({
                        warehouseId,
                        code,
                        name,
                        row,
                        column: col,
                        level: lvl,
                        maxCapacity,
                    });

                    // Add to sets to prevent duplicates within this batch
                    existingCodesSet.add(code);
                    existingCoordsSet.add(coords);
                }
            }
        }

        if (binsToCreate.length === 0) {
            return errorResponse(
                'No bins to create. All bins already exist.',
                400
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
                total: totalBins,
                message: `Successfully created ${result.count} bins. ${skipped.length} skipped.`,
            },
            201
        );
    } catch (error) {
        console.error('POST bulk bins error:', error);
        return errorResponse('Internal server error', 500);
    }
}
