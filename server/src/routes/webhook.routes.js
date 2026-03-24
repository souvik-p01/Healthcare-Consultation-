import express from 'express';
import crypto from 'crypto';
import { Payment } from '../models/payment.model.js';

const router = express.Router();

router.post('/razorpay', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const signature = req.headers['x-razorpay-signature'];
        const body = req.body;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (signature !== expectedSignature) {
            return res.status(400).json({ success: false, message: 'Invalid signature' });
        }

        const event = JSON.parse(body);

        if (event.event === 'payment.captured') {
            const { order_id, id: payment_id } = event.payload.payment.entity;
            await Payment.findOneAndUpdate(
                { gatewayReference: order_id },
                { status: 'completed', transactionId: payment_id }
            );
        } else if (event.event === 'payment.failed') {
            const { order_id } = event.payload.payment.entity;
            await Payment.findOneAndUpdate(
                { gatewayReference: order_id },
                { status: 'failed' }
            );
        }

        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/test', (req, res) => {
    res.status(200).json({ success: true, message: 'Webhook endpoint is working', timestamp: new Date().toISOString() });
});

export default router;
