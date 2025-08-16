import { BadRequestError } from '../utils/error.handler.js';
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';


// Common validation schemas
export const emailSchema = z.string().email('Invalid email format');

export const phoneSchema = z.string()
  .regex(/^(\+30)?[6-7]\d{8}$/, 'Invalid Greek phone number format')
  .optional();

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number');

export const cuidSchema = z.string().cuid('Invalid ID format');

export const dateSchema = z.string().datetime('Invalid date format');

export const positiveIntSchema = z.number().int().positive('Must be a positive integer');

export const decimalSchema = z.number().positive('Must be a positive number');

// User validation schemas
export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required').max(100, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name too long'),
  role: z.enum(['ADMIN', 'DOCTOR', 'ASSISTANT']).default('DOCTOR'),
});

export const updateUserSchema = createUserSchema.partial().omit({ password: true });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

// Patient validation schemas
export const createPatientSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name too long'),
  email: emailSchema.optional(),
  phone: phoneSchema,
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  address: z.string().max(255, 'Address too long').optional(),
  city: z.string().max(100, 'City name too long').optional(),
  postalCode: z.string().max(10, 'Postal code too long').optional(),
  country: z.string().max(100, 'Country name too long').default('Greece'),
  medicalHistory: z.record(z.any()).optional(),
  allergies: z.string().max(500, 'Allergies description too long').optional(),
  medications: z.string().max(500, 'Medications description too long').optional(),
  emergencyContact: z.record(z.any()).optional(),
  insuranceInfo: z.record(z.any()).optional(),
  orthodonticHistory: z.record(z.any()).optional(),
  referralSource: z.string().max(200, 'Referral source too long').optional(),
});

export const updatePatientSchema = createPatientSchema.partial();

