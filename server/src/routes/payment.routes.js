// backend/routes/payment.routes.js
import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js'; // adjust path
import {
    createPaymentOrder,
    confirmPayment,
    getPaymentById,
    getUserPayments,
    processRefund,
    getPaymentStatistics,
    createManualPayment,
    getPaymentMethods,
} from '../controllers/payment.controller.js';

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Payment initiation
router.post('/create-order', createPaymentOrder);
router.post('/confirm', confirmPayment);

// Payment retrieval
router.get('/', getUserPayments);
router.get('/statistics', getPaymentStatistics);
router.get('/payment-methods', getPaymentMethods);
router.get('/:paymentId', getPaymentById);

// Refund
router.post('/:paymentId/refund', processRefund);

// Manual payment (admin/doctor only – add role middleware if needed)
router.post('/manual', createManualPayment);

export default router;