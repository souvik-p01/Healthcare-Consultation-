/**
 * Healthcare System - Routes Aggregator
 * 
 * Central file to import and export all route modules.
 * Import this file in app.js to register all routes.
 * 
 * Usage in app.js:
 * import routes from './routes/index.js';
 * app.use('/api/v1', routes);
 */

import { Router } from "express";

// Import all route modules
import userRoutes from "./user.routes.js";
import healthRoutes from "./management/health.routes.js";
import authRoutes from "./auth.routes.js";
import adminRoutes from "./admin.routes.js";
import patientRoutes from "./patient.routes.js";
import paymentRoutes from "./payment.routes.js";
import razorpayRoutes from "./razorpay.routes.js";
import notificationRoutes from "./notification.routes.js";
import equipmentRoutes from "./equipment.routes.js";
import technicianRoutes from "./technician.routes.js";

// Initialize main router
const router = Router();

/**
 * ==========================================
 * HEALTH CHECK ROUTES
 * ==========================================
 * @route   GET /api/v1/health
 * @desc    Health check endpoint for monitoring
 * @access  Public
 */
router.use("/health", healthRoutes);

/**
 * ==========================================
 * AUTHENTICATION ROUTES
 * ==========================================
 * @route   POST /api/v1/auth/register
 * @route   POST /api/v1/auth/login
 * @route   POST /api/v1/auth/google
 * @route   POST /api/v1/auth/refresh-token
 * @route   POST /api/v1/auth/logout
 * @access  Public for register/login, Protected for others
 */
router.use("/auth", authRoutes);

/**
 * ==========================================
 * USER ROUTES
 * ==========================================
 * @route   GET /api/v1/users/me
 * @route   PATCH /api/v1/users/profile
 * @route   POST /api/v1/users/change-password
 * @route   POST /api/v1/users/forgot-password
 * @route   POST /api/v1/users/reset-password
 * @access  Protected for most routes
 */
router.use("/users", userRoutes);

/**
 * ==========================================
 * ADMIN ROUTES
 * ==========================================
 * @route   GET /api/v1/admin/dashboard
 * @route   GET /api/v1/admin/users
 * @route   POST /api/v1/admin/users/:userId/role
 * @route   GET /api/v1/admin/statistics
 * @access  Admin only
 */
router.use("/admin", adminRoutes);

/**
 * ==========================================
 * PATIENT ROUTES
 * ==========================================
 * @route   GET /api/v1/patients/notifications
 * @route   GET /api/v1/patients/appointments
 * @route   GET /api/v1/patients/profile
 * @route   GET /api/v1/patients/dashboard
 * @route   GET /api/v1/patients/medical-history
 * @route   GET /api/v1/patients/prescriptions
 * @route   GET /api/v1/patients/billing
 * @access  Protected - Patient only
 */
router.use("/patients", patientRoutes);

/**
 * ==========================================
 * PAYMENT ROUTES
 * ==========================================
 * @route   POST /api/v1/payments/create-order
 * @route   POST /api/v1/payments/confirm
 * @route   GET /api/v1/payments/history
 * @access  Protected
 */
router.use("/payments", paymentRoutes);

/**
 * ==========================================
 * RAZORPAY DIRECT ROUTES
 * ==========================================
 * @route   POST /api/v1/razorpay/create-order
 * @route   POST /api/v1/razorpay/verify-payment
 * @access  Protected
 */
router.use("/razorpay", razorpayRoutes);

/**
 * ==========================================
 * NOTIFICATION ROUTES
 * ==========================================
 * @route   GET /api/v1/notifications
 * @route   POST /api/v1/notifications/:id/read
 * @route   POST /api/v1/notifications/mark-all-read
 * @access  Protected
 */
router.use("/notifications", notificationRoutes);

/**
 * ==========================================
 * EQUIPMENT ROUTES
 * ==========================================
 * @route   GET /api/v1/equipment
 * @route   POST /api/v1/equipment/book
 * @route   GET /api/v1/equipment/available
 * @access  Protected
 */
router.use("/equipment", equipmentRoutes);

/**
 * ==========================================
 * TECHNICIAN ROUTES
 * ==========================================
 * @route   GET /api/v1/technicians
 * @route   POST /api/v1/technicians/assign
 * @route   GET /api/v1/technicians/:id/schedule
 * @access  Protected
 */
router.use("/technicians", technicianRoutes);

/**
 * ==========================================
 * API ROOT ENDPOINT
 * ==========================================
 * @route   GET /api/v1
 * @desc    API root - Shows available endpoints
 * @access  Public
 */
router.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to Healthcare Consultation System API",
        version: "1.0.0",
        endpoints: {
            health: "/api/v1/health",
            auth: "/api/v1/auth",
            users: "/api/v1/users",
            admin: "/api/v1/admin",
            patients: {
                base: "/api/v1/patients",
                notifications: "/api/v1/patients/notifications",
                appointments: "/api/v1/patients/appointments",
                profile: "/api/v1/patients/profile",
                dashboard: "/api/v1/patients/dashboard",
                medicalHistory: "/api/v1/patients/medical-history",
                prescriptions: "/api/v1/patients/prescriptions",
                billing: "/api/v1/patients/billing"
            },
            payments: "/api/v1/payments",
            razorpay: "/api/v1/razorpay",
            notifications: "/api/v1/notifications",
            equipment: "/api/v1/equipment",
            technicians: "/api/v1/technicians"
        },
        timestamp: new Date().toISOString(),
        documentation: "For more details, visit /api/v1/docs"
    });
});

/**
 * ==========================================
 * HEALTH CHECK ENDPOINT (Additional)
 * ==========================================
 * @route   GET /api/v1/health-check
 * @desc    Simple health check for monitoring services
 * @access  Public
 */
router.get("/health-check", (req, res) => {
    res.status(200).json({
        success: true,
        status: "healthy",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        services: {
            database: "connected",
            redis: "connected", // Add if using Redis
            payment: "available"
        }
    });
});

/**
 * ==========================================
 * 404 HANDLER FOR API ROUTES
 * ==========================================
 * Catches any undefined routes under /api/v1
 * This will be triggered if no route matches
 */
router.use("*", (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
        suggestion: "Check the available endpoints at /api/v1",
        timestamp: new Date().toISOString(),
        requestId: req.requestId
    });
});

export default router;