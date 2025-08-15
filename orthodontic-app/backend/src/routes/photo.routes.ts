import { Router } from 'express';
import { PhotoController } from '../controllers/photo.controller.js';
import { authenticateToken, requireDoctorOrAdmin } from '../middleware/auth.js';
import { 
  singlePhoto, 
  multiplePhotos, 
  photoFields, 
  validateFile, 
  handleMulterError, 
  logFileUpload 
} from '../middleware/upload.js';
import { validate, validateBody, validateParams, validateQuery } from '../utils/validators.js';
import {
  createPhotoSchema,
  updatePhotoSchema,
  photoSearchSchema,
  idParamSchema,
} from '../utils/validators.js';

const router = Router();

// All photo routes require authentication
router.use(authenticateToken);

// Photo upload routes
router.post('/upload', 
  singlePhoto, 
  handleMulterError, 
  validateFile, 
  logFileUpload, 
  PhotoController.uploadPhoto
);

router.post('/upload-multiple', 
  multiplePhotos, 
  handleMulterError, 
  validateFile, 
  logFileUpload, 
  PhotoController.uploadMultiplePhotos
);

router.post('/upload-fields', 
  photoFields, 
  handleMulterError, 
  validateFile, 
  logFileUpload, 
  PhotoController.uploadMultiplePhotos
);

// Photo search and retrieval
router.get('/search', validateQuery(photoSearchSchema), PhotoController.searchPhotos);
router.get('/stats', PhotoController.getPhotoStats);
router.get('/recent', PhotoController.getRecentPhotos);
router.get('/', PhotoController.searchPhotos);

// Patient-specific photo routes
router.get('/patient/:patientId', validateParams(idParamSchema), PhotoController.getPhotosByPatientId);
router.get('/patient/:patientId/category/:category', PhotoController.getPhotosByCategory);
router.get('/patient/:patientId/before-after', PhotoController.getBeforeAfterPairs);
router.get('/patient/:patientId/categories-summary', PhotoController.getPhotoCategoriesSummary);

// Treatment phase photos
router.get('/treatment-phase/:treatmentPhaseId', PhotoController.getTreatmentPhasePhotos);

// Individual photo operations
router.get('/:id', validateParams(idParamSchema), PhotoController.getPhotoById);
router.put('/:id', 
  requireDoctorOrAdmin, 
  validateParams(idParamSchema), 
  validateBody(updatePhotoSchema), 
  PhotoController.updatePhoto
);
router.delete('/:id', requireDoctorOrAdmin, validateParams(idParamSchema), PhotoController.deletePhoto);
router.get('/:id/download', validateParams(idParamSchema), PhotoController.downloadPhoto);

// Before/after photo operations
router.post('/create-before-after-pair', requireDoctorOrAdmin, PhotoController.createBeforeAfterPair);

// Bulk operations
router.delete('/bulk', requireDoctorOrAdmin, PhotoController.bulkDeletePhotos);
router.put('/batch-update', requireDoctorOrAdmin, PhotoController.batchUpdatePhotos);

export default router;