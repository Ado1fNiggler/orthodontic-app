"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_js_1 = require("../services/auth.service.js");
const error_js_1 = require("../middleware/error.js");
const logger_js_1 = require("../utils/logger.js");
class AuthController {
}
exports.AuthController = AuthController;
_a = AuthController;
/**
 * Register new user
 */
AuthController.register = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { email, password, firstName, lastName, role } = req.body;
    const result = await auth_service_js_1.AuthService.register({
        email,
        password,
        firstName,
        lastName,
        role,
    });
    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
    logger_js_1.authLogger.info('User registered successfully', {
        userId: result.user.id,
        email: result.user.email,
        ip: req.ip,
    });
    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
            user: result.user,
            accessToken: result.accessToken,
        }
    });
});
/**
 * Login user
 */
AuthController.login = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    const result = await auth_service_js_1.AuthService.login({ email, password });
    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
    logger_js_1.authLogger.info('User logged in successfully', {
        userId: result.user.id,
        email: result.user.email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
    });
    res.json({
        success: true,
        message: 'Login successful',
        data: {
            user: result.user,
            accessToken: result.accessToken,
        }
    });
});
/**
 * Logout user
 */
AuthController.logout = (0, error_js_1.asyncHandler)(async (req, res) => {
    // Clear refresh token cookie
    res.clearCookie('refreshToken');
    logger_js_1.authLogger.info('User logged out', {
        userId: req.user?.id,
        ip: req.ip,
    });
    res.json({
        success: true,
        message: 'Logout successful'
    });
});
/**
 * Refresh access token
 */
AuthController.refreshToken = (0, error_js_1.asyncHandler)(async (req, res) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({
            success: false,
            message: 'Refresh token not provided'
        });
    }
    const result = await auth_service_js_1.AuthService.refreshToken(refreshToken);
    // Set new refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
    res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
            accessToken: result.accessToken,
        }
    });
});
/**
 * Get current user profile
 */
AuthController.getProfile = (0, error_js_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const profile = await auth_service_js_1.AuthService.getProfile(userId);
    res.json({
        success: true,
        message: 'Profile retrieved successfully',
        data: { user: profile }
    });
});
/**
 * Update user profile
 */
AuthController.updateProfile = (0, error_js_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { firstName, lastName, email } = req.body;
    const updatedUser = await auth_service_js_1.AuthService.updateProfile(userId, {
        firstName,
        lastName,
        email,
    });
    res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user: updatedUser }
    });
});
/**
 * Change password
 */
AuthController.changePassword = (0, error_js_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    await auth_service_js_1.AuthService.changePassword(userId, currentPassword, newPassword);
    logger_js_1.authLogger.info('Password changed successfully', {
        userId,
        ip: req.ip,
    });
    res.json({
        success: true,
        message: 'Password changed successfully'
    });
});
/**
 * Get all users (Admin only)
 */
AuthController.getAllUsers = (0, error_js_1.asyncHandler)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const includeInactive = req.query.includeInactive === 'true';
    const result = await auth_service_js_1.AuthService.getAllUsers(page, limit, includeInactive);
    res.json({
        success: true,
        message: 'Users retrieved successfully',
        data: result
    });
});
/**
 * Create new user (Admin only)
 */
AuthController.createUser = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { email, password, firstName, lastName, role } = req.body;
    const result = await auth_service_js_1.AuthService.createUser({
        email,
        password,
        firstName,
        lastName,
        role,
    });
    logger_js_1.authLogger.info('User created by admin', {
        createdUserId: result.user.id,
        createdBy: req.user.id,
        email: result.user.email,
    });
    res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
            user: result.user,
            // Don't return tokens for admin-created users
        }
    });
});
/**
 * Update user role (Admin only)
 */
AuthController.updateUserRole = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;
    await auth_service_js_1.AuthService.updateUserRole(userId, role);
    logger_js_1.authLogger.info('User role updated by admin', {
        targetUserId: userId,
        newRole: role,
        updatedBy: req.user.id,
    });
    res.json({
        success: true,
        message: 'User role updated successfully'
    });
});
/**
 * Deactivate user (Admin only)
 */
AuthController.deactivateUser = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    await auth_service_js_1.AuthService.deactivateUser(userId);
    logger_js_1.authLogger.info('User deactivated by admin', {
        targetUserId: userId,
        deactivatedBy: req.user.id,
    });
    res.json({
        success: true,
        message: 'User deactivated successfully'
    });
});
/**
 * Validate session
 */
AuthController.validateSession = (0, error_js_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const isValid = await auth_service_js_1.AuthService.validateSession(userId);
    if (!isValid) {
        return res.status(401).json({
            success: false,
            message: 'Session is invalid'
        });
    }
    res.json({
        success: true,
        message: 'Session is valid',
        data: {
            user: {
                id: req.user.id,
                email: req.user.email,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                role: req.user.role,
            }
        }
    });
});
/**
 * Get authentication status
 */
AuthController.getAuthStatus = (0, error_js_1.asyncHandler)(async (req, res) => {
    // This endpoint can be called without authentication
    const isAuthenticated = !!req.user;
    res.json({
        success: true,
        data: {
            isAuthenticated,
            user: isAuthenticated ? {
                id: req.user.id,
                email: req.user.email,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                role: req.user.role,
            } : null
        }
    });
});
/**
 * Request password reset
 */
AuthController.requestPasswordReset = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { email } = req.body;
    // TODO: Implement password reset functionality
    // This would involve generating a secure token, storing it temporarily,
    // and sending a reset email to the user
    logger_js_1.authLogger.info('Password reset requested', {
        email,
        ip: req.ip,
    });
    // Always return success to prevent email enumeration
    res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
    });
});
/**
 * Reset password with token
 */
AuthController.resetPassword = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { token, newPassword } = req.body;
    // TODO: Implement password reset with token functionality
    // This would involve validating the token and updating the password
    res.json({
        success: true,
        message: 'Password reset successfully'
    });
});
/**
 * Get user permissions/capabilities
 */
AuthController.getPermissions = (0, error_js_1.asyncHandler)(async (req, res) => {
    const userRole = req.user.role;
    // Define role-based permissions
    const permissions = {
        ADMIN: [
            'manage_users',
            'manage_patients',
            'manage_treatments',
            'manage_photos',
            'manage_appointments',
            'manage_payments',
            'view_reports',
            'manage_settings',
            'sync_data',
        ],
        DOCTOR: [
            'manage_patients',
            'manage_treatments',
            'manage_photos',
            'manage_appointments',
            'manage_payments',
            'view_reports',
        ],
        ASSISTANT: [
            'view_patients',
            'manage_appointments',
            'upload_photos',
            'view_reports',
        ],
    };
    res.json({
        success: true,
        data: {
            role: userRole,
            permissions: permissions[userRole] || [],
        }
    });
});
/**
 * Get system info (for debugging)
 */
AuthController.getSystemInfo = (0, error_js_1.asyncHandler)(async (req, res) => {
    // Only allow admins to see system info
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            message: 'Insufficient permissions'
        });
    }
    const systemInfo = {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
    };
    res.json({
        success: true,
        data: systemInfo
    });
});
exports.default = AuthController;
