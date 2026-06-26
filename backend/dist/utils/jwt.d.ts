import jwt from 'jsonwebtoken';
export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
    stationId: string | null;
}
export declare function signAccessToken(payload: TokenPayload): string;
export declare function signRefreshToken(payload: TokenPayload): string;
export declare function verifyToken(token: string): jwt.JwtPayload & TokenPayload;
export declare function decodeToken(token: string): (jwt.JwtPayload & TokenPayload) | null;
export declare function getTokenExpiry(expiresIn: string): Date;
//# sourceMappingURL=jwt.d.ts.map