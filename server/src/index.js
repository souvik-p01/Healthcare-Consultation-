/**
 * Healthcare Consultation System - Main Entry Point
 */

// ==========================================
// IMPORT DEPENDENCIES
// ==========================================

// Import environment configuration FIRST
import dotenv from "dotenv";

// Configure environment variables from .env file
dotenv.config({
    path: './.env'
});

// Import core dependencies
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";

// Import routes
import patientRoutes from "./routes/patient.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import razorpayRoutes from "./routes/razorpay.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";

// Import middleware
import { errorHandler } from "./middlewares/error.middleware.js";
import { requestLogger } from "./middlewares/logging.middleware.js";

// Import database utilities
import connectDB, { checkDBHealth, getDBStats, isDBConnected } from "./db/index.js";

// Import logger
import logger from "./utils/loggerUtils.js";

// Import constants
import { DB_NAME } from "./constants.js";

// ==========================================
// EXPRESS APP CONFIGURATION
// ==========================================

// Create Express application
const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
    crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production'
}));

// Compression middleware
app.use(compression());

// Body parsing middleware - IMPORTANT: webhook routes need raw body, so we conditionally parse
app.use((req, res, next) => {
    if (req.originalUrl === '/api/webhook/razorpay') {
        next(); // Skip for webhook
    } else {
        express.json({ limit: "16kb" })(req, res, next);
    }
});

app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "x-refresh-token"],
    exposedHeaders: ["x-access-token", "x-refresh-token"],
    maxAge: 86400 // 24 hours
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Limit each IP
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false
});

// Apply rate limiting to API routes
app.use('/api/', limiter);

// Static files middleware
app.use(express.static("public"));

// Request logging middleware
app.use(requestLogger);

// Track total requests
app.locals.totalRequests = 0;
app.use((req, res, next) => {
    app.locals.totalRequests++;
    next();
});

// ==========================================
// ROUTES CONFIGURATION
// ==========================================

// Webhook routes (must be before JSON parsing)
app.use("/api/webhook", webhookRoutes);

