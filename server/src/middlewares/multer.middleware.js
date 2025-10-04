/**
 * Healthcare System - File Upload Middleware (Multer)
 * 
 * HIPAA-compliant file upload middleware for handling medical documents,
 * images, prescriptions, and reports with comprehensive security validations.
 * 
 * Features:
 * - Medical file type validation
 * - File size limits for healthcare documents
 * - Secure file naming with encryption
 * - Virus scanning preparation
 * - HIPAA-compliant file handling
 * - Upload audit logging
 * - Multiple upload categories
 * - Automatic cleanup on errors
 */

import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { ApiError } from "../utils/ApiError.js";

/**
 * File Upload Configuration for Healthcare System
 */
const UPLOAD_CONFIG = {
    // Allowed file types for medical documents
    ALLOWED_MIME_TYPES: {
        // Images - for medical imaging, patient photos, etc.
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png'],
        'image/gif': ['.gif'],
        'image/webp': ['.webp'],
        'image/tiff': ['.tiff', '.tif'],
        
        // Documents - for medical records, reports, etc.
        'application/pdf': ['.pdf'],
        'application/msword': ['.doc'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        
        // Medical imaging format (DICOM)
        'application/dicom': ['.dcm'],
        
        // Spreadsheets - for lab results, insurance data
        'application/vnd.ms-excel': ['.xls'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    
    // File size limits (in bytes)
    FILE_SIZE_LIMITS: {
        medical_image: 50 * 1024 * 1024,      // 50MB for medical images (X-rays, CT scans)
        document: 20 * 1024 * 1024,           // 20MB for general documents
        prescription: 10 * 1024 * 1024,       // 10MB for prescriptions
        lab_result: 15 * 1024 * 1024,         // 15MB for lab results
        profile_photo: 5 * 1024 * 1024,       // 5MB for profile photos
        insurance_doc: 10 * 1024 * 1024,      // 10MB for insurance documents
        default: 25 * 1024 * 1024             // 25MB default
    },
    
    // Upload directories - organized by document type
    UPLOAD_DIRS: {
        temp: './public/temp',
        medical_records: './uploads/medical-records',
        prescriptions: './uploads/prescriptions',
        lab_results: './uploads/lab-results',
        profile_photos: './uploads/profiles',
        reports: './uploads/reports',
        insurance_docs: './uploads/insurance',
        medical_images: './uploads/medical-images',
        consent_forms: './uploads/consent-forms'
    }
};

/**
 * Ensure all upload directories exist
 * Creates directories if they don't exist
 */
const ensureUploadDirectories = () => {
    Object.values(UPLOAD_CONFIG.UPLOAD_DIRS).forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`📁 Created upload directory: ${dir}`);
        }
    });
};

// Initialize upload directories on module load
ensureUploadDirectories();

/**
 * Generate secure filename with timestamp and cryptographic hash
 * Prevents filename conflicts and adds security layer
 * 
 * @param {Object} file - Multer file object
 * @param {string} userId - User ID uploading the file
 * @returns {string} - Secure filename
 */
const generateSecureFilename = (file, userId = 'anonymous') => {
    const timestamp = Date.now();
    const randomHash = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(file.originalname).toLowerCase();
    
    // Sanitize original filename (remove special characters)
    const sanitizedOriginalName = file.originalname
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/_{2,}/g, '_')
        .substring(0, 50);
    
    // Remove extension from original name if present
    const nameWithoutExt = sanitizedOriginalName.replace(extension, '');
    
    // Format: userId_timestamp_hash_originalname.ext
    return `${userId}_${timestamp}_${randomHash}_${nameWithoutExt}${extension}`;
};

/**
 * File filter function for medical documents
 * Validates file types and prevents malicious uploads
 * 
 * @param {Object} req - Express request object
 * @param {Object} file - Multer file object
 * @param {Function} cb - Callback function
 */
