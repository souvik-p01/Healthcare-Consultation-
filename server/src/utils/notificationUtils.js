/**
 * Healthcare System - Notification Utility Functions
 * 
 * Handles sending notifications through various channels
 */

import nodemailer from 'nodemailer';
import twilio from 'twilio';

/**
 * Send email notification
 * @param {string} recipientEmail - Recipient email address
 * @param {Object} options - Email options
 * @param {string} options.subject - Email subject
 * @param {string} options.template - Template name
 * @param {Object} options.data - Template data
 * @returns {Promise<Object>} - Result of email sending
 */
export const sendEmailNotification = async (recipientEmail, options) => {
    try {
        console.log(`📧 Sending email to: ${recipientEmail}`);
        
        // Create transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        // Generate email content based on template
        const emailContent = generateEmailContent(options.template, options.data);

        // Send email
        const info = await transporter.sendMail({
            from: `"Healthcare System" <${process.env.SMTP_FROM}>`,
            to: recipientEmail,
            subject: options.subject,
            html: emailContent,
            text: options.data.message || 'Notification from Healthcare System'
        });

        console.log(`✅ Email sent: ${info.messageId}`);
        
        return {
            success: true,
            messageId: info.messageId,
            accepted: info.accepted,
            rejected: info.rejected
        };
    } catch (error) {
        console.error('❌ Email sending failed:', error);
        throw new Error(`Email sending failed: ${error.message}`);
    }
};

/**
 * Send SMS notification
 * @param {string} phoneNumber - Recipient phone number
 * @param {Object} options - SMS options
 * @param {string} options.message - SMS message
 * @param {string} options.type - Message type
 * @returns {Promise<Object>} - Result of SMS sending
 */
export const sendSMSNotification = async (phoneNumber, options) => {
    try {
        console.log(`📱 Sending SMS to: ${phoneNumber}`);
        
        // Initialize Twilio client
        const client = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );

        // Send SMS
        const message = await client.messages.create({
            body: options.message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phoneNumber
        });

        console.log(`✅ SMS sent: ${message.sid}`);
        
        return {
            success: true,
            messageId: message.sid,
            status: message.status
        };
    } catch (error) {
        console.error('❌ SMS sending failed:', error);
        throw new Error(`SMS sending failed: ${error.message}`);
    }
};

/**
 * Send push notification
 * @param {string} userId - Recipient user ID
 * @param {Object} options - Push notification options
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body
 * @param {string} options.type - Notification type
 * @param {Object} options.data - Additional data
 * @returns {Promise<Object>} - Result of push notification
 */
export const sendPushNotification = async (userId, options) => {
    try {
        console.log(`📲 Sending push notification to user: ${userId}`);
        
        // In a real implementation, you would:
        // 1. Get user's push notification tokens from database
        // 2. Send notifications to each device token
        // 3. Use Firebase Cloud Messaging (FCM), Apple Push Notification Service (APNS), or similar
        
        // Mock implementation
        console.log(`📲 Push notification prepared: ${options.title} - ${options.body}`);
        
        // Simulate successful push notification
        return {
            success: true,
            userId: userId,
            title: options.title,
            body: options.body,
            type: options.type
        };
    } catch (error) {
        console.error('❌ Push notification failed:', error);
        throw new Error(`Push notification failed: ${error.message}`);
    }
};

/**
 * Generate email content based on template
 * @param {string} templateName - Template name
 * @param {Object} data - Template data
 * @returns {string} - HTML email content
 */
