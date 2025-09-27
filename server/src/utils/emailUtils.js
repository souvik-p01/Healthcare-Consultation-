/**
 * Healthcare System - Email Communication Utility
 * 
 * HIPAA-compliant email service for healthcare communications including
 * appointment confirmations, prescription notifications, and system alerts.
 * 
 * Features:
 * - HIPAA-compliant email templates
 * - Appointment confirmations and reminders
 * - Prescription notifications
 * - Medical report delivery
 * - Emergency notifications
 * - Email audit logging
 * - Secure email handling
 */

import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

/**
 * Email Configuration for Healthcare System
 */
const EMAIL_CONFIG = {
    SERVICE: process.env.EMAIL_SERVICE || 'gmail',
    FROM_EMAIL: process.env.EMAIL_FROM || 'noreply@healthcare-system.com',
    FROM_NAME: process.env.EMAIL_FROM_NAME || 'Healthcare Consultation System',
    
    // Email templates directory
    TEMPLATES_DIR: path.join(process.cwd(), 'templates', 'emails'),
    
    // HIPAA compliance settings
    ENCRYPTION_ENABLED: process.env.EMAIL_ENCRYPTION === 'true',
    AUDIT_ENABLED: true,
    
    // Email categories for tracking
    CATEGORIES: {
        APPOINTMENT: 'appointment',
        PRESCRIPTION: 'prescription',
        MEDICAL_REPORT: 'medical-report',
        NOTIFICATION: 'notification',
        VERIFICATION: 'verification',
        EMERGENCY: 'emergency'
    }
};

/**
 * Create secure email transporter for healthcare communications
 * 
 * @returns {Object} - Nodemailer transporter instance
 */
const createEmailTransporter = () => {
    try {
        const transportConfig = {
            service: EMAIL_CONFIG.SERVICE,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            secure: true, // Use TLS for healthcare data
            tls: {
                rejectUnauthorized: true,
                minVersion: 'TLSv1.2'
            }
        };
        
        // Use custom SMTP settings if configured
        if (process.env.SMTP_HOST) {
            transportConfig.host = process.env.SMTP_HOST;
            transportConfig.port = process.env.SMTP_PORT || 587;
            delete transportConfig.service;
        }
        
        const transporter = nodemailer.createTransporter(transportConfig);
        
        // Verify transporter configuration
        transporter.verify((error, success) => {
            if (error) {
                console.error('❌ Email transporter configuration failed:', error);
            } else {
                console.log('✅ Healthcare email service ready');
            }
        });
        
        return transporter;
        
    } catch (error) {
        console.error('❌ Failed to create email transporter:', error);
        throw new Error(`Email service initialization failed: ${error.message}`);
    }
};

/**
 * Log email operations for HIPAA compliance
 * 
 * @param {Object} emailData - Email operation data
 */
const logEmailOperation = (emailData) => {
    if (!EMAIL_CONFIG.AUDIT_ENABLED) return;
    
    const logEntry = {
        timestamp: new Date().toISOString(),
        emailId: emailData.emailId,
        category: emailData.category,
        recipientType: emailData.recipientType,
        status: emailData.status,
        templateUsed: emailData.template,
        sentBy: emailData.sentBy || 'system'
    };
    
    console.log('📧 HEALTHCARE EMAIL AUDIT:', logEntry);
};

/**
 * Generate appointment confirmation email template
 * 
 * @param {Object} appointmentData - Appointment details
 * @returns {string} - HTML email template
 */
