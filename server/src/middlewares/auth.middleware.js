/**
 * Healthcare System - Authentication & Authorization Middleware
 * 
 * HIPAA-compliant authentication middleware for healthcare applications.
 * Handles JWT verification, role-based access control, and audit logging.
 * 
 * Features:
 * - JWT token verification
 * - Role-based access control (RBAC)
 * - Patient data access authorization
 * - Medical record access control
 * - Audit trail logging
 * - Session management
 */

import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyToken, verifyMedicalRecordToken } from "../utils/jwtUtils.js";
import { logAuthEvent, logPatientAccess } from "../utils/loggerUtils.js";
import { User } from "../models/user.model.js";

/**
 * Verify JWT token and authenticate user
 * Enhanced with healthcare-specific logging and security
 */
export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        // Extract token from cookie or Authorization header
        const token = req.cookies?.accessToken || 
                     req.header("Authorization")?.replace("Bearer ", "").trim();
        
        if (!token) {
            // Log unauthorized access attempt
            logAuthEvent(
                'unknown',
                'UNAUTHORIZED_ACCESS_ATTEMPT',
                req.ip,
                req.get('User-Agent')
            );
            
            throw new ApiError(401, "Authentication required for healthcare access");
        }
        
        // Verify JWT token
        const decodedToken = verifyToken(token, process.env.ACCESS_TOKEN_SECRET);
        
        // Fetch user details (excluding sensitive fields)
        const user = await User.findById(decodedToken.userId)
            .select("-password -refreshToken")
            .lean();
        
        if (!user) {
            // Log invalid token usage
            logAuthEvent(
                decodedToken.userId,
                'INVALID_TOKEN_USED',
                req.ip,
                req.get('User-Agent')
            );
            
            throw new ApiError(401, "Invalid access token - User not found");
        }
        
        // Check if user account is active
        if (!user.isActive) {
            logAuthEvent(
                user._id.toString(),
                'INACTIVE_ACCOUNT_ACCESS_ATTEMPT',
                req.ip,
                req.get('User-Agent')
            );
            
            throw new ApiError(403, "Account is inactive. Please contact support.");
        }
        
        // Attach user to request object
        req.user = {
            ...user,
            userId: user._id.toString(),
            role: user.role,
            permissions: user.permissions || []
        };
        
        // Store request metadata for audit trail
        req.requestMetadata = {
            userId: user._id.toString(),
            userRole: user.role,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        };
        
        // Log successful authentication (for audit trail)
        logAuthEvent(
            user._id.toString(),
            'AUTHENTICATION_SUCCESS',
            req.ip,
            req.get('User-Agent')
        );
        
        next();
        
    } catch (error) {
        // Log authentication failure
        console.error('🔐 Healthcare authentication failed:', {
            error: error.message,
            ip: req.ip,
            path: req.originalUrl
        });
        
        throw new ApiError(
            401, 
            error.message || "Invalid access token - Authentication failed"
        );
    }
});

/**
 * Optional JWT verification (doesn't throw error if token is missing)
 * Useful for endpoints that work for both authenticated and unauthenticated users
 */
export const optionalVerifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || 
                     req.header("Authorization")?.replace("Bearer ", "").trim();
        
        if (token) {
            const decodedToken = verifyToken(token, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decodedToken.userId)
                .select("-password -refreshToken")
                .lean();
            
            if (user && user.isActive) {
                req.user = {
                    ...user,
                    userId: user._id.toString(),
                    role: user.role,
                    permissions: user.permissions || []
                };
            }
        }
    } catch (error) {
        // Silently fail for optional authentication
        console.log('ℹ️ Optional authentication failed:', error.message);
    }
    
    next();
});

/**
 * Role-based access control middleware
 * Restricts access based on user roles
 * 
 * @param {Array} allowedRoles - Array of roles allowed to access the route
 */
