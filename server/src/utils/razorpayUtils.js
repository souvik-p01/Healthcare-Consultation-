// backend/utils/razorpayUtils.js
import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create a Razorpay order
 */
export const createRazorpayOrder = async ({ amount, currency = 'INR', receipt }) => {
    const options = {
        amount: Math.round(amount * 100), // paise
        currency,
        receipt: receipt || `receipt_${Date.now()}`,
        payment_capture: 1,
    };
    return await razorpayInstance.orders.create(options);
};

/**
 * Verify Razorpay payment signature
 */
export const verifyRazorpaySignature = (orderId, paymentId, signature) => {
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');
    return expectedSignature === signature;
};

/**
 * Fetch payment details from Razorpay
 */
export const fetchRazorpayPayment = async (paymentId) => {
    return await razorpayInstance.payments.fetch(paymentId);
};

/**
 * Refund a payment
 */
export const refundRazorpayPayment = async (paymentId, amount, notes = {}) => {
    return await razorpayInstance.payments.refund(paymentId, {
        amount: Math.round(amount * 100),
        notes,
    });
};