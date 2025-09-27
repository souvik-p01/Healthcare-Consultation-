/*

import express from "express"
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express()

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//routes import

import userRouter from "./routes/user.routes.js"


//routes declaration
app.use("/api/v1/users", userRouter)
export { app }

*/



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
import helmet from "helmet"; // Security headers (install with: npm i helmet)
import rateLimit from "express-rate-limit"; // Rate limiting (install with: npm i express-rate-limit)
import compression from "compression"; // Response compression (install with: npm i compression)

// Initialize Express application
const app = express();

/**
 * Security Middleware Configuration
 * Essential for healthcare applications handling sensitive patient data
 */

// Helmet for security headers - HIPAA compliance requirement
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https://res.cloudinary.com"], // Allow Cloudinary for medical images
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// Rate limiting to prevent API abuse - crucial for healthcare systems
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Limit each IP to 100 requests per windowMs in production
    message: {
        error: "Too many requests from this IP address",
        message: "Please try again later. For urgent medical matters, contact emergency services.",
        code: "RATE_LIMIT_EXCEEDED"
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for health check endpoints
    skip: (req) => req.path === '/api/v1/health'
});

app.use('/api', limiter);

/**
 * CORS Configuration for Healthcare System
 * Configured to handle multiple healthcare client applications
 */
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests from configured origins or no origin (mobile apps, Postman, etc.)
        const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:8000'];
        
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS policy - Healthcare system access restricted'));
        }
    },
    credentials: true, // Essential for healthcare authentication cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Patient-ID'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'] // For pagination in patient records
}));

/**
 * Body Parsing Middleware
 * Configured for healthcare data including medical records and images
 */

// JSON parsing with increased limit for medical records and reports
app.use(express.json({ 
    limit: "50mb", // Increased for medical images and documents
    verify: (req, res, buf) => {
        // Store raw body for webhook verification if needed
        req.rawBody = buf;
    }
}));

// URL-encoded data parsing for form submissions
app.use(express.urlencoded({ 
    extended: true, 
    limit: "50mb" // Increased for medical form data
}));

// Serve static files (medical documents, reports, etc.)
app.use(express.static("public", {
    maxAge: '1d', // Cache static assets for 1 day
    setHeaders: (res, path) => {
        // Add security headers for static files
        if (path.endsWith('.pdf') || path.endsWith('.jpg') || path.endsWith('.png')) {
            res.setHeader('X-Content-Type-Options', 'nosniff');
        }
    }
}));

// Cookie parser for authentication tokens
app.use(cookieParser());

// Response compression for better performance
app.use(compression({
    // Don't compress images and PDFs as they're already compressed
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    },
    level: 6, // Balanced compression level
    threshold: 1024 // Only compress responses larger than 1KB
}));

/**
 * Request Logging Middleware for Healthcare Compliance
 * Important for HIPAA audit trails
 */
app.use((req, res, next) => {
    // Log all API requests for healthcare compliance
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl;
    const userAgent = req.get('User-Agent') || 'Unknown';
    const ip = req.ip || req.connection.remoteAddress;
    
    console.log(`🏥 [${timestamp}] ${method} ${url} - IP: ${ip} - Agent: ${userAgent}`);
    
    // Add request ID for tracking
    req.requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    res.setHeader('X-Request-ID', req.requestId);
    
    next();
});

/**
 * Healthcare API Routes Import
 * Organized by medical service domains
 */

// Authentication & User Management
import userRouter from "./routes/user.routes.js";
import authRouter from "./routes/auth.routes.js";

// Core Healthcare Services
import patientRouter from "./routes/patient.routes.js";
import doctorRouter from "./routes/doctor.routes.js";
import appointmentRouter from "./routes/appointment.routes.js";
import consultationRouter from "./routes/consultation.routes.js";

// Medical Records & Documentation
import medicalRecordRouter from "./routes/medical-record.routes.js";
import prescriptionRouter from "./routes/prescription.routes.js";
import reportRouter from "./routes/report.routes.js";

// Healthcare Administration
import adminRouter from "./routes/admin.routes.js";
import billingRouter from "./routes/billing.routes.js";
import notificationRouter from "./routes/notification.routes.js";

// System & Utility Routes
import healthRouter from "./routes/health.routes.js";

/**
 * API Route Declarations
 * RESTful API design for healthcare consultation system
 */