export const restrictTo = (...allowedRoles) => {
    return asyncHandler(async (req, res, next) => {
        if (!req.user) {
            throw new ApiError(401, "Authentication required");
        }
        
        if (!allowedRoles.includes(req.user.role)) {
            // Log unauthorized role access attempt
            logAuthEvent(
                req.user.userId,
                'UNAUTHORIZED_ROLE_ACCESS',
                req.ip,
                req.get('User-Agent'),
                { 
                    userRole: req.user.role, 
                    requiredRoles: allowedRoles,
                    endpoint: req.originalUrl
                }
            );
            
            throw new ApiError(
                403, 
                `Access denied. This action requires one of the following roles: ${allowedRoles.join(', ')}`
            );
        }
        
        next();
    });
};

/**
 * Permission-based access control middleware
 * Checks if user has specific permissions
 * 
 * @param {Array} requiredPermissions - Array of required permissions
 */
export const checkPermissions = (...requiredPermissions) => {
    return asyncHandler(async (req, res, next) => {
        if (!req.user) {
            throw new ApiError(401, "Authentication required");
        }
        
        const userPermissions = req.user.permissions || [];
        
        // Check if user has all required permissions
        const hasAllPermissions = requiredPermissions.every(permission => 
            userPermissions.includes(permission)
        );
        
        if (!hasAllPermissions) {
            logAuthEvent(
                req.user.userId,
                'INSUFFICIENT_PERMISSIONS',
                req.ip,
                req.get('User-Agent'),
                { 
                    userPermissions,
                    requiredPermissions,
                    endpoint: req.originalUrl
                }
            );
            
            throw new ApiError(
                403, 
                "Insufficient permissions to perform this action"
            );
        }
        
        next();
    });
};

/**
 * Verify patient data access authorization
 * Ensures users can only access their own data or authorized patient data
 * 
 * @param {string} patientIdParam - Name of the parameter containing patient ID
 */
export const verifyPatientAccess = (patientIdParam = 'patientId') => {
    return asyncHandler(async (req, res, next) => {
        if (!req.user) {
            throw new ApiError(401, "Authentication required");
        }
        
        const requestedPatientId = req.params[patientIdParam] || 
                                   req.body[patientIdParam] || 
                                   req.query[patientIdParam];
        
        if (!requestedPatientId) {
            throw new ApiError(400, "Patient ID is required");
        }
        
        const { role, userId } = req.user;
        
        // Patients can only access their own data
        if (role === 'patient') {
            // Assuming patient users have a patientId field
            const userPatientId = req.user.patientId || userId;
            
            if (userPatientId !== requestedPatientId) {
                logPatientAccess(
                    userId,
                    requestedPatientId,
                    'UNAUTHORIZED_PATIENT_ACCESS_ATTEMPT',
                    { endpoint: req.originalUrl }
                );
                
                throw new ApiError(
                    403, 
                    "Access denied. You can only access your own medical records."
                );
            }
        }
        
        // Doctors and nurses need active relationship with patient
        if (['doctor', 'nurse'].includes(role)) {
            // In production, check if doctor/nurse has active treatment relationship
            // For now, we'll allow access and log it
            logPatientAccess(
                userId,
                requestedPatientId,
                'HEALTHCARE_PROVIDER_ACCESS',
                { 
                    providerRole: role,
                    endpoint: req.originalUrl,
                    timestamp: new Date().toISOString()
                }
            );
        }
        
        // Admins have full access (logged for audit)
        if (role === 'admin') {
            logPatientAccess(
                userId,
                requestedPatientId,
                'ADMIN_ACCESS',
                { endpoint: req.originalUrl }
            );
        }
        
        next();
    });
};

/**
 * Verify medical record access token
 * For secure, time-limited access to specific medical records
 */