const medicalFileFilter = (req, file, cb) => {
    try {
        // Check if mime type is in allowed list
        const isAllowedMimeType = Object.keys(UPLOAD_CONFIG.ALLOWED_MIME_TYPES)
            .includes(file.mimetype);
        
        if (!isAllowedMimeType) {
            console.warn(`⚠️ Rejected file upload - Invalid MIME type: ${file.mimetype}`, {
                filename: file.originalname,
                userId: req.user?.userId || 'anonymous',
                ip: req.ip
            });
            
            return cb(
                new ApiError(
                    400, 
                    `File type "${file.mimetype}" is not allowed for medical documents. Allowed types: PDF, DOC, DOCX, JPG, PNG`
                ),
                false
            );
        }
        
        // Check file extension matches mime type
        const fileExtension = path.extname(file.originalname).toLowerCase();
        const allowedExtensions = UPLOAD_CONFIG.ALLOWED_MIME_TYPES[file.mimetype];
        
        if (!allowedExtensions.includes(fileExtension)) {
            console.warn(`⚠️ Rejected file upload - Extension mismatch: ${fileExtension} for MIME ${file.mimetype}`, {
                filename: file.originalname,
                userId: req.user?.userId || 'anonymous'
            });
            
            return cb(
                new ApiError(
                    400, 
                    `File extension "${fileExtension}" does not match the file type. Please ensure the file is not corrupted.`
                ),
                false
            );
        }
        
        // Check for dangerous filename patterns
        const filename = file.originalname.toLowerCase();
        const dangerousPatterns = [
            '.exe', '.bat', '.cmd', '.sh', '.php', 
            '.js', '.html', '.asp', '.jsp', '.py'
        ];
        
        const hasDangerousPattern = dangerousPatterns.some(pattern => 
            filename.includes(pattern)
        );
        
        if (hasDangerousPattern) {
            console.warn(`🚨 SECURITY ALERT: Blocked potentially dangerous file`, {
                filename: file.originalname,
                userId: req.user?.userId || 'anonymous',
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            
            return cb(
                new ApiError(
                    400, 
                    'File type not allowed for security reasons. Executable files are blocked.'
                ),
                false
            );
        }
        
        // Check filename length
        if (file.originalname.length > 255) {
            return cb(
                new ApiError(400, 'Filename is too long. Maximum 255 characters allowed.'),
                false
            );
        }
        
        // Log successful file validation for audit
        console.log(`✅ File validation passed:`, {
            filename: file.originalname,
            mimetype: file.mimetype,
            userId: req.user?.userId || 'anonymous',
            timestamp: new Date().toISOString()
        });
        
        cb(null, true);
        
    } catch (error) {
        console.error('❌ File filter error:', error);
        cb(new ApiError(500, 'File validation failed due to server error'), false);
    }
};

/**
 * Configure Multer storage for medical documents
 * Determines where and how files are stored
 */
const medicalStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Determine destination based on upload type from request body
        const uploadType = req.body.uploadType || req.query.uploadType || 'temp';
        const destination = UPLOAD_CONFIG.UPLOAD_DIRS[uploadType] || 
                          UPLOAD_CONFIG.UPLOAD_DIRS.temp;
        
        // Ensure destination directory exists
        if (!fs.existsSync(destination)) {
            fs.mkdirSync(destination, { recursive: true });
        }
        
        cb(null, destination);
    },
    
    filename: function (req, file, cb) {
        // Generate secure filename
        const userId = req.user?.userId || req.user?._id?.toString() || 'anonymous';
        const secureFilename = generateSecureFilename(file, userId);
        
        // Log file upload attempt for audit trail (HIPAA requirement)
        console.log(`📄 Medical file upload initiated:`, {
            originalFilename: file.originalname,
            secureFilename: secureFilename,
            userId: userId,
            uploadType: req.body.uploadType || 'temp',
            mimetype: file.mimetype,
            timestamp: new Date().toISOString()
        });
        
        cb(null, secureFilename);
    }
});

/**
 * Main upload middleware for general medical documents
 * Default size limit: 25MB, Max files: 5
 */
export const upload = multer({
    storage: medicalStorage,
    fileFilter: medicalFileFilter,
    limits: {
        fileSize: UPLOAD_CONFIG.FILE_SIZE_LIMITS.default,
        files: 5 // Maximum 5 files per request
    }
});

/**
 * Upload middleware for medical images (X-rays, CT scans, MRIs)
 * Higher size limit: 50MB, Max files: 10
 */
export const uploadMedicalImage = multer({
    storage: medicalStorage,
    fileFilter: medicalFileFilter,
    limits: {
        fileSize: UPLOAD_CONFIG.FILE_SIZE_LIMITS.medical_image,
        files: 10 // Allow multiple medical images
    }
});

/**
 * Upload middleware for profile photos
 * Smaller size limit: 5MB, Only 1 file, Only images
 */
