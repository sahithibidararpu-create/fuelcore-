"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("../../config/database");
const redis_1 = require("../../config/redis");
const bcrypt_1 = require("../../utils/bcrypt");
const jwt_1 = require("../../utils/jwt");
const mailer_1 = require("../../utils/mailer");
const errorHandler_1 = require("../../middleware/errorHandler");
const constants_1 = require("../../config/constants");
const env_1 = require("../../config/env");
class AuthService {
    async login(data) {
        const user = await database_1.prisma.user.findUnique({
            where: { email: data.email.toLowerCase() },
            select: {
                id: true,
                email: true,
                passwordHash: true,
                firstName: true,
                lastName: true,
                role: true,
                stationId: true,
                isActive: true,
                avatarUrl: true,
            },
        });
        if (!user || !user.isActive) {
            throw new errorHandler_1.AppError('Invalid credentials', constants_1.HTTP_STATUS.UNAUTHORIZED);
        }
        const validPassword = await (0, bcrypt_1.comparePassword)(data.password, user.passwordHash);
        if (!validPassword) {
            throw new errorHandler_1.AppError('Invalid credentials', constants_1.HTTP_STATUS.UNAUTHORIZED);
        }
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            stationId: user.stationId,
        };
        const accessToken = (0, jwt_1.signAccessToken)(payload);
        const refreshToken = (0, jwt_1.signRefreshToken)(payload);
        // Store refresh token in DB
        await database_1.prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: (0, jwt_1.getTokenExpiry)(env_1.env.JWT_REFRESH_EXPIRES),
            },
        });
        // Update last login
        await database_1.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        const { passwordHash: _, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, accessToken, refreshToken };
    }
    async register(data, createdBy) {
        const existing = await database_1.prisma.user.findUnique({
            where: { email: data.email.toLowerCase() },
        });
        if (existing) {
            throw new errorHandler_1.AppError('Email already registered', constants_1.HTTP_STATUS.CONFLICT);
        }
        const passwordHash = await (0, bcrypt_1.hashPassword)(data.password);
        const user = await database_1.prisma.user.create({
            data: {
                email: data.email.toLowerCase(),
                passwordHash,
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                role: data.role,
                stationId: data.stationId,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                stationId: true,
                createdAt: true,
            },
        });
        return user;
    }
    async refresh(refreshToken) {
        // Verify token is valid
        let decoded;
        try {
            decoded = (0, jwt_1.verifyToken)(refreshToken);
        }
        catch {
            throw new errorHandler_1.AppError('Invalid refresh token', constants_1.HTTP_STATUS.UNAUTHORIZED);
        }
        // Check it exists in DB and is not blacklisted
        const storedToken = await database_1.prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: { select: { id: true, email: true, role: true, stationId: true, isActive: true } } },
        });
        if (!storedToken || storedToken.isBlacklisted || storedToken.expiresAt < new Date()) {
            throw new errorHandler_1.AppError('Refresh token expired or revoked', constants_1.HTTP_STATUS.UNAUTHORIZED);
        }
        if (!storedToken.user.isActive) {
            throw new errorHandler_1.AppError('Account deactivated', constants_1.HTTP_STATUS.UNAUTHORIZED);
        }
        // Rotate: blacklist old token
        await database_1.prisma.refreshToken.update({
            where: { id: storedToken.id },
            data: { isBlacklisted: true },
        });
        const payload = {
            userId: storedToken.user.id,
            email: storedToken.user.email,
            role: storedToken.user.role,
            stationId: storedToken.user.stationId,
        };
        const newAccessToken = (0, jwt_1.signAccessToken)(payload);
        const newRefreshToken = (0, jwt_1.signRefreshToken)(payload);
        await database_1.prisma.refreshToken.create({
            data: {
                token: newRefreshToken,
                userId: storedToken.user.id,
                expiresAt: (0, jwt_1.getTokenExpiry)(env_1.env.JWT_REFRESH_EXPIRES),
            },
        });
        return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    }
    async logout(accessToken, refreshToken) {
        // Blacklist access token (short TTL – 15m)
        await (0, redis_1.blacklistToken)(accessToken, 15 * 60);
        if (refreshToken) {
            await database_1.prisma.refreshToken.updateMany({
                where: { token: refreshToken },
                data: { isBlacklisted: true },
            });
        }
    }
    async forgotPassword(data) {
        const user = await database_1.prisma.user.findUnique({
            where: { email: data.email.toLowerCase() },
        });
        // Always return success to prevent email enumeration
        if (!user)
            return;
        const token = crypto_1.default.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await database_1.prisma.passwordResetToken.create({
            data: { token, userId: user.id, expiresAt },
        });
        const resetUrl = `${env_1.env.FRONTEND_URL}/auth/reset-password?token=${token}`;
        await (0, mailer_1.sendEmail)({
            to: user.email,
            subject: 'FuelCore – Password Reset',
            html: (0, mailer_1.passwordResetEmail)(resetUrl, user.firstName),
        });
    }
    async resetPassword(data) {
        const record = await database_1.prisma.passwordResetToken.findUnique({
            where: { token: data.token },
            include: { user: true },
        });
        if (!record || record.expiresAt < new Date() || record.usedAt) {
            throw new errorHandler_1.AppError('Invalid or expired reset token', constants_1.HTTP_STATUS.BAD_REQUEST);
        }
        const passwordHash = await (0, bcrypt_1.hashPassword)(data.password);
        await database_1.prisma.$transaction([
            database_1.prisma.user.update({
                where: { id: record.userId },
                data: { passwordHash },
            }),
            database_1.prisma.passwordResetToken.update({
                where: { id: record.id },
                data: { usedAt: new Date() },
            }),
            // Invalidate all refresh tokens
            database_1.prisma.refreshToken.updateMany({
                where: { userId: record.userId },
                data: { isBlacklisted: true },
            }),
        ]);
    }
    async changePassword(userId, data) {
        const user = await database_1.prisma.user.findUniqueOrThrow({
            where: { id: userId },
            select: { passwordHash: true },
        });
        const valid = await (0, bcrypt_1.comparePassword)(data.currentPassword, user.passwordHash);
        if (!valid) {
            throw new errorHandler_1.AppError('Current password is incorrect', constants_1.HTTP_STATUS.BAD_REQUEST);
        }
        const passwordHash = await (0, bcrypt_1.hashPassword)(data.newPassword);
        await database_1.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
        // Invalidate all refresh tokens to force re-login
        await database_1.prisma.refreshToken.updateMany({
            where: { userId },
            data: { isBlacklisted: true },
        });
    }
    async getMe(userId) {
        return database_1.prisma.user.findUniqueOrThrow({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                avatarUrl: true,
                lastLoginAt: true,
                createdAt: true,
                station: {
                    select: { id: true, name: true, city: true },
                },
                employee: {
                    select: { employeeCode: true, position: true, department: true },
                },
            },
        });
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map