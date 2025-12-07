import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { expireOldReservations } from '@/lib/reservation-manager';

/**
 * POST /api/reservations/expire
 * Manually trigger expiration of old reservations
 * Access: ADMIN and SUPERVISOR only
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

        // Check role - only ADMIN and SUPERVISOR can trigger expiration
        if (user.role !== 'ADMIN' && user.role !== 'SUPERVISOR') {
            return NextResponse.json(
                {
                    error: 'Access denied. Only ADMIN and SUPERVISOR can trigger reservation expiration.',
                },
                { status: 403 }
            );
        }

        console.log(
            `[API] Manual reservation expiry triggered by ${user.fullName} (${user.role})`
        );

        // Run expiration check
        const result = await expireOldReservations();

        return NextResponse.json({
            success: true,
            message: 'Reservation expiration check completed',
            expiredCount: result.expiredCount,
            errors: result.errors,
        });
    } catch (error) {
        console.error('[API] Error expiring reservations:', error);
        return NextResponse.json(
            { error: 'Failed to expire reservations' },
            { status: 500 }
        );
    }
}
