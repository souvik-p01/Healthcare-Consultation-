/**
 * Healthcare Consultation System - Main Entry Point
 * 
 * This file serves as the main entry point for the healthcare consultation backend.
 * It handles environment configuration, database connection, and server startup
 * with comprehensive error handling and graceful shutdown capabilities.
 * 
 * Features:
 * - Environment variables configuration
 * - MongoDB database connection with retry logic
 * - Express server initialization
 * - Comprehensive error handling
 * - Graceful shutdown handling (SIGTERM, SIGINT)
 * - Uncaught exception and rejection handling
 * - Healthcare system health monitoring
 * - Payment gateway integration (Razorpay)
 * - HIPAA-compliant logging
 * - Audit trail for sensitive operations
 */

// ==========================================
// IMPORT DEPENDENCIES
// ==========================================

// Import environment configuration FIRST (must be before other imports)
import dotenv from "dotenv";

// Configure environment variables from .env file
// This MUST be at the top before any other imports that need env variables
dotenv.config({
    path: './.env'
});

// Import core dependencies
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";

// Import routes
import patientRoutes from "./routes/patient.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import razorpayRoutes from "./routes/razorpay.routes.js";

// Import middleware
import { errorHandler } from "./middlewares/error.middleware.js";

// Import database utilities
import connectDB, { checkDBHealth, getDBStats, initializeDatabase } from "./config/database.js";

// Import logger
import { LoggerUtils } from "./utils/logger.js";

// ==========================================
// EXPRESS APP CONFIGURATION
// ==========================================

// Create Express application
const app = express();

// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "x-refresh-token"]
}));

// Body parsing middleware
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// Static files middleware
app.use(express.static("public"));

// Request logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        LoggerUtils.logApiRequest(req, res, duration);
    });
    next();
});

// ==========================================
// ROUTES CONFIGURATION
// ==========================================

// Health check endpoint
app.get("/api/v1/health", async (req, res) => {
    const dbHealth = checkDBHealth();
    const uptime = process.uptime();
    
    res.status(200).json({
        success: true,
        message: "Healthcare Consultation System is running healthy",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        database: dbHealth,
        system: {
            uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
            memory: process.memoryUsage(),
            nodeVersion: process.version,
            platform: process.platform
        }
    });
});

// Detailed health check for monitoring systems
app.get("/api/v1/health/detailed", async (req, res) => {
    const dbHealth = checkDBHealth();
    let dbStats = null;
    
    try {
        dbStats = await getDBStats();
    } catch (error) {
        LoggerUtils.error('Failed to get DB stats', error);
    }
    
    res.status(200).json({
        success: true,
        timestamp: new Date().toISOString(),
        services: {
            api: { status: 'healthy', latency: 'OK' },
            database: dbHealth,
            storage: dbStats ? 'healthy' : 'degraded'
        },
        metrics: {
            uptime: process.uptime(),
            totalRequests: app.locals.totalRequests || 0,
            activeConnections: mongoose.connection.readyState === 1 ? 1 : 0
        }
    });
});

