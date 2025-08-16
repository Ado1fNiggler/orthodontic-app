"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const treatment_controller_js_1 = require("../controllers/treatment.controller.js");
const auth_js_1 = require("../middleware/auth.js");
const validators_js_1 = require("../utils/validators.js");
const validators_js_2 = require("../utils/validators.js");
const router = (0, express_1.Router)();
// All treatment routes require authentication
router.use(auth_js_1.authenticateToken);
// Treatment plan routes
router.post('/plans', auth_js_1.requireDoctorOrAdmin, (0, validators_js_1.validateBody)(validators_js_2.createTreatmentPlanSchema), treatment_controller_js_1.TreatmentController.createTreatmentPlan);
router.get('/plans/stats', treatment_controller_js_1.TreatmentController.getTreatmentStats);
router.get('/plans/:id', (0, validators_js_1.validateParams)(validators_js_2.idParamSchema), treatment_controller_js_1.TreatmentController.getTreatmentPlanById);
router.put('/plans/:id', auth_js_1.requireDoctorOrAdmin, (0, validators_js_1.validateParams)(validators_js_2.idParamSchema), (0, validators_js_1.validateBody)(validators_js_2.updateTreatmentPlanSchema), treatment_controller_js_1.TreatmentController.updateTreatmentPlan);
router.put('/plans/:id/status', auth_js_1.requireDoctorOrAdmin, (0, validators_js_1.validateParams)(validators_js_2.idParamSchema), (0, validators_js_1.validateBody)(validators_js_2.updateTreatmentStatusSchema), treatment_controller_js_1.TreatmentController.updateTreatmentStatus);
router.get('/plans/:id/progress', (0, validators_js_1.validateParams)(validators_js_2.idParamSchema), treatment_controller_js_1.TreatmentController.getTreatmentProgress);
router.delete('/plans/:id', auth_js_1.requireDoctorOrAdmin, (0, validators_js_1.validateParams)(validators_js_2.idParamSchema), treatment_controller_js_1.TreatmentController.deleteTreatmentPlan);
// Patient-specific treatment plans
router.get('/plans/patient/:patientId', (0, validators_js_1.validateParams)(validators_js_2.idParamSchema), treatment_controller_js_1.TreatmentController.getTreatmentPlansByPatientId);
// Treatment phase routes
router.post('/phases', auth_js_1.requireDoctorOrAdmin, (0, validators_js_1.validateBody)(validators_js_2.createTreatmentPhaseSchema), treatment_controller_js_1.TreatmentController.createTreatmentPhase);
router.get('/phases/:id', (0, validators_js_1.validateParams)(validators_js_2.idParamSchema), treatment_controller_js_1.TreatmentController.getTreatmentPhaseById);
router.put('/phases/:id', auth_js_1.requireDoctorOrAdmin, (0, validators_js_1.validateParams)(validators_js_2.idParamSchema), (0, validators_js_1.validateBody)(validators_js_2.updateTreatmentPhaseSchema), treatment_controller_js_1.TreatmentController.updateTreatmentPhase);
router.put('/phases/:id/status', auth_js_1.requireDoctorOrAdmin, (0, validators_js_1.validateParams)(validators_js_2.idParamSchema), (0, validators_js_1.validateBody)(validators_js_2.updatePhaseStatusSchema), treatment_controller_js_1.TreatmentController.updatePhaseStatus);
router.delete('/phases/:id', auth_js_1.requireDoctorOrAdmin, (0, validators_js_1.validateParams)(validators_js_2.idParamSchema), treatment_controller_js_1.TreatmentController.deleteTreatmentPhase);
// Treatment plan phases
router.get('/plans/:treatmentPlanId/phases', (0, validators_js_1.validateParams)(validators_js_2.idParamSchema), treatment_controller_js_1.TreatmentController.getTreatmentPhasesByPlanId);
// Clinical notes routes
router.post('/notes', auth_js_1.requireDoctorOrAdmin, (0, validators_js_1.validateBody)(validators_js_2.createClinicalNoteSchema), treatment_controller_js_1.TreatmentController.createClinicalNote);
router.put('/notes/:id', auth_js_1.requireDoctorOrAdmin, (0, validators_js_1.validateParams)(validators_js_2.idParamSchema), (0, validators_js_1.validateBody)(validators_js_2.updateClinicalNoteSchema), treatment_controller_js_1.TreatmentController.updateClinicalNote);
router.delete('/notes/:id', auth_js_1.requireDoctorOrAdmin, (0, validators_js_1.validateParams)(validators_js_2.idParamSchema), treatment_controller_js_1.TreatmentController.deleteClinicalNote);
// Patient clinical notes
router.get('/notes/patient/:patientId', (0, validators_js_1.validateParams)(validators_js_2.idParamSchema), treatment_controller_js_1.TreatmentController.getClinicalNotesByPatientId);
exports.default = router;
