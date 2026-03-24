// backend/controllers/payment.controller.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Payment } from "../models/payment.model.js";
import { User } from "../models/User.model.js";
import { Patient } from "../models/Patient.model.js";
import { Doctor } from "../models/doctor.model.js";
import { Appointment } from "../models/appointment.model.js";
import Invoice from "../models/invoice.model.js";
import {
    createRazorpayOrder,
    verifyRazorpaySignature,
    fetchRazorpayPayment,
    refundRazorpayPayment,
} from "../utils/razorpayUtils.js";
import {
    sendPaymentConfirmation,
    sendPaymentReceipt,
    sendInvoice,
    sendRefundConfirmation,
} from "../utils/emailUtils.js";
import { generateInvoiceNumber } from "../utils/invoiceUtils.js";

/**
 * CREATE RAZORPAY ORDER
 * POST /api/v1/payments/create-order
 */
const createPaymentOrder = asyncHandler(async (req, res) => {
    const {
        amount,
        currency = 'INR',
        appointmentId,
        serviceType,
        description,
        metadata = {}
    } = req.body;

    const userId = req.user._id;
    const userRole = req.user.role;

    if (!amount || amount <= 0) {
        throw new ApiError(400, "Valid payment amount is required");
    }
    if (!serviceType) {
        throw new ApiError(400, "Service type is required");
    }

    // Verify appointment if provided
    let appointment = null;
    if (appointmentId) {
        appointment = await Appointment.findById(appointmentId)
            .populate({
                path: 'patientId',
                populate: { path: 'userId', select: 'firstName lastName email' }
            })
            .populate({ path: 'doctorId', select: 'firstName lastName consultationFee' });

        if (!appointment) throw new ApiError(404, "Appointment not found");

        if (userRole === 'patient') {
            const patientUser = await User.findById(userId).populate('patientId');
            if (!patientUser?.patientId ||
                appointment.patientId._id.toString() !== patientUser.patientId._id.toString()) {
                throw new ApiError(403, "Access denied.");
            }
        }
    }

    // Create Razorpay order
    const razorpayOrder = await createRazorpayOrder({
        amount,
        currency,
        receipt: `receipt_${userId}_${Date.now()}`,
    });

    // Create pending payment record in DB
    const payment = await Payment.create({
        userId,
        patientId: userRole === 'patient' ? (await User.findById(userId).populate('patientId')).patientId?._id : appointment?.patientId?._id,
        doctorId: appointment?.doctorId?._id,
        appointmentId: appointmentId,
        amount,
        currency,
        serviceType,
        serviceDescription: description || `Payment for ${serviceType}`,
        paymentMethod: 'online',
        paymentGateway: 'razorpay',
        gatewayReference: razorpayOrder.id, // store order_id here
        status: 'pending',
        initiatedAt: new Date(),
        metadata: {
            ...metadata,
            razorpayOrderId: razorpayOrder.id,
            razorpayAmount: razorpayOrder.amount,
        },
    });

    return res.status(201).json(
        new ApiResponse(201, {
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            paymentId: payment._id,
        }, "Order created successfully")
    );
});

/**
 * CONFIRM PAYMENT (after Razorpay success)
 * POST /api/v1/payments/confirm
 */
