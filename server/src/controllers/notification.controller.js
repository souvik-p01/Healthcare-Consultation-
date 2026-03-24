/**
 * Healthcare System - Notification Controller
 * 
 * Updated to work with the new Notification model structure
 * 
 * Features:
 * - Real-time notifications
 * - Multi-channel delivery (email, SMS, push, in-app)
 * - Notification templates
 * - Advanced filtering and pagination
 * - Notification preferences
 * - Delivery tracking and analytics
 */

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Notification } from "../models/notification.model.js";
import { User } from "../models/User.model.js";
import { 
    sendEmailNotification,
    sendSMSNotification,
    sendPushNotification 
} from "../utils/notificationUtils.js";

/**
 * @desc    Get user notifications
 * @route   GET /api/v1/notifications
 * @access  Private
 */
const getUserNotifications = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role || 'patient';
    
    const {
        notificationType,
        priority,
        status,
        isRead,
        dateFrom,
        dateTo,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;

    console.log("🔔 Fetching notifications for user:", userId, "role:", userRole);

    // Build query - using recipientId and recipientType
    const query = { 
        $or: [
            { recipientId: userId },
            { recipientType: userRole },
            { recipientType: 'all' }
        ],
        isArchived: false
    };
    
    if (notificationType) query.notificationType = notificationType;
    if (priority) query.priority = priority;
    if (status) query.status = status;
    if (isRead !== undefined) query.isRead = isRead === 'true';
    
    // Date range filter
    if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
        if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const notifications = await Notification.find(query)
        .populate('recipientId', 'firstName lastName email phoneNumber')
        .populate('metadata.appointmentId', 'date time status')
        .populate('metadata.prescriptionId', 'medicationName dosage')
        .populate('metadata.labResultId', 'testName result')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

    const total = await Notification.countDocuments(query);
    
    // Get unread count for badge
    const unreadQuery = { 
        $or: [
            { recipientId: userId },
            { recipientType: userRole },
            { recipientType: 'all' }
        ],
        isRead: false,
        isArchived: false
    };
    
    const unreadCount = await Notification.countDocuments(unreadQuery);

    console.log(`✅ Found ${notifications.length} notifications for user`);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    notifications,
                    summary: {
                        total,
                        unread: unreadCount,
                        read: total - unreadCount
                    },
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(total / limit),
                        totalNotifications: total,
                        hasNextPage: page * limit < total
                    }
                },
                "User notifications fetched successfully"
            )
        );
});

/**
 * @desc    Get unread notifications
 * @route   GET /api/v1/notifications/unread
 * @access  Private
 */
const getUnreadNotifications = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role || 'patient';
    const { limit = 10 } = req.query;

    console.log("📥 Fetching unread notifications for user:", userId);

    const notifications = await Notification.findUnreadByRecipient(userId, parseInt(limit));

    console.log(`✅ Found ${notifications.length} unread notifications`);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { notifications },
                "Unread notifications fetched successfully"
            )
        );
});

/**
 * @desc    Get unread notifications count
 * @route   GET /api/v1/notifications/unread-count
 * @access  Private
 */
const getUnreadNotificationsCount = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role || 'patient';

    console.log("📊 Fetching unread notifications count for user:", userId);

    const unreadCount = await Notification.countDocuments({ 
        $or: [
            { recipientId: userId },
            { recipientType: userRole },
            { recipientType: 'all' }
        ],
        isRead: false,
        isArchived: false
    });

    console.log(`✅ User has ${unreadCount} unread notifications`);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { unreadCount },
                "Unread notifications count fetched successfully"
            )
        );
});

/**
 * @desc    Mark notification as read
 * @route   PATCH /api/v1/notifications/:notificationId/read
 * @access  Private
 */
const markNotificationAsRead = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user._id;

    console.log("📖 Marking notification as read:", notificationId);

    if (!notificationId) {
        throw new ApiError(400, "Notification ID is required");
    }

    // Find notification
    const notification = await Notification.findById(notificationId);

    if (!notification) {
        throw new ApiError(404, "Notification not found");
    }

    // Check if user is authorized (recipient or admin)
    const isRecipient = notification.recipientId.toString() === userId.toString();
    const isRoleRecipient = notification.recipientType === req.user.role;
    const isAllRecipient = notification.recipientType === 'all';
    
    if (!isRecipient && !isRoleRecipient && !isAllRecipient && req.user.role !== 'admin') {
        throw new ApiError(403, "Not authorized to mark this notification as read");
    }

    // Use instance method to mark as read
    const updatedNotification = await notification.markAsRead();

    console.log('✅ Notification marked as read:', notificationId);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { notification: updatedNotification },
                "Notification marked as read successfully"
            )
        );
});

