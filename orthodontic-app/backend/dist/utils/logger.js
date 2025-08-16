"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContextLogger = exports.logDebug = exports.logWarn = exports.logInfo = exports.morganStream = exports.createTimer = exports.logSecurity = exports.logPerformance = exports.logEmail = exports.logUpload = exports.logAuth = exports.logDatabaseQuery = exports.logError = exports.logRequest = exports.securityLogger = exports.perfLogger = exports.apiLogger = exports.emailLogger = exports.uploadLogger = exports.authLogger = exports.dbLogger = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
// Define log levels
const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
// Define log colors
const logColors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};
// Add colors to winston
winston_1.default.addColors(logColors);
// Define log format
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`));
// Define file format (without colors)
const fileFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json());
// Define transports
const transports = [
    // Console transport
    new winston_1.default.transports.Console({
        format: logFormat,
        level: process.env.LOG_LEVEL || 'info',
    }),
];
// Add file transports in production or when LOG_FILE is specified
if (process.env.NODE_ENV === 'production' || process.env.LOG_FILE) {
    const logsDir = path_1.default.dirname(process.env.LOG_FILE || 'logs/app.log');
    // Ensure logs directory exists
    Promise.resolve().then(() => __importStar(require('fs'))).then(fs => {
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
    });
    // Error log file
    transports.push(new winston_1.default.transports.File({
        filename: process.env.LOG_FILE?.replace('.log', '-error.log') || 'logs/error.log',
        level: 'error',
        format: fileFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }) // <--- ΔΙΟΡΘΩΣΗ ΕΔΩ
    );
    // Combined log file
    transports.push(new winston_1.default.transports.File({
        filename: process.env.LOG_FILE || 'logs/app.log',
        format: fileFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }) // <--- ΔΙΟΡΘΩΣΗ ΕΔΩ
    );
    // HTTP requests log file
    transports.push(new winston_1.default.transports.File({
        filename: process.env.LOG_FILE?.replace('.log', '-http.log') || 'logs/http.log',
        level: 'http',
        format: fileFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 3,
    }) // <--- ΔΙΟΡΘΩΣΗ ΕΔΩ
    );
}
// Create the logger
exports.logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels: logLevels,
    format: fileFormat,
    transports,
    exitOnError: false,
});
// Database logger
exports.dbLogger = exports.logger.child({ service: 'database' });
// Auth logger
exports.authLogger = exports.logger.child({ service: 'auth' });
// File upload logger
exports.uploadLogger = exports.logger.child({ service: 'upload' });
// Email logger
exports.emailLogger = exports.logger.child({ service: 'email' });
// API logger
exports.apiLogger = exports.logger.child({ service: 'api' });
// Performance logger
exports.perfLogger = exports.logger.child({ service: 'performance' });
// Security logger
exports.securityLogger = exports.logger.child({ service: 'security' });
// Custom logging methods
const logRequest = (req, res, responseTime) => {
    const logData = {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        responseTime: responseTime ? `${responseTime}ms` : undefined,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id,
        contentLength: res.get('Content-Length'),
    };
    if (res.statusCode >= 400) {
        exports.logger.warn('HTTP Request Error', logData);
    }
    else {
        exports.logger.http('HTTP Request', logData);
    }
};
exports.logRequest = logRequest;
const logError = (error, context) => {
    exports.logger.error('Application Error', {
        message: error.message,
        stack: error.stack,
        ...context,
    });
};
exports.logError = logError;
const logDatabaseQuery = (query, duration, error) => {
    if (error) {
        exports.dbLogger.error('Database Query Error', {
            query: query.substring(0, 200), // Limit query length
            duration: duration ? `${duration}ms` : undefined,
            error: error.message,
        });
    }
    else {
        exports.dbLogger.debug('Database Query', {
            query: query.substring(0, 200),
            duration: duration ? `${duration}ms` : undefined,
        });
    }
};
exports.logDatabaseQuery = logDatabaseQuery;
const logAuth = (action, userId, details) => {
    exports.authLogger.info(`Auth: ${action}`, {
        userId,
        ...details,
    });
};
exports.logAuth = logAuth;
const logUpload = (action, filename, userId, details) => {
    exports.uploadLogger.info(`Upload: ${action}`, {
        filename,
        userId,
        ...details,
    });
};
exports.logUpload = logUpload;
const logEmail = (action, recipient, details) => {
    exports.emailLogger.info(`Email: ${action}`, {
        recipient,
        ...details,
    });
};
exports.logEmail = logEmail;
const logPerformance = (operation, duration, details) => {
    exports.perfLogger.info(`Performance: ${operation}`, {
        duration: `${duration}ms`,
        ...details,
    });
};
exports.logPerformance = logPerformance;
const logSecurity = (event, details) => {
    exports.securityLogger.warn(`Security: ${event}`, details);
};
exports.logSecurity = logSecurity;
// Performance timing utility
const createTimer = (label) => {
    const start = Date.now();
    return {
        end: (details) => {
            const duration = Date.now() - start;
            (0, exports.logPerformance)(label, duration, details);
            return duration;
        }
    };
};
exports.createTimer = createTimer;
// Stream for Morgan HTTP logger
exports.morganStream = {
    write: (message) => {
        exports.logger.http(message.trim());
    },
};
// Structured logging helpers
const logInfo = (message, data) => {
    exports.logger.info(message, data);
};
exports.logInfo = logInfo;
const logWarn = (message, data) => {
    exports.logger.warn(message, data);
};
exports.logWarn = logWarn;
const logDebug = (message, data) => {
    exports.logger.debug(message, data);
};
exports.logDebug = logDebug;
// Context logger for request-specific logging
const createContextLogger = (context) => {
    return {
        info: (message, data) => exports.logger.info(message, { ...context, ...data }),
        warn: (message, data) => exports.logger.warn(message, { ...context, ...data }),
        error: (message, data) => exports.logger.error(message, { ...context, ...data }),
        debug: (message, data) => exports.logger.debug(message, { ...context, ...data }),
    };
};
exports.createContextLogger = createContextLogger;
// Export the main logger as default
exports.default = exports.logger;
