/**
 * Healthcare System - JWT Token Management Utility
 * 
 * Secure JWT token handling for healthcare authentication and authorization.
 * Includes access tokens, refresh tokens, and medical record access tokens
 * with HIPAA-compliant security measures.
 * 
 * Features:
 * - Healthcare user authentication tokens
 * - Medical record access tokens
 * - Secure refresh token management
 * - Role-based token generation
 * - Token validation and verification
 * - Audit trail integration
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * JWT Token Configuration for Healthcare System
 */
const TOKEN_CONFIG = {
    ACCESS_TOKEN_EXPIRY: process.env.JWT_EXPIRY || '15m',
    REFRESH_TOKEN_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
    MEDICAL_TOKEN_EXPIRY: '1h',
    ISSUER: 'healthcare-consultation-system',
    
    // Token types for different healthcare operations
    TOKEN_TYPES: {
        ACCESS: 'access',
        REFRESH: 'refresh',
        MEDICAL_ACCESS: 'medical-access',
        PASSWORD_RESET: 'password-reset',
        EMAIL_VERIFICATION: 'email-verification'
    }
};

/**
 * Generate access token for healthcare users
 * 
 * @param {Object} payload - User information for token
 * @returns {string} - JWT access token
 */
export const generateAccessToken = (payload) => {
    try {
        // Validate required payload fields
        if (!payload.userId || !payload.role) {
            throw new Error("User ID and role are required for healthcare token generation");
        }
        
        const tokenPayload = {
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
            userType: payload.userType || 'general', // patient, doctor, admin, nurse
            permissions: payload.permissions || [],
            isHealthcareUser: true,
            type: TOKEN_CONFIG.TOKEN_TYPES.ACCESS,
            tokenId: crypto.randomUUID(),
            
            // Healthcare-specific claims
            medicalLicense: payload.medicalLicense,
            department: payload.department,
            hospitalId: payload.hospitalId,
            
            // Security metadata
            ipAddress: payload.ipAddress,
            userAgent: payload.userAgent,
            loginTime: new Date().toISOString()
        };
        
        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
            expiresIn: TOKEN_CONFIG.ACCESS_TOKEN_EXPIRY,
            issuer: TOKEN_CONFIG.ISSUER,
            audience: payload.role,
            algorithm: 'HS256'
        });
        
        // Log token generation for audit trail
        console.log('🔑 Healthcare access token generated:', {
            userId: payload.userId,
            role: payload.role,
            userType: payload.userType,
            tokenId: tokenPayload.tokenId,
            expiresIn: TOKEN_CONFIG.ACCESS_TOKEN_EXPIRY
        });
        
        return token;
        
    } catch (error) {
        console.error('❌ Healthcare access token generation failed:', error.message);
        throw new Error(`Access token generation failed: ${error.message}`);
    }
};

/**
 * Generate refresh token for maintaining healthcare sessions
 * 
 * @param {string} userId - User ID
 * @param {Object} options - Additional options
 * @returns {string} - JWT refresh token
 */
export const generateRefreshToken = (userId, options = {}) => {
    try {
        if (!userId) {
            throw new Error("User ID is required for refresh token generation");
        }
        
        const tokenPayload = {
            userId,
            type: TOKEN_CONFIG.TOKEN_TYPES.REFRESH,
            tokenId: crypto.randomUUID(),
            isHealthcareRefreshToken: true,
            
            // Additional security metadata
            ipAddress: options.ipAddress,
            userAgent: options.userAgent,
            generatedAt: new Date().toISOString()
        };
        
        const token = jwt.sign(tokenPayload, process.env.JWT_REFRESH_SECRET, {
            expiresIn: TOKEN_CONFIG.REFRESH_TOKEN_EXPIRY,
            issuer: TOKEN_CONFIG.ISSUER,
            algorithm: 'HS256'
        });
        
        console.log('🔄 Healthcare refresh token generated:', {
            userId,
            tokenId: tokenPayload.tokenId,
            expiresIn: TOKEN_CONFIG.REFRESH_TOKEN_EXPIRY
        });
        
        return token;
        
    } catch (error) {
        console.error('❌ Healthcare refresh token generation failed:', error.message);
        throw new Error(`Refresh token generation failed: ${error.message}`);
    }
};

