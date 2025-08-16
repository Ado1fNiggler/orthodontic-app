import { BadRequestError } from '../utils/error.handler.js';
import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { logger } from '../utils/logger.js';


// File filter for images
const imageFilter = (req: Request, file: Express.Multer.File, cb: any) => {
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
  } else {
    cb(new BadRequestError('Only image files are allowed'), false);
  }
};

// File filter for documents
const documentFilter = (req: Request, file: Express.Multer.File, cb: any) => {
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
  } else {
    cb(new BadRequestError('Only document files are allowed'), false);
  }
};

// File filter for all allowed types
const allFilesFilter = (req: Request, file: Express.Multer.File, cb: any) => {
  const allowedExtensions = process.env.ALLOWED_FILE_TYPES?.split(',') || 
    ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'];
  
  const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
  
  if (allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new BadRequestError(`File type .${fileExtension} is not allowed`), false);
  }
};

// Memory storage for Cloudinary uploads
const memoryStorage = multer.memoryStorage();

// Disk storage for local development
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  }
});

// Get file size limits from environment
const getFileSizeLimit = (type: 'photo' | 'document' | 'general') => {
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
export const uploadPhoto = multer({
  storage: memoryStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: getFileSizeLimit('photo'),
    files: 10, // Max 10 files at once
  }
});

// Document upload middleware
export const uploadDocument = multer({
  storage: memoryStorage,
  fileFilter: documentFilter,
  limits: {
    fileSize: getFileSizeLimit('document'),
    files: 5, // Max 5 files at once
  }
});

// General file upload middleware
export const uploadFile = multer({
  storage: memoryStorage,
  fileFilter: allFilesFilter,
  limits: {
    fileSize: getFileSizeLimit('general'),
    files: 10,
  }
});

// Local storage for development
export const uploadLocal = multer({
  storage: diskStorage,
  fileFilter: allFilesFilter,
  limits: {
    fileSize: getFileSizeLimit('general'),
    files: 10,
  }
});

// Single photo upload
export const singlePhoto = uploadPhoto.single('photo');

// Multiple photos upload
export const multiplePhotos = uploadPhoto.array('photos', 10);

// Photo fields upload (for different categories)
export const photoFields = uploadPhoto.fields([
  { name: 'intraoral', maxCount: 10 },
  { name: 'extraoral', maxCount: 10 },
  { name: 'radiographs', maxCount: 5 },
  { name: 'models', maxCount: 5 },
  { name: 'clinical', maxCount: 10 },
  { name: 'progress', maxCount: 10 },
]);

// File validation middleware
export const validateFile = (req: Request, res: any, next: any) => {
  if (!req.file && !req.files) {
    return next(new BadRequestError('No file uploaded'));
  }

  // Validate file size
  const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];
  
  for (const file of files) {
    if (!file) continue;
    
    // Additional MIME type validation
    if (file.mimetype.startsWith('image/') && file.size > getFileSizeLimit('photo')) {
      return next(new BadRequestError('Photo file too large'));
    }
    
    if (!file.mimetype.startsWith('image/') && file.size > getFileSizeLimit('document')) {
      return next(new BadRequestError('Document file too large'));
    }

    // Validate file name
    if (!file.originalname || file.originalname.length > 255) {
      return next(new BadRequestError('Invalid file name'));
    }
  }

  next();
};

// Error handler for multer errors
export const handleMulterError = (error: any, req: Request, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return next(new BadRequestError('File too large'));
      case 'LIMIT_FILE_COUNT':
        return next(new BadRequestError('Too many files'));
      case 'LIMIT_UNEXPECTED_FILE':
        return next(new BadRequestError('Unexpected file field'));
      default:
        return next(new BadRequestError(`Upload error: ${error.message}`));
    }
  }
  next(error);
};

// File type detection utility
export const detectFileType = (file: Express.Multer.File): 'image' | 'document' | 'unknown' => {
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

// Generate safe filename
export const generateSafeFilename = (originalName: string, prefix?: string): string => {
  const extension = path.extname(originalName).toLowerCase();
  const baseName = path.basename(originalName, extension)
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 50);
  
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1000);
  
  const safeBaseName = prefix ? `${prefix}_${baseName}` : baseName;
  
  return `${safeBaseName}_${timestamp}_${random}${extension}`;
};

// Log file upload
export const logFileUpload = (req: Request, res: any, next: any) => {
  if (req.file || req.files) {
    const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];
    
    files.forEach(file => {
      if (file) {
        logger.info('File uploaded:', {
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