import { Request, Response, NextFunction } from 'express';
export interface JwtPayload {
    userId: string;
    role: string;
    stationId: string | null;
    email: string;
    iat?: number;
    exp?: number;
}
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: string;
                stationId: string | null;
                firstName: string;
                lastName: string;
            };
        }
    }
}
export declare const authenticate: (req: Request, _res: Response, next: NextFunction) => Promise<void>;
export declare const optionalAuth: (req: Request, _res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map