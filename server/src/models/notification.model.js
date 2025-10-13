/**
 * Healthcare System - Notification Model
 * 
 * Manages system notifications, alerts, and messages
 * for patients, doctors, and administrative staff.
 */

import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const notificationSchema = new Schema(
    {
        // Recipient Information
        recipientId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Recipient reference is required'],
            index: true
        },
        recipientType: {
            type: String,
            enum: ['patient', 'doctor', 'nurse', 'admin', 'all'],
            required: true,
            index: true
        },
        
        // Notification Content
        title: {
            type: String,
            required: [true, 'Notification title is required'],
            trim: true,
            maxlength: 200
        },
        message: {
            type: String,
            required: [true, 'Notification message is required'],
            trim: true,
            maxlength: 1000
        },
        shortMessage: {
            type: String,
            trim: true,
            maxlength: 150
        },
        
        // Notification Type and Category
        notificationType: {
            type: String,
            enum: [
                'appointment', 
                'prescription', 
                'lab-result', 
                'reminder',
                'alert', 
                'system', 
                'billing', 
                'security',
                'health-tip',
                'announcement'
            ],
            required: true,
            index: true
        },
        category: {
            type: String,
            trim: true
        },
        
        // Priority and Urgency
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'medium',
            index: true
        },
        isUrgent: {
            type: Boolean,
            default: false
        },
        
        // Delivery Status
        status: {
            type: String,
            enum: ['sent', 'delivered', 'read', 'failed', 'pending'],
            default: 'sent',
            index: true
        },
        deliveryStatus: {
            email: {
                sent: { type: Boolean, default: false },
                delivered: { type: Boolean, default: false },
                opened: { type: Boolean, default: false },
                error: String
            },
            sms: {
                sent: { type: Boolean, default: false },
                delivered: { type: Boolean, default: false },
                error: String
            },
            push: {
                sent: { type: Boolean, default: false },
                delivered: { type: Boolean, default: false },
                opened: { type: Boolean, default: false },
                error: String
            },
            inApp: {
                sent: { type: Boolean, default: true },
                delivered: { type: Boolean, default: true }
            }
        },
        
        // Channels and Delivery Methods
        channels: [{
            type: String,
            enum: ['email', 'sms', 'push', 'in-app'],
            default: 'in-app'
        }],
        
        // Action and Navigation
        actionUrl: {
            type: String,
            trim: true
        },
        actionLabel: {
            type: String,
            trim: true
        },
        deepLink: {
            type: String,
            trim: true
        },
        
        // Related Entity References
        metadata: {
            appointmentId: {
                type: Schema.Types.ObjectId,
                ref: 'Appointment'
            },
            prescriptionId: {
                type: Schema.Types.ObjectId,
                ref: 'Prescription'
            },
            labResultId: {
                type: Schema.Types.ObjectId,
                ref: 'LabResult'
            },
            medicalRecordId: {
                type: Schema.Types.ObjectId,
                ref: 'MedicalRecord'
            },
            paymentId: {
                type: Schema.Types.ObjectId,
                ref: 'Payment'
            },
            entityType: String,
            entityId: Schema.Types.ObjectId
        },
        
        // Read and Interaction Tracking
        isRead: {
            type: Boolean,
            default: false,
            index: true
        },
        readAt: Date,
        acknowledged: {
            type: Boolean,
            default: false
        },
        acknowledgedAt: Date,
        actionTaken: {
            type: Boolean,
            default: false
        },
        actionTakenAt: Date,
        
        // Scheduling and Expiry
        scheduledFor: {
            type: Date,
            index: true
        },
        sentAt: {
            type: Date,
            index: true
        },
        expiresAt: {
            type: Date,
            index: true
        },
        
        // Retry and Failure Handling
        retryCount: {
            type: Number,
            default: 0
        },
        maxRetries: {
            type: Number,
            default: 3
        },
        lastRetryAt: Date,
        failureReason: String,
        
        // Template Information
        templateId: {
            type: String,
            trim: true
        },
        templateData: {
            type: Map,
            of: Schema.Types.Mixed
        },
        
        // Localization
        language: {
            type: String,
            default: 'en'
        },
        
        // Group and Batch Notifications
        batchId: {
            type: String,
            trim: true
        },
        isBulk: {
            type: Boolean,
            default: false
        },
        
        // Personalization
        personalization: {
            patientName: String,
            doctorName: String,
            appointmentDate: Date,
            otherData: {
                type: Map,
                of: Schema.Types.Mixed
            }
        },
        
        // Analytics and Tracking
        analytics: {
            clickCount: { type: Number, default: 0 },
            viewCount: { type: Number, default: 0 },
            conversionRate: Number,
            lastClickedAt: Date
        },
        
        // Security and Privacy
        sensitivity: {
            type: String,
            enum: ['normal', 'confidential', 'sensitive'],
            default: 'normal'
        },
        
        // Archival
        isArchived: {
            type: Boolean,
            default: false
        },
        archivedAt: Date
    },
    {
        timestamps: true
    }
);

