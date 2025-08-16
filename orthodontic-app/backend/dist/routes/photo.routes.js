"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const photo_controller_js_1 = require("../controllers/photo.controller.js");
const auth_js_1 = require("../middleware/auth.js");
const upload_js_1 = require("../middleware/upload.js");
const validators_js_1 = require("../utils/validators.js");
const validators_js_2 = require("../utils/validators.js");
const router = (0, express_1.Router)();
// All photo routes require authentication
router.use(auth_js_1.authenticateToken);
// Photo upload routes
router.post('/upload', upload_js_1.singlePhoto, upload_js_1.handleMulterError, upload_js_1.validateFile, upload_js_1.logFileUpload, photo_controller_js_1.PhotoController.uploadPhoto);
router.post('/upload-multiple', upload_js_1.multiplePhotos, upload_js_1.handleMulterError, upload_js_1.validateFile, upload_js_1.logFileUpload, photo_controller_js_1.PhotoController.uploadMultiplePhotos);
router.post('/upload-fields', upload_js_1.photoFields, upload_js_1.handleMulterError, upload_js_1.validateFile, upload_js_1.logFileUpload, photo_controller_js_1.PhotoController.uploadMultiplePhotos);
// Photo search and retrieval
router.get('/search', (0, validators_js_1.validateQuery)(validators_js_2.photoSearchSchema), photo_controller_js_1.PhotoController.searchPhotos);
router.get('/stats', photo_controller_js_1.PhotoController.getPhotoStats);
router.get('/recent', photo_controller_js_1.PhotoController.getRecentPhotos);
router.get('/', photo_controller_js_1.PhotoController.searchPhotos);
// Patient-specific photo routes
router.get('/patient/:patientId', (0, validators_js_1.validateParams)(validators_js_2.idParamSchema), photo_controller_js_1.PhotoController.getPhotosByPatientId);
router.get('/patient/:patientId/category/:category', photo_controller_js_1.PhotoController.getPhotosByCategory);
router.get('/patient/:patientId/before-after', photo_controller_js_1.PhotoController.getBeforeAfterPairs);
router.get('/patient/:patientId/categories-summary', photo_controller_js_1.PhotoController.getPhotoCategoriesSummary);
// Treatment phase photos
router.get('/treatment-phase/:treatmentPhaseId', photo_controller_js_1.PhotoController.getTreatmentPhasePhotos);
// Individual photo operations
router.get('/:id', (0, validators_js_1.validateParams)(validators_js_2.idParamSchema), photo_controller_js_1.PhotoController.getPhotoById);
router.put('/:id', auth_js_1.requireDoctorOrAdmin, (0, validators_js_1.validateParams)(validators_js_2.idParamSchema), (0, validators_js_1.validateBody)(validators_js_2.updatePhotoSchema), photo_controller_js_1.PhotoController.updatePhoto);
router.delete('/:id', auth_js_1.requireDoctorOrAdmin, (0, validators_js_1.validateParams)(validators_js_2.idParamSchema), photo_controller_js_1.PhotoController.deletePhoto);
router.get('/:id/download', (0, validators_js_1.validateParams)(validators_js_2.idParamSchema), photo_controller_js_1.PhotoController.downloadPhoto);
// Before/after photo operations
router.post('/create-before-after-pair', auth_js_1.requireDoctorOrAdmin, photo_controller_js_1.PhotoController.createBeforeAfterPair);
// Bulk operations
router.delete('/bulk', auth_js_1.requireDoctorOrAdmin, photo_controller_js_1.PhotoController.bulkDeletePhotos);
router.put('/batch-update', auth_js_1.requireDoctorOrAdmin, photo_controller_js_1.PhotoController.batchUpdatePhotos);
exports.default = router;
