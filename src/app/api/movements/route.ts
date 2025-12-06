import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT, successResponse, errorResponse } from '@/lib/api-utils';

// GET all movements
export async function GET(request: NextRequest) {
    try {
        const auth = verifyJWT(request);
        if (!auth.authenticated) {
            return errorResponse(auth.error || 'Unauthorized', 401);
        }

        const { searchParams } = new URL(request.url);
        const warehouseId = searchParams.get('warehouseId');
        const status = searchParams.get('status');

        const whereClause: any = {};
        if (warehouseId) whereClause.warehouseId = warehouseId;
        if (status) whereClause.status = status;

        const movements = await prisma.movement.findMany({
            where: whereClause,
            include: {
                item: {
                    include: { itemMaster: true },
                },
                createdBy: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });

        return successResponse({ movements });
    } catch (error) {
        console.error('GET movements error:', error);
        return errorResponse('Internal server error', 500);
    }
}

// CREATE new movement
export async function POST(request: NextRequest) {
    try {
        const auth = verifyJWT(request);
        if (!auth.authenticated) {
            return errorResponse(auth.error || 'Unauthorized', 401);
        }

        const { itemId, warehouseId, type, quantity, notes } =
            await request.json();

        if (!itemId || !warehouseId || !type || quantity === undefined) {
            return errorResponse('Required fields missing', 400);
        }

        // Generate reference number
        const referenceNo = `MOV-${Date.now()}`;

        const movement = await prisma.movement.create({
            data: {
                referenceNo,
                type,
                quantity,
                status: 'PENDING',
                notes,
                itemId,
                warehouseId,
                createdById: auth.payload.userId,
            },
        });

        // Log activity
        await prisma.activity.create({
            data: {
                action: 'CREATE_MOVEMENT',
                entity: 'MOVEMENT',
                entityId: movement.id,
                userId: auth.payload.userId,
            },
        });

        return successResponse({ movement }, 201);
    } catch (error) {
        console.error('POST movement error:', error);
        return errorResponse('Internal server error', 500);
    }
}
