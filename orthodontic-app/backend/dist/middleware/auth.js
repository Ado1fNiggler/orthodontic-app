"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateSession = exports.authenticateApiKey = exports.optionalAuth = exports.verifyRefreshToken = exports.generateRefreshToken = exports.generateToken = exports.requireDoctorOrAdmin = exports.requireAdmin = exports.requireRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_js_1 = require("../config/database.js");
const logger_js_1 = require("../utils/logger.js");
const error_js_1 = require("./error.js");
// JWT token verification middleware
exports.authenticateToken = (0, error_js_1.asyncHandler)(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
    }
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        logger_js_1.logger.error('JWT_SECRET is not defined');
        return res.status(500).json({ success: false, message: 'Server configuration error' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        const user = await database_js_1.prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user || !user.isActive) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        req.user = { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role };
        next();
    }
    catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
});
// Role-based authorization middleware
const requireRole = (roles) => {
    return (req, res, next) => {
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
exports.requireRole = requireRole;
exports.requireAdmin = (0, exports.requireRole)('ADMIN');
exports.requireDoctorOrAdmin = (0, exports.requireRole)(['DOCTOR', 'ADMIN']);
// Generate JWT token
const generateToken = (userId, email) => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error('JWT_SECRET is not defined');
    }
    const jwtExpire = process.env.JWT_EXPIRE || '7d';
    // @ts-ignore - TypeScript has issues with jwt.sign overloads
    return jsonwebtoken_1.default.sign({ userId, email }, jwtSecret, { expiresIn: jwtExpire });
};
exports.generateToken = generateToken;
// Generate refresh token
const generateRefreshToken = (userId) => {
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;
    if (!refreshSecret) {
        throw new Error('REFRESH_TOKEN_SECRET or JWT_SECRET is not defined');
    }
    // @ts-ignore - TypeScript has issues with jwt.sign overloads
    return jsonwebtoken_1.default.sign({ userId, type: 'refresh' }, refreshSecret, { expiresIn: '30d' });
};
exports.generateRefreshToken = generateRefreshToken;
// Verify refresh token
const verifyRefreshToken = (token) => {
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;
    if (!refreshSecret) {
        throw new Error('REFRESH_TOKEN_SECRET or JWT_SECRET is not defined');
    }
    return jsonwebtoken_1.default.verify(token, refreshSecret);
};
exports.verifyRefreshToken = verifyRefreshToken;
// Optional authentication
exports.optionalAuth = (0, error_js_1.asyncHandler)(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
        try {
            const jwtSecret = process.env.JWT_SECRET;
            if (jwtSecret) {
                const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
                const user = await database_js_1.prisma.user.findUnique({ where: { id: decoded.userId } });
                if (user && user.isActive) {
                    req.user = { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role };
                }
            }
        }
        catch (error) {
            // Ignore invalid token for optional auth
        }
    }
    next();
});
// API Key authentication
const authenticateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    const validApiKey = process.env.API_KEY;
    if (!validApiKey) {
        return res.status(500).json({ success: false, message: 'API key auth not configured' });
    }
    if (!apiKey || apiKey !== validApiKey) {
        return res.status(401).json({ success: false, message: 'Invalid API key' });
    }
    next();
};
exports.authenticateApiKey = authenticateApiKey;
// Session-based authentication
const authenticateSession = (req, res, next) => {
    next();
};
exports.authenticateSession = authenticateSession;
