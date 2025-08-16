"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const patient_controller_js_1 = require("../controllers/patient.controller.js");
const auth_js_1 = require("../middleware/auth.js");
const validators_js_1 = require("../utils/validators.js");
const validators_js_2 = require("../utils/validators.js");
const router = (0, express_1.Router)();
// All patient routes require authentication
router.use(auth_js_1.authenticateToken);
// Patient CRUD operations
router.post('/', auth_js_1.requireDoctorOrAdmin, (0, validators_js_1.validateBody)(validators_js_2.createPatientSchema), patient_controller_js_1.PatientController.createPatient);
router.get('/search', (0, validators_js_1.validateQuery)(validators_js_2.patientSearchSchema), patient_controller_js_1.PatientController.searchPatients);
router.get('/stats', patient_controller_js_1.PatientController.getPatientStats);
router.get('/recent', patient_controller_js_1.PatientController.getRecentPatients);
router.get('/export', patient_controller_js_1.PatientController.exportPatients);
router.get('/', patient_controller_js_1.PatientController.getAllPatients);
// Patient-specific operations
router.get('/:id', (0, validators_js_1.validateParams)(validators_js_2.idParamSchema), patient_controller_js_1.PatientController.getPatientById);
router.put('/:id', auth_js_1.requireDoctorOrAdmin, (0, validators_js_1.validateParams)(validators_js_2.idParamSchema), (0, validators_js_1.validateBody)(validators_js_2.updatePatientSchema), patient_controller_js_1.PatientController.updatePatient);
router.delete('/:id', auth_js_1.requireDoctorOrAdmin, (0, validators_js_1.validateParams)(validators_js_2.idParamSchema), patient_controller_js_1.PatientController.deactivatePatient);
router.post('/:id/reactivate', auth_js_1.requireDoctorOrAdmin, (0, validators_js_1.validateParams)(validators_js_2.idParamSchema), patient_controller_js_1.PatientController.reactivatePatient);
// Patient summary and extended information
router.get('/:id/summary', (0, validators_js_1.validateParams)(validators_js_2.idParamSchema), patient_controller_js_1.PatientController.getPatientSummary);
router.get('/:id/timeline', (0, validators_js_1.validateParams)(validators_js_2.idParamSchema), patient_controller_js_1.PatientController.getPatientTimeline);
router.get('/:id/documents', (0, validators_js_1.validateParams)(validators_js_2.idParamSchema), patient_controller_js_1.PatientController.getPatientDocuments);
router.get('/:id/audit-log', (0, validators_js_1.validateParams)(validators_js_2.idParamSchema), patient_controller_js_1.PatientController.getPatientAuditLog);
// Advanced search and operations
router.post('/advanced-search', patient_controller_js_1.PatientController.advancedPatientSearch);
router.post('/bulk-update', auth_js_1.requireDoctorOrAdmin, patient_controller_js_1.PatientController.bulkUpdatePatients);
// Integration with booking system
router.post('/import-from-booking', auth_js_1.requireDoctorOrAdmin, patient_controller_js_1.PatientController.importFromBookingSystem);
exports.default = router;
