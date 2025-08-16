"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhotoController = void 0;
const error_handler_js_1 = require("../utils/error.handler.js");
const photo_service_js_1 = require("../services/photo.service.js");
const error_js_1 = require("../middleware/error.js");
const logger_js_1 = require("../utils/logger.js");
class PhotoController {
}
exports.PhotoController = PhotoController;
_a = PhotoController;
/**
 * Upload single photo
 */
PhotoController.uploadPhoto = (0, error_js_1.asyncHandler)(async (req, res) => {
    if (!req.file) {
        throw new error_handler_js_1.BadRequestError('No photo file provided');
    }
    const photoData = {
        patientId: req.body.patientId,
        category: req.body.category,
        subcategory: req.body.subcategory,
        description: req.body.description,
        tags: req.body.tags ? (Array.isArray(req.body.tags) ? req.body.tags : [req.body.tags]) : [],
        treatmentPhaseId: req.body.treatmentPhaseId,
        appointmentId: req.body.appointmentId,
        isBeforeAfter: req.body.isBeforeAfter === 'true',
        beforeAfterPairId: req.body.beforeAfterPairId,
        uploadedBy: req.user.id,
    };
    const photo = await photo_service_js_1.PhotoService.uploadPhoto(req.file, photoData);
    logger_js_1.uploadLogger.info('Photo uploaded successfully', {
        photoId: photo.id,
        patientId: photoData.patientId,
        category: photoData.category,
        uploadedBy: req.user.id,
    });
    res.status(201).json({
        success: true,
        message: 'Photo uploaded successfully',
        data: { photo }
    });
});
/**
 * Upload multiple photos
 */
PhotoController.uploadMultiplePhotos = (0, error_js_1.asyncHandler)(async (req, res) => {
    const files = req.files;
    if (!files || (Array.isArray(files) ? files.length === 0 : Object.keys(files).length === 0)) {
        throw new error_handler_js_1.BadRequestError('No photo files provided');
    }
    const photoData = {
        patientId: req.body.patientId,
        category: req.body.category,
        subcategory: req.body.subcategory,
        description: req.body.description,
        tags: req.body.tags ? (Array.isArray(req.body.tags) ? req.body.tags : [req.body.tags]) : [],
        treatmentPhaseId: req.body.treatmentPhaseId,
        appointmentId: req.body.appointmentId,
        isBeforeAfter: req.body.isBeforeAfter === 'true',
        beforeAfterPairId: req.body.beforeAfterPairId,
        uploadedBy: req.user.id,
    };
    let fileArray = [];
    if (Array.isArray(files)) {
        fileArray = files;
    }
    else if (files.photos) {
        fileArray = Array.isArray(files.photos) ? files.photos : [files.photos];
    }
    else {
        // Handle field-based uploads
        fileArray = Object.values(files).flat();
    }
    const photos = await photo_service_js_1.PhotoService.uploadMultiplePhotos(fileArray, photoData);
    logger_js_1.uploadLogger.info('Multiple photos uploaded successfully', {
        count: photos.length,
        patientId: photoData.patientId,
        category: photoData.category,
        uploadedBy: req.user.id,
    });
    res.status(201).json({
        success: true,
        message: `${photos.length} photos uploaded successfully`,
        data: { photos }
    });
});
/**
 * Get photo by ID
 */
PhotoController.getPhotoById = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const photo = await photo_service_js_1.PhotoService.getPhotoById(id);
    res.json({
        success: true,
        message: 'Photo retrieved successfully',
        data: { photo }
    });
});
/**
 * Search photos
 */
PhotoController.searchPhotos = (0, error_js_1.asyncHandler)(async (req, res) => {
    const searchParams = {
        patientId: req.query.patientId,
        category: req.query.category,
        tags: req.query.tags ? req.query.tags.split(',') : undefined,
        treatmentPhaseId: req.query.treatmentPhaseId,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        sortBy: req.query.sortBy || 'uploadedAt',
        sortOrder: req.query.sortOrder || 'desc',
    };
    const result = await photo_service_js_1.PhotoService.searchPhotos(searchParams);
    res.json({
        success: true,
        message: 'Photos retrieved successfully',
        data: result
    });
});
/**
 * Get photos by patient ID
 */