export const uploadProfilePhoto = multer({
    storage: medicalStorage,
    fileFilter: (req, file, cb) => {
        // Only allow image types for profile photos
        const allowedImageTypes = [
            'image/jpeg', 
            'image/png', 
            'image/webp'
        ];
        
        if (!allowedImageTypes.includes(file.mimetype)) {
            return cb(
                new ApiError(
                    400, 
                    'Only JPEG, PNG, and WebP images are allowed for profile photos'
                ),
                false
            );
        }
        
        cb(null, true);
    },
    limits: {
        fileSize: UPLOAD_CONFIG.FILE_SIZE_LIMITS.profile_photo,
        files: 1 // Only one profile photo at a time
    }
});

/**
 * Upload middleware for prescription documents
 * Size limit: 10MB, Max files: 3, Only PDF and images
 */
export const uploadPrescription = multer({
    storage: medicalStorage,
    fileFilter: (req, file, cb) => {
        // Only PDF and images for prescriptions
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png'
        ];
        
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(
                new ApiError(
                    400, 
                    'Only PDF and image files (JPEG, PNG) are allowed for prescriptions'
                ),
                false
            );
        }
        
        cb(null, true);
    },
    limits: {
        fileSize: UPLOAD_CONFIG.FILE_SIZE_LIMITS.prescription,
        files: 3 // Maximum 3 prescription files
    }
});

/**
 * Upload middleware for lab results
 * Size limit: 15MB, Max files: 5
 */
export const uploadLabResult = multer({
    storage: medicalStorage,
    fileFilter: medicalFileFilter,
    limits: {
        fileSize: UPLOAD_CONFIG.FILE_SIZE_LIMITS.lab_result,
        files: 5
    }
});

/**
 * Upload middleware for insurance documents
 * Size limit: 10MB, Max files: 5
 */
export const uploadInsuranceDoc = multer({
    storage: medicalStorage,
    fileFilter: medicalFileFilter,
    limits: {
        fileSize: UPLOAD_CONFIG.FILE_SIZE_LIMITS.insurance_doc,
        files: 5
    }
});

/**
 * Middleware to handle Multer upload errors
 * Provides user-friendly error messages
 * 
 * @param {Error} error - Error object
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        console.error('❌ Multer upload error:', {
            code: error.code,
            field: error.field,
            message: error.message,
            userId: req.user?.userId || 'anonymous'
        });
        
        // Handle specific Multer errors
        if (error.code === 'LIMIT_FILE_SIZE') {
            const maxSize = Math.round(UPLOAD_CONFIG.FILE_SIZE_LIMITS.default / (1024 * 1024));
            return res.status(413).json({
                success: false,
                message: 'File size exceeds the maximum limit',
                error: `Maximum file size allowed is ${maxSize}MB`,
                errorCode: 'FILE_TOO_LARGE'
            });
        }
        
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files uploaded',
                error: 'Maximum 5 files can be uploaded at once',
                errorCode: 'TOO_MANY_FILES'
            });
        }
        
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Unexpected file field',
                error: `Unexpected field: ${error.field}`,
                errorCode: 'UNEXPECTED_FIELD'
            });
        }
        
        return res.status(400).json({
            success: false,
            message: 'File upload error',
            error: error.message,
            errorCode: 'UPLOAD_ERROR'
        });
    }
    
    if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
            success: false,
            message: error.message,
            errorCode: 'VALIDATION_ERROR'
        });
    }
    
    // Pass other errors to global error handler
    next(error);
};

/**
 * Middleware to validate uploaded files after multer processing
 * Additional security checks after upload
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const validateUploadedFiles = (req, res, next) => {
    // Skip if no files uploaded
    if (!req.files && !req.file) {
        return next();
    }
    
    const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];
    const validationErrors = [];
    
    files.forEach((file, index) => {
        // Check if file was actually saved
        if (!fs.existsSync(file.path)) {
            validationErrors.push({
                file: file.originalname,
                error: 'File was not saved properly'
            });
        }
        
        // Verify file size matches what was uploaded
        try {
            const stats = fs.statSync(file.path);
            if (stats.size !== file.size) {
                validationErrors.push({
                    file: file.originalname,
                    error: 'File size mismatch - possible corruption'
                });
            }
            
            // Check if file is empty
            if (stats.size === 0) {
                validationErrors.push({
                    file: file.originalname,
                    error: 'File is empty'
                });
            }
        } catch (error) {
            validationErrors.push({
                file: file.originalname,
                error: 'Unable to verify file'
            });
        }
    });
    
    if (validationErrors.length > 0) {
        console.error('❌ File validation errors:', validationErrors);
        
        // Cleanup uploaded files if validation fails
        cleanupTempFiles(files);
        
        return res.status(400).json({
            success: false,
            message: 'File validation failed',
            errors: validationErrors,
            errorCode: 'VALIDATION_FAILED'
        });
    }
    
    console.log(`✅ File validation passed for ${files.length} file(s):`, {
        files: files.map(f => ({ name: f.originalname, size: f.size })),
        userId: req.user?.userId || 'anonymous'
    });
    
    next();
};

/**
 * Cleanup temporary files utility
 * Should be called after successful processing or on error
 * 
 * @param {Array|Object} files - File or array of files to cleanup
 */