const generateAppointmentEmailTemplate = (appointmentData) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Appointment Confirmation</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2c5aa0; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background: #f9f9f9; }
            .appointment-details { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
            .highlight { background: #e8f4f8; padding: 15px; border-left: 4px solid #2c5aa0; }
            .button { display: inline-block; background: #2c5aa0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏥 Appointment Confirmation</h1>
                <p>Healthcare Consultation System</p>
            </div>
            
            <div class="content">
                <h2>Hello ${appointmentData.patientName},</h2>
                <p>Your appointment has been successfully scheduled. Please find the details below:</p>
                
                <div class="appointment-details">
                    <h3>📅 Appointment Details</h3>
                    <p><strong>Date:</strong> ${appointmentData.appointmentDate}</p>
                    <p><strong>Time:</strong> ${appointmentData.appointmentTime}</p>
                    <p><strong>Doctor:</strong> Dr. ${appointmentData.doctorName}</p>
                    <p><strong>Department:</strong> ${appointmentData.department}</p>
                    <p><strong>Type:</strong> ${appointmentData.appointmentType}</p>
                    <p><strong>Location:</strong> ${appointmentData.location}</p>
                    <p><strong>Appointment ID:</strong> ${appointmentData.appointmentId}</p>
                </div>
                
                <div class="highlight">
                    <h4>📋 Important Reminders:</h4>
                    <ul>
                        <li>Please arrive 15 minutes before your appointment time</li>
                        <li>Bring a valid ID and insurance card</li>
                        <li>Bring any relevant medical records or test results</li>
                        <li>If you need to reschedule, please contact us at least 24 hours in advance</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${appointmentData.rescheduleLink || '#'}" class="button">Reschedule Appointment</a>
                    <a href="${appointmentData.cancelLink || '#'}" class="button" style="background: #dc3545;">Cancel Appointment</a>
                </div>
                
                <p>If you have any questions or concerns, please don't hesitate to contact us at:</p>
                <p>📞 Phone: ${process.env.HEALTHCARE_PHONE || '1-800-HEALTHCARE'}</p>
                <p>✉️ Email: ${process.env.HEALTHCARE_EMAIL || 'support@healthcare-system.com'}</p>
            </div>
            
            <div class="footer">
                <p>Healthcare Consultation System</p>
                <p>This email contains confidential medical information. If you received this in error, please delete it immediately.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

/**
 * Generate prescription notification email template
 * 
 * @param {Object} prescriptionData - Prescription details
 * @returns {string} - HTML email template
 */
const generatePrescriptionEmailTemplate = (prescriptionData) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>New Prescription Available</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background: #f9f9f9; }
            .prescription-details { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .medication { background: #e8f5e8; padding: 10px; margin: 10px 0; border-radius: 5px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>💊 New Prescription Available</h1>
                <p>Healthcare Consultation System</p>
            </div>
            
            <div class="content">
                <h2>Hello ${prescriptionData.patientName},</h2>
                <p>Dr. ${prescriptionData.doctorName} has issued a new prescription for you.</p>
                
                <div class="prescription-details">
                    <h3>📋 Prescription Details</h3>
                    <p><strong>Date Prescribed:</strong> ${prescriptionData.prescriptionDate}</p>
                    <p><strong>Prescription ID:</strong> ${prescriptionData.prescriptionId}</p>
                    <p><strong>Doctor:</strong> Dr. ${prescriptionData.doctorName}</p>
                    
                    <h4>Medications:</h4>
                    ${prescriptionData.medications.map(med => `
                        <div class="medication">
                            <strong>${med.name}</strong><br>
                            <strong>Dosage:</strong> ${med.dosage}<br>
                            <strong>Instructions:</strong> ${med.instructions}<br>
                            <strong>Quantity:</strong> ${med.quantity}<br>
                            <strong>Refills:</strong> ${med.refills}
                        </div>
                    `).join('')}
                </div>
                
                <div class="warning">
                    <h4>⚠️ Important Medication Information:</h4>
                    <ul>
                        <li>Take medications exactly as prescribed</li>
                        <li>Complete the full course of treatment, even if you feel better</li>
                        <li>Do not share medications with others</li>
                        <li>Contact your doctor if you experience any adverse effects</li>
                        <li>Keep medications in their original containers</li>
                    </ul>
                </div>
                
                <p><strong>Pharmacy Information:</strong></p>
                <p>You can fill this prescription at any licensed pharmacy. Present this email or your prescription ID: <strong>${prescriptionData.prescriptionId}</strong></p>
                
                <p>If you have any questions about your prescription, please contact:</p>
                <p>📞 Dr. ${prescriptionData.doctorName}: ${prescriptionData.doctorPhone || 'Contact through main number'}</p>
                <p>📞 Main Office: ${process.env.HEALTHCARE_PHONE || '1-800-HEALTHCARE'}</p>
            </div>
            
            <div class="footer">
                <p>Healthcare Consultation System</p>
                <p>This email contains confidential medical information.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

/**
 * Send appointment confirmation email
 * 
 * @param {string} patientEmail - Patient's email address
 * @param {Object} appointmentData - Appointment details
 * @param {Object} options - Additional options
 * @returns {Object} - Email send result
 */
export const sendAppointmentConfirmation = async (patientEmail, appointmentData, options = {}) => {
    try {
        const transporter = createEmailTransporter();
        const emailId = `APPT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const mailOptions = {
            from: `${EMAIL_CONFIG.FROM_NAME} <${EMAIL_CONFIG.FROM_EMAIL}>`,
            to: patientEmail,
            subject: `Appointment Confirmation - ${appointmentData.appointmentDate}`,
            html: generateAppointmentEmailTemplate(appointmentData),
            priority: 'normal',
            
            // Healthcare-specific headers
            headers: {
                'X-Healthcare-Category': EMAIL_CONFIG.CATEGORIES.APPOINTMENT,
                'X-Email-ID': emailId,
                'X-Patient-ID': appointmentData.patientId || 'unknown'
            }
        };
        
        const result = await transporter.sendMail(mailOptions);
        
        // Log email operation for compliance
        logEmailOperation({
            emailId,
            category: EMAIL_CONFIG.CATEGORIES.APPOINTMENT,
            recipientType: 'patient',
            status: 'sent',
            template: 'appointment-confirmation',
            sentBy: options.sentBy
        });
        
        console.log('✅ Appointment confirmation email sent:', {
            emailId,
            patientEmail: patientEmail.replace(/(.{3}).*(@.*)/, '$1***$2'),
            appointmentId: appointmentData.appointmentId,
            messageId: result.messageId
        });
        
        return {
            success: true,
            emailId,
            messageId: result.messageId,
            category: EMAIL_CONFIG.CATEGORIES.APPOINTMENT
        };
        
    } catch (error) {
        console.error('❌ Failed to send appointment confirmation:', error);
        throw new Error(`Appointment confirmation email failed: ${error.message}`);
    }
};

/**
 * Send prescription notification email
 * 
 * @param {string} patientEmail - Patient's email address
 * @param {Object} prescriptionData - Prescription details
 * @param {Object} options - Additional options
 * @returns {Object} - Email send result
 */
export const sendPrescriptionNotification = async (patientEmail, prescriptionData, options = {}) => {
    try {
        const transporter = createEmailTransporter();
        const emailId = `PRESC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const mailOptions = {
            from: `${EMAIL_CONFIG.FROM_NAME} <${EMAIL_CONFIG.FROM_EMAIL}>`,
            to: patientEmail,
            subject: `New Prescription from Dr. ${prescriptionData.doctorName}`,
            html: generatePrescriptionEmailTemplate(prescriptionData),
            priority: 'high', // Prescriptions are high priority
            
            headers: {
                'X-Healthcare-Category': EMAIL_CONFIG.CATEGORIES.PRESCRIPTION,
                'X-Email-ID': emailId,
                'X-Patient-ID': prescriptionData.patientId || 'unknown',
                'X-Prescription-ID': prescriptionData.prescriptionId
            }
        };
        
        const result = await transporter.sendMail(mailOptions);
        
        logEmailOperation({
            emailId,
            category: EMAIL_CONFIG.CATEGORIES.PRESCRIPTION,
            recipientType: 'patient',
            status: 'sent',
            template: 'prescription-notification',
            sentBy: options.sentBy
        });
        
        console.log('✅ Prescription notification sent:', {
            emailId,
            patientEmail: patientEmail.replace(/(.{3}).*(@.*)/, '$1***$2'),
            prescriptionId: prescriptionData.prescriptionId,
            doctorName: prescriptionData.doctorName,
            messageId: result.messageId
        });
        
        return {
            success: true,
            emailId,
            messageId: result.messageId,
            category: EMAIL_CONFIG.CATEGORIES.PRESCRIPTION
        };
        
    } catch (error) {
        console.error('❌ Failed to send prescription notification:', error);
        throw new Error(`Prescription notification email failed: ${error.message}`);
    }
};

/**
 * Send appointment reminder email
 * 
 * @param {string} patientEmail - Patient's email address
 * @param {Object} appointmentData - Appointment details
 * @param {Object} options - Additional options
 * @returns {Object} - Email send result
 */
export const sendAppointmentReminder = async (patientEmail, appointmentData, options = {}) => {
    try {
        const transporter = createEmailTransporter();
        const emailId = `REMIND-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const reminderTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Appointment Reminder</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #ffc107; color: #333; padding: 20px; text-align: center; }
                .content { padding: 30px 20px; background: #f9f9f9; }
                .reminder-box { background: #fff3cd; border: 2px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 5px; text-align: center; }
                .appointment-info { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⏰ Appointment Reminder</h1>
                    <p>Healthcare Consultation System</p>
                </div>
                
                <div class="content">
                    <h2>Hello ${appointmentData.patientName},</h2>
                    
                    <div class="reminder-box">
                        <h3>🚨 Don't Forget Your Upcoming Appointment!</h3>
                        <p><strong>Tomorrow at ${appointmentData.appointmentTime}</strong></p>
                    </div>
                    
                    <div class="appointment-info">
                        <h3>📅 Appointment Details</h3>
                        <p><strong>Date:</strong> ${appointmentData.appointmentDate}</p>
                        <p><strong>Time:</strong> ${appointmentData.appointmentTime}</p>
                        <p><strong>Doctor:</strong> Dr. ${appointmentData.doctorName}</p>
                        <p><strong>Location:</strong> ${appointmentData.location}</p>
                        <p><strong>Appointment ID:</strong> ${appointmentData.appointmentId}</p>
                    </div>
                    
                    <div style="background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h4>📋 Please Remember:</h4>
                        <ul>
                            <li>Arrive 15 minutes early</li>
                            <li>Bring your ID and insurance card</li>
                            <li>Bring any medications you're currently taking</li>
                        </ul>
                    </div>
                    
                    <p>Need to reschedule? Contact us at ${process.env.HEALTHCARE_PHONE || '1-800-HEALTHCARE'}</p>
                </div>
            </div>
        </body>
        </html>
        `;
        
        const mailOptions = {
            from: `${EMAIL_CONFIG.FROM_NAME} <${EMAIL_CONFIG.FROM_EMAIL}>`,
            to: patientEmail,
            subject: `Reminder: Appointment Tomorrow with Dr. ${appointmentData.doctorName}`,
            html: reminderTemplate,
            priority: 'high',
            
            headers: {
                'X-Healthcare-Category': EMAIL_CONFIG.CATEGORIES.APPOINTMENT,
                'X-Email-ID': emailId,
                'X-Email-Type': 'reminder'
            }
        };
        
        const result = await transporter.sendMail(mailOptions);
        
        logEmailOperation({
            emailId,
            category: EMAIL_CONFIG.CATEGORIES.APPOINTMENT,
            recipientType: 'patient',
            status: 'sent',
            template: 'appointment-reminder',
            sentBy: options.sentBy || 'system-scheduler'
        });
        
        return {
            success: true,
            emailId,
            messageId: result.messageId,
            category: EMAIL_CONFIG.CATEGORIES.APPOINTMENT
        };
        
    } catch (error) {
        console.error('❌ Failed to send appointment reminder:', error);
        throw new Error(`Appointment reminder email failed: ${error.message}`);
    }
};

/**
 * Send medical report email
 * 
 * @param {string} patientEmail - Patient's email address
 * @param {Object} reportData - Medical report details
 * @param {Object} options - Additional options
 * @returns {Object} - Email send result
 */
export const sendMedicalReport = async (patientEmail, reportData, options = {}) => {
    try {
        const transporter = createEmailTransporter();
        const emailId = `REPORT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const reportTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Medical Report Available</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #17a2b8; color: white; padding: 20px; text-align: center; }
                .content { padding: 30px 20px; background: #f9f9f9; }
                .report-details { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
                .security-notice { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
                .button { display: inline-block; background: #17a2b8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📊 Medical Report Available</h1>
                    <p>Healthcare Consultation System</p>
                </div>
                
                <div class="content">
                    <h2>Hello ${reportData.patientName},</h2>
                    <p>Your medical report is now available for review.</p>
                    
                    <div class="report-details">
                        <h3>📋 Report Details</h3>
                        <p><strong>Report Type:</strong> ${reportData.reportType}</p>
                        <p><strong>Date:</strong> ${reportData.reportDate}</p>
                        <p><strong>Doctor:</strong> Dr. ${reportData.doctorName}</p>
                        <p><strong>Report ID:</strong> ${reportData.reportId}</p>
                        ${reportData.summary ? `<p><strong>Summary:</strong> ${reportData.summary}</p>` : ''}
                    </div>
                    
                    <div class="security-notice">
                        <h4>🔒 Security Notice</h4>
                        <p>This report contains confidential medical information. Please access it through our secure portal using your patient login credentials.</p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${reportData.secureLink || '#'}" class="button">View Secure Report</a>
                    </div>
                    
                    <p>If you have questions about this report, please contact your healthcare provider.</p>
                </div>
            </div>
        </body>
        </html>
        `;
        
        const mailOptions = {
            from: `${EMAIL_CONFIG.FROM_NAME} <${EMAIL_CONFIG.FROM_EMAIL}>`,
            to: patientEmail,
            subject: `Medical Report Available - ${reportData.reportType}`,
            html: reportTemplate,
            priority: 'normal',
            
            headers: {
                'X-Healthcare-Category': EMAIL_CONFIG.CATEGORIES.MEDICAL_REPORT,
                'X-Email-ID': emailId,
                'X-Report-ID': reportData.reportId
            }
        };
        
        const result = await transporter.sendMail(mailOptions);
        
        logEmailOperation({
            emailId,
            category: EMAIL_CONFIG.CATEGORIES.MEDICAL_REPORT,
            recipientType: 'patient',
            status: 'sent',
            template: 'medical-report',
            sentBy: options.sentBy
        });
        
        return {
            success: true,
            emailId,
            messageId: result.messageId,
            category: EMAIL_CONFIG.CATEGORIES.MEDICAL_REPORT
        };
        
    } catch (error) {
        console.error('❌ Failed to send medical report:', error);
        throw new Error(`Medical report email failed: ${error.message}`);
    }
};

/**
 * Send email verification for new users
 * 
 * @param {string} userEmail - User's email address
 * @param {Object} verificationData - Verification details
 * @returns {Object} - Email send result
 */
export const sendEmailVerification = async (userEmail, verificationData) => {
    try {
        const transporter = createEmailTransporter();
        const emailId = `VERIFY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const verificationTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Verify Your Email</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #28a745; color: white; padding: 20px; text-align: center; }
                .content { padding: 30px 20px; background: #f9f9f9; }
                .verification-box { background: white; padding: 30px; margin: 20px 0; border-radius: 5px; text-align: center; }
                .button { display: inline-block; background: #28a745; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-size: 16px; }
                .code { font-size: 24px; font-weight: bold; color: #28a745; background: #f8f9fa; padding: 15px; border-radius: 5px; letter-spacing: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✉️ Verify Your Email</h1>
                    <p>Healthcare Consultation System</p>
                </div>
                
                <div class="content">
                    <h2>Welcome to Healthcare System!</h2>
                    <p>Thank you for creating your account. Please verify your email address to complete your registration.</p>
                    
                    <div class="verification-box">
                        <h3>Click the button below to verify your email:</h3>
                        <a href="${verificationData.verificationLink}" class="button">Verify Email Address</a>
                        
                        <p style="margin-top: 30px;">Or use this verification code:</p>
                        <div class="code">${verificationData.verificationCode}</div>
                    </div>
                    
                    <p><strong>This verification link will expire in 24 hours.</strong></p>
                    <p>If you didn't create this account, please ignore this email.</p>
                </div>
            </div>
        </body>
        </html>
        `;
        
        const mailOptions = {
            from: `${EMAIL_CONFIG.FROM_NAME} <${EMAIL_CONFIG.FROM_EMAIL}>`,
            to: userEmail,
            subject: 'Verify Your Healthcare System Account',
            html: verificationTemplate,
            priority: 'high',
            
            headers: {
                'X-Healthcare-Category': EMAIL_CONFIG.CATEGORIES.VERIFICATION,
                'X-Email-ID': emailId
            }
        };
        
        const result = await transporter.sendMail(mailOptions);
        
        logEmailOperation({
            emailId,
            category: EMAIL_CONFIG.CATEGORIES.VERIFICATION,
            recipientType: 'user',
            status: 'sent',
            template: 'email-verification',
            sentBy: 'system'
        });
        
        return {
            success: true,
            emailId,
            messageId: result.messageId,
            category: EMAIL_CONFIG.CATEGORIES.VERIFICATION
        };
        
    } catch (error) {
        console.error('❌ Failed to send email verification:', error);
        throw new Error(`Email verification failed: ${error.message}`);
    }
};

/**
 * Send password reset email
 * 
 * @param {string} userEmail - User's email address
 * @param {Object} resetData - Password reset details
 * @returns {Object} - Email send result
 */
export const sendPasswordReset = async (userEmail, resetData) => {
    try {
        const transporter = createEmailTransporter();
        const emailId = `RESET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const resetTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Password Reset Request</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
                .content { padding: 30px 20px; background: #f9f9f9; }
                .reset-box { background: white; padding: 30px; margin: 20px 0; border-radius: 5px; text-align: center; }
                .button { display: inline-block; background: #dc3545; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; }
                .security-notice { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔒 Password Reset Request</h1>
                    <p>Healthcare Consultation System</p>
                </div>
                
                <div class="content">
                    <h2>Password Reset Request</h2>
                    <p>We received a request to reset the password for your healthcare account.</p>
                    
                    <div class="reset-box">
                        <h3>Click the button below to reset your password:</h3>
                        <a href="${resetData.resetLink}" class="button">Reset Password</a>
                    </div>
                    
                    <div class="security-notice">
                        <h4>🔐 Security Information</h4>
                        <ul>
                            <li>This link will expire in 30 minutes</li>
                            <li>If you didn't request this reset, please ignore this email</li>
                            <li>Your current password remains unchanged until you create a new one</li>
                        </ul>
                    </div>
                    
                    <p>For security reasons, if you continue to have trouble accessing your account, please contact our support team.</p>
                </div>
            </div>
        </body>
        </html>
        `;
        
        const mailOptions = {
            from: `${EMAIL_CONFIG.FROM_NAME} <${EMAIL_CONFIG.FROM_EMAIL}>`,
            to: userEmail,
            subject: 'Password Reset Request - Healthcare System',
            html: resetTemplate,
            priority: 'high',
            
            headers: {
                'X-Healthcare-Category': EMAIL_CONFIG.CATEGORIES.NOTIFICATION,
                'X-Email-ID': emailId,
                'X-Email-Type': 'password-reset'
            }
        };
        
        const result = await transporter.sendMail(mailOptions);
        
        logEmailOperation({
            emailId,
            category: EMAIL_CONFIG.CATEGORIES.NOTIFICATION,
            recipientType: 'user',
            status: 'sent',
            template: 'password-reset',
            sentBy: 'system'
        });
        
        return {
            success: true,
            emailId,
            messageId: result.messageId,
            category: EMAIL_CONFIG.CATEGORIES.NOTIFICATION
        };
        
    } catch (error) {
        console.error('❌ Failed to send password reset:', error);
        throw new Error(`Password reset email failed: ${error.message}`);
    }
};

/**
 * Send bulk emails (for announcements, etc.)
 * 
 * @param {Array} recipients - Array of recipient email addresses
 * @param {Object} emailData - Email content and details
 * @param {Object} options - Additional options
 * @returns {Array} - Array of send results
 */
export const sendBulkEmail = async (recipients, emailData, options = {}) => {
    const results = [];
    const batchSize = options.batchSize || 50; // Limit batch size for rate limiting
    
    for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        const batchPromises = batch.map(async (recipient) => {
            try {
                // Use appropriate email function based on type
                let result;
                switch (emailData.type) {
                    case 'appointment-reminder':
                        result = await sendAppointmentReminder(recipient, emailData.data, options);
                        break;
                    default:
                        throw new Error(`Unsupported bulk email type: ${emailData.type}`);
                }
                return { recipient, success: true, result };
            } catch (error) {
                return { recipient, success: false, error: error.message };
            }
        });
        
        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults.map(r => r.value || { success: false, error: 'Unknown error' }));
        
        // Rate limiting delay between batches
        if (i + batchSize < recipients.length) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        }
    }
    
    return results;
};

/**
 * Test email configuration
 * 
 * @returns {Object} - Test result
 */
export const testEmailConfiguration = async () => {
    try {
        const transporter = createEmailTransporter();
        const testResult = await transporter.verify();
        
        console.log('✅ Email configuration test passed');
        return { success: true, message: 'Email service is properly configured' };
        
    } catch (error) {
        console.error('❌ Email configuration test failed:', error);
        return { success: false, error: error.message };
    }
};

// Export email configuration for use in other modules
export { EMAIL_CONFIG };
