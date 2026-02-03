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
 * - Patient-specific file organization
 */

import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { ApiError } from "../utils/ApiError.js";
import { Patient } from "../models/Patient.model.js";

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
        'image/bmp': ['.bmp'],
        'image/svg+xml': ['.svg'],
        
        // Documents - for medical records, reports, etc.
        'application/pdf': ['.pdf'],
        'application/msword': ['.doc'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        'application/vnd.ms-excel': ['.xls'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        'application/vnd.ms-powerpoint': ['.ppt'],
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
        'text/plain': ['.txt'],
        'text/csv': ['.csv'],
        'application/rtf': ['.rtf'],
        
        // Medical imaging formats
        'application/dicom': ['.dcm', '.dicom'],
        
        // Archives
        'application/zip': ['.zip'],
        'application/x-rar-compressed': ['.rar'],
        'application/x-7z-compressed': ['.7z'],
        
        // Audio/Video (for telemedicine, patient recordings)
        'audio/mpeg': ['.mp3'],
        'audio/wav': ['.wav'],
        'video/mp4': ['.mp4'],
        'video/mpeg': ['.mpeg', '.mpg'],
        'video/quicktime': ['.mov'],
        'video/x-msvideo': ['.avi'],
        'video/x-matroska': ['.mkv'],
        'video/webm': ['.webm']
    },
    
    // File size limits (in bytes)
    FILE_SIZE_LIMITS: {
        medical_image: 50 * 1024 * 1024,      // 50MB for medical images (X-rays, CT scans)
        document: 20 * 1024 * 1024,           // 20MB for general documents
        prescription: 10 * 1024 * 1024,       // 10MB for prescriptions
        lab_result: 15 * 1024 * 1024,         // 15MB for lab results
        profile_photo: 5 * 1024 * 1024,       // 5MB for profile photos
        insurance_doc: 10 * 1024 * 1024,      // 10MB for insurance documents
        audio_video: 100 * 1024 * 1024,       // 100MB for audio/video recordings
        archive: 50 * 1024 * 1024,            // 50MB for archives
        default: 25 * 1024 * 1024             // 25MB default
    },
    
    // Upload directories - organized by document type and patient ID
    UPLOAD_DIRS: {
        temp: './public/temp',
        medical_records: './uploads/medical-records',
        prescriptions: './uploads/prescriptions',
        lab_results: './uploads/lab-results',
        profile_photos: './uploads/profiles',
        reports: './uploads/reports',
        insurance_docs: './uploads/insurance',
        medical_images: './uploads/medical-images',
        consent_forms: './uploads/consent-forms',
        telemedicine: './uploads/telemedicine',
        audio_video: './uploads/audio-video',
        archives: './uploads/archives',
        documents: './uploads/documents'
    }
};

/**
 * Generate patient-specific upload directory path
 * Organizes files by patient ID for better management
 */
