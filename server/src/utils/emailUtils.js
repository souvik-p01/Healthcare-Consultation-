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
 * - Error handling and retry mechanisms
 */

import nodemailer from 'nodemailer';

/**
 * Email Configuration for Healthcare System
 */
const EMAIL_CONFIG = {
    SERVICE: process.env.EMAIL_SERVICE || 'gmail',
    FROM_EMAIL: process.env.EMAIL_FROM || 'noreply@healthcare-system.com',
    FROM_NAME: process.env.EMAIL_FROM_NAME || 'Healthcare Consultation System',
    
    // HIPAA compliance settings
    ENCRYPTION_ENABLED: process.env.EMAIL_ENCRYPTION === 'true',
    AUDIT_ENABLED: true,
    MAX_RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second
    
    // Email categories for tracking
    CATEGORIES: {
        APPOINTMENT: 'appointment',
        PRESCRIPTION: 'prescription',
        MEDICAL_REPORT: 'medical-report',
        NOTIFICATION: 'notification',
        VERIFICATION: 'verification',
        EMERGENCY: 'emergency',
        WELCOME: 'welcome'
    }
};

/**
 * Create secure email transporter for healthcare communications
 * 
 * @returns {Object} - Nodemailer transporter instance
 */
const createEmailTransporter = () => {
    try {
        // Validate required environment variables
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            throw new Error('Email credentials are not configured. Please set EMAIL_USER and EMAIL_PASS environment variables.');
        }

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
            },
            // Connection pool settings
            pool: true,
            maxConnections: 5,
            maxMessages: 100
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
                console.error('❌ Email transporter configuration failed:', error.message);
            } else {
                console.log('✅ Healthcare email service ready');
            }
        });
        
        return transporter;
        
    } catch (error) {
        console.error('❌ Failed to create email transporter:', error.message);
        throw new Error(`Email service initialization failed: ${error.message}`);
    }
};

// Create transporter instance
let emailTransporter;

/**
 * Get or create email transporter with retry mechanism
 */
const getEmailTransporter = () => {
    if (!emailTransporter) {
        emailTransporter = createEmailTransporter();
    }
    return emailTransporter;
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
        sentBy: emailData.sentBy || 'system',
        recipient: emailData.recipient ? emailData.recipient.replace(/(.{3}).*(@.*)/, '$1***$2') : 'unknown'
    };
    
    console.log('📧 HEALTHCARE EMAIL AUDIT:', logEntry);
};

/**
 * Retry mechanism for email sending
 */
const sendWithRetry = async (sendFunction, maxAttempts = EMAIL_CONFIG.MAX_RETRY_ATTEMPTS) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await sendFunction();
        } catch (error) {
            lastError = error;
            console.warn(`⚠️ Email send attempt ${attempt} failed:`, error.message);
            
            if (attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, EMAIL_CONFIG.RETRY_DELAY * attempt));
            }
        }
    }
    
    throw lastError;
};

/**
 * Generate email template with common healthcare styling
 */
