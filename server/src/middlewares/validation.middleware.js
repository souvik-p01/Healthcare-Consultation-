/**
 * Healthcare System - Request Validation Middleware
 */

/**
 * Validate required fields middleware
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

/**
 * ✅ ADDED: Validate user role during registration
 * Only allows: patient, doctor, nurse
 * Prevents admin registration through public API
 */
export const validateRole = (req, res, next) => {
    try {
        // Get role from request body (default to 'patient' if not provided)
        const { role = 'patient' } = req.body;
        
        // ✅ Allowed roles for public registration
        const allowedRoles = ["patient", "doctor", "nurse"];
        
        // Check if role is allowed
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: `Invalid role selection. Allowed roles: ${allowedRoles.join(', ')}`,
                receivedRole: role
            });
        }
        
        // Set role in request body (ensures it's properly set)
        req.body.role = role;
        
        next();
    } catch (error) {
        console.error('Role validation error:', error);
        return res.status(500).json({
            success: false,
            message: "Role validation failed"
        });
    }
};

/**
 * ✅ ADDED: Validate gender (optional)
 */
export const validateGender = (req, res, next) => {
    if (req.body.gender) {
        const validGenders = ['male', 'female', 'other', 'prefer-not-to-say'];
        const gender = req.body.gender.toLowerCase();
        
        if (!validGenders.includes(gender)) {
            return res.status(400).json({
                success: false,
                message: `Invalid gender. Valid options: ${validGenders.join(', ')}`
            });
        }
        
        req.body.gender = gender;
    }
    
    next();
};

/**
 * ✅ ADDED: Validate password strength
 * Used for registration and password change
 */
export const validatePasswordStrength = (req, res, next) => {
    if (req.body.password) {
        const password = req.body.password;
        
        // Check password requirements
        const errors = [];
        
        if (password.length < 8) {
            errors.push("Password must be at least 8 characters long");
        }
        
        if (!/[A-Z]/.test(password)) {
            errors.push("Password must contain at least one uppercase letter");
        }
        
        if (!/[a-z]/.test(password)) {
            errors.push("Password must contain at least one lowercase letter");
        }
        
        if (!/\d/.test(password)) {
            errors.push("Password must contain at least one number");
        }
        
        if (!/[@$!%*?&]/.test(password)) {
            errors.push("Password must contain at least one special character (@$!%*?&)");
        }
        
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Password validation failed",
                errors
            });
        }
    }
    
    next();
};

/**
 * ✅ ADDED: Validate password match (for registration)
 */
export const validatePasswordMatch = (req, res, next) => {
    if (req.body.password && req.body.confirmPassword) {
        if (req.body.password !== req.body.confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            });
        }
    }
    
    next();
};

/**
 * Validate email format
 */
export const validateEmail = (req, res, next) => {
    if (req.body.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(req.body.email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format"
            });
        }
    }
    next();
};

/**
 * Validate phone number
 */
export const validatePhone = (req, res, next) => {
    if (req.body.phoneNumber) {
        const phoneRegex = /^\+?[\d\s-()]{10,}$/;
        if (!phoneRegex.test(req.body.phoneNumber.replace(/\s/g, ''))) {
            return res.status(400).json({
                success: false,
                message: "Invalid phone number format"
            });
        }
    }
    next();
};

/**
 * Validate date of birth
 */
export const validateDOB = (req, res, next) => {
    if (req.body.dateOfBirth) {
        const dob = new Date(req.body.dateOfBirth);
        const today = new Date();
        const minDate = new Date();
        minDate.setFullYear(today.getFullYear() - 120); // 120 years ago
        const maxDate = new Date();
        maxDate.setFullYear(today.getFullYear() - 1); // At least 1 year old
        
        if (isNaN(dob.getTime()) || dob < minDate || dob > maxDate) {
            return res.status(400).json({
                success: false,
                message: "Invalid date of birth"
            });
        }
    }
    next();
};

/**
 * Sanitize patient data in request body
 */
export const sanitizePatient = (req, res, next) => {
    if (!req.body || typeof req.body !== 'object') {
        return next();
    }
    
    // Basic sanitization - trim strings and remove extra spaces
    Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
            req.body[key] = req.body[key].trim();
            
            // Remove extra spaces from names
            if (key === 'firstName' || key === 'lastName') {
                req.body[key] = req.body[key].replace(/\s+/g, ' ');
            }
            
            // Convert email to lowercase
            if (key === 'email') {
                req.body[key] = req.body[key].toLowerCase();
            }
        }
    });
    
    next();
};

// Export all middleware functions
export default {
    validateRequiredFields,
    validateRole,
    validateGender,
    validatePasswordStrength,
    validatePasswordMatch,
    validateEmail,
    validatePhone,
    validateDOB,
    sanitizePatient
};