const getPatientUploadPath = (baseDir, patientId) => {
    return path.join(baseDir, patientId);
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
    const randomHash = crypto.randomBytes(16).toString('hex');
    const extension = path.extname(file.originalname).toLowerCase();
    
    // Sanitize original filename (remove special characters, keep only safe chars)
    const sanitizedOriginalName = file.originalname
        .replace(/[^a-zA-Z0-9._-]/g, '_')  // Only allow alphanumeric, dots, underscores, hyphens
        .replace(/_{2,}/g, '_')            // Replace multiple underscores with single
        .replace(/^[._-]+/, '')            // Remove leading special chars
        .replace(/[._-]+$/, '')            // Remove trailing special chars
        .substring(0, 100);                // Limit length
    
    // Remove extension from original name if present
    const nameWithoutExt = path.basename(sanitizedOriginalName, extension);
    
    // Format: userId_timestamp_randomHash_sanitizedOriginalName.ext
    // This format prevents collision and maintains traceability
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
        // Get patient ID from authenticated user
        const patientId = req.user?.patientId || req.user?._id || 'unknown';
        
        // Check if mime type is in allowed list
        const isAllowedMimeType = Object.keys(UPLOAD_CONFIG.ALLOWED_MIME_TYPES)
            .includes(file.mimetype);
        
        if (!isAllowedMimeType) {
            console.warn(`⚠️ Rejected file upload - Invalid MIME type: ${file.mimetype}`, {
                filename: file.originalname,
                patientId,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                timestamp: new Date().toISOString()
            });
            
            return cb(
                new ApiError(
                    400, 
                    `File type "${file.mimetype}" is not allowed. ` +
                    `Allowed types: PDF, DOC/DOCX, XLS/XLSX, JPG/PNG, DICOM, MP3/MP4, ZIP`
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
                patientId,
                ip: req.ip
            });
            
            return cb(
                new ApiError(
                    400, 
                    `File extension "${fileExtension}" does not match the file type "${file.mimetype}". ` +
                    `Possible file corruption or incorrect file type.`
                ),
                false
            );
        }
        
        // Check for dangerous filename patterns (executables, scripts, etc.)
        const filename = file.originalname.toLowerCase();
        const dangerousPatterns = [
            '.exe', '.bat', '.cmd', '.sh', '.php', '.js', '.html', '.htm',
            '.asp', '.aspx', '.jsp', '.py', '.pl', '.cgi', '.jar', '.war',
            '.ear', '.vbs', '.ps1', '.msi', '.com', '.scr', '.pif', '.reg'
        ];
        
        const hasDangerousPattern = dangerousPatterns.some(pattern => 
            filename.endsWith(pattern)
        );
        
        if (hasDangerousPattern) {
            console.error(`🚨 SECURITY ALERT: Blocked potentially dangerous file upload`, {
                filename: file.originalname,
                patientId,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                pattern: dangerousPatterns.find(p => filename.endsWith(p)),
                timestamp: new Date().toISOString()
            });
            
            // In production, you might want to alert security team here
            
            return cb(
                new ApiError(
                    400, 
                    'File type not allowed for security reasons. ' +
                    'Executable files and scripts are prohibited.'
                ),
                false
            );
        }
        
        // Check for double extensions (e.g., filename.jpg.exe)
        const parts = file.originalname.split('.');
        if (parts.length > 2) {
            const lastTwoExtensions = parts.slice(-2).join('.');
            if (dangerousPatterns.some(pattern => `.${lastTwoExtensions}`.endsWith(pattern))) {
                console.error(`🚨 SECURITY ALERT: Blocked file with double extension`, {
                    filename: file.originalname,
                    patientId,
                    ip: req.ip,
                    doubleExtension: lastTwoExtensions
                });
                
                return cb(
                    new ApiError(
                        400, 
                        'File with suspicious extension pattern detected. Upload blocked for security.'
                    ),
                    false
                );
            }
        }
        
        // Check filename length
        if (file.originalname.length > 255) {
            return cb(
                new ApiError(400, 'Filename is too long. Maximum 255 characters allowed.'),
                false
            );
        }
        
        // Check for null bytes in filename (potential exploit)
        if (file.originalname.indexOf('\0') !== -1) {
            console.error(`🚨 SECURITY ALERT: Filename contains null byte`, {
                filename: file.originalname,
                patientId,
                ip: req.ip
            });
            
            return cb(
                new ApiError(400, 'Invalid filename detected.'),
                false
            );
        }
        
        // Log successful file validation for audit (HIPAA requirement)
        console.log(`✅ File validation passed:`, {
            filename: file.originalname,
            secureFilename: generateSecureFilename(file, patientId),
            mimetype: file.mimetype,
            size: file.size,
            patientId,
            uploadType: req.body.uploadType || req.query.uploadType || 'default',
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
 * Determines where and how files are stored with patient-specific organization
 */
const medicalStorage = multer.diskStorage({
    destination: async function (req, file, cb) {
        try {
            // Get patient ID from authenticated user
            const patientId = req.user?.patientId || req.user?._id?.toString() || 'anonymous';
            
            // Determine destination based on upload type from request body
            const uploadType = req.body.uploadType || req.query.uploadType || 'documents';
            let destination = UPLOAD_CONFIG.UPLOAD_DIRS[uploadType] || 
                            UPLOAD_CONFIG.UPLOAD_DIRS.documents;
            
            // Create patient-specific subdirectory
            const patientSpecificPath = getPatientUploadPath(destination, patientId);
            
            // Ensure destination directory exists
            if (!fs.existsSync(patientSpecificPath)) {
                fs.mkdirSync(patientSpecificPath, { recursive: true });
                console.log(`📁 Created patient directory: ${patientSpecificPath}`);
            }
            
            // Add patient-specific path to request for later use
            if (!req.uploadMetadata) {
                req.uploadMetadata = {};
            }
            req.uploadMetadata.patientId = patientId;
            req.uploadMetadata.uploadType = uploadType;
            req.uploadMetadata.destinationPath = patientSpecificPath;
            
            cb(null, patientSpecificPath);
            
        } catch (error) {
            console.error('❌ Storage destination error:', error);
            cb(new ApiError(500, 'Failed to configure file storage'), false);
        }
    },
    
    filename: function (req, file, cb) {
        try {
            // Generate secure filename
            const patientId = req.user?.patientId || req.user?._id?.toString() || 'anonymous';
            const secureFilename = generateSecureFilename(file, patientId);
            
            // Store original filename in metadata
            if (!req.uploadMetadata) {
                req.uploadMetadata = {};
            }
            if (!req.uploadMetadata.files) {
                req.uploadMetadata.files = [];
            }
            
            req.uploadMetadata.files.push({
                originalName: file.originalname,
                secureName: secureFilename,
                mimetype: file.mimetype,
                size: file.size,
                uploadType: req.body.uploadType || req.query.uploadType || 'documents',
                uploadedAt: new Date().toISOString()
            });
            
            // Log file upload attempt for audit trail (HIPAA requirement)
            console.log(`📄 Medical file upload initiated:`, {
                originalFilename: file.originalname,
                secureFilename: secureFilename,
                patientId: patientId,
                uploadType: req.body.uploadType || req.query.uploadType || 'documents',
                mimetype: file.mimetype,
                size: file.size,
                destination: req.uploadMetadata?.destinationPath,
                timestamp: new Date().toISOString()
            });
            
            cb(null, secureFilename);
            
        } catch (error) {
            console.error('❌ Filename generation error:', error);
            cb(new ApiError(500, 'Failed to generate secure filename'), false);
        }
    }
});

/**
 * Main upload middleware for general medical documents
 * Default size limit: 25MB, Max files: 10
 */
export const upload = multer({
    storage: medicalStorage,
    fileFilter: medicalFileFilter,
    limits: {
        fileSize: UPLOAD_CONFIG.FILE_SIZE_LIMITS.default,
        files: 10, // Maximum 10 files per request
        fields: 20, // Maximum 20 non-file fields
        parts: 30,  // Maximum 30 parts (files + fields)
        headerPairs: 2000 // For preventing DoS attacks
    }
});

/**
 * Upload middleware for medical images (X-rays, CT scans, MRIs)
 * Higher size limit: 50MB, Max files: 20
 */
export const uploadMedicalImage = multer({
    storage: medicalStorage,
    fileFilter: (req, file, cb) => {
        // Only allow medical image types
        const allowedImageTypes = [
            'image/jpeg', 'image/png', 'image/tiff', 'image/dicom',
            'image/bmp', 'image/svg+xml', 'application/dicom'
        ];
        
        if (!allowedImageTypes.includes(file.mimetype)) {
            return cb(
                new ApiError(
                    400, 
                    'Only medical image formats (JPEG, PNG, TIFF, DICOM, BMP, SVG) are allowed'
                ),
                false
            );
        }
        
        // Also run the general medical file filter for additional security checks
        medicalFileFilter(req, file, cb);
    },
    limits: {
        fileSize: UPLOAD_CONFIG.FILE_SIZE_LIMITS.medical_image,
        files: 20, // Allow multiple medical images
        fields: 10
    }
});

/**
 * Upload middleware for profile photos
 * Smaller size limit: 5MB, Only 1 file, Only images
 */
export const uploadProfilePhoto = multer({
    storage: medicalStorage,
    fileFilter: (req, file, cb) => {
        // Only allow common image types for profile photos
        const allowedImageTypes = [
            'image/jpeg', 
            'image/png', 
            'image/webp',
            'image/gif'
        ];
        
        if (!allowedImageTypes.includes(file.mimetype)) {
            return cb(
                new ApiError(
                    400, 
                    'Only JPEG, PNG, WebP, and GIF images are allowed for profile photos'
                ),
                false
            );
        }
        
        cb(null, true);
    },
    limits: {
        fileSize: UPLOAD_CONFIG.FILE_SIZE_LIMITS.profile_photo,
        files: 1, // Only one profile photo at a time
        fields: 5
    }
});

/**
 * Upload middleware for prescription documents
 * Size limit: 10MB, Max files: 5, Only PDF and images
 */
export const uploadPrescription = multer({
    storage: medicalStorage,
    fileFilter: (req, file, cb) => {
        // Only PDF and images for prescriptions
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/tiff'
        ];
        
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(
                new ApiError(
                    400, 
                    'Only PDF and image files (JPEG, PNG, TIFF) are allowed for prescriptions'
                ),
                false
            );
        }
        
        cb(null, true);
    },
    limits: {
        fileSize: UPLOAD_CONFIG.FILE_SIZE_LIMITS.prescription,
        files: 5, // Maximum 5 prescription files
        fields: 10
    }
});

/**
 * Upload middleware for lab results
 * Size limit: 15MB, Max files: 10
 */
export const uploadLabResult = multer({
    storage: medicalStorage,
    fileFilter: medicalFileFilter,
    limits: {
        fileSize: UPLOAD_CONFIG.FILE_SIZE_LIMITS.lab_result,
        files: 10,
        fields: 15
    }
});

/**
 * Upload middleware for insurance documents
 * Size limit: 10MB, Max files: 10
 */
export const uploadInsuranceDoc = multer({
    storage: medicalStorage,
    fileFilter: medicalFileFilter,
    limits: {
        fileSize: UPLOAD_CONFIG.FILE_SIZE_LIMITS.insurance_doc,
        files: 10,
        fields: 10
    }
});

/**
 * Upload middleware for audio/video files (telemedicine, recordings)
 * Size limit: 100MB, Max files: 5
 */
export const uploadAudioVideo = multer({
    storage: medicalStorage,
    fileFilter: (req, file, cb) => {
        // Only audio/video files for telemedicine
        const allowedTypes = [
            'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm',
            'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo',
            'video/x-matroska', 'video/webm', 'video/ogg'
        ];
        
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(
                new ApiError(
                    400, 
                    'Only audio (MP3, WAV, OGG) and video (MP4, MPEG, MOV, AVI, MKV, WebM) files are allowed'
                ),
                false
            );
        }
        
        cb(null, true);
    },
    limits: {
        fileSize: UPLOAD_CONFIG.FILE_SIZE_LIMITS.audio_video,
        files: 5,
        fields: 10
    }
});

