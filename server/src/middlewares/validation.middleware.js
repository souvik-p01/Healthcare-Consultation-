
/**
 * Healthcare System - Request Validation Middleware
 * 
 * Validates incoming request data for healthcare operations
 * using the validation utilities.
 */

import {
    validateHealthcareEmail,
    validateHealthcarePhone,
    validateDateOfBirth,
    validateAppointmentDateTime,
    validateVitalSigns,
    validatePrescription,
    validateSearchQuery,
    validatePaginationParams,
    sanitizePatientData
} from "../utils/validationUtils.js";

/**
 * Validate email in request body
 */
export const validateEmail = (req, res, next) => {
    if (!req.body.email) {
        return next();
    }
    
    const validation = validateHealthcareEmail(req.body.email);
    
    if (!validation.isValid) {
        return res.status(400).json({
            success: false,
            message: "Email validation failed",
            errors: validation.errors
        });
    }
    
    req.body.email = validation.sanitized;
    next();
};

/**
 * Validate phone number in request body
 */
export const validatePhone = (req, res, next) => {
    if (!req.body.phoneNumber) {
        return next();
    }
    
    const validation = validateHealthcarePhone(req.body.phoneNumber);
    
    if (!validation.isValid) {
        return res.status(400).json({
            success: false,
            message: "Phone number validation failed",
            errors: validation.errors
        });
    }
    
    req.body.phoneNumber = validation.sanitized;
    next();
};

/**
 * Validate date of birth in request body
 */
export const validateDOB = (req, res, next) => {
    if (!req.body.dateOfBirth) {
        return next();
    }
    
    const validation = validateDateOfBirth(req.body.dateOfBirth);
    
    if (!validation.isValid) {
        return res.status(400).json({
            success: false,
            message: "Date of birth validation failed",
            errors: validation.errors
        });
    }
    
    req.body.dateOfBirth = validation.sanitized;
    req.body.calculatedAge = validation.calculatedAge;
    next();
};

/**
 * Validate appointment date and time
 */
export const validateAppointment = (req, res, next) => {
    if (!req.body.appointmentDateTime && !req.body.appointmentDate) {
        return next();
    }
    
    const appointmentTime = req.body.appointmentDateTime || req.body.appointmentDate;
    const validation = validateAppointmentDateTime(appointmentTime, {
        minAdvanceMinutes: 30,
        maxAdvanceDays: 365,
        allowWeekends: false
    });
    
    if (!validation.isValid) {
        return res.status(400).json({
            success: false,
            message: "Appointment date validation failed",
            errors: validation.errors
        });
    }
    
    req.body.appointmentDateTime = validation.sanitized;
    next();
};

/**
 * Validate vital signs data
 */
export const validateVitals = (req, res, next) => {
    if (!req.body.vitalSigns && !req.body.vitals) {
        return next();
    }
    
    const vitals = req.body.vitalSigns || req.body.vitals;
    const validation = validateVitalSigns(vitals);
    
    if (!validation.isValid) {
        return res.status(400).json({
            success: false,
            message: "Vital signs validation failed",
            errors: validation.errors
        });
    }
    
    req.body.vitalSigns = validation.sanitized;
    next();
};

/**
 * Validate prescription data
 */
export const validatePrescriptionData = (req, res, next) => {
    if (!req.body.medicationName && !req.body.prescription) {
        return next();
    }
    
    const prescriptionData = req.body.prescription || req.body;
    const validation = validatePrescription(prescriptionData);
    
    if (!validation.isValid) {
        return res.status(400).json({
            success: false,
            message: "Prescription validation failed",
            errors: validation.errors
        });
    }
    
    Object.assign(req.body, validation.sanitized);
    next();
};

/**
 * Sanitize patient data in request body
 */
export const sanitizePatient = (req, res, next) => {
    if (!req.body || typeof req.body !== 'object') {
        return next();
    }
    
    req.body = sanitizePatientData(req.body);
    next();
};

/**
 * Validate search query parameters
 */
export const validateSearch = (req, res, next) => {
    if (!req.query.search && !req.query.q) {
        return next();
    }
    
    const searchQuery = req.query.search || req.query.q;
    const validation = validateSearchQuery(searchQuery, {
        minLength: 2,
        maxLength: 100
    });
    
    if (!validation.isValid) {
        return res.status(400).json({
            success: false,
            message: "Search query validation failed",
            errors: validation.errors
        });
    }
    
    req.query.search = validation.sanitized;
    next();
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (req, res, next) => {
    const validation = validatePaginationParams(req.query);
    
    if (!validation.isValid) {
        return res.status(400).json({
            success: false,
            message: "Pagination parameters validation failed",
            errors: validation.errors
        });
    }
    
    req.pagination = validation.sanitized;
    next();
};

/**
 * Validate required fields middleware factory
 */
export const validateRequiredFields = (fields) => {
    return (req, res, next) => {
        const missingFields = [];
        
        fields.forEach(field => {
            if (!req.body[field]) {
                missingFields.push(field);
            }
        });
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Required fields are missing",
                missingFields
            });
        }
        
        next();
    };
};


export default {
    // Validation
    validateEmail,
    validatePhone,
    validateDOB,
    validateAppointment,
    validateVitals,
    validatePrescriptionData,
    sanitizePatient,
    validateSearch,
    validatePagination,
    validateRequiredFields
};