"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQuery = exports.validateParams = exports.validateBody = exports.validate = exports.idParamSchema = exports.paginationSchema = exports.updatePaymentStatusSchema = exports.updatePaymentSchema = exports.createPaymentSchema = exports.updateAppointmentStatusSchema = exports.updateAppointmentSchema = exports.createAppointmentSchema = exports.updateClinicalNoteSchema = exports.createClinicalNoteSchema = exports.photoSearchSchema = exports.updatePhotoSchema = exports.createPhotoSchema = exports.updatePhaseStatusSchema = exports.updateTreatmentPhaseSchema = exports.createTreatmentPhaseSchema = exports.updateTreatmentStatusSchema = exports.updateTreatmentPlanSchema = exports.createTreatmentPlanSchema = exports.patientSearchSchema = exports.updatePatientSchema = exports.createPatientSchema = exports.changePasswordSchema = exports.loginSchema = exports.updateUserSchema = exports.createUserSchema = exports.decimalSchema = exports.positiveIntSchema = exports.dateSchema = exports.cuidSchema = exports.passwordSchema = exports.phoneSchema = exports.emailSchema = void 0;
const error_handler_js_1 = require("../utils/error.handler.js");
const zod_1 = require("zod");
// Common validation schemas
exports.emailSchema = zod_1.z.string().email('Invalid email format');
exports.phoneSchema = zod_1.z.string()
    .regex(/^(\+30)?[6-7]\d{8}$/, 'Invalid Greek phone number format')
    .optional();