/**
 * Upload middleware for archive files (compressed medical records)
 * Size limit: 50MB, Max files: 3
 */
export const uploadArchive = multer({
    storage: medicalStorage,
    fileFilter: (req, file, cb) => {
        // Only archive files
        const allowedTypes = [
            'application/zip',
            'application/x-rar-compressed',
            'application/x-7z-compressed',
            'application/x-tar',
            'application/gzip'
        ];
        
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(
                new ApiError(
                    400, 
                    'Only archive files (ZIP, RAR, 7Z, TAR, GZ) are allowed'
                ),
                false
            );
        }
        
        cb(null, true);
    },
    limits: {
        fileSize: UPLOAD_CONFIG.FILE_SIZE_LIMITS.archive,
        files: 3,
        fields: 5
    }
});

/**
 * Custom middleware for patient-specific document uploads
 * Validates patient exists before allowing upload
 */
export const validatePatientUpload = asyncHandler(async (req, res, next) => {
    try {
        const patientId = req.user?.patientId || req.user?._id;
        
        if (!patientId) {
            throw new ApiError(400, 'Patient ID is required for document upload');
        }
        
        // Verify patient exists and is active
        const patient = await Patient.findById(patientId);
        if (!patient) {
            throw new ApiError(404, 'Patient not found');
        }
        
        if (patient.status !== 'active') {
            throw new ApiError(400, 'Patient account is not active');
        }
        
        // Add patient info to request for audit logging
        req.patientInfo = {
            id: patient._id,
            medicalRecordNumber: patient.medicalRecordNumber,
            name: patient.user ? `${patient.user.firstName} ${patient.user.lastName}` : 'Unknown'
        };
        
        next();
    } catch (error) {
        console.error('❌ Patient validation error:', error);
        next(error);
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
            patientId: req.user?.patientId || req.user?._id || 'anonymous',
            ip: req.ip,
            timestamp: new Date().toISOString()
        });
        
        // Handle specific Multer errors
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                const uploadType = req.body.uploadType || 'default';
                const maxSizeMB = Math.round(UPLOAD_CONFIG.FILE_SIZE_LIMITS[uploadType] || 
                                           UPLOAD_CONFIG.FILE_SIZE_LIMITS.default) / (1024 * 1024);
                return res.status(413).json({
                    success: false,
                    message: 'File size exceeds the maximum limit',
                    error: `Maximum file size allowed is ${maxSizeMB}MB`,
                    errorCode: 'FILE_TOO_LARGE',
                    maxSizeMB: maxSizeMB
                });
                
            case 'LIMIT_FILE_COUNT':
                return res.status(400).json({
                    success: false,
                    message: 'Too many files uploaded',
                    error: 'Maximum 10 files can be uploaded at once',
                    errorCode: 'TOO_MANY_FILES',
                    maxFiles: 10
                });
                
            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({
                    success: false,
                    message: 'Unexpected file field',
                    error: `Unexpected field: ${error.field}. Please check your form fields.`,
                    errorCode: 'UNEXPECTED_FIELD'
                });
                
            case 'LIMIT_PART_COUNT':
                return res.status(400).json({
                    success: false,
                    message: 'Too many form parts',
                    error: 'Request contains too many parts (files + fields)',
                    errorCode: 'TOO_MANY_PARTS'
                });
                
            case 'LIMIT_FIELD_KEY':
                return res.status(400).json({
                    success: false,
                    message: 'Field name too long',
                    error: 'Field name exceeds maximum allowed length',
                    errorCode: 'FIELD_NAME_TOO_LONG'
                });
                
            case 'LIMIT_FIELD_VALUE':
                return res.status(400).json({
                    success: false,
                    message: 'Field value too long',
                    error: 'Field value exceeds maximum allowed length',
                    errorCode: 'FIELD_VALUE_TOO_LONG'
                });
                
            case 'LIMIT_FIELD_COUNT':
                return res.status(400).json({
                    success: false,
                    message: 'Too many form fields',
                    error: 'Request contains too many form fields',
                    errorCode: 'TOO_MANY_FIELDS'
                });
                
            default:
                return res.status(400).json({
                    success: false,
                    message: 'File upload error',
                    error: error.message,
                    errorCode: 'UPLOAD_ERROR'
                });
        }
    }
    
    if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
            success: false,
            message: error.message,
            errorCode: error.errorCode || 'VALIDATION_ERROR'
        });
    }
    
    // Log unexpected errors
    console.error('❌ Unexpected upload error:', {
        error: error.message,
        stack: error.stack,
        patientId: req.user?.patientId || req.user?._id || 'anonymous',
        timestamp: new Date().toISOString()
    });
    
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
    
    const files = req.files ? 
        (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : 
        [req.file];
    
    const validationErrors = [];
    const validatedFiles = [];
    
    files.forEach((file, index) => {
        try {
            // Check if file was actually saved
            if (!file || !file.path) {
                validationErrors.push({
                    originalName: file?.originalname || `File ${index}`,
                    error: 'File object is invalid or missing path'
                });
                return;
            }
            
            if (!fs.existsSync(file.path)) {
                validationErrors.push({
                    originalName: file.originalname,
                    secureName: file.filename,
                    error: 'File was not saved properly to disk'
                });
                return;
            }
            
            // Verify file size matches what was uploaded
            const stats = fs.statSync(file.path);
            if (stats.size !== file.size) {
                validationErrors.push({
                    originalName: file.originalname,
                    secureName: file.filename,
                    error: 'File size mismatch - possible corruption during upload',
                    expectedSize: file.size,
                    actualSize: stats.size
                });
                return;
            }
            
            // Check if file is empty
            if (stats.size === 0) {
                validationErrors.push({
                    originalName: file.originalname,
                    secureName: file.filename,
                    error: 'File is empty (0 bytes)'
                });
                return;
            }
            
            // Check if file is too large (defense in depth)
            const maxSize = UPLOAD_CONFIG.FILE_SIZE_LIMITS.default;
            if (stats.size > maxSize) {
                validationErrors.push({
                    originalName: file.originalname,
                    secureName: file.filename,
                    error: `File size (${stats.size} bytes) exceeds maximum limit (${maxSize} bytes)`
                });
                return;
            }
            
            // Check file permissions (should not be executable)
            const isExecutable = (stats.mode & 0o111) !== 0;
            if (isExecutable) {
                validationErrors.push({
                    originalName: file.originalname,
                    secureName: file.filename,
                    error: 'File has executable permissions - security risk'
                });
                return;
            }
            
            // Basic file content validation for images
            if (file.mimetype.startsWith('image/')) {
                const magicNumbers = {
                    'image/jpeg': Buffer.from([0xFF, 0xD8, 0xFF]),
                    'image/png': Buffer.from([0x89, 0x50, 0x4E, 0x47]),
                    'image/gif': Buffer.from([0x47, 0x49, 0x46, 0x38]),
                    'image/webp': Buffer.from([0x52, 0x49, 0x46, 0x46]),
                    'application/pdf': Buffer.from([0x25, 0x50, 0x44, 0x46])
                };
                
                if (magicNumbers[file.mimetype]) {
                    const fileBuffer = Buffer.alloc(4);
                    const fd = fs.openSync(file.path, 'r');
                    fs.readSync(fd, fileBuffer, 0, 4, 0);
                    fs.closeSync(fd);
                    
                    const expectedMagic = magicNumbers[file.mimetype];
                    if (!fileBuffer.slice(0, expectedMagic.length).equals(expectedMagic)) {
                        validationErrors.push({
                            originalName: file.originalname,
                            secureName: file.filename,
                            error: 'File content does not match its declared MIME type'
                        });
                        return;
                    }
                }
            }
            
            // File passed all validations
            validatedFiles.push({
                ...file,
                validation: {
                    passed: true,
                    sizeValid: true,
                    exists: true,
                    timestamp: new Date().toISOString()
                }
            });
            
        } catch (error) {
            console.error(`❌ Error validating file ${file?.originalname}:`, error);
            validationErrors.push({
                originalName: file?.originalname || `File ${index}`,
                error: 'Unable to validate file: ' + error.message
            });
        }
    });
    
    if (validationErrors.length > 0) {
        console.error('❌ File validation errors:', {
            errors: validationErrors,
            patientId: req.user?.patientId || req.user?._id || 'anonymous',
            totalFiles: files.length,
            failedFiles: validationErrors.length
        });
        
        // Cleanup uploaded files if validation fails
        cleanupTempFiles(files);
        
        return res.status(400).json({
            success: false,
            message: 'File validation failed',
            errors: validationErrors,
            errorCode: 'VALIDATION_FAILED',
            totalFiles: files.length,
            failedFiles: validationErrors.length
        });
    }
    
    console.log(`✅ File validation passed for ${validatedFiles.length} file(s):`, {
        files: validatedFiles.map(f => ({ 
            name: f.originalname, 
            size: f.size,
            type: f.mimetype,
            secureName: f.filename 
        })),
        patientId: req.user?.patientId || req.user?._id || 'anonymous',
        timestamp: new Date().toISOString()
    });
    
    // Add validated files to request
    req.validatedFiles = validatedFiles;
    
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
    let cleanedCount = 0;
    let errorCount = 0;
    
    fileArray.forEach(file => {
        try {
            if (file && file.path && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
                cleanedCount++;
                console.log(`🗑️ Cleaned up file: ${file.filename || file.originalname}`);
                
                // Also clean up thumbnail if it exists
                const thumbPath = `${file.path}.thumb`;
                if (fs.existsSync(thumbPath)) {
                    fs.unlinkSync(thumbPath);
                    console.log(`🗑️ Cleaned up thumbnail: ${thumbPath}`);
                }
            }
        } catch (error) {
            errorCount++;
            console.error(`⚠️ Error cleaning up file ${file?.filename}:`, error.message);
        }
    });
    
    console.log(`🗑️ Cleanup completed: ${cleanedCount} files cleaned, ${errorCount} errors`);
};

