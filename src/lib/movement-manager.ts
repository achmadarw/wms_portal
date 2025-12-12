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

        // Create movement record with PENDING status
        // Inventory will be updated when movement is processed (status changed to COMPLETED)
        const movement = await prisma.movement.create({
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
                status: 'PENDING', // Start as PENDING, must be processed to COMPLETED
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

        console.log(
            `[MOVEMENT] Created ${type} movement ${movement.referenceNo} for ${quantity} units of ${inventoryItem.itemMaster.name} with status PENDING`
        );

        return {
            success: true,
            message: `Successfully created ${type} movement. Status: PENDING. Please process to complete.`,
            movement: movement,
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
        include: {
            itemMaster: true,
            bin: true,
        },
    });

    if (!item) {
        errors.push('Inventory item not found');
        return { valid: false, errors };
    }

    // CRITICAL VALIDATIONS FOR EACH MOVEMENT TYPE
    switch (params.type) {
        case 'OUTBOUND':
        case 'DAMAGE':
            // Must have inventory in the source bin
            if (!params.fromBinId) {
                errors.push(
                    'Source bin is required for OUTBOUND/DAMAGE movements'
                );
            } else if (item.binId !== params.fromBinId) {
                errors.push(
                    `Item is not available in the specified source bin. Item is in bin: ${
                        item.bin?.code || 'N/A'
                    }`
                );
            }

            // Must have sufficient quantity
            if (item.quantity === 0) {
                errors.push(
                    `Item "${item.itemMaster.name}" has no stock in this location. Please ensure inventory exists before creating OUTBOUND/DAMAGE movement.`
                );
            } else if (item.availableQty < params.quantity) {
                errors.push(
                    `Insufficient available quantity. Available: ${item.availableQty} ${item.itemMaster.unitOfMeasure}, Required: ${params.quantity} ${item.itemMaster.unitOfMeasure}`
                );
            }
            break;

        case 'TRANSFER':
            // Must have inventory in the source bin
            if (!params.fromBinId) {
                errors.push('Source bin is required for TRANSFER movements');
            } else if (item.binId !== params.fromBinId) {
                errors.push(
                    `Item is not available in the specified source bin. Item is in bin: ${
                        item.bin?.code || 'N/A'
                    }`
                );
            }

            if (!params.toBinId) {
                errors.push(
                    'Destination bin is required for TRANSFER movements'
                );
            }

            if (params.fromBinId === params.toBinId) {
                errors.push('Source and destination bins must be different');
            }

            // Must have sufficient quantity
            if (item.quantity === 0) {
                errors.push(
                    `Item "${item.itemMaster.name}" has no stock in source bin. Please ensure inventory exists before creating TRANSFER movement.`
                );
            } else if (item.availableQty < params.quantity) {
                errors.push(
                    `Insufficient available quantity. Available: ${item.availableQty} ${item.itemMaster.unitOfMeasure}, Required: ${params.quantity} ${item.itemMaster.unitOfMeasure}`
                );
            }
            break;

        case 'ADJUSTMENT':
            // Adjustment requires existing inventory record
            if (item.quantity === 0 && params.quantity === 0) {
                errors.push(
                    `Cannot adjust inventory for item "${item.itemMaster.name}" with zero quantity. Use INBOUND to receive items first.`
                );
            }

            // Validate adjustment quantity is reasonable
            if (params.quantity < 0) {
                errors.push(
                    'Adjustment quantity cannot be negative. Use positive number for the new total quantity.'
                );
            }
            break;

        case 'INBOUND':
            // INBOUND can create new inventory, so less strict
            if (!params.toBinId) {
                errors.push(
                    'Destination bin is required for INBOUND movements'
                );
            }
            break;

        case 'RETURN':
            // RETURN can add to existing or create new inventory
            if (!params.toBinId) {
                errors.push('Destination bin is required for RETURN movements');
            }
            break;
    }

    // Check bins exist
    if (params.fromBinId) {
        const fromBin = await prisma.bin.findUnique({
            where: { id: params.fromBinId },
        });
        if (!fromBin) {
            errors.push('Source bin not found');
        } else if (fromBin.warehouseId !== params.warehouseId) {
            errors.push(
                'Source bin does not belong to the specified warehouse'
            );
        }
    }

    if (params.toBinId) {
        const toBin = await prisma.bin.findUnique({
            where: { id: params.toBinId },
        });
        if (!toBin) {
            errors.push('Destination bin not found');
        } else if (toBin.warehouseId !== params.warehouseId) {
            errors.push(
                'Destination bin does not belong to the specified warehouse'
            );
        } else {
            // Check bin capacity for INBOUND, RETURN, and TRANSFER movements
            if (
                params.type === 'INBOUND' ||
                params.type === 'RETURN' ||
                params.type === 'TRANSFER'
            ) {
                const currentOccupancy = toBin.currentQty || 0;
                const maxCapacity = toBin.maxCapacity;

                console.log('[VALIDATE] Bin capacity check:', {
                    binCode: toBin.code,
                    binId: toBin.id,
                    currentOccupancy,
                    maxCapacity,
                    requestedQty: params.quantity,
                    movementType: params.type,
                });

                // Only validate if bin has a capacity limit (maxCapacity > 0)
                if (maxCapacity && maxCapacity > 0) {
                    // Calculate pending quantities that will be added to this bin
                    const pendingInbound = await prisma.movement.aggregate({
                        where: {
                            toBin: params.toBinId,
                            status: 'PENDING',
                            type: {
                                in: ['INBOUND', 'RETURN', 'TRANSFER'],
                            },
                        },
                        _sum: {
                            quantity: true,
                        },
                    });

                    const pendingQty = pendingInbound._sum.quantity || 0;
                    const plannedOccupancy = currentOccupancy + pendingQty;
                    const availableSpace = maxCapacity - plannedOccupancy;

                    console.log('[VALIDATE] Capacity calculation:', {
                        pendingQty,
                        plannedOccupancy,
                        availableSpace,
                        willExceed: params.quantity > availableSpace,
                    });

                    if (params.quantity > availableSpace) {
                        const errorMsg =
                            `Destination bin "${toBin.code}" has insufficient capacity. ` +
                            `Available space: ${availableSpace} units, ` +
                            `Required: ${params.quantity} units, ` +
                            `Current occupancy: ${currentOccupancy}/${maxCapacity}` +
                            (pendingQty > 0 ? `, Pending: ${pendingQty}` : '');
                        console.log('[VALIDATE] Capacity error:', errorMsg);
                        errors.push(errorMsg);
                    }
                }
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Process movement from PENDING to COMPLETED
 * This updates inventory quantities based on movement type
 */
export async function processMovement(
    movementId: string
): Promise<MovementResult> {
    try {
        // Get movement details
        const movement = await prisma.movement.findUnique({
            where: { id: movementId },
            include: {
                item: {
                    include: {
                        itemMaster: true,
                        warehouse: true,
                        bin: true,
                    },
                },
            },
        });

        if (!movement) {
            return {
                success: false,
                message: 'Movement not found',
                error: 'MOVEMENT_NOT_FOUND',
            };
        }

        if (movement.status === 'COMPLETED') {
            return {
                success: false,
                message: 'Movement already completed',
                error: 'ALREADY_COMPLETED',
            };
        }

        if (movement.status === 'CANCELLED') {
            return {
                success: false,
                message: 'Cannot process cancelled movement',
                error: 'MOVEMENT_CANCELLED',
            };
        }

        const inventoryItem = movement.item;
        const { type, quantity, fromBin, toBin } = movement;

        // Validate stock availability for outbound movements
        if (type === 'OUTBOUND' || type === 'TRANSFER' || type === 'DAMAGE') {
            if (inventoryItem.availableQty < quantity) {
                return {
                    success: false,
                    message: `Insufficient available quantity. Available: ${inventoryItem.availableQty}, Required: ${quantity}`,
                    error: 'INSUFFICIENT_QUANTITY',
                };
            }
        }

        // Process movement in transaction
        const result = await prisma.$transaction(async (tx) => {
            // Update movement status
            const updatedMovement = await tx.movement.update({
                where: { id: movementId },
                data: {
                    status: 'COMPLETED',
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
                        where: { id: inventoryItem.id },
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
                        where: { id: inventoryItem.id },
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
                    // Adjustment sets absolute quantity
                    await tx.inventoryItem.update({
                        where: { id: inventoryItem.id },
                        data: {
                            quantity,
                            availableQty: quantity,
                        },
                    });
                    break;

                case 'TRANSFER':
                    // Transfer doesn't change total quantity, just location
                    if (toBin && toBin !== inventoryItem.binId) {
                        await tx.inventoryItem.update({
                            where: { id: inventoryItem.id },
                            data: {
                                binId: toBin,
                            },
                        });
                    }
                    break;

                case 'DAMAGE':
                    // Damaged goods reduce inventory
                    await tx.inventoryItem.update({
                        where: { id: inventoryItem.id },
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
                        where: { id: inventoryItem.id },
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
                fromBin &&
                (type === 'OUTBOUND' ||
                    type === 'TRANSFER' ||
                    type === 'DAMAGE')
            ) {
                await tx.bin.update({
                    where: { id: fromBin },
                    data: {
                        currentQty: {
                            decrement: quantity,
                        },
                    },
                });
            }

            if (
                toBin &&
                (type === 'INBOUND' || type === 'TRANSFER' || type === 'RETURN')
            ) {
                await tx.bin.update({
                    where: { id: toBin },
                    data: {
                        currentQty: {
                            increment: quantity,
                        },
                    },
                });
            }

            return updatedMovement;
        });

        console.log(
            `[MOVEMENT] Processed ${type} movement ${result.referenceNo} - Inventory updated`
        );

        return {
            success: true,
            message: `Successfully processed ${type} movement`,
            movement: result,
        };
    } catch (error) {
        console.error('[MOVEMENT] Error processing movement:', error);
        return {
            success: false,
            message: 'Failed to process movement',
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