/**
 * @desc    Mark all notifications as read
 * @route   PATCH /api/v1/notifications/mark-all-read
 * @access  Private
 */
const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role || 'patient';

    console.log("📚 Marking all notifications as read for user:", userId);

    // Update all unread notifications for the user
    const result = await Notification.updateMany(
        {
            $or: [
                { recipientId: userId },
                { recipientType: userRole },
                { recipientType: 'all' }
            ],
            isRead: false,
            isArchived: false
        },
        {
            $set: {
                isRead: true,
                readAt: new Date(),
                status: 'read'
            }
        }
    );

    console.log(`✅ Marked ${result.modifiedCount} notifications as read`);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { 
                    markedCount: result.modifiedCount,
                    message: `Marked ${result.modifiedCount} notifications as read`
                },
                "All notifications marked as read successfully"
            )
        );
});

/**
 * @desc    Delete notification
 * @route   DELETE /api/v1/notifications/:notificationId
 * @access  Private
 */
const deleteNotification = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user._id;

    console.log("🗑 Deleting notification:", notificationId);

    if (!notificationId) {
        throw new ApiError(400, "Notification ID is required");
    }

    // Find notification
    const notification = await Notification.findById(notificationId);

    if (!notification) {
        throw new ApiError(404, "Notification not found");
    }

    // Check if user is authorized (recipient or admin)
    const isRecipient = notification.recipientId.toString() === userId.toString();
    const isRoleRecipient = notification.recipientType === req.user.role;
    const isAllRecipient = notification.recipientType === 'all';
    
    if (!isRecipient && !isRoleRecipient && !isAllRecipient && req.user.role !== 'admin') {
        throw new ApiError(403, "Not authorized to delete this notification");
    }

    // Archive instead of delete for history
    await notification.archive();

    console.log('✅ Notification archived:', notificationId);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Notification archived successfully"
            )
        );
});

/**
 * @desc    Clear all notifications
 * @route   DELETE /api/v1/notifications/clear-all
 * @access  Private
 */
const clearAllNotifications = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role || 'patient';

    console.log("🧹 Archiving all notifications for user:", userId);

    // Archive all notifications for the user
    const result = await Notification.updateMany(
        {
            $or: [
                { recipientId: userId },
                { recipientType: userRole },
                { recipientType: 'all' }
            ],
            isArchived: false
        },
        {
            $set: {
                isArchived: true,
                archivedAt: new Date()
            }
        }
    );

    console.log(`✅ Archived ${result.modifiedCount} notifications`);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { 
                    archivedCount: result.modifiedCount,
                    message: `Archived ${result.modifiedCount} notifications`
                },
                "All notifications archived successfully"
            )
        );
});

/**
 * @desc    Get notification preferences
 * @route   GET /api/v1/notifications/preferences
 * @access  Private
 */
const getNotificationPreferences = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    console.log("⚙ Fetching notification preferences for user:", userId);

    const user = await User.findById(userId)
        .select('notificationPreferences email phoneNumber firstName')
        .lean();

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Default preferences if not set
    const defaultPreferences = {
        channels: {
            email: true,
            sms: true,
            push: true,
            inApp: true
        },
        notificationTypes: {
            appointment: {
                email: true,
                sms: true,
                push: true,
                inApp: true
            },
            prescription: {
                email: true,
                sms: false,
                push: true,
                inApp: true
            },
            lab_result: {
                email: true,
                sms: false,
                push: true,
                inApp: true
            },
            reminder: {
                email: true,
                sms: true,
                push: true,
                inApp: true
            },
            alert: {
                email: true,
                sms: true,
                push: true,
                inApp: true
            },
            system: {
                email: true,
                sms: false,
                push: false,
                inApp: true
            },
            billing: {
                email: true,
                sms: false,
                push: false,
                inApp: true
            }
        },
        frequency: 'immediate',
        quietHours: {
            enabled: false,
            start: '22:00',
            end: '07:00',
            timezone: 'UTC'
        },
        prioritySettings: {
            urgent: {
                email: true,
                sms: true,
                push: true,
                inApp: true
            },
            high: {
                email: true,
                sms: true,
                push: true,
                inApp: true
            },
            medium: {
                email: true,
                sms: false,
                push: true,
                inApp: true
            },
            low: {
                email: false,
                sms: false,
                push: false,
                inApp: true
            }
        }
    };

    const preferences = user.notificationPreferences || defaultPreferences;

    console.log('✅ Notification preferences fetched successfully');

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { preferences },
                "Notification preferences fetched successfully"
            )
        );
});

