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

// Import all route modules that exist
import userRoutes from "./user.routes.js";
import healthRoutes from "./management/health.routes.js";

// Routes that will be added later (commented out for now)
import patientRoutes from "./patient.routes.js";
import doctorRoutes from "./history/doctor.routes.js";
import appointmentRoutes from "./history/appointment.routes.js";
import medicalRecordRoutes from "./management/medical-record.routes.js";
import prescriptionRoutes from "./management/prescription.routes.js";
import consultationRoutes from "./management/consultation.routes.js";
import adminRoutes from "./admin.routes.js";

// Initialize main router
const router = Router();

/**
 * ==========================================
 * REGISTER ALL ROUTES
 * ==========================================
 * 
 * All routes are prefixed with /api/v1
 * Example: /api/v1/users, /api/v1/health, etc.
 */

// Health check routes (should be first for monitoring)
router.use("/health", healthRoutes);

// User authentication and management routes
router.use("/users", userRoutes);

// Patient management routes (add when patient.routes.js is created)
// router.use("/patients", patientRoutes);

// Doctor management routes (add when doctor.routes.js is created)
// router.use("/doctors", doctorRoutes);

// Appointment booking and management routes
// router.use("/appointments", appointmentRoutes);

// Medical records routes
// router.use("/medical-records", medicalRecordRoutes);

// Prescription management routes
// router.use("/prescriptions", prescriptionRoutes);

// Consultation session routes
// router.use("/consultations", consultationRoutes);

// Admin panel routes
// router.use("/admin", adminRoutes);

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
        documentation: process.env.API_DOCS_URL || "https://docs.yourhealthcareapi.com",
        endpoints: {
            health: {
                base: "/api/v1/health",
                description: "System health check and monitoring",
                methods: ["GET"],
                status: "✅ Active"
            },
            users: {
                base: "/api/v1/users",
                description: "User authentication and profile management",
                methods: ["GET", "POST", "PATCH"],
                subRoutes: [
                    "POST /register - Register new user",
                    "POST /login - User login",
                    "POST /logout - User logout (Auth required)",
                    "GET /current - Get current user (Auth required)",
                    "GET /doctors - Get all doctors",
                    "PATCH /update-account - Update account (Auth required)",
                    "PATCH /avatar - Update avatar (Auth required)",
                    "POST /change-password - Change password (Auth required)",
                    "POST /refresh-token - Refresh access token",
                    "GET /profile/:userId - Get user profile"
                ],
                status: "✅ Active"
            },
            patients: {
                base: "/api/v1/patients",
                description: "Patient profile and medical history management",
                methods: ["GET", "POST", "PATCH"],
                status: "🔜 Coming soon"
            },
            doctors: {
                base: "/api/v1/doctors",
                description: "Doctor profile and schedule management",
                methods: ["GET", "POST", "PATCH"],
                status: "🔜 Coming soon"
            },
            appointments: {
                base: "/api/v1/appointments",
                description: "Appointment booking and management",
                methods: ["GET", "POST", "PATCH", "DELETE"],
                status: "🔜 Coming soon"
            },
            medicalRecords: {
                base: "/api/v1/medical-records",
                description: "Medical records and patient history",
                methods: ["GET", "POST", "PATCH", "DELETE"],
                status: "🔜 Coming soon"
            },
            prescriptions: {
                base: "/api/v1/prescriptions",
                description: "Prescription management",
                methods: ["GET", "POST", "PATCH", "DELETE"],
                status: "🔜 Coming soon"
            },
            consultations: {
                base: "/api/v1/consultations",
                description: "Consultation session management",
                methods: ["GET", "POST", "PATCH"],
                status: "🔜 Coming soon"
            }
        },
        support: {
            email: process.env.SUPPORT_EMAIL || "support@healthcare.com",
            website: process.env.WEBSITE_URL || "https://yourhealthcare.com"
        },
        timestamp: new Date().toISOString()
    });
});

/**
 * ==========================================
 * 404 HANDLER FOR UNDEFINED API ROUTES
 * ==========================================
 * 
 * This catches all undefined routes under /api/v1
 */
router.use("*", (req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found",
        requestedUrl: req.originalUrl,
        availableEndpoints: "/api/v1",
        documentation: process.env.API_DOCS_URL || "https://docs.yourhealthcareapi.com",
        timestamp: new Date().toISOString()
    });
});

// Export main router
export default router;

/**
 * ==========================================
 * ACTIVE ROUTES (2)
 * ==========================================
 * 
 * 1. Health Routes (/api/v1/health)
 *    - GET /              → Health check
 *    - GET /database      → Database health (Admin)
 *    - GET /services      → All services (Admin)
 *    - GET /version       → API version
 * 
 * 2. User Routes (/api/v1/users)
 *    - POST /register         → Register user
 *    - POST /login            → Login
 *    - POST /logout           → Logout (Auth)
 *    - POST /refresh-token    → Refresh token
 *    - GET  /current          → Get current user (Auth)
 *    - GET  /profile/:userId  → Get user profile
 *    - GET  /doctors          → Get all doctors
 *    - POST /change-password  → Change password (Auth)
 *    - PATCH /update-account  → Update account (Auth)
 *    - PATCH /avatar          → Update avatar (Auth)
 * 
 * Total Active Endpoints: 14
 * 
 * ==========================================
 * TESTING
 * ==========================================
 * 
 * Test the routes:
 * 
 * 1. Get API info:
 *    GET http://localhost:8000/api/v1
 * 
 * 2. Health check:
 *    GET http://localhost:8000/api/v1/health
 * 
 * 3. Register user:
 *    POST http://localhost:8000/api/v1/users/register
 * 
 * 4. Test 404:
 *    GET http://localhost:8000/api/v1/nonexistent
 */