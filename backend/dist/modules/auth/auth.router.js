"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const validate_1 = require("../../middleware/validate");
const rateLimiter_1 = require("../../middleware/rateLimiter");
const auth_schemas_1 = require("./auth.schemas");
const router = (0, express_1.Router)();
// Public routes
router.post('/login', rateLimiter_1.authLimiter, (0, validate_1.validate)(auth_schemas_1.loginSchema), auth_controller_1.authController.login.bind(auth_controller_1.authController));
router.post('/refresh', auth_controller_1.authController.refresh.bind(auth_controller_1.authController));
router.post('/forgot-password', rateLimiter_1.authLimiter, (0, validate_1.validate)(auth_schemas_1.forgotPasswordSchema), auth_controller_1.authController.forgotPassword.bind(auth_controller_1.authController));
router.post('/reset-password', (0, validate_1.validate)(auth_schemas_1.resetPasswordSchema), auth_controller_1.authController.resetPassword.bind(auth_controller_1.authController));
// Protected routes
router.use(auth_1.authenticate);
router.get('/me', auth_controller_1.authController.getMe.bind(auth_controller_1.authController));
router.patch('/change-password', (0, validate_1.validate)(auth_schemas_1.changePasswordSchema), auth_controller_1.authController.changePassword.bind(auth_controller_1.authController));
router.post('/logout', auth_controller_1.authController.logout.bind(auth_controller_1.authController));
// Admin only
router.post('/register', (0, rbac_1.requireRole)('SUPER_ADMIN'), (0, validate_1.validate)(auth_schemas_1.registerSchema), auth_controller_1.authController.register.bind(auth_controller_1.authController));
exports.default = router;
//# sourceMappingURL=auth.router.js.map