const generateEmailContent = (templateName, data) => {
    const templates = {
        'test': `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Test Notification</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
                    .content { padding: 30px; background: #f9f9f9; }
                    .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Test Notification</h1>
                    </div>
                    <div class="content">
                        <p>Hello ${data.userName || 'User'},</p>
                        <p>${data.message || 'This is a test notification from Healthcare System.'}</p>
                        <p>Sent at: ${data.timestamp || new Date().toLocaleString()}</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated message from Healthcare System.</p>
                        <p>Please do not reply to this email.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        'appointment': `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${data.title || 'Appointment Notification'}</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
                    .content { padding: 30px; background: #f9f9f9; }
                    .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
                    .button { display: inline-block; padding: 10px 20px; background: #2196F3; color: white; text-decoration: none; border-radius: 5px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>${data.title || 'Appointment Notification'}</h1>
                    </div>
                    <div class="content">
                        <p>Dear ${data.patientName || 'Patient'},</p>
                        <p>${data.message}</p>
                        ${data.appointmentDate ? `<p><strong>Date:</strong> ${data.appointmentDate}</p>` : ''}
                        ${data.appointmentTime ? `<p><strong>Time:</strong> ${data.appointmentTime}</p>` : ''}
                        ${data.doctorName ? `<p><strong>Doctor:</strong> ${data.doctorName}</p>` : ''}
                        ${data.actionUrl ? `<p><a href="${data.actionUrl}" class="button">View Details</a></p>` : ''}
                    </div>
                    <div class="footer">
                        <p>This is an automated message from Healthcare System.</p>
                        <p>Please do not reply to this email.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        'lab-result': `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${data.title || 'Lab Result Notification'}</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #FF9800; color: white; padding: 20px; text-align: center; }
                    .content { padding: 30px; background: #f9f9f9; }
                    .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
                    .button { display: inline-block; padding: 10px 20px; background: #FF9800; color: white; text-decoration: none; border-radius: 5px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>${data.title || 'Lab Result Available'}</h1>
                    </div>
                    <div class="content">
                        <p>Dear ${data.patientName || 'Patient'},</p>
                        <p>${data.message || 'Your lab results are now available.'}</p>
                        ${data.testName ? `<p><strong>Test:</strong> ${data.testName}</p>` : ''}
                        ${data.labResultNumber ? `<p><strong>Result ID:</strong> ${data.labResultNumber}</p>` : ''}
                        ${data.doctorName ? `<p><strong>Doctor:</strong> ${data.doctorName}</p>` : ''}
                        ${data.actionUrl ? `<p><a href="${data.actionUrl}" class="button">View Results</a></p>` : ''}
                    </div>
                    <div class="footer">
                        <p>This is an automated message from Healthcare System.</p>
                        <p>Please do not reply to this email.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    return templates[templateName] || templates['test'];
};

/**
 * Create notification in database
 * @param {Object} notificationData - Notification data
 * @returns {Promise<Object>} - Created notification
 */
export const createNotification = async (notificationData) => {
    try {
        const Notification = (await import('../models/notification.model.js')).Notification;
        
        const notification = new Notification({
            ...notificationData,
            sentAt: new Date(),
            status: 'sent'
        });

        await notification.save();
        return notification;
    } catch (error) {
        console.error('❌ Notification creation failed:', error);
        throw error;
    }
};

/**
 * Bulk create notifications
 * @param {Array} notificationsData - Array of notification data
 * @returns {Promise<Array>} - Created notifications
 */
export const bulkCreateNotifications = async (notificationsData) => {
    try {
        const Notification = (await import('../models/notification.model.js')).Notification;
        
        const notifications = await Notification.insertMany(notificationsData);
        return notifications;
    } catch (error) {
        console.error('❌ Bulk notification creation failed:', error);
        throw error;
    }
};

/**
 * Get notification statistics for a user
 * @param {string} userId - User ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} - Statistics
 */
export const getUserNotificationStats = async (userId, startDate, endDate) => {
    try {
        const Notification = (await import('../models/notification.model.js')).Notification;
        
        const stats = await Notification.aggregate([
            {
                $match: {
                    recipientId: mongoose.Types.ObjectId(userId),
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $facet: {
                    byType: [
                        { $group: { _id: '$notificationType', count: { $sum: 1 } } }
                    ],
                    byStatus: [
                        { $group: { _id: '$status', count: { $sum: 1 } } }
                    ],
                    readStats: [
                        {
                            $group: {
                                _id: null,
                                total: { $sum: 1 },
                                read: { $sum: { $cond: ['$isRead', 1, 0] } }
                            }
                        }
                    ]
                }
            }
        ]);

        return stats[0] || {};
    } catch (error) {
        console.error('❌ User notification stats failed:', error);
        throw error;
    }
};