exports.passwordSchema = zod_1.z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number');
exports.cuidSchema = zod_1.z.string().cuid('Invalid ID format');
exports.dateSchema = zod_1.z.string().datetime('Invalid date format');
exports.positiveIntSchema = zod_1.z.number().int().positive('Must be a positive integer');
exports.decimalSchema = zod_1.z.number().positive('Must be a positive number');
// User validation schemas
exports.createUserSchema = zod_1.z.object({
    email: exports.emailSchema,
    password: exports.passwordSchema,
    firstName: zod_1.z.string().min(1, 'First name is required').max(100, 'First name too long'),
    lastName: zod_1.z.string().min(1, 'Last name is required').max(100, 'Last name too long'),
    role: zod_1.z.enum(['ADMIN', 'DOCTOR', 'ASSISTANT']).default('DOCTOR'),
});
exports.updateUserSchema = exports.createUserSchema.partial().omit({ password: true });
exports.loginSchema = zod_1.z.object({
    email: exports.emailSchema,
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: exports.passwordSchema,
});
// Patient validation schemas
exports.createPatientSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, 'First name is required').max(100, 'First name too long'),
    lastName: zod_1.z.string().min(1, 'Last name is required').max(100, 'Last name too long'),
    email: exports.emailSchema.optional(),
    phone: exports.phoneSchema,
    dateOfBirth: zod_1.z.string().datetime().optional(),
    gender: zod_1.z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    address: zod_1.z.string().max(255, 'Address too long').optional(),
    city: zod_1.z.string().max(100, 'City name too long').optional(),
    postalCode: zod_1.z.string().max(10, 'Postal code too long').optional(),
    country: zod_1.z.string().max(100, 'Country name too long').default('Greece'),
    medicalHistory: zod_1.z.record(zod_1.z.any()).optional(),
    allergies: zod_1.z.string().max(500, 'Allergies description too long').optional(),
    medications: zod_1.z.string().max(500, 'Medications description too long').optional(),
    emergencyContact: zod_1.z.record(zod_1.z.any()).optional(),
    insuranceInfo: zod_1.z.record(zod_1.z.any()).optional(),
    orthodonticHistory: zod_1.z.record(zod_1.z.any()).optional(),
    referralSource: zod_1.z.string().max(200, 'Referral source too long').optional(),
});
exports.updatePatientSchema = exports.createPatientSchema.partial();
exports.patientSearchSchema = zod_1.z.object({
    query: zod_1.z.string().min(1, 'Search query is required').max(100, 'Search query too long'),
    page: zod_1.z.number().int().positive().default(1),
    limit: zod_1.z.number().int().positive().max(100).default(20),
    sortBy: zod_1.z.enum(['firstName', 'lastName', 'createdAt', 'updatedAt']).default('lastName'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('asc'),
});
// Treatment plan validation schemas
exports.createTreatmentPlanSchema = zod_1.z.object({
    patientId: exports.cuidSchema,
    title: zod_1.z.string().min(1, 'Title is required').max(200, 'Title too long'),
    description: zod_1.z.string().max(1000, 'Description too long').optional(),
    diagnosis: zod_1.z.string().min(1, 'Diagnosis is required').max(500, 'Diagnosis too long'),
    treatmentGoals: zod_1.z.array(zod_1.z.string().max(200, 'Treatment goal too long')),
    estimatedDuration: exports.positiveIntSchema.optional(),
    complexity: zod_1.z.enum(['SIMPLE', 'MODERATE', 'COMPLEX', 'SEVERE']),
    initialAssessment: zod_1.z.record(zod_1.z.any()),
    treatmentOptions: zod_1.z.record(zod_1.z.any()),
    selectedOption: zod_1.z.string().min(1, 'Selected option is required').max(200, 'Selected option too long'),
    appliancesUsed: zod_1.z.array(zod_1.z.string().max(100, 'Appliance name too long')),
    materialsList: zod_1.z.record(zod_1.z.any()).optional(),
    startDate: zod_1.z.string().datetime().optional(),
    estimatedEndDate: zod_1.z.string().datetime().optional(),
    totalCost: exports.decimalSchema.optional(),
    paymentPlan: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.updateTreatmentPlanSchema = exports.createTreatmentPlanSchema.partial().omit({ patientId: true });
exports.updateTreatmentStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']),
    actualEndDate: zod_1.z.string().datetime().optional(),
});
// Treatment phase validation schemas
exports.createTreatmentPhaseSchema = zod_1.z.object({
    treatmentPlanId: exports.cuidSchema,
    patientId: exports.cuidSchema,
    phaseNumber: exports.positiveIntSchema,
    title: zod_1.z.string().min(1, 'Title is required').max(200, 'Title too long'),
    description: zod_1.z.string().max(1000, 'Description too long').optional(),
    objectives: zod_1.z.array(zod_1.z.string().max(200, 'Objective too long')),
    appliances: zod_1.z.record(zod_1.z.any()),
    instructions: zod_1.z.string().max(1000, 'Instructions too long').optional(),
    startDate: zod_1.z.string().datetime().optional(),
    estimatedEndDate: zod_1.z.string().datetime().optional(),
});
exports.updateTreatmentPhaseSchema = exports.createTreatmentPhaseSchema.partial().omit({
    treatmentPlanId: true,
    patientId: true,
    phaseNumber: true
});
exports.updatePhaseStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['PLANNED', 'ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED']),
    progress: zod_1.z.number().int().min(0).max(100),
    actualEndDate: zod_1.z.string().datetime().optional(),
});
// Photo validation schemas
exports.createPhotoSchema = zod_1.z.object({
    patientId: exports.cuidSchema,
    category: zod_1.z.enum(['INTRAORAL', 'EXTRAORAL', 'RADIOGRAPH', 'MODELS', 'CLINICAL', 'PROGRESS', 'FINAL']),
    subcategory: zod_1.z.string().max(100, 'Subcategory too long').optional(),
    description: zod_1.z.string().max(500, 'Description too long').optional(),
    tags: zod_1.z.array(zod_1.z.string().max(50, 'Tag too long')).default([]),
    treatmentPhaseId: exports.cuidSchema.optional(),
    appointmentId: exports.cuidSchema.optional(),
    isBeforeAfter: zod_1.z.boolean().default(false),
    beforeAfterPairId: exports.cuidSchema.optional(),
});
exports.updatePhotoSchema = exports.createPhotoSchema.partial().omit({ patientId: true });
exports.photoSearchSchema = zod_1.z.object({
    patientId: exports.cuidSchema.optional(),
    category: zod_1.z.enum(['INTRAORAL', 'EXTRAORAL', 'RADIOGRAPH', 'MODELS', 'CLINICAL', 'PROGRESS', 'FINAL']).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    treatmentPhaseId: exports.cuidSchema.optional(),
    page: zod_1.z.number().int().positive().default(1),
    limit: zod_1.z.number().int().positive().max(50).default(20),
    sortBy: zod_1.z.enum(['uploadedAt', 'category', 'filename']).default('uploadedAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
// Clinical note validation schemas
exports.createClinicalNoteSchema = zod_1.z.object({
    patientId: exports.cuidSchema,
    treatmentPlanId: exports.cuidSchema.optional(),
    treatmentPhaseId: exports.cuidSchema.optional(),
    appointmentId: exports.cuidSchema.optional(),
    title: zod_1.z.string().min(1, 'Title is required').max(200, 'Title too long'),
    content: zod_1.z.string().min(1, 'Content is required').max(5000, 'Content too long'),
    noteType: zod_1.z.enum(['CONSULTATION', 'EXAMINATION', 'TREATMENT', 'FOLLOW_UP', 'EMERGENCY', 'GENERAL']),
    tags: zod_1.z.array(zod_1.z.string().max(50, 'Tag too long')).default([]),
    observations: zod_1.z.record(zod_1.z.any()).optional(),
    recommendations: zod_1.z.string().max(1000, 'Recommendations too long').optional(),
    nextSteps: zod_1.z.string().max(1000, 'Next steps too long').optional(),
});
exports.updateClinicalNoteSchema = exports.createClinicalNoteSchema.partial().omit({ patientId: true });
// Appointment validation schemas
exports.createAppointmentSchema = zod_1.z.object({
    patientId: exports.cuidSchema,
    treatmentPlanId: exports.cuidSchema.optional(),
    treatmentPhaseId: exports.cuidSchema.optional(),
    appointmentDate: zod_1.z.string().datetime(),
    appointmentTime: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    duration: zod_1.z.number().int().positive().default(30),
    appointmentType: zod_1.z.enum(['CONSULTATION', 'EXAMINATION', 'TREATMENT', 'FOLLOW_UP', 'EMERGENCY', 'REVIEW']),
    notes: zod_1.z.string().max(1000, 'Notes too long').optional(),
    reasonForVisit: zod_1.z.string().max(500, 'Reason for visit too long').optional(),
    legacyBookingId: zod_1.z.string().max(50, 'Legacy booking ID too long').optional(),
    bookingNumber: zod_1.z.string().max(50, 'Booking number too long').optional(),
});
exports.updateAppointmentSchema = exports.createAppointmentSchema.partial().omit({ patientId: true });
exports.updateAppointmentStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
    treatmentPerformed: zod_1.z.string().max(1000, 'Treatment performed description too long').optional(),
});
// Payment validation schemas
exports.createPaymentSchema = zod_1.z.object({
    patientId: exports.cuidSchema,
    treatmentPlanId: exports.cuidSchema.optional(),
    amount: exports.decimalSchema,
    currency: zod_1.z.string().length(3, 'Currency must be 3 characters').default('EUR'),
    paymentMethod: zod_1.z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'CHECK', 'INSURANCE', 'OTHER']),
    description: zod_1.z.string().max(500, 'Description too long').optional(),
    notes: zod_1.z.string().max(1000, 'Notes too long').optional(),
    dueDate: zod_1.z.string().datetime().optional(),
    transactionId: zod_1.z.string().max(100, 'Transaction ID too long').optional(),
});
exports.updatePaymentSchema = exports.createPaymentSchema.partial().omit({ patientId: true });
exports.updatePaymentStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['PENDING', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED', 'REFUNDED']),
    paidDate: zod_1.z.string().datetime().optional(),
});
// General validation schemas
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.number().int().positive().default(1),
    limit: zod_1.z.number().int().positive().max(100).default(20),
});
exports.idParamSchema = zod_1.z.object({
    id: exports.cuidSchema,
});
// Validation middleware factory
const validate = (schema) => {
    return (req, res, next) => {
        try {
            const validated = schema.parse({
                ...req.body,
                ...req.params,
                ...req.query,
            });
            // Merge validated data back to request
            req.body = { ...req.body, ...validated };
            req.params = { ...req.params, ...validated };
            req.query = { ...req.query, ...validated };
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
                next(new error_handler_js_1.BadRequestError(`Validation failed: ${errorMessage}`));
            }
            else {
                next(error);
            }
        }
    };
};
exports.validate = validate;
// Validate request body only
const validateBody = (schema) => {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
                next(new error_handler_js_1.BadRequestError(`Validation failed: ${errorMessage}`));
            }
            else {
                next(error);
            }
        }
    };
};
exports.validateBody = validateBody;
// Validate request params only
const validateParams = (schema) => {
    return (req, res, next) => {
        try {
            req.params = schema.parse(req.params);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
                next(new error_handler_js_1.BadRequestError(`Validation failed: ${errorMessage}`));
            }
            else {
                next(error);
            }
        }
    };
};
exports.validateParams = validateParams;
// Validate request query only
const validateQuery = (schema) => {
    return (req, res, next) => {
        try {
            req.query = schema.parse(req.query);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
                next(new error_handler_js_1.BadRequestError(`Validation failed: ${errorMessage}`));
            }
            else {
                next(error);
            }
        }
    };
};
exports.validateQuery = validateQuery;
