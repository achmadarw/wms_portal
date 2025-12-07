import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT, successResponse, errorResponse } from '@/lib/api-utils';

// GET all alerts with filtering
export async function GET(request: NextRequest) {
    try {
        const auth = verifyJWT(request);
        if (!auth.authenticated) {
            return errorResponse(auth.error || 'Unauthorized', 401);
        }

        const { searchParams } = new URL(request.url);
        const severity = searchParams.get('severity');
        const alertType = searchParams.get('alertType');
        const acknowledged = searchParams.get('acknowledged');
        const resolved = searchParams.get('resolved');
        const warehouseId = searchParams.get('warehouseId');

        // Build where clause
        const where: any = {};

        if (severity) {
            where.severity = severity;
        }

        if (alertType) {
            where.alertType = alertType;
        }

        if (acknowledged !== null && acknowledged !== undefined) {
            where.acknowledged = acknowledged === 'true';
        }

        if (resolved !== null && resolved !== undefined) {
            where.resolved = resolved === 'true';
        }

        if (warehouseId) {
            where.warehouseId = warehouseId;
        }

        const alerts = await prisma.stockAlert.findMany({
            where,
            include: {
                itemMaster: {
                    select: {
                        id: true,
                        sku: true,
                        name: true,
                        unitOfMeasure: true,
                        minStockLevel: true,
                        maxStockLevel: true,
                        reorderPoint: true,
                        category: {
                            select: {
                                id: true,
                                code: true,
                                name: true,
                            },
                        },
                    },
                },
                warehouse: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        city: true,
                    },
                },
            },
            orderBy: [
                { resolved: 'asc' },
                { acknowledged: 'asc' },
                { severity: 'desc' },
                { createdAt: 'desc' },
            ],
        });

        // Calculate summary statistics
        const summary = {
            total: alerts.length,
            unresolved: alerts.filter((a) => !a.resolved).length,
            unacknowledged: alerts.filter((a) => !a.acknowledged).length,
            critical: alerts.filter((a) => a.severity === 'CRITICAL').length,
            high: alerts.filter((a) => a.severity === 'HIGH').length,
            medium: alerts.filter((a) => a.severity === 'MEDIUM').length,
            low: alerts.filter((a) => a.severity === 'LOW').length,
            outOfStock: alerts.filter((a) => a.alertType === 'OUT_OF_STOCK')
                .length,
            lowStock: alerts.filter((a) => a.alertType === 'LOW_STOCK').length,
            reorderPoint: alerts.filter((a) => a.alertType === 'REORDER_POINT')
                .length,
            overstock: alerts.filter((a) => a.alertType === 'OVERSTOCK').length,
        };

        return successResponse({ alerts, summary });
    } catch (error) {
        console.error('GET alerts error:', error);
        return errorResponse('Internal server error', 500);
    }
}

// POST - Acknowledge alert
export async function POST(request: NextRequest) {
    try {
        const auth = verifyJWT(request);
        if (!auth.authenticated) {
            return errorResponse(auth.error || 'Unauthorized', 401);
        }

        const { alertId, action } = await request.json();

        if (!alertId || !action) {
            return errorResponse('Alert ID and action are required', 400);
        }

        const alert = await prisma.stockAlert.findUnique({
            where: { id: alertId },
        });

        if (!alert) {
            return errorResponse('Alert not found', 404);
        }

        let updatedAlert;

        if (action === 'acknowledge') {
            updatedAlert = await prisma.stockAlert.update({
                where: { id: alertId },
                data: {
                    acknowledged: true,
                    acknowledgedBy: auth.payload?.userId || 'system',
                    acknowledgedAt: new Date(),
                },
            });
        } else if (action === 'resolve') {
            updatedAlert = await prisma.stockAlert.update({
                where: { id: alertId },
                data: {
                    resolved: true,
                    resolvedAt: new Date(),
                    acknowledged: true,
                    acknowledgedBy: auth.payload?.userId || 'system',
                    acknowledgedAt: alert.acknowledgedAt || new Date(),
                },
            });
        } else {
            return errorResponse('Invalid action', 400);
        }

        return successResponse(updatedAlert);
    } catch (error) {
        console.error('POST alert action error:', error);
        return errorResponse('Internal server error', 500);
    }
}
