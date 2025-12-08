import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT, errorResponse, successResponse } from '@/lib/api-utils';

// GET /api/inventory - List all inventory items with filters
export async function GET(request: NextRequest) {
    try {
        const auth = verifyJWT(request);
        if (!auth.authenticated) {
            return errorResponse(auth.error || 'Unauthorized', 401);
        }

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const warehouseId = searchParams.get('warehouseId');
        const categoryId = searchParams.get('categoryId');
        const stockStatus = searchParams.get('stockStatus'); // 'in-stock', 'low-stock', 'out-of-stock'
        const search = searchParams.get('search'); // SKU, name, or barcode

        // Build where clause
        const where: any = {};

        if (warehouseId) {
            where.warehouseId = warehouseId;
        }

        if (categoryId) {
            where.itemMaster = {
                categoryId: categoryId,
            };
        }

        if (search) {
            where.itemMaster = {
                ...where.itemMaster,
                OR: [
                    { sku: { contains: search, mode: 'insensitive' } },
                    { name: { contains: search, mode: 'insensitive' } },
                    { barcode: { contains: search, mode: 'insensitive' } },
                ],
            };
        }

        // Fetch inventory items with all relations
        const inventoryItems = await prisma.inventoryItem.findMany({
            where,
            include: {
                itemMaster: {
                    include: {
                        category: {
                            select: {
                                id: true,
                                code: true,
                                name: true,
                            },
                        },
                    },
                },
                warehouse: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        city: true,
                    },
                },
                bin: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        row: true,
                        column: true,
                        level: true,
                    },
                },
            },
            orderBy: [{ updatedAt: 'desc' }],
        });

        console.log('[DEBUG] Total inventory items:', inventoryItems.length);
        if (inventoryItems.length > 0) {
            console.log(
                '[DEBUG] First item:',
                JSON.stringify(inventoryItems[0], null, 2)
            );
        }

        // Apply stock status filter (after fetching data)
        let filteredItems = inventoryItems;
        if (stockStatus) {
            filteredItems = inventoryItems.filter((item) => {
                const available = item.availableQty;
                const minStock = item.itemMaster.minStockLevel || 0;

                if (stockStatus === 'out-of-stock') {
                    return available === 0;
                } else if (stockStatus === 'low-stock') {
                    return available > 0 && available <= minStock;
                } else if (stockStatus === 'in-stock') {
                    return available > minStock;
                }
                return true;
            });
        }

        // Calculate summary statistics
        const summary = {
            totalItems: filteredItems.length,
            totalQuantity: filteredItems.reduce(
                (sum, item) => sum + item.quantity,
                0
            ),
            totalAvailable: filteredItems.reduce(
                (sum, item) => sum + item.availableQty,
                0
            ),
            totalReserved: filteredItems.reduce(
                (sum, item) => sum + item.reservedQty,
                0
            ),
            totalValue: filteredItems.reduce(
                (sum, item) =>
                    sum + item.quantity * (item.itemMaster.unitCost || 0),
                0
            ),
            outOfStock: filteredItems.filter((item) => item.availableQty === 0)
                .length,
            lowStock: filteredItems.filter(
                (item) =>
                    item.availableQty > 0 &&
                    item.availableQty <= (item.itemMaster.minStockLevel || 0)
            ).length,
            inStock: filteredItems.filter(
                (item) =>
                    item.availableQty > (item.itemMaster.minStockLevel || 0)
            ).length,
        };

        return successResponse({
            items: filteredItems,
            summary,
        });
    } catch (error: any) {
        console.error('Error fetching inventory:', error);
        return errorResponse('Failed to fetch inventory', 500);
    }
}
