/**
 * Webhook Routes - Handle payment webhooks from Razorpay
 * 
 * This file contains routes for handling webhook callbacks from payment gateways.
 * Webhooks are used to receive real-time updates about payment events.
 */

import express from "express";
import { handleRazorpayWebhook } from "../controllers/webhook.controller.js";
import logger from "../utils/logger.js"; // Changed to default import

const router = express.Router();

/**
 * Razorpay webhook endpoint
 * 
 * This endpoint receives webhook events from Razorpay for:
 * - payment.authorized
 * - payment.captured
 * - payment.failed
 * - payment.refunded
 * - order.paid
 * - subscription.charged
 * 
 * IMPORTANT: This route must use raw body parser, not JSON parser
 */
router.post("/razorpay", 
    express.raw({ type: 'application/json' }), 
    handleRazorpayWebhook
);

/**
 * Test webhook endpoint (for development/testing)
 */
router.get("/test", (req, res) => {
    logger.info("Webhook test endpoint called");
    res.status(200).json({
        success: true,
        message: "Webhook endpoint is working",
        timestamp: new Date().toISOString()
    });
});

/**
 * Webhook health check
 */
router.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Webhook service is healthy",
        timestamp: new Date().toISOString()
    });
});

export default router;