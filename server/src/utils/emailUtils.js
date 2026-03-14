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
 * - Payment confirmations
 * - Payment receipts
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
        WELCOME: 'welcome',
        INVOICE: 'invoice',
        PAYMENT: 'payment',
        RECEIPT: 'receipt' // Added receipt category
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
        'emergency': '#dc3545',
        'invoice': '#ffc107',
        'payment': '#28a745',
        'receipt': '#17a2b8' // Added receipt color
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
            .success-box {
                background: #d4edda;
                padding: 20px;
                border-radius: 6px;
                border-left: 4px solid #28a745;
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
            .invoice-table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }
            .invoice-table th {
                background: #f8f9fa;
                padding: 12px;
                text-align: left;
                border-bottom: 2px solid #dee2e6;
            }
            .invoice-table td {
                padding: 12px;
                border-bottom: 1px solid #dee2e6;
            }
            .invoice-table tfoot td {
                font-weight: bold;
                background: #f8f9fa;
            }
            .invoice-total {
                font-size: 20px;
                color: ${backgroundColor};
                text-align: right;
                margin: 20px 0;
            }
            .receipt-details {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border: 1px dashed #17a2b8;
            }
            .receipt-header {
                text-align: center;
                margin-bottom: 20px;
                padding-bottom: 20px;
                border-bottom: 2px solid #17a2b8;
            }
            .receipt-header h2 {
                color: #17a2b8;
                margin: 10px 0;
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
 * Send payment confirmation email
 */
export const sendPaymentConfirmation = async (patientEmail, paymentData, options = {}) => {
    try {
        const emailId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const content = `
            <h2>Hello ${paymentData.patientName},</h2>
            
            <div class="success-box" style="text-align: center;">
                <h3>✅ Payment Successful!</h3>
                <p style="font-size: 18px;">Thank you for your payment</p>
            </div>
            
            <div class="info-box">
                <h3>💰 Payment Details</h3>
                <p><strong>Transaction ID:</strong> ${paymentData.transactionId}</p>
                <p><strong>Payment Date:</strong> ${paymentData.paymentDate}</p>
                <p><strong>Payment Method:</strong> ${paymentData.paymentMethod}</p>
                <p><strong>Amount Paid:</strong> $${paymentData.amount.toFixed(2)}</p>
                <p><strong>Invoice Number:</strong> ${paymentData.invoiceNumber}</p>
                <p><strong>Payment Status:</strong> <span style="color: #28a745;">${paymentData.paymentStatus}</span></p>
            </div>
            
            ${paymentData.invoiceDetails ? `
            <h3>Invoice Summary:</h3>
            <table class="invoice-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Consultation Fee</td>
                        <td>$${paymentData.invoiceDetails.consultationFee?.toFixed(2) || '0.00'}</td>
                    </tr>
                    ${paymentData.invoiceDetails.additionalCharges ? Object.entries(paymentData.invoiceDetails.additionalCharges).map(([key, value]) => `
                    <tr>
                        <td>${key}</td>
                        <td>$${value.toFixed(2)}</td>
                    </tr>
                    `).join('') : ''}
                </tbody>
                <tfoot>
                    <tr>
                        <td><strong>Total Paid</strong></td>
                        <td><strong>$${paymentData.amount.toFixed(2)}</strong></td>
                    </tr>
                </tfoot>
            </table>
            ` : ''}
            
            <div class="info-box">
                <h4>📋 What's Next?</h4>
                <ul>
                    <li>A receipt has been sent to your email</li>
                    <li>You can view your payment history in your patient portal</li>
                    <li>For any questions about this payment, please contact our billing department</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${paymentData.receiptLink || '#'}" class="button">View Receipt</a>
                <a href="${paymentData.portalLink || '#'}" class="button button-secondary">Go to Patient Portal</a>
            </div>
        `;

        const mailOptions = {
            from: `${EMAIL_CONFIG.FROM_NAME} <${EMAIL_CONFIG.FROM_EMAIL}>`,
            to: patientEmail,
            subject: `Payment Confirmation - Transaction ${paymentData.transactionId}`,
            html: generateEmailTemplate(content, 'Payment Confirmation', 'payment'),
            priority: 'high',
            attachments: paymentData.attachments || [],
            headers: {
                'X-Healthcare-Category': EMAIL_CONFIG.CATEGORIES.PAYMENT,
                'X-Email-ID': emailId,
                'X-Transaction-ID': paymentData.transactionId,
                'X-Invoice-Number': paymentData.invoiceNumber,
                'X-Patient-ID': paymentData.patientId || 'unknown'
            }
        };
        
        const result = await sendEmail(mailOptions, {
            emailId,
            category: EMAIL_CONFIG.CATEGORIES.PAYMENT,
            recipientType: 'patient',
            template: 'payment-confirmation',
            sentBy: options.sentBy || 'billing-system',
            recipient: patientEmail
        });
        
        console.log('✅ Payment confirmation email sent:', {
            emailId,
            patientEmail: patientEmail.replace(/(.{3}).*(@.*)/, '$1***$2'),
            transactionId: paymentData.transactionId,
            amount: paymentData.amount
        });
        
        return {
            success: true,
            emailId,
            messageId: result.messageId,
            category: EMAIL_CONFIG.CATEGORIES.PAYMENT,
            transactionId: paymentData.transactionId
        };
        
    } catch (error) {
        console.error('❌ Failed to send payment confirmation:', error);
        throw new Error(`Payment confirmation email failed: ${error.message}`);
    }
};

/**
 * Send payment receipt email
 */
export const sendPaymentReceipt = async (patientEmail, receiptData, options = {}) => {
    try {
        const emailId = `RECEIPT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const content = `
            <div class="receipt-header">
                <h2>🧾 Payment Receipt</h2>
                <p>Thank you for your payment</p>
            </div>
            
            <div class="receipt-details">
                <h3 style="text-align: center; color: #17a2b8; margin-bottom: 20px;">RECEIPT</h3>
                
                <p><strong>Receipt Number:</strong> ${receiptData.receiptNumber}</p>
                <p><strong>Date:</strong> ${receiptData.receiptDate}</p>
                <p><strong>Transaction ID:</strong> ${receiptData.transactionId}</p>
                <p><strong>Payment Method:</strong> ${receiptData.paymentMethod}</p>
                
                <hr style="margin: 20px 0;">
                
                <h4>Patient Information:</h4>
                <p><strong>Name:</strong> ${receiptData.patientName}</p>
                <p><strong>Email:</strong> ${receiptData.patientEmail}</p>
                <p><strong>Patient ID:</strong> ${receiptData.patientId}</p>
                
                <hr style="margin: 20px 0;">
                
                <h4>Payment Details:</h4>
                <table style="width: 100%;">
                    <tr>
                        <td><strong>Description:</strong></td>
                        <td>${receiptData.description || 'Healthcare Services'}</td>
                    </tr>
                    <tr>
                        <td><strong>Amount:</strong></td>
                        <td>$${receiptData.amount.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td><strong>Tax:</strong></td>
                        <td>$${receiptData.tax?.toFixed(2) || '0.00'}</td>
                    </tr>
                    <tr>
                        <td><strong>Total:</strong></td>
                        <td><strong>$${receiptData.total?.toFixed(2) || receiptData.amount.toFixed(2)}</strong></td>
                    </tr>
                </table>
                
                <hr style="margin: 20px 0;">
                
                <p><strong>Invoice Reference:</strong> ${receiptData.invoiceNumber || 'N/A'}</p>
                <p><strong>Appointment Reference:</strong> ${receiptData.appointmentId || 'N/A'}</p>
                
                <div style="background: #e8f4f8; padding: 15px; border-radius: 6px; margin-top: 20px;">
                    <p style="margin: 0; text-align: center;">This is an official receipt for your healthcare payment. Please retain this for your records.</p>
                </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${receiptData.downloadLink || '#'}" class="button">Download PDF Receipt</a>
                <a href="${receiptData.printLink || '#'}" class="button button-secondary">Print Receipt</a>
            </div>
            
            <div class="security-notice">
                <p><strong>🔒 This is an official receipt for tax and insurance purposes.</strong></p>
                <p>For any discrepancies, please contact our billing department within 30 days.</p>
            </div>
        `;

        const mailOptions = {
            from: `${EMAIL_CONFIG.FROM_NAME} <${EMAIL_CONFIG.FROM_EMAIL}>`,
            to: patientEmail,
            subject: `Payment Receipt - ${receiptData.receiptNumber}`,
            html: generateEmailTemplate(content, 'Payment Receipt', 'receipt'),
            priority: 'high',
            attachments: receiptData.attachments || [],
            headers: {
                'X-Healthcare-Category': EMAIL_CONFIG.CATEGORIES.RECEIPT,
                'X-Email-ID': emailId,
                'X-Receipt-Number': receiptData.receiptNumber,
                'X-Transaction-ID': receiptData.transactionId,
                'X-Patient-ID': receiptData.patientId || 'unknown'
            }
        };
        
        const result = await sendEmail(mailOptions, {
            emailId,
            category: EMAIL_CONFIG.CATEGORIES.RECEIPT,
            recipientType: 'patient',
            template: 'payment-receipt',
            sentBy: options.sentBy || 'billing-system',
            recipient: patientEmail
        });
        
        console.log('✅ Payment receipt email sent:', {
            emailId,
            patientEmail: patientEmail.replace(/(.{3}).*(@.*)/, '$1***$2'),
            receiptNumber: receiptData.receiptNumber,
            amount: receiptData.amount
        });
        
        return {
            success: true,
            emailId,
            messageId: result.messageId,
            category: EMAIL_CONFIG.CATEGORIES.RECEIPT,
            receiptNumber: receiptData.receiptNumber
        };
        
    } catch (error) {
        console.error('❌ Failed to send payment receipt:', error);
        throw new Error(`Payment receipt email failed: ${error.message}`);
    }
};

/**
 * Send refund confirmation email
 */
export const sendRefundConfirmation = async (patientEmail, refundData, options = {}) => {
    try {
        const emailId = `REFUND-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const content = `
            <h2>Hello ${refundData.patientName},</h2>
            
            <div class="info-box" style="background: #f8d7da; border-left-color: #dc3545;">
                <h3 style="color: #dc3545;">↩️ Refund Processed</h3>
                <p>Your refund has been successfully processed.</p>
            </div>
            
            <div class="info-box">
                <h3>💰 Refund Details</h3>
                <p><strong>Refund ID:</strong> ${refundData.refundId}</p>
                <p><strong>Original Transaction ID:</strong> ${refundData.originalTransactionId}</p>
                <p><strong>Refund Date:</strong> ${refundData.refundDate}</p>
                <p><strong>Refund Method:</strong> ${refundData.refundMethod}</p>
                <p><strong>Refund Amount:</strong> $${refundData.amount.toFixed(2)}</p>
                <p><strong>Reason:</strong> ${refundData.reason}</p>
                <p><strong>Status:</strong> <span style="color: #28a745;">${refundData.status}</span></p>
            </div>
            
            <div class="warning-box">
                <h4>📋 Important Information:</h4>
                <ul>
                    <li>Refund may take 5-10 business days to appear in your account</li>
                    <li>You will receive a separate confirmation from your bank</li>
                    <li>Contact your bank for questions about refund timing</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${refundData.supportLink || '#'}" class="button">Contact Support</a>
            </div>
        `;

        const mailOptions = {
            from: `${EMAIL_CONFIG.FROM_NAME} <${EMAIL_CONFIG.FROM_EMAIL}>`,
            to: patientEmail,
            subject: `Refund Confirmation - ${refundData.refundId}`,
            html: generateEmailTemplate(content, 'Refund Confirmation', 'payment'),
            priority: 'high',
            headers: {
                'X-Healthcare-Category': EMAIL_CONFIG.CATEGORIES.PAYMENT,
                'X-Email-ID': emailId,
                'X-Refund-ID': refundData.refundId,
                'X-Patient-ID': refundData.patientId || 'unknown'
            }
        };
        
        const result = await sendEmail(mailOptions, {
            emailId,
            category: EMAIL_CONFIG.CATEGORIES.PAYMENT,
            recipientType: 'patient',
            template: 'refund-confirmation',
            sentBy: options.sentBy || 'billing-system',
            recipient: patientEmail
        });
        
        console.log('✅ Refund confirmation email sent:', {
            emailId,
            patientEmail: patientEmail.replace(/(.{3}).*(@.*)/, '$1***$2'),
            refundId: refundData.refundId,
            amount: refundData.amount
        });
        
        return {
            success: true,
            emailId,
            messageId: result.messageId,
            category: EMAIL_CONFIG.CATEGORIES.PAYMENT,
            refundId: refundData.refundId
        };
        
    } catch (error) {
        console.error('❌ Failed to send refund confirmation:', error);
        throw new Error(`Refund confirmation email failed: ${error.message}`);
    }
};

/**
 * Send invoice email to patient
 */
export const sendInvoice = async (patientEmail, invoiceData, options = {}) => {
    try {
        const emailId = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Generate invoice items HTML
        const itemsHtml = invoiceData.items.map(item => `
            <tr>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>$${(item.quantity * item.price).toFixed(2)}</td>
            </tr>
        `).join('');

        const content = `
            <h2>Hello ${invoiceData.patientName},</h2>
            <p>Your invoice has been generated for your recent healthcare services.</p>
            
            <div class="info-box">
                <h3>🧾 Invoice Details</h3>
                <p><strong>Invoice Number:</strong> ${invoiceData.invoiceNumber}</p>
                <p><strong>Invoice Date:</strong> ${invoiceData.invoiceDate}</p>
                <p><strong>Due Date:</strong> ${invoiceData.dueDate}</p>
                <p><strong>Payment Status:</strong> ${invoiceData.paymentStatus}</p>
            </div>
            
            <h3>Services Provided:</h3>
            <table class="invoice-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" style="text-align: right;"><strong>Subtotal:</strong></td>
                        <td>$${invoiceData.subtotal.toFixed(2)}</td>
                    </tr>
                    ${invoiceData.discountAmount > 0 ? `
                    <tr>
                        <td colspan="3" style="text-align: right;"><strong>Discount (${invoiceData.discountRate}%):</strong></td>
                        <td>-$${invoiceData.discountAmount.toFixed(2)}</td>
                    </tr>
                    ` : ''}
                    ${invoiceData.taxAmount > 0 ? `
                    <tr>
                        <td colspan="3" style="text-align: right;"><strong>Tax (${invoiceData.taxRate}%):</strong></td>
                        <td>$${invoiceData.taxAmount.toFixed(2)}</td>
                    </tr>
                    ` : ''}
                    <tr>
                        <td colspan="3" style="text-align: right;"><strong>Total:</strong></td>
                        <td><strong>$${invoiceData.total.toFixed(2)}</strong></td>
                    </tr>
                </tfoot>
            </table>
            
            <div class="invoice-total">
                Amount Due: $${invoiceData.total.toFixed(2)}
            </div>
            
            ${invoiceData.paymentStatus === 'pending' ? `
            <div style="text-align: center; margin: 30px 0;">
                <a href="${invoiceData.paymentLink || '#'}" class="button">Pay Now</a>
                <a href="${invoiceData.downloadLink || '#'}" class="button button-secondary">Download PDF</a>
            </div>
            
            <div class="warning-box">
                <h4>📌 Payment Information:</h4>
                <ul>
                    <li>Please make payment by the due date to avoid late fees</li>
                    <li>We accept all major credit cards and insurance payments</li>
                    <li>Contact our billing department for payment plans or questions</li>
                    <li>Your invoice is also available in your patient portal</li>
                </ul>
            </div>
            ` : invoiceData.paymentStatus === 'paid' ? `
            <div class="info-box" style="background: #d4edda; border-left-color: #28a745;">
                <h4 style="color: #28a745;">✅ Payment Received</h4>
                <p>Thank you for your payment. A receipt has been sent separately.</p>
            </div>
            ` : ''}
            
            ${invoiceData.notes ? `
            <div class="info-box">
                <h4>📝 Notes:</h4>
                <p>${invoiceData.notes}</p>
            </div>
            ` : ''}
        `;

        const mailOptions = {
            from: `${EMAIL_CONFIG.FROM_NAME} <${EMAIL_CONFIG.FROM_EMAIL}>`,
            to: patientEmail,
            subject: `Invoice ${invoiceData.invoiceNumber} from Healthcare System`,
            html: generateEmailTemplate(content, `Invoice #${invoiceData.invoiceNumber}`, 'invoice'),
            priority: 'high',
            attachments: invoiceData.attachments || [],
            headers: {
                'X-Healthcare-Category': EMAIL_CONFIG.CATEGORIES.INVOICE,
                'X-Email-ID': emailId,
                'X-Invoice-Number': invoiceData.invoiceNumber,
                'X-Patient-ID': invoiceData.patientId || 'unknown'
            }
        };
        
        const result = await sendEmail(mailOptions, {
            emailId,
            category: EMAIL_CONFIG.CATEGORIES.INVOICE,
            recipientType: 'patient',
            template: 'invoice',
            sentBy: options.sentBy || 'billing-system',
            recipient: patientEmail
        });
        
        console.log('✅ Invoice email sent:', {
            emailId,
            patientEmail: patientEmail.replace(/(.{3}).*(@.*)/, '$1***$2'),
            invoiceNumber: invoiceData.invoiceNumber,
            amount: invoiceData.total
        });
        
        return {
            success: true,
            emailId,
            messageId: result.messageId,
            category: EMAIL_CONFIG.CATEGORIES.INVOICE,
            invoiceNumber: invoiceData.invoiceNumber
        };
        
    } catch (error) {
        console.error('❌ Failed to send invoice email:', error);
        throw new Error(`Invoice email failed: ${error.message}`);
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