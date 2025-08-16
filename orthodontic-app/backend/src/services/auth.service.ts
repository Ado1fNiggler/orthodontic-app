import { ConflictError, UnauthorizedError, BadRequestError } from '../utils/error.handler.js';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth.js';
import { logger, authLogger } from '../utils/logger.js';


export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'ADMIN' | 'DOCTOR' | 'ASSISTANT';
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  /**
   * Register a new user
   */
  static async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() }
      });

      if (existingUser) {
        throw new ConflictError('User with this email already exists');
      }

      // Hash password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
      const hashedPassword = await bcrypt.hash(data.password, saltRounds);

      // Create user
      const user = await prisma.user.create({
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
      const accessToken = generateToken(user.id, user.email);
      const refreshToken = generateRefreshToken(user.id);

      authLogger.info('User registered', {
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        user,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      authLogger.error('Registration failed', {
        email: data.email,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Login user
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
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
        throw new UnauthorizedError('Invalid email or password');
      }

      if (!user.isActive) {
        throw new UnauthorizedError('Account is disabled');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
      if (!isPasswordValid) {
        authLogger.warn('Failed login attempt', {
          email: credentials.email,
          reason: 'Invalid password',
        });
        throw new UnauthorizedError('Invalid email or password');
      }

      // Generate tokens
      const accessToken = generateToken(user.id, user.email);
      const refreshToken = generateRefreshToken(user.id);

      authLogger.info('User logged in', {
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
    } catch (error) {
      authLogger.error('Login failed', {
        email: credentials.email,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);
      
      if (!decoded.userId || decoded.type !== 'refresh') {
        throw new UnauthorizedError('Invalid refresh token');
      }

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          isActive: true,
        }
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedError('User not found or inactive');
      }

      // Generate new tokens
      const newAccessToken = generateToken(user.id, user.email);
      const newRefreshToken = generateRefreshToken(user.id);

      authLogger.info('Token refreshed', {
        userId: user.id,
        email: user.email,
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      authLogger.error('Token refresh failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Change user password
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      // Get user with password
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          password: true,
        }
      });

      if (!user) {
        throw new BadRequestError('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new BadRequestError('Current password is incorrect');
      }

      // Hash new password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword }
      });

      authLogger.info('Password changed', {
        userId: user.id,
        email: user.email,
      });
    } catch (error) {
      authLogger.error('Password change failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get user profile
   */
  static async getProfile(userId: string) {
    try {
      const user = await prisma.user.findUnique({
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
        throw new BadRequestError('User not found');
      }

      return user;
    } catch (error) {
      logger.error('Get profile failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string,
    updateData: {
      firstName?: string;
      lastName?: string;
      email?: string;
    }
  ) {
    try {
      // If email is being updated, check if it's already taken
      if (updateData.email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            email: updateData.email.toLowerCase(),
            NOT: { id: userId }
          }
        });

        if (existingUser) {
          throw new ConflictError('Email is already taken');
        }

        updateData.email = updateData.email.toLowerCase();
      }

      const updatedUser = await prisma.user.update({
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

      authLogger.info('Profile updated', {
        userId: updatedUser.id,
        email: updatedUser.email,
        updatedFields: Object.keys(updateData),
      });

      return updatedUser;
    } catch (error) {
      authLogger.error('Profile update failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Deactivate user account
   */
  static async deactivateUser(userId: string): Promise<void> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
        select: {
          id: true,
          email: true,
        }
      });

      authLogger.info('User deactivated', {
        userId: user.id,
        email: user.email,
      });
    } catch (error) {
      authLogger.error('User deactivation failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get all users (admin only)
   */
  static async getAllUsers(
    page: number = 1,
    limit: number = 20,
    includeInactive: boolean = false
  ) {
    try {
      const skip = (page - 1) * limit;
      
      const where = includeInactive ? {} : { isActive: true };

      const [users, total] = await Promise.all([
        prisma.user.findMany({
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
        prisma.user.count({ where })
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
    } catch (error) {
      logger.error('Get all users failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Create user (admin only)
   */
  static async createUser(data: RegisterData): Promise<any> {
    try {
      return await this.register(data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user role (admin only)
   */
  static async updateUserRole(
    userId: string,
    role: 'ADMIN' | 'DOCTOR' | 'ASSISTANT'
  ): Promise<void> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: {
          id: true,
          email: true,
          role: true,
        }
      });

      authLogger.info('User role updated', {
        userId: user.id,
        email: user.email,
        newRole: role,
      });
    } catch (error) {
      authLogger.error('User role update failed', {
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
  static async validateSession(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isActive: true }
      });

      return user ? user.isActive : false;
    } catch (error) {
      logger.error('Session validation failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }
}

export default AuthService;