const confirmPayment = asyncHandler(async (req, res) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
    } = req.body;

    const userId = req.user._id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new ApiError(400, "Missing payment verification data");
    }

    // Verify signature
    const isValid = verifyRazorpaySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
    );

    if (!isValid) {
        throw new ApiError(400, "Invalid payment signature");
    }

    // Find the pending payment using the order_id stored in gatewayReference
    const payment = await Payment.findOne({
        gatewayReference: razorpay_order_id,
        status: 'pending'
    })
        .populate({
            path: 'patientId',
            populate: { path: 'userId', select: 'firstName lastName email phoneNumber' }
        })
        .populate({ path: 'doctorId', select: 'firstName lastName email' })
        .populate('appointmentId');

    if (!payment) {
        throw new ApiError(404, "Pending payment not found");
    }

    // Fetch payment details from Razorpay (optional, for extra data)
    const razorpayPayment = await fetchRazorpayPayment(razorpay_payment_id);

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Create invoice
    const invoice = await Invoice.create({
        invoiceNumber,
        patientId: payment.patientId._id,
        doctorId: payment.doctorId?._id,
        appointmentId: payment.appointmentId?._id,
        paymentId: payment._id,
        amount: payment.amount,
        currency: payment.currency,
        items: [{
            description: payment.serviceDescription,
            amount: payment.amount,
            quantity: 1,
        }],
        totalAmount: payment.amount,
        status: 'paid',
        paidDate: new Date(),
    });

    // Update payment record
    const updatedPayment = await Payment.findByIdAndUpdate(
        payment._id,
        {
            $set: {
                status: 'completed',
                transactionId: razorpay_payment_id,
                gatewayTransactionId: razorpay_payment_id,
                gatewayReference: razorpay_order_id,
                completedAt: new Date(),
                invoice: {
                    invoiceNumber,
                    invoiceDate: new Date(),
                    dueDate: invoice.dueDate,
                },
                metadata: {
                    ...payment.metadata,
                    razorpaySignature: razorpay_signature,
                    razorpayPaymentMethod: razorpayPayment.method,
                    razorpayBank: razorpayPayment.bank,
                    razorpayCardLast4: razorpayPayment.card?.last4,
                    razorpayCardBrand: razorpayPayment.card?.network,
                },
            },
        },
        { new: true }
    );

    // Update appointment payment status if applicable
    if (payment.appointmentId) {
        await Appointment.findByIdAndUpdate(payment.appointmentId, {
            paymentStatus: 'paid',
            paidAt: new Date(),
        });
    }

    // Send emails (implement your email logic)
    try {
        await sendPaymentConfirmation(payment.patientId.userId.email, {
            patientName: `${payment.patientId.userId.firstName} ${payment.patientId.userId.lastName}`,
            amount: payment.amount,
            currency: payment.currency,
            serviceType: payment.serviceType,
            paymentDate: new Date().toDateString(),
            invoiceNumber,
        });
        // Also send receipt and invoice as needed
    } catch (emailError) {
        console.error('Email sending failed:', emailError);
    }

    return res.status(200).json(
        new ApiResponse(200, {
            payment: updatedPayment,
            invoice,
        }, "Payment confirmed successfully")
    );
});

/**
 * GET PAYMENT BY ID
 * GET /api/v1/payments/:paymentId
 */
