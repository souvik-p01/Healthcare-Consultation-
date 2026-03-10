/**
 * Webhook Controller - Handle payment webhook events
 * 
 * This controller processes webhook events from payment gateways
 * and updates the database accordingly.
 */

import logger from "../utils/logger.js"; // Changed to default import
import { Payment } from "../models/payment.model.js";
import { Invoice } from "../models/invoice.model.js";
import { Appointment } from "../models/appointment.model.js";
import crypto from "crypto";

/**
 * Handle Razorpay webhook events
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const handleRazorpayWebhook = async (req, res) => {
    try {
        // Get the raw body and signature
        const webhookBody = req.body;
        const webhookSignature = req.headers['x-razorpay-signature'];
        
        // Log webhook receipt
        logger.info("Razorpay webhook received", {
            signature: webhookSignature ? "present" : "missing",
            contentType: req.headers['content-type']
        });

        // In production, verify the webhook signature
        if (process.env.NODE_ENV === 'production') {
            const isValid = verifyRazorpayWebhookSignature(
                webhookBody,
                webhookSignature,
                process.env.RAZORPAY_WEBHOOK_SECRET
            );
            
            if (!isValid) {
                logger.error("Invalid webhook signature");
                return res.status(400).json({ error: "Invalid signature" });
            }
        }

        // Parse the webhook body
        const event = JSON.parse(webhookBody.toString());
        const { event: eventType, payload } = event;

        logger.info(`Processing Razorpay webhook event: ${eventType}`);

        // Handle different event types
        switch (eventType) {
            case 'payment.authorized':
                await handlePaymentAuthorized(payload);
                break;
                
            case 'payment.captured':
                await handlePaymentCaptured(payload);
                break;
                
            case 'payment.failed':
                await handlePaymentFailed(payload);
                break;
                
            case 'payment.refunded':
                await handlePaymentRefunded(payload);
                break;
                
            case 'order.paid':
                await handleOrderPaid(payload);
                break;
                
            default:
                logger.info(`Unhandled webhook event type: ${eventType}`);
        }

        // Always return 200 to acknowledge receipt
        res.status(200).json({ received: true });

    } catch (error) {
        logger.error("Error processing webhook:", error);
        // Still return 200 to prevent webhook retries
        res.status(200).json({ received: true, error: error.message });
    }
};

/**
 * Verify Razorpay webhook signature
 * 
 * @param {Buffer} body - Raw request body
 * @param {string} signature - Webhook signature header
 * @param {string} secret - Webhook secret
 * @returns {boolean} - Whether signature is valid
 */
const verifyRazorpayWebhookSignature = (body, signature, secret) => {
    try {
        if (!signature || !secret) return true; // Skip verification if not configured
        
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');
            
        return crypto.timingSafeEqual(
            Buffer.from(expectedSignature),
            Buffer.from(signature)
        );
    } catch (error) {
        logger.error("Error verifying webhook signature:", error);
        return false;
    }
};

/**
 * Handle payment.authorized event
 */
const handlePaymentAuthorized = async (payload) => {
    const { payment } = payload;
    logger.info(`Payment authorized: ${payment.id}`);
    
    // Update payment status in database
    await Payment.findOneAndUpdate(
        { transactionId: payment.id },
        { 
            status: 'authorized',
            metadata: { ...payment }
        }
    );
};

/**
 * Handle payment.captured event
 */
const handlePaymentCaptured = async (payload) => {
    const { payment } = payload;
    logger.info(`Payment captured: ${payment.id}`);
    
    // Update payment status in database
    const updatedPayment = await Payment.findOneAndUpdate(
        { transactionId: payment.id },
        { 
            status: 'completed',
            completedAt: new Date(),
            metadata: { ...payment }
        },
        { new: true }
    );

    // Update related invoice and appointment
    if (updatedPayment) {
        await Invoice.findOneAndUpdate(
            { paymentId: updatedPayment._id },
            { status: 'paid', paidAt: new Date() }
        );

        if (updatedPayment.appointmentId) {
            await Appointment.findOneAndUpdate(
                { _id: updatedPayment.appointmentId },
                { paymentStatus: 'paid', paidAt: new Date() }
            );
        }
    }
};

/**
 * Handle payment.failed event
 */
const handlePaymentFailed = async (payload) => {
    const { payment } = payload;
    logger.warn(`Payment failed: ${payment.id}`, payment.error_description);
    
    await Payment.findOneAndUpdate(
        { transactionId: payment.id },
        { 
            status: 'failed',
            failure: {
                reason: payment.error_description,
                code: payment.error_code,
                gatewayResponse: payment
            }
        }
    );
};

/**
 * Handle payment.refunded event
 */
const handlePaymentRefunded = async (payload) => {
    const { payment } = payload;
    logger.info(`Payment refunded: ${payment.id}`);
    
    await Payment.findOneAndUpdate(
        { transactionId: payment.id },
        { 
            status: 'refunded',
            refundedAt: new Date(),
            refund: {
                refundId: payment.refund_id,
                refundAmount: payment.amount / 100,
                refundReason: 'Customer requested',
                refundDate: new Date()
            }
        }
    );
};

/**
 * Handle order.paid event
 */
const handleOrderPaid = async (payload) => {
    const { order } = payload;
    logger.info(`Order paid: ${order.id}`);
    
    // Create payment record if not exists
    await Payment.findOneAndUpdate(
        { gatewayReference: order.id },
        {
            status: 'completed',
            completedAt: new Date(),
            metadata: { ...order }
        },
        { upsert: true }
    );
};

/**
 * Handle Stripe webhook (placeholder for future)
 */
export const handleStripeWebhook = async (req, res) => {
    logger.info("Stripe webhook received");
    res.status(200).json({ received: true });
};

/**
 * Handle PayPal webhook (placeholder for future)
 */
export const handlePayPalWebhook = async (req, res) => {
    logger.info("PayPal webhook received");
    res.status(200).json({ received: true });
};