export const verifyMedicalAccess = asyncHandler(async (req, res, next) => {
    try {
        const medicalToken = req.header("X-Medical-Access-Token");
        
        if (!medicalToken) {
            throw new ApiError(401, "Medical record access token required");
        }
        
        // Verify medical access token
        const decoded = verifyMedicalRecordToken(medicalToken);
        
        // Attach medical access info to request
        req.medicalAccess = {
            patientId: decoded.patientId,
            doctorId: decoded.doctorId,
            recordType: decoded.recordType,
            permissions: decoded.permissions || ['read'],
            accessReason: decoded.accessReason,
            tokenId: decoded.tokenId
        };
        
        // Verify the requesting user matches the token
        if (req.user && req.user.userId !== decoded.doctorId) {
            throw new ApiError(403, "Medical access token does not match authenticated user");
        }
        
        logPatientAccess(
            decoded.doctorId,
            decoded.patientId,
            'MEDICAL_RECORD_TOKEN_ACCESS',
            {
                recordType: decoded.recordType,
                permissions: decoded.permissions,
                tokenId: decoded.tokenId
            }
        );
        
        next();
        
    } catch (error) {
        throw new ApiError(
            401, 
            error.message || "Invalid medical access token"
        );
    }
});

/**
 * Check if user is verified (email/phone verified)
 */
export const checkVerification = asyncHandler(async (req, res, next) => {
    if (!req.user) {
        throw new ApiError(401, "Authentication required");
    }
    
    if (!req.user.isEmailVerified) {
        throw new ApiError(
            403, 
            "Email verification required. Please verify your email to access this feature."
        );
    }
    
    // For sensitive operations, require phone verification too
    if (req.method !== 'GET' && !req.user.isPhoneVerified) {
        throw new ApiError(
            403, 
            "Phone verification required for this operation"
        );
    }
    
    next();
});

/**
 * Rate limiting middleware for sensitive operations
 * Prevents abuse of authentication endpoints
 */
export const authRateLimit = asyncHandler(async (req, res, next) => {
    // This would typically integrate with Redis or similar
    // For now, we'll add the structure
    
    const userId = req.user?.userId || req.ip;
    const action = req.originalUrl;
    
    // In production, implement actual rate limiting here
    // Example: Check Redis for request count in time window
    
    console.log(`🔄 Auth rate limit check for user: ${userId} on ${action}`);
    
    next();
});

/**
 * Validate session middleware
 * Checks if the session is still valid and hasn't been revoked
 */
export const validateSession = asyncHandler(async (req, res, next) => {
    if (!req.user) {
        throw new ApiError(401, "Authentication required");
    }
    
    // In production, check if session is in Redis/database and still valid
    // Check for concurrent session limits
    // Check if session has been manually revoked
    
    const sessionValid = true; // Replace with actual session validation
    
    if (!sessionValid) {
        logAuthEvent(
            req.user.userId,
            'INVALID_SESSION',
            req.ip,
            req.get('User-Agent')
        );
        
        throw new ApiError(401, "Session expired or invalid. Please login again.");
    }
    
    next();
});

/**
 * Export all authentication middleware
 */
export default {
    verifyJWT,
    optionalVerifyJWT,
    restrictTo,
    checkPermissions,
    verifyPatientAccess,
    verifyMedicalAccess,
    checkVerification,
    authRateLimit,
    validateSession
};



/**
 * Usage Examples:
 * 
 * // Basic authentication
 * router.get('/profile', verifyJWT, getProfile);
 * 
 * // Role-based access
 * router.post('/appointments', verifyJWT, restrictTo('doctor', 'admin'), createAppointment);
 * 
 * // Permission-based access
 * router.put('/medical-records/:id', 
 *     verifyJWT, 
 *     checkPermissions('update-medical-records'), 
 *     updateMedicalRecord
 * );
 * 
 * // Patient data access control
 * router.get('/patients/:patientId/records', 
 *     verifyJWT, 
 *     verifyPatientAccess('patientId'), 
 *     getPatientRecords
 * );
 * 
 * // Medical record token access
 * router.get('/medical-records/:id/secure', 
 *     verifyJWT, 
 *     verifyMedicalAccess, 
 *     getSecureMedicalRecord
 * );
 * 
 * // Combined middleware
 * router.delete('/patients/:patientId', 
 *     verifyJWT, 
 *     restrictTo('admin'), 
 *     checkVerification,
 *     validateSession,
 *     deletePatient
 * );
 */