export const patientSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100, 'Search query too long'),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.enum(['firstName', 'lastName', 'createdAt', 'updatedAt']).default('lastName'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Treatment plan validation schemas
export const createTreatmentPlanSchema = z.object({
  patientId: cuidSchema,
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  diagnosis: z.string().min(1, 'Diagnosis is required').max(500, 'Diagnosis too long'),
  treatmentGoals: z.array(z.string().max(200, 'Treatment goal too long')),
  estimatedDuration: positiveIntSchema.optional(),
  complexity: z.enum(['SIMPLE', 'MODERATE', 'COMPLEX', 'SEVERE']),
  initialAssessment: z.record(z.any()),
  treatmentOptions: z.record(z.any()),
  selectedOption: z.string().min(1, 'Selected option is required').max(200, 'Selected option too long'),
  appliancesUsed: z.array(z.string().max(100, 'Appliance name too long')),
  materialsList: z.record(z.any()).optional(),
  startDate: z.string().datetime().optional(),
  estimatedEndDate: z.string().datetime().optional(),
  totalCost: decimalSchema.optional(),
  paymentPlan: z.record(z.any()).optional(),
});

export const updateTreatmentPlanSchema = createTreatmentPlanSchema.partial().omit({ patientId: true });

export const updateTreatmentStatusSchema = z.object({
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']),
  actualEndDate: z.string().datetime().optional(),
});

// Treatment phase validation schemas
export const createTreatmentPhaseSchema = z.object({
  treatmentPlanId: cuidSchema,
  patientId: cuidSchema,
  phaseNumber: positiveIntSchema,
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  objectives: z.array(z.string().max(200, 'Objective too long')),
  appliances: z.record(z.any()),
  instructions: z.string().max(1000, 'Instructions too long').optional(),
  startDate: z.string().datetime().optional(),
  estimatedEndDate: z.string().datetime().optional(),
});

export const updateTreatmentPhaseSchema = createTreatmentPhaseSchema.partial().omit({ 
  treatmentPlanId: true, 
  patientId: true, 
  phaseNumber: true 
});

export const updatePhaseStatusSchema = z.object({
  status: z.enum(['PLANNED', 'ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED']),
  progress: z.number().int().min(0).max(100),
  actualEndDate: z.string().datetime().optional(),
});

// Photo validation schemas
export const createPhotoSchema = z.object({
  patientId: cuidSchema,
  category: z.enum(['INTRAORAL', 'EXTRAORAL', 'RADIOGRAPH', 'MODELS', 'CLINICAL', 'PROGRESS', 'FINAL']),
  subcategory: z.string().max(100, 'Subcategory too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  tags: z.array(z.string().max(50, 'Tag too long')).default([]),
  treatmentPhaseId: cuidSchema.optional(),
  appointmentId: cuidSchema.optional(),
  isBeforeAfter: z.boolean().default(false),
  beforeAfterPairId: cuidSchema.optional(),
});

export const updatePhotoSchema = createPhotoSchema.partial().omit({ patientId: true });

export const photoSearchSchema = z.object({
  patientId: cuidSchema.optional(),
  category: z.enum(['INTRAORAL', 'EXTRAORAL', 'RADIOGRAPH', 'MODELS', 'CLINICAL', 'PROGRESS', 'FINAL']).optional(),
  tags: z.array(z.string()).optional(),
  treatmentPhaseId: cuidSchema.optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(20),
  sortBy: z.enum(['uploadedAt', 'category', 'filename']).default('uploadedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Clinical note validation schemas
export const createClinicalNoteSchema = z.object({
  patientId: cuidSchema,
  treatmentPlanId: cuidSchema.optional(),
  treatmentPhaseId: cuidSchema.optional(),
  appointmentId: cuidSchema.optional(),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().min(1, 'Content is required').max(5000, 'Content too long'),
  noteType: z.enum(['CONSULTATION', 'EXAMINATION', 'TREATMENT', 'FOLLOW_UP', 'EMERGENCY', 'GENERAL']),
  tags: z.array(z.string().max(50, 'Tag too long')).default([]),
  observations: z.record(z.any()).optional(),
  recommendations: z.string().max(1000, 'Recommendations too long').optional(),
  nextSteps: z.string().max(1000, 'Next steps too long').optional(),
});

export const updateClinicalNoteSchema = createClinicalNoteSchema.partial().omit({ patientId: true });

// Appointment validation schemas
export const createAppointmentSchema = z.object({
  patientId: cuidSchema,
  treatmentPlanId: cuidSchema.optional(),
  treatmentPhaseId: cuidSchema.optional(),
  appointmentDate: z.string().datetime(),
  appointmentTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  duration: z.number().int().positive().default(30),
  appointmentType: z.enum(['CONSULTATION', 'EXAMINATION', 'TREATMENT', 'FOLLOW_UP', 'EMERGENCY', 'REVIEW']),
  notes: z.string().max(1000, 'Notes too long').optional(),
  reasonForVisit: z.string().max(500, 'Reason for visit too long').optional(),
  legacyBookingId: z.string().max(50, 'Legacy booking ID too long').optional(),
  bookingNumber: z.string().max(50, 'Booking number too long').optional(),
});

export const updateAppointmentSchema = createAppointmentSchema.partial().omit({ patientId: true });

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
  treatmentPerformed: z.string().max(1000, 'Treatment performed description too long').optional(),
});

// Payment validation schemas
export const createPaymentSchema = z.object({
  patientId: cuidSchema,
  treatmentPlanId: cuidSchema.optional(),
  amount: decimalSchema,
  currency: z.string().length(3, 'Currency must be 3 characters').default('EUR'),
  paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'CHECK', 'INSURANCE', 'OTHER']),
  description: z.string().max(500, 'Description too long').optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
  dueDate: z.string().datetime().optional(),
  transactionId: z.string().max(100, 'Transaction ID too long').optional(),
});

export const updatePaymentSchema = createPaymentSchema.partial().omit({ patientId: true });

export const updatePaymentStatusSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED', 'REFUNDED']),
  paidDate: z.string().datetime().optional(),
});

// General validation schemas
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export const idParamSchema = z.object({
  id: cuidSchema,
});

// Validation middleware factory
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
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
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        next(new BadRequestError(`Validation failed: ${errorMessage}`));
      } else {
        next(error);
      }
    }
  };
};

// Validate request body only
export const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        next(new BadRequestError(`Validation failed: ${errorMessage}`));
      } else {
        next(error);
      }
    }
  };
};

// Validate request params only
export const validateParams = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        next(new BadRequestError(`Validation failed: ${errorMessage}`));
      } else {
        next(error);
      }
    }
  };
};

// Validate request query only
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        next(new BadRequestError(`Validation failed: ${errorMessage}`));
      } else {
        next(error);
      }
    }
  };
};