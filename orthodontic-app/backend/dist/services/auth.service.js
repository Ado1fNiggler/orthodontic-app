"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const error_handler_js_1 = require("../utils/error.handler.js");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_js_1 = require("../config/database.js");
const auth_js_1 = require("../middleware/auth.js");
const logger_js_1 = require("../utils/logger.js");
class AuthService {
    /**
     * Register a new user
     */
    static async register(data) {
        try {
            // Check if user already exists
            const existingUser = await database_js_1.prisma.user.findUnique({
                where: { email: data.email.toLowerCase() }
            });
            if (existingUser) {
                throw new error_handler_js_1.ConflictError('User with this email already exists');
            }
            // Hash password
            const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
            const hashedPassword = await bcryptjs_1.default.hash(data.password, saltRounds);
            // Create user
            const user = await database_js_1.prisma.user.create({
                data: {
                    email: data.email.toLowerCase(),
                    password: hashedPassword,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    role: data.role || 'DOCTOR',
                    isActive: true,
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    isActive: true,
                    createdAt: true,
                }
            });
            // Generate tokens
            const accessToken = (0, auth_js_1.generateToken)(user.id, user.email);
            const refreshToken = (0, auth_js_1.generateRefreshToken)(user.id);
            logger_js_1.authLogger.info('User registered', {
                userId: user.id,
                email: user.email,
                role: user.role,
            });
            return {
                user,
                accessToken,
                refreshToken,
            };
        }
        catch (error) {
            logger_js_1.authLogger.error('Registration failed', {
                email: data.email,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Login user
     */
    static async login(credentials) {
        try {
            // Find user by email
            const user = await database_js_1.prisma.user.findUnique({
                where: { email: credentials.email.toLowerCase() },
                select: {
                    id: true,
                    email: true,
                    password: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    isActive: true,
                }
            });
            if (!user) {
                throw new error_handler_js_1.UnauthorizedError('Invalid email or password');
            }
            if (!user.isActive) {
                throw new error_handler_js_1.UnauthorizedError('Account is disabled');
            }
            // Verify password
            const isPasswordValid = await bcryptjs_1.default.compare(credentials.password, user.password);
            if (!isPasswordValid) {
                logger_js_1.authLogger.warn('Failed login attempt', {
                    email: credentials.email,
                    reason: 'Invalid password',
                });
                throw new error_handler_js_1.UnauthorizedError('Invalid email or password');
            }
            // Generate tokens
            const accessToken = (0, auth_js_1.generateToken)(user.id, user.email);
            const refreshToken = (0, auth_js_1.generateRefreshToken)(user.id);
            logger_js_1.authLogger.info('User logged in', {
                userId: user.id,
                email: user.email,
                role: user.role,
            });
            return {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    isActive: user.isActive,
                },
                accessToken,
                refreshToken,
            };
        }
        catch (error) {
            logger_js_1.authLogger.error('Login failed', {
                email: credentials.email,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Refresh access token
     */
    static async refreshToken(refreshToken) {
        try {
            // Verify refresh token
            const decoded = (0, auth_js_1.verifyRefreshToken)(refreshToken);
            if (!decoded.userId || decoded.type !== 'refresh') {
                throw new error_handler_js_1.UnauthorizedError('Invalid refresh token');
            }
            // Get user
            const user = await database_js_1.prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    email: true,
                    isActive: true,
                }
            });
            if (!user || !user.isActive) {
                throw new error_handler_js_1.UnauthorizedError('User not found or inactive');
            }
            // Generate new tokens
            const newAccessToken = (0, auth_js_1.generateToken)(user.id, user.email);
            const newRefreshToken = (0, auth_js_1.generateRefreshToken)(user.id);
            logger_js_1.authLogger.info('Token refreshed', {
                userId: user.id,
                email: user.email,
            });
            return {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            };
        }
        catch (error) {
            logger_js_1.authLogger.error('Token refresh failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Change user password
     */
    static async changePassword(userId, currentPassword, newPassword) {
        try {
            // Get user with password
            const user = await database_js_1.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    password: true,
                }
            });
            if (!user) {
                throw new error_handler_js_1.BadRequestError('User not found');
            }
            // Verify current password
            const isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                throw new error_handler_js_1.BadRequestError('Current password is incorrect');
            }
            // Hash new password
            const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
            const hashedNewPassword = await bcryptjs_1.default.hash(newPassword, saltRounds);
            // Update password
            await database_js_1.prisma.user.update({
                where: { id: userId },
                data: { password: hashedNewPassword }
            });
            logger_js_1.authLogger.info('Password changed', {
                userId: user.id,
                email: user.email,
            });
        }
        catch (error) {
            logger_js_1.authLogger.error('Password change failed', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Get user profile
     */
    static async getProfile(userId) {
        try {
            const user = await database_js_1.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                }
            });
            if (!user) {
                throw new error_handler_js_1.BadRequestError('User not found');
            }
            return user;
        }
        catch (error) {
            logger_js_1.logger.error('Get profile failed', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Update user profile
     */
    static async updateProfile(userId, updateData) {
        try {
            // If email is being updated, check if it's already taken
            if (updateData.email) {
                const existingUser = await database_js_1.prisma.user.findFirst({
                    where: {
                        email: updateData.email.toLowerCase(),
                        NOT: { id: userId }
                    }
                });
                if (existingUser) {
                    throw new error_handler_js_1.ConflictError('Email is already taken');
                }
                updateData.email = updateData.email.toLowerCase();
            }
            const updatedUser = await database_js_1.prisma.user.update({
                where: { id: userId },
                data: updateData,
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                }
            });
            logger_js_1.authLogger.info('Profile updated', {
                userId: updatedUser.id,
                email: updatedUser.email,
                updatedFields: Object.keys(updateData),
            });
            return updatedUser;
        }
        catch (error) {
            logger_js_1.authLogger.error('Profile update failed', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Deactivate user account
     */
    static async deactivateUser(userId) {
        try {
            const user = await database_js_1.prisma.user.update({
                where: { id: userId },
                data: { isActive: false },
                select: {
                    id: true,
                    email: true,
                }
            });
            logger_js_1.authLogger.info('User deactivated', {
                userId: user.id,
                email: user.email,
            });
        }
        catch (error) {
            logger_js_1.authLogger.error('User deactivation failed', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Get all users (admin only)
     */
    static async getAllUsers(page = 1, limit = 20, includeInactive = false) {
        try {
            const skip = (page - 1) * limit;
            const where = includeInactive ? {} : { isActive: true };
            const [users, total] = await Promise.all([
                database_js_1.prisma.user.findMany({
                    where,
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                        isActive: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' }
                }),
                database_js_1.prisma.user.count({ where })
            ]);
            return {
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                }
            };
        }
        catch (error) {
            logger_js_1.logger.error('Get all users failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Create user (admin only)
     */
    static async createUser(data) {
        try {
            return await this.register(data);
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Update user role (admin only)
     */
    static async updateUserRole(userId, role) {
        try {
            const user = await database_js_1.prisma.user.update({
                where: { id: userId },
                data: { role },
                select: {
                    id: true,
                    email: true,
                    role: true,
                }
            });
            logger_js_1.authLogger.info('User role updated', {
                userId: user.id,
                email: user.email,
                newRole: role,
            });
        }
        catch (error) {
            logger_js_1.authLogger.error('User role update failed', {
                userId,
                role,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Validate user session
     */
    static async validateSession(userId) {
        try {
            const user = await database_js_1.prisma.user.findUnique({
                where: { id: userId },
                select: { isActive: true }
            });
            return user ? user.isActive : false;
        }
        catch (error) {
            logger_js_1.logger.error('Session validation failed', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }
}
exports.AuthService = AuthService;
exports.default = AuthService;
