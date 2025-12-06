import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRY = '24h';

export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
}

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

/**
 * Compare password with hash
 */
export async function comparePassword(
    password: string,
    hash: string
): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * Generate JWT token
 */
export function generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRY,
        algorithm: 'HS256',
    });
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        return decoded;
    } catch (error) {
        return null;
    }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader: string | undefined): string | null {
    if (!authHeader) return null;
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
    return parts[1];
}

/**
 * Middleware helper to verify authentication
 */
export function verifyAuthToken(
    authHeader: string | undefined
): JWTPayload | null {
    const token = extractToken(authHeader);
    if (!token) return null;
    return verifyToken(token);
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: string, allowedRoles: string[]): boolean {
    return allowedRoles.includes(userRole);
}

/**
 * Check if user is admin
 */
export function isAdmin(userRole: string): boolean {
    return userRole === 'ADMIN';
}