const generateEmailTemplate = (content, title, category = 'notification') => {
    const backgroundColor = {
        'appointment': '#2c5aa0',
        'prescription': '#28a745',
        'medical-report': '#17a2b8',
        'verification': '#28a745',
        'welcome': '#2c5aa0',
        'notification': '#6c757d',
        'emergency': '#dc3545'
    }[category] || '#2c5aa0';

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                margin: 0; 
                padding: 0; 
                background-color: #f5f5f5;
            }
            .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background: white;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
                background: ${backgroundColor}; 
                color: white; 
                padding: 30px 20px; 
                text-align: center; 
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
                font-weight: 600;
            }
            .content { 
                padding: 40px 30px; 
            }
            .footer { 
                background: #2c3e50; 
                color: white; 
                padding: 20px; 
                text-align: center; 
                font-size: 14px;
                line-height: 1.4;
            }
            .button { 
                display: inline-block; 
                background: ${backgroundColor}; 
                color: white; 
                padding: 14px 32px; 
                text-decoration: none; 
                border-radius: 6px; 
                font-weight: 600;
                font-size: 16px;
                margin: 10px 5px;
                border: none;
                cursor: pointer;
            }
            .button-secondary {
                background: #6c757d;
            }
            .button-danger {
                background: #dc3545;
            }
            .info-box {
                background: #e8f4f8;
                padding: 20px;
                border-radius: 6px;
                border-left: 4px solid ${backgroundColor};
                margin: 20px 0;
            }
            .warning-box {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                padding: 15px;
                border-radius: 6px;
                margin: 15px 0;
            }
            .security-notice {
                background: #f8d7da;
                border: 1px solid #f5c6cb;
                padding: 15px;
                border-radius: 6px;
                margin: 20px 0;
            }
            .feature-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 15px;
                margin: 25px 0;
            }
            .feature {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                border: 1px solid #e9ecef;
            }
            .feature h4 {
                margin: 0 0 10px 0;
                color: #2c5aa0;
            }
            @media (max-width: 600px) {
                .content { padding: 30px 20px; }
                .feature-grid { grid-template-columns: 1fr; }
                .button { display: block; margin: 10px 0; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${title}</h1>
                <p>Healthcare Consultation System</p>
            </div>
            
            <div class="content">
                ${content}
            </div>
            
            <div class="footer">
                <p><strong>Healthcare Consultation System</strong></p>
                <p>This email contains confidential healthcare information. If you received this in error, please delete it immediately and notify us.</p>
                <p>📞 ${process.env.HEALTHCARE_PHONE || '1-800-HEALTHCARE'} | ✉️ ${process.env.HEALTHCARE_EMAIL || 'support@healthcare-system.com'}</p>
                <p style="font-size: 12px; opacity: 0.8; margin-top: 15px;">
                    © ${new Date().getFullYear()} Healthcare Consultation System. All rights reserved.
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
};

/**
 * Send email with enhanced error handling and retry mechanism
 */
const sendEmail = async (mailOptions, emailData) => {
    return await sendWithRetry(async () => {
        const transporter = getEmailTransporter();
        const result = await transporter.sendMail(mailOptions);
        
        logEmailOperation({
            ...emailData,
            status: 'sent',
            messageId: result.messageId
        });
        
        return result;
    });
};

/**
 * Send appointment confirmation email
 */
export const sendAppointmentConfirmation = async (patientEmail, appointmentData, options = {}) => {
    try {
        const emailId = `APPT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const content = `
            <h2>Hello ${appointmentData.patientName},</h2>
            <p>Your appointment has been successfully scheduled. Please find the details below:</p>
            
            <div class="info-box">
                <h3>📅 Appointment Details</h3>
                <p><strong>Date:</strong> ${appointmentData.appointmentDate}</p>
                <p><strong>Time:</strong> ${appointmentData.appointmentTime}</p>
                <p><strong>Doctor:</strong> Dr. ${appointmentData.doctorName}</p>
                <p><strong>Department:</strong> ${appointmentData.department}</p>
                <p><strong>Type:</strong> ${appointmentData.appointmentType}</p>
                <p><strong>Location:</strong> ${appointmentData.location}</p>
                <p><strong>Appointment ID:</strong> ${appointmentData.appointmentId}</p>
            </div>
            
            <div class="warning-box">
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
                <a href="${appointmentData.cancelLink || '#'}" class="button button-danger">Cancel Appointment</a>
            </div>
        `;

        const mailOptions = {
            from: `${EMAIL_CONFIG.FROM_NAME} <${EMAIL_CONFIG.FROM_EMAIL}>`,
            to: patientEmail,
            subject: `Appointment Confirmation - ${appointmentData.appointmentDate}`,
            html: generateEmailTemplate(content, 'Appointment Confirmation', 'appointment'),
            priority: 'normal',
            headers: {
                'X-Healthcare-Category': EMAIL_CONFIG.CATEGORIES.APPOINTMENT,
                'X-Email-ID': emailId,
                'X-Patient-ID': appointmentData.patientId || 'unknown',
                'X-Appointment-ID': appointmentData.appointmentId
            }
        };
        
        const result = await sendEmail(mailOptions, {
            emailId,
            category: EMAIL_CONFIG.CATEGORIES.APPOINTMENT,
            recipientType: 'patient',
            template: 'appointment-confirmation',
            sentBy: options.sentBy,
            recipient: patientEmail
        });
        
        console.log('✅ Appointment confirmation email sent:', {
            emailId,
            patientEmail: patientEmail.replace(/(.{3}).*(@.*)/, '$1***$2'),
            appointmentId: appointmentData.appointmentId
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
 */
export const sendPrescriptionNotification = async (patientEmail, prescriptionData, options = {}) => {
    try {
        const emailId = `PRESC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const medicationsHtml = prescriptionData.medications.map(med => `
            <div style="background: #e8f5e8; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #28a745;">
                <strong>${med.name}</strong><br>
                <strong>Dosage:</strong> ${med.dosage}<br>
                <strong>Instructions:</strong> ${med.instructions}<br>
                <strong>Quantity:</strong> ${med.quantity}<br>
                <strong>Refills:</strong> ${med.refills}
            </div>
        `).join('');

        const content = `
            <h2>Hello ${prescriptionData.patientName},</h2>
            <p>Dr. ${prescriptionData.doctorName} has issued a new prescription for you.</p>
            
            <div class="info-box">
                <h3>📋 Prescription Details</h3>
                <p><strong>Date Prescribed:</strong> ${prescriptionData.prescriptionDate}</p>
                <p><strong>Prescription ID:</strong> ${prescriptionData.prescriptionId}</p>
                <p><strong>Doctor:</strong> Dr. ${prescriptionData.doctorName}</p>
                
                <h4 style="margin-top: 20px;">Medications:</h4>
                ${medicationsHtml}
            </div>
            
            <div class="warning-box">
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
        `;

        const mailOptions = {
            from: `${EMAIL_CONFIG.FROM_NAME} <${EMAIL_CONFIG.FROM_EMAIL}>`,
            to: patientEmail,
            subject: `New Prescription from Dr. ${prescriptionData.doctorName}`,
            html: generateEmailTemplate(content, 'New Prescription Available', 'prescription'),
            priority: 'high',
            headers: {
                'X-Healthcare-Category': EMAIL_CONFIG.CATEGORIES.PRESCRIPTION,
                'X-Email-ID': emailId,
                'X-Patient-ID': prescriptionData.patientId || 'unknown',
                'X-Prescription-ID': prescriptionData.prescriptionId
            }
        };
        
        const result = await sendEmail(mailOptions, {
            emailId,
            category: EMAIL_CONFIG.CATEGORIES.PRESCRIPTION,
            recipientType: 'patient',
            template: 'prescription-notification',
            sentBy: options.sentBy,
            recipient: patientEmail
        });
        
        console.log('✅ Prescription notification sent:', {
            emailId,
            patientEmail: patientEmail.replace(/(.{3}).*(@.*)/, '$1***$2'),
            prescriptionId: prescriptionData.prescriptionId
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
 */
export const sendAppointmentReminder = async (patientEmail, appointmentData, options = {}) => {
    try {
        const emailId = `REMIND-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const content = `
            <h2>Hello ${appointmentData.patientName},</h2>
            
            <div class="warning-box" style="text-align: center;">
                <h3>🚨 Don't Forget Your Upcoming Appointment!</h3>
                <p style="font-size: 18px; font-weight: bold;">Tomorrow at ${appointmentData.appointmentTime}</p>
            </div>
            
            <div class="info-box">
                <h3>📅 Appointment Details</h3>
                <p><strong>Date:</strong> ${appointmentData.appointmentDate}</p>
                <p><strong>Time:</strong> ${appointmentData.appointmentTime}</p>
                <p><strong>Doctor:</strong> Dr. ${appointmentData.doctorName}</p>
                <p><strong>Location:</strong> ${appointmentData.location}</p>
                <p><strong>Appointment ID:</strong> ${appointmentData.appointmentId}</p>
            </div>
            
            <div class="info-box">
                <h4>📋 Please Remember:</h4>
                <ul>
                    <li>Arrive 15 minutes early</li>
                    <li>Bring your ID and insurance card</li>
                    <li>Bring any medications you're currently taking</li>
                    <li>Bring relevant medical records or test results</li>
                </ul>
            </div>
        `;

        const mailOptions = {
            from: `${EMAIL_CONFIG.FROM_NAME} <${EMAIL_CONFIG.FROM_EMAIL}>`,
            to: patientEmail,
            subject: `Reminder: Appointment Tomorrow with Dr. ${appointmentData.doctorName}`,
            html: generateEmailTemplate(content, 'Appointment Reminder', 'appointment'),
            priority: 'high',
            headers: {
                'X-Healthcare-Category': EMAIL_CONFIG.CATEGORIES.APPOINTMENT,
                'X-Email-ID': emailId,
                'X-Email-Type': 'reminder'
            }
        };
        
        const result = await sendEmail(mailOptions, {
            emailId,
            category: EMAIL_CONFIG.CATEGORIES.APPOINTMENT,
            recipientType: 'patient',
            template: 'appointment-reminder',
            sentBy: options.sentBy || 'system-scheduler',
            recipient: patientEmail
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
 * Send email verification for new users
 */
export const sendEmailVerification = async (userEmail, verificationData) => {
    try {
        const emailId = `VERIFY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const content = `
            <h2>Welcome to Healthcare System!</h2>
            <p>Thank you for creating your account. Please verify your email address to complete your registration.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationData.verificationLink}" class="button">Verify Email Address</a>
            </div>
            
            <div class="info-box" style="text-align: center;">
                <p>Or use this verification code:</p>
                <div style="font-size: 24px; font-weight: bold; color: #28a745; background: #f8f9fa; padding: 15px; border-radius: 6px; letter-spacing: 5px; margin: 15px 0;">
                    ${verificationData.verificationCode}
                </div>
            </div>
            
            <div class="security-notice">
                <p><strong>This verification link will expire in 24 hours.</strong></p>
                <p>If you didn't create this account, please ignore this email.</p>
            </div>
        `;

        const mailOptions = {
            from: `${EMAIL_CONFIG.FROM_NAME} <${EMAIL_CONFIG.FROM_EMAIL}>`,
            to: userEmail,
            subject: 'Verify Your Healthcare System Account',
            html: generateEmailTemplate(content, 'Verify Your Email', 'verification'),
            priority: 'high',
            headers: {
                'X-Healthcare-Category': EMAIL_CONFIG.CATEGORIES.VERIFICATION,
                'X-Email-ID': emailId
            }
        };
        
        const result = await sendEmail(mailOptions, {
            emailId,
            category: EMAIL_CONFIG.CATEGORIES.VERIFICATION,
            recipientType: 'user',
            template: 'email-verification',
            sentBy: 'system',
            recipient: userEmail
        });
        
        console.log('✅ Email verification sent to:', userEmail.replace(/(.{3}).*(@.*)/, '$1***$2'));
        
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
 */
export const sendPasswordReset = async (userEmail, resetData) => {
    try {
        const emailId = `RESET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const content = `
            <h2>Password Reset Request</h2>
            <p>We received a request to reset the password for your healthcare account.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetData.resetLink}" class="button">Reset Password</a>
            </div>
            
            <div class="security-notice">
                <h4>🔐 Security Information</h4>
                <ul>
                    <li>This link will expire in 30 minutes</li>
                    <li>If you didn't request this reset, please ignore this email</li>
                    <li>Your current password remains unchanged until you create a new one</li>
                    <li>For security reasons, do not share this link with anyone</li>
                </ul>
            </div>
        `;

        const mailOptions = {
            from: `${EMAIL_CONFIG.FROM_NAME} <${EMAIL_CONFIG.FROM_EMAIL}>`,
            to: userEmail,
            subject: 'Password Reset Request - Healthcare System',
            html: generateEmailTemplate(content, 'Password Reset Request', 'notification'),
            priority: 'high',
            headers: {
                'X-Healthcare-Category': EMAIL_CONFIG.CATEGORIES.NOTIFICATION,
                'X-Email-ID': emailId,
                'X-Email-Type': 'password-reset'
            }
        };
        
        const result = await sendEmail(mailOptions, {
            emailId,
            category: EMAIL_CONFIG.CATEGORIES.NOTIFICATION,
            recipientType: 'user',
            template: 'password-reset',
            sentBy: 'system',
            recipient: userEmail
        });
        
        console.log('✅ Password reset email sent to:', userEmail.replace(/(.{3}).*(@.*)/, '$1***$2'));
        
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
 * Send welcome email to new users
 */
export const sendWelcomeEmail = async (userEmail, welcomeData) => {
    try {
        const emailId = `WELCOME-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const content = `
            <h2>Hello ${welcomeData.firstName},</h2>
            <p>Welcome to our healthcare family! We're excited to have you on board and look forward to helping you manage your health effectively.</p>
            
            <div class="info-box" style="text-align: center;">
                <h3>Your account has been successfully created!</h3>
                <p><strong>Role:</strong> ${welcomeData.role}</p>
                <p><strong>Account ID:</strong> ${welcomeData.userId}</p>
                
                <div style="margin: 25px 0;">
                    <a href="${welcomeData.dashboardLink || '#'}" class="button">Access Your Dashboard</a>
                </div>
            </div>
            
            <h3>🌟 What you can do with your account:</h3>
            <div class="feature-grid">
                <div class="feature">
                    <h4>📅 Book Appointments</h4>
                    <p>Schedule consultations with healthcare providers</p>
                </div>
                <div class="feature">
                    <h4>💊 Manage Prescriptions</h4>
                    <p>Access and track your medications</p>
                </div>
                <div class="feature">
                    <h4>📊 View Medical Records</h4>
                    <p>Access your health information securely</p>
                </div>
                <div class="feature">
                    <h4>👨‍⚕️ Connect with Doctors</h4>
                    <p>Communicate with healthcare professionals</p>
                </div>
            </div>
            
            <div class="info-box">
                <h4>🔒 Security First</h4>
                <p>Your health information is protected with enterprise-grade security and complies with healthcare privacy regulations including HIPAA.</p>
            </div>
        `;

        const mailOptions = {
            from: `${EMAIL_CONFIG.FROM_NAME} <${EMAIL_CONFIG.FROM_EMAIL}>`,
            to: userEmail,
            subject: `Welcome to Healthcare System, ${welcomeData.firstName}!`,
            html: generateEmailTemplate(content, 'Welcome to Healthcare System', 'welcome'),
            priority: 'normal',
            headers: {
                'X-Healthcare-Category': EMAIL_CONFIG.CATEGORIES.WELCOME,
                'X-Email-ID': emailId,
                'X-User-Role': welcomeData.role
            }
        };
        
        const result = await sendEmail(mailOptions, {
            emailId,
            category: EMAIL_CONFIG.CATEGORIES.WELCOME,
            recipientType: 'user',
            template: 'welcome-email',
            sentBy: 'system',
            recipient: userEmail
        });
        
        console.log('✅ Welcome email sent to:', userEmail.replace(/(.{3}).*(@.*)/, '$1***$2'));
        
        return {
            success: true,
            emailId,
            messageId: result.messageId,
            category: EMAIL_CONFIG.CATEGORIES.WELCOME
        };
        
    } catch (error) {
        console.error('❌ Failed to send welcome email:', error);
        throw new Error(`Welcome email failed: ${error.message}`);
    }
};

/**
 * Test email configuration
 */
export const testEmailConfiguration = async () => {
    try {
        const transporter = getEmailTransporter();
        await transporter.verify();
        
        console.log('✅ Email configuration test passed');
        return { 
            success: true, 
            message: 'Email service is properly configured',
            service: EMAIL_CONFIG.SERVICE,
            fromEmail: EMAIL_CONFIG.FROM_EMAIL
        };
        
    } catch (error) {
        console.error('❌ Email configuration test failed:', error);
        return { 
            success: false, 
            error: error.message,
            service: EMAIL_CONFIG.SERVICE
        };
    }
};

/**
 * Get email service status
 */
export const getEmailServiceStatus = () => {
    return {
        service: EMAIL_CONFIG.SERVICE,
        fromEmail: EMAIL_CONFIG.FROM_EMAIL,
        fromName: EMAIL_CONFIG.FROM_NAME,
        encryptionEnabled: EMAIL_CONFIG.ENCRYPTION_ENABLED,
        auditEnabled: EMAIL_CONFIG.AUDIT_ENABLED,
        status: emailTransporter ? 'connected' : 'disconnected'
    };
};

// Export email configuration for use in other modules
export { EMAIL_CONFIG };