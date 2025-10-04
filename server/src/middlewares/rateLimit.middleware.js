
/**
 * Healthcare System - Rate Limiting Middleware
 * 
 * Prevents API abuse and ensures fair usage of healthcare services.
 */

/**
 * Simple in-memory rate limiter (use Redis in production)
 */
const requestCounts = new Map();

/**
 * Rate limiting middleware factory
 */
export const rateLimiter = (options = {}) => {
    const {
        windowMs = 15 * 60 * 1000, // 15 minutes
        maxRequests = 100,
        message = "Too many requests from this IP, please try again later",
        skipSuccessfulRequests = false,
        keyGenerator = (req) => req.ip
    } = options;
    
    return (req, res, next) => {
        const key = keyGenerator(req);
        const now = Date.now();
        
        // Get or create request record
        let requestData = requestCounts.get(key);
        
        if (!requestData || now - requestData.resetTime > windowMs) {
            requestData = {
                count: 0,
                resetTime: now + windowMs
            };
        }
        
        requestData.count++;
        requestCounts.set(key, requestData);
        
        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - requestData.count));
        res.setHeader('X-RateLimit-Reset', new Date(requestData.resetTime).toISOString());
        
        // Check if limit exceeded
        if (requestData.count > maxRequests) {
            console.warn(`⚠️ Rate limit exceeded for ${key}`, {
                count: requestData.count,
                limit: maxRequests,
                path: req.originalUrl
            });
            
            return res.status(429).json({
                success: false,
                message,
                retryAfter: Math.ceil((requestData.resetTime - now) / 1000)
            });
        }
        
        next();
    };
};

/**
 * Strict rate limiter for sensitive operations
 */
export const strictRateLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,
    message: "Too many sensitive operation requests. Please try again later."
});

/**
 * Login rate limiter
 */
export const loginRateLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: "Too many login attempts. Please try again after 15 minutes.",
    keyGenerator: (req) => req.body.email || req.ip
});

export default {
    // Rate limiting
    rateLimiter,
    strictRateLimiter,
    loginRateLimiter
};