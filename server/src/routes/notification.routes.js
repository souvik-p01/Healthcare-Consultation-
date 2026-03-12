import express from 'express';
import { verifyJWT, restrictTo } from '../middlewares/auth.middleware.js';
import {
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
} from '../controllers/notification.controller.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyJWT);

// Public routes (for all authenticated users)
router.route('/')
    .get(getUserNotifications);

router.route('/unread')
    .get(getUnreadNotifications);

router.route('/unread-count')
    .get(getUnreadNotificationsCount);

router.route('/preferences')
    .get(getNotificationPreferences)
    .patch(updateNotificationPreferences);

router.route('/test')
    .post(sendTestNotification);

// Static routes MUST come before parameterized routes
router.route('/mark-all-read')
    .patch(markAllNotificationsAsRead);

router.route('/clear-all')
    .delete(clearAllNotifications);

// Notification-specific routes
router.route('/:notificationId')
    .get(getNotificationById)
    .delete(deleteNotification);

router.route('/:notificationId/read')
    .patch(markNotificationAsRead);

// Admin-only routes
router.route('/manual')
    .post(restrictTo('admin'), createManualNotification);

router.route('/statistics')
    .get(restrictTo('admin'), getNotificationStatistics);

router.route('/templates')
    .get(restrictTo('admin'), getNotificationTemplates);

router.route('/:notificationId/retry')
    .post(restrictTo('admin'), retryFailedNotification);

export default router;