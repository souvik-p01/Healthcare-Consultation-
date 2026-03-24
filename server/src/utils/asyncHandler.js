/**
 * Healthcare System - Async Handler Utility
 * 
 * This utility wraps async route handlers to catch errors automatically
 * and pass them to Express error handling middleware. Enhanced for healthcare
 * operations with proper logging and error tracking.
 * 
 * Features:
 * - Automatic error catching for async operations
 * - Healthcare-specific error logging
 * - Request tracking for audit trails
 * - Performance monitoring for medical operations
 */

/**
 * Enhanced Async Handler for Healthcare Operations
 * 
 * Wraps async functions to handle Promise rejections and errors
 * Includes healthcare-specific logging and monitoring
 * 
 * @param {Function} requestHandler - The async route handler function
 * @returns {Function} - Wrapped handler with error catching
 */
const asyncHandler = (requestHandler) => {
    return async (req, res, next) => {
        try {
            // Start performance monitoring for healthcare operations
            const startTime = Date.now();
            
            // Add operation context for healthcare logging
            req.operationContext = {
                requestId: req.requestId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                endpoint: req.originalUrl,
                method: req.method,
                userType: req.user?.role || 'anonymous',
                startTime: startTime
            };

            // Execute the async handler
            const result = await Promise.resolve(requestHandler(req, res, next));
            
            // Log successful healthcare operations
            const duration = Date.now() - startTime;
            if (duration > 5000) { // Log slow operations (>5 seconds)
                console.warn(`🐌 Slow healthcare operation detected:`, {
                    requestId: req.operationContext.requestId,
                    endpoint: req.originalUrl,
                    duration: `${duration}ms`,
                    userType: req.operationContext.userType
                });
            }
            
            return result;
            
        } catch (error) {
            // Enhanced error logging for healthcare compliance
            const errorContext = {
                requestId: req.operationContext?.requestId,
                endpoint: req.originalUrl,
                method: req.method,
                userType: req.user?.role || 'anonymous',
                timestamp: new Date().toISOString(),
                errorType: error.constructor.name,
                statusCode: error.statusCode || 500
            };
            
            // Log healthcare operation errors
            console.error('🚨 Healthcare Operation Error:', {
                ...errorContext,
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
            
            // Pass error to Express error handler
            next(error);
        }
    };
};

/**
 * Alternative Try-Catch Method for Healthcare Operations
 * More explicit error handling with healthcare-specific responses
 */
const asyncHandlerWithTryCatch = (fn) => async (req, res, next) => {
    try {
        // Execute the healthcare operation
        await fn(req, res, next);
        
    } catch (error) {
        // Healthcare-specific error response structure
        const healthcareError = {
            success: false,
            message: error.message || "Healthcare operation failed",
            statusCode: error.statusCode || 500,
            requestId: req.requestId,
            timestamp: new Date().toISOString(),
            endpoint: req.originalUrl
        };
        
        // Add additional context for development
        if (process.env.NODE_ENV === 'development') {
            healthcareError.stack = error.stack;
            healthcareError.details = error.details;
        }
        
        // Log the error for healthcare compliance
        console.error(`❌ Healthcare Error [${healthcareError.requestId}]:`, {
            endpoint: req.originalUrl,
            method: req.method,
            error: error.message,
            userType: req.user?.role || 'anonymous'
        });
        
        // Send healthcare-formatted error response
        res.status(healthcareError.statusCode).json(healthcareError);
    }
};

/**
 * Specialized Healthcare Operation Handler
 * For critical medical operations that require additional monitoring
 */
const healthcareOperationHandler = (operationType) => (requestHandler) => {
    return async (req, res, next) => {
        const operationStart = Date.now();
        
        try {
            // Log start of critical healthcare operation
            console.log(`🏥 Starting ${operationType} operation:`, {
                requestId: req.requestId,
                endpoint: req.originalUrl,
                userType: req.user?.role,
                patientId: req.body?.patientId || req.params?.patientId,
                timestamp: new Date().toISOString()
            });
            
            // Execute the healthcare operation
            const result = await Promise.resolve(requestHandler(req, res, next));
            
            // Log successful completion
            const duration = Date.now() - operationStart;
            console.log(`✅ ${operationType} operation completed:`, {
                requestId: req.requestId,
                duration: `${duration}ms`,
                success: true
            });
            
            return result;
            
        } catch (error) {
            // Log critical healthcare operation failure
            console.error(`🚨 CRITICAL: ${operationType} operation failed:`, {
                requestId: req.requestId,
                error: error.message,
                endpoint: req.originalUrl,
                duration: `${Date.now() - operationStart}ms`,
                patientId: req.body?.patientId || req.params?.patientId
            });
            
            // Add operation context to error
            error.operationType = operationType;
            error.isCriticalHealthcareOperation = true;
            
            next(error);
        }
    };
};

// Export all handler variants
export { 
    asyncHandler,
    asyncHandlerWithTryCatch,
    healthcareOperationHandler
};

