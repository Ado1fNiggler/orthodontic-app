import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../utils/logger.js';

let isCloudinaryConfigured = false;

export const initializeCloudinary = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    logger.warn('⚠️ Cloudinary credentials not found. Photo upload will be limited to local storage.');
    return false;
  }

  try {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    isCloudinaryConfigured = true;
    logger.info('✅ Cloudinary configured successfully');
    return true;
  } catch (error) {
    logger.error('❌ Failed to configure Cloudinary:', error);
    return false;
  }
};

// Upload photo to Cloudinary
export const uploadPhotoToCloudinary = async (
  fileBuffer: Buffer,
  options: {
    folder?: string;
    filename?: string;
    patientId?: string;
    category?: string;
    transformation?: any;
  } = {}
) => {
  if (!isCloudinaryConfigured) {
    throw new Error('Cloudinary is not configured');
  }

  const {
    folder = process.env.CLOUDINARY_FOLDER || 'orthodontic-app',
    filename,
    patientId,
    category,
    transformation
  } = options;

  // Create folder structure: orthodontic-app/patients/{patientId}/{category}
  let uploadFolder = folder;
  if (patientId) {
    uploadFolder += `/patients/${patientId}`;
    if (category) {
      uploadFolder += `/${category}`;
    }
  }

  const uploadOptions: any = {
    folder: uploadFolder,
    resource_type: 'auto',
    quality: 'auto:good',
    format: 'auto',
    flags: 'sanitize',
    context: {
      patient_id: patientId || '',
      category: category || '',
      uploaded_at: new Date().toISOString(),
    },
    tags: [
      'orthodontic',
      patientId ? `patient_${patientId}` : 'general',
      category || 'uncategorized'
    ].filter(Boolean),
  };

  if (filename) {
    uploadOptions.public_id = filename;
  }

  if (transformation) {
    uploadOptions.transformation = transformation;
  }

  try {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            logger.error('Cloudinary upload error:', error);
            reject(error);
          } else if (result) {
            logger.info(`📸 Photo uploaded to Cloudinary: ${result.public_id}`);
            resolve({
              public_id: result.public_id,
              secure_url: result.secure_url,
              url: result.url,
              width: result.width,
              height: result.height,
              format: result.format,
              bytes: result.bytes,
              folder: result.folder,
              created_at: result.created_at,
              version: result.version,
            });
          } else {
            reject(new Error('Upload failed: No result returned'));
          }
        }
      ).end(fileBuffer);
    });
  } catch (error) {
    logger.error('Cloudinary upload error:', error);
    throw error;
  }
};

// Delete photo from Cloudinary
export const deletePhotoFromCloudinary = async (publicId: string) => {
  if (!isCloudinaryConfigured) {
    throw new Error('Cloudinary is not configured');
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      logger.info(`🗑️ Photo deleted from Cloudinary: ${publicId}`);
      return true;
    } else {
      logger.warn(`⚠️ Failed to delete photo from Cloudinary: ${publicId}`, result);
      return false;
    }
  } catch (error) {
    logger.error('Cloudinary delete error:', error);
    throw error;
  }
};

// Generate transformation URL
export const generateTransformationUrl = (
  publicId: string,
  transformations: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string | number;
    format?: string;
    effect?: string;
  }
) => {
  if (!isCloudinaryConfigured) {
    return null;
  }

  try {
    return cloudinary.url(publicId, {
      ...transformations,
      secure: true,
    });
  } catch (error) {
    logger.error('Cloudinary transformation error:', error);
    return null;
  }
};

// Get optimized photo URLs for different use cases
export const getOptimizedPhotoUrls = (publicId: string) => {
  if (!isCloudinaryConfigured) {
    return null;
  }

  return {
    // Thumbnail for lists and previews
    thumbnail: cloudinary.url(publicId, {
      width: 200,
      height: 200,
      crop: 'fill',
      quality: 'auto:good',
      format: 'auto',
      secure: true,
    }),
    
    // Medium size for detail views
    medium: cloudinary.url(publicId, {
      width: 800,
      height: 600,
      crop: 'limit',
      quality: 'auto:good',
      format: 'auto',
      secure: true,
    }),
    
    // High quality for clinical review
    high: cloudinary.url(publicId, {
      width: 1920,
      height: 1440,
      crop: 'limit',
      quality: 'auto:best',
      format: 'auto',
      secure: true,
    }),
    
    // Original size
    original: cloudinary.url(publicId, {
      secure: true,
    }),
  };
};

// Bulk operations
export const bulkDeleteFromCloudinary = async (publicIds: string[]) => {
  if (!isCloudinaryConfigured) {
    throw new Error('Cloudinary is not configured');
  }

  try {
    const result = await cloudinary.api.delete_resources(publicIds);
    logger.info(`🗑️ Bulk deleted ${Object.keys(result.deleted).length} photos from Cloudinary`);
    return result;
  } catch (error) {
    logger.error('Cloudinary bulk delete error:', error);
    throw error;
  }
};

// Search photos by tags or context
export const searchPhotosInCloudinary = async (searchParams: {
  patientId?: string;
  category?: string;
  tag?: string;
  maxResults?: number;
}) => {
  if (!isCloudinaryConfigured) {
    throw new Error('Cloudinary is not configured');
  }

  const { patientId, category, tag, maxResults = 50 } = searchParams;
  
  let expression = 'resource_type:image';
  
  if (patientId) {
    expression += ` AND tags:patient_${patientId}`;
  }
  
  if (category) {
    expression += ` AND tags:${category}`;
  }
  
  if (tag) {
    expression += ` AND tags:${tag}`;
  }

  try {
    const result = await cloudinary.search
      .expression(expression)
      .max_results(maxResults)
      .sort_by([['created_at', 'desc']])
      .execute();

    return result.resources;
  } catch (error) {
    logger.error('Cloudinary search error:', error);
    throw error;
  }
};

// Health check for Cloudinary
export const checkCloudinaryHealth = async () => {
  if (!isCloudinaryConfigured) {
    return { status: 'disabled', message: 'Cloudinary not configured' };
  }

  try {
    // Simple API call to check connectivity
    await cloudinary.api.ping();
    return { status: 'healthy', message: 'Cloudinary is accessible' };
  } catch (error) {
    logger.error('Cloudinary health check failed:', error);
    return { status: 'unhealthy', message: 'Cloudinary connection failed' };
  }
};

export { cloudinary, isCloudinaryConfigured };