/**
 * @desc    Update notification preferences
 * @route   PATCH /api/v1/notifications/preferences
 * @access  Private
 */
const updateNotificationPreferences = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const {
        channels,
        notificationTypes,
        frequency,
        quietHours,
        prioritySettings
    } = req.body;

    console.log("⚙ Updating notification preferences for user:", userId);

    // Build update object
    const updateData = {
        notificationPreferences: {}
    };

    if (channels) updateData.notificationPreferences.channels = channels;
    if (notificationTypes) updateData.notificationPreferences.notificationTypes = notificationTypes;
    if (frequency) updateData.notificationPreferences.frequency = frequency;
    if (quietHours) updateData.notificationPreferences.quietHours = quietHours;
    if (prioritySettings) updateData.notificationPreferences.prioritySettings = prioritySettings;

    if (Object.keys(updateData.notificationPreferences).length === 0) {
        throw new ApiError(400, "At least one preference field is required to update");
    }

    // Update user preferences
    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
    ).select('notificationPreferences');

    console.log('✅ Notification preferences updated successfully');

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { preferences: updatedUser.notificationPreferences },
                "Notification preferences updated successfully"
            )
        );
});

/**
 * @desc    Send test notification
 * @route   POST /api/v1/notifications/test
 * @access  Private
 */
const sendTestNotification = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role || 'patient';
    const { 
        channel = 'email', 
        type = 'system',
        title = 'Test Notification',
        message = 'This is a test notification'
    } = req.body;

    console.log("🧪 Sending test notification to user:", userId, "channel:", channel);

    const user = await User.findById(userId)
        .select('email phoneNumber firstName notificationPreferences')
        .lean();

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    let testResult = {
        sent: false,
        channel: channel,
        type: type,
        message: ''
    };

    try {
        // Create notification record
        const notificationData = {
            recipientId: userId,
            recipientType: userRole,
            title: title,
            message: message,
            shortMessage: message.substring(0, 147) + '...',
            notificationType: type,
            priority: 'low',
            status: 'pending',
            channels: [channel],
            deliveryStatus: {
                [channel]: {
                    sent: false,
                    delivered: false,
                    error: null
                }
            },
            isRead: false,
            metadata: {
                test: true,
                timestamp: new Date()
            },
            personalization: {
                patientName: user.firstName || 'User'
            }
        };

        const notification = await Notification.create(notificationData);
        testResult.notificationId = notification._id;

        // Send notification based on channel
        switch (channel) {
            case 'email':
                if (user.email) {
                    await sendEmailNotification(user.email, {
                        subject: title,
                        template: 'test',
                        data: {
                            userName: user.firstName,
                            message: message,
                            timestamp: new Date().toLocaleString()
                        }
                    });
                    
                    // Mark as delivered
                    await notification.markDelivered('email');
                    testResult.sent = true;
                    testResult.message = 'Test email notification sent successfully';
                } else {
                    testResult.message = 'User does not have an email address';
                }
                break;

            case 'sms':
                if (user.phoneNumber) {
                    await sendSMSNotification(user.phoneNumber, {
                        message: `${title}: ${message}`,
                        type: 'test'
                    });
                    
                    // Mark as delivered
                    await notification.markDelivered('sms');
                    testResult.sent = true;
                    testResult.message = 'Test SMS notification sent successfully';
                } else {
                    testResult.message = 'User does not have a phone number';
                }
                break;

            case 'push':
                await sendPushNotification(userId, {
                    title: title,
                    body: message,
                    type: type,
                    data: { 
                        notificationId: notification._id,
                        test: true 
                    }
                });
                
                // Mark as delivered
                await notification.markDelivered('push');
                testResult.sent = true;
                testResult.message = 'Test push notification sent successfully';
                break;

            case 'in-app':
                // In-app notifications are automatically delivered
                await notification.markDelivered('inApp');
                testResult.sent = true;
                testResult.message = 'Test in-app notification created successfully';
                break;

            default:
                testResult.message = `Unsupported notification channel: ${channel}`;
        }

        // Mark notification as read if in-app
        if (channel === 'in-app') {
            await notification.markAsRead();
        }

    } catch (error) {
        console.error('❌ Test notification failed:', error);
        testResult.message = `Test notification failed: ${error.message}`;
        
        // Mark as failed
        if (testResult.notificationId) {
            const notification = await Notification.findById(testResult.notificationId);
            if (notification) {
                await notification.markFailed(channel, error.message);
            }
        }
    }

    console.log('✅ Test notification completed:', testResult.message);

    return res
        .status(testResult.sent ? 200 : 400)
        .json(
            new ApiResponse(
                testResult.sent ? 200 : 400,
                { testResult },
                testResult.sent ? "Test notification sent successfully" : "Test notification failed"
            )
        );
});