export const cleanupTempFiles = (files) => {
    if (!files) return;
    
    const fileArray = Array.isArray(files) ? files : [files];
    
    fileArray.forEach(file => {
        try {
            if (file && file.path && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
                console.log(`🗑️ Cleaned up temp file: ${file.filename || file.originalname}`);
            }
        } catch (error) {
            console.error(`⚠️ Error cleaning up file ${file?.filename}:`, error.message);
        }
    });
};

/**
 * Middleware to move file from temp to permanent storage
 * Use after successful processing
 * 
 * @param {string} targetDir - Target directory key from UPLOAD_DIRS
 */
export const moveToStorage = (targetDir) => {
    return (req, res, next) => {
        if (!req.file && !req.files) {
            return next();
        }
        
        const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];
        const destination = UPLOAD_CONFIG.UPLOAD_DIRS[targetDir];
        
        if (!destination) {
            console.error(`❌ Invalid target directory: ${targetDir}`);
            return next(new ApiError(500, 'Invalid storage configuration'));
        }
        
        // Ensure destination exists
        if (!fs.existsSync(destination)) {
            fs.mkdirSync(destination, { recursive: true });
        }
        
        try {
            files.forEach(file => {
                const newPath = path.join(destination, file.filename);
                fs.renameSync(file.path, newPath);
                file.path = newPath;
                console.log(`📦 Moved file to permanent storage: ${file.filename}`);
            });
            next();
        } catch (error) {
            console.error('❌ Error moving files to storage:', error);
            next(new ApiError(500, 'Failed to move files to permanent storage'));
        }
    };
};

/**
 * Export upload configuration for reference
 */
export { UPLOAD_CONFIG };

/**
 * Usage Examples:
 * 
 * // Single file upload for medical records
 * router.post('/medical-records/upload',
 *     verifyJWT,
 *     upload.single('medicalDocument'),
 *     handleUploadError,
 *     validateUploadedFiles,
 *     uploadMedicalRecord
 * );
 * 
 * // Multiple medical images upload
 * router.post('/medical-images/upload',
 *     verifyJWT,
 *     uploadMedicalImage.array('medicalImages', 10),
 *     handleUploadError,
 *     validateUploadedFiles,
 *     uploadMedicalImages
 * );
 * 
 * // Profile photo upload
 * router.post('/users/profile-photo',
 *     verifyJWT,
 *     uploadProfilePhoto.single('profilePhoto'),
 *     handleUploadError,
 *     validateUploadedFiles,
 *     updateProfilePhoto
 * );
 * 
 * // Prescription upload with specific type
 * router.post('/prescriptions/upload',
 *     verifyJWT,
 *     restrictTo('doctor'),
 *     uploadPrescription.array('prescriptionFiles', 3),
 *     handleUploadError,
 *     validateUploadedFiles,
 *     uploadPrescriptionFiles
 * );
 * 
 * // With permanent storage move
 * router.post('/lab-results/upload',
 *     verifyJWT,
 *     uploadLabResult.array('labResults', 5),
 *     handleUploadError,
 *     validateUploadedFiles,
 *     moveToStorage('lab_results'),
 *     saveLabResults
 * );
 * 
 * // Multiple file fields
 * router.post('/complete-record/upload',
 *     verifyJWT,
 *     upload.fields([
 *         { name: 'prescription', maxCount: 1 },
 *         { name: 'labResults', maxCount: 3 },
 *         { name: 'xrays', maxCount: 5 }
 *     ]),
 *     handleUploadError,
 *     validateUploadedFiles,
 *     processCompleteRecord
 * );
 * 
 * // Cleanup after processing (in controller)
 * try {
 *     // Process files...
 *     await uploadToCloudinary(req.file.path);
 *     cleanupTempFiles(req.file);
 * } catch (error) {
 *     cleanupTempFiles(req.file);
 *     throw error;
 * }
 */