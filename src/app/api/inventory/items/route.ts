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

        const items = await prisma.itemMaster.findMany({
            where: { active: true },
            orderBy: { name: 'asc' },
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

        if (
            auth.payload?.role !== 'ADMIN' &&
            auth.payload?.role !== 'SUPERVISOR'
        ) {
            return errorResponse('Insufficient permissions', 403);
        }

        const {
            sku,
            name,
            description,
            category,
            unitOfMeasure,
            weight,
            unitCost,
            sellingPrice,
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

        const newItem = await prisma.itemMaster.create({
            data: {
                sku,
                name,
                description,
                category,
                unitOfMeasure: unitOfMeasure || 'PCS',
                weight: weight ? parseFloat(weight) : undefined,
                unitCost: parseFloat(unitCost) || 0,
                sellingPrice: sellingPrice
                    ? parseFloat(sellingPrice)
                    : undefined,
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