const getPaymentById = asyncHandler(async (req, res) => {
    const { paymentId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const payment = await Payment.findById(paymentId)
        .populate({
            path: 'patientId',
            populate: { path: 'userId', select: 'firstName lastName email phoneNumber' }
        })
        .populate({ path: 'doctorId', select: 'firstName lastName specialization' })
        .populate('appointmentId')
        .populate('invoiceId')
        .lean();

    if (!payment) throw new ApiError(404, "Payment not found");

    // Access control
    if (userRole === 'patient' && payment.patientId?.userId?._id.toString() !== userId.toString()) {
        throw new ApiError(403, "Access denied.");
    }
    if (userRole === 'doctor' && payment.doctorId?._id.toString() !== userId.toString()) {
        throw new ApiError(403, "Access denied.");
    }

    return res.status(200).json(new ApiResponse(200, { payment }, "Payment fetched"));
});

/**
 * GET USER PAYMENTS (with filters)
 * GET /api/v1/payments
 */
const getUserPayments = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;
    const {
        status,
        serviceType,
        dateFrom,
        dateTo,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    if (userRole === 'patient') {
        const patientUser = await User.findById(userId).populate('patientId');
        if (!patientUser?.patientId) throw new ApiError(404, "Patient profile not found");
        query.patientId = patientUser.patientId._id;
    } else if (userRole === 'doctor') {
        query.doctorId = userId;
    }

    if (status) query.status = status;
    if (serviceType) query.serviceType = serviceType;
    if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
        if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const payments = await Payment.find(query)
        .populate({
            path: 'patientId',
            populate: { path: 'userId', select: 'firstName lastName' }
        })
        .populate({ path: 'doctorId', select: 'firstName lastName' })
        .populate('appointmentId')
        .populate('invoiceId')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

    const total = await Payment.countDocuments(query);

    // Statistics (optional)
    const totalAmount = await Payment.aggregate([
        { $match: { ...query, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const statusStats = await Payment.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const statistics = {
        totalPayments: total,
        totalAmount: totalAmount[0]?.total || 0,
        byStatus: statusStats.reduce((acc, stat) => { acc[stat._id] = stat.count; return acc; }, {})
    };

    return res.status(200).json(
        new ApiResponse(200, {
            payments,
            statistics,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalPayments: total,
                hasNextPage: page * limit < total
            }
        }, "User payments fetched")
    );
});

/**
 * PROCESS REFUND (Razorpay)
 * POST /api/v1/payments/:paymentId/refund
 */
const processRefund = asyncHandler(async (req, res) => {
    const { paymentId } = req.params;
    const { refundAmount, reason, notes } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    if (!refundAmount || refundAmount <= 0) {
        throw new ApiError(400, "Valid refund amount required");
    }

    const payment = await Payment.findById(paymentId)
        .populate({
            path: 'patientId',
            populate: { path: 'userId', select: 'firstName lastName email' }
        });

    if (!payment) throw new ApiError(404, "Payment not found");

    if (payment.status !== 'completed') {
        throw new ApiError(400, "Only completed payments can be refunded");
    }

    if (!payment.transactionId) {
        throw new ApiError(400, "No Razorpay transaction ID found");
    }

    if (refundAmount > payment.amount) {
        throw new ApiError(400, "Refund amount exceeds original amount");
    }

    // Call Razorpay refund API
    const refund = await refundRazorpayPayment(payment.transactionId, refundAmount, {
        reason: reason || 'Customer requested refund',
        refundedBy: userId.toString(),
        ...notes
    });

    // Update payment record
    payment.status = refundAmount === payment.amount ? 'refunded' : 'partially-refunded';
    payment.refundedAt = new Date();
    payment.refund = {
        refundId: refund.id,
        refundAmount,
        refundReason: reason,
        refundDate: new Date(),
        refundMethod: 'original',
        gatewayRefundId: refund.id,
    };
    await payment.save();

    // Update invoice status if needed
    if (payment.invoiceId) {
        await Invoice.findByIdAndUpdate(payment.invoiceId, {
            status: 'refunded',
            refundAmount,
            refundDate: new Date(),
        });
    }

    // Send refund email
    try {
        await sendRefundConfirmation(payment.patientId.userId.email, {
            patientName: `${payment.patientId.userId.firstName} ${payment.patientId.userId.lastName}`,
            originalAmount: payment.amount,
            refundAmount,
            currency: payment.currency,
            reason,
            refundDate: new Date().toDateString(),
            serviceType: payment.serviceType,
        });
    } catch (emailError) {
        console.error('Refund email failed:', emailError);
    }

    return res.status(200).json(
        new ApiResponse(200, { payment, refund }, "Refund processed successfully")
    );
});

// Keep the other functions (getPaymentStatistics, createManualPayment, getPaymentMethods) as they are,
// but ensure they don't rely on Stripe. For getPaymentStatistics, adjust aggregation to work with your data.
// For manual payment creation, it's already independent of gateway.

/**
 * GET PAYMENT STATISTICS
 * GET /api/v1/payments/statistics
 */
const getPaymentStatistics = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;

    const matchQuery = userRole === 'admin' ? {} : { userId };

    const [totalStats, byStatus, byService, monthly] = await Promise.all([
        Payment.aggregate([
            { $match: matchQuery },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]),
        Payment.aggregate([
            { $match: matchQuery },
            { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' } } }
        ]),
        Payment.aggregate([
            { $match: matchQuery },
            { $group: { _id: '$serviceType', count: { $sum: 1 }, amount: { $sum: '$amount' } } }
        ]),
        Payment.aggregate([
            { $match: { ...matchQuery, status: 'completed' } },
            { $group: {
                _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                amount: { $sum: '$amount' }, count: { $sum: 1 }
            }},
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 12 }
        ])
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            total: totalStats[0]?.total || 0,
            count: totalStats[0]?.count || 0,
            byStatus: byStatus.reduce((acc, s) => { acc[s._id] = { count: s.count, amount: s.amount }; return acc; }, {}),
            byService: byService.reduce((acc, s) => { acc[s._id] = { count: s.count, amount: s.amount }; return acc; }, {}),
            monthly
        }, 'Payment statistics fetched')
    );
});

/**
 * CREATE MANUAL PAYMENT
 * POST /api/v1/payments/manual
 */
const createManualPayment = asyncHandler(async (req, res) => {
    const { patientId, doctorId, appointmentId, amount, currency = 'INR', serviceType, description, paymentMethod = 'cash' } = req.body;
    const userId = req.user._id;

    if (!amount || amount <= 0) throw new ApiError(400, 'Valid amount required');
    if (!serviceType) throw new ApiError(400, 'Service type required');

    const invoiceNumber = await generateInvoiceNumber();

    const payment = await Payment.create({
        userId,
        patientId,
        doctorId,
        appointmentId,
        amount,
        currency,
        serviceType,
        serviceDescription: description || `Manual payment for ${serviceType}`,
        paymentMethod,
        paymentGateway: 'manual',
        status: 'completed',
        completedAt: new Date(),
        invoice: { invoiceNumber, invoiceDate: new Date() }
    });

    return res.status(201).json(new ApiResponse(201, { payment }, 'Manual payment created'));
});

/**
 * GET PAYMENT METHODS (optional – Razorpay doesn't have saved methods like Stripe; you can return an empty array)
 */
const getPaymentMethods = asyncHandler(async (req, res) => {
    // For now, return an empty list or you could implement your own saved cards logic
    return res.status(200).json(
        new ApiResponse(200, { paymentMethods: [] }, "No saved methods")
    );
});

export {
    createPaymentOrder,
    confirmPayment,
    getPaymentById,
    getUserPayments,
    processRefund,
    getPaymentStatistics,
    createManualPayment,
    getPaymentMethods,
};