/**
 * @desc    Create manual notification (Admin only)
 * @route   POST /api/v1/notifications/manual
 * @access  Private/Admin
 */
const createManualNotification = asyncHandler(async (req, res) => {
    const {
        recipientIds,
        recipientType,
        title,
        message,
        notificationType = 'system',
        priority = 'medium',
        channels = ['in-app'],
        metadata = {},
        scheduledFor,
        expiresAt
    } = req.body;

    const createdBy = req.user._id;

    console.log("📢 Creating manual notification for:", recipientIds || recipientType);

    // Validation
    if (!title || !message) {
        throw new ApiError(400, "Title and message are required");
    }

    if (!recipientIds && !recipientType) {
        throw new ApiError(400, "Either recipientIds or recipientType is required");
    }

    // Prepare notification data
    const notificationData = {
        recipientType: recipientType || null,
        title,
        message,
        shortMessage: message.length > 150 ? message.substring(0, 147) + '...' : message,
        notificationType,
        priority,
        channels,
        status: scheduledFor ? 'pending' : 'sent',
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        metadata: {
            ...metadata,
            manual: true,
            createdBy: createdBy
        },
        deliveryStatus: {}
    };

    // Initialize delivery status for each channel
    channels.forEach(channel => {
        notificationData.deliveryStatus[channel] = {
            sent: false,
            delivered: false,
            error: null
        };
    });

    const results = {
        totalRecipients: 0,
        notificationsCreated: 0,
        deliveries: {
            email: { success: 0, failed: 0 },
            sms: { success: 0, failed: 0 },
            push: { success: 0, failed: 0 },
            inApp: { success: 0, failed: 0 }
        },
        errors: []
    };

    // Handle different recipient scenarios
    if (recipientType) {
        // Send to all users of a specific type
        const users = await User.find({ role: recipientType })
            .select('_id email phoneNumber firstName notificationPreferences')
            .lean();

        results.totalRecipients = users.length;

        for (const user of users) {
            await processUserNotification(user, notificationData, results);
        }
    } else if (recipientIds && Array.isArray(recipientIds)) {
        // Send to specific users
        results.totalRecipients = recipientIds.length;

        for (const recipientId of recipientIds) {
            try {
                const user = await User.findById(recipientId)
                    .select('email phoneNumber firstName notificationPreferences')
                    .lean();

                if (!user) {
                    throw new Error(`User ${recipientId} not found`);
                }

                await processUserNotification(user, notificationData, results);
            } catch (userError) {
                console.error(`❌ Notification creation failed for recipient ${recipientId}:`, userError);
                results.errors.push({
                    recipientId,
                    error: userError.message
                });
            }
        }
    }

    console.log(`✅ Manual notification created for ${results.notificationsCreated} recipients`);

    return res.status(201).json(
        new ApiResponse(
            201, 
            { results },
            "Manual notifications created and sent successfully"
        )
    );
});

