import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT, successResponse, errorResponse } from '@/lib/api-utils';

// GET all warehouses
export async function GET(request: NextRequest) {
    try {
        const auth = verifyJWT(request);
        if (!auth.authenticated) {
            return errorResponse(auth.error || 'Unauthorized', 401);
        }

        const warehouses = await prisma.warehouse.findMany({
            where: { active: true },
            include: {
                bins: true,
                manager: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true,
                        email: true,
                    },
                },
            },
        });

        return successResponse({ warehouses });
    } catch (error) {
        console.error('GET warehouses error:', error);
        return errorResponse('Internal server error', 500);
    }
}

// CREATE new warehouse
export async function POST(request: NextRequest) {
    try {
        const auth = verifyJWT(request);
        if (!auth.authenticated) {
            return errorResponse(auth.error || 'Unauthorized', 401);
        }

        if (auth.payload?.role !== 'ADMIN') {
            return errorResponse('Insufficient permissions', 403);
        }

        const {
            code,
            name,
            description,
            address,
            city,
            state,
            zipCode,
            country,
            managerId,
        } = await request.json();

        if (
            !code ||
            !name ||
            !address ||
            !city ||
            !state ||
            !zipCode ||
            !country
        ) {
            return errorResponse('All warehouse fields are required', 400);
        }

        // Check if code exists
        const existingWarehouse = await prisma.warehouse.findUnique({
            where: { code },
        });

        if (existingWarehouse) {
            return errorResponse('Warehouse code already exists', 409);
        }

        const newWarehouse = await prisma.warehouse.create({
            data: {
                code,
                name,
                description,
                address,
                city,
                state,
                zipCode,
                country,
                warehouseId: managerId,
            },
        });

        // Log activity
        await prisma.activity.create({
            data: {
                action: 'CREATE_WAREHOUSE',
                entity: 'WAREHOUSE',
                entityId: newWarehouse.id,
                userId: auth.payload.userId,
            },
        });

        return successResponse({ warehouse: newWarehouse }, 201);
    } catch (error) {
        console.error('POST warehouse error:', error);
        return errorResponse('Internal server error', 500);
    }
}
