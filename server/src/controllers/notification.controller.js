/**
 * Healthcare System - Notification Controller
 * 
 * Handles notification management for healthcare system.
 * 
 * Features:
 * - Real-time notifications
 * - Email notifications
 * - SMS notifications
 * - Push notifications
 * - Notification templates
 * - Multi-channel delivery
 * - Notification preferences
 * - Notification history
 */

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Notification } from "../models/notification.model.js";
import { User } from "../models/User.model.js";
import { Patient } from "../models/Patient.model.js";
import { Doctor } from "../models/doctor.model.js";
import { Appointment } from "../models/appointment.model.js";
import { 
    sendEmailNotification,
    sendSMSNotification,
    sendPushNotification 
} from "../utils/notificationUtils.js";

/**
 * GET USER NOTIFICATIONS
 * Get all notifications for the current user
 * 
 * GET /api/v1/notifications
 * Requires: verifyJWT middleware
 */
const getUserNotifications = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const {
        type,
        status,
        priority,
        isRead,
        dateFrom,
        dateTo,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;

    console.log("🔔 Fetching notifications for user:", userId);

    // Build query
    const query = { userId };
    
    if (type) query.type = type;
    if (status) query.status = status;
    if (priority) query.priority = priority;
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
        .populate({
            path: 'relatedEntityId',
            select: 'appointmentNumber prescriptionNumber labResultNumber'
        })
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

    const total = await Notification.countDocuments(query);
    
    // Get unread count for badge
    const unreadCount = await Notification.countDocuments({ 
        userId, 
        isRead: false 
    });

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
 * GET UNREAD NOTIFICATIONS COUNT
 * Get count of unread notifications for the current user
 * 
 * GET /api/v1/notifications/unread-count
 * Requires: verifyJWT middleware
 */
const getUnreadNotificationsCount = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    console.log("📊 Fetching unread notifications count for user:", userId);

    const unreadCount = await Notification.countDocuments({ 
        userId, 
        isRead: false 
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
 * MARK NOTIFICATION AS READ
 * Mark a single notification as read
 * 
 * PATCH /api/v1/notifications/:notificationId/read
 * Requires: verifyJWT middleware
 */
const markNotificationAsRead = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user._id;

    console.log("📖 Marking notification as read:", notificationId);

    if (!notificationId) {
        throw new ApiError(400, "Notification ID is required");
    }

    // Find notification and verify ownership
    const notification = await Notification.findOne({
        _id: notificationId,
        userId
    });

    if (!notification) {
        throw new ApiError(404, "Notification not found");
    }

    // Update notification
    const updatedNotification = await Notification.findByIdAndUpdate(
        notificationId,
        {
            $set: {
                isRead: true,
                readAt: new Date(),
                updatedAt: new Date()
            }
        },
        { new: true, runValidators: true }
    )
    .populate({
        path: 'relatedEntityId',
        select: 'appointmentNumber prescriptionNumber labResultNumber'
    })
    .lean();

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
 * MARK ALL NOTIFICATIONS AS READ
 * Mark all user notifications as read
 * 
 * PATCH /api/v1/notifications/mark-all-read
 * Requires: verifyJWT middleware
 */
const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    console.log("📚 Marking all notifications as read for user:", userId);

    // Update all unread notifications for the user
    const result = await Notification.updateMany(
        {
            userId,
            isRead: false
        },
        {
            $set: {
                isRead: true,
                readAt: new Date(),
                updatedAt: new Date()
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
 * DELETE NOTIFICATION
 * Delete a specific notification
 * 
 * DELETE /api/v1/notifications/:notificationId
 * Requires: verifyJWT middleware
 */
const deleteNotification = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user._id;

    console.log("🗑 Deleting notification:", notificationId);

    if (!notificationId) {
        throw new ApiError(400, "Notification ID is required");
    }

    // Find notification and verify ownership
    const notification = await Notification.findOne({
        _id: notificationId,
        userId
    });

    if (!notification) {
        throw new ApiError(404, "Notification not found");
    }

    // Delete notification
    await Notification.findByIdAndDelete(notificationId);

    console.log('✅ Notification deleted:', notificationId);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Notification deleted successfully"
            )
        );
});

/**
 * CLEAR ALL NOTIFICATIONS
 * Delete all notifications for the current user
 * 
 * DELETE /api/v1/notifications/clear-all
 * Requires: verifyJWT middleware
 */
const clearAllNotifications = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    console.log("🧹 Clearing all notifications for user:", userId);

    // Delete all notifications for the user
    const result = await Notification.deleteMany({ userId });

    console.log(`✅ Cleared ${result.deletedCount} notifications`);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { 
                    deletedCount: result.deletedCount,
                    message: `Cleared ${result.deletedCount} notifications`
                },
                "All notifications cleared successfully"
            )
        );
});

