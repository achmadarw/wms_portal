import { NextRequest } from 'next/server';
import { verifyJWT, successResponse, errorResponse } from '@/lib/api-utils';
import {
    checkStockLevelsAndGenerateAlerts,
    sendAlertEmails,
} from '@/lib/alert-checker';

// POST - Trigger alert check manually (or via cron)
export async function POST(request: NextRequest) {
    try {
        const auth = verifyJWT(request);
        if (!auth.authenticated) {
            return errorResponse(auth.error || 'Unauthorized', 401);
        }

        // Only ADMIN and SUPERVISOR can trigger alert checks
        if (auth.payload?.role === 'OPERATOR') {
            return errorResponse('Insufficient permissions', 403);
        }

        console.log('[ALERT CHECK] Starting stock level monitoring...');

        // Check stock levels and generate alerts
        const alertResult = await checkStockLevelsAndGenerateAlerts();

        console.log(
            `[ALERT CHECK] Generated ${alertResult.alertsGenerated} new alerts`
        );

        // Send email notifications for new alerts
        const emailResult = await sendAlertEmails();

        console.log(
            `[ALERT CHECK] Sent ${emailResult.emailsSent} email notifications`
        );

        const result = {
            success: true,
            alertsGenerated: alertResult.alertsGenerated,
            emailsSent: emailResult.emailsSent,
            errors: [...alertResult.errors, ...emailResult.errors],
            timestamp: new Date().toISOString(),
        };

        return successResponse(result);
    } catch (error) {
        console.error('Alert check error:', error);
        return errorResponse('Internal server error', 500);
    }
}
