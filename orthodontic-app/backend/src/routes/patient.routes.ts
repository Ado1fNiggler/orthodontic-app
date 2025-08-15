import { Router } from 'express';
import { PatientController } from '../controllers/patient.controller.js';
import { authenticateToken, requireDoctorOrAdmin } from '../middleware/auth.js';
import { validate, validateBody, validateParams, validateQuery } from '../utils/validators.js';
import {
  createPatientSchema,
  updatePatientSchema,
  patientSearchSchema,
  idParamSchema,
} from '../utils/validators.js';

const router = Router();

// All patient routes require authentication
router.use(authenticateToken);

// Patient CRUD operations
router.post('/', requireDoctorOrAdmin, validateBody(createPatientSchema), PatientController.createPatient);
router.get('/search', validateQuery(patientSearchSchema), PatientController.searchPatients);
router.get('/stats', PatientController.getPatientStats);
router.get('/recent', PatientController.getRecentPatients);
router.get('/export', PatientController.exportPatients);
router.get('/', PatientController.getAllPatients);

// Patient-specific operations
router.get('/:id', validateParams(idParamSchema), PatientController.getPatientById);
router.put('/:id', requireDoctorOrAdmin, validateParams(idParamSchema), validateBody(updatePatientSchema), PatientController.updatePatient);
router.delete('/:id', requireDoctorOrAdmin, validateParams(idParamSchema), PatientController.deactivatePatient);
router.post('/:id/reactivate', requireDoctorOrAdmin, validateParams(idParamSchema), PatientController.reactivatePatient);

// Patient summary and extended information
router.get('/:id/summary', validateParams(idParamSchema), PatientController.getPatientSummary);
router.get('/:id/timeline', validateParams(idParamSchema), PatientController.getPatientTimeline);
router.get('/:id/documents', validateParams(idParamSchema), PatientController.getPatientDocuments);
router.get('/:id/audit-log', validateParams(idParamSchema), PatientController.getPatientAuditLog);

// Advanced search and operations
router.post('/advanced-search', PatientController.advancedPatientSearch);
router.post('/bulk-update', requireDoctorOrAdmin, PatientController.bulkUpdatePatients);

// Integration with booking system
router.post('/import-from-booking', requireDoctorOrAdmin, PatientController.importFromBookingSystem);

export default router;