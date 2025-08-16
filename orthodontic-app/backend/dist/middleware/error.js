"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalServerError = exports.ValidationError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = exports.createError = exports.asyncHandler = exports.notFoundHandler = exports.errorHandler = exports.CustomError = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const logger_js_1 = require("../utils/logger.js");
// Custom error class
class CustomError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.CustomError = CustomError;
// Main error handler middleware
const errorHandler = (error, req, res, next) => {
    let statusCode = 500;
    let message = 'Internal Server Error';
    let details = undefined;
    // Log the error
    logger_js_1.logger.error('Error occurred:', {
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
    else if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        // Prisma database errors
        const prismaError = handlePrismaError(error);
        statusCode = prismaError.statusCode;
        message = prismaError.message;
        details = prismaError.details;
    }
    else if (error instanceof client_1.Prisma.PrismaClientValidationError) {
        // Prisma validation errors
        statusCode = 400;
        message = 'Invalid data provided';
        details = process.env.NODE_ENV === 'development' ? error.message : undefined;
    }
    else if (error instanceof zod_1.ZodError) {
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
    else if (error.statusCode) {
        // Custom errors with statusCode
        statusCode = error.statusCode;
        message = error.message;
    }
    // Build error response
    const errorResponse = {
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
exports.errorHandler = errorHandler;
// Handle Prisma-specific errors
const handlePrismaError = (error) => {
    switch (error.code) {
        case 'P2002':
            // Unique constraint violation
            const field = error.meta?.target;
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
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method,
    });
};
exports.notFoundHandler = notFoundHandler;
// Async error wrapper
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
// Create custom errors
const createError = (message, statusCode = 500) => {
    return new CustomError(message, statusCode);
};
exports.createError = createError;
// Common error creators
const BadRequestError = (message = 'Bad Request') => new CustomError(message, 400);
exports.BadRequestError = BadRequestError;
const UnauthorizedError = (message = 'Unauthorized') => new CustomError(message, 401);
exports.UnauthorizedError = UnauthorizedError;
const ForbiddenError = (message = 'Forbidden') => new CustomError(message, 403);
exports.ForbiddenError = ForbiddenError;
const NotFoundError = (message = 'Not Found') => new CustomError(message, 404);
exports.NotFoundError = NotFoundError;
const ConflictError = (message = 'Conflict') => new CustomError(message, 409);
exports.ConflictError = ConflictError;
const ValidationError = (message = 'Validation Error') => new CustomError(message, 422);
exports.ValidationError = ValidationError;
const InternalServerError = (message = 'Internal Server Error') => new CustomError(message, 500);
exports.InternalServerError = InternalServerError;
