"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_js_1 = require("../controllers/auth.controller.js");
const auth_js_1 = require("../middleware/auth.js");
const validators_js_1 = require("../utils/validators.js");
const validators_js_2 = require("../utils/validators.js");
const router = (0, express_1.Router)();
// Public routes (no authentication required)
router.post('/register', (0, validators_js_1.validateBody)(validators_js_2.createUserSchema), auth_controller_js_1.AuthController.register);
router.post('/login', (0, validators_js_1.validateBody)(validators_js_2.loginSchema), auth_controller_js_1.AuthController.login);
router.post('/refresh-token', auth_controller_js_1.AuthController.refreshToken);
router.post('/logout', auth_controller_js_1.AuthController.logout);
router.get('/status', auth_controller_js_1.AuthController.getAuthStatus);
// Password reset routes (public)
router.post('/request-password-reset', auth_controller_js_1.AuthController.requestPasswordReset);
router.post('/reset-password', auth_controller_js_1.AuthController.resetPassword);
// Protected routes (authentication required)
router.use(auth_js_1.authenticateToken);
// User profile routes
router.get('/profile', auth_controller_js_1.AuthController.getProfile);
router.put('/profile', (0, validators_js_1.validateBody)(validators_js_2.updateUserSchema), auth_controller_js_1.AuthController.updateProfile);
router.post('/change-password', (0, validators_js_1.validateBody)(validators_js_2.changePasswordSchema), auth_controller_js_1.AuthController.changePassword);
router.get('/validate-session', auth_controller_js_1.AuthController.validateSession);
router.get('/permissions', auth_controller_js_1.AuthController.getPermissions);
// Admin-only routes
router.get('/users', auth_js_1.requireAdmin, auth_controller_js_1.AuthController.getAllUsers);
router.post('/users', auth_js_1.requireAdmin, (0, validators_js_1.validateBody)(validators_js_2.createUserSchema), auth_controller_js_1.AuthController.createUser);
router.put('/users/:userId/role', auth_js_1.requireAdmin, (0, validators_js_1.validateParams)(validators_js_2.idParamSchema), auth_controller_js_1.AuthController.updateUserRole);
router.delete('/users/:userId', auth_js_1.requireAdmin, (0, validators_js_1.validateParams)(validators_js_2.idParamSchema), auth_controller_js_1.AuthController.deactivateUser);
router.get('/system-info', auth_js_1.requireAdmin, auth_controller_js_1.AuthController.getSystemInfo);
exports.default = router;
