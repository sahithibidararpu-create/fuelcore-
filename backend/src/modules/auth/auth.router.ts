import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { authLimiter } from '../../middleware/rateLimiter';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from './auth.schemas';

const router = Router();

// Public routes
router.post('/login', authLimiter, validate(loginSchema), authController.login.bind(authController));
router.post('/refresh', authController.refresh.bind(authController));
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword.bind(authController));
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword.bind(authController));

// Protected routes
router.use(authenticate);
router.get('/me', authController.getMe.bind(authController));
router.patch('/change-password', validate(changePasswordSchema), authController.changePassword.bind(authController));
router.post('/logout', authController.logout.bind(authController));

// Admin only
router.post(
  '/register',
  requireRole('SUPER_ADMIN'),
  validate(registerSchema),
  authController.register.bind(authController)
);

export default router;
