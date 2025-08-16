"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logFileUpload = exports.generateSafeFilename = exports.detectFileType = exports.handleMulterError = exports.validateFile = exports.photoFields = exports.multiplePhotos = exports.singlePhoto = exports.uploadLocal = exports.uploadFile = exports.uploadDocument = exports.uploadPhoto = void 0;
const error_handler_js_1 = require("../utils/error.handler.js");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const logger_js_1 = require("../utils/logger.js");
// File filter for images
const imageFilter = (req, file, cb) => {
    const allowedMimes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/bmp',
        'image/tiff'
    ];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new error_handler_js_1.BadRequestError('Only image files are allowed'), false);
    }
};
// File filter for documents
const documentFilter = (req, file, cb) => {
    const allowedMimes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv'
    ];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new error_handler_js_1.BadRequestError('Only document files are allowed'), false);
    }
};
// File filter for all allowed types
const allFilesFilter = (req, file, cb) => {
    const allowedExtensions = process.env.ALLOWED_FILE_TYPES?.split(',') ||
        ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'];
    const fileExtension = path_1.default.extname(file.originalname).toLowerCase().substring(1);
    if (allowedExtensions.includes(fileExtension)) {
        cb(null, true);
    }
    else {
        cb(new error_handler_js_1.BadRequestError(`File type .${fileExtension} is not allowed`), false);
    }
};
// Memory storage for Cloudinary uploads
const memoryStorage = multer_1.default.memoryStorage();
// Disk storage for local development
const diskStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path_1.default.join(process.cwd(), 'uploads');
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path_1.default.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
    }
});
// Get file size limits from environment
const getFileSizeLimit = (type) => {
    const defaultLimits = {
        photo: 5 * 1024 * 1024, // 5MB
        document: 10 * 1024 * 1024, // 10MB
        general: 10 * 1024 * 1024 // 10MB
    };
    switch (type) {
        case 'photo':
            return parseInt(process.env.MAX_PHOTO_SIZE || String(defaultLimits.photo));
        case 'document':
            return parseInt(process.env.MAX_FILE_SIZE || String(defaultLimits.document));
        default:
            return parseInt(process.env.MAX_FILE_SIZE || String(defaultLimits.general));
    }
};
// Photo upload middleware
exports.uploadPhoto = (0, multer_1.default)({
    storage: memoryStorage,
    fileFilter: imageFilter,
    limits: {
        fileSize: getFileSizeLimit('photo'),
        files: 10, // Max 10 files at once
    }
});
// Document upload middleware
exports.uploadDocument = (0, multer_1.default)({
    storage: memoryStorage,
    fileFilter: documentFilter,
    limits: {
        fileSize: getFileSizeLimit('document'),
        files: 5, // Max 5 files at once
    }
});
// General file upload middleware
exports.uploadFile = (0, multer_1.default)({
    storage: memoryStorage,
    fileFilter: allFilesFilter,
    limits: {
        fileSize: getFileSizeLimit('general'),
        files: 10,
    }
});
// Local storage for development
exports.uploadLocal = (0, multer_1.default)({
    storage: diskStorage,
    fileFilter: allFilesFilter,
    limits: {
        fileSize: getFileSizeLimit('general'),
        files: 10,
    }
});
// Single photo upload
exports.singlePhoto = exports.uploadPhoto.single('photo');
// Multiple photos upload
exports.multiplePhotos = exports.uploadPhoto.array('photos', 10);
// Photo fields upload (for different categories)
exports.photoFields = exports.uploadPhoto.fields([
    { name: 'intraoral', maxCount: 10 },
    { name: 'extraoral', maxCount: 10 },
    { name: 'radiographs', maxCount: 5 },
    { name: 'models', maxCount: 5 },
    { name: 'clinical', maxCount: 10 },
    { name: 'progress', maxCount: 10 },
]);
// File validation middleware
const validateFile = (req, res, next) => {
    if (!req.file && !req.files) {
        return next(new error_handler_js_1.BadRequestError('No file uploaded'));
    }
    // Validate file size
    const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];
    for (const file of files) {
        if (!file)
            continue;
        // Additional MIME type validation
        if (file.mimetype.startsWith('image/') && file.size > getFileSizeLimit('photo')) {
            return next(new error_handler_js_1.BadRequestError('Photo file too large'));
        }
        if (!file.mimetype.startsWith('image/') && file.size > getFileSizeLimit('document')) {
            return next(new error_handler_js_1.BadRequestError('Document file too large'));
        }
        // Validate file name
        if (!file.originalname || file.originalname.length > 255) {
            return next(new error_handler_js_1.BadRequestError('Invalid file name'));
        }
    }
    next();
};
exports.validateFile = validateFile;
// Error handler for multer errors
const handleMulterError = (error, req, res, next) => {
    if (error instanceof multer_1.default.MulterError) {
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                return next(new error_handler_js_1.BadRequestError('File too large'));
            case 'LIMIT_FILE_COUNT':
                return next(new error_handler_js_1.BadRequestError('Too many files'));
            case 'LIMIT_UNEXPECTED_FILE':
                return next(new error_handler_js_1.BadRequestError('Unexpected file field'));
            default:
                return next(new error_handler_js_1.BadRequestError(`Upload error: ${error.message}`));
        }
    }
    next(error);
};
exports.handleMulterError = handleMulterError;
// File type detection utility
const detectFileType = (file) => {
    if (file.mimetype.startsWith('image/')) {
        return 'image';
    }
    const documentMimes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv'
    ];
    if (documentMimes.includes(file.mimetype)) {
        return 'document';
    }
    return 'unknown';
};
exports.detectFileType = detectFileType;
// Generate safe filename
const generateSafeFilename = (originalName, prefix) => {
    const extension = path_1.default.extname(originalName).toLowerCase();
    const baseName = path_1.default.basename(originalName, extension)
        .replace(/[^a-zA-Z0-9]/g, '_')
        .substring(0, 50);
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1000);
    const safeBaseName = prefix ? `${prefix}_${baseName}` : baseName;
    return `${safeBaseName}_${timestamp}_${random}${extension}`;
};
exports.generateSafeFilename = generateSafeFilename;
// Log file upload
const logFileUpload = (req, res, next) => {
    if (req.file || req.files) {
        const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];
        files.forEach(file => {
            if (file) {
                logger_js_1.logger.info('File uploaded:', {
                    filename: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                    fieldname: file.fieldname,
                    userId: req.user?.id,
                    ip: req.ip,
                });
            }
        });
    }
    next();
};
exports.logFileUpload = logFileUpload;
