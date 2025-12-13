import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyJWT } from '@/lib/api-utils';

const prisma = new PrismaClient();

// GET /api/inventory/reports/stock-levels - Stock levels report
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
        const warehouseId = searchParams.get('warehouseId');
        const category = searchParams.get('category');
        const stockStatus = searchParams.get('stockStatus'); // LOW, OUT, OVER

        // Get all items with their inventory
        const items = await prisma.itemMaster.findMany({
            where: {
                ...(category && {
                    category: {
                        name: category,
                    },
                }),
            },
            include: {
                category: true,
                inventoryItems: {
                    where: {
                        ...(warehouseId && { warehouseId }),
                    },
                    include: {
                        warehouse: true,
                        bin: true,
                    },
                },
            },
        });

        // Calculate stock levels and status for each item
        const stockReport = items.map((item) => {
            const totalStock = item.inventoryItems.reduce(
                (sum, inv) => sum + inv.quantity,
                0
            );
            const availableStock = item.inventoryItems.reduce(
                (sum, inv) => sum + (inv.availableQty || inv.quantity),
                0
            );
            const reservedStock = item.inventoryItems.reduce(
                (sum, inv) => sum + (inv.reservedQty || 0),
                0
            );

            let stockStatus = 'IN_STOCK';
            if (totalStock === 0) {
                stockStatus = 'OUT_OF_STOCK';
            } else if (totalStock <= item.minStockLevel) {
                stockStatus = 'LOW_STOCK';
            } else if (item.maxStockLevel && totalStock > item.maxStockLevel) {
                stockStatus = 'OVERSTOCK';
            }

            const stockValue = totalStock * item.unitCost;
            const needsReorder = totalStock <= item.reorderPoint;

            return {
                id: item.id,
                sku: item.sku,
                name: item.name,
                category: item.category?.name || 'Uncategorized',
                barcode: item.barcode,
                unitOfMeasure: item.unitOfMeasure,
                totalStock,
                availableStock,
                reservedStock,
                minStockLevel: item.minStockLevel,
                maxStockLevel: item.maxStockLevel,
                reorderPoint: item.reorderPoint,
                reorderQty: item.reorderQty,
                unitCost: item.unitCost,
                stockValue,
                stockStatus,
                needsReorder,
                locations: item.inventoryItems.map((inv) => ({
                    warehouse: inv.warehouse.name,
                    bin: inv.bin?.code || 'No Bin',
                    quantity: inv.quantity,
                    available: inv.availableQty || inv.quantity,
                    reserved: inv.reservedQty || 0,
                })),
            };
        });

        // Filter by stock status if requested
        let filteredReport = stockReport;
        if (stockStatus === 'LOW') {
            filteredReport = stockReport.filter(
                (item) => item.stockStatus === 'LOW_STOCK'
            );
        } else if (stockStatus === 'OUT') {
            filteredReport = stockReport.filter(
                (item) => item.stockStatus === 'OUT_OF_STOCK'
            );
        } else if (stockStatus === 'OVER') {
            filteredReport = stockReport.filter(
                (item) => item.stockStatus === 'OVERSTOCK'
            );
        }

        // Calculate summary
        const summary = {
            totalItems: filteredReport.length,
            totalStockValue: filteredReport.reduce(
                (sum, item) => sum + item.stockValue,
                0
            ),
            itemsInStock: filteredReport.filter(
                (item) => item.stockStatus === 'IN_STOCK'
            ).length,
            itemsLowStock: filteredReport.filter(
                (item) => item.stockStatus === 'LOW_STOCK'
            ).length,
            itemsOutOfStock: filteredReport.filter(
                (item) => item.stockStatus === 'OUT_OF_STOCK'
            ).length,
            itemsOverstock: filteredReport.filter(
                (item) => item.stockStatus === 'OVERSTOCK'
            ).length,
            itemsNeedReorder: filteredReport.filter((item) => item.needsReorder)
                .length,
        };

        return NextResponse.json({
            report: filteredReport,
            summary,
            generatedAt: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('Error generating stock levels report:', error);
        return NextResponse.json(
            { error: 'Failed to generate report', details: error.message },
            { status: 500 }
        );
    }
}
