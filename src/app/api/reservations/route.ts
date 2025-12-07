import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import {
    reserveStock,
    releaseReservation,
    fulfillReservation,
    getReservationSummary,
} from '@/lib/reservation-manager';

/**
 * GET /api/reservations
 * List all reservations with optional filtering
 */
export async function GET(request: NextRequest) {
    try {
        // Verify authentication
        const user = await verifyJWT(request);
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get query parameters for filtering
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status'); // ACTIVE, RELEASED, FULFILLED, EXPIRED
        const reservationType = searchParams.get('reservationType'); // ORDER, TRANSFER, PRODUCTION, MANUAL
        const warehouseId = searchParams.get('warehouseId');
        const referenceNo = searchParams.get('referenceNo');

        // Build where clause
        const where: any = {};

        if (status) {
            where.status = status;
        }

        if (reservationType) {
            where.reservationType = reservationType;
        }

        if (referenceNo) {
            where.referenceNo = {
                contains: referenceNo,
            };
        }

        if (warehouseId) {
            where.inventoryItem = {
                warehouseId,
            };
        }

        // Fetch reservations with full details
        const reservations = await prisma.reservation.findMany({
            where,
            include: {
                inventoryItem: {
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
                createdBy: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
                releasedBy: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
            },
            orderBy: [
                { status: 'asc' }, // ACTIVE first
                { createdAt: 'desc' },
            ],
        });

        // Get summary statistics
        const summary = await getReservationSummary(warehouseId || undefined);

        return NextResponse.json({
            reservations,
            summary,
        });
    } catch (error) {
        console.error('[API] Error fetching reservations:', error);
        return NextResponse.json(
            { error: 'Failed to fetch reservations' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/reservations
 * Create new reservation or perform actions (release, fulfill)
 */
export async function POST(request: NextRequest) {
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

        // Action: Release reservation
        if (action === 'release') {
            const { reservationIds } = body;

            if (
                !reservationIds ||
                !Array.isArray(reservationIds) ||
                reservationIds.length === 0
            ) {
                return NextResponse.json(
                    { error: 'reservationIds array is required' },
                    { status: 400 }
                );
            }

            const results = [];
            const errors = [];

            for (const reservationId of reservationIds) {
                const result = await releaseReservation({
                    reservationId,
                    releasedById: user.userId,
                    notes: body.notes,
                });

                if (result.success) {
                    results.push(result.reservation);
                } else {
                    errors.push({ reservationId, error: result.error });
                }
            }

            return NextResponse.json({
                success: true,
                message: `Released ${results.length} reservation(s)`,
                released: results.length,
                errors,
            });
        }

        // Action: Fulfill reservation
        if (action === 'fulfill') {
            const { reservationId } = body;

            if (!reservationId) {
                return NextResponse.json(
                    { error: 'reservationId is required' },
                    { status: 400 }
                );
            }

            const result = await fulfillReservation(reservationId);

            if (!result.success) {
                return NextResponse.json(
                    { error: result.message },
                    { status: 400 }
                );
            }

            return NextResponse.json({
                success: true,
                message: result.message,
                reservation: result.reservation,
            });
        }

        // Default action: Create reservation
        const {
            inventoryItemId,
            quantity,
            reservationType,
            referenceNo,
            notes,
            expiresAt,
        } = body;

        // Validate required fields
        if (!inventoryItemId || !quantity || !reservationType || !referenceNo) {
            return NextResponse.json(
                {
                    error: 'Missing required fields: inventoryItemId, quantity, reservationType, referenceNo',
                },
                { status: 400 }
            );
        }

        // Validate quantity
        if (quantity <= 0) {
            return NextResponse.json(
                { error: 'Quantity must be greater than 0' },
                { status: 400 }
            );
        }

        // Validate reservation type
        const validTypes = ['ORDER', 'TRANSFER', 'PRODUCTION', 'MANUAL'];
        if (!validTypes.includes(reservationType)) {
            return NextResponse.json(
                {
                    error: `Invalid reservationType. Must be one of: ${validTypes.join(
                        ', '
                    )}`,
                },
                { status: 400 }
            );
        }

        // Create reservation
        const result = await reserveStock({
            inventoryItemId,
            quantity,
            reservationType,
            referenceNo,
            notes,
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
            createdById: user.userId,
        });

        if (!result.success) {
            return NextResponse.json(
                { error: result.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: result.message,
                reservation: result.reservation,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('[API] Error processing reservation:', error);
        return NextResponse.json(
            { error: 'Failed to process reservation' },
            { status: 500 }
        );
    }
}
