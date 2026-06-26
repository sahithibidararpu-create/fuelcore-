import crypto from 'crypto';
import { prisma } from '../../config/database';
import { blacklistToken, getRedis } from '../../config/redis';
import { hashPassword, comparePassword } from '../../utils/bcrypt';
import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
  getTokenExpiry,
} from '../../utils/jwt';
import { sendEmail, passwordResetEmail } from '../../utils/mailer';
import { AppError } from '../../middleware/errorHandler';
import { HTTP_STATUS } from '../../config/constants';
import { env } from '../../config/env';
import type {
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
} from './auth.schemas';

export class AuthService {
  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
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
      throw new AppError('Invalid credentials', HTTP_STATUS.UNAUTHORIZED);
    }

    const validPassword = await comparePassword(data.password, user.passwordHash);
    if (!validPassword) {
      throw new AppError('Invalid credentials', HTTP_STATUS.UNAUTHORIZED);
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      stationId: user.stationId,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Store refresh token in DB
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: getTokenExpiry(env.JWT_REFRESH_EXPIRES),
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken, refreshToken };
  }

  async register(data: RegisterInput, createdBy: string) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing) {
      throw new AppError('Email already registered', HTTP_STATUS.CONFLICT);
    }

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role as 'STATION_MANAGER' | 'EMPLOYEE',
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

  async refresh(refreshToken: string) {
    // Verify token is valid
    let decoded;
    try {
      decoded = verifyToken(refreshToken);
    } catch {
      throw new AppError('Invalid refresh token', HTTP_STATUS.UNAUTHORIZED);
    }

    // Check it exists in DB and is not blacklisted
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { select: { id: true, email: true, role: true, stationId: true, isActive: true } } },
    });

    if (!storedToken || storedToken.isBlacklisted || storedToken.expiresAt < new Date()) {
      throw new AppError('Refresh token expired or revoked', HTTP_STATUS.UNAUTHORIZED);
    }

    if (!storedToken.user.isActive) {
      throw new AppError('Account deactivated', HTTP_STATUS.UNAUTHORIZED);
    }

    // Rotate: blacklist old token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isBlacklisted: true },
    });

    const payload = {
      userId: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
      stationId: storedToken.user.stationId,
    };

    const newAccessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: storedToken.user.id,
        expiresAt: getTokenExpiry(env.JWT_REFRESH_EXPIRES),
      },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(accessToken: string, refreshToken?: string) {
    // Blacklist access token (short TTL – 15m)
    await blacklistToken(accessToken, 15 * 60);

    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { isBlacklisted: true },
      });
    }
  }

  async forgotPassword(data: ForgotPasswordInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) return;

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    const resetUrl = `${env.FRONTEND_URL}/auth/reset-password?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: 'FuelCore – Password Reset',
      html: passwordResetEmail(resetUrl, user.firstName),
    });
  }

  async resetPassword(data: ResetPasswordInput) {
    const record = await prisma.passwordResetToken.findUnique({
      where: { token: data.token },
      include: { user: true },
    });

    if (!record || record.expiresAt < new Date() || record.usedAt) {
      throw new AppError('Invalid or expired reset token', HTTP_STATUS.BAD_REQUEST);
    }

    const passwordHash = await hashPassword(data.password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      // Invalidate all refresh tokens
      prisma.refreshToken.updateMany({
        where: { userId: record.userId },
        data: { isBlacklisted: true },
      }),
    ]);
  }

  async changePassword(userId: string, data: ChangePasswordInput) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { passwordHash: true },
    });

    const valid = await comparePassword(data.currentPassword, user.passwordHash);
    if (!valid) {
      throw new AppError('Current password is incorrect', HTTP_STATUS.BAD_REQUEST);
    }

    const passwordHash = await hashPassword(data.newPassword);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    // Invalidate all refresh tokens to force re-login
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { isBlacklisted: true },
    });
  }

  async getMe(userId: string) {
    return prisma.user.findUniqueOrThrow({
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

export const authService = new AuthService();
