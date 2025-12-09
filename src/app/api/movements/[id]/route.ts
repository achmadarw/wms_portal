import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { processMovement } from '@/lib/movement-manager';

/**
 * GET /api/movements/[id]
 * Get single movement details
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Verify authentication
        const user = await verifyJWT(request);
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const movement = await prisma.movement.findUnique({
            where: { id: params.id },
            include: {
                item: {
                    include: {
                        itemMaster: {
                            include: {
                                category: true,
                            },
                        },
                        warehouse: true,
                        bin: true,
                    },
                },
                warehouse: true,
                createdBy: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
            },
        });

        if (!movement) {
            return NextResponse.json(
                { error: 'Movement not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(movement);
    } catch (error) {
        console.error('[API] Error fetching movement:', error);
        return NextResponse.json(
            { error: 'Failed to fetch movement' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/movements/[id]
 * Update movement status (process movement)
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Verify authentication
        const user = await verifyJWT(request);
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { action } = body;

        if (action === 'process' || action === 'complete') {
            // RBAC: Only ADMIN and SUPERVISOR can process movements
            if (user.role !== 'ADMIN' && user.role !== 'SUPERVISOR') {
                return NextResponse.json(
                    {
                        error: 'Forbidden - Only ADMIN or SUPERVISOR can process movements',
                    },
                    { status: 403 }
                );
            }

            // Process movement (PENDING → COMPLETED)
            const result = await processMovement(params.id);

            if (!result.success) {
                return NextResponse.json(
                    { error: result.message },
                    { status: 400 }
                );
            }

            return NextResponse.json({
                message: result.message,
                movement: result.movement,
            });
        } else if (action === 'cancel') {
            // RBAC: Only ADMIN and SUPERVISOR can cancel movements
            if (user.role !== 'ADMIN' && user.role !== 'SUPERVISOR') {
                return NextResponse.json(
                    {
                        error: 'Forbidden - Only ADMIN or SUPERVISOR can cancel movements',
                    },
                    { status: 403 }
                );
            }

            // Cancel movement
            const movement = await prisma.movement.update({
                where: { id: params.id },
                data: { status: 'CANCELLED' },
                include: {
                    item: {
                        include: {
                            itemMaster: true,
                            warehouse: true,
                            bin: true,
                        },
                    },
                    createdBy: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                        },
                    },
                },
            });

            return NextResponse.json({
                message: 'Movement cancelled successfully',
                movement,
            });
        } else {
            return NextResponse.json(
                { error: 'Invalid action. Use "process" or "cancel"' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('[API] Error updating movement:', error);
        return NextResponse.json(
            { error: 'Failed to update movement' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/movements/[id]
 * Delete movement (only if PENDING or CANCELLED)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Verify authentication
        const user = await verifyJWT(request);
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // RBAC: Only ADMIN can delete movements
        if (user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Forbidden - Only ADMIN can delete movements' },
                { status: 403 }
            );
        }

        // Check if movement can be deleted
        const movement = await prisma.movement.findUnique({
            where: { id: params.id },
        });

        if (!movement) {
            return NextResponse.json(
                { error: 'Movement not found' },
                { status: 404 }
            );
        }

        if (movement.status === 'COMPLETED') {
            return NextResponse.json(
                {
                    error: 'Cannot delete completed movement. Cancel it first.',
                },
                { status: 400 }
            );
        }

        // Delete movement
        await prisma.movement.delete({
            where: { id: params.id },
        });

        return NextResponse.json({
            message: 'Movement deleted successfully',
        });
    } catch (error) {
        console.error('[API] Error deleting movement:', error);
        return NextResponse.json(
            { error: 'Failed to delete movement' },
            { status: 500 }
        );
    }
}
