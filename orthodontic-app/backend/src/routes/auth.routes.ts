import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticateToken, requireAdmin, requireDoctorOrAdmin } from '../middleware/auth.js';
import { validate, validateBody, validateParams } from '../utils/validators.js';
import {
  createUserSchema,
  updateUserSchema,
  loginSchema,
  changePasswordSchema,
  idParamSchema,
} from '../utils/validators.js';

const router = Router();

// Public routes (no authentication required)
router.post('/register', validateBody(createUserSchema), AuthController.register);
router.post('/login', validateBody(loginSchema), AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', AuthController.logout);
router.get('/status', AuthController.getAuthStatus);

// Password reset routes (public)
router.post('/request-password-reset', AuthController.requestPasswordReset);
router.post('/reset-password', AuthController.resetPassword);

// Protected routes (authentication required)
router.use(authenticateToken);

// User profile routes
router.get('/profile', AuthController.getProfile);
router.put('/profile', validateBody(updateUserSchema), AuthController.updateProfile);
router.post('/change-password', validateBody(changePasswordSchema), AuthController.changePassword);
router.get('/validate-session', AuthController.validateSession);
router.get('/permissions', AuthController.getPermissions);

// Admin-only routes
router.get('/users', requireAdmin, AuthController.getAllUsers);
router.post('/users', requireAdmin, validateBody(createUserSchema), AuthController.createUser);
router.put('/users/:userId/role', requireAdmin, validateParams(idParamSchema), AuthController.updateUserRole);
router.delete('/users/:userId', requireAdmin, validateParams(idParamSchema), AuthController.deactivateUser);
router.get('/system-info', requireAdmin, AuthController.getSystemInfo);

export default router;