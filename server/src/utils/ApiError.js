/**
 * Healthcare System - Standardized API Error Handling
 * 
 * HIPAA-compliant error handling for healthcare applications
 * Includes medical-specific error types and secure error information
 */

class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = "",
        errorType = "OPERATIONAL_ERROR",
        metadata = {}
    ) {
        super(message);
        this.statusCode = statusCode;
        this.data = null;
        this.message = this.sanitizeErrorMessage(message);
        this.success = false;
        this.errors = this.sanitizeErrors(errors);
        this.errorType = errorType;
        this.timestamp = new Date().toISOString();
        this.isOperational = true;
        this.metadata = {
            apiVersion: process.env.API_VERSION || '1.0',
            requestId: metadata.requestId || this.generateRequestId(),
            ...metadata
        };

        // Add healthcare context to error
        this.addHealthcareContext();

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }

        // Log error for healthcare compliance
        this.logError();
    }

    /**
     * Sanitize error message to avoid leaking sensitive information
     */
    sanitizeErrorMessage(message) {
        const sensitivePatterns = [
            /password[=:]['"]?([^'"\s]+)/gi,
            /ssn[=:]['"]?([^'"\s]+)/gi,
            /creditcard[=:]['"]?([^'"\s]+)/gi,
            /medicalrecord[=:]['"]?([^'"\s]+)/gi,
            /prescription[=:]['"]?([^'"\s]+)/gi
        ];

        let sanitized = message;
        sensitivePatterns.forEach(pattern => {
            sanitized = sanitized.replace(pattern, '[REDACTED_SENSITIVE_DATA]');
        });

        return sanitized;
    }

    /**
     * Sanitize error details array
     */
    sanitizeErrors(errors) {
        if (!Array.isArray(errors)) return [];

        return errors.map(error => ({
            field: error.field || 'unknown',
            message: this.sanitizeErrorMessage(error.message || 'Validation error'),
            code: error.code || 'VALIDATION_ERROR'
        }));
    }

    /**
     * Add healthcare-specific context to error
     */
    addHealthcareContext() {
        // Determine error category for healthcare
        this.healthcareCategory = this.determineHealthcareCategory();
        
        // Add HIPAA compliance info
        this.metadata.hipaaCompliant = true;
        this.metadata.errorSeverity = this.determineSeverity();
    }

    /**
     * Determine healthcare-specific error category
     */
    determineHealthcareCategory() {
        if (this.statusCode >= 500) return 'SYSTEM_ERROR';
        if (this.statusCode === 401 || this.statusCode === 403) return 'AUTHORIZATION_ERROR';
        if (this.statusCode === 404) return 'RECORD_NOT_FOUND';
        if (this.statusCode === 422) return 'VALIDATION_ERROR';
        if (this.statusCode === 429) return 'RATE_LIMIT_ERROR';
        return 'OPERATIONAL_ERROR';
    }

    /**
     * Determine error severity for healthcare systems
     */
    determineSeverity() {
        if (this.statusCode >= 500) return 'HIGH';
        if (this.statusCode === 401 || this.statusCode === 403) return 'MEDIUM';
        if (this.statusCode === 429) return 'MEDIUM';
        return 'LOW';
    }

    /**
     * Generate unique request ID for error tracking
     */
    generateRequestId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Log error with healthcare compliance
     */
    logError() {
        if (this.statusCode >= 500) {
            console.error('🔴 [HEALTHCARE_API_ERROR]', {
                requestId: this.metadata.requestId,
                statusCode: this.statusCode,
                message: this.message,
                errorType: this.errorType,
                timestamp: this.timestamp,
                severity: this.metadata.errorSeverity,
                category: this.healthcareCategory
            });
        }
    }

    /**
     * Create bad request error for healthcare validation
     */
    static badRequest(message = "Bad request", errors = [], metadata = {}) {
        return new ApiError(400, message, errors, "", "VALIDATION_ERROR", metadata);
    }

    /**
     * Create unauthorized error for healthcare access control
     */
    static unauthorized(message = "Unauthorized access", metadata = {}) {
        return new ApiError(401, message, [], "", "AUTHENTICATION_ERROR", {
            ...metadata,
            suggestion: "Please check your credentials or contact healthcare administrator"
        });
    }

    /**
     * Create forbidden error for healthcare permissions
     */
    static forbidden(message = "Access forbidden", metadata = {}) {
        return new ApiError(403, message, [], "", "AUTHORIZATION_ERROR", {
            ...metadata,
            suggestion: "You don't have permission to access this medical resource"
        });
    }

    /**
     * Create not found error for healthcare records
     */
    static notFound(message = "Medical record not found", metadata = {}) {
        return new ApiError(404, message, [], "", "RECORD_NOT_FOUND", {
            ...metadata,
            suggestion: "Check the record ID or contact medical records department"
        });
    }

    /**
     * Create validation error for healthcare data
     */
    static validationError(message = "Validation failed", errors = [], metadata = {}) {
        return new ApiError(422, message, errors, "", "VALIDATION_ERROR", metadata);
    }

    /**
     * Create internal server error for healthcare systems
     */
    static internal(message = "Internal server error", metadata = {}) {
        return new ApiError(500, message, [], "", "INTERNAL_ERROR", {
            ...metadata,
            suggestion: "Please try again or contact healthcare IT support"
        });
    }

    /**
     * Create service unavailable error for healthcare systems
     */
    static serviceUnavailable(message = "Service temporarily unavailable", metadata = {}) {
        return new ApiError(503, message, [], "", "SERVICE_UNAVAILABLE", {
            ...metadata,
            suggestion: "Healthcare system is undergoing maintenance. Please try again later"
        });
    }

    /**
     * Create rate limit error for healthcare API protection
     */
    static tooManyRequests(message = "Too many requests", metadata = {}) {
        return new ApiError(429, message, [], "", "RATE_LIMIT_EXCEEDED", {
            ...metadata,
            suggestion: "Please wait before making additional requests to healthcare API"
        });
    }

    /**
     * Create healthcare-specific business rule error
     */
    static businessRule(message = "Business rule violation", metadata = {}) {
        return new ApiError(409, message, [], "", "BUSINESS_RULE_ERROR", metadata);
    }

    /**
     * Convert to JSON with healthcare security
     */
    toJSON() {
        const response = {
            success: this.success,
            statusCode: this.statusCode,
            message: this.message,
            timestamp: this.timestamp,
            errorType: this.errorType,
            metadata: {
                ...this.metadata,
                healthcareCategory: this.healthcareCategory
            }
        };

        // Only include errors in development or for client errors
        if (process.env.NODE_ENV === 'development' || this.statusCode < 500) {
            response.errors = this.errors;
        } else {
            response.errors = []; // Don't leak internal error details in production
        }

        return response;
    }

    /**
     * Send error response through Express res object
     */
    send(res) {
        return res.status(this.statusCode).json(this.toJSON());
    }
}

export { ApiError };