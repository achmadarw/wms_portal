export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'OPERATOR';

export interface User {
    id: string;
    email: string;
    username: string;
    fullName: string;
    role: UserRole;
    avatar?: string;
    phone?: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface AuthToken {
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    user: User;
    token: AuthToken;
}
