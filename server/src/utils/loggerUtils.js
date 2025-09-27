/**
 * Healthcare System - Advanced Logging Utilities
 * 
 * HIPAA-compliant logging for healthcare applications
 * Secure logging with sensitive data protection and audit trails
 */

import winston from 'winston';
import { DATETIME_CONFIG } from "./dateTimeUtils";

/**
 * Healthcare Logging Configuration
 */
const LOG_CONFIG = {
    LEVELS: {
        error: 0,
        warn: 1,
        info: 2,
        debug: 3,
        audit: 4, // Healthcare-specific audit level
        trace: 5
    },
    COLORS: {
        error: 'red',
        warn: 'yellow',
        info: 'green',
        debug: 'blue',
        audit: 'magenta',
        trace: 'gray'
    },
    RETENTION: {
        error: '90d', // Keep errors longer for compliance
        audit: '7y',  // Keep audit logs for 7 years (HIPAA)
        general: '30d'
    }
};

/**
 * Healthcare Logger Class
 */
class HealthcareLogger {
    constructor() {
        this.logger = this.createLogger();
        this.auditTrail = [];
    }

    /**
     * Create Winston logger with healthcare-specific configuration
     */
    createLogger() {
        const { combine, timestamp, printf, colorize, errors } = winston.format;

        // Healthcare-specific log format
        const healthcareFormat = printf(({ level, message, timestamp, ...metadata }) => {
            const sanitizedMessage = this.sanitizeSensitiveData(message);
            let log = `[${timestamp}] ${level.toUpperCase()}: ${sanitizedMessage}`;
            
            if (Object.keys(metadata).length > 0) {
                const sanitizedMetadata = this.sanitizeSensitiveData(JSON.stringify(metadata));
                log += ` | ${sanitizedMetadata}`;
            }
            
            return log;
        });

        return winston.createLogger({
            levels: LOG_CONFIG.LEVELS,
            level: process.env.LOG_LEVEL || 'info',
            format: combine(
                errors({ stack: true }),
                timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                healthcareFormat
            ),
            transports: [
                // Console transport for development
                new winston.transports.Console({
                    format: combine(colorize(), healthcareFormat)
                }),
                
                // File transport for errors (HIPAA compliance)
                new winston.transports.File({
                    filename: 'logs/healthcare-error.log',
                    level: 'error',
                    maxsize: 5242880, // 5MB
                    maxFiles: 5
                }),
                
                // File transport for audit logs (HIPAA requirement)
                new winston.transports.File({
                    filename: 'logs/healthcare-audit.log',
                    level: 'audit',
                    maxsize: 10485760, // 10MB
                    maxFiles: 10
                }),
                
                // Combined log file
                new winston.transports.File({
                    filename: 'logs/healthcare-combined.log',
                    maxsize: 5242880, // 5MB
                    maxFiles: 5
                })
            ],
            exceptionHandlers: [
                new winston.transports.File({ filename: 'logs/healthcare-exceptions.log' })
            ],
            rejectionHandlers: [
                new winston.transports.File({ filename: 'logs/healthcare-rejections.log' })
            ]
        });
    }

    /**
     * Sanitize sensitive healthcare data from logs
     */
    sanitizeSensitiveData(data) {
        if (typeof data !== 'string') {
            data = JSON.stringify(data);
        }

        const sensitivePatterns = {
            ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
            phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
            email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
            mrn: /\b[A-Z0-9]{6,15}\b/g,
            insurance: /\b[A-Z0-9]{6,20}\b/g
        };

        let sanitized = data;
        Object.keys(sensitivePatterns).forEach(key => {
            sanitized = sanitized.replace(sensitivePatterns[key], `[REDACTED_${key.toUpperCase()}]`);
        });

        return sanitized;
    }

    /**
     * Log patient access activity (HIPAA requirement)
     */
    logPatientAccess(patientId, action, userId, details = {}) {
        const auditLog = {
            timestamp: new Date().toISOString(),
            patientId: this.maskId(patientId),
            action,
            userId: this.maskId(userId),
            ipAddress: details.ipAddress || 'unknown',
            userAgent: details.userAgent || 'unknown',
            resource: details.resource,
            changes: details.changes ? this.sanitizeSensitiveData(details.changes) : null,
            outcome: details.outcome || 'success'
        };

        this.logger.audit('PATIENT_ACCESS', auditLog);
        this.addToAuditTrail(auditLog);
    }

    /**
     * Log medical record changes
     */
    logMedicalRecordChange(recordId, action, userId, changes = {}) {
        const auditLog = {
            timestamp: new Date().toISOString(),
            recordId: this.maskId(recordId),
            action,
            userId: this.maskId(userId),
            changeType: changes.changeType || 'update',
            fieldChanges: this.sanitizeSensitiveData(changes.fieldChanges || {}),
            previousValues: this.sanitizeSensitiveData(changes.previousValues || {}),
            newValues: this.sanitizeSensitiveData(changes.newValues || {})
        };

        this.logger.audit('MEDICAL_RECORD_CHANGE', auditLog);
        this.addToAuditTrail(auditLog);
    }