PhotoController.getPhotosByPatientId = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { patientId } = req.params;
    const category = req.query.category;
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    const photos = await photo_service_js_1.PhotoService.getPhotosByPatientId(patientId, category, limit);
    res.json({
        success: true,
        message: 'Patient photos retrieved successfully',
        data: { photos }
    });
});
/**
 * Update photo metadata
 */
PhotoController.updatePhoto = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = {
        category: req.body.category,
        subcategory: req.body.subcategory,
        description: req.body.description,
        tags: req.body.tags,
        isBeforeAfter: req.body.isBeforeAfter,
        beforeAfterPairId: req.body.beforeAfterPairId,
    };
    // Remove undefined values
    Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
            delete updateData[key];
        }
    });
    const updatedPhoto = await photo_service_js_1.PhotoService.updatePhoto(id, updateData);
    logger_js_1.uploadLogger.info('Photo metadata updated', {
        photoId: id,
        updatedFields: Object.keys(updateData),
        updatedBy: req.user.id,
    });
    res.json({
        success: true,
        message: 'Photo updated successfully',
        data: { photo: updatedPhoto }
    });
});
/**
 * Delete photo
 */
PhotoController.deletePhoto = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await photo_service_js_1.PhotoService.deletePhoto(id);
    logger_js_1.uploadLogger.info('Photo deleted', {
        photoId: id,
        deletedBy: req.user.id,
    });
    res.json({
        success: true,
        message: 'Photo deleted successfully'
    });
});
/**
 * Create before/after photo pair
 */
PhotoController.createBeforeAfterPair = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { beforePhotoId, afterPhotoId } = req.body;
    if (!beforePhotoId || !afterPhotoId) {
        throw new error_handler_js_1.BadRequestError('Both before and after photo IDs are required');
    }
    const result = await photo_service_js_1.PhotoService.createBeforeAfterPair(beforePhotoId, afterPhotoId);
    logger_js_1.uploadLogger.info('Before/after pair created', {
        beforePhotoId,
        afterPhotoId,
        createdBy: req.user.id,
    });
    res.json({
        success: true,
        message: 'Before/after pair created successfully',
        data: result
    });
});
/**
 * Get photo statistics
 */
PhotoController.getPhotoStats = (0, error_js_1.asyncHandler)(async (req, res) => {
    const stats = await photo_service_js_1.PhotoService.getPhotoStats();
    res.json({
        success: true,
        message: 'Photo statistics retrieved successfully',
        data: { stats }
    });
});
/**
 * Bulk delete photos
 */
PhotoController.bulkDeletePhotos = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { photoIds } = req.body;
    if (!Array.isArray(photoIds) || photoIds.length === 0) {
        throw new error_handler_js_1.BadRequestError('Photo IDs array is required');
    }
    await photo_service_js_1.PhotoService.bulkDeletePhotos(photoIds);
    logger_js_1.uploadLogger.info('Bulk photo deletion completed', {
        photoIds,
        count: photoIds.length,
        deletedBy: req.user.id,
    });
    res.json({
        success: true,
        message: `${photoIds.length} photos deleted successfully`
    });
});
/**
 * Get photos by category for patient
 */
PhotoController.getPhotosByCategory = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { patientId, category } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await photo_service_js_1.PhotoService.searchPhotos({
        patientId,
        category: category,
        page,
        limit,
        sortBy: 'uploadedAt',
        sortOrder: 'desc',
    });
    res.json({
        success: true,
        message: `${category} photos retrieved successfully`,
        data: result
    });
});
/**
 * Get treatment phase photos
 */
PhotoController.getTreatmentPhasePhotos = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { treatmentPhaseId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await photo_service_js_1.PhotoService.searchPhotos({
        treatmentPhaseId,
        page,
        limit,
        sortBy: 'uploadedAt',
        sortOrder: 'asc',
    });
    res.json({
        success: true,
        message: 'Treatment phase photos retrieved successfully',
        data: result
    });
});
/**
 * Get before/after photo pairs for patient
 */
