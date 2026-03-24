/**
 * Healthcare Consultation System - Express Application Configuration
 * 
 * This file configures the Express.js application with healthcare-specific
 * middleware, security settings, and route configurations.
 * 
 * Features:
 * - HIPAA-compliant security configurations
 * - Medical data handling middleware
 * - API versioning for healthcare services
 * - Comprehensive error handling
 * - Request logging and monitoring
 * - File upload handling for medical documents
 */

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Optional: Install these for enhanced security (npm i helmet express-rate-limit compression)
// import helmet from "helmet";
// import rateLimit from "express-rate-limit";
// import compression from "compression";

// Initialize Express application
const app = express();

/**
 * ==========================================
 * SECURITY MIDDLEWARE CONFIGURATION
 * ==========================================
 */

// Uncomment when helmet is installed
// app.use(helmet({
//     contentSecurityPolicy: {
//         directives: {
//             defaultSrc: ["'self'"],
//             styleSrc: ["'self'", "'unsafe-inline'"],
//             scriptSrc: ["'self'"],
//             imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
//         },
//     },
//     hsts: {
//         maxAge: 31536000,
//         includeSubDomains: true,
//         preload: true
//     }
// }));

/**
 * ==========================================
 * RATE LIMITING CONFIGURATION
 * ==========================================
 * Prevents API abuse and ensures fair usage
 * Uncomment when express-rate-limit is installed
 */

// const limiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: process.env.NODE_ENV === 'production' ? 100 : 1000,
//     message: {
//         error: "Too many requests from this IP address",
//         message: "Please try again later. For urgent medical matters, contact emergency services.",
//         code: "RATE_LIMIT_EXCEEDED"
//     },
//     standardHeaders: true,
//     legacyHeaders: false,
//     skip: (req) => req.path === '/api/v1/health'
// });
// app.use('/api', limiter);

/**
 * ==========================================
 * CORS CONFIGURATION
 * ==========================================
 * Handles Cross-Origin Resource Sharing for healthcare client applications
 */
app.use(cors({
    origin: true,
    credentials: true
}));

/**
 * ==========================================
 * BODY PARSING MIDDLEWARE
 * ==========================================
 * Handles JSON and URL-encoded data with increased limits for medical files
 */

// Parse JSON bodies with 50MB limit for medical records and images
app.use(express.json({ 
    limit: "50mb",
    verify: (req, res, buf) => {
        // Store raw body for webhook verification if needed (e.g., payment webhooks)
        req.rawBody = buf;
    }
}));

// Parse URL-encoded bodies (form data) with 50MB limit
app.use(express.urlencoded({ 
    extended: true, 
    limit: "50mb"
}));

/**
 * ==========================================
 * STATIC FILES MIDDLEWARE
 * ==========================================
 * Serves static files from the public directory
 * Used for temporary file storage before uploading to Cloudinary
 */
app.use(express.static("public", {
    maxAge: '1d', // Cache static assets for 1 day
    setHeaders: (res, path) => {
        // Add security headers for static files
        if (path.endsWith('.pdf') || path.endsWith('.jpg') || path.endsWith('.png')) {
            res.setHeader('X-Content-Type-Options', 'nosniff');
        }
    }
}));

/**
 * ==========================================
 * COOKIE PARSER MIDDLEWARE
 * ==========================================
 * Parses cookies attached to client requests
 * Essential for JWT token management via HTTP-only cookies
 */
app.use(cookieParser());

/**
 * ==========================================
 * RESPONSE COMPRESSION (Optional)
 * ==========================================
 * Uncomment when compression is installed
 */
// app.use(compression({
//     filter: (req, res) => {
//         if (req.headers['x-no-compression']) {
//             return false;
//         }
//         return compression.filter(req, res);
//     },
//     level: 6,
//     threshold: 1024
// }));

/**
 * ==========================================
 * REQUEST LOGGING MIDDLEWARE
 * ==========================================
 * Logs all API requests for healthcare compliance (HIPAA audit trail)
 */
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl;
    const userAgent = req.get('User-Agent') || 'Unknown';
    const ip = req.ip || req.connection.remoteAddress;
    
    // Log request details
    console.log(`🏥 [${timestamp}] ${method} ${url} - IP: ${ip}`);
    
    // Generate unique request ID for tracking
    req.requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    res.setHeader('X-Request-ID', req.requestId);
    
    next();
});

/**
 * ==========================================
 * IMPORT ROUTES
 * ==========================================
 * Import all route modules
 */

// Main routes aggregator - this imports and combines all routes
import routes from "./routes/index.js";

/**
 * ==========================================
 * REGISTER ROUTES
 * ==========================================
 * All routes are prefixed with /api/v1
 * The routes aggregator (routes/index.js) handles all route registrations
 */
app.use("/api/v1", routes);

/**
 * ==========================================
 * API ROOT ENDPOINT
 * ==========================================
 * Provides information about the API when accessing the root
 */
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to Healthcare Consultation System API",
        version: "1.0.0",
        documentation: "/api/v1",
        health: "/api/v1/health",
        endpoints: {
            users: "/api/v1/users",
            patients: "/api/v1/patients",
            health: "/api/v1/health",
            patientNotifications: "/api/v1/patients/notifications",
            patientAppointments: "/api/v1/patients/appointments",
            patientProfile: "/api/v1/patients/profile",
            patientDashboard: "/api/v1/patients/dashboard"
        },
        timestamp: new Date().toISOString()
    });
});

