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
        const categoryId = searchParams.get('categoryId');
        const search = searchParams.get('search');

        const where: any = { active: true };

        if (categoryId) {
            where.categoryId = categoryId;
        }

        if (search) {
            where.OR = [
                { sku: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { barcode: { contains: search, mode: 'insensitive' } },
            ];
        }

        const items = await prisma.itemMaster.findMany({
            where,
            include: {
                category: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
                inventoryItems: {
                    select: {
                        quantity: true,
                        availableQty: true,
                        warehouse: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return successResponse({ items });
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

        if (auth.payload?.role === 'OPERATOR') {
            return errorResponse('Insufficient permissions', 403);
        }

        const {
            sku,
            barcode,
            name,
            description,
            categoryId,
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
            leadTimeDays,
            imageUrl,
        } = await request.json();

        // Validation
        if (!sku || !name || !unitOfMeasure) {
            return errorResponse(
                'SKU, name, and unit of measure are required',
                400
            );
        }

        // Check SKU uniqueness
        const existingSKU = await prisma.itemMaster.findUnique({
            where: { sku },
        });

        if (existingSKU) {
            return errorResponse('SKU already exists', 409);
        }

        // Check barcode uniqueness if provided
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
                barcode: barcode || null,
                name,
                description: description || null,
                category: categoryId
                    ? { connect: { id: categoryId } }
                    : undefined,
                unitOfMeasure: unitOfMeasure || 'PCS',
                weight: weight ? parseFloat(weight) : null,
                dimensions: dimensions || null,
                unitCost: unitCost ? parseFloat(unitCost) : 0,
                sellingPrice: sellingPrice ? parseFloat(sellingPrice) : null,
                minStockLevel: minStockLevel ? parseInt(minStockLevel) : 0,
                maxStockLevel: maxStockLevel ? parseInt(maxStockLevel) : null,
                reorderPoint: reorderPoint ? parseInt(reorderPoint) : 0,
                reorderQty: reorderQty ? parseInt(reorderQty) : 0,
                manufacturer: manufacturer || null,
                supplier: supplier || null,
                leadTimeDays: leadTimeDays ? parseInt(leadTimeDays) : null,
                imageUrl: imageUrl || null,
            },
        });

        // Log activity
        await prisma.activity.create({
            data: {
                action: 'CREATE_ITEM',
                entity: 'ITEM_MASTER',
                entityId: newItem.id,
                userId: auth.payload!.userId,
            },
        });

        return successResponse({ item: newItem }, 201);
    } catch (error) {
        console.error('POST item error:', error);
        return errorResponse('Internal server error', 500);
    }
}
