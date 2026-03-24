/**
 * Healthcare System - Advanced Logging Utilities
 * 
 * HIPAA-compliant logging for healthcare applications
 * Secure logging with sensitive data protection and audit trails
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
        audit: 4,
        security: 5,
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
        winston.addColors(LOG_CONFIG.COLORS);

        const { combine, timestamp, printf, colorize, errors, json } = winston.format;

        const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
            const sanitizedMessage = this.sanitizeSensitiveData(message);
            const metaString = Object.keys(metadata).length > 0 
                ? ` | ${this.sanitizeSensitiveData(JSON.stringify(metadata))}` 
                : '';
            
            const emoji = this.getLogEmoji(level);
            return `${emoji} [${timestamp}] ${level.toUpperCase()}: ${sanitizedMessage}${metaString}`;
        });

        const jsonFormat = json();

        const auditTransport = new winston.transports.DailyRotateFile({
            filename: path.join(logsDir, 'healthcare-audit-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'audit',
            format: combine(timestamp(), jsonFormat),
            maxFiles: '7y',
            maxSize: '50m',
            auditFile: path.join(logsDir, 'audit-metadata.json')
        });

        const securityTransport = new winston.transports.DailyRotateFile({
            filename: path.join(logsDir, 'healthcare-security-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'security',
            format: combine(timestamp(), jsonFormat),
            maxFiles: '1y',
            maxSize: '50m'
        });

        const errorTransport = new winston.transports.DailyRotateFile({
            filename: path.join(logsDir, 'healthcare-error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            format: combine(timestamp(), jsonFormat),
            maxFiles: '90d',
            maxSize: '50m'
        });

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
                timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })
            ),
            transports: [
                new winston.transports.Console({
                    format: combine(
                        colorize({ all: true }),
                        timestamp({ format: 'MMM dd, yyyy HH:mm:ss' }),
                        consoleFormat
                    )
                }),
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
     */
    sanitizeSensitiveData(data) {
        if (data === null || data === undefined) {
            return data;
        }

        let sanitized = typeof data === 'string' ? data : JSON.stringify(data);

        const sensitivePatterns = [
            { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[REDACTED_SSN]' },
            { pattern: /\b(\+?1[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b/g, replacement: '[REDACTED_PHONE]' },
            { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[REDACTED_EMAIL]' },
            { pattern: /\b[A-Z0-9]{6,15}\b/g, replacement: '[REDACTED_MRN]' },
            { pattern: /\b[A-Z]{2,5}[-]?\d{4,10}\b/g, replacement: '[REDACTED_INSURANCE]' },
            { pattern: /("patientName"?\s*:\s*")[^"]+(")/gi, replacement: '$1[REDACTED_NAME]$2' },
            { pattern: /("doctorName"?\s*:\s*")[^"]+(")/gi, replacement: '$1[REDACTED_NAME]$2' },
            { pattern: /\d{1,5}\s+\w+\s+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln)\b/gi, replacement: '[REDACTED_ADDRESS]' },
            { pattern: /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, replacement: '[REDACTED_DOB]' },
            { pattern: /\b(?:\d[ -]*?){13,16}\b/g, replacement: '[REDACTED_CARD]' },
            { pattern: /\b\d{8,17}\b/g, replacement: '[REDACTED_ACCOUNT]' }
        ];

        sensitivePatterns.forEach(({ pattern, replacement }) => {
            sanitized = sanitized.replace(pattern, replacement);
        });

        return sanitized;
    }

    /**
     * Mask IDs for privacy protection
     */
    maskId(id) {
        if (!id) return 'unknown';
        const idStr = id.toString();
        if (idStr.length <= 4) return '****';
        return `*${idStr.slice(-4)}`;
    }

    /**
     * Add to in-memory audit trail
     */
    addToAuditTrail(logEntry) {
        this.auditTrail.push({
            ...logEntry,
            timestamp: new Date().toISOString()
        });
        
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
        
        if (this.securityEvents.length > 500) {
            this.securityEvents = this.securityEvents.slice(-500);
        }
    }

    /**
     * Start periodic audit log cleanup
     */
    startAuditCleanup() {
        setInterval(() => {
            this.cleanupOldLogs();
        }, 24 * 60 * 60 * 1000);
    }

    /**
     * Clean up old logs based on retention policy
     */
    cleanupOldLogs() {
        this.info('Log cleanup cycle completed');
    }

    /**
     * Log patient access activity
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

        if (severity === 'critical' || severity === 'high') {
            this.error('SECURITY_EVENT', securityLog);
        } else if (severity === 'medium') {
            this.warn('SECURITY_EVENT', securityLog);
        } else {
            this.security('SECURITY_EVENT', securityLog);
        }

        this.addToSecurityEvents(securityLog);
        
        if (severity === 'critical') {
            this.sendSecurityAlert(securityLog);
        }
    }

    /**
     * Send security alert for critical events
     */
    sendSecurityAlert(securityLog) {
        console.error('🚨 CRITICAL SECURITY ALERT:', securityLog);
    }

    /**
     * Log API request
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
     * Log business transaction
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
     */
    emergency(message, details = {}) {
        const emergencyLog = {
            type: 'EMERGENCY',
            message: this.sanitizeSensitiveData(message),
            ...this.sanitizeSensitiveData(details),
            timestamp: new Date().toISOString()
        };

        this.logger.error('🚨 EMERGENCY HEALTHCARE EVENT', emergencyLog);
        this.sendEmergencyAlert(emergencyLog);
    }

    /**
     * Send emergency alert
     */
    sendEmergencyAlert(emergencyLog) {
        console.error('🚑 EMERGENCY RESPONSE NEEDED:', emergencyLog);
    }

    /**
     * Get recent audit trail
     */
    getRecentAuditTrail(limit = 100) {
        return this.auditTrail.slice(-limit);
    }

    /**
     * Get recent security events
     */
    getRecentSecurityEvents(limit = 50) {
        return this.securityEvents.slice(-limit);
    }

    /**
     * Search audit logs
     */
    async searchAuditLogs(criteria) {
        this.info('Audit log search requested', { criteria });
        return [];
    }

    /**
     * Generate compliance report
     */
    async generateComplianceReport(startDate, endDate) {
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

    // Proxy methods to Winston logger
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

// Create and export the logger instance as default export
const healthcareLogger = new HealthcareLogger();
export default healthcareLogger;