/**
 * Generate medical record access token for secure patient data access
 * 
 * @param {string} patientId - Patient ID
 * @param {string} doctorId - Doctor ID requesting access
 * @param {string} recordType - Type of medical record
 * @param {Object} options - Additional options
 * @returns {string} - Medical access token
 */
export const generateMedicalRecordToken = (patientId, doctorId, recordType, options = {}) => {
    try {
        if (!patientId || !doctorId || !recordType) {
            throw new Error("Patient ID, Doctor ID, and record type are required for medical token");
        }
        
        const tokenPayload = {
            patientId,
            doctorId,
            recordType,
            type: TOKEN_CONFIG.TOKEN_TYPES.MEDICAL_ACCESS,
            tokenId: crypto.randomUUID(),
            isMedicalAccessToken: true,
            
            // Access control
            permissions: options.permissions || ['read'],
            accessReason: options.accessReason || 'medical-consultation',
            urgencyLevel: options.urgencyLevel || 'normal',
            
            // Audit trail
            requestedAt: new Date().toISOString(),
            ipAddress: options.ipAddress,
            sessionId: options.sessionId
        };
        
        const token = jwt.sign(tokenPayload, process.env.MEDICAL_RECORD_SECRET, {
            expiresIn: TOKEN_CONFIG.MEDICAL_TOKEN_EXPIRY,
            issuer: TOKEN_CONFIG.ISSUER,
            audience: 'medical-records',
            algorithm: 'HS256'
        });
        
        // Log medical access token generation (HIPAA audit requirement)
        console.log('🏥 Medical record access token generated:', {
            patientId: `PATIENT_${patientId.slice(-4)}`, // Masked for privacy
            doctorId,
            recordType,
            tokenId: tokenPayload.tokenId,
            accessReason: options.accessReason,
            permissions: options.permissions
        });
        
        return token;
        
    } catch (error) {
        console.error('❌ Medical record token generation failed:', error.message);
        throw new Error(`Medical access token generation failed: ${error.message}`);
    }
};

/**
 * Generate password reset token for healthcare users
 * 
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @returns {string} - Password reset token
 */
export const generatePasswordResetToken = (userId, email) => {
    try {
        if (!userId || !email) {
            throw new Error("User ID and email are required for password reset token");
        }
        
        const tokenPayload = {
            userId,
            email,
            type: TOKEN_CONFIG.TOKEN_TYPES.PASSWORD_RESET,
            tokenId: crypto.randomUUID(),
            isPasswordResetToken: true,
            generatedAt: new Date().toISOString()
        };
        
        const token = jwt.sign(tokenPayload, process.env.PASSWORD_RESET_SECRET, {
            expiresIn: '30m', // Short expiry for security
            issuer: TOKEN_CONFIG.ISSUER,
            algorithm: 'HS256'
        });
        
        console.log('🔐 Password reset token generated:', {
            userId,
            email: email.replace(/(.{3}).*(@.*)/, '$1***$2'), // Mask email
            tokenId: tokenPayload.tokenId
        });
        
        return token;
        
    } catch (error) {
        console.error('❌ Password reset token generation failed:', error.message);
        throw new Error(`Password reset token generation failed: ${error.message}`);
    }
};

/**
 * Generate email verification token for new healthcare users
 * 
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @returns {string} - Email verification token
 */
export const generateEmailVerificationToken = (userId, email) => {
    try {
        if (!userId || !email) {
            throw new Error("User ID and email are required for email verification token");
        }
        
        const tokenPayload = {
            userId,
            email,
            type: TOKEN_CONFIG.TOKEN_TYPES.EMAIL_VERIFICATION,
            tokenId: crypto.randomUUID(),
            isEmailVerificationToken: true,
            generatedAt: new Date().toISOString()
        };
        
        const token = jwt.sign(tokenPayload, process.env.EMAIL_VERIFICATION_SECRET, {
            expiresIn: '24h', // 24 hours to verify email
            issuer: TOKEN_CONFIG.ISSUER,
            algorithm: 'HS256'
        });
        
        console.log('📧 Email verification token generated:', {
            userId,
            email: email.replace(/(.{3}).*(@.*)/, '$1***$2'),
            tokenId: tokenPayload.tokenId
        });
        
        return token;
        
    } catch (error) {
        console.error('❌ Email verification token generation failed:', error.message);
        throw new Error(`Email verification token generation failed: ${error.message}`);
    }
};