// Health Check Endpoint (should be first and unrestricted)
app.use("/api/v1/health", healthRouter);

// Authentication Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);

// Core Healthcare Service Routes
app.use("/api/v1/patients", patientRouter);
app.use("/api/v1/doctors", doctorRouter);
app.use("/api/v1/appointments", appointmentRouter);
app.use("/api/v1/consultations", consultationRouter);

// Medical Documentation Routes
app.use("/api/v1/medical-records", medicalRecordRouter);
app.use("/api/v1/prescriptions", prescriptionRouter);
app.use("/api/v1/reports", reportRouter);

// Administrative Routes
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/billing", billingRouter);
app.use("/api/v1/notifications", notificationRouter);

/**
 * API Documentation Route
 * Serve API documentation for developers
 */
app.get('/api/v1', (req, res) => {
    res.json({
        message: "Healthcare Consultation System API",
        version: "1.0.0",
        status: "active",
        services: {
            authentication: "/api/v1/auth",
            users: "/api/v1/users",
            patients: "/api/v1/patients",
            doctors: "/api/v1/doctors",
            appointments: "/api/v1/appointments",
            consultations: "/api/v1/consultations",
            medicalRecords: "/api/v1/medical-records",
            prescriptions: "/api/v1/prescriptions",
            reports: "/api/v1/reports",
            admin: "/api/v1/admin",
            billing: "/api/v1/billing",
            notifications: "/api/v1/notifications",
            health: "/api/v1/health"
        },
        documentation: "https://your-healthcare-api-docs.com",
        support: "healthcare-support@yourdomain.com"
    });
});

/**
 * 404 Handler for undefined routes
 */
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: "Healthcare API endpoint not found",
        error: "The requested healthcare service endpoint does not exist",
        availableServices: "/api/v1",
        requestId: req.requestId
    });
});

/**
 * Global Error Handling Middleware
 * Comprehensive error handling for healthcare system
 */
app.use((err, req, res, next) => {
    console.error(`❌ [${new Date().toISOString()}] Healthcare System Error:`, err);
    
    // Default error response
    let error = {
        success: false,
        message: "An error occurred in the healthcare system",
        requestId: req.requestId,
        timestamp: new Date().toISOString()
    };
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
        error.message = "Invalid data provided";
        error.details = Object.values(err.errors).map(e => e.message);
        return res.status(400).json(error);
    }
    
    if (err.name === 'CastError') {
        error.message = "Invalid ID format";
        return res.status(400).json(error);
    }
    
    if (err.code === 11000) {
        error.message = "Duplicate data entry";
        error.details = "This record already exists in the healthcare system";
        return res.status(409).json(error);
    }
    
    if (err.name === 'JsonWebTokenError') {
        error.message = "Invalid authentication token";
        return res.status(401).json(error);
    }
    
    if (err.name === 'TokenExpiredError') {
        error.message = "Authentication token has expired";
        return res.status(401).json(error);
    }
    
    // CORS errors
    if (err.message.includes('CORS')) {
        error.message = "Access denied - Healthcare system CORS policy";
        return res.status(403).json(error);
    }
    
    // File upload errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        error.message = "Medical file size too large";
        error.details = "Please ensure medical documents are under 50MB";
        return res.status(413).json(error);
    }
    
    // Production vs Development error details
    if (process.env.NODE_ENV === 'development') {
        error.stack = err.stack;
        error.details = err.message;
    }
    
    // Default server error
    res.status(err.statusCode || 500).json(error);
});

// Export the configured Express app
export { app };

/**
 * Required Environment Variables for Healthcare System:
 * 
 * CORS_ORIGIN=http://localhost:8000,https://yourhealthcareapp.com
 * NODE_ENV=development
 * 
 * Additional packages to install:
 * npm i helmet express-rate-limit compression
 * 
 * Healthcare Route Files to Create:
 * - routes/auth.routes.js
 * - routes/patient.routes.js  
 * - routes/doctor.routes.js
 * - routes/appointment.routes.js
 * - routes/consultation.routes.js
 * - routes/medical-record.routes.js
 * - routes/prescription.routes.js
 * - routes/report.routes.js
 * - routes/admin.routes.js
 * - routes/billing.routes.js
 * - routes/notification.routes.js
 * - routes/health.routes.js
 */