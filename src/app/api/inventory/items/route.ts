import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT, successResponse, errorResponse } from '@/lib/api-utils';

// GET all items
export async function GET(request: NextRequest) {
    try {
        const auth = verifyJWT(request);
        if (!auth.authenticated) {
            return errorResponse(auth.error || 'Unauthorized', 401);
        }

        const { searchParams } = new URL(request.url);
        const warehouseId = searchParams.get('warehouseId');
        const category = searchParams.get('category');
        const search = searchParams.get('search');
        const lowStock = searchParams.get('lowStock') === 'true';
        const barcode = searchParams.get('barcode');

        // Build where clause
        const where: any = { active: true };

        if (category) {
            where.category = category;
        }

        if (barcode) {
            where.barcode = barcode;
        }

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { sku: { contains: search } },
                { barcode: { contains: search } },
            ];
        }

        const items = await prisma.itemMaster.findMany({
            where,
            include: {
                inventoryItems: {
                    where: warehouseId ? { warehouseId } : undefined,
                    include: {
                        warehouse: { select: { id: true, name: true, code: true } },
                        bin: { select: { id: true, code: true, name: true } },
                    },
                },
            },
            orderBy: { name: 'asc' },
        });

        // Calculate stock levels
        const itemsWithStock = items.map((item) => {
            const totalStock = item.inventoryItems.reduce((sum, inv) => sum + inv.quantity, 0);
            const availableStock = item.inventoryItems.reduce((sum, inv) => sum + inv.availableQty, 0);
            const reservedStock = item.inventoryItems.reduce((sum, inv) => sum + inv.reservedQty, 0);
            
            return {
                ...item,
                totalStock,
                availableStock,
                reservedStock,
                isLowStock: totalStock <= item.reorderPoint,
                stockStatus: totalStock === 0 ? 'OUT_OF_STOCK' 
                    : totalStock <= item.reorderPoint ? 'LOW_STOCK'
                    : totalStock >= (item.maxStockLevel || Infinity) ? 'OVERSTOCK'
                    : 'IN_STOCK',
            };
        });

        // Filter by low stock if requested
        const filteredItems = lowStock
            ? itemsWithStock.filter((item) => item.isLowStock)
            : itemsWithStock;

        return successResponse({ items: filteredItems });
    } catch (error) {
        console.error('GET items error:', error);
        return errorResponse('Internal server error', 500);
    }
}

// CREATE new item
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

        const {
            sku,
            barcode,
            name,
            description,
            category,
            unitOfMeasure,
            weight,
            dimensions,
            unitCost,
            sellingPrice,
            minStockLevel,
            maxStockLevel,
            reorderPoint,
            reorderQty,
            manufacturer,
            supplier,
            imageUrl,
        } = await request.json();

        if (!sku || !name || !category) {
            return errorResponse('SKU, name, and category are required', 400);
        }

        // Check if SKU already exists
        const existingSku = await prisma.itemMaster.findUnique({
            where: { sku },
        });

        if (existingSku) {
            return errorResponse('SKU already exists', 409);
        }

        // Check if barcode already exists
        if (barcode) {
            const existingBarcode = await prisma.itemMaster.findUnique({
                where: { barcode },
            });

            if (existingBarcode) {
                return errorResponse('Barcode already exists', 409);
            }
        }

        const newItem = await prisma.itemMaster.create({
            data: {
                sku,
                barcode,
                name,
                description,
                category,
                unitOfMeasure: unitOfMeasure || 'PCS',
                weight: weight ? parseFloat(weight) : null,
                dimensions,
                unitCost: parseFloat(unitCost) || 0,
                sellingPrice: sellingPrice ? parseFloat(sellingPrice) : null,
                minStockLevel: parseInt(minStockLevel) || 0,
                maxStockLevel: maxStockLevel ? parseInt(maxStockLevel) : null,
                reorderPoint: parseInt(reorderPoint) || 0,
                reorderQty: parseInt(reorderQty) || 0,
                manufacturer,
                supplier,
                imageUrl,
            },
        });

        // Log activity
        await prisma.activity.create({
            data: {
                action: 'CREATE_ITEM',
                entity: 'ITEM',
                entityId: newItem.id,
                userId: auth.payload.userId,
            },
        });

        return successResponse({ item: newItem }, 201);
    } catch (error) {
        console.error('POST item error:', error);
        return errorResponse('Internal server error', 500);
    }
}
