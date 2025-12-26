import { jwtDecode } from 'jwt-decode';

const TOKEN_KEY = 'nightwatch_auth_token';

export interface DecodedToken {
    sub: string; // user ID
    iat?: number;
    exp?: number;
}

export const tokenManager = {
    setToken: (token: string): void => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(TOKEN_KEY, token);
        }
    },

    getToken: (): string | null => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(TOKEN_KEY);
        }
        return null;
    },

    removeToken: (): void => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(TOKEN_KEY);
        }
    },

    isAuthenticated: (): boolean => {
        const token = tokenManager.getToken();
        return !!token;
    },

    decodeToken: (): DecodedToken | null => {
        const token = tokenManager.getToken();
        if (!token) return null;

        try {
            return jwtDecode<DecodedToken>(token);
        } catch (error) {
            console.error('Failed to decode token:', error);
            return null;
        }
    },

    getUserId: (): string | null => {
        const decoded = tokenManager.decodeToken();
        return decoded?.sub || null;
    },
};