    /**
     * Log prescription activity
     */
    logPrescriptionActivity(prescriptionId, action, pharmacistId, details = {}) {
        const auditLog = {
            timestamp: new Date().toISOString(),
            prescriptionId: this.maskId(prescriptionId),
            action,
            pharmacistId: this.maskId(pharmacistId),
            patientId: this.maskId(details.patientId),
            medication: details.medication ? this.maskId(details.medication) : null,
            dosage: details.dosage,
            quantity: details.quantity,
            refills: details.refills
        };

        this.logger.audit('PRESCRIPTION_ACTIVITY', auditLog);
        this.addToAuditTrail(auditLog);
    }

    /**
     * Log appointment activity
     */
    logAppointmentActivity(appointmentId, action, staffId, details = {}) {
        const auditLog = {
            timestamp: new Date().toISOString(),
            appointmentId: this.maskId(appointmentId),
            action,
            staffId: this.maskId(staffId),
            patientId: this.maskId(details.patientId),
            appointmentDate: details.appointmentDate,
            changes: details.changes ? this.sanitizeSensitiveData(details.changes) : null,
            reason: details.reason
        };

        this.logger.audit('APPOINTMENT_ACTIVITY', auditLog);
        this.addToAuditTrail(auditLog);
    }

    /**
     * Log security events
     */
    logSecurityEvent(eventType, severity, userId, details = {}) {
        const securityLog = {
            timestamp: new Date().toISOString(),
            eventType,
            severity,
            userId: this.maskId(userId),
            ipAddress: details.ipAddress || 'unknown',
            userAgent: details.userAgent || 'unknown',
            description: details.description,
            actionTaken: details.actionTaken || 'none'
        };

        this.logger.warn('SECURITY_EVENT', securityLog);
        
        if (severity === 'high') {
            this.logger.error('HIGH_SEVERITY_SECURITY_EVENT', securityLog);
        }
    }

    /**
     * Mask IDs for privacy protection
     */
    maskId(id) {
        if (!id) return 'unknown';
        return `***${id.toString().slice(-4)}`;
    }

    /**
     * Add to in-memory audit trail (for real-time monitoring)
     */
    addToAuditTrail(logEntry) {
        this.auditTrail.push(logEntry);
        
        // Keep only last 1000 entries in memory
        if (this.auditTrail.length > 1000) {
            this.auditTrail = this.auditTrail.slice(-1000);
        }
    }

    /**
     * Get recent audit trail for monitoring
     */
    getRecentAuditTrail(limit = 100) {
        return this.auditTrail.slice(-limit);
    }

    /**
     * Log API request for healthcare monitoring
     */
    logApiRequest(req, res, responseTime) {
        const logData = {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            userId: req.user ? this.maskId(req.user.id) : 'anonymous'
        };

        if (res.statusCode >= 400) {
            this.logger.warn('API_REQUEST', logData);
        } else {
            this.logger.info('API_REQUEST', logData);
        }
    }

    /**
     * Log healthcare business transaction
     */
    logBusinessTransaction(transactionType, entityId, amount, userId, details = {}) {
        const transactionLog = {
            timestamp: new Date().toISOString(),
            transactionType,
            entityId: this.maskId(entityId),
            amount,
            userId: this.maskId(userId),
            currency: details.currency || 'USD',
            status: details.status || 'completed',
            paymentMethod: details.paymentMethod ? this.maskId(details.paymentMethod) : null
        };

        this.logger.audit('BUSINESS_TRANSACTION', transactionLog);
    }

    /**
     * Emergency log for critical healthcare events
     */
    emergency(message, details = {}) {
        this.logger.error('EMERGENCY', {
            timestamp: new Date().toISOString(),
            message: this.sanitizeSensitiveData(message),
            ...this.sanitizeSensitiveData(details)
        });

        // TODO: Integrate with emergency notification system
        console.error('🚨 EMERGENCY HEALTHCARE EVENT:', message);
    }

    // Proxy methods to Winston logger
    error(message, meta) {
        this.logger.error(this.sanitizeSensitiveData(message), this.sanitizeSensitiveData(meta));
    }

    warn(message, meta) {
        this.logger.warn(this.sanitizeSensitiveData(message), this.sanitizeSensitiveData(meta));
    }

    info(message, meta) {
        this.logger.info(this.sanitizeSensitiveData(message), this.sanitizeSensitiveData(meta));
    }

    debug(message, meta) {
        this.logger.debug(this.sanitizeSensitiveData(message), this.sanitizeSensitiveData(meta));
    }

    audit(message, meta) {
        this.logger.log('audit', this.sanitizeSensitiveData(message), this.sanitizeSensitiveData(meta));
    }
}

// Create singleton instance
const healthcareLogger = new HealthcareLogger();

export { healthcareLogger as LoggerUtils, HealthcareLogger, LOG_CONFIG };