/**
 * Helper function to process notification for a single user
 */
async function processUserNotification(user, notificationData, results) {
    try {
        // Create individual notification for each user
        const userNotification = await Notification.create({
            ...notificationData,
            recipientId: user._id,
            personalization: {
                patientName: user.firstName || 'User',
                userName: user.firstName || 'User'
            }
        });

        results.notificationsCreated++;
        
        // Send notifications through channels
        for (const channel of notificationData.channels) {
            try {
                await sendNotificationToUser(user, userNotification, channel, results);
            } catch (channelError) {
                console.error(`❌ Channel ${channel} failed for user ${user._id}:`, channelError);
                results.errors.push({
                    userId: user._id,
                    channel,
                    error: channelError.message
                });
            }
        }

    } catch (userError) {
        console.error(`❌ Notification creation failed for user ${user._id}:`, userError);
        results.errors.push({
            userId: user._id,
            error: userError.message
        });
    }
}

/**
 * Helper function to send notification to user through specific channel
 */
async function sendNotificationToUser(user, notification, channel, results) {
    let sent = false;
    
    switch (channel) {
        case 'email':
            if (user.email) {
                await sendEmailNotification(user.email, {
                    subject: notification.title,
                    template: notification.notificationType,
                    data: {
                        userName: user.firstName,
                        message: notification.message,
                        title: notification.title
                    }
                });
                await notification.markDelivered('email');
                results.deliveries.email.success++;
                sent = true;
            }
            break;

        case 'sms':
            if (user.phoneNumber) {
                await sendSMSNotification(user.phoneNumber, {
                    message: `${notification.title}: ${notification.message}`,
                    type: notification.notificationType
                });
                await notification.markDelivered('sms');
                results.deliveries.sms.success++;
                sent = true;
            }
            break;

        case 'push':
            await sendPushNotification(user._id, {
                title: notification.title,
                body: notification.message,
                type: notification.notificationType,
                data: { notificationId: notification._id }
            });
            await notification.markDelivered('push');
            results.deliveries.push.success++;
            sent = true;
            break;

        case 'in-app':
            // In-app notifications are automatically delivered
            await notification.markDelivered('inApp');
            results.deliveries.inApp.success++;
            sent = true;
            break;
    }

    if (!sent && channel !== 'in-app') {
        results.deliveries[channel].failed++;
    }
}

/**
 * @desc    Get notification statistics
 * @route   GET /api/v1/notifications/statistics
 * @access  Private/Admin
 */
const getNotificationStatistics = asyncHandler(async (req, res) => {
    const { 
        period = 'month', 
        recipientType, 
        notificationType, 
        startDate, 
        endDate 
    } = req.query;

    console.log("📊 Fetching notification statistics");

    // Calculate date range
    let dateRange = {};
    if (startDate && endDate) {
        dateRange.$gte = new Date(startDate);
        dateRange.$lte = new Date(endDate);
    } else {
        const now = new Date();
        switch (period) {
            case 'day':
                const startOfDay = new Date(now);
                startOfDay.setHours(0, 0, 0, 0);
                dateRange.$gte = startOfDay;
                dateRange.$lte = now;
                break;
            case 'week':
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay());
                startOfWeek.setHours(0, 0, 0, 0);
                dateRange.$gte = startOfWeek;
                dateRange.$lte = now;
                break;
            case 'month':
                dateRange.$gte = new Date(now.getFullYear(), now.getMonth(), 1);
                dateRange.$lte = now;
                break;
            case 'year':
                dateRange.$gte = new Date(now.getFullYear(), 0, 1);
                dateRange.$lte = now;
                break;
            default:
                dateRange.$gte = new Date(now.getFullYear(), now.getMonth(), 1);
                dateRange.$lte = now;
        }
    }

    // Build query
    const query = {
        createdAt: dateRange,
        isArchived: false
    };
    
    if (recipientType) query.recipientType = recipientType;
    if (notificationType) query.notificationType = notificationType;

    // Get statistics
    const totalNotifications = await Notification.countDocuments(query);

    const typeStats = await Notification.aggregate([
        { $match: query },
        { $group: { _id: '$notificationType', count: { $sum: 1 } } }
    ]);

    const statusStats = await Notification.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const priorityStats = await Notification.aggregate([
        { $match: query },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    const readStats = await Notification.aggregate([
        { $match: query },
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
    ]);

    const deliveryStats = await Notification.aggregate([
        { $match: query },
        {
            $group: {
                _id: null,
                emailDelivered: { $sum: { $cond: ['$deliveryStatus.email.delivered', 1, 0] } },
                smsDelivered: { $sum: { $cond: ['$deliveryStatus.sms.delivered', 1, 0] } },
                pushDelivered: { $sum: { $cond: ['$deliveryStatus.push.delivered', 1, 0] } },
                inAppDelivered: { $sum: { $cond: ['$deliveryStatus.inApp.delivered', 1, 0] } }
            }
        }
    ]);

    const statistics = {
        period,
        recipientType,
        dateRange: {
            from: dateRange.$gte,
            to: dateRange.$lte
        },
        summary: {
            totalNotifications,
            readRate: readStats[0]?.readRate || 0,
            unreadRate: readStats[0] ? 100 - (readStats[0].readRate || 0) : 0,
            delivery: {
                email: deliveryStats[0]?.emailDelivered || 0,
                sms: deliveryStats[0]?.smsDelivered || 0,
                push: deliveryStats[0]?.pushDelivered || 0,
                inApp: deliveryStats[0]?.inAppDelivered || 0
            }
        },
        breakdown: {
            byType: typeStats,
            byStatus: statusStats,
            byPriority: priorityStats
        }
    };

    console.log('✅ Notification statistics fetched successfully');

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { statistics },
                "Notification statistics fetched successfully"
            )
        );
});

