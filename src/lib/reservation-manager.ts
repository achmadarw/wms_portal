import { prisma } from '@/lib/prisma';

export interface ReserveStockParams {
    inventoryItemId: string;
    quantity: number;
    reservationType: 'ORDER' | 'TRANSFER' | 'PRODUCTION' | 'MANUAL';
    referenceNo: string;
    notes?: string;
    expiresAt?: Date;
    createdById: string;
}

export interface ReleaseReservationParams {
    reservationId: string;
    releasedById: string;
    notes?: string;
}

export interface ReservationResult {
    success: boolean;
    message: string;
    reservation?: any;
    error?: string;
}

/**
 * Reserve stock for orders, transfers, or production
 * This function:
 * 1. Validates available quantity
 * 2. Creates reservation record
 * 3. Updates inventory reservedQty and availableQty
 */
export async function reserveStock(
    params: ReserveStockParams
): Promise<ReservationResult> {
    const {
        inventoryItemId,
        quantity,
        reservationType,
        referenceNo,
        notes,
        expiresAt,
        createdById,
    } = params;

    try {
        // Check if inventory item exists and has enough available quantity
        const inventoryItem = await prisma.inventoryItem.findUnique({
            where: { id: inventoryItemId },
            include: {
                itemMaster: true,
                warehouse: true,
                bin: true,
            },
        });

        if (!inventoryItem) {
            return {
                success: false,
                message: 'Inventory item not found',
                error: 'ITEM_NOT_FOUND',
            };
        }

        // Validate available quantity
        if (inventoryItem.availableQty < quantity) {
            return {
                success: false,
                message: `Insufficient available quantity. Available: ${inventoryItem.availableQty}, Required: ${quantity}`,
                error: 'INSUFFICIENT_QUANTITY',
            };
        }

        // Create reservation and update inventory in transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create reservation record
            const reservation = await tx.reservation.create({
                data: {
                    inventoryItemId,
                    quantity,
                    reservationType,
                    referenceNo,
                    notes,
                    expiresAt,
                    createdById,
                    status: 'ACTIVE',
                },
                include: {
                    inventoryItem: {
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

            // Update inventory quantities
            await tx.inventoryItem.update({
                where: { id: inventoryItemId },
                data: {
                    reservedQty: {
                        increment: quantity,
                    },
                    availableQty: {
                        decrement: quantity,
                    },
                },
            });

            return reservation;
        });

        console.log(
            `[RESERVATION] Created reservation ${result.id} for ${quantity} units of ${inventoryItem.itemMaster.name}`
        );

        return {
            success: true,
            message: `Successfully reserved ${quantity} units`,
            reservation: result,
        };
    } catch (error) {
        console.error('[RESERVATION] Error reserving stock:', error);
        return {
            success: false,
            message: 'Failed to reserve stock',
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

/**
 * Release reservation and return stock to available
 * Called when:
 * - Order is cancelled
 * - Reservation expires
 * - Manual release by user
 */
export async function releaseReservation(
    params: ReleaseReservationParams
): Promise<ReservationResult> {
    const { reservationId, releasedById, notes } = params;

    try {
        // Get reservation details
        const reservation = await prisma.reservation.findUnique({
            where: { id: reservationId },
            include: {
                inventoryItem: {
                    include: {
                        itemMaster: true,
                    },
                },
            },
        });

        if (!reservation) {
            return {
                success: false,
                message: 'Reservation not found',
                error: 'RESERVATION_NOT_FOUND',
            };
        }

        if (reservation.status !== 'ACTIVE') {
            return {
                success: false,
                message: `Cannot release reservation with status: ${reservation.status}`,
                error: 'INVALID_STATUS',
            };
        }

        // Release reservation and update inventory in transaction
        const result = await prisma.$transaction(async (tx) => {
            // Update reservation status
            const updatedReservation = await tx.reservation.update({
                where: { id: reservationId },
                data: {
                    status: 'RELEASED',
                    releasedAt: new Date(),
                    releasedById,
                    notes: notes || reservation.notes,
                },
                include: {
                    inventoryItem: {
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
                    releasedBy: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                        },
                    },
                },
            });

            // Update inventory quantities (return to available)
            await tx.inventoryItem.update({
                where: { id: reservation.inventoryItemId },
                data: {
                    reservedQty: {
                        decrement: reservation.quantity,
                    },
                    availableQty: {
                        increment: reservation.quantity,
                    },
                },
            });

            return updatedReservation;
        });

        console.log(
            `[RESERVATION] Released reservation ${result.id} - returned ${reservation.quantity} units to available`
        );

        return {
            success: true,
            message: `Successfully released ${reservation.quantity} units`,
            reservation: result,
        };
    } catch (error) {
        console.error('[RESERVATION] Error releasing reservation:', error);
        return {
            success: false,
            message: 'Failed to release reservation',
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

/**
 * Fulfill reservation (when order is shipped)
 * This function:
 * 1. Updates reservation status to FULFILLED
 * 2. Reduces actual inventory quantity
 * 3. Reduces reserved quantity
 */
export async function fulfillReservation(
    reservationId: string
): Promise<ReservationResult> {
    try {
        // Get reservation details
        const reservation = await prisma.reservation.findUnique({
            where: { id: reservationId },
            include: {
                inventoryItem: {
                    include: {
                        itemMaster: true,
                    },
                },
            },
        });

        if (!reservation) {
            return {
                success: false,
                message: 'Reservation not found',
                error: 'RESERVATION_NOT_FOUND',
            };
        }

        if (reservation.status !== 'ACTIVE') {
            return {
                success: false,
                message: `Cannot fulfill reservation with status: ${reservation.status}`,
                error: 'INVALID_STATUS',
            };
        }

        // Fulfill reservation and update inventory in transaction
        const result = await prisma.$transaction(async (tx) => {
            // Update reservation status
            const updatedReservation = await tx.reservation.update({
                where: { id: reservationId },
                data: {
                    status: 'FULFILLED',
                    fulfilledAt: new Date(),
                },
                include: {
                    inventoryItem: {
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

            // Update inventory quantities
            // Reduce both actual quantity and reserved quantity
            await tx.inventoryItem.update({
                where: { id: reservation.inventoryItemId },
                data: {
                    quantity: {
                        decrement: reservation.quantity,
                    },
                    reservedQty: {
                        decrement: reservation.quantity,
                    },
                },
            });

            return updatedReservation;
        });

        console.log(
            `[RESERVATION] Fulfilled reservation ${result.id} - deducted ${reservation.quantity} units from inventory`
        );

        return {
            success: true,
            message: `Successfully fulfilled ${reservation.quantity} units`,
            reservation: result,
        };
    } catch (error) {
        console.error('[RESERVATION] Error fulfilling reservation:', error);
        return {
            success: false,
            message: 'Failed to fulfill reservation',
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

/**
 * Auto-expire old reservations
 * Should be called periodically via cron job
 */
export async function expireOldReservations(): Promise<{
    expiredCount: number;
    errors: string[];
}> {
    const result = {
        expiredCount: 0,
        errors: [] as string[],
    };

    try {
        // Find active reservations that have passed expiry date
        const expiredReservations = await prisma.reservation.findMany({
            where: {
                status: 'ACTIVE',
                expiresAt: {
                    lte: new Date(),
                },
            },
            include: {
                inventoryItem: true,
            },
        });

        console.log(
            `[RESERVATION-EXPIRY] Found ${expiredReservations.length} expired reservations`
        );

        // Release each expired reservation
        for (const reservation of expiredReservations) {
            try {
                await prisma.$transaction(async (tx) => {
                    // Update reservation status to EXPIRED
                    await tx.reservation.update({
                        where: { id: reservation.id },
                        data: {
                            status: 'EXPIRED',
                            releasedAt: new Date(),
                        },
                    });

                    // Return quantity to available
                    await tx.inventoryItem.update({
                        where: { id: reservation.inventoryItemId },
                        data: {
                            reservedQty: {
                                decrement: reservation.quantity,
                            },
                            availableQty: {
                                increment: reservation.quantity,
                            },
                        },
                    });
                });

                result.expiredCount++;
                console.log(
                    `[RESERVATION-EXPIRY] Expired reservation ${reservation.id} - ${reservation.quantity} units returned to available`
                );
            } catch (error) {
                result.errors.push(
                    `Failed to expire reservation ${reservation.id}: ${error}`
                );
                console.error(
                    `[RESERVATION-EXPIRY] Error expiring reservation ${reservation.id}:`,
                    error
                );
            }
        }

        return result;
    } catch (error) {
        result.errors.push(`Fatal error in expireOldReservations: ${error}`);
        console.error('[RESERVATION-EXPIRY] Fatal error:', error);
        return result;
    }
}

/**
 * Get reservation summary statistics
 */
export async function getReservationSummary(warehouseId?: string) {
    try {
        const where = warehouseId
            ? {
                  inventoryItem: {
                      warehouseId,
                  },
              }
            : {};

        const [total, active, released, fulfilled, expired] = await Promise.all(
            [
                prisma.reservation.count({ where }),
                prisma.reservation.count({
                    where: { ...where, status: 'ACTIVE' },
                }),
                prisma.reservation.count({
                    where: { ...where, status: 'RELEASED' },
                }),
                prisma.reservation.count({
                    where: { ...where, status: 'FULFILLED' },
                }),
                prisma.reservation.count({
                    where: { ...where, status: 'EXPIRED' },
                }),
            ]
        );

        // Get total reserved quantity
        const activeReservations = await prisma.reservation.findMany({
            where: { ...where, status: 'ACTIVE' },
            select: { quantity: true },
        });

        const totalReservedQty = activeReservations.reduce(
            (sum, r) => sum + r.quantity,
            0
        );

        return {
            total,
            active,
            released,
            fulfilled,
            expired,
            totalReservedQty,
        };
    } catch (error) {
        console.error('[RESERVATION] Error getting summary:', error);
        return {
            total: 0,
            active: 0,
            released: 0,
            fulfilled: 0,
            expired: 0,
            totalReservedQty: 0,
        };
    }
}
