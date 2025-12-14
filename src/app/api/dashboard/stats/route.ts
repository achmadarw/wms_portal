import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        // Verify authentication
        const authResult = await verifyJWT(request as any);
        if (!authResult) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Execute all queries in parallel for better performance
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [
            totalWarehouses,
            totalItems,
            totalMovements,
            activeUsers,
            allItems,
            recentActivities,
        ] = await Promise.all([
            prisma.warehouse.count({
                where: { active: true },
            }),
            prisma.itemMaster.count({
                where: { active: true },
            }),
            prisma.movement.count({
                where: {
                    createdAt: {
                        gte: thirtyDaysAgo,
                    },
                },
            }),
            prisma.user.count({
                where: {
                    active: true,
                },
            }),
            prisma.itemMaster.findMany({
                where: { active: true },
                select: {
                    id: true,
                    sku: true,
                    name: true,
                    minStockLevel: true,
                    reorderPoint: true,
                    inventoryItems: {
                        select: {
                            quantity: true,
                        },
                    },
                },
            }),
            prisma.movement.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    type: true,
                    quantity: true,
                    notes: true,
                    createdAt: true,
                    item: {
                        select: {
                            itemMaster: {
                                select: {
                                    sku: true,
                                    name: true,
                                },
                            },
                        },
                    },
                    warehouse: {
                        select: {
                            name: true,
                        },
                    },
                    createdBy: {
                        select: {
                            fullName: true,
                        },
                    },
                },
            }),
        ]);

        // Process items to find low stock and out of stock
        const lowStockItems = [];
        const outOfStockItems = [];

        for (const item of allItems) {
            const totalStock = item.inventoryItems.reduce(
                (sum, inv) => sum + inv.quantity,
                0
            );

            if (totalStock === 0) {
                outOfStockItems.push(item);
            } else if (totalStock <= item.reorderPoint) {
                lowStockItems.push({ ...item, currentStock: totalStock });
            }
        }

        return NextResponse.json({
            stats: {
                totalWarehouses,
                totalItems,
                totalMovements,
                activeUsers,
                lowStockCount: lowStockItems.length,
                outOfStockCount: outOfStockItems.length,
            },
            lowStockItems: lowStockItems.slice(0, 5).map((item) => ({
                id: item.id,
                sku: item.sku,
                name: item.name,
                currentStock: item.currentStock,
                minStockLevel: item.minStockLevel,
                reorderPoint: item.reorderPoint,
            })),
            recentActivities: recentActivities.map((activity) => ({
                id: activity.id,
                type: activity.type,
                itemSku: activity.item.itemMaster.sku,
                itemName: activity.item.itemMaster.name,
                warehouseName: activity.warehouse.name,
                quantity: activity.quantity,
                notes: activity.notes,
                createdAt: activity.createdAt,
                createdBy: activity.createdBy.fullName,
            })),
        });
    } catch (error) {
        console.error('[API] Error fetching dashboard stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch dashboard stats' },
            { status: 500 }
        );
    }
}