// API information endpoint
app.get("/api/v1", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to Healthcare Consultation System API",
        version: "1.0.0",
        documentation: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/docs`,
        endpoints: {
            auth: "/api/v1/auth",
            users: "/api/v1/users",
            patients: "/api/v1/patients",
            admin: "/api/v1/admin",
            payments: "/api/v1/payments"
        }
    });
});

// Root route handler
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Healthcare Consultation System API",
        version: "1.0.0",
        endpoints: {
            health: "/api/v1/health",
            api: "/api/v1",
            users: "/api/v1/users",
            patients: "/api/v1/patients",
            admin: "/api/v1/admin",
            payments: "/api/v1/payments"
        }
    });
});

// Main API routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/patients", patientRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api", razorpayRoutes); // Simple Razorpay endpoints for backward compatibility

// 404 handler for undefined routes
app.use((req, res) => {
    LoggerUtils.warn(`Route not found: ${req.method} ${req.originalUrl}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`,
        suggestion: "Check the API documentation for available endpoints",
        availableEndpoints: [
            "GET /api/v1/health",
            "GET /api/v1",
            "POST /api/v1/auth/register",
            "POST /api/v1/auth/login",
            "GET /api/v1/users/profile",
            "GET /api/v1/patients",
            "GET /api/v1/admin/dashboard",
            "POST /api/v1/payments/create-order",
            "POST /api/v1/payments/confirm"
        ]
    });
});

// Global error handling middleware - MUST be after all routes
app.use(errorHandler);

// Export the app for testing and server startup
export { app };

// ==========================================
// SERVER CONFIGURATION
// ==========================================

// Define the port for the healthcare system server
const PORT = process.env.PORT || 8000;

// Server startup timestamp
const SERVER_START_TIME = new Date();

// Retry configuration for database connection
const DB_RETRY_CONFIG = {
    maxRetries: parseInt(process.env.DB_MAX_RETRIES) || 5,
    retryDelay: parseInt(process.env.DB_RETRY_DELAY) || 5000, // 5 seconds
    currentRetry: 0
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Log server startup information
 */
const logServerInfo = () => {
    const dbHealth = checkDBHealth();
    
    console.log('\n' + '='.repeat(70));
    console.log('🏥 HEALTHCARE CONSULTATION SYSTEM');
    console.log('='.repeat(70));
    console.log("🚀 Server started successfully");
    console.log(`🌐 Server URL: http://localhost:${PORT}`);
    console.log(`📊 Database: ${dbHealth.database} (${dbHealth.status})`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📅 Started at: ${SERVER_START_TIME.toLocaleString()}`);
    console.log(`⏱  Uptime: 0 seconds`);
    console.log(`💳 Payment Gateway: Razorpay ${process.env.RAZORPAY_KEY_ID ? 'Configured' : 'Not Configured'}`);
    console.log('='.repeat(70));
    console.log('✅ Available Endpoints:');
    console.log('   - GET  http://localhost:' + PORT + '/api/v1/health');
    console.log('   - GET  http://localhost:' + PORT + '/api/v1');
    console.log('   - POST http://localhost:' + PORT + '/api/v1/auth/register');
    console.log('   - POST http://localhost:' + PORT + '/api/v1/auth/login');
    console.log('   - GET  http://localhost:' + PORT + '/api/v1/patients');
    console.log('   - GET  http://localhost:' + PORT + '/api/v1/admin/dashboard');
    console.log('   - POST http://localhost:' + PORT + '/api/v1/payments/create-order');
    console.log('   - POST http://localhost:' + PORT + '/api/v1/payments/confirm');
    console.log('='.repeat(70) + '\n');

    // Log to file as well
    LoggerUtils.info('Server started', {
        port: PORT,
        environment: process.env.NODE_ENV,
        database: dbHealth.database
    });
};

/**
 * Log server shutdown information
 */
const logServerShutdown = (reason) => {
    const uptime = Math.floor((Date.now() - SERVER_START_TIME.getTime()) / 1000);
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;
    
    console.log('\n' + '='.repeat(70));
    console.log('🛑 HEALTHCARE SYSTEM SHUTDOWN');
    console.log('='.repeat(70));
    console.log(`📋 Reason: ${reason}`);
    console.log(`⏱  Total uptime: ${hours}h ${minutes}m ${seconds}s`);
    console.log(`📅 Shutdown at: ${new Date().toLocaleString()}`);
    console.log('='.repeat(70) + '\n');

    // Log to file as well
    LoggerUtils.warn('Server shutdown', { reason, uptime });
};

/**
 * Check if all required environment variables are present
 */
const checkRequiredEnvVars = () => {
    const requiredVars = [
        'MONGODB_URI',
        'ACCESS_TOKEN_SECRET',
        'REFRESH_TOKEN_SECRET',
        'RAZORPAY_KEY_ID',
        'RAZORPAY_KEY_SECRET'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
        console.error('❌ Missing required environment variables:');
        missingVars.forEach(varName => {
            console.error(`   - ${varName}`);
        });
        console.error('\n💡 Please check your .env file and ensure all required variables are set.');
        
        LoggerUtils.error('Missing required environment variables', { missingVars });
        return false;
    }

    console.log('✅ All required environment variables are present');
    
    // Mask sensitive data in logs
    LoggerUtils.info('Environment variables validated', {
        hasMongoURI: !!process.env.MONGODB_URI,
        hasAccessToken: !!process.env.ACCESS_TOKEN_SECRET,
        hasRefreshToken: !!process.env.REFRESH_TOKEN_SECRET,
        hasRazorpayKey: !!process.env.RAZORPAY_KEY_ID,
        razorpayKeyPrefix: process.env.RAZORPAY_KEY_ID ? process.env.RAZORPAY_KEY_ID.substring(0, 8) + '...' : null
    });
    
    return true;
};

/**
 * Display warning for optional missing environment variables
 */
const checkOptionalEnvVars = () => {
    const optionalVars = {
        'CLOUDINARY_CLOUD_NAME': 'File uploads to Cloudinary',
        'CLOUDINARY_API_KEY': 'File uploads to Cloudinary',
        'CLOUDINARY_API_SECRET': 'File uploads to Cloudinary',
        'EMAIL_SERVICE': 'Email notifications',
        'EMAIL_USER': 'Email notifications',
        'EMAIL_PASS': 'Email notifications',
        'CORS_ORIGIN': 'CORS configuration',
        'FRONTEND_URL': 'Frontend application URL'
    };

    const missingOptional = [];

    for (const [varName, feature] of Object.entries(optionalVars)) {
        if (!process.env[varName]) {
            missingOptional.push({ varName, feature });
        }
    }

    if (missingOptional.length > 0) {
        console.warn('\n⚠  Optional environment variables not set:');
        missingOptional.forEach(({ varName, feature }) => {
            console.warn(`   - ${varName} (${feature})`);
        });
        console.warn('   These features will not be available until configured.\n');
        
        LoggerUtils.warn('Optional environment variables missing', { 
            missing: missingOptional.map(v => v.varName) 
        });
    }
};

// ==========================================
// SERVER INITIALIZATION
// ==========================================

/**
 * Initialize and start the healthcare server
 * 
 * Steps:
 * 1. Check environment variables
 * 2. Connect to database (with retry)
 * 3. Initialize database collections and indexes
 * 4. Start Express server
 * 5. Set up error handlers
 * 6. Set up graceful shutdown handlers
 */
const startServer = async () => {
    try {
        console.log('\n🏥 Initializing Healthcare Consultation System...\n');
        
        // Step 1: Check environment variables
        console.log('📋 Checking environment configuration...');
        const hasRequiredVars = checkRequiredEnvVars();
        
        if (!hasRequiredVars) {
            console.error('\n❌ Cannot start server without required environment variables');
            LoggerUtils.emergency('Server startup failed - missing required environment variables');
            process.exit(1);
        }
        
        // Check optional variables (warnings only)
        checkOptionalEnvVars();
        
        // Step 2: Connect to MongoDB database with retry logic
        console.log('\n📊 Connecting to MongoDB database...');
        await connectDB();
        
        // Step 3: Initialize database collections and indexes
        console.log('\n🗄️  Initializing database collections...');
        await initializeDatabase();
        
        // Step 4: Start the Express server
        console.log('\n🚀 Starting Express server...');
        const server = app.listen(PORT, () => {
            // Log server information on successful start
            logServerInfo();
            
            // Track total requests
            app.locals.totalRequests = 0;
            app.use((req, res, next) => {
                app.locals.totalRequests++;
                next();
            });
            
            // Log server performance info every hour (optional)
            if (process.env.NODE_ENV === 'production') {
                setInterval(() => {
                    const uptime = Math.floor((Date.now() - SERVER_START_TIME.getTime()) / 1000);
                    const memoryUsage = process.memoryUsage();
                    const dbHealth = checkDBHealth();

                    LoggerUtils.info('Server Health Check', {
                        uptime: `${uptime}s`,
                        memory: {
                            heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
                            heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
                            rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`
                        },
                        database: dbHealth,
                        totalRequests: app.locals.totalRequests
                    });
                }, 3600000); // Every hour
            }
        });

        // Step 5: Handle server-level errors
        server.on("error", (error) => {
            LoggerUtils.error("Server Error:", error);
            
            // Handle specific error types
            if (error.code === 'EADDRINUSE') {
                LoggerUtils.error(`❌ Port ${PORT} is already in use. Please use a different port.`);
                process.exit(1);
            } else if (error.code === 'EACCES') {
                LoggerUtils.error(`❌ Permission denied to use port ${PORT}`);
                process.exit(1);
            } else {
                throw error;
            }
        });

        // ==========================================
        // ERROR HANDLERS
        // ==========================================

        /**
         * Handle uncaught exceptions
         * Critical errors that weren't caught by try-catch
         */
        process.on('uncaughtException', (error) => {
            LoggerUtils.error('UNCAUGHT EXCEPTION:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            
            logServerShutdown('Uncaught Exception');
            
            // Log security event
            LoggerUtils.logSecurityEvent('uncaught_exception', 'critical', 'system', {
                error: error.message,
                stack: error.stack
            });
            
            // Give time for logging before exit
            setTimeout(() => {
                process.exit(1);
            }, 1000);
        });

        /**
         * Handle unhandled promise rejections
         * Promises that were rejected but not caught
         */
        process.on('unhandledRejection', (reason, promise) => {
            LoggerUtils.error('UNHANDLED PROMISE REJECTION:', {
                reason: reason,
                promise: promise
            });
            
            logServerShutdown('Unhandled Promise Rejection');
            
            // Log security event
            LoggerUtils.logSecurityEvent('unhandled_rejection', 'high', 'system', {
                reason: reason?.message || String(reason)
            });
            
            // Close server gracefully
            server.close(() => {
                process.exit(1);
            });
        });

        // ==========================================
        // GRACEFUL SHUTDOWN HANDLERS
        // ==========================================

        /**
         * Handle SIGTERM signal
         * Sent by process managers (PM2, Docker, Kubernetes) to gracefully stop the app
         */
        process.on('SIGTERM', async () => {
            console.log('\n🛑 SIGTERM signal received');
            LoggerUtils.warn('SIGTERM signal received');
            logServerShutdown('SIGTERM Signal');
            
            console.log('📊 Closing database connections...');
            await mongoose.connection.close();
            console.log('✅ Database connections closed');
            
            console.log('🌐 Closing server...');
            server.close(() => {
                LoggerUtils.info('Server closed successfully');
                console.log('✅ Server closed successfully');
                process.exit(0);
            });
            
            // Force exit if graceful shutdown takes too long (30 seconds)
            setTimeout(() => {
                LoggerUtils.error('Graceful shutdown timeout, forcing exit');
                console.error('❌ Graceful shutdown timeout, forcing exit');
                process.exit(1);
            }, 30000);
        });

        /**
         * Handle SIGINT signal
         * Sent when user presses Ctrl+C in terminal
         */
        process.on('SIGINT', async () => {
            console.log('\n\n🛑 SIGINT signal received (Ctrl+C)');
            LoggerUtils.warn('SIGINT signal received');
            logServerShutdown('User Interruption (Ctrl+C)');
            
            console.log('📊 Closing database connections...');
            await mongoose.connection.close();
            console.log('✅ Database connections closed');
            
            console.log('🌐 Closing server...');
            server.close(() => {
                LoggerUtils.info('Server closed successfully');
                console.log('✅ Server closed successfully');
                console.log('👋 Goodbye!\n');
                process.exit(0);
            });
            
            // Force exit if graceful shutdown takes too long (10 seconds)
            setTimeout(() => {
                LoggerUtils.error('Graceful shutdown timeout, forcing exit');
                console.error('❌ Graceful shutdown timeout, forcing exit');
                process.exit(1);
            }, 10000);
        });

    } catch (error) {
        // Fatal error during server startup
        LoggerUtils.error('FATAL ERROR: Failed to start healthcare server', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        console.error('\n❌ FATAL ERROR: Failed to start healthcare server');
        console.error('Error details:', error.message);
        console.error('Stack trace:', error.stack);
        
        logServerShutdown('Fatal Startup Error');
        
        // Exit with error code
        process.exit(1);
    }
};

