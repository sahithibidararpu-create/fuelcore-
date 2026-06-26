import { Request, Response } from 'express';
import { authService } from './auth.service';
import { HTTP_STATUS } from '../../config/constants';
import { env } from '../../config/env';

export class AuthController {
  async login(req: Request, res: Response) {
    const result = await authService.login(req.body);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  }

  async register(req: Request, res: Response) {
    const user = await authService.register(req.body, req.user!.id);
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'User registered successfully',
      data: user,
    });
  }

  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!refreshToken) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Refresh token required',
      });
      return;
    }

    const tokens = await authService.refresh(refreshToken);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: { accessToken: tokens.accessToken },
    });
  }

  async logout(req: Request, res: Response) {
    const accessToken = req.headers.authorization?.split(' ')[1] ?? '';
    const refreshToken = req.cookies.refreshToken;
    await authService.logout(accessToken, refreshToken);

    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully' });
  }

  async forgotPassword(req: Request, res: Response) {
    await authService.forgotPassword(req.body);
    res.json({
      success: true,
      message: 'If that email exists, a reset link has been sent',
    });
  }

  async resetPassword(req: Request, res: Response) {
    await authService.resetPassword(req.body);
    res.json({ success: true, message: 'Password reset successfully' });
  }

  async changePassword(req: Request, res: Response) {
    await authService.changePassword(req.user!.id, req.body);
    res.json({ success: true, message: 'Password changed successfully' });
  }

  async getMe(req: Request, res: Response) {
    const user = await authService.getMe(req.user!.id);
    res.json({ success: true, data: user });
  }
}

export const authController = new AuthController();
