"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.checkDatabaseHealth = exports.disconnectDatabases = exports.connectMySQL = exports.connectPostgreSQL = void 0;
const client_1 = require("@prisma/client");
const promise_1 = require("mysql2/promise");
const logger_js_1 = require("../utils/logger.js");
// Prisma client for PostgreSQL (main database)
const prisma = new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});
exports.prisma = prisma;
// MySQL connection for legacy booking system
let mysqlConnection = null;
const connectPostgreSQL = async () => {
    try {
        await prisma.$connect();
        logger_js_1.logger.info('✅ Connected to PostgreSQL database');
        return prisma;
    }
    catch (error) {
        logger_js_1.logger.error('❌ Failed to connect to PostgreSQL:', error);
        throw error;
    }
};
exports.connectPostgreSQL = connectPostgreSQL;
const connectMySQL = async () => {
    try {
        if (!mysqlConnection) {
            mysqlConnection = await (0, promise_1.createConnection)({
                host: process.env.MYSQL_HOST || 'localhost',
                port: parseInt(process.env.MYSQL_PORT || '3306'),
                user: process.env.MYSQL_USER,
                password: process.env.MYSQL_PASSWORD,
                database: process.env.MYSQL_DATABASE,
                charset: 'utf8mb4',
                timezone: '+00:00',
            });
        }
        logger_js_1.logger.info('✅ Connected to MySQL (Legacy Booking System)');
        return mysqlConnection;
    }
    catch (error) {
        logger_js_1.logger.error('❌ Failed to connect to MySQL:', error);
        throw error;
    }
};
exports.connectMySQL = connectMySQL;
const disconnectDatabases = async () => {
    try {
        await prisma.$disconnect();
        if (mysqlConnection) {
            await mysqlConnection.end();
            mysqlConnection = null;
        }
        logger_js_1.logger.info('🔌 Database connections closed');
    }
    catch (error) {
        logger_js_1.logger.error('❌ Error closing database connections:', error);
    }
};
exports.disconnectDatabases = disconnectDatabases;
// Health check for databases
const checkDatabaseHealth = async () => {
    const health = {
        postgresql: false,
        mysql: false,
        timestamp: new Date().toISOString()
    };
    try {
        // Check PostgreSQL
        await prisma.$queryRaw `SELECT 1`;
        health.postgresql = true;
    }
    catch (error) {
        logger_js_1.logger.error('PostgreSQL health check failed:', error);
    }
    try {
        // Check MySQL
        const mysql = await (0, exports.connectMySQL)();
        await mysql.query('SELECT 1');
        health.mysql = true;
    }
    catch (error) {
        logger_js_1.logger.error('MySQL health check failed:', error);
    }
    return health;
};
exports.checkDatabaseHealth = checkDatabaseHealth;
exports.default = prisma;