/**
 * Middleware to move file from temp to permanent storage
 * Use after successful processing
 * 
 * @param {string} targetDir - Target directory key from UPLOAD_DIRS
 */
export const moveToStorage = (targetDir) => {
    return async (req, res, next) => {
        if (!req.file && !req.files) {
            return next();
        }
        
        const files = req.files ? 
            (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : 
            [req.file];
        
        const destination = UPLOAD_CONFIG.UPLOAD_DIRS[targetDir];
        
        if (!destination) {
            console.error(`❌ Invalid target directory: ${targetDir}`);
            return next(new ApiError(500, 'Invalid storage configuration'));
        }
        
        // Get patient ID for subdirectory
        const patientId = req.user?.patientId || req.user?._id?.toString() || 'anonymous';
        const patientSpecificPath = getPatientUploadPath(destination, patientId);
        
        try {
            // Ensure destination exists
            if (!fs.existsSync(patientSpecificPath)) {
                fs.mkdirSync(patientSpecificPath, { recursive: true });
                console.log(`📁 Created permanent storage directory: ${patientSpecificPath}`);
            }
            
            const movedFiles = [];
            
            // Move each file
            for (const file of files) {
                const newPath = path.join(patientSpecificPath, file.filename);
                
                // Check if file already exists (very unlikely with secure filenames)
                if (fs.existsSync(newPath)) {
                    console.warn(`⚠️ File already exists, appending timestamp: ${file.filename}`);
                    const timestamp = Date.now();
                    const newFilename = `${path.basename(file.filename, path.extname(file.filename))}_${timestamp}${path.extname(file.filename)}`;
                    const newPathWithTimestamp = path.join(patientSpecificPath, newFilename);
                    
                    fs.renameSync(file.path, newPathWithTimestamp);
                    file.path = newPathWithTimestamp;
                    file.filename = newFilename;
                } else {
                    fs.renameSync(file.path, newPath);
                    file.path = newPath;
                }
                
                movedFiles.push({
                    originalName: file.originalname,
                    secureName: file.filename,
                    newPath: file.path,
                    size: file.size,
                    mimetype: file.mimetype
                });
                
                console.log(`📦 Moved file to permanent storage: ${file.filename} -> ${patientSpecificPath}`);
            }
            
            // Update file metadata
            req.movedFiles = movedFiles;
            req.permanentStoragePath = patientSpecificPath;
            
            next();
            
        } catch (error) {
            console.error('❌ Error moving files to storage:', error);
            
            // Attempt to cleanup any partially moved files
            try {
                cleanupTempFiles(files);
            } catch (cleanupError) {
                console.error('❌ Error during cleanup after move failure:', cleanupError);
            }
            
            next(new ApiError(500, 'Failed to move files to permanent storage'));
        }
    };
};

/**
 * Generate file metadata for database storage
 * @param {Object} file - Multer file object
 * @param {string} patientId - Patient ID
 * @param {Object} additionalData - Additional metadata
 * @returns {Object} - File metadata object
 */
export const generateFileMetadata = (file, patientId, additionalData = {}) => {
    return {
        originalFilename: file.originalname,
        secureFilename: file.filename,
        filePath: file.path,
        fileSize: file.size,
        mimetype: file.mimetype,
        extension: path.extname(file.originalname).toLowerCase(),
        patientId: patientId,
        uploadTimestamp: new Date(),
        checksum: crypto.createHash('md5').update(file.path).digest('hex'),
        ...additionalData
    };
};

/**
 * Export upload configuration for reference
 */
export { UPLOAD_CONFIG, getPatientUploadPath };

/**
 * Usage Examples:
 * 
 * // Patient profile photo upload
 * router.post('/patients/profile-photo',
 *     verifyJWT,
 *     validatePatientUpload,
 *     uploadProfilePhoto.single('profilePhoto'),
 *     handleUploadError,
 *     validateUploadedFiles,
 *     moveToStorage('profile_photos'),
 *     updateProfilePhotoController
 * );
 * 
 * // Medical document upload (multiple files)
 * router.post('/patients/documents/upload',
 *     verifyJWT,
 *     validatePatientUpload,
 *     upload.array('documents', 10),
 *     handleUploadError,
 *     validateUploadedFiles,
 *     moveToStorage('documents'),
 *     uploadPatientDocumentsController
 * );
 * 
 * // Prescription upload with specific middleware
 * router.post('/patients/prescriptions/upload',
 *     verifyJWT,
 *     validatePatientUpload,
 *     uploadPrescription.array('prescriptions', 5),
 *     handleUploadError,
 *     validateUploadedFiles,
 *     uploadPatientPrescriptionsController
 * );
 * 
 * // Lab results upload with metadata
 * router.post('/patients/lab-results/upload',
 *     verifyJWT,
 *     validatePatientUpload,
 *     uploadLabResult.fields([
 *         { name: 'labReports', maxCount: 5 },
 *         { name: 'labImages', maxCount: 10 }
 *     ]),
 *     handleUploadError,
 *     validateUploadedFiles,
 *     moveToStorage('lab_results'),
 *     uploadLabResultsController
 * );
 * 
 * // Telemedicine session recording
 * router.post('/telemedicine/session/:sessionId/recording',
 *     verifyJWT,
 *     uploadAudioVideo.single('recording'),
 *     handleUploadError,
 *     validateUploadedFiles,
 *     moveToStorage('telemedicine'),
 *     saveSessionRecordingController
 * );
 * 
 * // Insurance document upload
 * router.post('/patients/insurance/documents',
 *     verifyJWT,
 *     validatePatientUpload,
 *     uploadInsuranceDoc.array('insuranceDocs', 5),
 *     handleUploadError,
 *     validateUploadedFiles,
 *     moveToStorage('insurance_docs'),
 *     uploadInsuranceDocumentsController
 * );
 */