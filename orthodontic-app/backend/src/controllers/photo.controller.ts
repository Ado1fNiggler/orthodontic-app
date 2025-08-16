import { BadRequestError } from '../utils/error.handler.js';
import { Request, Response } from 'express';
import { PhotoService } from '../services/photo.service.js';
import { asyncHandler } from '../middleware/error.js';
import { logger, uploadLogger } from '../utils/logger.js';


export class PhotoController {
  /**
   * Upload single photo
   */
  static uploadPhoto = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new BadRequestError('No photo file provided');
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
      uploadedBy: req.user!.id,
    };

    const photo = await PhotoService.uploadPhoto(req.file, photoData);

    uploadLogger.info('Photo uploaded successfully', {
      photoId: photo.id,
      patientId: photoData.patientId,
      category: photoData.category,
      uploadedBy: req.user!.id,
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
  static uploadMultiplePhotos = asyncHandler(async (req: Request, res: Response) => {
    const files = req.files;
    
    if (!files || (Array.isArray(files) ? files.length === 0 : Object.keys(files).length === 0)) {
      throw new BadRequestError('No photo files provided');
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
      uploadedBy: req.user!.id,
    };

    let fileArray: Express.Multer.File[] = [];

    if (Array.isArray(files)) {
      fileArray = files;
    } else if (files.photos) {
      fileArray = Array.isArray(files.photos) ? files.photos : [files.photos];
    } else {
      // Handle field-based uploads
      fileArray = Object.values(files).flat();
    }

    const photos = await PhotoService.uploadMultiplePhotos(fileArray, photoData);

    uploadLogger.info('Multiple photos uploaded successfully', {
      count: photos.length,
      patientId: photoData.patientId,
      category: photoData.category,
      uploadedBy: req.user!.id,
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
  static getPhotoById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const photo = await PhotoService.getPhotoById(id);

    res.json({
      success: true,
      message: 'Photo retrieved successfully',
      data: { photo }
    });
  });

  /**
   * Search photos
   */
  static searchPhotos = asyncHandler(async (req: Request, res: Response) => {
    const searchParams = {
      patientId: req.query.patientId as string,
      category: req.query.category as any,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      treatmentPhaseId: req.query.treatmentPhaseId as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      sortBy: (req.query.sortBy as any) || 'uploadedAt',
      sortOrder: (req.query.sortOrder as any) || 'desc',
    };

    const result = await PhotoService.searchPhotos(searchParams);

    res.json({
      success: true,
      message: 'Photos retrieved successfully',
      data: result
    });
  });

  /**
   * Get photos by patient ID
   */
  static getPhotosByPatientId = asyncHandler(async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const category = req.query.category as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

    const photos = await PhotoService.getPhotosByPatientId(patientId, category, limit);

    res.json({
      success: true,
      message: 'Patient photos retrieved successfully',
      data: { photos }
    });
  });

  /**
   * Update photo metadata
   */
  static updatePhoto = asyncHandler(async (req: Request, res: Response) => {
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
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });

    const updatedPhoto = await PhotoService.updatePhoto(id, updateData);

    uploadLogger.info('Photo metadata updated', {
      photoId: id,
      updatedFields: Object.keys(updateData),
      updatedBy: req.user!.id,
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
  static deletePhoto = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await PhotoService.deletePhoto(id);

    uploadLogger.info('Photo deleted', {
      photoId: id,
      deletedBy: req.user!.id,
    });

    res.json({
      success: true,
      message: 'Photo deleted successfully'
    });
  });

  /**
   * Create before/after photo pair
   */
  static createBeforeAfterPair = asyncHandler(async (req: Request, res: Response) => {
    const { beforePhotoId, afterPhotoId } = req.body;

    if (!beforePhotoId || !afterPhotoId) {
      throw new BadRequestError('Both before and after photo IDs are required');
    }

    const result = await PhotoService.createBeforeAfterPair(beforePhotoId, afterPhotoId);

    uploadLogger.info('Before/after pair created', {
      beforePhotoId,
      afterPhotoId,
      createdBy: req.user!.id,
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
  static getPhotoStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await PhotoService.getPhotoStats();

    res.json({
      success: true,
      message: 'Photo statistics retrieved successfully',
      data: { stats }
    });
  });

  /**
   * Bulk delete photos
   */
  static bulkDeletePhotos = asyncHandler(async (req: Request, res: Response) => {
    const { photoIds } = req.body;

    if (!Array.isArray(photoIds) || photoIds.length === 0) {
      throw new BadRequestError('Photo IDs array is required');
    }

    await PhotoService.bulkDeletePhotos(photoIds);

    uploadLogger.info('Bulk photo deletion completed', {
      photoIds,
      count: photoIds.length,
      deletedBy: req.user!.id,
    });

    res.json({
      success: true,
      message: `${photoIds.length} photos deleted successfully`
    });
  });

  /**
   * Get photos by category for patient
   */
  static getPhotosByCategory = asyncHandler(async (req: Request, res: Response) => {
    const { patientId, category } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await PhotoService.searchPhotos({
      patientId,
      category: category as any,
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
  static getTreatmentPhasePhotos = asyncHandler(async (req: Request, res: Response) => {
    const { treatmentPhaseId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await PhotoService.searchPhotos({
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
  static getBeforeAfterPairs = asyncHandler(async (req: Request, res: Response) => {
    const { patientId } = req.params;

    const result = await PhotoService.searchPhotos({
      patientId,
      page: 1,
      limit: 100, // Get all before/after photos
      sortBy: 'uploadedAt',
      sortOrder: 'desc',
    });

    // Group photos by beforeAfterPairId
    const pairs: Record<string, any[]> = {};
    
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
  static getRecentPhotos = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const patientId = req.query.patientId as string;

    const result = await PhotoService.searchPhotos({
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
  static getPhotoCategoriesSummary = asyncHandler(async (req: Request, res: Response) => {
    const { patientId } = req.params;

    // Get all photos for patient to create summary
    const allPhotos = await PhotoService.searchPhotos({
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
    }, {} as any);

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
  static downloadPhoto = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const photo = await PhotoService.getPhotoById(id);

    // Redirect to the original Cloudinary URL for download
    res.redirect(photo.urls.original);
  });

  /**
   * Batch update photo metadata
   */
  static batchUpdatePhotos = asyncHandler(async (req: Request, res: Response) => {
    const { photoUpdates } = req.body; // Array of { id, updateData }

    if (!Array.isArray(photoUpdates) || photoUpdates.length === 0) {
      throw new BadRequestError('Photo updates array is required');
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const update of photoUpdates) {
      try {
        await PhotoService.updatePhoto(update.id, update.updateData);
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push(`${update.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    uploadLogger.info('Batch photo update completed', {
      totalPhotos: photoUpdates.length,
      successful: results.successful,
      failed: results.failed,
      updatedBy: req.user!.id,
    });

    res.json({
      success: results.failed === 0,
      message: `Batch update completed. ${results.successful} successful, ${results.failed} failed.`,
      data: results
    });
  });
}

export default PhotoController;