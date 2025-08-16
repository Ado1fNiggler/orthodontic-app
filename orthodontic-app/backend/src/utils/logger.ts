import winston from 'winston';
import path from 'path';

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
winston.addColors(logColors);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  ),
);

// Define file format (without colors)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: logFormat,
    level: process.env.LOG_LEVEL || 'info',
  }),
];

// Add file transports in production or when LOG_FILE is specified
if (process.env.NODE_ENV === 'production' || process.env.LOG_FILE) {
  const logsDir = path.dirname(process.env.LOG_FILE || 'logs/app.log');

  // Ensure logs directory exists
  import('fs').then(fs => {
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  });

  // Error log file
  transports.push(
    new winston.transports.File({
      filename: process.env.LOG_FILE?.replace('.log', '-error.log') || 'logs/error.log',
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }) as any // <--- ΔΙΟΡΘΩΣΗ ΕΔΩ
  );

  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: process.env.LOG_FILE || 'logs/app.log',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }) as any // <--- ΔΙΟΡΘΩΣΗ ΕΔΩ
  );

  // HTTP requests log file
  transports.push(
    new winston.transports.File({
      filename: process.env.LOG_FILE?.replace('.log', '-http.log') || 'logs/http.log',
      level: 'http',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 3,
    }) as any // <--- ΔΙΟΡΘΩΣΗ ΕΔΩ
  );
}

// Create the logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  format: fileFormat,
  transports,
  exitOnError: false,
});

// Database logger
export const dbLogger = logger.child({ service: 'database' });

// Auth logger
export const authLogger = logger.child({ service: 'auth' });

// File upload logger
export const uploadLogger = logger.child({ service: 'upload' });

// Email logger
export const emailLogger = logger.child({ service: 'email' });

// API logger
export const apiLogger = logger.child({ service: 'api' });

// Performance logger
export const perfLogger = logger.child({ service: 'performance' });

// Security logger
export const securityLogger = logger.child({ service: 'security' });

// Custom logging methods
export const logRequest = (req: any, res: any, responseTime?: number) => {
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
    logger.warn('HTTP Request Error', logData);
  } else {
    logger.http('HTTP Request', logData);
  }
};

export const logError = (error: Error, context?: any) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    ...context,
  });
};

export const logDatabaseQuery = (query: string, duration?: number, error?: Error) => {
  if (error) {
    dbLogger.error('Database Query Error', {
      query: query.substring(0, 200), // Limit query length
      duration: duration ? `${duration}ms` : undefined,
      error: error.message,
    });
  } else {
    dbLogger.debug('Database Query', {
      query: query.substring(0, 200),
      duration: duration ? `${duration}ms` : undefined,
    });
  }
};

export const logAuth = (action: string, userId?: string, details?: any) => {
  authLogger.info(`Auth: ${action}`, {
    userId,
    ...details,
  });
};

export const logUpload = (action: string, filename: string, userId?: string, details?: any) => {
  uploadLogger.info(`Upload: ${action}`, {
    filename,
    userId,
    ...details,
  });
};

export const logEmail = (action: string, recipient: string, details?: any) => {
  emailLogger.info(`Email: ${action}`, {
    recipient,
    ...details,
  });
};

export const logPerformance = (operation: string, duration: number, details?: any) => {
  perfLogger.info(`Performance: ${operation}`, {
    duration: `${duration}ms`,
    ...details,
  });
};

export const logSecurity = (event: string, details?: any) => {
  securityLogger.warn(`Security: ${event}`, details);
};

// Performance timing utility
export const createTimer = (label: string) => {
  const start = Date.now();

  return {
    end: (details?: any) => {
      const duration = Date.now() - start;
      logPerformance(label, duration, details);
      return duration;
    }
  };
};

// Stream for Morgan HTTP logger
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Structured logging helpers
export const logInfo = (message: string, data?: any) => {
  logger.info(message, data);
};

export const logWarn = (message: string, data?: any) => {
  logger.warn(message, data);
};

export const logDebug = (message: string, data?: any) => {
  logger.debug(message, data);
};

// Context logger for request-specific logging
export const createContextLogger = (context: any) => {
  return {
    info: (message: string, data?: any) => logger.info(message, { ...context, ...data }),
    warn: (message: string, data?: any) => logger.warn(message, { ...context, ...data }),
    error: (message: string, data?: any) => logger.error(message, { ...context, ...data }),
    debug: (message: string, data?: any) => logger.debug(message, { ...context, ...data }),
  };
};

// Export the main logger as default
export default logger;