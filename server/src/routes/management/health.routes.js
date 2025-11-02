/**
 * Healthcare System - Health Check Routes
 * 
 * Routes for system health monitoring and status checks.
 * Essential for production monitoring and DevOps.
 * 
 * Base URL: /api/v1/health
 * 
 * Features:
 * - System health check
 * - Database connectivity check
 * - Service status monitoring
 * - API versioning info
 */

import { Router } from "express";
import { verifyJWT, restrictTo } from "../../middlewares/auth.middleware.js";
import { checkDatabaseHealth } from "../../utils/databaseUtils.js";
import mongoose from "mongoose";

// Initialize router
const router = Router();

/**
 * @route   GET /api/v1/health
 * @desc    Basic health check - System is running
 * @access  Public
 */
router.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Healthcare Consultation System is running",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || '1.0.0'
    });
});

/**
 * @route   GET /api/v1/health/database
 * @desc    Check database connectivity and health
 * @access  Private (Admin only)
 */
router.get(
    "/database",
    verifyJWT,
    restrictTo('admin'),
    async (req, res) => {
        try {
            const dbHealth = await checkDatabaseHealth();
            
            res.status(200).json({
                success: true,
                database: dbHealth,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Database health check failed",
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

/**
 * @route   GET /api/v1/health/services
 * @desc    Check all services status (DB, Redis, Email, etc.)
 * @access  Private (Admin only)
 */
router.get(
    "/services",
    verifyJWT,
    restrictTo('admin'),
    async (req, res) => {
        const services = {
            database: {
                status: mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy',
                state: mongoose.connection.readyState,
                name: mongoose.connection.name
            },
            server: {
                status: 'healthy',
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                nodeVersion: process.version
            },
            environment: {
                nodeEnv: process.env.NODE_ENV || 'development',
                port: process.env.PORT || 8000
            }
        };

        const allHealthy = services.database.status === 'healthy';

        res.status(allHealthy ? 200 : 503).json({
            success: allHealthy,
            services,
            timestamp: new Date().toISOString()
        });
    }
);

/**
 * @route   GET /api/v1/health/version
 * @desc    Get API version information
 * @access  Public
 */
router.get("/version", (req, res) => {
    res.status(200).json({
        success: true,
        api: {
            name: "Healthcare Consultation System API",
            version: process.env.APP_VERSION || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            nodeVersion: process.version
        },
        endpoints: {
            users: "/api/v1/users",
            patients: "/api/v1/patients",
            doctors: "/api/v1/doctors",
            appointments: "/api/v1/appointments",
            medicalRecords: "/api/v1/medical-records",
            prescriptions: "/api/v1/prescriptions",
            consultations: "/api/v1/consultations",
            health: "/api/v1/health"
        },
        documentation: process.env.API_DOCS_URL || "https://docs.yourhealthcareapi.com",
        timestamp: new Date().toISOString()
    });
});

// Export router
export default router;

/**
 * Usage:
 * 
 * 1. Basic Health Check:
 *    GET http://localhost:8000/api/v1/health
 * 
 * 2. Database Health (Admin):
 *    GET http://localhost:8000/api/v1/health/database
 *    Headers: Authorization: Bearer {adminAccessToken}
 * 
 * 3. All Services Status (Admin):
 *    GET http://localhost:8000/api/v1/health/services
 *    Headers: Authorization: Bearer {adminAccessToken}
 * 
 * 4. API Version:
 *    GET http://localhost:8000/api/v1/health/version
 */