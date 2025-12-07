import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import {
    createMovement,
    getMovementSummary,
    validateMovement,
} from '@/lib/movement-manager';

/**
 * GET /api/movements
 * List all movements with optional filtering
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

        // Get query parameters for filtering
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const status = searchParams.get('status');
        const warehouseId = searchParams.get('warehouseId');
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');
        const search = searchParams.get('search');

        // Build where clause
        const where: any = {};

        if (type) {
            where.type = type;
        }

        if (status) {
            where.status = status;
        }

        if (warehouseId) {
            where.warehouseId = warehouseId;
        }

        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) where.createdAt.gte = new Date(dateFrom);
            if (dateTo) where.createdAt.lte = new Date(dateTo);
        }

        if (search) {
            where.OR = [
                {
                    referenceNo: {
                        contains: search,
                    },
                },
                {
                    item: {
                        itemMaster: {
                            OR: [
                                { name: { contains: search } },
                                { sku: { contains: search } },
                            ],
                        },
                    },
                },
            ];
        }

        // Fetch movements with full details
        const movements = await prisma.movement.findMany({
            where,
            include: {
                item: {
                    include: {
                        itemMaster: {
                            include: {
                                category: true,
                            },
                        },
                        warehouse: true,
                        bin: true,
                    },
                },
                warehouse: true,
                createdBy: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 100, // Limit for performance
        });

        // Get summary statistics
        const summary = await getMovementSummary(
            warehouseId || undefined,
            dateFrom ? new Date(dateFrom) : undefined,
            dateTo ? new Date(dateTo) : undefined
        );

        // Transform summary to match frontend Stats interface
        const stats = {
            totalMovements: summary.total,
            inbound: summary.byType.INBOUND || 0,
            outbound: summary.byType.OUTBOUND || 0,
            adjustments: summary.byType.ADJUSTMENT || 0,
            transfers: summary.byType.TRANSFER || 0,
            totalQuantityIn: summary.quantities.totalIn,
            totalQuantityOut: summary.quantities.totalOut,
        };

        return NextResponse.json({
            movements,
            stats,
        });
    } catch (error) {
        console.error('[API] Error fetching movements:', error);
        return NextResponse.json(
            { error: 'Failed to fetch movements' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/movements
 * Create new movement
 */
export async function POST(request: NextRequest) {
    try {
        // Verify authentication
        const user = await verifyJWT(request);
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            type,
            inventoryItemId,
            quantity,
            warehouseId,
            fromBinId,
            toBinId,
            notes,
        } = body;

        // Validate required fields
        if (!type || !inventoryItemId || !quantity || !warehouseId) {
            return NextResponse.json(
                {
                    error: 'Missing required fields: type, inventoryItemId, quantity, warehouseId',
                },
                { status: 400 }
            );
        }

        // Validate movement type
        const validTypes = [
            'INBOUND',
            'OUTBOUND',
            'TRANSFER',
            'ADJUSTMENT',
            'RETURN',
            'DAMAGE',
        ];
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                {
                    error: `Invalid movement type. Must be one of: ${validTypes.join(
                        ', '
                    )}`,
                },
                { status: 400 }
            );
        }

        // Validate quantity
        if (quantity <= 0) {
            return NextResponse.json(
                { error: 'Quantity must be greater than 0' },
                { status: 400 }
            );
        }

        // Validate movement before creation
        const validation = await validateMovement({
            type,
            inventoryItemId,
            quantity,
            warehouseId,
            fromBinId,
            toBinId,
            notes,
            createdById: user.userId,
        });

        if (!validation.valid) {
            return NextResponse.json(
                { error: validation.errors.join(', ') },
                { status: 400 }
            );
        }

        // Create movement
        const result = await createMovement({
            type,
            inventoryItemId,
            quantity,
            warehouseId,
            fromBinId,
            toBinId,
            notes,
            createdById: user.userId,
        });

        if (!result.success) {
            return NextResponse.json(
                { error: result.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: result.message,
                movement: result.movement,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('[API] Error creating movement:', error);
        return NextResponse.json(
            { error: 'Failed to create movement' },
            { status: 500 }
        );
    }
}