PhotoController.getBeforeAfterPairs = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { patientId } = req.params;
    const result = await photo_service_js_1.PhotoService.searchPhotos({
        patientId,
        page: 1,
        limit: 100, // Get all before/after photos
        sortBy: 'uploadedAt',
        sortOrder: 'desc',
    });
    // Group photos by beforeAfterPairId
    const pairs = {};
    result.photos.forEach(photo => {
        if (photo.isBeforeAfter && photo.beforeAfterPairId) {
            if (!pairs[photo.beforeAfterPairId]) {
                pairs[photo.beforeAfterPairId] = [];
            }
            pairs[photo.beforeAfterPairId].push(photo);
        }
    });
    // Convert to array and sort pairs by oldest photo
    const pairsArray = Object.entries(pairs).map(([pairId, photos]) => ({
        pairId,
        photos: photos.sort((a, b) => a.uploadedAt.getTime() - b.uploadedAt.getTime()),
        createdAt: Math.min(...photos.map(p => p.uploadedAt.getTime())),
    })).sort((a, b) => b.createdAt - a.createdAt);
    res.json({
        success: true,
        message: 'Before/after pairs retrieved successfully',
        data: {
            pairs: pairsArray,
            totalPairs: pairsArray.length
        }
    });
});
/**
 * Get recent photos
 */
PhotoController.getRecentPhotos = (0, error_js_1.asyncHandler)(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const patientId = req.query.patientId;
    const result = await photo_service_js_1.PhotoService.searchPhotos({
        patientId,
        page: 1,
        limit,
        sortBy: 'uploadedAt',
        sortOrder: 'desc',
    });
    res.json({
        success: true,
        message: 'Recent photos retrieved successfully',
        data: { photos: result.photos }
    });
});
/**
 * Get photo categories summary for patient
 */
PhotoController.getPhotoCategoriesSummary = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { patientId } = req.params;
    // Get all photos for patient to create summary
    const allPhotos = await photo_service_js_1.PhotoService.searchPhotos({
        patientId,
        page: 1,
        limit: 1000, // Get all photos
    });
    // Group by category
    const categorySummary = allPhotos.photos.reduce((summary, photo) => {
        const category = photo.category;
        if (!summary[category]) {
            summary[category] = {
                count: 0,
                latestPhoto: null,
                subcategories: new Set(),
            };
        }
        summary[category].count++;
        if (photo.subcategory) {
            summary[category].subcategories.add(photo.subcategory);
        }
        if (!summary[category].latestPhoto ||
            photo.uploadedAt > summary[category].latestPhoto.uploadedAt) {
            summary[category].latestPhoto = photo;
        }
        return summary;
    }, {});
    // Convert subcategories Set to Array
    Object.keys(categorySummary).forEach(category => {
        categorySummary[category].subcategories = Array.from(categorySummary[category].subcategories);
    });
    res.json({
        success: true,
        message: 'Photo categories summary retrieved successfully',
        data: {
            categorySummary,
            totalPhotos: allPhotos.photos.length
        }
    });
});
/**
 * Download photo (original quality)
 */
PhotoController.downloadPhoto = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const photo = await photo_service_js_1.PhotoService.getPhotoById(id);
    // Redirect to the original Cloudinary URL for download
    res.redirect(photo.urls.original);
});
/**
 * Batch update photo metadata
 */
PhotoController.batchUpdatePhotos = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { photoUpdates } = req.body; // Array of { id, updateData }
    if (!Array.isArray(photoUpdates) || photoUpdates.length === 0) {
        throw new error_handler_js_1.BadRequestError('Photo updates array is required');
    }
    const results = {
        successful: 0,
        failed: 0,
        errors: [],
    };
    for (const update of photoUpdates) {
        try {
            await photo_service_js_1.PhotoService.updatePhoto(update.id, update.updateData);
            results.successful++;
        }
        catch (error) {
            results.failed++;
            results.errors.push(`${update.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    logger_js_1.uploadLogger.info('Batch photo update completed', {
        totalPhotos: photoUpdates.length,
        successful: results.successful,
        failed: results.failed,
        updatedBy: req.user.id,
    });
    res.json({
        success: results.failed === 0,
        message: `Batch update completed. ${results.successful} successful, ${results.failed} failed.`,
        data: results
    });
});
exports.default = PhotoController;
