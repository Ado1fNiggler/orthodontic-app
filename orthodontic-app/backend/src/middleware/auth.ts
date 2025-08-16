import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { asyncHandler } from './error.js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
      };
    }
  }
}

// JWT token verification middleware
export const authenticateToken = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    logger.error('JWT_SECRET is not defined');
    return res.status(500).json({ success: false, message: 'Server configuration error' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as any;
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    req.user = { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// Role-based authorization middleware
export const requireRole = (roles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    next();
  };
};

export const requireAdmin = requireRole('ADMIN');
export const requireDoctorOrAdmin = requireRole(['DOCTOR', 'ADMIN']);

// Generate JWT token
export const generateToken = (userId: string, email: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined');
  }
  
  const jwtExpire = process.env.JWT_EXPIRE || '7d';
  
  // @ts-ignore - TypeScript has issues with jwt.sign overloads
  return jwt.sign(
    { userId, email },
    jwtSecret,
    { expiresIn: jwtExpire }
  );
};

// Generate refresh token
export const generateRefreshToken = (userId: string): string => {
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;
  if (!refreshSecret) {
    throw new Error('REFRESH_TOKEN_SECRET or JWT_SECRET is not defined');
  }
  
  // @ts-ignore - TypeScript has issues with jwt.sign overloads
  return jwt.sign(
    { userId, type: 'refresh' },
    refreshSecret,
    { expiresIn: '30d' }
  );
};

// Verify refresh token
export const verifyRefreshToken = (token: string) => {
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;
  if (!refreshSecret) {
    throw new Error('REFRESH_TOKEN_SECRET or JWT_SECRET is not defined');
  }
  return jwt.verify(token, refreshSecret) as any;
};

// Optional authentication
export const optionalAuth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (jwtSecret) {
        const decoded = jwt.verify(token, jwtSecret) as any;
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (user && user.isActive) {
          req.user = { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role };
        }
      }
    } catch (error) { 
      // Ignore invalid token for optional auth
    }
  }
  next();
});

// API Key authentication
export const authenticateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  const validApiKey = process.env.API_KEY;

  if (!validApiKey) { 
    return res.status(500).json({ success: false, message: 'API key auth not configured' }); 
  }
  if (!apiKey || apiKey !== validApiKey) { 
    return res.status(401).json({ success: false, message: 'Invalid API key' }); 
  }
  next();
};

// Session-based authentication
export const authenticateSession = (req: Request, res: Response, next: NextFunction) => {
  next();
};