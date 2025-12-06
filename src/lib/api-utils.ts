import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from './auth';

/**
 * Middleware to verify JWT token from request
 */
export function verifyJWT(request: NextRequest) {
    const authHeader = request.headers.get('Authorization');
    const token = extractToken(authHeader);

    if (!token) {
        return {
            authenticated: false,
            payload: null,
            error: 'Missing or invalid authorization header',
        };
    }

    const payload = verifyToken(token);
    if (!payload) {
        return {
            authenticated: false,
            payload: null,
            error: 'Invalid or expired token',
        };
    }

    return {
        authenticated: true,
        payload,
        error: null,
    };
}

/**
 * Standard error response
 */
export function errorResponse(message: string, status: number = 400) {
    return NextResponse.json({ error: message }, { status });
}

/**
 * Standard success response
 */
export function successResponse(data: any, status: number = 200) {
    return NextResponse.json(data, { status });
}
