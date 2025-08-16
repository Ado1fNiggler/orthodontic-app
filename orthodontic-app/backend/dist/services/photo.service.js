"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhotoService = void 0;
const error_handler_js_1 = require("../utils/error.handler.js");
const database_js_1 = require("../config/database.js");
const cloudinary_js_1 = require("../config/cloudinary.js");
const logger_js_1 = require("../utils/logger.js");
const path_1 = __importDefault(require("path"));
class PhotoService {
    /**
     * Upload single photo
     */
    static async uploadPhoto(file, // <--- ΔΙΟΡΘΩΣΗ: Χρήση του σωστού τύπου
    data) {
        try {
            // Validate patient exists
            const patient = await database_js_1.prisma.patient.findUnique({
                where: { id: data.patientId },
                select: { id: true, firstName: true, lastName: true }
            });
            if (!patient) {
                throw new error_handler_js_1.NotFoundError('Patient not found');
            }
            // Generate unique filename
            const timestamp = Date.now();
            const randomSuffix = Math.round(Math.random() * 1000);
            const extension = path_1.default.extname(file.originalname).toLowerCase();
            const safeOriginalName = path_1.default.basename(file.originalname, extension)
                .replace(/[^a-zA-Z0-9]/g, '_')
                .substring(0, 50);
            const filename = `${data.category.toLowerCase()}_${safeOriginalName}_${timestamp}_${randomSuffix}${extension}`;
            // Upload to Cloudinary
            const cloudinaryResult = await (0, cloudinary_js_1.uploadPhotoToCloudinary)(file.buffer, {
                folder: process.env.CLOUDINARY_FOLDER || 'orthodontic-app',
                filename: filename.replace(extension, ''), // Cloudinary will add extension
                patientId: data.patientId,
                category: data.category.toLowerCase(),
                transformation: {
                    quality: 'auto:good',
                    format: 'auto',
                }
            });
            // Save photo record to database
            const photo = await database_js_1.prisma.photo.create({
                data: {
                    patientId: data.patientId,
                    filename: filename,
                    originalName: file.originalname,
                    cloudinaryId: cloudinaryResult.public_id,
                    cloudinaryUrl: cloudinaryResult.secure_url,
                    category: data.category,
                    subcategory: data.subcategory,
                    description: data.description,
                    tags: data.tags || [],
                    fileSize: file.size,
                    mimeType: file.mimetype,
                    width: cloudinaryResult.width,
                    height: cloudinaryResult.height,
                    treatmentPhaseId: data.treatmentPhaseId,
                    appointmentId: data.appointmentId,
                    isBeforeAfter: data.isBeforeAfter || false,
                    beforeAfterPairId: data.beforeAfterPairId,
                    uploadedBy: data.uploadedBy,
                },
                include: {
                    patient: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        }
                    },
                    uploader: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        }
                    },
                    treatmentPhase: {
                        select: {
                            id: true,
                            title: true,
                            phaseNumber: true,
                        }
                    },
                    appointment: {
                        select: {
                            id: true,
                            appointmentDate: true,
                            appointmentTime: true,
                        }
                    }
                }
            });
            // Generate optimized URLs
            const urls = (0, cloudinary_js_1.getOptimizedPhotoUrls)(cloudinaryResult.public_id) || {
                thumbnail: cloudinaryResult.secure_url,
                medium: cloudinaryResult.secure_url,
                high: cloudinaryResult.secure_url,
                original: cloudinaryResult.secure_url,
            };
            logger_js_1.uploadLogger.info('Photo uploaded successfully', {
                photoId: photo.id,
                patientId: data.patientId,
                category: data.category,
                filename: filename,
                fileSize: file.size,
                uploadedBy: data.uploadedBy,
            });
            return {
                ...photo,
                urls,
            };
        }
        catch (error) {
            logger_js_1.uploadLogger.error('Photo upload failed', {
                patientId: data.patientId,
                category: data.category,
                filename: file.originalname,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Upload multiple photos
     */
    static async uploadMultiplePhotos(files, // <--- ΔΙΟΡΘΩΣΗ: Χρήση του σωστού τύπου
    data) {
        try {
            const uploadPromises = files.map(file => this.uploadPhoto(file, data));
            const uploadedPhotos = await Promise.all(uploadPromises);
            logger_js_1.uploadLogger.info('Multiple photos uploaded', {
                patientId: data.patientId,
                category: data.category,
                count: files.length,
                uploadedBy: data.uploadedBy,
            });
            return uploadedPhotos;
        }
        catch (error) {
            logger_js_1.uploadLogger.error('Multiple photo upload failed', {
                patientId: data.patientId,
                category: data.category,
                count: files.length,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    // ... (Ο υπόλοιπος κώδικας παραμένει ο ίδιος)
    /**
     * Get photo by ID
     */
    static async getPhotoById(id) {
        try {
            const photo = await database_js_1.prisma.photo.findUnique({
                where: { id },
                include: {
                    patient: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        }
                    },
                    uploader: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        }
                    },
                    treatmentPhase: {
                        select: {
                            id: true,
                            title: true,
                            phaseNumber: true,
                        }
                    },
                    appointment: {
                        select: {
                            id: true,
                            appointmentDate: true,
                            appointmentTime: true,
                        }
                    }
                }
            });
            if (!photo) {
                throw new error_handler_js_1.NotFoundError('Photo not found');
            }
            // Generate optimized URLs
            const urls = (0, cloudinary_js_1.getOptimizedPhotoUrls)(photo.cloudinaryId) || {
                thumbnail: photo.cloudinaryUrl,
                medium: photo.cloudinaryUrl,
                high: photo.cloudinaryUrl,
                original: photo.cloudinaryUrl,
            };
            return {
                ...photo,
                urls,
            };
        }
        catch (error) {
            logger_js_1.logger.error('Get photo by ID failed', {
                photoId: id,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Search photos
     */
    static async searchPhotos(params) {
        try {
            const { patientId, category, tags, treatmentPhaseId, page = 1, limit = 20, sortBy = 'uploadedAt', sortOrder = 'desc', } = params;
            const skip = (page - 1) * limit;
            // Build where clause
            const where = {};
            if (patientId) {
                where.patientId = patientId;
            }
            if (category) {
                where.category = category;
            }
            if (tags && tags.length > 0) {
                where.tags = {
                    hasSome: tags,
                };
            }
            if (treatmentPhaseId) {
                where.treatmentPhaseId = treatmentPhaseId;
            }
            // Execute search
            const [photos, total] = await Promise.all([
                database_js_1.prisma.photo.findMany({
                    where,
                    include: {
                        patient: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            }
                        },
                        uploader: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            }
                        },
                        treatmentPhase: {
                            select: {
                                id: true,
                                title: true,
                                phaseNumber: true,
                            }
                        },
                        appointment: {
                            select: {
                                id: true,
                                appointmentDate: true,
                                appointmentTime: true,
                            }
                        }
                    },
                    skip,
                    take: limit,
                    orderBy: { [sortBy]: sortOrder },
                }),
                database_js_1.prisma.photo.count({ where }),
            ]);
            // Add optimized URLs to each photo
            const photosWithUrls = photos.map(photo => {
                const urls = (0, cloudinary_js_1.getOptimizedPhotoUrls)(photo.cloudinaryId) || {
                    thumbnail: photo.cloudinaryUrl,
                    medium: photo.cloudinaryUrl,
                    high: photo.cloudinaryUrl,
                    original: photo.cloudinaryUrl,
                };
                return {
                    ...photo,
                    urls,
                };
            });
            return {
                photos: photosWithUrls,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                }
            };
        }
        catch (error) {
            logger_js_1.logger.error('Search photos failed', {
                params,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Update photo metadata
     */
    static async updatePhoto(id, updateData) {
        try {
            const updatedPhoto = await database_js_1.prisma.photo.update({
                where: { id },
                data: updateData,
                include: {
                    patient: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        }
                    },
                    uploader: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        }
                    },
                    treatmentPhase: {
                        select: {
                            id: true,
                            title: true,
                            phaseNumber: true,
                        }
                    },
                    appointment: {
                        select: {
                            id: true,
                            appointmentDate: true,
                            appointmentTime: true,
                        }
                    }
                }
            });
            // Generate optimized URLs
            const urls = (0, cloudinary_js_1.getOptimizedPhotoUrls)(updatedPhoto.cloudinaryId) || {
                thumbnail: updatedPhoto.cloudinaryUrl,
                medium: updatedPhoto.cloudinaryUrl,
                high: updatedPhoto.cloudinaryUrl,
                original: updatedPhoto.cloudinaryUrl,
            };
            logger_js_1.uploadLogger.info('Photo metadata updated', {
                photoId: id,
                updatedFields: Object.keys(updateData),
            });
            return {
                ...updatedPhoto,
                urls,
            };
        }
        catch (error) {
            logger_js_1.logger.error('Update photo failed', {
                photoId: id,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Delete photo
     */
    static async deletePhoto(id) {
        try {
            // Get photo details
            const photo = await database_js_1.prisma.photo.findUnique({
                where: { id },
                select: {
                    id: true,
                    cloudinaryId: true,
                    filename: true,
                    patientId: true,
                }
            });
            if (!photo) {
                throw new error_handler_js_1.NotFoundError('Photo not found');
            }
            // Delete from Cloudinary
            try {
                await (0, cloudinary_js_1.deletePhotoFromCloudinary)(photo.cloudinaryId);
            }
            catch (cloudinaryError) {
                // Log error but continue with database deletion
                logger_js_1.logger.warn('Failed to delete photo from Cloudinary', {
                    photoId: id,
                    cloudinaryId: photo.cloudinaryId,
                    error: cloudinaryError instanceof Error ? cloudinaryError.message : 'Unknown error',
                });
            }
            // Delete from database
            await database_js_1.prisma.photo.delete({
                where: { id }
            });
            logger_js_1.uploadLogger.info('Photo deleted', {
                photoId: id,
                filename: photo.filename,
                patientId: photo.patientId,
            });
        }
        catch (error) {
            logger_js_1.logger.error('Delete photo failed', {
                photoId: id,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Get photos by patient ID
     */
    static async getPhotosByPatientId(patientId, category, limit) {
        try {
            const where = { patientId };
            if (category) {
                where.category = category;
            }
            const photos = await database_js_1.prisma.photo.findMany({
                where,
                include: {
                    patient: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        }
                    },
                    uploader: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        }
                    },
                    treatmentPhase: {
                        select: {
                            id: true,
                            title: true,
                            phaseNumber: true,
                        }
                    },
                    appointment: {
                        select: {
                            id: true,
                            appointmentDate: true,
                            appointmentTime: true,
                        }
                    }
                },
                take: limit,
                orderBy: { uploadedAt: 'desc' },
            });
            // Add optimized URLs
            return photos.map(photo => {
                const urls = (0, cloudinary_js_1.getOptimizedPhotoUrls)(photo.cloudinaryId) || {
                    thumbnail: photo.cloudinaryUrl,
                    medium: photo.cloudinaryUrl,
                    high: photo.cloudinaryUrl,
                    original: photo.cloudinaryUrl,
                };
                return {
                    ...photo,
                    urls,
                };
            });
        }
        catch (error) {
            logger_js_1.logger.error('Get photos by patient ID failed', {
                patientId,
                category,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Create before/after photo pair
     */
    static async createBeforeAfterPair(beforePhotoId, afterPhotoId) {
        try {
            const pairId = `pair_${Date.now()}_${Math.round(Math.random() * 1000)}`;
            // Update both photos
            const [beforePhoto, afterPhoto] = await Promise.all([
                this.updatePhoto(beforePhotoId, {
                    isBeforeAfter: true,
                    beforeAfterPairId: pairId,
                }),
                this.updatePhoto(afterPhotoId, {
                    isBeforeAfter: true,
                    beforeAfterPairId: pairId,
                }),
            ]);
            logger_js_1.uploadLogger.info('Before/after pair created', {
                pairId,
                beforePhotoId,
                afterPhotoId,
            });
            return { beforePhoto, afterPhoto };
        }
        catch (error) {
            logger_js_1.logger.error('Create before/after pair failed', {
                beforePhotoId,
                afterPhotoId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Get photo statistics
     */
    static async getPhotoStats() {
        try {
            const [totalPhotos, photosByCategory, photosThisMonth, totalFileSize,] = await Promise.all([
                database_js_1.prisma.photo.count(),
                database_js_1.prisma.photo.groupBy({
                    by: ['category'],
                    _count: { category: true },
                }),
                database_js_1.prisma.photo.count({
                    where: {
                        uploadedAt: {
                            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                        }
                    }
                }),
                database_js_1.prisma.photo.aggregate({
                    _sum: { fileSize: true },
                }),
            ]);
            const categoryStats = photosByCategory.reduce((acc, item) => {
                acc[item.category] = item._count.category;
                return acc;
            }, {});
            return {
                totalPhotos,
                categoryStats,
                photosThisMonth,
                totalFileSize: totalFileSize._sum.fileSize || 0,
            };
        }
        catch (error) {
            logger_js_1.logger.error('Get photo stats failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Bulk delete photos
     */
    static async bulkDeletePhotos(photoIds) {
        try {
            // Get photo details for Cloudinary deletion
            const photos = await database_js_1.prisma.photo.findMany({
                where: { id: { in: photoIds } },
                select: {
                    id: true,
                    cloudinaryId: true,
                    filename: true,
                }
            });
            if (photos.length === 0) {
                throw new error_handler_js_1.NotFoundError('No photos found');
            }
            // Delete from Cloudinary
            const cloudinaryIds = photos.map(photo => photo.cloudinaryId);
            try {
                // Note: bulkDeleteFromCloudinary should be implemented in cloudinary config
                await Promise.all(cloudinaryIds.map(id => (0, cloudinary_js_1.deletePhotoFromCloudinary)(id)));
            }
            catch (cloudinaryError) {
                logger_js_1.logger.warn('Some photos failed to delete from Cloudinary', {
                    photoIds,
                    error: cloudinaryError instanceof Error ? cloudinaryError.message : 'Unknown error',
                });
            }
            // Delete from database
            await database_js_1.prisma.photo.deleteMany({
                where: { id: { in: photoIds } }
            });
            logger_js_1.uploadLogger.info('Bulk delete photos completed', {
                photoIds,
                count: photos.length,
            });
        }
        catch (error) {
            logger_js_1.logger.error('Bulk delete photos failed', {
                photoIds,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
}
exports.PhotoService = PhotoService;
exports.default = PhotoService;
