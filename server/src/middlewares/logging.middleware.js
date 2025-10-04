
/**
 * Healthcare System - Request Logging Middleware
 * 
 * Logs all healthcare API requests for audit trail and monitoring.
 */

/**
 * Request logger middleware
 */
export const requestLogger = (req, res, next) => {
    // Store request start time
    req.startTime = Date.now();
    
    // Generate unique request ID if not present
    if (!req.requestId) {
        req.requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Log request details
    console.log(`📥 [${new Date().toISOString()}] Healthcare Request:`, {
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.userId || 'anonymous',
        userRole: req.user?.role || 'none'
    });
    
    // Capture response
    const originalSend = res.send;
    res.send = function (data) {
        const duration = Date.now() - req.startTime;
        
        console.log(`📤 [${new Date().toISOString()}] Healthcare Response:`, {
            requestId: req.requestId,
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            userId: req.user?.userId || 'anonymous'
        });
        
        originalSend.call(this, data);
    };
    
    next();
};

/**
 * Response time header middleware
 */
export const responseTime = (req, res, next) => {
    req.startTime = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - req.startTime;
        res.setHeader('X-Response-Time', `${duration}ms`);
    });
    
    next();
};


export default {
    // Logging
    requestLogger,
    responseTime
};