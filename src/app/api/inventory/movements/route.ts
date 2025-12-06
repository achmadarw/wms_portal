import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyJWT } from '@/lib/api-utils';

const prisma = new PrismaClient();

// GET /api/inventory/movements - Get movement history
export async function GET(request: NextRequest) {
    try {
        const user = await verifyJWT(request);
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const itemMasterId = searchParams.get('itemMasterId');
        const warehouseId = searchParams.get('warehouseId');
        const type = searchParams.get('type');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const limit = parseInt(searchParams.get('limit') || '50');

        const where: any = {};

        if (itemMasterId) {
            where.itemMasterId = itemMasterId;
        }

        if (warehouseId) {
            where.warehouseId = warehouseId;
        }

        if (type) {
            where.type = type;
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                where.createdAt.lte = new Date(endDate);
            }
        }

        const movements = await prisma.movement.findMany({
            where,
            include: {
                itemMaster: {
                    select: {
                        id: true,
                        sku: true,
                        name: true,
                        barcode: true,
                        unitOfMeasure: true,
                    },
                },
                warehouse: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                fromBin: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
                toBin: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
                createdByUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
        });

        // Calculate summary statistics
        const stats = {
            totalMovements: movements.length,
            inbound: movements.filter((m) => m.type === 'INBOUND').length,
            outbound: movements.filter((m) => m.type === 'OUTBOUND').length,
            adjustments: movements.filter((m) => m.type === 'ADJUSTMENT')
                .length,
            transfers: movements.filter((m) => m.type === 'TRANSFER').length,
            totalQuantityIn: movements
                .filter(
                    (m) =>
                        ['INBOUND', 'ADJUSTMENT'].includes(m.type) &&
                        m.quantity > 0
                )
                .reduce((sum, m) => sum + m.quantity, 0),
            totalQuantityOut: movements
                .filter(
                    (m) =>
                        ['OUTBOUND', 'ADJUSTMENT'].includes(m.type) &&
                        m.quantity < 0
                )
                .reduce((sum, m) => sum + Math.abs(m.quantity), 0),
        };

        return NextResponse.json({
            movements,
            stats,
            count: movements.length,
        });
    } catch (error: any) {
        console.error('Error fetching movements:', error);
        return NextResponse.json(
            { error: 'Failed to fetch movements', details: error.message },
            { status: 500 }
        );
    }
}

// POST /api/inventory/movements - Create movement (manual)
export async function POST(request: NextRequest) {
    try {
        const user = await verifyJWT(request);
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            itemMasterId,
            warehouseId,
            fromBinId,
            toBinId,
            quantity,
            type,
            reason,
            referenceNumber,
        } = body;

        // Validate required fields
        if (!itemMasterId || !warehouseId || !quantity || !type) {
            return NextResponse.json(
                {
                    error: 'Missing required fields: itemMasterId, warehouseId, quantity, type',
                },
                { status: 400 }
            );
        }

        // Validate movement type
        const validTypes = ['INBOUND', 'OUTBOUND', 'TRANSFER', 'ADJUSTMENT'];
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                {
                    error: `Invalid type. Must be one of: ${validTypes.join(
                        ', '
                    )}`,
                },
                { status: 400 }
            );
        }

        // Create movement
        const movement = await prisma.movement.create({
            data: {
                itemMasterId,
                warehouseId,
                fromBinId: fromBinId || null,
                toBinId: toBinId || null,
                quantity,
                type,
                reason: reason || null,
                referenceNumber: referenceNumber || null,
                createdBy: user.userId,
            },
            include: {
                itemMaster: true,
                warehouse: true,
                fromBin: true,
                toBin: true,
            },
        });

        // Log activity
        await prisma.activity.create({
            data: {
                userId: user.userId,
                action: 'CREATE_MOVEMENT',
                entityType: 'Movement',
                entityId: movement.id,
                details: JSON.stringify({
                    itemName: movement.itemMaster.name,
                    type: movement.type,
                    quantity: movement.quantity,
                    warehouse: movement.warehouse.name,
                }),
            },
        });

        return NextResponse.json({
            movement,
            message: 'Movement created successfully',
        });
    } catch (error: any) {
        console.error('Error creating movement:', error);
        return NextResponse.json(
            { error: 'Failed to create movement', details: error.message },
            { status: 500 }
        );
    }
}
