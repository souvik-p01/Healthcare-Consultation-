/**
 * Healthcare System - Data Validation & Sanitization Utility
 * 
 * HIPAA-compliant data validation and sanitization for healthcare applications.
 * Ensures medical data integrity, patient privacy, and regulatory compliance.
 * 
 * Features:
 * - Healthcare-specific field validation
 * - Medical data sanitization
 * - HIPAA-compliant data handling
 * - Patient information validation
 * - Medical record validation
 * - Appointment data validation
 * - Security input validation
 * - MongoDB schema validation helpers
 */

import validator from 'validator';
import mongoose from 'mongoose';

/**
 * Healthcare Validation Configuration
 */
const VALIDATION_CONFIG = {
    // Medical Record Number patterns by country/system
    MRN_PATTERNS: {
        US: /^[A-Z]{2,3}\d{6,10}$/,
        UK: /^[A-Z]{3}\d{7}$/,
        GENERIC: /^[A-Z0-9]{6,15}$/
    },
    
    // Phone number patterns
    PHONE_PATTERNS: {
        US: /^\+?1?[-.\s]?\(?[2-9][0-8][0-9]\)?[-.\s]?[2-9][0-9]{2}[-.\s]?[0-9]{4}$/,
        INTERNATIONAL: /^\+[1-9]\d{1,14}$/,
        GENERIC: /^[\+]?[0-9\s\-\(\)]{10,15}$/
    },
    
    // Insurance patterns
    INSURANCE_PATTERNS: {
        SSN: /^\d{3}-\d{2}-\d{4}$/,
        POLICY: /^[A-Z0-9]{6,20}$/,
        GROUP: /^[A-Z0-9]{3,15}$/
    },
    
    // Medical data constraints
    MEDICAL_CONSTRAINTS: {
        AGE_MIN: 0,
        AGE_MAX: 150,
        WEIGHT_MIN: 0.5, // kg
        WEIGHT_MAX: 1000, // kg
        HEIGHT_MIN: 30, // cm
        HEIGHT_MAX: 300, // cm
        BLOOD_PRESSURE_SYSTOLIC_MIN: 50,
        BLOOD_PRESSURE_SYSTOLIC_MAX: 300,
        BLOOD_PRESSURE_DIASTOLIC_MIN: 30,
        BLOOD_PRESSURE_DIASTOLIC_MAX: 200,
        HEART_RATE_MIN: 20,
        HEART_RATE_MAX: 300,
        TEMPERATURE_MIN: 32, // Celsius
        TEMPERATURE_MAX: 45 // Celsius
    },
    
    // Allowed file types for medical documents
    ALLOWED_FILE_TYPES: ['jpg', 'jpeg', 'png', 'pdf', 'dcm', 'tiff', 'doc', 'docx'],
    
    // Maximum file size (in bytes)
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    
    // Name validation patterns
    NAME_PATTERN: /^[A-Za-z\u00C0-\u024F\u1E00-\u1EFF\s\'\-]{2,50}$/,
    
    // Address validation
    ADDRESS_PATTERN: /^[A-Za-z0-9\s\.,\-\#]{5,100}$/,
    
    // ZIP Code pattern
    ZIP_PATTERN: {
        US: /^\d{5}(-\d{4})?$/,
        GENERIC: /^[A-Z0-9\s\-]{3,10}$/
    }
};

/**
 * Validate Medical Record Number (MRN)
 * 
 * @param {string} mrn - Medical Record Number
 * @param {string} country - Country code (optional)
 * @returns {Object} - Validation result
 */
export const validateMedicalRecordNumber = (mrn, country = 'GENERIC') => {
    const errors = [];
    
    if (!mrn) {
        errors.push('Medical Record Number is required');
        return { isValid: false, errors };
    }
    
    if (typeof mrn !== 'string') {
        errors.push('Medical Record Number must be a string');
        return { isValid: false, errors };
    }
    
    const trimmedMrn = mrn.trim().toUpperCase();
    
    // Check length first
    if (trimmedMrn.length < 6 || trimmedMrn.length > 15) {
        errors.push('Medical Record Number must be between 6 and 15 characters');
    }
    
    // Then check pattern
    const pattern = VALIDATION_CONFIG.MRN_PATTERNS[country] || VALIDATION_CONFIG.MRN_PATTERNS.GENERIC;
    if (!pattern.test(trimmedMrn)) {
        errors.push(`Invalid Medical Record Number format for ${country}`);
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        sanitized: trimmedMrn
    };
};

/**
 * Validate healthcare phone number - FIXED: Now uses cleanPhone for pattern matching
 * 
 * @param {string} phone - Phone number
 * @param {string} region - Region code (optional)
 * @returns {Object} - Validation result
 */
export const validateHealthcarePhone = (phone, region = 'US') => {
    const errors = [];
    
    if (!phone) {
        errors.push('Phone number is required');
        return { isValid: false, errors };
    }
    
    if (typeof phone !== 'string') {
        errors.push('Phone number must be a string');
        return { isValid: false, errors };
    }
    
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    const pattern = VALIDATION_CONFIG.PHONE_PATTERNS[region] || VALIDATION_CONFIG.PHONE_PATTERNS.GENERIC;
    
    // FIX: Use cleanPhone for pattern matching instead of original phone
    if (!pattern.test(cleanPhone)) {
        errors.push(`Invalid phone number format for ${region}`);
    }
    
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        errors.push('Phone number must be between 10 and 15 digits');
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        sanitized: cleanPhone
    };
};

/**
 * Validate email address for healthcare communications
 * 
 * @param {string} email - Email address
 * @returns {Object} - Validation result
 */
export const validateHealthcareEmail = (email) => {
    const errors = [];
    
    if (!email) {
        errors.push('Email address is required');
        return { isValid: false, errors };
    }
    
    if (typeof email !== 'string') {
        errors.push('Email must be a string');
        return { isValid: false, errors };
    }
    
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!validator.isEmail(trimmedEmail)) {
        errors.push('Invalid email address format');
    }
    
    if (trimmedEmail.length > 254) {
        errors.push('Email address is too long');
    }
    
    // Check for potentially malicious patterns
    const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /<iframe/i
    ];
    
    if (dangerousPatterns.some(pattern => pattern.test(trimmedEmail))) {
        errors.push('Email contains invalid characters');
    }
    
    // Check for disposable emails
    const disposableDomains = ['tempmail', 'guerrillamail', 'mailinator'];
    if (disposableDomains.some(domain => trimmedEmail.includes(domain))) {
        errors.push('Disposable email addresses are not allowed');
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        sanitized: trimmedEmail
    };
};

