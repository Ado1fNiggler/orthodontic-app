"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_js_1 = __importDefault(require("./auth.routes.js"));
const patient_routes_js_1 = __importDefault(require("./patient.routes.js"));
const photo_routes_js_1 = __importDefault(require("./photo.routes.js"));
const treatment_routes_js_1 = __importDefault(require("./treatment.routes.js"));
const database_js_1 = require("../config/database.js");
const cloudinary_js_1 = require("../config/cloudinary.js");
const supabase_js_1 = require("../config/supabase.js");
const logger_js_1 = require("../utils/logger.js");
const router = (0, express_1.Router)();
// API version and info
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Orthodontic Practice Management API',
        version: '1.0.0',
        documentation: '/api-docs',
        endpoints: {
            auth: '/api/auth',
            patients: '/api/patients',
            photos: '/api/photos',
            treatments: '/api/treatments',
            health: '/api/health'
        }
    });
});
// Health check endpoint
router.get('/health', async (req, res) => {
    try {
        const [dbHealth, cloudinaryHealth, supabaseHealth] = await Promise.all([
            (0, database_js_1.checkDatabaseHealth)(),
            (0, cloudinary_js_1.checkCloudinaryHealth)(),
            (0, supabase_js_1.checkSupabaseHealth)(),
        ]);
        const overallHealth = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            services: {
                database: dbHealth,
                cloudinary: cloudinaryHealth,
                supabase: supabaseHealth,
            }
        };
        // Check if any service is unhealthy
        const isUnhealthy = Object.values(overallHealth.services).some(service => 'status' in service && service.status === 'unhealthy');
        if (isUnhealthy) {
            overallHealth.status = 'degraded';
        }
        const statusCode = overallHealth.status === 'healthy' ? 200 : 503;
        res.status(statusCode).json({
            success: overallHealth.status !== 'unhealthy',
            data: overallHealth
        });
    }
    catch (error) {
        logger_js_1.logger.error('Health check failed', error);
        res.status(503).json({
            success: false,
            message: 'Service health check failed',
            data: {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
});
// Detailed health check for admin monitoring
router.get('/health/detailed', async (req, res) => {
    try {
        const detailedHealth = {
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            platform: process.platform,
            nodeVersion: process.version,
            services: {
                database: await (0, database_js_1.checkDatabaseHealth)(),
                cloudinary: await (0, cloudinary_js_1.checkCloudinaryHealth)(),
                supabase: await (0, supabase_js_1.checkSupabaseHealth)(),
            },
            configuration: {
                corsEnabled: true,
                rateLimitingEnabled: process.env.NODE_ENV === 'production',
                loggingLevel: process.env.LOG_LEVEL || 'info',
                jwtConfigured: !!process.env.JWT_SECRET,
                emailConfigured: !!(process.env.SMTP_HOST && process.env.SMTP_USER),
            }
        };
        res.json({
            success: true,
            data: detailedHealth
        });
    }
    catch (error) {
        logger_js_1.logger.error('Detailed health check failed', error);
        res.status(500).json({
            success: false,
            message: 'Detailed health check failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// API status and metrics
router.get('/status', (req, res) => {
    const status = {
        api: 'Orthodontic Practice Management API',
        version: '1.0.0',
        status: 'operational',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        endpoints: {
            auth: {
                path: '/api/auth',
                description: 'Authentication and user management',
                methods: ['POST', 'GET', 'PUT', 'DELETE']
            },
            patients: {
                path: '/api/patients',
                description: 'Patient management and records',
                methods: ['POST', 'GET', 'PUT', 'DELETE']
            },
            photos: {
                path: '/api/photos',
                description: 'Photo upload and management',
                methods: ['POST', 'GET', 'PUT', 'DELETE']
            },
            treatments: {
                path: '/api/treatments',
                description: 'Treatment plans and clinical notes',
                methods: ['POST', 'GET', 'PUT', 'DELETE']
            }
        }
    };
    res.json({
        success: true,
        data: status
    });
});
// Mount route modules
router.use('/auth', auth_routes_js_1.default);
router.use('/patients', patient_routes_js_1.default);
router.use('/photos', photo_routes_js_1.default);
router.use('/treatments', treatment_routes_js_1.default);
// API documentation placeholder
router.get('/docs', (req, res) => {
    res.json({
        success: true,
        message: 'API Documentation',
        description: 'Orthodontic Practice Management API Documentation',
        version: '1.0.0',
        documentation: {
            interactive: '/api-docs',
            openapi: '/api/openapi.json',
            postman: '/api/postman-collection.json'
        },
        examples: {
            authentication: {
                login: 'POST /api/auth/login',
                register: 'POST /api/auth/register',
                refresh: 'POST /api/auth/refresh-token'
            },
            patients: {
                create: 'POST /api/patients',
                list: 'GET /api/patients',
                search: 'GET /api/patients/search?query=john',
                details: 'GET /api/patients/:id'
            },
            photos: {
                upload: 'POST /api/photos/upload',
                list: 'GET /api/photos/patient/:patientId',
                categories: 'GET /api/photos/patient/:patientId/categories-summary'
            },
            treatments: {
                createPlan: 'POST /api/treatments/plans',
                addPhase: 'POST /api/treatments/phases',
                addNote: 'POST /api/treatments/notes'
            }
        }
    });
});
// Catch-all route for undefined API endpoints
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `API endpoint not found: ${req.originalUrl}`,
        availableEndpoints: [
            '/api/auth',
            '/api/patients',
            '/api/photos',
            '/api/treatments',
            '/api/health',
            '/api/status',
            '/api/docs'
        ]
    });
});
exports.default = router;
