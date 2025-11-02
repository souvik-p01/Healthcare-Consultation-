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

// Import database utilities
import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";

// Import Express app configuration
import { app } from "./app.js";

// Import mongoose for connection monitoring
import mongoose from "mongoose";

// ==========================================
// CONFIGURATION
// ==========================================

// Define the port for the healthcare system server
const PORT = process.env.PORT || 8000;

// Server startup timestamp
const SERVER_START_TIME = new Date();

// Retry configuration for database connection
const DB_RETRY_CONFIG = {
    maxRetries: 5,
    retryDelay: 5000, // 5 seconds
    currentRetry: 0
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Log server startup information
 */
const logServerInfo = () => {
    console.log('\n' + '='.repeat(60));
    console.log('🏥 HEALTHCARE CONSULTATION SYSTEM');
    console.log('='.repeat(60));
    console.log(`🚀 Server started successfully`);
    console.log(`🌐 Server URL: http://localhost:${PORT}`);
    console.log(`📊 Database: ${DB_NAME}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📅 Started at: ${SERVER_START_TIME.toLocaleString()}`);
    console.log(`⏱️  Uptime: 0 seconds`);
    console.log('='.repeat(60));
    console.log('✅ Available Endpoints:');
    console.log('   - GET  http://localhost:' + PORT + '/api/v1/health');
    console.log('   - GET  http://localhost:' + PORT + '/api/v1');
    console.log('   - POST http://localhost:' + PORT + '/api/v1/users/register');
    console.log('   - POST http://localhost:' + PORT + '/api/v1/users/login');
    console.log('='.repeat(60) + '\n');
};

/**
 * Log server shutdown information
 */
const logServerShutdown = (reason) => {
    const uptime = Math.floor((Date.now() - SERVER_START_TIME.getTime()) / 1000);
    console.log('\n' + '='.repeat(60));
    console.log('🛑 HEALTHCARE SYSTEM SHUTDOWN');
    console.log('='.repeat(60));
    console.log(`📋 Reason: ${reason}`);
    console.log(`⏱️  Total uptime: ${uptime} seconds`);
    console.log(`📅 Shutdown at: ${new Date().toLocaleString()}`);
    console.log('='.repeat(60) + '\n');
};

/**
 * Check if all required environment variables are present
 */
const checkRequiredEnvVars = () => {
    const requiredVars = [
        'MONGODB_URI',
        'ACCESS_TOKEN_SECRET',
        'REFRESH_TOKEN_SECRET'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
        console.error('❌ Missing required environment variables:');
        missingVars.forEach(varName => {
            console.error(`   - ${varName}`);
        });
        console.error('\n💡 Please check your .env file and ensure all required variables are set.');
        return false;
    }

    console.log('✅ All required environment variables are present');
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
        'CORS_ORIGIN': 'CORS configuration'
    };

    const missingOptional = [];

    for (const [varName, feature] of Object.entries(optionalVars)) {
        if (!process.env[varName]) {
            missingOptional.push({ varName, feature });
        }
    }

    if (missingOptional.length > 0) {
        console.warn('\n⚠️  Optional environment variables not set:');
        missingOptional.forEach(({ varName, feature }) => {
            console.warn(`   - ${varName} (${feature})`);
        });
        console.warn('   These features will not be available until configured.\n');
    }
};

// ==========================================
// DATABASE CONNECTION WITH RETRY
// ==========================================

/**
 * Connect to MongoDB with retry logic
 * Attempts to reconnect if initial connection fails
 */
