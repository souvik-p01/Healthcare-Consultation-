/**
 * Healthcare System - Advanced Logging Utilities
 * 
 * HIPAA-compliant logging for healthcare applications
 * Secure logging with sensitive data protection and audit trails
 * 
 * Features:
 * - HIPAA-compliant audit trails (7-year retention)
 * - PHI/PII data sanitization
 * - Multi-level logging with healthcare-specific levels
 * - Real-time monitoring capabilities
 * - Security event tracking
 * - Medical record change tracking
 * - Patient access logging
 * - Integration with existing utilities
 */

import winston from 'winston';
import 'winston-daily-rotate-file';
import { DATETIME_CONFIG } from "./dateTimeUtils.js";

// Ensure logs directory exists
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Healthcare Logging Configuration
 */
export const LOG_CONFIG = {
    LEVELS: {
        error: 0,
        warn: 1,
        info: 2,
        debug: 3,
        audit: 4,     // Healthcare-specific audit level
        security: 5,  // Security events
        trace: 6
    },
    COLORS: {
        error: 'red',
        warn: 'yellow',
        info: 'green',
        debug: 'blue',
        audit: 'magenta',
        security: 'red',
        trace: 'gray'
    },
    RETENTION: {
        error: '90d',
        audit: '7y',
        security: '1y',
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
        this.securityEvents = [];
        this.startAuditCleanup();
    }

    /**
     * Create Winston logger with healthcare-specific configuration
     */
    createLogger() {
        // Add colors
        winston.addColors(LOG_CONFIG.COLORS);

        const { combine, timestamp, printf, colorize, errors, json } = winston.format;

        // Healthcare-specific log format for console
        const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
            const sanitizedMessage = this.sanitizeSensitiveData(message);
            const metaString = Object.keys(metadata).length > 0 
                ? ` | ${this.sanitizeSensitiveData(JSON.stringify(metadata))}` 
                : '';
            
            // Format based on log level
            const emoji = this.getLogEmoji(level);
            return `${emoji} [${timestamp}] ${level.toUpperCase()}: ${sanitizedMessage}${metaString}`;
        });

        // JSON format for file storage (for easy parsing)
        const jsonFormat = json();

        // Daily rotate file transport for audit logs (HIPAA requirement - 7 years)
        const auditTransport = new winston.transports.DailyRotateFile({
            filename: path.join(logsDir, 'healthcare-audit-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'audit',
            format: combine(timestamp(), jsonFormat),
            maxFiles: '7y', // Keep audit logs for 7 years (HIPAA requirement)
            maxSize: '50m',
            auditFile: path.join(logsDir, 'audit-metadata.json')
        });

        // Security events transport
        const securityTransport = new winston.transports.DailyRotateFile({
            filename: path.join(logsDir, 'healthcare-security-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'security',
            format: combine(timestamp(), jsonFormat),
            maxFiles: '1y',
            maxSize: '50m'
        });

        // Error transport
        const errorTransport = new winston.transports.DailyRotateFile({
            filename: path.join(logsDir, 'healthcare-error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            format: combine(timestamp(), jsonFormat),
            maxFiles: '90d',
            maxSize: '50m'
        });

        // Combined logs transport
        const combinedTransport = new winston.transports.DailyRotateFile({
            filename: path.join(logsDir, 'healthcare-combined-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            format: combine(timestamp(), jsonFormat),
            maxFiles: '30d',
            maxSize: '50m'
        });

        return winston.createLogger({
            levels: LOG_CONFIG.LEVELS,
            level: process.env.LOG_LEVEL || 'info',
            format: combine(
                errors({ stack: true }),
                timestamp({ format: DATETIME_CONFIG.DATE_FORMATS.REPORT || 'YYYY-MM-DD HH:mm:ss' })
            ),
            transports: [
                // Console transport for development
                new winston.transports.Console({
                    format: combine(
                        colorize({ all: true }),
                        timestamp({ format: DATETIME_CONFIG.DATE_FORMATS.DISPLAY || 'MMM dd, yyyy HH:mm:ss' }),
                        consoleFormat
                    )
                }),
                
                // File transports
                errorTransport,
                auditTransport,
                securityTransport,
                combinedTransport
            ],
            exceptionHandlers: [
                new winston.transports.DailyRotateFile({
                    filename: path.join(logsDir, 'healthcare-exceptions-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    format: combine(timestamp(), jsonFormat),
                    maxFiles: '30d'
                })
            ],
            rejectionHandlers: [
                new winston.transports.DailyRotateFile({
                    filename: path.join(logsDir, 'healthcare-rejections-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    format: combine(timestamp(), jsonFormat),
                    maxFiles: '30d'
                })
            ]
        });
    }

    /**
     * Get emoji for log level
     */
    getLogEmoji(level) {
        const emojis = {
            error: '❌',
            warn: '⚠️',
            info: '📘',
            debug: '🔍',
            audit: '📋',
            security: '🔒',
            trace: '📝'
        };
        return emojis[level] || '📌';
    }

    /**
     * Sanitize sensitive healthcare data from logs
     * HIPAA compliance: Remove PHI/PII from logs
     */
    sanitizeSensitiveData(data) {
        if (data === null || data === undefined) {
            return data;
        }

        let sanitized = typeof data === 'string' ? data : JSON.stringify(data);

        // PHI/PII patterns to redact
        const sensitivePatterns = [
            // Social Security Numbers
            { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[REDACTED_SSN]' },
            // Phone numbers (US format)
            { pattern: /\b(\+?1[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b/g, replacement: '[REDACTED_PHONE]' },
            // Email addresses
            { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[REDACTED_EMAIL]' },
            // Medical Record Numbers (alphanumeric, 6-15 chars)
            { pattern: /\b[A-Z0-9]{6,15}\b/g, replacement: '[REDACTED_MRN]' },
            // Insurance IDs
            { pattern: /\b[A-Z]{2,5}[-]?\d{4,10}\b/g, replacement: '[REDACTED_INSURANCE]' },
            // Names (only redact if they appear in specific contexts)
            { pattern: /("patientName"?\s*:\s*")[^"]+(")/gi, replacement: '$1[REDACTED_NAME]$2' },
            { pattern: /("doctorName"?\s*:\s*")[^"]+(")/gi, replacement: '$1[REDACTED_NAME]$2' },
            // Addresses
            { pattern: /\d{1,5}\s+\w+\s+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln)\b/gi, replacement: '[REDACTED_ADDRESS]' },
            // Dates of birth
            { pattern: /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, replacement: '[REDACTED_DOB]' },
            // Credit card numbers
            { pattern: /\b(?:\d[ -]*?){13,16}\b/g, replacement: '[REDACTED_CARD]' },
            // Bank account numbers
            { pattern: /\b\d{8,17}\b/g, replacement: '[REDACTED_ACCOUNT]' }
        ];

        sensitivePatterns.forEach(({ pattern, replacement }) => {
            sanitized = sanitized.replace(pattern, replacement);
        });

        return sanitized;
    }

    /**
     * Mask IDs for privacy protection (shows only last 4 chars)
     */
    maskId(id) {
        if (!id) return 'unknown';
        const idStr = id.toString();
        if (idStr.length <= 4) return '****';
        return `*${idStr.slice(-4)}`;
    }

    /**
     * Add to in-memory audit trail (for real-time monitoring)
     */
    addToAuditTrail(logEntry) {
        this.auditTrail.push({
            ...logEntry,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 1000 entries in memory
        if (this.auditTrail.length > 1000) {
            this.auditTrail = this.auditTrail.slice(-1000);
        }
    }

    /**
     * Add to security events in-memory store
     */
    addToSecurityEvents(event) {
        this.securityEvents.push({
            ...event,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 500 security events in memory
        if (this.securityEvents.length > 500) {
            this.securityEvents = this.securityEvents.slice(-500);
        }
    }

    /**
     * Start periodic audit log cleanup
     */
    startAuditCleanup() {
        // Run cleanup every day at midnight
        setInterval(() => {
            this.cleanupOldLogs();
        }, 24 * 60 * 60 * 1000);
    }

    /**
     * Clean up old logs based on retention policy
     */
    cleanupOldLogs() {
        // This is handled by winston-daily-rotate-file
        // Just log that cleanup occurred
        this.info('Log cleanup cycle completed');
    }

    /**
     * Log patient access activity (HIPAA requirement)
     * @param {string} patientId - Patient identifier
     * @param {string} action - Action performed (view, edit, delete)
     * @param {string} userId - User performing action
     * @param {Object} details - Additional details
     */
    logPatientAccess(patientId, action, userId, details = {}) {
        const auditLog = {
            type: 'PATIENT_ACCESS',
            patientId: this.maskId(patientId),
            action,
            userId: this.maskId(userId),
            ipAddress: details.ipAddress || 'unknown',
            userAgent: details.userAgent || 'unknown',
            resource: details.resource,
            changes: details.changes ? this.sanitizeSensitiveData(details.changes) : null,
            outcome: details.outcome || 'success',
            timestamp: new Date().toISOString()
        };

        this.audit('Patient Access Log', auditLog);
        this.addToAuditTrail(auditLog);
    }

    /**
     * Log medical record changes
     * @param {string} recordId - Medical record identifier
     * @param {string} action - Action performed
     * @param {string} userId - User performing action
     * @param {Object} changes - Changes made
     */
    logMedicalRecordChange(recordId, action, userId, changes = {}) {
        const auditLog = {
            type: 'MEDICAL_RECORD_CHANGE',
            recordId: this.maskId(recordId),
            action,
            userId: this.maskId(userId),
            changeType: changes.changeType || 'update',
            fieldChanges: changes.fieldChanges || {},
            previousValues: changes.previousValues || {},
            newValues: changes.newValues || {},
            timestamp: new Date().toISOString()
        };

        this.audit('Medical Record Change', auditLog);
        this.addToAuditTrail(auditLog);
    }

    /**
     * Log prescription activity
     * @param {string} prescriptionId - Prescription identifier
     * @param {string} action - Action performed
     * @param {string} pharmacistId - Pharmacist identifier
     * @param {Object} details - Prescription details
     */
    logPrescriptionActivity(prescriptionId, action, pharmacistId, details = {}) {
        const auditLog = {
            type: 'PRESCRIPTION_ACTIVITY',
            prescriptionId: this.maskId(prescriptionId),
            action,
            pharmacistId: this.maskId(pharmacistId),
            patientId: this.maskId(details.patientId),
            medication: details.medication ? this.maskId(details.medication) : null,
            dosage: details.dosage,
            quantity: details.quantity,
            refills: details.refills,
            timestamp: new Date().toISOString()
        };

        this.audit('Prescription Activity', auditLog);
        this.addToAuditTrail(auditLog);
    }

    /**
     * Log appointment activity
     * @param {string} appointmentId - Appointment identifier
     * @param {string} action - Action performed
     * @param {string} staffId - Staff identifier
     * @param {Object} details - Appointment details
     */
    logAppointmentActivity(appointmentId, action, staffId, details = {}) {
        const auditLog = {
            type: 'APPOINTMENT_ACTIVITY',
            appointmentId: this.maskId(appointmentId),
            action,
            staffId: this.maskId(staffId),
            patientId: this.maskId(details.patientId),
            appointmentDate: details.appointmentDate,
            changes: details.changes ? this.sanitizeSensitiveData(details.changes) : null,
            reason: details.reason,
            timestamp: new Date().toISOString()
        };

        this.audit('Appointment Activity', auditLog);
        this.addToAuditTrail(auditLog);
    }

    /**
     * Log security events
     * @param {string} eventType - Type of security event
     * @param {string} severity - Severity (low, medium, high, critical)
     * @param {string} userId - User identifier
     * @param {Object} details - Event details
     */
    logSecurityEvent(eventType, severity, userId, details = {}) {
        const securityLog = {
            type: 'SECURITY_EVENT',
            eventType,
            severity,
            userId: this.maskId(userId),
            ipAddress: details.ipAddress || 'unknown',
            userAgent: details.userAgent || 'unknown',
            description: details.description,
            actionTaken: details.actionTaken || 'none',
            timestamp: new Date().toISOString()
        };

        // Log at appropriate level based on severity
        if (severity === 'critical' || severity === 'high') {
            this.error('SECURITY_EVENT', securityLog);
        } else if (severity === 'medium') {
            this.warn('SECURITY_EVENT', securityLog);
        } else {
            this.security('SECURITY_EVENT', securityLog);
        }

        this.addToSecurityEvents(securityLog);
        
        // Send alert for critical security events
        if (severity === 'critical') {
            this.sendSecurityAlert(securityLog);
        }
    }

    /**
     * Send security alert for critical events
     * @param {Object} securityLog - Security event details
     */
    sendSecurityAlert(securityLog) {
        // Implement your alert mechanism (email, SMS, Slack, etc.)
        console.error('🚨 CRITICAL SECURITY ALERT:', securityLog);
        
        // You can integrate with your notification system here
        // Example: sendEmail, sendSMS, callWebhook, etc.
    }

    /**
     * Log API request for healthcare monitoring
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {number} responseTime - Response time in ms
     */
    logApiRequest(req, res, responseTime) {
        const logData = {
            type: 'API_REQUEST',
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            userId: req.user ? this.maskId(req.user.id) : 'anonymous'
        };

        if (res.statusCode >= 500) {
            this.error('API Request Failed', logData);
        } else if (res.statusCode >= 400) {
            this.warn('API Request Warning', logData);
        } else {
            this.info('API Request', logData);
        }
    }

    /**
     * Log healthcare business transaction
     * @param {string} transactionType - Type of transaction
     * @param {string} entityId - Entity identifier
     * @param {number} amount - Transaction amount
     * @param {string} userId - User identifier
     * @param {Object} details - Transaction details
     */
    logBusinessTransaction(transactionType, entityId, amount, userId, details = {}) {
        const transactionLog = {
            type: 'BUSINESS_TRANSACTION',
            transactionType,
            entityId: this.maskId(entityId),
            amount,
            userId: this.maskId(userId),
            currency: details.currency || 'INR',
            status: details.status || 'completed',
            paymentMethod: details.paymentMethod ? this.maskId(details.paymentMethod) : null,
            timestamp: new Date().toISOString()
        };

        this.audit('Business Transaction', transactionLog);
    }

    /**
     * Log payment activity
     * @param {string} paymentId - Payment identifier
     * @param {string} action - Action performed
     * @param {Object} details - Payment details
     */
    logPaymentActivity(paymentId, action, details = {}) {
        const paymentLog = {
            type: 'PAYMENT_ACTIVITY',
            paymentId: this.maskId(paymentId),
            action,
            amount: details.amount,
            currency: details.currency || 'INR',
            status: details.status,
            paymentMethod: details.paymentMethod,
            userId: details.userId ? this.maskId(details.userId) : null,
            timestamp: new Date().toISOString()
        };

        if (details.status === 'failed') {
            this.error('Payment Failed', paymentLog);
        } else if (details.status === 'refunded') {
            this.warn('Payment Refunded', paymentLog);
        } else {
            this.info('Payment Activity', paymentLog);
        }

        this.addToAuditTrail(paymentLog);
    }

    /**
     * Emergency log for critical healthcare events
     * @param {string} message - Emergency message
     * @param {Object} details - Emergency details
     */
    emergency(message, details = {}) {
        const emergencyLog = {
            type: 'EMERGENCY',
            message: this.sanitizeSensitiveData(message),
            ...this.sanitizeSensitiveData(details),
            timestamp: new Date().toISOString()
        };

        this.logger.error('🚨 EMERGENCY HEALTHCARE EVENT', emergencyLog);

        // Send immediate notification
        this.sendEmergencyAlert(emergencyLog);
    }

    /**
     * Send emergency alert
     * @param {Object} emergencyLog - Emergency details
     */
    sendEmergencyAlert(emergencyLog) {
        // Implement your emergency notification system
        console.error('🚑 EMERGENCY RESPONSE NEEDED:', emergencyLog);
        
        // Integrate with pager system, SMS, etc.
        // Example: notify on-call doctor, send to emergency response team
    }

    /**
     * Get recent audit trail for monitoring
     * @param {number} limit - Number of entries to return
     * @returns {Array} Recent audit trail entries
     */
    getRecentAuditTrail(limit = 100) {
        return this.auditTrail.slice(-limit);
    }

    /**
     * Get recent security events
     * @param {number} limit - Number of events to return
     * @returns {Array} Recent security events
     */
    getRecentSecurityEvents(limit = 50) {
        return this.securityEvents.slice(-limit);
    }

    /**
     * Search audit logs
     * @param {Object} criteria - Search criteria
     * @returns {Promise<Array>} Matching audit entries
     */
    async searchAuditLogs(criteria) {
        // Implement search across audit log files
        // This is a placeholder - implement based on your storage solution
        this.info('Audit log search requested', { criteria });
        return [];
    }

    /**
     * Generate compliance report
     * @param {Date} startDate - Start date for report
     * @param {Date} endDate - End date for report
     * @returns {Promise<Object>} Compliance report
     */
    async generateComplianceReport(startDate, endDate) {
        // Generate HIPAA compliance report
        const report = {
            period: {
                start: startDate.toISOString(),
                end: endDate.toISOString()
            },
            totalAuditEvents: this.auditTrail.length,
            securityEvents: this.securityEvents.length,
            criticalEvents: this.securityEvents.filter(e => e.severity === 'critical').length,
            generatedAt: new Date().toISOString()
        };

        return report;
    }

    // Proxy methods to Winston logger with sanitization
    error(message, meta) {
        this.logger.error(
            this.sanitizeSensitiveData(message), 
            this.sanitizeSensitiveData(meta)
        );
    }

    warn(message, meta) {
        this.logger.warn(
            this.sanitizeSensitiveData(message), 
            this.sanitizeSensitiveData(meta)
        );
    }

    info(message, meta) {
        this.logger.info(
            this.sanitizeSensitiveData(message), 
            this.sanitizeSensitiveData(meta)
        );
    }

    debug(message, meta) {
        this.logger.debug(
            this.sanitizeSensitiveData(message), 
            this.sanitizeSensitiveData(meta)
        );
    }

    audit(message, meta) {
        this.logger.log(
            'audit', 
            this.sanitizeSensitiveData(message), 
            this.sanitizeSensitiveData(meta)
        );
    }

    security(message, meta) {
        this.logger.log(
            'security', 
            this.sanitizeSensitiveData(message), 
            this.sanitizeSensitiveData(meta)
        );
    }

    trace(message, meta) {
        this.logger.log(
            'trace', 
            this.sanitizeSensitiveData(message), 
            this.sanitizeSensitiveData(meta)
        );
    }
}

// Create singleton instance
const healthcareLogger = new HealthcareLogger();

// Export the singleton instance and class (LOG_CONFIG is already exported above)
export { healthcareLogger as LoggerUtils, HealthcareLogger };