/**
 * Validate patient name
 * 
 * @param {string} name - Patient name
 * @param {string} fieldName - Field name for error messages
 * @returns {Object} - Validation result
 */
export const validatePatientName = (name, fieldName = 'Name') => {
    const errors = [];
    
    if (!name) {
        errors.push(`${fieldName} is required`);
        return { isValid: false, errors };
    }
    
    if (typeof name !== 'string') {
        errors.push(`${fieldName} must be a string`);
        return { isValid: false, errors };
    }
    
    const trimmedName = name.trim();
    
    if (trimmedName.length < 2 || trimmedName.length > 50) {
        errors.push(`${fieldName} must be between 2 and 50 characters`);
    }
    
    if (!VALIDATION_CONFIG.NAME_PATTERN.test(trimmedName)) {
        errors.push(`${fieldName} contains invalid characters`);
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        sanitized: trimmedName
    };
};

/**
 * Validate patient address
 * 
 * @param {Object} address - Address object
 * @returns {Object} - Validation result
 */
export const validateAddress = (address) => {
    const errors = [];
    const sanitized = {};
    
    if (!address || typeof address !== 'object') {
        errors.push('Address information is required');
        return { isValid: false, errors };
    }
    
    // Validate street
    if (address.street) {
        const street = validator.escape(address.street.trim());
        if (!VALIDATION_CONFIG.ADDRESS_PATTERN.test(street)) {
            errors.push('Invalid street address format');
        } else {
            sanitized.street = street;
        }
    }
    
    // Validate city
    if (address.city) {
        const city = validator.escape(address.city.trim());
        if (city.length < 2 || city.length > 50) {
            errors.push('City must be between 2 and 50 characters');
        } else {
            sanitized.city = city;
        }
    }
    
    // Validate zip code
    if (address.zipCode) {
        const zipCode = address.zipCode.toString().trim();
        const pattern = VALIDATION_CONFIG.ZIP_PATTERN[address.country] || VALIDATION_CONFIG.ZIP_PATTERN.GENERIC;
        if (!pattern.test(zipCode)) {
            errors.push('Invalid ZIP/postal code format');
        } else {
            sanitized.zipCode = zipCode;
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        sanitized
    };
};

/**
 * Comprehensive patient data validation
 * 
 * @param {Object} patientData - Patient data object
 * @returns {Object} - Validation result
 */
export const validatePatientData = (patientData) => {
    const errors = [];
    const sanitized = {};
    const validationResults = {};
    
    if (!patientData || typeof patientData !== 'object') {
        errors.push('Patient data is required');
        return { isValid: false, errors };
    }
    
    // Validate names
    if (patientData.firstName) {
        validationResults.firstName = validatePatientName(patientData.firstName, 'First name');
        if (!validationResults.firstName.isValid) {
            errors.push(...validationResults.firstName.errors);
        } else {
            sanitized.firstName = validationResults.firstName.sanitized;
        }
    }
    
    if (patientData.lastName) {
        validationResults.lastName = validatePatientName(patientData.lastName, 'Last name');
        if (!validationResults.lastName.isValid) {
            errors.push(...validationResults.lastName.errors);
        } else {
            sanitized.lastName = validationResults.lastName.sanitized;
        }
    }
    
    // Validate email
    if (patientData.email) {
        validationResults.email = validateHealthcareEmail(patientData.email);
        if (!validationResults.email.isValid) {
            errors.push(...validationResults.email.errors);
        } else {
            sanitized.email = validationResults.email.sanitized;
        }
    }
    
    // Validate phone
    if (patientData.phone) {
        validationResults.phone = validateHealthcarePhone(patientData.phone, patientData.country);
        if (!validationResults.phone.isValid) {
            errors.push(...validationResults.phone.errors);
        } else {
            sanitized.phone = validationResults.phone.sanitized;
        }
    }
    
    // Validate date of birth
    if (patientData.dateOfBirth) {
        validationResults.dateOfBirth = validateDateOfBirth(patientData.dateOfBirth);
        if (!validationResults.dateOfBirth.isValid) {
            errors.push(...validationResults.dateOfBirth.errors);
        } else {
            sanitized.dateOfBirth = validationResults.dateOfBirth.sanitized;
        }
    }
    
    // Validate address
    if (patientData.address) {
        validationResults.address = validateAddress(patientData.address);
        if (!validationResults.address.isValid) {
            errors.push(...validationResults.address.errors);
        } else {
            sanitized.address = validationResults.address.sanitized;
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        sanitized,
        validationResults
    };
};

/**
 * Validate patient date of birth
 * 
 * @param {string|Date} dateOfBirth - Date of birth
 * @returns {Object} - Validation result
 */
export const validateDateOfBirth = (dateOfBirth) => {
    const errors = [];
    
    if (!dateOfBirth) {
        errors.push('Date of birth is required');
        return { isValid: false, errors };
    }
    
    const birthDate = new Date(dateOfBirth);
    
    if (isNaN(birthDate.getTime())) {
        errors.push('Invalid date of birth format');
        return { isValid: false, errors };
    }
    
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Adjust age if birthday hasn't occurred this year
    const actualAge = (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) 
        ? age - 1 
        : age;
    
    if (birthDate > today) {
        errors.push('Date of birth cannot be in the future');
    }
    
    if (actualAge < VALIDATION_CONFIG.MEDICAL_CONSTRAINTS.AGE_MIN || 
        actualAge > VALIDATION_CONFIG.MEDICAL_CONSTRAINTS.AGE_MAX) {
        errors.push(`Age must be between ${VALIDATION_CONFIG.MEDICAL_CONSTRAINTS.AGE_MIN} and ${VALIDATION_CONFIG.MEDICAL_CONSTRAINTS.AGE_MAX} years`);
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        sanitized: birthDate.toISOString().split('T')[0], // YYYY-MM-DD format
        calculatedAge: actualAge
    };
};

/**
 * Validate medical appointment date and time
 * 
 * @param {string|Date} appointmentDateTime - Appointment date and time
 * @param {Object} options - Validation options
 * @returns {Object} - Validation result
 */
export const validateAppointmentDateTime = (appointmentDateTime, options = {}) => {
    const errors = [];
    
    if (!appointmentDateTime) {
        errors.push('Appointment date and time is required');
        return { isValid: false, errors };
    }
    
    const appointmentDate = new Date(appointmentDateTime);
    
    if (isNaN(appointmentDate.getTime())) {
        errors.push('Invalid appointment date format');
        return { isValid: false, errors };
    }
    
    const now = new Date();
    const minFutureTime = new Date(now.getTime() + (options.minAdvanceMinutes || 30) * 60000);
    const maxFutureDate = new Date(now.getTime() + (options.maxAdvanceDays || 365) * 24 * 60 * 60 * 1000);
    
    if (appointmentDate < minFutureTime) {
        errors.push(`Appointment must be at least ${options.minAdvanceMinutes || 30} minutes in the future`);
    }
    
    if (appointmentDate > maxFutureDate) {
        errors.push(`Appointment cannot be more than ${options.maxAdvanceDays || 365} days in the future`);
    }
    
    // Check business hours (default 9 AM to 5 PM)
    const hour = appointmentDate.getHours();
    const startHour = options.businessStartHour || 9;
    const endHour = options.businessEndHour || 17;
    
    if (hour < startHour || hour >= endHour) {
        errors.push(`Appointment must be between ${startHour}:00 and ${endHour}:00`);
    }
    
    // Check if it's a weekend (unless allowed)
    if (!options.allowWeekends && (appointmentDate.getDay() === 0 || appointmentDate.getDay() === 6)) {
        errors.push('Appointments are not available on weekends');
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        sanitized: appointmentDate.toISOString()
    };
};

/**
 * Validate vital signs measurements
 * 
 * @param {Object} vitals - Vital signs object
 * @returns {Object} - Validation result
 */
export const validateVitalSigns = (vitals) => {
    const errors = [];
    const sanitized = {};
    
    if (!vitals || typeof vitals !== 'object') {
        errors.push('Vital signs must be an object');
        return { isValid: false, errors };
    }
    
    // Validate blood pressure
    if (vitals.bloodPressure) {
        const { systolic, diastolic } = vitals.bloodPressure;
        
        if (systolic !== undefined) {
            const systolicNum = Number(systolic);
            if (isNaN(systolicNum) || 
                systolicNum < VALIDATION_CONFIG.MEDICAL_CONSTRAINTS.BLOOD_PRESSURE_SYSTOLIC_MIN ||
                systolicNum > VALIDATION_CONFIG.MEDICAL_CONSTRAINTS.BLOOD_PRESSURE_SYSTOLIC_MAX) {
                errors.push(`Invalid systolic blood pressure: ${systolic}`);
            } else {
                sanitized.bloodPressure = { ...sanitized.bloodPressure, systolic: systolicNum };
            }
        }
        
        if (diastolic !== undefined) {
            const diastolicNum = Number(diastolic);
            if (isNaN(diastolicNum) || 
                diastolicNum < VALIDATION_CONFIG.MEDICAL_CONSTRAINTS.BLOOD_PRESSURE_DIASTOLIC_MIN ||
                diastolicNum > VALIDATION_CONFIG.MEDICAL_CONSTRAINTS.BLOOD_PRESSURE_DIASTOLIC_MAX) {
                errors.push(`Invalid diastolic blood pressure: ${diastolic}`);
            } else {
                sanitized.bloodPressure = { ...sanitized.bloodPressure, diastolic: diastolicNum };
            }
        }
    }
    
    // Validate heart rate
    if (vitals.heartRate !== undefined) {
        const heartRate = Number(vitals.heartRate);
        if (isNaN(heartRate) || 
            heartRate < VALIDATION_CONFIG.MEDICAL_CONSTRAINTS.HEART_RATE_MIN ||
            heartRate > VALIDATION_CONFIG.MEDICAL_CONSTRAINTS.HEART_RATE_MAX) {
            errors.push(`Invalid heart rate: ${vitals.heartRate}`);
        } else {
            sanitized.heartRate = heartRate;
        }
    }
    
    // Validate temperature
    if (vitals.temperature !== undefined) {
        const temperature = Number(vitals.temperature);
        if (isNaN(temperature) || 
            temperature < VALIDATION_CONFIG.MEDICAL_CONSTRAINTS.TEMPERATURE_MIN ||
            temperature > VALIDATION_CONFIG.MEDICAL_CONSTRAINTS.TEMPERATURE_MAX) {
            errors.push(`Invalid temperature: ${vitals.temperature}`);
        } else {
            sanitized.temperature = temperature;
        }
    }
    
    // Validate weight
    if (vitals.weight !== undefined) {
        const weight = Number(vitals.weight);
        if (isNaN(weight) || 
            weight < VALIDATION_CONFIG.MEDICAL_CONSTRAINTS.WEIGHT_MIN ||
            weight > VALIDATION_CONFIG.MEDICAL_CONSTRAINTS.WEIGHT_MAX) {
            errors.push(`Invalid weight: ${vitals.weight}`);
        } else {
            sanitized.weight = weight;
        }
    }
    
    // Validate height
    if (vitals.height !== undefined) {
        const height = Number(vitals.height);
        if (isNaN(height) || 
            height < VALIDATION_CONFIG.MEDICAL_CONSTRAINTS.HEIGHT_MIN ||
            height > VALIDATION_CONFIG.MEDICAL_CONSTRAINTS.HEIGHT_MAX) {
            errors.push(`Invalid height: ${vitals.height}`);
        } else {
            sanitized.height = height;
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        sanitized
    };
};

/**
 * Validate insurance information
 * 
 * @param {Object} insurance - Insurance information
 * @returns {Object} - Validation result
 */
export const validateInsuranceInfo = (insurance) => {
    const errors = [];
    const sanitized = {};
    
    if (!insurance || typeof insurance !== 'object') {
        errors.push('Insurance information must be an object');
        return { isValid: false, errors };
    }
    
    // Validate policy number
    if (insurance.policyNumber) {
        const policyNumber = insurance.policyNumber.toString().trim().toUpperCase();
        if (!VALIDATION_CONFIG.INSURANCE_PATTERNS.POLICY.test(policyNumber)) {
            errors.push('Invalid insurance policy number format');
        } else {
            sanitized.policyNumber = policyNumber;
        }
    }
    
    // Validate group number
    if (insurance.groupNumber) {
        const groupNumber = insurance.groupNumber.toString().trim().toUpperCase();
        if (!VALIDATION_CONFIG.INSURANCE_PATTERNS.GROUP.test(groupNumber)) {
            errors.push('Invalid insurance group number format');
        } else {
            sanitized.groupNumber = groupNumber;
        }
    }
    
    // Validate provider name
    if (insurance.providerName) {
        const providerName = validator.escape(insurance.providerName.trim());
        if (providerName.length < 2 || providerName.length > 100) {
            errors.push('Insurance provider name must be between 2 and 100 characters');
        } else {
            sanitized.providerName = providerName;
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        sanitized
    };
};

/**
 * Sanitize patient data for HIPAA compliance
 * 
 * @param {Object} data - Patient data
 * @returns {Object} - Sanitized patient data
 */
export const sanitizePatientData = (data) => {
    if (!data || typeof data !== 'object') return data;
    
    const sanitized = { ...data };
    
    // Sanitize string fields
    const stringFields = [
        'firstName', 'lastName', 'middleName', 'address', 'city', 
        'state', 'zipCode', 'emergencyContactName', 'notes', 'allergies'
    ];
    
    stringFields.forEach(field => {
        if (sanitized[field] && typeof sanitized[field] === 'string') {
            // Remove HTML tags and escape special characters
            sanitized[field] = validator.escape(validator.stripLow(sanitized[field].trim()));
            
            // Remove potentially dangerous patterns
            sanitized[field] = sanitized[field].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            sanitized[field] = sanitized[field].replace(/javascript:/gi, '');
        }
    });
    
    // Sanitize email
    if (sanitized.email) {
        sanitized.email = validator.normalizeEmail(sanitized.email);
    }
    
    // Mask sensitive fields for logging
    if (sanitized.ssn) {
        sanitized.ssnMasked = sanitized.ssn.replace(/\d(?=\d{4})/g, '*');
        delete sanitized.ssn; // Remove actual SSN from sanitized data
    }
    
    return sanitized;
};

/**
 * Validate medical file upload
 * 
 * @param {Object} file - File object
 * @param {Object} options - Validation options
 * @returns {Object} - Validation result
 */
export const validateMedicalFileUpload = (file, options = {}) => {
    const errors = [];
    
    if (!file) {
        errors.push('File is required');
        return { isValid: false, errors };
    }
    
    // Validate file size
    const maxSize = options.maxSize || VALIDATION_CONFIG.MAX_FILE_SIZE;
    if (file.size > maxSize) {
        errors.push(`File size exceeds maximum limit of ${Math.round(maxSize / (1024 * 1024))}MB`);
    }
    
    // Validate file type
    const allowedTypes = options.allowedTypes || VALIDATION_CONFIG.ALLOWED_FILE_TYPES;
    const fileExtension = file.originalname ? 
        file.originalname.split('.').pop().toLowerCase() : 
        file.mimetype.split('/').pop();
    
    if (!allowedTypes.includes(fileExtension)) {
        errors.push(`File type ${fileExtension} is not allowed`);
    }
    
    // Validate filename
    if (file.originalname) {
        const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '');
        if (sanitizedFilename !== file.originalname) {
            errors.push('Filename contains invalid characters');
        }
        
        if (file.originalname.length > 255) {
            errors.push('Filename is too long');
        }
    }
    
    // Check for potentially malicious files
    const dangerousExtensions = ['exe', 'bat', 'cmd', 'scr', 'pif', 'com'];
    if (dangerousExtensions.includes(fileExtension)) {
        errors.push('File type not allowed for security reasons');
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        sanitized: {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            extension: fileExtension
        }
    };
};

/**
 * Validate prescription data
 * 
 * @param {Object} prescription - Prescription data
 * @returns {Object} - Validation result
 */
export const validatePrescription = (prescription) => {
    const errors = [];
    const sanitized = {};
    
    if (!prescription || typeof prescription !== 'object') {
        errors.push('Prescription data must be an object');
        return { isValid: false, errors };
    }
    
    // Validate medication name
    if (!prescription.medicationName || typeof prescription.medicationName !== 'string') {
        errors.push('Medication name is required');
    } else {
        const medicationName = validator.escape(prescription.medicationName.trim());
        if (medicationName.length < 2 || medicationName.length > 100) {
            errors.push('Medication name must be between 2 and 100 characters');
        } else {
            sanitized.medicationName = medicationName;
        }
    }
    
    // Validate dosage
    if (!prescription.dosage || typeof prescription.dosage !== 'string') {
        errors.push('Dosage is required');
    } else {
        const dosage = validator.escape(prescription.dosage.trim());
        if (dosage.length < 1 || dosage.length > 50) {
            errors.push('Dosage must be between 1 and 50 characters');
        } else {
            sanitized.dosage = dosage;
        }
    }
    
    // Validate frequency
    if (!prescription.frequency || typeof prescription.frequency !== 'string') {
        errors.push('Frequency is required');
    } else {
        const frequency = validator.escape(prescription.frequency.trim());
        sanitized.frequency = frequency;
    }
    
    // Validate quantity
    if (prescription.quantity !== undefined) {
        const quantity = Number(prescription.quantity);
        if (isNaN(quantity) || quantity <= 0 || quantity > 1000) {
            errors.push('Quantity must be a positive number less than 1000');
        } else {
            sanitized.quantity = quantity;
        }
    }
    
    // Validate refills
    if (prescription.refills !== undefined) {
        const refills = Number(prescription.refills);
        if (isNaN(refills) || refills < 0 || refills > 12) {
            errors.push('Refills must be between 0 and 12');
        } else {
            sanitized.refills = refills;
        }
    }
    
    // Validate instructions
    if (prescription.instructions) {
        const instructions = validator.escape(prescription.instructions.trim());
        if (instructions.length > 500) {
            errors.push('Instructions must be less than 500 characters');
        } else {
            sanitized.instructions = instructions;
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        sanitized
    };
};

/**
 * Validate search query for patient/medical record searches
 * 
 * @param {string} query - Search query
 * @param {Object} options - Validation options
 * @returns {Object} - Validation result
 */
export const validateSearchQuery = (query, options = {}) => {
    const errors = [];
    
    if (!query || typeof query !== 'string') {
        errors.push('Search query must be a string');
        return { isValid: false, errors };
    }
    
    const sanitizedQuery = validator.escape(query.trim());
    
    if (sanitizedQuery.length < (options.minLength || 2)) {
        errors.push(`Search query must be at least ${options.minLength || 2} characters`);
    }
    
    if (sanitizedQuery.length > (options.maxLength || 100)) {
        errors.push(`Search query must be less than ${options.maxLength || 100} characters`);
    }
    
    // Check for SQL injection patterns
    // const sqlPatterns = [
    //     /('|(\\')|(;)|(\\)|(--)|(\s+or\s+)|(union)|(select)|(insert)|(delete)|(update)|(drop)/gi
    // ];
    
    if (sqlPatterns.some(pattern => pattern.test(sanitizedQuery))) {
        errors.push('Search query contains invalid characters');
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        sanitized: sanitizedQuery
    };
};

/**
 * Validate pagination parameters
 * 
 * @param {Object} params - Pagination parameters
 * @returns {Object} - Validation result
 */
export const validatePaginationParams = (params) => {
    const errors = [];
    const sanitized = {};
    
    // Validate page number
    const page = Number(params.page) || 1;
    if (page < 1 || page > 10000) {
        errors.push('Page number must be between 1 and 10000');
    } else {
        sanitized.page = page;
    }
    
    // Validate limit
    const limit = Number(params.limit) || 10;
    if (limit < 1 || limit > 100) {
        errors.push('Limit must be between 1 and 100');
    } else {
        sanitized.limit = limit;
    }
    
    // Validate sort field
    if (params.sortBy) {
        const allowedSortFields = params.allowedSortFields || ['createdAt', 'updatedAt', 'name'];
        if (!allowedSortFields.includes(params.sortBy)) {
            errors.push('Invalid sort field');
        } else {
            sanitized.sortBy = params.sortBy;
        }
    }
    
    // Validate sort order
    if (params.sortOrder) {
        if (!['asc', 'desc'].includes(params.sortOrder.toLowerCase())) {
            errors.push('Sort order must be asc or desc');
        } else {
            sanitized.sortOrder = params.sortOrder.toLowerCase();
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        sanitized
    };
};

/**
 * MongoDB Schema Validation Helpers
 */

/**
 * Create MongoDB schema validation rules for patient data
 * 
 * @returns {Object} - MongoDB validation rules
 */
export const getPatientSchemaValidation = () => {
    return {
        $jsonSchema: {
            bsonType: "object",
            required: ["firstName", "lastName", "email", "dateOfBirth"],
            properties: {
                firstName: {
                    bsonType: "string",
                    description: "First name must be a string and is required",
                    minLength: 2,
                    maxLength: 50
                },
                lastName: {
                    bsonType: "string",
                    description: "Last name must be a string and is required",
                    minLength: 2,
                    maxLength: 50
                },
                email: {
                    bsonType: "string",
                    description: "Email must be a valid email address",
                    pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
                },
                dateOfBirth: {
                    bsonType: "date",
                    description: "Date of birth must be a valid date"
                },
                phone: {
                    bsonType: "string",
                    description: "Phone number must be valid",
                    pattern: "^[\\+]?[0-9\\s\\-\\(\\)]{10,15}$"
                },
                mrn: {
                    bsonType: "string",
                    description: "Medical Record Number must be valid",
                    pattern: "^[A-Z0-9]{6,15}$"
                }
            }
        }
    };
};

/**
 * Create MongoDB schema validation rules for medical records
 * 
 * @returns {Object} - MongoDB validation rules
 */
export const getMedicalRecordSchemaValidation = () => {
    return {
        $jsonSchema: {
            bsonType: "object",
            required: ["patientId", "recordType", "createdAt"],
            properties: {
                patientId: {
                    bsonType: "objectId",
                    description: "Patient ID must be a valid ObjectId"
                },
                recordType: {
                    enum: ["appointment", "prescription", "lab_result", "vital_signs", "diagnosis"],
                    description: "Record type must be one of the allowed values"
                },
                createdAt: {
                    bsonType: "date",
                    description: "Creation date must be a valid date"
                },
                notes: {
                    bsonType: "string",
                    maxLength: 1000,
                    description: "Notes must be less than 1000 characters"
                }
            }
        }
    };
};

// Export validation configuration for use in other modules
export { VALIDATION_CONFIG };

/**
 * Usage Examples:
 * 
 * // Validate patient registration data
 * const patientValidation = validatePatientData({
 *     firstName: 'John',
 *     lastName: 'Doe',
 *     email: 'patient@email.com',
 *     phone: '+1-555-123-4567',
 *     dateOfBirth: '1990-05-15'
 * });
 * 
 * // Validate appointment booking
 * const appointmentValidation = validateAppointmentDateTime('2024-03-15T14:30:00Z', {
 *     minAdvanceMinutes: 60,
 *     maxAdvanceDays: 90,
 *     allowWeekends: false
 * });
 * 
 * // Sanitize patient data
 * const sanitizedData = sanitizePatientData({
 *     firstName: 'John<script>alert("xss")</script>',
 *     email: 'PATIENT@EXAMPLE.COM',
 *     ssn: '123-45-6789'
 * });
 * 
 * // Validate medical file upload
 * const fileValidation = validateMedicalFileUpload(uploadedFile, {
 *     maxSize: 10 * 1024 * 1024, // 10MB
 *     allowedTypes: ['pdf', 'jpg', 'png']
 * });
 * 
 * // MongoDB schema validation
 * const patientSchema = new mongoose.Schema({
 *     firstName: { type: String, required: true },
 *     lastName: { type: String, required: true },
 *     email: { type: String, required: true }
 * });
 */