const connectWithRetry = async () => {
    try {
        console.log(`🔄 Attempting to connect to MongoDB (Attempt ${DB_RETRY_CONFIG.currentRetry + 1}/${DB_RETRY_CONFIG.maxRetries})...`);
        
        await connectDB();
        
        console.log(`✅ Successfully connected to MongoDB: ${DB_NAME}`);
        DB_RETRY_CONFIG.currentRetry = 0; // Reset retry counter on success
        
        return true;
        
    } catch (error) {
        console.error(`❌ MongoDB connection failed:`, error.message);
        
        DB_RETRY_CONFIG.currentRetry++;
        
        if (DB_RETRY_CONFIG.currentRetry < DB_RETRY_CONFIG.maxRetries) {
            console.log(`🔄 Retrying in ${DB_RETRY_CONFIG.retryDelay / 1000} seconds...`);
            
            await new Promise(resolve => setTimeout(resolve, DB_RETRY_CONFIG.retryDelay));
            
            return await connectWithRetry();
        } else {
            console.error(`❌ Failed to connect to MongoDB after ${DB_RETRY_CONFIG.maxRetries} attempts`);
            throw error;
        }
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
 * 3. Start Express server
 * 4. Set up error handlers
 * 5. Set up graceful shutdown handlers
 */
const startServer = async () => {
    try {
        console.log('\n🏥 Initializing Healthcare Consultation System...\n');
        
        // Step 1: Check environment variables
        console.log('📋 Checking environment configuration...');
        const hasRequiredVars = checkRequiredEnvVars();
        
        if (!hasRequiredVars) {
            console.error('\n❌ Cannot start server without required environment variables');
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
            
            // Log server performance info every hour (optional)
            if (process.env.NODE_ENV === 'production') {
                setInterval(() => {
                    const uptime = Math.floor((Date.now() - SERVER_START_TIME.getTime()) / 1000);
                    const memoryUsage = process.memoryUsage();
                    console.log(`📊 Server Health Check:`, {
                        uptime: `${uptime}s`,
                        memory: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
                        connections: mongoose.connection.readyState === 1 ? 'Active' : 'Inactive'
                    });
                }, 3600000); // Every hour
            }
        });

        // Step 4: Handle server-level errors
        server.on("error", (error) => {
            console.error("❌ Server Error:", error);
            
            // Handle specific error types
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
         * Critical errors that weren't caught by try-catch
         */
        process.on('uncaughtException', (error) => {
            console.error('\n❌ UNCAUGHT EXCEPTION:', error);
            console.error('Stack trace:', error.stack);
            
            logServerShutdown('Uncaught Exception');
            
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
            console.error('\n❌ UNHANDLED PROMISE REJECTION:');
            console.error('Reason:', reason);
            console.error('Promise:', promise);
            
            logServerShutdown('Unhandled Promise Rejection');
            
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
            logServerShutdown('SIGTERM Signal');
            
            console.log('📊 Closing database connections...');
            await mongoose.connection.close();
            console.log('✅ Database connections closed');
            
            console.log('🌐 Closing server...');
            server.close(() => {
                console.log('✅ Server closed successfully');
                process.exit(0);
            });
            
            // Force exit if graceful shutdown takes too long (30 seconds)
            setTimeout(() => {
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
            logServerShutdown('User Interruption (Ctrl+C)');
            
            console.log('📊 Closing database connections...');
            await mongoose.connection.close();
            console.log('✅ Database connections closed');
            
            console.log('🌐 Closing server...');
            server.close(() => {
                console.log('✅ Server closed successfully');
                console.log('👋 Goodbye!\n');
                process.exit(0);
            });
            
            // Force exit if graceful shutdown takes too long (10 seconds)
            setTimeout(() => {
                console.error('❌ Graceful shutdown timeout, forcing exit');
                process.exit(1);
            }, 10000);
        });

        // ==========================================
        // MONGODB CONNECTION MONITORING
        // ==========================================

        /**
         * Monitor MongoDB connection status
         * Helps detect connection issues in production
         */
        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected successfully');
        });

        mongoose.connection.on('error', (error) => {
            console.error('❌ MongoDB error:', error);
        });

    } catch (error) {
        // Fatal error during server startup
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
 * 
 * # JWT Secrets (REQUIRED)
 * ACCESS_TOKEN_SECRET=your-super-secret-access-token-key-minimum-32-characters
 * ACCESS_TOKEN_EXPIRY=15m
 * REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-minimum-32-characters
 * REFRESH_TOKEN_EXPIRY=7d
 * JWT_SECRET=your-jwt-secret-key
 * JWT_EXPIRY=15m
 * JWT_REFRESH_SECRET=your-jwt-refresh-secret-key
 * MEDICAL_RECORD_SECRET=your-medical-record-secret-key
 * PASSWORD_RESET_SECRET=your-password-reset-secret-key
 * EMAIL_VERIFICATION_SECRET=your-email-verification-secret-key
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
 * EMAIL_FROM=noreply@healthcare-system.com
 * EMAIL_FROM_NAME=Healthcare System
 * 
 * # Frontend URL
 * FRONTEND_URL=http://localhost:3000
 * 
 * ==========================================
 * PACKAGE.JSON SCRIPTS
 * ==========================================
 * 
 * Add these scripts to your package.json:
 * 
 * "scripts": {
 *   "dev": "nodemon -r dotenv/config src/index.js",
 *   "start": "node src/index.js",
 *   "prod": "NODE_ENV=production node src/index.js"
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
 *   npm run prod
 * 
 * ==========================================
 * FEATURES IMPLEMENTED
 * ==========================================
 * 
 * ✅ Environment variable validation
 * ✅ Database connection with retry logic (5 attempts)
 * ✅ Graceful shutdown (SIGTERM, SIGINT)
 * ✅ Uncaught exception handling
 * ✅ Unhandled promise rejection handling
 * ✅ MongoDB connection monitoring
 * ✅ Server error handling (port in use, permission denied)
 * ✅ Comprehensive logging with emojis
 * ✅ Server health monitoring (production)
 * ✅ Startup/shutdown statistics
 * ✅ Force exit timeout (prevents hanging)
 * ✅ Uptime tracking
 * ✅ Memory usage monitoring
 * 
 * ==========================================
 * IMPROVEMENTS FROM ORIGINAL CODE
 * ==========================================
 * 
 * 1. ✅ Added environment variable validation
 * 2. ✅ Added database retry logic (5 attempts with 5s delay)
 * 3. ✅ Added server error handling (EADDRINUSE, EACCES)
 * 4. ✅ Added MongoDB connection monitoring
 * 5. ✅ Added comprehensive logging functions
 * 6. ✅ Added server health monitoring for production
 * 7. ✅ Added force exit timeouts
 * 8. ✅ Added uptime and memory tracking
 * 9. ✅ Better error messages and formatting
 * 10. ✅ Added optional env variable warnings
 * 11. ✅ Removed commented retry logic (implemented properly)
 * 12. ✅ Added available endpoints display on startup
 * 13. ✅ Better organization with helper functions
 * 14. ✅ Added startup/shutdown statistics
 * 15. ✅ Production-ready with comprehensive error handling
 */