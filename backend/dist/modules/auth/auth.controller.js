"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const constants_1 = require("../../config/constants");
const env_1 = require("../../config/env");
class AuthController {
    async login(req, res) {
        const result = await auth_service_1.authService.login(req.body);
        // Set refresh token as httpOnly cookie
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: env_1.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            message: 'Login successful',
            data: {
                user: result.user,
                accessToken: result.accessToken,
            },
        });
    }
    async register(req, res) {
        const user = await auth_service_1.authService.register(req.body, req.user.id);
        res.status(constants_1.HTTP_STATUS.CREATED).json({
            success: true,
            message: 'User registered successfully',
            data: user,
        });
    }
    async refresh(req, res) {
        const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
        if (!refreshToken) {
            res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'Refresh token required',
            });
            return;
        }
        const tokens = await auth_service_1.authService.refresh(refreshToken);
        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: env_1.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.json({
            success: true,
            data: { accessToken: tokens.accessToken },
        });
    }
    async logout(req, res) {
        const accessToken = req.headers.authorization?.split(' ')[1] ?? '';
        const refreshToken = req.cookies.refreshToken;
        await auth_service_1.authService.logout(accessToken, refreshToken);
        res.clearCookie('refreshToken');
        res.json({ success: true, message: 'Logged out successfully' });
    }
    async forgotPassword(req, res) {
        await auth_service_1.authService.forgotPassword(req.body);
        res.json({
            success: true,
            message: 'If that email exists, a reset link has been sent',
        });
    }
    async resetPassword(req, res) {
        await auth_service_1.authService.resetPassword(req.body);
        res.json({ success: true, message: 'Password reset successfully' });
    }
    async changePassword(req, res) {
        await auth_service_1.authService.changePassword(req.user.id, req.body);
        res.json({ success: true, message: 'Password changed successfully' });
    }
    async getMe(req, res) {
        const user = await auth_service_1.authService.getMe(req.user.id);
        res.json({ success: true, data: user });
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map