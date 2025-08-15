import { prisma } from '../config/database.js';
import { uploadPhotoToCloudinary, deletePhotoFromCloudinary, getOptimizedPhotoUrls } from '../config/cloudinary.js';
import { logger, uploadLogger } from '../utils/logger.js';
import { NotFoundError, BadRequestError } from '../middleware/error.js';
import { Prisma } from '@prisma/client';
import path from 'path';
import fs from 'fs/promises';

export interface CreatePhotoData {
  patientId: string;
  category: 'INTRAORAL' | 'EXTRAORAL' | 'RADIOGRAPH' | 'MODELS' | 'CLINICAL' | 'PROGRESS' | 'FINAL';
  subcategory?: string;
  description?: string;
  tags?: string[];
  treatmentPhaseId?: string;
  appointmentId?: string;
  isBeforeAfter?: boolean;
  beforeAfterPairId?: string;
  uploadedBy: string;
}

export interface PhotoSearchParams {
  patientId?: string;
  category?: 'INTRAORAL' | 'EXTRAORAL' | 'RADIOGRAPH' | 'MODELS' | 'CLINICAL' | 'PROGRESS' | 'FINAL';
  tags?: string[];
  treatmentPhaseId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'uploadedAt' | 'category' | 'filename';
  sortOrder?: 'asc' | 'desc';
}

export interface PhotoWithUrls {
  id: string;
  filename: string;
  originalName: string;
  cloudinaryId: string;
  cloudinaryUrl: string;
  category: string;
  subcategory?: string;
  description?: string;
  tags: string[];
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  isBeforeAfter: boolean;
  beforeAfterPairId?: string;
  uploadedAt: Date;
  updatedAt: Date;
  urls: {
    thumbnail: string;
    medium: string;
    high: string;
    original: string;
  };
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  uploader: {
    id: string;
    firstName: string;
    lastName: string;
  };
  treatmentPhase?: {
    id: string;
    title: string;
    phaseNumber: number;
  };
  appointment?: {
    id: string;
    appointmentDate: Date;
    appointmentTime: string;
  };
}