/**
 * Verify and decode JWT token
 * 
 * @param {string} token - JWT token to verify
 * @param {string} secret - Secret key for verification
 * @param {Object} options - Verification options
 * @returns {Object} - Decoded token payload
 */
export const verifyToken = (token, secret = process.env.JWT_SECRET, options = {}) => {
    try {
        if (!token) {
            throw new Error("Token is required for verification");
        }
        
        if (!secret) {
            throw new Error("Secret key is required for token verification");
        }
        
        const decoded = jwt.verify(token, secret, {
            issuer: TOKEN_CONFIG.ISSUER,
            algorithms: ['HS256'],
            ...options
        });
        
        // Validate token structure for healthcare tokens
        if (decoded.isHealthcareUser || decoded.isHealthcareRefreshToken || decoded.isMedicalAccessToken) {
            if (!decoded.tokenId) {
                throw new Error("Invalid healthcare token structure");
            }
        }
        
        return decoded;
        
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Healthcare session has expired. Please login again.');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Invalid healthcare authentication token.');
        } else if (error.name === 'NotBeforeError') {
            throw new Error('Healthcare token is not yet valid.');
        } else {
            throw new Error(`Token verification failed: ${error.message}`);
        }
    }
};

/**
 * Verify refresh token specifically
 * 
 * @param {string} refreshToken - Refresh token to verify
 * @returns {Object} - Decoded refresh token payload
 */
export const verifyRefreshToken = (refreshToken) => {
    try {
        const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
        
        if (decoded.type !== TOKEN_CONFIG.TOKEN_TYPES.REFRESH) {
            throw new Error("Invalid refresh token type");
        }
        
        return decoded;
        
    } catch (error) {
        throw new Error(`Refresh token verification failed: ${error.message}`);
    }
};

/**
 * Verify medical record access token
 * 
 * @param {string} medicalToken - Medical access token
 * @returns {Object} - Decoded medical access token payload
 */
export const verifyMedicalRecordToken = (medicalToken) => {
    try {
        const decoded = verifyToken(medicalToken, process.env.MEDICAL_RECORD_SECRET, {
            audience: 'medical-records'
        });
        
        if (decoded.type !== TOKEN_CONFIG.TOKEN_TYPES.MEDICAL_ACCESS) {
            throw new Error("Invalid medical access token type");
        }
        
        // Log medical record access for HIPAA compliance
        console.log('🔍 Medical record access verified:', {
            patientId: `PATIENT_${decoded.patientId.slice(-4)}`,
            doctorId: decoded.doctorId,
            recordType: decoded.recordType,
            tokenId: decoded.tokenId
        });
        
        return decoded;
        
    } catch (error) {
        throw new Error(`Medical access token verification failed: ${error.message}`);
    }
};

/**
 * Decode token without verification (for debugging)
 * 
 * @param {string} token - JWT token to decode
 * @returns {Object} - Decoded token payload
 */
export const decodeToken = (token) => {
    try {
        return jwt.decode(token, { complete: true });
    } catch (error) {
        throw new Error(`Token decode failed: ${error.message}`);
    }
};

/**
 * Check if token is expired
 * 
 * @param {string} token - JWT token to check
 * @returns {boolean} - True if token is expired
 */
export const isTokenExpired = (token) => {
    try {
        const decoded = jwt.decode(token);
        if (!decoded || !decoded.exp) return true;
        
        return decoded.exp < Math.floor(Date.now() / 1000);
    } catch (error) {
        return true;
    }
};

/**
 * Get token expiration time
 * 
 * @param {string} token - JWT token
 * @returns {Date} - Expiration date
 */
export const getTokenExpiration = (token) => {
    try {
        const decoded = jwt.decode(token);
        if (!decoded || !decoded.exp) return null;
        
        return new Date(decoded.exp * 1000);
    } catch (error) {
        return null;
    }
};

/**
 * Extract user information from token
 * 
 * @param {string} token - JWT token
 * @returns {Object} - User information
 */
export const getUserFromToken = (token) => {
    try {
        const decoded = verifyToken(token);
        
        return {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            userType: decoded.userType,
            permissions: decoded.permissions,
            medicalLicense: decoded.medicalLicense,
            department: decoded.department,
            hospitalId: decoded.hospitalId
        };
    } catch (error) {
        throw new Error(`Failed to extract user from token: ${error.message}`);
    }
};

// Export token configuration for use in other modules
export { TOKEN_CONFIG };