/**
 * @desc    Get notification templates
 * @route   GET /api/v1/notifications/templates
 * @access  Private/Admin
 */
const getNotificationTemplates = asyncHandler(async (req, res) => {
    console.log("📋 Fetching notification templates");

    const templates = {
        appointment: {
            reminder: {
                name: 'Appointment Reminder',
                description: 'Sent before scheduled appointments',
                channels: ['email', 'sms', 'push', 'in-app'],
                variables: ['patientName', 'doctorName', 'appointmentDate', 'appointmentTime', 'appointmentType', 'location'],
                priority: 'medium',
                defaultChannels: ['email', 'sms']
            },
            confirmation: {
                name: 'Appointment Confirmation',
                description: 'Sent when appointment is confirmed',
                channels: ['email', 'sms', 'in-app'],
                variables: ['patientName', 'doctorName', 'appointmentDate', 'appointmentTime', 'confirmationNumber'],
                priority: 'medium',
                defaultChannels: ['email']
            },
            cancellation: {
                name: 'Appointment Cancellation',
                description: 'Sent when appointment is cancelled',
                channels: ['email', 'sms', 'in-app'],
                variables: ['patientName', 'doctorName', 'appointmentDate', 'appointmentTime', 'cancellationReason'],
                priority: 'high',
                defaultChannels: ['email', 'sms']
            }
        },
        prescription: {
            ready: {
                name: 'Prescription Ready',
                description: 'Sent when prescription is ready',
                channels: ['email', 'sms', 'push', 'in-app'],
                variables: ['patientName', 'doctorName', 'prescriptionNumber', 'medications', 'pharmacyName'],
                priority: 'medium',
                defaultChannels: ['email', 'in-app']
            },
            refill: {
                name: 'Prescription Refill Reminder',
                description: 'Sent when prescription needs refill',
                channels: ['email', 'sms', 'in-app'],
                variables: ['patientName', 'medicationName', 'refillDate', 'pharmacyName'],
                priority: 'medium',
                defaultChannels: ['email']
            }
        },
        lab_result: {
            ready: {
                name: 'Lab Result Ready',
                description: 'Sent when lab results are available',
                channels: ['email', 'push', 'in-app'],
                variables: ['patientName', 'testName', 'labResultNumber', 'doctorName'],
                priority: 'medium',
                defaultChannels: ['email', 'in-app']
            },
            critical: {
                name: 'Critical Lab Result Alert',
                description: 'Sent for critical lab results',
                channels: ['email', 'sms', 'push', 'in-app'],
                variables: ['patientName', 'doctorName', 'testName', 'criticalValues', 'urgency'],
                priority: 'urgent',
                defaultChannels: ['email', 'sms', 'push']
            }
        },
        system: {
            welcome: {
                name: 'Welcome Notification',
                description: 'Sent to new users',
                channels: ['email'],
                variables: ['userName', 'welcomeMessage', 'nextSteps'],
                priority: 'low',
                defaultChannels: ['email']
            },
            security: {
                name: 'Security Alert',
                description: 'Sent for security-related events',
                channels: ['email', 'sms', 'in-app'],
                variables: ['userName', 'alertType', 'timestamp', 'actionRequired'],
                priority: 'high',
                defaultChannels: ['email']
            },
            maintenance: {
                name: 'System Maintenance',
                description: 'Sent for scheduled maintenance',
                channels: ['email', 'in-app'],
                variables: ['userName', 'maintenanceDate', 'maintenanceTime', 'duration', 'impact'],
                priority: 'medium',
                defaultChannels: ['email']
            }
        },
        billing: {
            invoice: {
                name: 'Invoice Generated',
                description: 'Sent when new invoice is generated',
                channels: ['email', 'in-app'],
                variables: ['patientName', 'invoiceNumber', 'amount', 'dueDate', 'paymentMethods'],
                priority: 'medium',
                defaultChannels: ['email']
            },
            payment: {
                name: 'Payment Confirmation',
                description: 'Sent when payment is received',
                channels: ['email', 'sms', 'in-app'],
                variables: ['patientName', 'paymentAmount', 'paymentDate', 'invoiceNumber'],
                priority: 'low',
                defaultChannels: ['email']
            }
        }
    };

    console.log('✅ Notification templates fetched successfully');

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { templates },
                "Notification templates fetched successfully"
            )
        );
});

