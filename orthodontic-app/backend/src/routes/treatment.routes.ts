import { Router } from 'express';
import { TreatmentController } from '../controllers/treatment.controller.js';
import { authenticateToken, requireDoctorOrAdmin } from '../middleware/auth.js';
import { validate, validateBody, validateParams, validateQuery } from '../utils/validators.js';
import {
  createTreatmentPlanSchema,
  updateTreatmentPlanSchema,
  updateTreatmentStatusSchema,
  createTreatmentPhaseSchema,
  updateTreatmentPhaseSchema,
  updatePhaseStatusSchema,
  createClinicalNoteSchema,
  updateClinicalNoteSchema,
  idParamSchema,
} from '../utils/validators.js';

const router = Router();

// All treatment routes require authentication
router.use(authenticateToken);

// Treatment plan routes
router.post('/plans', 
  requireDoctorOrAdmin, 
  validateBody(createTreatmentPlanSchema), 
  TreatmentController.createTreatmentPlan
);

router.get('/plans/stats', TreatmentController.getTreatmentStats);

router.get('/plans/:id', 
  validateParams(idParamSchema), 
  TreatmentController.getTreatmentPlanById
);

router.put('/plans/:id', 
  requireDoctorOrAdmin, 
  validateParams(idParamSchema), 
  validateBody(updateTreatmentPlanSchema), 
  TreatmentController.updateTreatmentPlan
);

router.put('/plans/:id/status', 
  requireDoctorOrAdmin, 
  validateParams(idParamSchema), 
  validateBody(updateTreatmentStatusSchema), 
  TreatmentController.updateTreatmentStatus
);

router.get('/plans/:id/progress', 
  validateParams(idParamSchema), 
  TreatmentController.getTreatmentProgress
);

router.delete('/plans/:id', 
  requireDoctorOrAdmin, 
  validateParams(idParamSchema), 
  TreatmentController.deleteTreatmentPlan
);

// Patient-specific treatment plans
router.get('/plans/patient/:patientId', 
  validateParams(idParamSchema), 
  TreatmentController.getTreatmentPlansByPatientId
);

// Treatment phase routes
router.post('/phases', 
  requireDoctorOrAdmin, 
  validateBody(createTreatmentPhaseSchema), 
  TreatmentController.createTreatmentPhase
);

router.get('/phases/:id', 
  validateParams(idParamSchema), 
  TreatmentController.getTreatmentPhaseById
);

router.put('/phases/:id', 
  requireDoctorOrAdmin, 
  validateParams(idParamSchema), 
  validateBody(updateTreatmentPhaseSchema), 
  TreatmentController.updateTreatmentPhase
);

router.put('/phases/:id/status', 
  requireDoctorOrAdmin, 
  validateParams(idParamSchema), 
  validateBody(updatePhaseStatusSchema), 
  TreatmentController.updatePhaseStatus
);

router.delete('/phases/:id', 
  requireDoctorOrAdmin, 
  validateParams(idParamSchema), 
  TreatmentController.deleteTreatmentPhase
);

// Treatment plan phases
router.get('/plans/:treatmentPlanId/phases', 
  validateParams(idParamSchema), 
  TreatmentController.getTreatmentPhasesByPlanId
);

// Clinical notes routes
router.post('/notes', 
  requireDoctorOrAdmin, 
  validateBody(createClinicalNoteSchema), 
  TreatmentController.createClinicalNote
);

router.put('/notes/:id', 
  requireDoctorOrAdmin, 
  validateParams(idParamSchema), 
  validateBody(updateClinicalNoteSchema), 
  TreatmentController.updateClinicalNote
);

router.delete('/notes/:id', 
  requireDoctorOrAdmin, 
  validateParams(idParamSchema), 
  TreatmentController.deleteClinicalNote
);

// Patient clinical notes
router.get('/notes/patient/:patientId', 
  validateParams(idParamSchema), 
  TreatmentController.getClinicalNotesByPatientId
);

export default router;