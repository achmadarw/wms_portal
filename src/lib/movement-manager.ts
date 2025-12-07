import { prisma } from '@/lib/prisma';

export interface CreateMovementParams {
    type:
        | 'INBOUND'
        | 'OUTBOUND'
        | 'TRANSFER'
        | 'ADJUSTMENT'
        | 'RETURN'
        | 'DAMAGE';
    inventoryItemId: string;
    quantity: number;
    warehouseId: string;
    fromBinId?: string;
    toBinId?: string;
    notes?: string;
    createdById: string;
}

export interface MovementResult {
    success: boolean;
    message: string;
    movement?: any;
    error?: string;
}

/**
 * Generate unique reference number for movement
 * Format: MOV-TYPE-YYYYMMDD-HHMMSS-RANDOM
 */
export function generateMovementReferenceNo(type: string): string {
    const now = new Date();
    const dateStr = now
        .toISOString()
        .replace(/[-:]/g, '')
        .split('.')[0]
        .replace('T', '-');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `MOV-${type}-${dateStr}-${random}`;
}

/**
 * Create stock movement and update inventory
 * Handles different movement types with appropriate inventory updates
 */
export async function createMovement(
    params: CreateMovementParams
): Promise<MovementResult> {
    const {
        type,
        inventoryItemId,
        quantity,
        warehouseId,
        fromBinId,
        toBinId,
        notes,
        createdById,
    } = params;

    try {
        // Validate quantity
        if (quantity <= 0) {
            return {
                success: false,
                message: 'Quantity must be greater than 0',
                error: 'INVALID_QUANTITY',
            };
        }

        // Get inventory item details
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

        // Validate stock availability for OUTBOUND movements
        if (type === 'OUTBOUND' || type === 'TRANSFER' || type === 'DAMAGE') {
            if (inventoryItem.availableQty < quantity) {
                return {
                    success: false,
                    message: `Insufficient available quantity. Available: ${inventoryItem.availableQty}, Required: ${quantity}`,
                    error: 'INSUFFICIENT_QUANTITY',
                };
            }
        }

        // Generate reference number
        const referenceNo = generateMovementReferenceNo(type);

        // Create movement and update inventory in transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create movement record
            const movement = await tx.movement.create({
                data: {
                    referenceNo,
                    type,
                    quantity,
                    warehouseId,
                    itemId: inventoryItemId,
                    fromBin: fromBinId,
                    toBin: toBinId,
                    notes,
                    createdById,
                    status: 'COMPLETED', // Auto-complete for now
                },
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

            // Update inventory based on movement type
            switch (type) {
                case 'INBOUND':
                    // Increase inventory quantity
                    await tx.inventoryItem.update({
                        where: { id: inventoryItemId },
                        data: {
                            quantity: {
                                increment: quantity,
                            },
                            availableQty: {
                                increment: quantity,
                            },
                        },
                    });
                    break;

                case 'OUTBOUND':
                    // Decrease inventory quantity
                    await tx.inventoryItem.update({
                        where: { id: inventoryItemId },
                        data: {
                            quantity: {
                                decrement: quantity,
                            },
                            availableQty: {
                                decrement: quantity,
                            },
                        },
                    });
                    break;

                case 'ADJUSTMENT':
                    // Adjustment can be positive or negative
                    // For simplicity, treating as absolute set for now
                    // In production, you'd want to track variance separately
                    await tx.inventoryItem.update({
                        where: { id: inventoryItemId },
                        data: {
                            quantity,
                            availableQty: quantity,
                        },
                    });
                    break;

                case 'TRANSFER':
                    // Transfer doesn't change total quantity, just location
                    // Update bin if moving between bins
                    if (toBinId && toBinId !== inventoryItem.binId) {
                        // Note: This is simplified. In production, you might want to
                        // split inventory items or create new records for different bins
                        await tx.inventoryItem.update({
                            where: { id: inventoryItemId },
                            data: {
                                binId: toBinId,
                            },
                        });
                    }
                    break;

                case 'DAMAGE':
                    // Damaged goods reduce available inventory
                    await tx.inventoryItem.update({
                        where: { id: inventoryItemId },
                        data: {
                            quantity: {
                                decrement: quantity,
                            },
                            availableQty: {
                                decrement: quantity,
                            },
                        },
                    });
                    break;

                case 'RETURN':
                    // Customer return increases inventory
                    await tx.inventoryItem.update({
                        where: { id: inventoryItemId },
                        data: {
                            quantity: {
                                increment: quantity,
                            },
                            availableQty: {
                                increment: quantity,
                            },
                        },
                    });
                    break;
            }

            // Update bin quantities if applicable
            if (
                fromBinId &&
                (type === 'OUTBOUND' ||
                    type === 'TRANSFER' ||
                    type === 'DAMAGE')
            ) {
                await tx.bin.update({
                    where: { id: fromBinId },
                    data: {
                        currentQty: {
                            decrement: quantity,
                        },
                    },
                });
            }

            if (
                toBinId &&
                (type === 'INBOUND' || type === 'TRANSFER' || type === 'RETURN')
            ) {
                await tx.bin.update({
                    where: { id: toBinId },
                    data: {
                        currentQty: {
                            increment: quantity,
                        },
                    },
                });
            }

            return movement;
        });

        console.log(
            `[MOVEMENT] Created ${type} movement ${result.referenceNo} for ${quantity} units of ${inventoryItem.itemMaster.name}`
        );

        return {
            success: true,
            message: `Successfully created ${type} movement`,
            movement: result,
        };
    } catch (error) {
        console.error('[MOVEMENT] Error creating movement:', error);
        return {
            success: false,
            message: 'Failed to create movement',
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

/**
 * Get movement statistics for dashboard
 */
export async function getMovementSummary(
    warehouseId?: string,
    dateFrom?: Date,
    dateTo?: Date
) {
    try {
        const where: any = {};

        if (warehouseId) {
            where.warehouseId = warehouseId;
        }

        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) where.createdAt.gte = dateFrom;
            if (dateTo) where.createdAt.lte = dateTo;
        }

        const [
            total,
            inbound,
            outbound,
            transfer,
            adjustment,
            damage,
            returnMovements,
            pending,
            completed,
        ] = await Promise.all([
            prisma.movement.count({ where }),
            prisma.movement.count({ where: { ...where, type: 'INBOUND' } }),
            prisma.movement.count({ where: { ...where, type: 'OUTBOUND' } }),
            prisma.movement.count({ where: { ...where, type: 'TRANSFER' } }),
            prisma.movement.count({ where: { ...where, type: 'ADJUSTMENT' } }),
            prisma.movement.count({ where: { ...where, type: 'DAMAGE' } }),
            prisma.movement.count({ where: { ...where, type: 'RETURN' } }),
            prisma.movement.count({ where: { ...where, status: 'PENDING' } }),
            prisma.movement.count({ where: { ...where, status: 'COMPLETED' } }),
        ]);

        // Get total quantities by type
        const quantityByType = await prisma.movement.groupBy({
            by: ['type'],
            where,
            _sum: {
                quantity: true,
            },
        });

        const quantitySummary = quantityByType.reduce((acc, item) => {
            acc[item.type.toLowerCase()] = item._sum.quantity || 0;
            return acc;
        }, {} as Record<string, number>);

        return {
            total,
            byType: {
                inbound,
                outbound,
                transfer,
                adjustment,
                damage,
                return: returnMovements,
            },
            byStatus: {
                pending,
                completed,
            },
            quantities: quantitySummary,
        };
    } catch (error) {
        console.error('[MOVEMENT] Error getting summary:', error);
        return {
            total: 0,
            byType: {
                inbound: 0,
                outbound: 0,
                transfer: 0,
                adjustment: 0,
                damage: 0,
                return: 0,
            },
            byStatus: {
                pending: 0,
                completed: 0,
            },
            quantities: {},
        };
    }
}

/**
 * Validate movement before creation
 */
export async function validateMovement(params: CreateMovementParams): Promise<{
    valid: boolean;
    errors: string[];
}> {
    const errors: string[] = [];

    // Check quantity
    if (params.quantity <= 0) {
        errors.push('Quantity must be greater than 0');
    }

    // Check inventory item exists
    const item = await prisma.inventoryItem.findUnique({
        where: { id: params.inventoryItemId },
    });

    if (!item) {
        errors.push('Inventory item not found');
    } else {
        // Check availability for outbound movements
        if (['OUTBOUND', 'TRANSFER', 'DAMAGE'].includes(params.type)) {
            if (item.availableQty < params.quantity) {
                errors.push(
                    `Insufficient available quantity. Available: ${item.availableQty}, Required: ${params.quantity}`
                );
            }
        }
    }

    // Check bins exist
    if (params.fromBinId) {
        const fromBin = await prisma.bin.findUnique({
            where: { id: params.fromBinId },
        });
        if (!fromBin) {
            errors.push('Source bin not found');
        }
    }

    if (params.toBinId) {
        const toBin = await prisma.bin.findUnique({
            where: { id: params.toBinId },
        });
        if (!toBin) {
            errors.push('Destination bin not found');
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
