import { prisma } from '@/lib/prisma';
import { sendStockAlertEmail } from './email';

export interface AlertCheckResult {
    alertsGenerated: number;
    errors: string[];
}

export interface EmailResult {
    emailsSent: number;
    errors: string[];
}

/**
 * Check inventory levels and generate stock alerts
 * This function should be called periodically (e.g., hourly via cron)
 */
export async function checkStockLevelsAndGenerateAlerts(): Promise<AlertCheckResult> {
    const result: AlertCheckResult = {
        alertsGenerated: 0,
        errors: [],
    };

    try {
        // Get all inventory items with their item master data
        const inventoryItems = await prisma.inventoryItem.findMany({
            include: {
                itemMaster: {
                    select: {
                        id: true,
                        sku: true,
                        name: true,
                        minStockLevel: true,
                        maxStockLevel: true,
                        reorderPoint: true,
                    },
                },
                warehouse: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        for (const item of inventoryItems) {
            try {
                const {
                    availableQty,
                    itemMaster,
                    warehouse,
                    itemMasterId,
                    warehouseId,
                } = item;
                const { minStockLevel, maxStockLevel, reorderPoint } =
                    itemMaster;

                // Check for OUT_OF_STOCK
                if (availableQty === 0) {
                    const existingAlert = await prisma.stockAlert.findFirst({
                        where: {
                            itemMasterId,
                            warehouseId,
                            alertType: 'OUT_OF_STOCK',
                            resolved: false,
                        },
                    });

                    if (!existingAlert) {
                        await prisma.stockAlert.create({
                            data: {
                                alertType: 'OUT_OF_STOCK',
                                severity: 'CRITICAL',
                                message: `Item ${itemMaster.name} (${itemMaster.sku}) is OUT OF STOCK at ${warehouse.name}`,
                                itemMasterId,
                                warehouseId,
                                currentQty: availableQty,
                                threshold: 0,
                            },
                        });
                        result.alertsGenerated++;
                    }
                }

                // Check for LOW_STOCK
                else if (availableQty > 0 && availableQty <= minStockLevel) {
                    const existingAlert = await prisma.stockAlert.findFirst({
                        where: {
                            itemMasterId,
                            warehouseId,
                            alertType: 'LOW_STOCK',
                            resolved: false,
                        },
                    });

                    if (!existingAlert) {
                        await prisma.stockAlert.create({
                            data: {
                                alertType: 'LOW_STOCK',
                                severity: 'HIGH',
                                message: `Item ${itemMaster.name} (${itemMaster.sku}) is LOW in stock (${availableQty} units) at ${warehouse.name}. Minimum level: ${minStockLevel}`,
                                itemMasterId,
                                warehouseId,
                                currentQty: availableQty,
                                threshold: minStockLevel,
                            },
                        });
                        result.alertsGenerated++;
                    }
                }

                // Check for REORDER_POINT
                else if (
                    reorderPoint > 0 &&
                    availableQty > minStockLevel &&
                    availableQty <= reorderPoint
                ) {
                    const existingAlert = await prisma.stockAlert.findFirst({
                        where: {
                            itemMasterId,
                            warehouseId,
                            alertType: 'REORDER_POINT',
                            resolved: false,
                        },
                    });

                    if (!existingAlert) {
                        await prisma.stockAlert.create({
                            data: {
                                alertType: 'REORDER_POINT',
                                severity: 'MEDIUM',
                                message: `Item ${itemMaster.name} (${itemMaster.sku}) has reached reorder point (${availableQty} units) at ${warehouse.name}. Please reorder.`,
                                itemMasterId,
                                warehouseId,
                                currentQty: availableQty,
                                threshold: reorderPoint,
                            },
                        });
                        result.alertsGenerated++;
                    }
                }

                // Check for OVERSTOCK
                else if (
                    maxStockLevel &&
                    maxStockLevel > 0 &&
                    availableQty > maxStockLevel
                ) {
                    const existingAlert = await prisma.stockAlert.findFirst({
                        where: {
                            itemMasterId,
                            warehouseId,
                            alertType: 'OVERSTOCK',
                            resolved: false,
                        },
                    });

                    if (!existingAlert) {
                        await prisma.stockAlert.create({
                            data: {
                                alertType: 'OVERSTOCK',
                                severity: 'LOW',
                                message: `Item ${itemMaster.name} (${itemMaster.sku}) is OVERSTOCKED (${availableQty} units) at ${warehouse.name}. Maximum level: ${maxStockLevel}`,
                                itemMasterId,
                                warehouseId,
                                currentQty: availableQty,
                                threshold: maxStockLevel || 0,
                            },
                        });
                        result.alertsGenerated++;
                    }
                }

                // Auto-resolve alerts if stock level is back to normal
                else if (availableQty > minStockLevel) {
                    // Resolve OUT_OF_STOCK, LOW_STOCK, and REORDER_POINT alerts
                    await prisma.stockAlert.updateMany({
                        where: {
                            itemMasterId,
                            warehouseId,
                            alertType: {
                                in: [
                                    'OUT_OF_STOCK',
                                    'LOW_STOCK',
                                    'REORDER_POINT',
                                ],
                            },
                            resolved: false,
                        },
                        data: {
                            resolved: true,
                            resolvedAt: new Date(),
                        },
                    });
                }

                // Auto-resolve OVERSTOCK if below max level
                if (
                    maxStockLevel &&
                    maxStockLevel > 0 &&
                    availableQty <= maxStockLevel
                ) {
                    await prisma.stockAlert.updateMany({
                        where: {
                            itemMasterId,
                            warehouseId,
                            alertType: 'OVERSTOCK',
                            resolved: false,
                        },
                        data: {
                            resolved: true,
                            resolvedAt: new Date(),
                        },
                    });
                }
            } catch (itemError) {
                result.errors.push(
                    `Error processing item ${item.itemMaster.sku}: ${itemError}`
                );
            }
        }

        return result;
    } catch (error) {
        result.errors.push(
            `Fatal error in checkStockLevelsAndGenerateAlerts: ${error}`
        );
        return result;
    }
}

/**
 * Send email notifications for unacknowledged alerts
 */
export async function sendAlertEmails(): Promise<EmailResult> {
    const result: EmailResult = {
        emailsSent: 0,
        errors: [],
    };

    try {
        // Get unacknowledged alerts that haven't been emailed
        const alerts = await prisma.stockAlert.findMany({
            where: {
                acknowledged: false,
                emailSent: false,
                resolved: false,
            },
            include: {
                itemMaster: {
                    include: {
                        category: true,
                    },
                },
                warehouse: true,
            },
        });

        // Get recipients from environment or use default
        const alertRecipients = process.env.ALERT_EMAIL_RECIPIENTS
            ? process.env.ALERT_EMAIL_RECIPIENTS.split(',')
            : ['purchasing@company.com', 'warehouse@company.com'];

        // Send email for each alert
        for (const alert of alerts) {
            try {
                const emailResult = await sendStockAlertEmail({
                    alertType: alert.alertType,
                    severity: alert.severity,
                    message: alert.message,
                    itemName: alert.itemMaster.name,
                    itemSku: alert.itemMaster.sku,
                    warehouseName: alert.warehouse.name,
                    currentQty: alert.currentQty,
                    threshold: alert.threshold,
                    unitOfMeasure: alert.itemMaster.unitOfMeasure || 'units',
                    recipients: alertRecipients,
                });

                if (emailResult.success) {
                    // Mark alert as emailed
                    await prisma.stockAlert.update({
                        where: { id: alert.id },
                        data: {
                            emailSent: true,
                            emailSentAt: new Date(),
                        },
                    });
                    result.emailsSent++;
                    console.log(
                        `[ALERT-EMAIL] Sent ${alert.severity} alert for ${alert.itemMaster.sku} - ${alert.message}`
                    );
                } else {
                    result.errors.push(
                        `Failed to send email for alert ${alert.id}: ${emailResult.message}`
                    );
                    console.error(
                        `[ALERT-EMAIL] Failed to send alert ${alert.id}:`,
                        emailResult.message
                    );
                }
            } catch (emailError) {
                result.errors.push(
                    `Error sending email for alert ${alert.id}: ${
                        emailError instanceof Error
                            ? emailError.message
                            : String(emailError)
                    }`
                );
                console.error(
                    `[ALERT-EMAIL] Error sending alert ${alert.id}:`,
                    emailError
                );
            }
        }

        return result;
    } catch (error) {
        result.errors.push(`Error sending alert emails: ${error}`);
        return result;
    }
}
