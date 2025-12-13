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

        // Get total warehouses
        const totalWarehouses = await prisma.warehouse.count({
            where: { active: true },
        });

        // Get total items
        const totalItems = await prisma.itemMaster.count({
            where: { active: true },
        });

        // Get total movements (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const totalMovements = await prisma.movement.count({
            where: {
                createdAt: {
                    gte: thirtyDaysAgo,
                },
            },
        });

        // Get active users (logged in last 30 days or created recently)
        const activeUsers = await prisma.user.count({
            where: {
                active: true,
            },
        });

        // Get low stock items
        const allItems = await prisma.itemMaster.findMany({
            where: { active: true },
            include: {
                inventoryItems: {
                    select: {
                        quantity: true,
                        availableQty: true,
                    },
                },
            },
        });

        const lowStockItems = allItems.filter((item) => {
            const totalStock = item.inventoryItems.reduce(
                (sum, inv) => sum + inv.quantity,
                0
            );
            return totalStock > 0 && totalStock <= item.reorderPoint;
        });

        const outOfStockItems = allItems.filter((item) => {
            const totalStock = item.inventoryItems.reduce(
                (sum, inv) => sum + inv.quantity,
                0
            );
            return totalStock === 0;
        });

        // Get recent activities (last 10 movements)
        const recentActivities = await prisma.movement.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                item: {
                    include: {
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
                        code: true,
                        name: true,
                    },
                },
                createdBy: {
                    select: {
                        fullName: true,
                        email: true,
                    },
                },
            },
        });

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
                currentStock: item.inventoryItems.reduce(
                    (sum, inv) => sum + inv.quantity,
                    0
                ),
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
