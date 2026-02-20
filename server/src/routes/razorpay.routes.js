// backend/routes/razorpay.routes.js
import { Router } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const router = Router();

// Initialize Razorpay
const getRazorpayInstance = () => {
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};

// Create order endpoint
router.post('/create-order', async (req, res) => {
    try {
        const { amount, currency = 'INR', receipt } = req.body;
        
        const razorpay = getRazorpayInstance();
        const options = {
            amount: Math.round(amount * 100),
            currency,
            receipt: receipt || `receipt_${Date.now()}`,
            payment_capture: 1,
        };

        const order = await razorpay.orders.create(options);
        
        res.json({
            success: true,
            id: order.id,
            amount: order.amount,
            currency: order.currency,
            receipt: order.receipt,
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to create order' 
        });
    }
});

// Verify payment endpoint
router.post('/verify-payment', async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        const body = razorpay_order_id + '|' + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            res.json({
                success: true,
                message: 'Payment verified successfully',
                orderId: razorpay_order_id,
                paymentId: razorpay_payment_id,
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Invalid signature',
            });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({
            success: false,
            message: 'Verification failed',
        });
    }
});

// Get payment details
router.get('/payment/:paymentId', async (req, res) => {
    try {
        const { paymentId } = req.params;
        const razorpay = getRazorpayInstance();
        const payment = await razorpay.payments.fetch(paymentId);
        res.json({ success: true, payment });
    } catch (error) {
        console.error('Error fetching payment:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch payment details',
        });
    }
});

export default router;