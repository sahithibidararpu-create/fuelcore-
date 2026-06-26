"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authenticate = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const errorHandler_1 = require("./errorHandler");
const constants_1 = require("../config/constants");
const env_1 = require("../config/env");
let publicKey;
function getPublicKey() {
    if (!publicKey) {
        const keyPath = path_1.default.resolve(env_1.env.JWT_PUBLIC_KEY_PATH);
        if (!fs_1.default.existsSync(keyPath)) {
            throw new errorHandler_1.AppError('JWT public key not found. Run: npm run keys:generate', constants_1.HTTP_STATUS.INTERNAL);
        }
        publicKey = fs_1.default.readFileSync(keyPath, 'utf-8');
    }
    return publicKey;
}
const authenticate = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            throw new errorHandler_1.AppError('No token provided', constants_1.HTTP_STATUS.UNAUTHORIZED);
        }
        const token = authHeader.split(' ')[1];
        // Check blacklist
        const blacklisted = await (0, redis_1.isTokenBlacklisted)(token);
        if (blacklisted) {
            throw new errorHandler_1.AppError('Token has been revoked', constants_1.HTTP_STATUS.UNAUTHORIZED);
        }
        const decoded = jsonwebtoken_1.default.verify(token, getPublicKey(), {
            algorithms: ['RS256'],
        });
        const user = await database_1.prisma.user.findUnique({
            where: { id: decoded.userId, isActive: true },
            select: {
                id: true,
                email: true,
                role: true,
                stationId: true,
                firstName: true,
                lastName: true,
            },
        });
        if (!user) {
            throw new errorHandler_1.AppError('User not found or inactive', constants_1.HTTP_STATUS.UNAUTHORIZED);
        }
        req.user = user;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            next(new errorHandler_1.AppError('Invalid token', constants_1.HTTP_STATUS.UNAUTHORIZED));
        }
        else if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            next(new errorHandler_1.AppError('Token expired', constants_1.HTTP_STATUS.UNAUTHORIZED));
        }
        else {
            next(error);
        }
    }
};
exports.authenticate = authenticate;
const optionalAuth = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return next();
        }
        await (0, exports.authenticate)(req, _res, next);
    }
    catch {
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map