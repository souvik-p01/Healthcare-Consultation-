// /**
//  * Healthcare System - Error Handling Middleware
//  * 
//  * Centralized error handling for healthcare applications with
//  * HIPAA-compliant error responses and audit logging.
//  */
// /*
// import { ApiError } from "../utils/ApiError.js";

// /**
//  * Global error handling middleware
//  */
// export const errorHandler = (err, req, res, next) => {
//     let error = err;
    
//     // Convert non-ApiError errors to ApiError
//     if (!(error instanceof ApiError)) {
//         const statusCode = error.statusCode || error.status || 500;
//         const message = error.message || "An unexpected error occurred in the healthcare system";
//         error = new ApiError(statusCode, message, [], error.stack);
//     }
    
//     // Log error for healthcare compliance
//     console.error(`🚨 [${new Date().toISOString()}] Healthcare System Error:`, {
//         statusCode: error.statusCode,
//         message: error.message,
//         path: req.originalUrl,
//         method: req.method,
//         ip: req.ip,
//         userId: req.user?.userId || 'anonymous',
//         errorId: error.errorId,
//         stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
//     });
    
//     // Prepare error response
//     const response = {
//         success: false,
//         statusCode: error.statusCode,
//         message: error.message,
//         errorId: error.errorId,
//         timestamp: new Date().toISOString(),
//         requestId: req.requestId
//     };
    
//     // Add validation errors if present
//     if (error.errors && error.errors.length > 0) {
//         response.errors = error.errors;
//     }
    
//     // Add stack trace in development
//     if (process.env.NODE_ENV === 'development') {
//         response.stack = error.stack;
//     }
    
//     // Send error response
//     res.status(error.statusCode).json(response);
// };

// /**
//  * 404 Not Found handler
//  */
// export const notFoundHandler = (req, res, next) => {
//     const error = new ApiError(
//         404,
//         `Healthcare API endpoint not found: ${req.originalUrl}`,
//         [],
//         '',
//         { endpoint: req.originalUrl, method: req.method }
//     );
//     next(error);
// };

// /**
//  * Async error wrapper (alternative to asyncHandler utility)
//  */
// export const catchAsync = (fn) => {
//     return (req, res, next) => {
//         Promise.resolve(fn(req, res, next)).catch(next);
//     };
// };

// export default {
//     // Error handling
//     errorHandler,
//     notFoundHandler,
//     catchAsync,
// };


/**
 * Healthcare System - Error Handling Middleware
 */

import { ApiError } from "../utils/ApiError.js";

/**
 * Global error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
    let error = err;
    
    // Convert non-ApiError errors to ApiError
    if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode || error.status || 500;
        const message = error.message || "An unexpected error occurred in the healthcare system";
        error = new ApiError(statusCode, message, [], error.stack);
    }
    
    // Log error for healthcare compliance
    console.error(`🚨 [${new Date().toISOString()}] Healthcare System Error:`, {
        statusCode: error.statusCode,
        message: error.message,
        path: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userId: req.user?.userId || 'anonymous',
        errorId: error.errorId,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    // Prepare error response
    const response = {
        success: false,
        statusCode: error.statusCode,
        message: error.message,
        errorId: error.errorId,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
    };
    
    // Add validation errors if present
    if (error.errors && error.errors.length > 0) {
        response.errors = error.errors;
    }
    
    // Add stack trace in development
    if (process.env.NODE_ENV === 'development') {
        response.stack = error.stack;
    }
    
    // Send error response
    res.status(error.statusCode).json(response);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req, res, next) => {
    const error = new ApiError(404, `Healthcare API endpoint not found: ${req.originalUrl}`);
    next(error);
};

/**
 * Async error wrapper (alternative to asyncHandler utility)
 */
export const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

export default {
    errorHandler,
    notFoundHandler,
    catchAsync
};