/**
 * GET NOTIFICATION PREFERENCES
 * Get user's notification preferences
 * 
 * GET /api/v1/notifications/preferences
 * Requires: verifyJWT middleware
 */
const getNotificationPreferences = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    console.log("⚙ Fetching notification preferences for user:", userId);

    const user = await User.findById(userId)
        .select('notificationPreferences email phoneNumber')
        .lean();

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Default preferences if not set
    const defaultPreferences = {
        email: {
            appointments: true,
            prescriptions: true,
            labResults: true,
            reminders: true,
            promotions: false,
            security: true
        },
        sms: {
            appointments: true,
            reminders: true,
            criticalAlerts: true
        },
        push: {
            appointments: true,
            messages: true,
            reminders: true
        },
        frequency: 'immediate',
        quietHours: {
            enabled: false,
            start: '22:00',
            end: '07:00'
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
 * UPDATE NOTIFICATION PREFERENCES
 * Update user's notification preferences
 * 
 * PATCH /api/v1/notifications/preferences
 * Requires: verifyJWT middleware
 */
const updateNotificationPreferences = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const {
        email,
        sms,
        push,
        frequency,
        quietHours
    } = req.body;

    console.log("⚙ Updating notification preferences for user:", userId);

    // Build update object
    const updateData = {
        notificationPreferences: {}
    };

    if (email) updateData.notificationPreferences.email = email;
    if (sms) updateData.notificationPreferences.sms = sms;
    if (push) updateData.notificationPreferences.push = push;
    if (frequency) updateData.notificationPreferences.frequency = frequency;
    if (quietHours) updateData.notificationPreferences.quietHours = quietHours;

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
 * SEND TEST NOTIFICATION
 * Send a test notification to the current user
 * 
 * POST /api/v1/notifications/test
 * Requires: verifyJWT middleware
 */
const sendTestNotification = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { type = 'email', message = 'This is a test notification' } = req.body;

    console.log("🧪 Sending test notification to user:", userId, "type:", type);

    const user = await User.findById(userId)
        .select('email phoneNumber firstName notificationPreferences')
        .lean();

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    let testResult = {
        sent: false,
        type: type,
        message: ''
    };

    try {
        switch (type) {
            case 'email':
                if (user.email) {
                    await sendEmailNotification(user.email, {
                        subject: 'Test Notification - Healthcare System',
                        template: 'test',
                        data: {
                            userName: user.firstName,
                            message: message,
                            timestamp: new Date().toLocaleString()
                        }
                    });
                    testResult.sent = true;
                    testResult.message = 'Test email notification sent successfully';
                } else {
                    testResult.message = 'User does not have an email address';
                }
                break;

            case 'sms':
                if (user.phoneNumber) {
                    await sendSMSNotification(user.phoneNumber, {
                        message: `Test: ${message}`,
                        type: 'test'
                    });
                    testResult.sent = true;
                    testResult.message = 'Test SMS notification sent successfully';
                } else {
                    testResult.message = 'User does not have a phone number';
                }
                break;

            case 'push':
                await sendPushNotification(userId, {
                    title: 'Test Notification',
                    body: message,
                    type: 'test',
                    data: { test: true }
                });
                testResult.sent = true;
                testResult.message = 'Test push notification sent successfully';
                break;

            default:
                testResult.message = `Unsupported notification type: ${type}`;
        }

        // Create a notification record for the test
        if (testResult.sent) {
            await Notification.create({
                userId,
                type: 'system',
                title: 'Test Notification',
                message: message,
                priority: 'low',
                channel: type,
                status: 'sent',
                isRead: false,
                metadata: {
                    test: true,
                    timestamp: new Date()
                }
            });
        }

    } catch (error) {
        console.error('❌ Test notification failed:', error);
        testResult.message = `Test notification failed: ${error.message}`;
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
 * CREATE MANUAL NOTIFICATION
 * Create and send a manual notification (admin only)
 * 
 * POST /api/v1/notifications/manual
 * Requires: verifyJWT middleware, admin role
 */
const createManualNotification = asyncHandler(async (req, res) => {
    const {
        userIds,
        userRole,
        title,
        message,
        type = 'system',
        priority = 'normal',
        channels = ['email'],
        relatedEntityType,
        relatedEntityId,
        scheduledAt
    } = req.body;

    const createdBy = req.user._id;

    console.log("📢 Creating manual notification for users:", userIds || userRole);

    // Validation
    if (!title || !message) {
        throw new ApiError(400, "Title and message are required");
    }

    if (!userIds && !userRole) {
        throw new ApiError(400, "Either userIds or userRole is required");
    }

    // Build user query
    let userQuery = {};
    if (userIds && Array.isArray(userIds)) {
        userQuery._id = { $in: userIds };
    } else if (userRole) {
        userQuery.role = userRole;
    }

    // Get target users
    const users = await User.find(userQuery)
        .select('_id email phoneNumber firstName lastName notificationPreferences')
        .lean();

    if (!users || users.length === 0) {
        throw new ApiError(404, "No users found matching the criteria");
    }

    const notificationResults = {
        totalUsers: users.length,
        notificationsCreated: 0,
        emailsSent: 0,
        smsSent: 0,
        pushSent: 0,
        errors: []
    };

    // Create notifications for each user
    for (const user of users) {
        try {
            // Create notification record
            const notification = await Notification.create({
                userId: user._id,
                type,
                title,
                message,
                priority,
                channel: channels.join(','),
                status: 'pending',
                relatedEntityType,
                relatedEntityId,
                scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
                createdBy,
                metadata: {
                    manual: true,
                    targetUser: user._id
                }
            });

            notificationResults.notificationsCreated++;

            // Send notifications based on channels and user preferences
            const userPrefs = user.notificationPreferences || {};

            for (const channel of channels) {
                try {
                    switch (channel) {
                        case 'email':
                            if (userPrefs.email?.system !== false && user.email) {
                                await sendEmailNotification(user.email, {
                                    subject: title,
                                    template: 'manual',
                                    data: {
                                        userName: user.firstName,
                                        message: message,
                                        title: title
                                    }
                                });
                                notificationResults.emailsSent++;
                            }
                            break;

                        case 'sms':
                            if (userPrefs.sms?.system !== false && user.phoneNumber) {
                                await sendSMSNotification(user.phoneNumber, {
                                    message: `${title}: ${message}`,
                                    type: 'manual'
                                });
                                notificationResults.smsSent++;
                            }
                            break;

                        case 'push':
                            if (userPrefs.push?.system !== false) {
                                await sendPushNotification(user._id, {
                                    title: title,
                                    body: message,
                                    type: type,
                                    data: { notificationId: notification._id }
                                });
                                notificationResults.pushSent++;
                            }
                            break;
                    }

                    // Update notification status to sent
                    await Notification.findByIdAndUpdate(notification._id, {
                        status: 'sent',
                        sentAt: new Date()
                    });

                } catch (channelError) {
                    console.error(`❌ Channel ${channel} failed for user ${user._id}:, channelError`);
                    notificationResults.errors.push({
                        userId: user._id,
                        channel: channel,
                        error: channelError.message
                    });

                    // Update notification status to failed
                    await Notification.findByIdAndUpdate(notification._id, {
                        status: 'failed',
                        error: channelError.message
                    });
                }
            }

        } catch (userError) {
            console.error(`❌ Notification creation failed for user ${user._id}:, userError`);
            notificationResults.errors.push({
                userId: user._id,
                error: userError.message
            });
        }
    }

    console.log(`✅ Manual notification created for ${notificationResults.notificationsCreated} users`);

    return res.status(201).json(
        new ApiResponse(
            201, 
            { results: notificationResults },
            "Manual notifications created and sent successfully"
        )
    );
});

/**
 * GET NOTIFICATION STATISTICS
 * Get notification statistics for dashboard
 * 
 * GET /api/v1/notifications/statistics
 * Requires: verifyJWT middleware, admin role
 */
const getNotificationStatistics = asyncHandler(async (req, res) => {
    const { period = 'month', type, channel, status } = req.query;

    console.log("📊 Fetching notification statistics");

    // Date range based on period
    const dateRange = {};
    const now = new Date();
    
    switch (period) {
        case 'day':
            dateRange.$gte = new Date(now.setHours(0, 0, 0, 0));
            dateRange.$lte = new Date(now.setHours(23, 59, 59, 999));
            break;
        case 'week':
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            dateRange.$gte = startOfWeek;
            dateRange.$lte = new Date();
            break;
        case 'month':
            dateRange.$gte = new Date(now.getFullYear(), now.getMonth(), 1);
            dateRange.$lte = new Date();
            break;
        case 'year':
            dateRange.$gte = new Date(now.getFullYear(), 0, 1);
            dateRange.$lte = new Date();
            break;
        default:
            dateRange.$gte = new Date(now.getFullYear(), now.getMonth(), 1);
            dateRange.$lte = new Date();
    }

    const query = { createdAt: dateRange };
    if (type) query.type = type;
    if (channel) query.channel = channel;
    if (status) query.status = status;

    // Get statistics
    const totalNotifications = await Notification.countDocuments(query);

    const typeStats = await Notification.aggregate([
        { $match: query },
        { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    const channelStats = await Notification.aggregate([
        { $match: query },
        { $group: { _id: '$channel', count: { $sum: 1 } } }
    ]);

    const statusStats = await Notification.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const priorityStats = await Notification.aggregate([
        { $match: query },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    const monthlyTrend = await Notification.aggregate([
        { $match: query },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
    ]);

    const statistics = {
        period,
        totalNotifications,
        byType: typeStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {}),
        byChannel: channelStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {}),
        byStatus: statusStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {}),
        byPriority: priorityStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {}),
        monthlyTrend: monthlyTrend.map(item => ({
            period: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
            count: item.count
        })),
        deliveryRate: {
            sent: statusStats.find(stat => stat._id === 'sent')?.count || 0,
            failed: statusStats.find(stat => stat._id === 'failed')?.count || 0,
            pending: statusStats.find(stat => stat._id === 'pending')?.count || 0
        },
        dateRange: {
            from: dateRange.$gte,
            to: dateRange.$lte
        }
    };

    // Calculate delivery success rate
    const totalDelivered = statistics.deliveryRate.sent + statistics.deliveryRate.failed;
    statistics.deliveryRate.successRate = totalDelivered > 0 
        ? (statistics.deliveryRate.sent / totalDelivered * 100).toFixed(2)
        : 0;

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
 * GET NOTIFICATION TEMPLATES
 * Get available notification templates
 * 
 * GET /api/v1/notifications/templates
 * Requires: verifyJWT middleware, admin role
 */
const getNotificationTemplates = asyncHandler(async (req, res) => {
    console.log("📋 Fetching notification templates");

    const templates = {
        appointment: {
            reminder: {
                name: 'Appointment Reminder',
                description: 'Sent before scheduled appointments',
                channels: ['email', 'sms', 'push'],
                variables: ['patientName', 'doctorName', 'appointmentDate', 'appointmentTime', 'appointmentType']
            },
            confirmation: {
                name: 'Appointment Confirmation',
                description: 'Sent when appointment is confirmed',
                channels: ['email', 'sms'],
                variables: ['patientName', 'doctorName', 'appointmentDate', 'appointmentTime']
            },
            cancellation: {
                name: 'Appointment Cancellation',
                description: 'Sent when appointment is cancelled',
                channels: ['email', 'sms'],
                variables: ['patientName', 'doctorName', 'appointmentDate', 'cancellationReason']
            }
        },
        prescription: {
            ready: {
                name: 'Prescription Ready',
                description: 'Sent when prescription is ready',
                channels: ['email', 'sms', 'push'],
                variables: ['patientName', 'doctorName', 'prescriptionNumber', 'medications']
            },
            refill: {
                name: 'Prescription Refill Reminder',
                description: 'Sent when prescription needs refill',
                channels: ['email', 'sms'],
                variables: ['patientName', 'medicationName', 'refillDate']
            }
        },
        lab_result: {
            ready: {
                name: 'Lab Result Ready',
                description: 'Sent when lab results are available',
                channels: ['email', 'push'],
                variables: ['patientName', 'testName', 'labResultNumber']
            },
            critical: {
                name: 'Critical Lab Result Alert',
                description: 'Sent for critical lab results',
                channels: ['email', 'sms', 'push'],
                variables: ['patientName', 'doctorName', 'testName', 'criticalValues']
            }
        },
        system: {
            welcome: {
                name: 'Welcome Notification',
                description: 'Sent to new users',
                channels: ['email'],
                variables: ['userName', 'welcomeMessage']
            },
            security: {
                name: 'Security Alert',
                description: 'Sent for security-related events',
                channels: ['email', 'sms'],
                variables: ['userName', 'alertType', 'timestamp']
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

// Export all notification controller functions
export {
    getUserNotifications,
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
    getNotificationTemplates
};

/**
 * Additional notification controllers that can be added:
 * - getNotificationById (get specific notification details)
 * - resendFailedNotification (retry failed notifications)
 * - bulkDeleteNotifications (delete multiple notifications)
 * - getNotificationLogs (detailed delivery logs)
 * - updateNotificationTemplate (manage templates)
 * - scheduleNotification (future-dated notifications)
 * - getNotificationAnalytics (advanced analytics)
 * - subscribeToPush (push notification subscription)
 */