/**
 * @desc    Get notification by ID
 * @route   GET /api/v1/notifications/:notificationId
 * @access  Private
 */
const getNotificationById = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user._id;

    console.log("🔍 Fetching notification details:", notificationId);

    if (!notificationId) {
        throw new ApiError(400, "Notification ID is required");
    }

    const notification = await Notification.findById(notificationId)
        .populate('recipientId', 'firstName lastName email phoneNumber')
        .populate('metadata.appointmentId')
        .populate('metadata.prescriptionId')
        .populate('metadata.labResultId')
        .populate('metadata.paymentId')
        .lean();

    if (!notification) {
        throw new ApiError(404, "Notification not found");
    }

    // Check if user is authorized
    const isRecipient = notification.recipientId?._id.toString() === userId.toString();
    const isRoleRecipient = notification.recipientType === req.user.role;
    const isAllRecipient = notification.recipientType === 'all';
    
    if (!isRecipient && !isRoleRecipient && !isAllRecipient && req.user.role !== 'admin') {
        throw new ApiError(403, "Not authorized to view this notification");
    }

    console.log('✅ Notification details fetched successfully');

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { notification },
                "Notification details fetched successfully"
            )
        );
});

/**
 * @desc    Retry failed notification
 * @route   POST /api/v1/notifications/:notificationId/retry
 * @access  Private/Admin
 */
const retryFailedNotification = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    console.log("🔄 Retrying failed notification:", notificationId);

    if (!notificationId) {
        throw new ApiError(400, "Notification ID is required");
    }

    const notification = await Notification.findById(notificationId);

    if (!notification) {
        throw new ApiError(404, "Notification not found");
    }

    if (notification.status !== 'failed') {
        throw new ApiError(400, "Only failed notifications can be retried");
    }

    if (!notification.canRetry) {
        throw new ApiError(400, "Cannot retry notification - max retries exceeded or not eligible");
    }

    // Use instance method to retry
    await notification.retryDelivery();

    console.log('✅ Notification queued for retry:', notificationId);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { notification },
                "Notification queued for retry successfully"
            )
        );
});

// Export all notification controller functions
export {
    getUserNotifications,
    getUnreadNotifications,
    getUnreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,
    getNotificationPreferences,
    updateNotificationPreferences,
    sendTestNotification,
    createManualNotification,
    getNotificationStatistics,
    getNotificationTemplates,
    getNotificationById,
    retryFailedNotification
};