/**
 * Indexes for optimized queries
 */
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientType: 1, status: 1 });
notificationSchema.index({ notificationType: 1, priority: 1 });
notificationSchema.index({ isRead: 1, createdAt: -1 });
notificationSchema.index({ scheduledFor: 1, status: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Add aggregation pagination plugin
 */
notificationSchema.plugin(mongooseAggregatePaginate);

/**
 * Virtual: Is Expired
 */
notificationSchema.virtual('isExpired').get(function() {
    return this.expiresAt && this.expiresAt < new Date();
});

/**
 * Virtual: Is Scheduled
 */
notificationSchema.virtual('isScheduled').get(function() {
    return this.scheduledFor && this.scheduledFor > new Date();
});

/**
 * Virtual: Can Retry
 */
notificationSchema.virtual('canRetry').get(function() {
    return this.status === 'failed' && 
           this.retryCount < this.maxRetries &&
           (!this.lastRetryAt || Date.now() - this.lastRetryAt > 5 * 60 * 1000); // 5 minutes
});

/**
 * Virtual: Delivery Score
 */
notificationSchema.virtual('deliveryScore').get(function() {
    let score = 0;
    const delivery = this.deliveryStatus;
    
    if (delivery.inApp?.delivered) score += 25;
    if (delivery.email?.delivered) score += 25;
    if (delivery.sms?.delivered) score += 25;
    if (delivery.push?.delivered) score += 25;
    
    return score;
});

/**
 * Pre-save middleware: Set sentAt timestamp
 */
notificationSchema.pre('save', function(next) {
    if (this.isNew && !this.scheduledFor) {
        this.sentAt = new Date();
    }
    
    // Set short message if not provided
    if (!this.shortMessage && this.message) {
        this.shortMessage = this.message.length > 150 
            ? this.message.substring(0, 147) + '...' 
            : this.message;
    }
    
    next();
});

/**
 * Instance Method: Mark as read
 */
notificationSchema.methods.markAsRead = async function() {
    this.isRead = true;
    this.readAt = new Date();
    return await this.save();
};

/**
 * Instance Method: Mark as delivered for channel
 */
notificationSchema.methods.markDelivered = async function(channel) {
    if (this.deliveryStatus[channel]) {
        this.deliveryStatus[channel].delivered = true;
        this.deliveryStatus[channel].sent = true;
        
        if (this.status === 'sent') {
            this.status = 'delivered';
        }
        
        return await this.save();
    }
};

/**
 * Instance Method: Mark as failed for channel
 */
notificationSchema.methods.markFailed = async function(channel, reason) {
    if (this.deliveryStatus[channel]) {
        this.deliveryStatus[channel].sent = false;
        this.deliveryStatus[channel].delivered = false;
        this.deliveryStatus[channel].error = reason;
        
        this.status = 'failed';
        this.failureReason = reason;
        this.retryCount += 1;
        this.lastRetryAt = new Date();
        
        return await this.save();
    }
};

/**
 * Instance Method: Retry delivery
 */
notificationSchema.methods.retryDelivery = async function() {
    if (this.canRetry) {
        this.status = 'pending';
        this.failureReason = null;
        return await this.save();
    }
    throw new Error('Cannot retry delivery - max retries exceeded or not eligible');
};

/**
 * Instance Method: Archive notification
 */
notificationSchema.methods.archive = async function() {
    this.isArchived = true;
    this.archivedAt = new Date();
    return await this.save();
};

/**
 * Static Method: Find unread notifications by recipient
 */
notificationSchema.statics.findUnreadByRecipient = async function(recipientId, limit = 20) {
    return await this.find({
        recipientId,
        isRead: false,
        isArchived: false,
        $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: { $gt: new Date() } }
        ]
    })
    .sort({ createdAt: -1 })
    .limit(limit);
};

/**
 * Static Method: Find notifications by type and date range
 */
notificationSchema.statics.findByTypeAndDate = async function(notificationType, startDate, endDate) {
    return await this.find({
        notificationType,
        createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        },
        isArchived: false
    })
    .populate('recipientId', 'firstName lastName email phoneNumber')
    .sort({ createdAt: -1 });
};

/**
 * Static Method: Find failed notifications for retry
 */
notificationSchema.statics.findFailedForRetry = async function() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    return await this.find({
        status: 'failed',
        retryCount: { $lt: '$maxRetries' },
        $or: [
            { lastRetryAt: { $exists: false } },
            { lastRetryAt: { $lt: fiveMinutesAgo } }
        ]
    })
    .limit(100);
};

/**
 * Static Method: Get notification statistics
 */
notificationSchema.statics.getStatistics = async function(recipientType = null, startDate, endDate) {
    const matchStage = {
        createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        }
    };
    
    if (recipientType) {
        matchStage.recipientType = recipientType;
    }
    
    return await this.aggregate([
        { $match: matchStage },
        {
            $facet: {
                total: [{ $count: 'count' }],
                byType: [
                    { $group: { _id: '$notificationType', count: { $sum: 1 } } }
                ],
                byStatus: [
                    { $group: { _id: '$status', count: { $sum: 1 } } }
                ],
                byPriority: [
                    { $group: { _id: '$priority', count: { $sum: 1 } } }
                ],
                readRate: [
                    {
                        $group: {
                            _id: null,
                            total: { $sum: 1 },
                            read: { $sum: { $cond: ['$isRead', 1, 0] } }
                        }
                    },
                    {
                        $project: {
                            total: 1,
                            read: 1,
                            readRate: { $multiply: [{ $divide: ['$read', '$total'] }, 100] }
                        }
                    }
                ],
                deliveryStats: [
                    {
                        $group: {
                            _id: null,
                            emailDelivered: { $sum: { $cond: ['$deliveryStatus.email.delivered', 1, 0] } },
                            smsDelivered: { $sum: { $cond: ['$deliveryStatus.sms.delivered', 1, 0] } },
                            pushDelivered: { $sum: { $cond: ['$deliveryStatus.push.delivered', 1, 0] } }
                        }
                    }
                ]
            }
        }
    ]);
};

export const Notification = mongoose.model("Notification", notificationSchema);