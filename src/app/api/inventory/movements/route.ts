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
        const itemId = searchParams.get('itemId');
        const warehouseId = searchParams.get('warehouseId');
        const type = searchParams.get('type');
        const status = searchParams.get('status');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const where: any = {};

        if (itemId) {
            where.itemId = itemId;
        }

        if (status) {
            where.status = status;
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
                item: {
                    select: {
                        id: true,
                        itemMaster: {
                            select: {
                                sku: true,
                                name: true,
                                barcode: true,
                                unitOfMeasure: true,
                            },
                        },
                    },
                },
                warehouse: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
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
            skip: (page - 1) * limit,
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
        const { itemId, quantity, type, fromBin, toBin, notes } = body;

        // Validate required fields
        if (!itemId || !quantity || !type) {
            return NextResponse.json(
                {
                    error: 'Missing required fields: itemId, quantity, type',
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
                    error: `Invalid type. Must be one of: ${validTypes.join(
                        ', '
                    )}`,
                },
                { status: 400 }
            );
        }

        // Get item and warehouse for the movement
        const item = await prisma.inventoryItem.findUnique({
            where: { id: itemId },
            select: {
                warehouseId: true,
                itemMaster: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        if (!item) {
            return NextResponse.json(
                { error: 'Item not found' },
                { status: 404 }
            );
        }

        // Generate reference number
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000)
            .toString()
            .padStart(3, '0');
        const referenceNo = `MOV-${type}-${timestamp}-${random}`;

        // Check authenticated user
        if (!user.authenticated || !user.payload) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Create movement
        const movement = await prisma.movement.create({
            data: {
                referenceNo,
                itemId,
                warehouseId: item.warehouseId,
                fromBin: fromBin || null,
                toBin: toBin || null,
                quantity,
                type,
                notes: notes || null,
                createdById: user.payload.userId,
            },
            include: {
                item: {
                    include: {
                        itemMaster: true,
                    },
                },
                warehouse: true,
                createdBy: true,
            },
        });

        // Log activity
        await prisma.activity.create({
            data: {
                userId: user.payload.userId,
                action: 'CREATE_MOVEMENT',
                entity: 'MOVEMENT',
                entityId: movement.id,
                details: JSON.stringify({
                    itemName: item.itemMaster.name,
                    type: movement.type,
                    quantity: movement.quantity,
                    referenceNo: movement.referenceNo,
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
