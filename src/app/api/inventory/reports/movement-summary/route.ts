import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyJWT } from '@/lib/api-utils';

const prisma = new PrismaClient();

// GET /api/inventory/reports/movement-summary - Movement summary report
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
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const groupBy = searchParams.get('groupBy') || 'day'; // day, week, month

        // Default to last 30 days if no dates provided
        const start = startDate
            ? new Date(startDate)
            : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        // Get all movements in date range
        const movements = await prisma.movement.findMany({
            where: {
                createdAt: {
                    gte: start,
                    lte: end,
                },
            },
            include: {
                item: {
                    include: {
                        itemMaster: {
                            select: {
                                id: true,
                                sku: true,
                                name: true,
                                category: true,
                            },
                        },
                    },
                },
                warehouse: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        // Group movements by type
        const byType = {
            INBOUND: movements.filter((m) => m.type === 'INBOUND'),
            OUTBOUND: movements.filter((m) => m.type === 'OUTBOUND'),
            TRANSFER: movements.filter((m) => m.type === 'TRANSFER'),
            ADJUSTMENT: movements.filter((m) => m.type === 'ADJUSTMENT'),
        };

        // Group movements by date
        const byDate: Record<string, any> = {};
        movements.forEach((movement) => {
            const date = movement.createdAt.toISOString().split('T')[0];
            if (!byDate[date]) {
                byDate[date] = {
                    date,
                    inbound: 0,
                    outbound: 0,
                    transfer: 0,
                    adjustment: 0,
                    total: 0,
                };
            }
            byDate[date][movement.type.toLowerCase()]++;
            byDate[date].total++;
        });

        // Group by category
        const byCategory: Record<string, any> = {};
        movements.forEach((movement) => {
            const category =
                movement.item.itemMaster.category?.name || 'Uncategorized';
            if (!byCategory[category]) {
                byCategory[category] = {
                    category,
                    count: 0,
                    inbound: 0,
                    outbound: 0,
                    items: new Set(),
                };
            }
            byCategory[category].count++;
            if (movement.type === 'INBOUND') byCategory[category].inbound++;
            if (movement.type === 'OUTBOUND') byCategory[category].outbound++;
            byCategory[category].items.add(movement.item.itemMaster.id);
        });

        // Convert category items set to count
        const categoryReport = Object.values(byCategory).map((cat: any) => ({
            ...cat,
            uniqueItems: cat.items.size,
            items: undefined,
        }));

        // Top moving items
        const itemMovements: Record<string, any> = {};
        movements.forEach((movement) => {
            const itemId = movement.item.itemMaster.id;
            if (!itemMovements[itemId]) {
                itemMovements[itemId] = {
                    itemId,
                    sku: movement.item.itemMaster.sku,
                    name: movement.item.itemMaster.name,
                    category:
                        movement.item.itemMaster.category?.name ||
                        'Uncategorized',
                    totalMovements: 0,
                    totalQuantity: 0,
                };
            }
            itemMovements[itemId].totalMovements++;
            itemMovements[itemId].totalQuantity += Math.abs(movement.quantity);
        });

        const topItems = Object.values(itemMovements)
            .sort((a: any, b: any) => b.totalMovements - a.totalMovements)
            .slice(0, 10);

        // Summary statistics
        const summary = {
            totalMovements: movements.length,
            dateRange: {
                start: start.toISOString(),
                end: end.toISOString(),
            },
            byType: {
                inbound: {
                    count: byType.INBOUND.length,
                    quantity: byType.INBOUND.reduce(
                        (sum, m) => sum + m.quantity,
                        0
                    ),
                },
                outbound: {
                    count: byType.OUTBOUND.length,
                    quantity: byType.OUTBOUND.reduce(
                        (sum, m) => sum + Math.abs(m.quantity),
                        0
                    ),
                },
                transfer: {
                    count: byType.TRANSFER.length,
                    quantity: byType.TRANSFER.reduce(
                        (sum, m) => sum + Math.abs(m.quantity),
                        0
                    ),
                },
                adjustment: {
                    count: byType.ADJUSTMENT.length,
                    quantity: byType.ADJUSTMENT.reduce(
                        (sum, m) => sum + Math.abs(m.quantity),
                        0
                    ),
                },
            },
            averageMovementsPerDay:
                movements.length /
                Math.max(
                    1,
                    Math.ceil(
                        (end.getTime() - start.getTime()) /
                            (1000 * 60 * 60 * 24)
                    )
                ),
        };

        return NextResponse.json({
            summary,
            byDate: Object.values(byDate),
            byCategory: categoryReport,
            topItems,
            generatedAt: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('Error generating movement summary:', error);
        return NextResponse.json(
            { error: 'Failed to generate report', details: error.message },
            { status: 500 }
        );
    }
}
