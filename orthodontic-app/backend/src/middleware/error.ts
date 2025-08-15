import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// Custom error class
export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error response interface
interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  details?: any;
  timestamp: string;
  path: string;
  method: string;
}

// Main error handler middleware
export const errorHandler = (
  error: Error | AppError | any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: any = undefined;

  // Log the error
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // Handle different types of errors
  if (error instanceof CustomError) {
    // Custom application errors
    statusCode = error.statusCode;
    message = error.message;
  } 
  else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Prisma database errors
    const prismaError = handlePrismaError(error);
    statusCode = prismaError.statusCode;
    message = prismaError.message;
    details = prismaError.details;
  }
  else if (error instanceof Prisma.PrismaClientValidationError) {
    // Prisma validation errors
    statusCode = 400;
    message = 'Invalid data provided';
    details = process.env.NODE_ENV === 'development' ? error.message : undefined;
  }
  else if (error instanceof ZodError) {
    // Zod validation errors
    statusCode = 400;
    message = 'Validation failed';
    details = {
      issues: error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }))
    };
  }
  else if (error.name === 'ValidationError') {
    // General validation errors
    statusCode = 400;
    message = 'Validation failed';
    details = error.details || error.message;
  }
  else if (error.name === 'UnauthorizedError' || error.name === 'JsonWebTokenError') {
    // JWT/Auth errors
    statusCode = 401;
    message = 'Authentication failed';
  }
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }
  else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Access forbidden';
  }
  else if (error.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Resource not found';
  }
  else if (error.name === 'ConflictError') {
    statusCode = 409;
    message = 'Resource conflict';
  }
  else if (error.code === 'ENOENT') {
    statusCode = 404;
    message = 'File not found';
  }
  else if (error.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'Service unavailable';
  }
  else if (error.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request entity too large';
  }
  else if (error.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON';
  }
  else if ((error as AppError).statusCode) {
    // Custom errors with statusCode
    statusCode = (error as AppError).statusCode!;
    message = error.message;
  }

  // Build error response
  const errorResponse: ErrorResponse = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  };

  // Add details in development mode
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error = error.message;
    if (details) {
      errorResponse.details = details;
    }
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

// Handle Prisma-specific errors
const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError) => {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const field = error.meta?.target as string[] | undefined;
      return {
        statusCode: 409,
        message: `A record with this ${field?.[0] || 'value'} already exists`,
        details: { field: field?.[0], constraint: 'unique' }
      };

    case 'P2014':
      // Invalid ID
      return {
        statusCode: 400,
        message: 'Invalid ID provided',
        details: { constraint: 'invalid_id' }
      };

    case 'P2003':
      // Foreign key constraint violation
      return {
        statusCode: 400,
        message: 'Invalid reference to related record',
        details: { constraint: 'foreign_key' }
      };

    case 'P2025':
      // Record not found
      return {
        statusCode: 404,
        message: 'Record not found',
        details: { constraint: 'not_found' }
      };

    case 'P2000':
      // Value too long
      return {
        statusCode: 400,
        message: 'Value too long for field',
        details: { constraint: 'value_too_long' }
      };

    case 'P2001':
      // Record does not exist
      return {
        statusCode: 404,
        message: 'Record does not exist',
        details: { constraint: 'not_found' }
      };

    case 'P2015':
      // Related record not found
      return {
        statusCode: 400,
        message: 'Related record not found',
        details: { constraint: 'related_not_found' }
      };

    case 'P2016':
      // Query interpretation error
      return {
        statusCode: 400,
        message: 'Query interpretation error',
        details: { constraint: 'query_error' }
      };

    case 'P2017':
      // Records not connected
      return {
        statusCode: 400,
        message: 'Records not connected',
        details: { constraint: 'not_connected' }
      };

    case 'P2018':
      // Required connected records not found
      return {
        statusCode: 400,
        message: 'Required connected records not found',
        details: { constraint: 'required_connected_not_found' }
      };

    default:
      return {
        statusCode: 500,
        message: 'Database error occurred',
        details: process.env.NODE_ENV === 'development' ? { code: error.code, meta: error.meta } : undefined
      };
  }
};

// 404 handler for unmatched routes
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Create custom errors
export const createError = (message: string, statusCode: number = 500) => {
  return new CustomError(message, statusCode);
};

// Common error creators
export const BadRequestError = (message: string = 'Bad Request') => 
  new CustomError(message, 400);

export const UnauthorizedError = (message: string = 'Unauthorized') => 
  new CustomError(message, 401);

export const ForbiddenError = (message: string = 'Forbidden') => 
  new CustomError(message, 403);

export const NotFoundError = (message: string = 'Not Found') => 
  new CustomError(message, 404);

export const ConflictError = (message: string = 'Conflict') => 
  new CustomError(message, 409);

export const ValidationError = (message: string = 'Validation Error') => 
  new CustomError(message, 422);

export const InternalServerError = (message: string = 'Internal Server Error') => 
  new CustomError(message, 500);