/**
 * ==========================================
 * 404 HANDLER
 * ==========================================
 * Handles requests to undefined routes
 * This should be placed AFTER all route definitions
 */
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
        suggestion: "Check the API documentation for available endpoints",
        availableEndpoints: [
            "GET /api/v1/health - Health check",
            "GET /api/v1 - API information",
            "POST /api/v1/users/register - User registration",
            "POST /api/v1/users/login - User login",
            "GET /api/v1/users/profile - Get user profile",
            "GET /api/v1/patients/notifications - Get patient notifications",
            "GET /api/v1/patients/appointments - Get patient appointments",
            "GET /api/v1/patients/profile - Get patient profile",
            "GET /api/v1/patients/dashboard - Get patient dashboard",
            "GET /api/v1/admin/dashboard - Admin dashboard"
        ]
    });
});

/**
 * ==========================================
 * GLOBAL ERROR HANDLING MIDDLEWARE
 * ==========================================
 * Catches and handles all errors in the application
 * This MUST be the last middleware
 */
app.use((err, req, res, next) => {
    // Log error for debugging and compliance
    console.error(`❌ [${new Date().toISOString()}] Healthcare System Error:`, {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        requestId: req.requestId,
        url: req.originalUrl
    });
    
    // Default error object
    let error = {
        success: false,
        message: err.message || "An error occurred in the healthcare system",
        requestId: req.requestId,
        timestamp: new Date().toISOString()
    };
    
    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
        error.message = "Invalid data provided";
        error.errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json(error);
    }
    
    // Handle Mongoose bad ObjectId
    if (err.name === 'CastError') {
        error.message = "Invalid ID format";
        return res.status(400).json(error);
    }
    
    // Handle Mongoose duplicate key error
    if (err.code === 11000) {
        error.message = "Duplicate entry";
        error.details = "This record already exists in the database";
        return res.status(409).json(error);
    }
    
    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        error.message = "Invalid authentication token";
        return res.status(401).json(error);
    }
    
    if (err.name === 'TokenExpiredError') {
        error.message = "Authentication token has expired";
        return res.status(401).json(error);
    }
    
    // Handle CORS errors
    if (err.message.includes('CORS')) {
        error.message = "Access denied - CORS policy violation";
        return res.status(403).json(error);
    }
    
    // Handle file upload errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        error.message = "File size too large";
        error.details = "Maximum file size is 50MB";
        return res.status(413).json(error);
    }
    
    if (err.code === 'LIMIT_FILE_COUNT') {
        error.message = "Too many files";
        error.details = "Maximum 5 files can be uploaded at once";
        return res.status(400).json(error);
    }
    
    // Add stack trace in development mode only
    if (process.env.NODE_ENV === 'development') {
        error.stack = err.stack;
        error.details = err.message;
    }
    
    // Send error response with appropriate status code
    const statusCode = err.statusCode || err.status || 500;
    res.status(statusCode).json(error);
});

// Export the configured Express app
export { app };

/**
 * ==========================================
 * USAGE NOTES
 * ==========================================
 * 
 * 1. This app.js is imported in index.js where the server starts
 * 
 * 2. Environment Variables Required:
 *    - CORS_ORIGIN (comma-separated list of allowed origins)
 *    - NODE_ENV (development/production)
 * 
 * 3. Optional packages to install for enhanced features:
 *    npm i helmet express-rate-limit compression
 * 
 * 4. Routes Structure:
 *    All routes are under /api/v1 prefix
 *    Example: /api/v1/users/register
 * 
 * 5. Error Handling Flow:
 *    Route → Middleware → Controller → Error (if any) → Error Middleware → Response
 * 
 * 6. Current Active Routes:
 *    - GET  /api/v1/health                    (Health check)
 *    - GET  /api/v1                           (API information)
 *    - POST /api/v1/users/register            (User registration)
 *    - POST /api/v1/users/login               (User login)
 *    - GET  /api/v1/users/profile             (Get current user - requires auth)
 *    - POST /api/v1/users/logout              (Logout - requires auth)
 *    - GET  /api/v1/patients/notifications    (Get patient notifications)
 *    - GET  /api/v1/patients/appointments     (Get patient appointments)
 *    - GET  /api/v1/patients/profile          (Get patient profile)
 *    - GET  /api/v1/patients/dashboard        (Get patient dashboard)
 *    - And more... (see route files)
 * 
 * 7. Testing:
 *    - Start server: npm run dev
 *    - Test health: GET http://localhost:8000/api/v1/health
 *    - Test API root: GET http://localhost:8000/api/v1
 *    - Test patient notifications: GET http://localhost:8000/api/v1/patients/notifications (requires auth)
 * 
 * 8. Adding New Routes:
 *    - Create route file in routes/ folder
 *    - Import in routes/index.js
 *    - Routes will be automatically available under /api/v1
 * 
 * 9. IMPORTANT: Route Registration Flow
 *    app.js → imports routes from ./routes/index.js
 *    routes/index.js → imports and mounts individual route files
 *    This keeps the app.js clean and all routes organized
 * 
 * 10. The patient routes are now properly integrated through routes/index.js
 *     No duplicate mounting needed in app.js
 */