/**
 * Healthcare System - Standardized API Response Format
 * 
 * HIPAA-compliant response structure for healthcare API endpoints
 * Ensures consistent response format across all healthcare services
 */

class ApiResponse {
    constructor(statusCode, data, message = "Success", metadata = {}) {
        this.statusCode = statusCode;
        this.data = this.sanitizeHealthcareData(data);
        this.message = message;
        this.success = statusCode < 400;
        this.timestamp = new Date().toISOString();
        this.metadata = {
            apiVersion: process.env.API_VERSION || '1.0',
            requestId: metadata.requestId || this.generateRequestId(),
            ...metadata
        };
        
        // Add healthcare-specific metadata for successful responses
        if (this.success && data) {
            this.addHealthcareMetadata(data);
        }
    }

    /**
     * Sanitize healthcare data to remove sensitive information
     */
    sanitizeHealthcareData(data) {
        if (!data) return data;

        // Create a deep copy to avoid modifying original data
        const sanitized = JSON.parse(JSON.stringify(data));
        
        // Remove sensitive fields from logs/response
        this.removeSensitiveFields(sanitized);
        
        return sanitized;
    }

    /**
     * Remove sensitive healthcare information from response
     */
    removeSensitiveFields(obj) {
        if (typeof obj !== 'object' || obj === null) return;

        const sensitiveFields = [
            'password', 'ssn', 'socialSecurityNumber', 'insuranceId',
            'creditCard', 'billingInfo', 'medicalRecordRaw', 'diagnosisCodes',
            'treatmentHistory', 'prescriptionDetails', 'therapyNotes'
        ];

        Object.keys(obj).forEach(key => {
            if (sensitiveFields.includes(key.toLowerCase())) {
                // Mask sensitive data instead of complete removal
                if (typeof obj[key] === 'string' && obj[key].length > 4) {
                    obj[key] = '***' + obj[key].slice(-4);
                } else {
                    obj[key] = '***';
                }
            } else if (typeof obj[key] === 'object') {
                this.removeSensitiveFields(obj[key]);
            }
        });
    }

    /**
     * Add healthcare-specific metadata to response
     */
    addHealthcareMetadata(data) {
        if (Array.isArray(data)) {
            this.metadata.recordCount = data.length;
            this.metadata.totalPages = this.metadata.totalPages || 1;
            this.metadata.currentPage = this.metadata.currentPage || 1;
        } else if (typeof data === 'object') {
            this.metadata.recordType = this.determineRecordType(data);
            this.metadata.lastUpdated = data.updatedAt || data.createdAt;
        }

        // Add HIPAA compliance info
        this.metadata.hipaaCompliant = true;
        this.metadata.dataRetention = '7 years';
    }

    /**
     * Determine the type of healthcare record
     */
    determineRecordType(data) {
        if (data.patientId) return 'patient';
        if (data.appointmentDate) return 'appointment';
        if (data.prescriptionId) return 'prescription';
        if (data.labResultId) return 'lab_result';
        if (data.medicalRecordNumber) return 'medical_record';
        if (data.insurancePolicy) return 'insurance';
        return 'unknown';
    }

    /**
     * Generate unique request ID for tracking
     */
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Create success response with healthcare context
     */
    static success(data, message = "Operation completed successfully", metadata = {}) {
        return new ApiResponse(200, data, message, metadata);
    }

    /**
     * Create created response for new healthcare records
     */
    static created(data, message = "Record created successfully", metadata = {}) {
        return new ApiResponse(201, data, message, metadata);
    }

    /**
     * Create no content response
     */
    static noContent(message = "No content found", metadata = {}) {
        return new ApiResponse(204, null, message, metadata);
    }

    /**
     * Create paginated response for healthcare data lists
     */
    static paginated(data, paginationInfo, message = "Data retrieved successfully") {
        return new ApiResponse(200, data, message, {
            pagination: {
                page: paginationInfo.page,
                limit: paginationInfo.limit,
                total: paginationInfo.total,
                totalPages: Math.ceil(paginationInfo.total / paginationInfo.limit),
                hasNext: paginationInfo.page < Math.ceil(paginationInfo.total / paginationInfo.limit),
                hasPrev: paginationInfo.page > 1
            }
        });
    }

    /**
     * Convert to JSON with healthcare compliance
     */
    toJSON() {
        return {
            success: this.success,
            statusCode: this.statusCode,
            message: this.message,
            data: this.data,
            timestamp: this.timestamp,
            metadata: this.metadata
        };
    }

    /**
     * Send response through Express res object
     */
    send(res) {
        return res.status(this.statusCode).json(this.toJSON());
    }
}

export { ApiResponse };