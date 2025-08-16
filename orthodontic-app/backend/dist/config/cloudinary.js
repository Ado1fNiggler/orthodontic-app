"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCloudinaryConfigured = exports.cloudinary = exports.checkCloudinaryHealth = exports.searchPhotosInCloudinary = exports.bulkDeleteFromCloudinary = exports.getOptimizedPhotoUrls = exports.generateTransformationUrl = exports.deletePhotoFromCloudinary = exports.uploadPhotoToCloudinary = exports.initializeCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
Object.defineProperty(exports, "cloudinary", { enumerable: true, get: function () { return cloudinary_1.v2; } });
const logger_js_1 = require("../utils/logger.js");
let isCloudinaryConfigured = false;
exports.isCloudinaryConfigured = isCloudinaryConfigured;
const initializeCloudinary = () => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
        logger_js_1.logger.warn('⚠️ Cloudinary credentials not found. Photo upload will be limited to local storage.');
        return false;
    }
    try {
        cloudinary_1.v2.config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret,
            secure: true,
        });
        exports.isCloudinaryConfigured = isCloudinaryConfigured = true;
        logger_js_1.logger.info('✅ Cloudinary configured successfully');
        return true;
    }
    catch (error) {
        logger_js_1.logger.error('❌ Failed to configure Cloudinary:', error);
        return false;
    }
};
exports.initializeCloudinary = initializeCloudinary;
// Upload photo to Cloudinary
const uploadPhotoToCloudinary = async (fileBuffer, options = {}) => {
    if (!isCloudinaryConfigured) {
        throw new Error('Cloudinary is not configured');
    }
    const { folder = process.env.CLOUDINARY_FOLDER || 'orthodontic-app', filename, patientId, category, transformation } = options;
    // Create folder structure: orthodontic-app/patients/{patientId}/{category}
    let uploadFolder = folder;
    if (patientId) {
        uploadFolder += `/patients/${patientId}`;
        if (category) {
            uploadFolder += `/${category}`;
        }
    }
    const uploadOptions = {
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
            cloudinary_1.v2.uploader.upload_stream(uploadOptions, (error, result) => {
                if (error) {
                    logger_js_1.logger.error('Cloudinary upload error:', error);
                    reject(error);
                }
                else if (result) {
                    logger_js_1.logger.info(`📸 Photo uploaded to Cloudinary: ${result.public_id}`);
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
                }
                else {
                    reject(new Error('Upload failed: No result returned'));
                }
            }).end(fileBuffer);
        });
    }
    catch (error) {
        logger_js_1.logger.error('Cloudinary upload error:', error);
        throw error;
    }
};
exports.uploadPhotoToCloudinary = uploadPhotoToCloudinary;
// Delete photo from Cloudinary
const deletePhotoFromCloudinary = async (publicId) => {
    if (!isCloudinaryConfigured) {
        throw new Error('Cloudinary is not configured');
    }
    try {
        const result = await cloudinary_1.v2.uploader.destroy(publicId);
        if (result.result === 'ok') {
            logger_js_1.logger.info(`🗑️ Photo deleted from Cloudinary: ${publicId}`);
            return true;
        }
        else {
            logger_js_1.logger.warn(`⚠️ Failed to delete photo from Cloudinary: ${publicId}`, result);
            return false;
        }
    }
    catch (error) {
        logger_js_1.logger.error('Cloudinary delete error:', error);
        throw error;
    }
};
exports.deletePhotoFromCloudinary = deletePhotoFromCloudinary;
// Generate transformation URL
const generateTransformationUrl = (publicId, transformations) => {
    if (!isCloudinaryConfigured) {
        return null;
    }
    try {
        return cloudinary_1.v2.url(publicId, {
            ...transformations,
            secure: true,
        });
    }
    catch (error) {
        logger_js_1.logger.error('Cloudinary transformation error:', error);
        return null;
    }
};
exports.generateTransformationUrl = generateTransformationUrl;
// Get optimized photo URLs for different use cases
const getOptimizedPhotoUrls = (publicId) => {
    if (!isCloudinaryConfigured) {
        return null;
    }
    return {
        // Thumbnail for lists and previews
        thumbnail: cloudinary_1.v2.url(publicId, {
            width: 200,
            height: 200,
            crop: 'fill',
            quality: 'auto:good',
            format: 'auto',
            secure: true,
        }),
        // Medium size for detail views
        medium: cloudinary_1.v2.url(publicId, {
            width: 800,
            height: 600,
            crop: 'limit',
            quality: 'auto:good',
            format: 'auto',
            secure: true,
        }),
        // High quality for clinical review
        high: cloudinary_1.v2.url(publicId, {
            width: 1920,
            height: 1440,
            crop: 'limit',
            quality: 'auto:best',
            format: 'auto',
            secure: true,
        }),
        // Original size
        original: cloudinary_1.v2.url(publicId, {
            secure: true,
        }),
    };
};
exports.getOptimizedPhotoUrls = getOptimizedPhotoUrls;
// Bulk operations
const bulkDeleteFromCloudinary = async (publicIds) => {
    if (!isCloudinaryConfigured) {
        throw new Error('Cloudinary is not configured');
    }
    try {
        const result = await cloudinary_1.v2.api.delete_resources(publicIds);
        logger_js_1.logger.info(`🗑️ Bulk deleted ${Object.keys(result.deleted).length} photos from Cloudinary`);
        return result;
    }
    catch (error) {
        logger_js_1.logger.error('Cloudinary bulk delete error:', error);
        throw error;
    }
};
exports.bulkDeleteFromCloudinary = bulkDeleteFromCloudinary;
// Search photos by tags or context
const searchPhotosInCloudinary = async (searchParams) => {
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
        const result = await cloudinary_1.v2.search
            .expression(expression)
            .max_results(maxResults)
            .sort_by('created_at', 'desc')
            .execute();
        return result.resources;
    }
    catch (error) {
        logger_js_1.logger.error('Cloudinary search error:', error);
        throw error;
    }
};
exports.searchPhotosInCloudinary = searchPhotosInCloudinary;
// Health check for Cloudinary
const checkCloudinaryHealth = async () => {
    if (!isCloudinaryConfigured) {
        return { status: 'disabled', message: 'Cloudinary not configured' };
    }
    try {
        // Simple API call to check connectivity
        await cloudinary_1.v2.api.ping();
        return { status: 'healthy', message: 'Cloudinary is accessible' };
    }
    catch (error) {
        logger_js_1.logger.error('Cloudinary health check failed:', error);
        return { status: 'unhealthy', message: 'Cloudinary connection failed' };
    }
};
exports.checkCloudinaryHealth = checkCloudinaryHealth;