// Health check endpoint
app.get("/api/v1/health", async (req, res) => {
    const dbHealth = checkDBHealth();
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    res.status(200).json({
        success: true,
        message: "Healthcare Consultation System is running healthy",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        database: {
            status: dbHealth.status,
            name: dbHealth.database,
            state: dbHealth.readyState,
            collections: dbHealth.collections
        },
        system: {
            uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
            memory: {
                heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
                heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
                rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`
            },
            nodeVersion: process.version,
            platform: process.platform
        },
        totalRequests: app.locals.totalRequests
    });
});

// Detailed health check for monitoring systems
app.get("/api/v1/health/detailed", async (req, res) => {
    const dbHealth = checkDBHealth();
    let dbStats = null;
    
    try {
        dbStats = await getDBStats();
    } catch (error) {
        logger.error('Failed to get DB stats', error);
    }
    
    res.status(200).json({
        success: true,
        timestamp: new Date().toISOString(),
        services: {
            api: { status: 'healthy', uptime: process.uptime() },
            database: dbHealth,
            storage: dbStats ? 'healthy' : 'degraded'
        },
        metrics: {
            totalRequests: app.locals.totalRequests,
            activeConnections: mongoose.connection.readyState === 1 ? 1 : 0,
            memoryUsage: process.memoryUsage()
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
            payments: "/api/v1/payments",
            webhooks: "/api/webhook"
        }
    });
});

// Root route handler
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Healthcare Consultation System API",
        version: "1.0.0",
        documentation: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/docs`,
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
    logger.warn(`Route not found: ${req.method} ${req.originalUrl}`, {
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
    const dbHealth = isDBConnected();
    
    console.log('\n' + '='.repeat(70));
    console.log('🏥 HEALTHCARE CONSULTATION SYSTEM');
    console.log('='.repeat(70));
    console.log("🚀 Server started successfully");
    console.log(`🌐 Server URL: http://localhost:${PORT}`);
    console.log(`📊 Database: ${dbHealth ? 'Connected' : 'Disconnected'}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📅 Started at: ${SERVER_START_TIME.toLocaleString()}`);
    console.log(`⏱  Uptime: 0 seconds`);
    console.log(`💳 Payment Gateway: ${process.env.RAZORPAY_KEY_ID ? 'Configured' : 'Not Configured'}`);
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
    logger.info('Server started', {
        port: PORT,
        environment: process.env.NODE_ENV,
        database: dbHealth ? 'Connected' : 'Disconnected'
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
    console.log(`📊 Total requests served: ${app.locals.totalRequests || 0}`);
    console.log('='.repeat(70) + '\n');

    // Log to file as well
    logger.warn('Server shutdown', { 
        reason, 
        uptime,
        totalRequests: app.locals.totalRequests 
    });
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
        
        logger.error('Missing required environment variables', { missingVars });
        return false;
    }

    console.log('✅ All required environment variables are present');
    
    logger.info('Environment variables validated', {
        hasMongoURI: !!process.env.MONGODB_URI,
        hasAccessToken: !!process.env.ACCESS_TOKEN_SECRET,
        hasRefreshToken: !!process.env.REFRESH_TOKEN_SECRET,
        hasRazorpayKey: !!process.env.RAZORPAY_KEY_ID
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
        'FRONTEND_URL': 'Frontend application URL',
        'SMTP_HOST': 'Email server host',
        'SMTP_PORT': 'Email server port'
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
        
        logger.warn('Optional environment variables missing', { 
            missing: missingOptional.map(v => v.varName) 
        });
    }
};

// ==========================================
// DATABASE CONNECTION WITH RETRY
// ==========================================

/**
 * Connect to MongoDB with retry logic using imported connectDB
 */
const connectWithRetry = async () => {
    try {
        console.log(`🔄 Attempting to connect to MongoDB (Attempt ${DB_RETRY_CONFIG.currentRetry + 1}/${DB_RETRY_CONFIG.maxRetries})...`);
        
        await connectDB();
        
        console.log(`✅ Successfully connected to MongoDB: ${mongoose.connection.name}`);
        DB_RETRY_CONFIG.currentRetry = 0;
        
        logger.info('Database connected successfully', {
            host: mongoose.connection.host,
            database: mongoose.connection.name
        });
        
        return true;
        
    } catch (error) {
        console.error(`❌ MongoDB connection failed: ${error.message}`);
        
        logger.error('Database connection failed', {
            attempt: DB_RETRY_CONFIG.currentRetry + 1,
            error: error.message
        });
        
        DB_RETRY_CONFIG.currentRetry++;
        
        if (DB_RETRY_CONFIG.currentRetry < DB_RETRY_CONFIG.maxRetries) {
            console.log(`🔄 Retrying in ${DB_RETRY_CONFIG.retryDelay / 1000} seconds... (Attempt ${DB_RETRY_CONFIG.currentRetry + 1}/${DB_RETRY_CONFIG.maxRetries})`);
            
            await new Promise(resolve => setTimeout(resolve, DB_RETRY_CONFIG.retryDelay));
            
            return await connectWithRetry();
        } else {
            console.error(`❌ Failed to connect to MongoDB after ${DB_RETRY_CONFIG.maxRetries} attempts`);
            
            logger.emergency('Database connection failed after max retries', {
                maxRetries: DB_RETRY_CONFIG.maxRetries,
                error: error.message
            });
            
            throw error;
        }
    }
};

// ==========================================
// SERVER INITIALIZATION
// ==========================================

/**
 * Initialize and start the healthcare server
 */
const startServer = async () => {
    try {
        console.log('\n🏥 Initializing Healthcare Consultation System...\n');
        
        // Step 1: Check environment variables
        console.log('📋 Checking environment configuration...');
        const hasRequiredVars = checkRequiredEnvVars();
        
        if (!hasRequiredVars) {
            console.error('\n❌ Cannot start server without required environment variables');
            logger.emergency('Server startup failed - missing required environment variables');
            process.exit(1);
        }
        
        // Check optional variables (warnings only)
        checkOptionalEnvVars();
        
        // Step 2: Connect to MongoDB database with retry logic
        console.log('\n📊 Connecting to MongoDB database...');
        await connectWithRetry();
        
        // Step 3: Start the Express server
        console.log('\n🚀 Starting Express server...');
        const server = app.listen(PORT, () => {
            // Log server information on successful start
            logServerInfo();
            
            // Log server performance info every hour
            if (process.env.NODE_ENV === 'production') {
                setInterval(() => {
                    const uptime = Math.floor((Date.now() - SERVER_START_TIME.getTime()) / 1000);
                    const memoryUsage = process.memoryUsage();
                    const dbHealth = isDBConnected();

                    const healthInfo = {
                        uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`,
                        memory: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
                        database: dbHealth ? 'Connected' : 'Disconnected',
                        totalRequests: app.locals.totalRequests
                    };

                    console.log("📊 Server Health Check:", healthInfo);
                    
                    logger.info('Server health check', healthInfo);
                }, 3600000); // Every hour
            }
        });

        // Step 4: Handle server-level errors
        server.on("error", (error) => {
            console.error("❌ Server Error:", error);
            
            logger.error('Server error', { error: error.message, code: error.code });
            
            if (error.code === 'EADDRINUSE') {
                console.error(`❌ Port ${PORT} is already in use. Please use a different port.`);
                process.exit(1);
            } else if (error.code === 'EACCES') {
                console.error(`❌ Permission denied to use port ${PORT}`);
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
         */
        process.on('uncaughtException', (error) => {
            console.error('\n❌ UNCAUGHT EXCEPTION:', error);
            console.error('Stack trace:', error.stack);
            
            logger.error('UNCAUGHT EXCEPTION', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            
            logger.logSecurityEvent('uncaught_exception', 'critical', 'system', {
                error: error.message,
                stack: error.stack
            });
            
            logServerShutdown('Uncaught Exception');
            
            setTimeout(() => {
                process.exit(1);
            }, 1000);
        });

        /**
         * Handle unhandled promise rejections
         */
        process.on('unhandledRejection', (reason, promise) => {
            console.error('\n❌ UNHANDLED PROMISE REJECTION:');
            console.error('Reason:', reason);
            console.error('Promise:', promise);
            
            logger.error('UNHANDLED PROMISE REJECTION', {
                reason: reason?.message || String(reason),
                promise: promise
            });
            
            logger.logSecurityEvent('unhandled_rejection', 'high', 'system', {
                reason: reason?.message || String(reason)
            });
            
            logServerShutdown('Unhandled Promise Rejection');
            
            server.close(() => {
                process.exit(1);
            });
        });

        // ==========================================
        // GRACEFUL SHUTDOWN HANDLERS
        // ==========================================

        /**
         * Handle SIGTERM signal
         */
        process.on('SIGTERM', async () => {
            console.log('\n🛑 SIGTERM signal received');
            
            logger.warn('SIGTERM signal received');
            
            logServerShutdown('SIGTERM Signal');
            
            console.log('📊 Closing database connections...');
            await mongoose.connection.close();
            console.log('✅ Database connections closed');
            
            console.log('🌐 Closing server...');
            server.close(() => {
                logger.info('Server closed successfully');
                console.log('✅ Server closed successfully');
                process.exit(0);
            });
            
            setTimeout(() => {
                console.error('❌ Graceful shutdown timeout, forcing exit');
                logger.error('Graceful shutdown timeout, forcing exit');
                process.exit(1);
            }, 30000);
        });

        /**
         * Handle SIGINT signal
         */
        process.on('SIGINT', async () => {
            console.log('\n\n🛑 SIGINT signal received (Ctrl+C)');
            
            logger.warn('SIGINT signal received');
            
            logServerShutdown('User Interruption (Ctrl+C)');
            
            console.log('📊 Closing database connections...');
            await mongoose.connection.close();
            console.log('✅ Database connections closed');
            
            console.log('🌐 Closing server...');
            server.close(() => {
                logger.info('Server closed successfully');
                console.log('✅ Server closed successfully');
                console.log('👋 Goodbye!\n');
                process.exit(0);
            });
            
            setTimeout(() => {
                console.error('❌ Graceful shutdown timeout, forcing exit');
                logger.error('Graceful shutdown timeout, forcing exit');
                process.exit(1);
            }, 10000);
        });

    } catch (error) {
        console.error('\n❌ FATAL ERROR: Failed to start healthcare server');
        console.error('Error details:', error.message);
        console.error('Stack trace:', error.stack);
        
        logger.emergency('FATAL ERROR: Server startup failed', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        logServerShutdown('Fatal Startup Error');
        
        process.exit(1);
    }
};

// ==========================================
// START THE SERVER
// ==========================================

// Execute server startup
startServer();