// ==========================================
// START THE SERVER
// ==========================================

// Execute server startup
startServer();

/**
 * ==========================================
 * REQUIRED ENVIRONMENT VARIABLES
 * ==========================================
 * 
 * Create a .env file in the root directory with these variables:
 * 
 * # Server Configuration
 * PORT=8000
 * NODE_ENV=development
 * 
 * # Database
 * MONGODB_URI=mongodb://localhost:27017/healthcare-consultation
 * DB_MAX_POOL_SIZE=10
 * DB_MIN_POOL_SIZE=2
 * DB_MAX_RETRIES=5
 * DB_RETRY_DELAY=5000
 * 
 * # JWT Secrets (REQUIRED)
 * ACCESS_TOKEN_SECRET=your-super-secret-access-token-key-minimum-32-characters
 * ACCESS_TOKEN_EXPIRY=15m
 * REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-minimum-32-characters
 * REFRESH_TOKEN_EXPIRY=7d
 * 
 * # Razorpay Payment Gateway (REQUIRED for payments)
 * RAZORPAY_KEY_ID=rzp_live_xxxxx
 * RAZORPAY_KEY_SECRET=live_secret_xxxxx
 * 
 * # CORS
 * CORS_ORIGIN=http://localhost:3000,http://localhost:5173
 * 
 * # Cloudinary (Optional - for file uploads)
 * CLOUDINARY_CLOUD_NAME=your-cloud-name
 * CLOUDINARY_API_KEY=your-api-key
 * CLOUDINARY_API_SECRET=your-api-secret
 * 
 * # Email Service (Optional - for notifications)
 * EMAIL_SERVICE=gmail
 * EMAIL_USER=your-email@gmail.com
 * EMAIL_PASS=your-app-specific-password
 * 
 * # Frontend URL
 * FRONTEND_URL=http://localhost:3000
 * 
 * # Logging
 * LOG_LEVEL=info
 * 
 * ==========================================
 * PACKAGE.JSON DEPENDENCIES NEEDED
 * ==========================================
 * 
 * Make sure you have these dependencies:
 * 
 * "dependencies": {
 *   "express": "^4.18.2",
 *   "mongoose": "^7.5.0",
 *   "bcryptjs": "^2.4.3",
 *   "jsonwebtoken": "^9.0.2",
 *   "cors": "^2.8.5",
 *   "cookie-parser": "^1.4.6",
 *   "dotenv": "^16.3.1",
 *   "cloudinary": "^1.40.0",
 *   "nodemailer": "^6.9.4",
 *   "razorpay": "^2.9.2",
 *   "winston": "^3.10.0",
 *   "winston-daily-rotate-file": "^4.7.1"
 * }
 * 
 * "devDependencies": {
 *   "nodemon": "^3.0.1"
 * }
 * 
 * ==========================================
 * USAGE
 * ==========================================
 * 
 * Development:
 *   npm run dev
 * 
 * Production:
 *   npm start
 * 
 * ==========================================
 * PROJECT STRUCTURE
 * ==========================================
 * 
 * src/
 * ├── index.js (this file)
 * ├── server.js (Express app configuration - optional)
 * ├── config/
 * │   └── database.js (Database connection)
 * ├── routes/
 * │   ├── auth.routes.js
 * │   ├── user.routes.js
 * │   ├── patient.routes.js
 * │   ├── admin.routes.js
 * │   ├── payment.routes.js
 * │   └── razorpay.routes.js
 * ├── controllers/
 * │   ├── auth.controller.js
 * │   ├── user.controller.js
 * │   ├── patient.controller.js
 * │   ├── admin.controller.js
 * │   └── payment.controller.js
 * ├── models/
 * │   ├── user.model.js
 * │   ├── patient.model.js
 * │   ├── payment.model.js
 * │   ├── invoice.model.js
 * │   └── auditLog.model.js
 * ├── middlewares/
 * │   ├── auth.middleware.js
 * │   ├── roleAuth.middleware.js
 * │   └── error.middleware.js
 * └── utils/
 *     ├── ApiResponse.js
 *     ├── ApiError.js
 *     ├── asyncHandler.js
 *     ├── logger.js
 *     ├── razorpayUtils.js
 *     ├── emailUtils.js
 *     └── invoiceUtils.js
 * 
 * ==========================================
 * API ENDPOINTS SUMMARY
 * ==========================================
 * 
 * Auth:
 *   POST   /api/v1/auth/register      - Register new user
 *   POST   /api/v1/auth/login          - Login user
 *   POST   /api/v1/auth/logout         - Logout user
 *   POST   /api/v1/auth/refresh-token  - Refresh access token
 * 
 * Users:
 *   GET    /api/v1/users/profile       - Get user profile
 *   PUT    /api/v1/users/profile       - Update user profile
 *   POST   /api/v1/users/change-password - Change password
 * 
 * Patients:
 *   GET    /api/v1/patients            - Get all patients
 *   POST   /api/v1/patients            - Create patient
 *   GET    /api/v1/patients/:id        - Get patient by ID
 *   PUT    /api/v1/patients/:id        - Update patient
 *   DELETE /api/v1/patients/:id        - Delete patient
 * 
 * Admin:
 *   GET    /api/v1/admin/dashboard     - Admin dashboard
 *   GET    /api/v1/admin/users          - Get all users
 *   GET    /api/v1/admin/analytics      - Get system analytics
 * 
 * Payments:
 *   POST   /api/v1/payments/create-order - Create Razorpay order
 *   POST   /api/v1/payments/confirm      - Confirm payment
 *   GET    /api/v1/payments/:paymentId   - Get payment details
 *   GET    /api/v1/payments              - Get user payments
 *   POST   /api/v1/payments/:paymentId/refund - Process refund
 *   POST   /api/v1/payments/manual        - Create manual payment
 * 
 * Simple Razorpay (backward compatible):
 *   POST   /api/create-order             - Simple order creation
 *   POST   /api/verify-payment            - Simple payment verification
 *   GET    /api/payment/:paymentId        - Get payment details
 * 
 * Health:
 *   GET    /api/v1/health                 - Basic health check
 *   GET    /api/v1/health/detailed        - Detailed health check
 */ 