export class PhotoService {
  /**
   * Upload single photo
   */
  static async uploadPhoto(
    file: Express.Multer.File,
    data: CreatePhotoData
  ): Promise<PhotoWithUrls> {
    try {
      // Validate patient exists
      const patient = await prisma.patient.findUnique({
        where: { id: data.patientId },
        select: { id: true, firstName: true, lastName: true }
      });

      if (!patient) {
        throw new NotFoundError('Patient not found');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomSuffix = Math.round(Math.random() * 1000);
      const extension = path.extname(file.originalname).toLowerCase();
      const safeOriginalName = path.basename(file.originalname, extension)
        .replace(/[^a-zA-Z0-9]/g, '_')
        .substring(0, 50);
      
      const filename = `${data.category.toLowerCase()}_${safeOriginalName}_${timestamp}_${randomSuffix}${extension}`;

      // Upload to Cloudinary
      const cloudinaryResult = await uploadPhotoToCloudinary(file.buffer, {
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
      const photo = await prisma.photo.create({
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
      const urls = getOptimizedPhotoUrls(cloudinaryResult.public_id) || {
        thumbnail: cloudinaryResult.secure_url,
        medium: cloudinaryResult.secure_url,
        high: cloudinaryResult.secure_url,
        original: cloudinaryResult.secure_url,
      };

      uploadLogger.info('Photo uploaded successfully', {
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
      } as PhotoWithUrls;
    } catch (error) {
      uploadLogger.error('Photo upload failed', {
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
  static async uploadMultiplePhotos(
    files: Express.Multer.File[],
    data: CreatePhotoData
  ): Promise<PhotoWithUrls[]> {
    try {
      const uploadPromises = files.map(file => this.uploadPhoto(file, data));
      const uploadedPhotos = await Promise.all(uploadPromises);

      uploadLogger.info('Multiple photos uploaded', {
        patientId: data.patientId,
        category: data.category,
        count: files.length,
        uploadedBy: data.uploadedBy,
      });

      return uploadedPhotos;
    } catch (error) {
      uploadLogger.error('Multiple photo upload failed', {
        patientId: data.patientId,
        category: data.category,
        count: files.length,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get photo by ID
   */
  static async getPhotoById(id: string): Promise<PhotoWithUrls> {
    try {
      const photo = await prisma.photo.findUnique({
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
        throw new NotFoundError('Photo not found');
      }

      // Generate optimized URLs
      const urls = getOptimizedPhotoUrls(photo.cloudinaryId) || {
        thumbnail: photo.cloudinaryUrl,
        medium: photo.cloudinaryUrl,
        high: photo.cloudinaryUrl,
        original: photo.cloudinaryUrl,
      };

      return {
        ...photo,
        urls,
      } as PhotoWithUrls;
    } catch (error) {
      logger.error('Get photo by ID failed', {
        photoId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Search photos
   */
  static async searchPhotos(params: PhotoSearchParams) {
    try {
      const {
        patientId,
        category,
        tags,
        treatmentPhaseId,
        page = 1,
        limit = 20,
        sortBy = 'uploadedAt',
        sortOrder = 'desc',
      } = params;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.PhotoWhereInput = {};

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
        prisma.photo.findMany({
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
        prisma.photo.count({ where }),
      ]);

      // Add optimized URLs to each photo
      const photosWithUrls = photos.map(photo => {
        const urls = getOptimizedPhotoUrls(photo.cloudinaryId) || {
          thumbnail: photo.cloudinaryUrl,
          medium: photo.cloudinaryUrl,
          high: photo.cloudinaryUrl,
          original: photo.cloudinaryUrl,
        };

        return {
          ...photo,
          urls,
        } as PhotoWithUrls;
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
    } catch (error) {
      logger.error('Search photos failed', {
        params,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Update photo metadata
   */
  static async updatePhoto(
    id: string,
    updateData: {
      category?: 'INTRAORAL' | 'EXTRAORAL' | 'RADIOGRAPH' | 'MODELS' | 'CLINICAL' | 'PROGRESS' | 'FINAL';
      subcategory?: string;
      description?: string;
      tags?: string[];
      isBeforeAfter?: boolean;
      beforeAfterPairId?: string;
    }
  ): Promise<PhotoWithUrls> {
    try {
      const updatedPhoto = await prisma.photo.update({
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
      const urls = getOptimizedPhotoUrls(updatedPhoto.cloudinaryId) || {
        thumbnail: updatedPhoto.cloudinaryUrl,
        medium: updatedPhoto.cloudinaryUrl,
        high: updatedPhoto.cloudinaryUrl,
        original: updatedPhoto.cloudinaryUrl,
      };

      uploadLogger.info('Photo metadata updated', {
        photoId: id,
        updatedFields: Object.keys(updateData),
      });

      return {
        ...updatedPhoto,
        urls,
      } as PhotoWithUrls;
    } catch (error) {
      logger.error('Update photo failed', {
        photoId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Delete photo
   */
  static async deletePhoto(id: string): Promise<void> {
    try {
      // Get photo details
      const photo = await prisma.photo.findUnique({
        where: { id },
        select: {
          id: true,
          cloudinaryId: true,
          filename: true,
          patientId: true,
        }
      });

      if (!photo) {
        throw new NotFoundError('Photo not found');
      }

      // Delete from Cloudinary
      try {
        await deletePhotoFromCloudinary(photo.cloudinaryId);
      } catch (cloudinaryError) {
        // Log error but continue with database deletion
        logger.warn('Failed to delete photo from Cloudinary', {
          photoId: id,
          cloudinaryId: photo.cloudinaryId,
          error: cloudinaryError instanceof Error ? cloudinaryError.message : 'Unknown error',
        });
      }

      // Delete from database
      await prisma.photo.delete({
        where: { id }
      });

      uploadLogger.info('Photo deleted', {
        photoId: id,
        filename: photo.filename,
        patientId: photo.patientId,
      });
    } catch (error) {
      logger.error('Delete photo failed', {
        photoId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get photos by patient ID
   */
  static async getPhotosByPatientId(
    patientId: string,
    category?: string,
    limit?: number
  ): Promise<PhotoWithUrls[]> {
    try {
      const where: Prisma.PhotoWhereInput = { patientId };
      
      if (category) {
        where.category = category as any;
      }

      const photos = await prisma.photo.findMany({
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
        const urls = getOptimizedPhotoUrls(photo.cloudinaryId) || {
          thumbnail: photo.cloudinaryUrl,
          medium: photo.cloudinaryUrl,
          high: photo.cloudinaryUrl,
          original: photo.cloudinaryUrl,
        };

        return {
          ...photo,
          urls,
        } as PhotoWithUrls;
      });
    } catch (error) {
      logger.error('Get photos by patient ID failed', {
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
  static async createBeforeAfterPair(
    beforePhotoId: string,
    afterPhotoId: string
  ): Promise<{ beforePhoto: PhotoWithUrls; afterPhoto: PhotoWithUrls }> {
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

      uploadLogger.info('Before/after pair created', {
        pairId,
        beforePhotoId,
        afterPhotoId,
      });

      return { beforePhoto, afterPhoto };
    } catch (error) {
      logger.error('Create before/after pair failed', {
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
      const [
        totalPhotos,
        photosByCategory,
        photosThisMonth,
        totalFileSize,
      ] = await Promise.all([
        prisma.photo.count(),
        prisma.photo.groupBy({
          by: ['category'],
          _count: { category: true },
        }),
        prisma.photo.count({
          where: {
            uploadedAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            }
          }
        }),
        prisma.photo.aggregate({
          _sum: { fileSize: true },
        }),
      ]);

      const categoryStats = photosByCategory.reduce((acc, item) => {
        acc[item.category] = item._count.category;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalPhotos,
        categoryStats,
        photosThisMonth,
        totalFileSize: totalFileSize._sum.fileSize || 0,
      };
    } catch (error) {
      logger.error('Get photo stats failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Bulk delete photos
   */
  static async bulkDeletePhotos(photoIds: string[]): Promise<void> {
    try {
      // Get photo details for Cloudinary deletion
      const photos = await prisma.photo.findMany({
        where: { id: { in: photoIds } },
        select: {
          id: true,
          cloudinaryId: true,
          filename: true,
        }
      });

      if (photos.length === 0) {
        throw new NotFoundError('No photos found');
      }

      // Delete from Cloudinary
      const cloudinaryIds = photos.map(photo => photo.cloudinaryId);
      try {
        // Note: bulkDeleteFromCloudinary should be implemented in cloudinary config
        await Promise.all(cloudinaryIds.map(id => deletePhotoFromCloudinary(id)));
      } catch (cloudinaryError) {
        logger.warn('Some photos failed to delete from Cloudinary', {
          photoIds,
          error: cloudinaryError instanceof Error ? cloudinaryError.message : 'Unknown error',
        });
      }

      // Delete from database
      await prisma.photo.deleteMany({
        where: { id: { in: photoIds } }
      });

      uploadLogger.info('Bulk delete photos completed', {
        photoIds,
        count: photos.length,
      });
    } catch (error) {
      logger.error('Bulk delete photos failed', {
        photoIds,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

export default PhotoService;