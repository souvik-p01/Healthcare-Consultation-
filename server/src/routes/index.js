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

// Health check routes
router.use("/health", healthRoutes);

// Auth routes
router.use("/auth", authRoutes);

// User routes
router.use("/users", userRoutes);

// Admin routes
router.use("/admin", adminRoutes);

// Patient routes
router.use("/patients", patientRoutes);

// Payment routes
router.use("/payments", paymentRoutes);

// Razorpay direct routes (create-order, verify-payment)
router.use("/razorpay", razorpayRoutes);

// Notification routes
router.use("/notifications", notificationRoutes);

// Equipment routes
router.use("/equipment", equipmentRoutes);

// Technician routes
router.use("/technicians", technicianRoutes);

/**
 * ==========================================
 * API ROOT ENDPOINT
 * ==========================================
 * 
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
            health:        "/api/v1/health",
            auth:          "/api/v1/auth",
            users:         "/api/v1/users",
            admin:         "/api/v1/admin",
            patients:      "/api/v1/patients",
            payments:      "/api/v1/payments",
            razorpay:      "/api/v1/razorpay",
            notifications: "/api/v1/notifications",
            equipment:     "/api/v1/equipment",
            technicians:   "/api/v1/technicians",
        },
        timestamp: new Date().toISOString()
    });
});

router.use("*", (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
        timestamp: new Date().toISOString()
    });
});

export default router;