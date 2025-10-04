
/**
 * Healthcare System - CORS Configuration Middleware
 * 
 * Handles Cross-Origin Resource Sharing for healthcare applications.
 */

/**
 * Custom CORS middleware with healthcare-specific settings
 */
export const corsMiddleware = (req, res, next) => {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin) || !origin) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Patient-ID, X-Medical-Access-Token');
        res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count, X-Page-Count, X-Response-Time, X-Request-ID');
        res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    }
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    
    next();
};

export default {
    // CORS
    corsMiddleware
};