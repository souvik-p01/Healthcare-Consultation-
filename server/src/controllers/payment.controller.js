/**
 * Healthcare System - Payment Controller
 * 
 * Handles payment processing and management for healthcare system.
 * 
 * Features:
 * - Payment processing for consultations and services
 * - Multiple payment methods (card, bank transfer, digital wallets)
 * - Invoice generation and management
 * - Payment refunds and disputes
 * - Payment history and receipts
 * - Insurance claim integration
 * - Multi-currency support
 */

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Payment } from "../models/payment.model.js";
import { User } from "../models/User.model.js";
import { Patient } from "../models/Patient.model.js";
import { Doctor } from "../models/doctor.model.js";
import { Appointment } from "../models/appointment.model.js";
import { Invoice } from "../models/invoice.model.js";
import { 
    processStripePayment,
    createStripeCustomer,
    createStripePaymentIntent,
    confirmStripePayment,
    refundStripePayment
} from "../utils/stripeUtils.js";
import { 
    sendPaymentConfirmation,
    sendPaymentReceipt,
    sendInvoice,
    sendRefundConfirmation
} from "../utils/emailUtils.js";
import { generateInvoiceNumber } from "../utils/invoiceUtils.js";

/**
 * CREATE PAYMENT INTENT
 * Create a payment intent for Stripe processing
 * 
 * POST /api/v1/payments/create-intent
 * Requires: verifyJWT middleware
 */
const createPaymentIntent = asyncHandler(async (req, res) => {
    const {
        amount,
        currency = 'usd',
        appointmentId,
        serviceType,
        description,
        metadata = {}
    } = req.body;

    const userId = req.user._id;
    const userRole = req.user.role;

    console.log("💳 Creating payment intent for user:", userId);

    // 1. Validation - Check required fields
    if (!amount || amount <= 0) {
        throw new ApiError(400, "Valid payment amount is required");
    }

    if (!serviceType) {
        throw new ApiError(400, "Service type is required");
    }

    // 2. Verify appointment if provided
    let appointment = null;
    if (appointmentId) {
        appointment = await Appointment.findById(appointmentId)
            .populate({
                path: 'patientId',
                populate: {
                    path: 'userId',
                    select: 'firstName lastName email'
                }
            })
            .populate({
                path: 'doctorId',
                select: 'firstName lastName consultationFee specialization'
            });

        if (!appointment) {
            throw new ApiError(404, "Appointment not found");
        }

        // Verify user has access to this appointment
        if (userRole === 'patient') {
            const patientUser = await User.findById(userId).populate('patientId');
            if (!patientUser?.patientId || 
                appointment.patientId._id.toString() !== patientUser.patientId._id.toString()) {
                throw new ApiError(403, "Access denied. You can only pay for your own appointments.");
            }
        }

        // Use doctor's consultation fee if amount not specified
        if (!amount && appointment.doctorId?.consultationFee) {
            amount = appointment.doctorId.consultationFee;
        }
    }

    // 3. Get or create Stripe customer
    let stripeCustomerId;
    const user = await User.findById(userId);
    
    if (user.stripeCustomerId) {
        stripeCustomerId = user.stripeCustomerId;
    } else {
        // Create new Stripe customer
        const customer = await createStripeCustomer({
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            phone: user.phoneNumber,
            metadata: {
                userId: userId.toString(),
                userRole: user.role
            }
        });
        
        stripeCustomerId = customer.id;
        
        // Save Stripe customer ID to user
        await User.findByIdAndUpdate(userId, {
            stripeCustomerId: stripeCustomerId
        });
    }

    // 4. Create payment intent
    const paymentIntent = await createStripePaymentIntent({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency,
        customer: stripeCustomerId,
        description: description || `Payment for ${serviceType}`,
        metadata: {
            userId: userId.toString(),
            userRole: userRole,
            appointmentId: appointmentId || '',
            serviceType: serviceType,
            ...metadata
        }
    });

    // 5. Create pending payment record
    const payment = await Payment.create({
        patientId: userRole === 'patient' ? user.patientId : (appointment?.patientId?._id || null),
        doctorId: appointment?.doctorId?._id || null,
        appointmentId: appointmentId || null,
        amount: amount,
        currency: currency,
        serviceType: serviceType,
        description: description || `Payment for ${serviceType}`,
        paymentMethod: 'card',
        status: 'pending',
        stripePaymentIntentId: paymentIntent.id,
        stripeCustomerId: stripeCustomerId,
        metadata: {
            ...metadata,
            clientSecret: paymentIntent.client_secret
        }
    });

    console.log('✅ Payment intent created:', paymentIntent.id);

    return res.status(201).json(
        new ApiResponse(
            201, 
            {
                paymentIntent: {
                    id: paymentIntent.id,
                    client_secret: paymentIntent.client_secret,
                    amount: paymentIntent.amount,
                    currency: paymentIntent.currency,
                    status: paymentIntent.status
                },
                payment: {
                    id: payment._id,
                    amount: payment.amount,
                    currency: payment.currency,
                    serviceType: payment.serviceType
                }
            }, 
            "Payment intent created successfully"
        )
    );
});

/**
 * CONFIRM PAYMENT
 * Confirm and process a payment after successful Stripe payment
 * 
 * POST /api/v1/payments/confirm
 * Requires: verifyJWT middleware
 */
const confirmPayment = asyncHandler(async (req, res) => {
    const {
        paymentIntentId,
        paymentMethodId,
        savePaymentMethod = false
    } = req.body;

    const userId = req.user._id;

    console.log("✅ Confirming payment:", paymentIntentId);

    if (!paymentIntentId) {
        throw new ApiError(400, "Payment intent ID is required");
    }

    // 1. Find pending payment
    const payment = await Payment.findOne({
        stripePaymentIntentId: paymentIntentId,
        status: 'pending'
    })
    .populate({
        path: 'patientId',
        populate: {
            path: 'userId',
            select: 'firstName lastName email phoneNumber'
        }
    })
    .populate({
        path: 'doctorId',
        select: 'firstName lastName email specialization'
    })
    .populate({
        path: 'appointmentId',
        select: 'appointmentDate appointmentTime type'
    });

    if (!payment) {
        throw new ApiError(404, "Pending payment not found");
    }

    // 2. Verify user ownership
    if (payment.patientId.userId._id.toString() !== userId.toString()) {
        throw new ApiError(403, "Access denied. You can only confirm your own payments.");
    }

    // 3. Confirm payment with Stripe
    const confirmedPayment = await confirmStripePayment(paymentIntentId, paymentMethodId);

    if (confirmedPayment.status !== 'succeeded') {
        throw new ApiError(400, `Payment failed: ${confirmedPayment.status}`);
    }

    // 4. Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // 5. Create invoice
    const invoice = await Invoice.create({
        invoiceNumber,
        patientId: payment.patientId._id,
        doctorId: payment.doctorId?._id || null,
        appointmentId: payment.appointmentId?._id || null,
        paymentId: payment._id,
        amount: payment.amount,
        currency: payment.currency,
        items: [
            {
                description: payment.description,
                amount: payment.amount,
                quantity: 1
            }
        ],
        taxAmount: 0, // Could be calculated based on location
        totalAmount: payment.amount,
        status: 'paid',
        dueDate: new Date(),
        paidDate: new Date(),
        metadata: {
            stripeChargeId: confirmedPayment.charges.data[0]?.id,
            paymentMethod: confirmedPayment.payment_method_types?.[0] || 'card'
        }
    });

    // 6. Update payment status
    const updatedPayment = await Payment.findByIdAndUpdate(
        payment._id,
        {
            $set: {
                status: 'completed',
                paidAt: new Date(),
                stripeChargeId: confirmedPayment.charges.data[0]?.id,
                paymentMethod: confirmedPayment.payment_method_types?.[0] || 'card',
                invoiceId: invoice._id,
                metadata: {
                    ...payment.metadata,
                    stripePaymentMethod: paymentMethodId,
                    savePaymentMethod: savePaymentMethod
                }
            }
        },
        { new: true, runValidators: true }
    )
    .populate({
        path: 'patientId',
        populate: {
            path: 'userId',
            select: 'firstName lastName email'
        }
    })
    .populate({
        path: 'doctorId',
        select: 'firstName lastName'
    })
    .populate('invoiceId');

    // 7. Update appointment status if applicable
    if (payment.appointmentId) {
        await Appointment.findByIdAndUpdate(payment.appointmentId, {
            $set: { 
                paymentStatus: 'paid',
                paidAt: new Date()
            }
        });
    }

    // 8. Save payment method if requested
    if (savePaymentMethod && paymentMethodId) {
        await User.findByIdAndUpdate(userId, {
            $set: {
                defaultPaymentMethod: paymentMethodId
            }
        });
    }

    // 9. Send confirmation emails
    try {
        // Send to patient
        await sendPaymentConfirmation(payment.patientId.userId.email, {
            patientName: `${payment.patientId.userId.firstName} ${payment.patientId.userId.lastName}`,
            amount: payment.amount,
            currency: payment.currency,
            serviceType: payment.serviceType,
            paymentDate: new Date().toDateString(),
            invoiceNumber: invoiceNumber
        });

        // Send receipt
        await sendPaymentReceipt(payment.patientId.userId.email, {
            patientName: `${payment.patientId.userId.firstName} ${payment.patientId.userId.lastName}`,
            invoiceNumber: invoiceNumber,
            amount: payment.amount,
            currency: payment.currency,
            serviceType: payment.serviceType,
            paymentDate: new Date().toDateString(),
            items: [
                {
                    description: payment.description,
                    amount: payment.amount
                }
            ]
        });

        // Send to doctor if applicable
        if (payment.doctorId) {
            await sendPaymentConfirmation(payment.doctorId.email, {
                doctorName: `${payment.doctorId.firstName} ${payment.doctorId.lastName}`,
                patientName: `${payment.patientId.userId.firstName} ${payment.patientId.userId.lastName}`,
                amount: payment.amount,
                currency: payment.currency,
                serviceType: payment.serviceType,
                paymentDate: new Date().toDateString()
            });
        }
    } catch (emailError) {
        console.error('⚠ Payment confirmation email failed:', emailError);
    }

    console.log('✅ Payment confirmed successfully:', paymentIntentId);

    return res.status(200).json(
        new ApiResponse(
            200, 
            {
                payment: updatedPayment,
                invoice: invoice
            }, 
            "Payment confirmed successfully"
        )
    );
});

/**
 * GET PAYMENT BY ID
 * Get detailed payment information
 * 
 * GET /api/v1/payments/:paymentId
 * Requires: verifyJWT middleware
 */
const getPaymentById = asyncHandler(async (req, res) => {
    const { paymentId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    console.log("🔍 Fetching payment:", paymentId);

    if (!paymentId) {
        throw new ApiError(400, "Payment ID is required");
    }

    // Find payment
    const payment = await Payment.findById(paymentId)
        .populate({
            path: 'patientId',
            populate: {
                path: 'userId',
                select: 'firstName lastName email phoneNumber'
            }
        })
        .populate({
            path: 'doctorId',
            select: 'firstName lastName specialization department'
        })
        .populate({
            path: 'appointmentId',
            select: 'appointmentDate appointmentTime type'
        })
        .populate({
            path: 'invoiceId',
            select: 'invoiceNumber items totalAmount taxAmount'
        })
        .lean();

    if (!payment) {
        throw new ApiError(404, "Payment not found");
    }

    // Access control based on user role
    if (userRole === 'patient') {
        if (payment.patientId.userId._id.toString() !== userId.toString()) {
            throw new ApiError(403, "Access denied. You can only view your own payments.");
        }
    } else if (userRole === 'doctor') {
        if (payment.doctorId && payment.doctorId._id.toString() !== userId.toString()) {
            throw new ApiError(403, "Access denied. You can only view payments for your services.");
        }
    }

    console.log('✅ Payment fetched successfully:', paymentId);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { payment },
                "Payment fetched successfully"
            )
        );
});

/**
 * GET USER PAYMENTS
 * Get all payments for the current user with filtering
 * 
 * GET /api/v1/payments
 * Requires: verifyJWT middleware
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

    console.log("📋 Fetching payments for user:", userId);

    // Build query based on user role
    const query = {};

    if (userRole === 'patient') {
        const patientUser = await User.findById(userId).populate('patientId');
        if (!patientUser?.patientId) {
            throw new ApiError(404, "Patient profile not found");
        }
        query.patientId = patientUser.patientId._id;
    } else if (userRole === 'doctor') {
        query.doctorId = userId;
    }

    // Apply filters
    if (status) query.status = status;
    if (serviceType) query.serviceType = serviceType;
    
    // Date range filter
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
            populate: {
                path: 'userId',
                select: 'firstName lastName phoneNumber'
            }
        })
        .populate({
            path: 'doctorId',
            select: 'firstName lastName specialization'
        })
        .populate({
            path: 'appointmentId',
            select: 'appointmentDate type'
        })
        .populate({
            path: 'invoiceId',
            select: 'invoiceNumber totalAmount'
        })
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

    const total = await Payment.countDocuments(query);

    // Calculate payment statistics
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
        byStatus: statusStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {})
    };

    console.log(`✅ Found ${payments.length} payments for user`);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    payments,
                    statistics,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(total / limit),
                        totalPayments: total,
                        hasNextPage: page * limit < total
                    }
                },
                "User payments fetched successfully"
            )
        );
});

/**
 * PROCESS REFUND
 * Process refund for a payment
 * 
 * POST /api/v1/payments/:paymentId/refund
 * Requires: verifyJWT middleware, admin or doctor role
 */
const processRefund = asyncHandler(async (req, res) => {
    const { paymentId } = req.params;
    const {
        refundAmount,
        reason,
        notes
    } = req.body;

    const userId = req.user._id;
    const userRole = req.user.role;

    console.log("🔄 Processing refund for payment:", paymentId);

    if (!paymentId || !refundAmount || !reason) {
        throw new ApiError(400, "Payment ID, refund amount, and reason are required");
    }

    if (refundAmount <= 0) {
        throw new ApiError(400, "Refund amount must be greater than 0");
    }

    // Find payment
    const payment = await Payment.findById(paymentId)
        .populate({
            path: 'patientId',
            populate: {
                path: 'userId',
                select: 'firstName lastName email phoneNumber'
            }
        })
        .populate({
            path: 'doctorId',
            select: 'firstName lastName email'
        });

    if (!payment) {
        throw new ApiError(404, "Payment not found");
    }

    // Check if payment is eligible for refund
    if (payment.status !== 'completed') {
        throw new ApiError(400, "Only completed payments can be refunded");
    }

    if (!payment.stripeChargeId) {
        throw new ApiError(400, "Payment does not have a Stripe charge ID");
    }

    // Verify permissions
    if (userRole === 'doctor') {
        if (!payment.doctorId || payment.doctorId._id.toString() !== userId.toString()) {
            throw new ApiError(403, "Access denied. You can only refund payments for your services.");
        }
    }

    // Check refund amount
    if (refundAmount > payment.amount) {
        throw new ApiError(400, "Refund amount cannot exceed original payment amount");
    }

    // Process refund with Stripe
    const refund = await refundStripePayment(payment.stripeChargeId, {
        amount: Math.round(refundAmount * 100), // Convert to cents
        reason: reason,
        metadata: {
            paymentId: paymentId,
            refundedBy: userId.toString(),
            reason: reason
        }
    });

    // Update payment status
    const updatedPayment = await Payment.findByIdAndUpdate(
        paymentId,
        {
            $set: {
                status: refundAmount === payment.amount ? 'refunded' : 'partially_refunded',
                refundedAmount: refundAmount,
                refundedAt: new Date(),
                refundedBy: userId,
                refundReason: reason,
                refundNotes: notes || '',
                stripeRefundId: refund.id,
                metadata: {
                    ...payment.metadata,
                    refundStatus: refund.status
                }
            }
        },
        { new: true, runValidators: true }
    )
    .populate({
        path: 'patientId',
        populate: {
            path: 'userId',
            select: 'firstName lastName email'
        }
    })
    .populate({
        path: 'refundedBy',
        select: 'firstName lastName'
    });

    // Update invoice status
    if (payment.invoiceId) {
        await Invoice.findByIdAndUpdate(payment.invoiceId, {
            $set: {
                status: 'refunded',
                refundAmount: refundAmount,
                refundDate: new Date()
            }
        });
    }

    // Update appointment payment status if applicable
    if (payment.appointmentId) {
        await Appointment.findByIdAndUpdate(payment.appointmentId, {
            $set: { 
                paymentStatus: 'refunded'
            }
        });
    }

    // Send refund confirmation
    try {
        await sendRefundConfirmation(payment.patientId.userId.email, {
            patientName: `${payment.patientId.userId.firstName} ${payment.patientId.userId.lastName}`,
            originalAmount: payment.amount,
            refundAmount: refundAmount,
            currency: payment.currency,
            reason: reason,
            refundDate: new Date().toDateString(),
            serviceType: payment.serviceType
        });
    } catch (emailError) {
        console.error('⚠ Refund confirmation email failed:', emailError);
    }

    console.log('✅ Refund processed successfully:', refund.id);

    return res.status(200).json(
        new ApiResponse(
            200, 
            {
                payment: updatedPayment,
                refund: {
                    id: refund.id,
                    amount: refundAmount,
                    status: refund.status,
                    reason: reason
                }
            }, 
            "Refund processed successfully"
        )
    );
});

/**
 * GET PAYMENT STATISTICS
 * Get payment statistics for dashboard
 * 
 * GET /api/v1/payments/statistics
 * Requires: verifyJWT middleware
 */
const getPaymentStatistics = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { period = 'month', doctorId, patientId } = req.query;

    console.log("📊 Fetching payment statistics for:", userRole, userId);

    // Build query based on user role
    const query = { status: 'completed' };
    
    if (userRole === 'doctor') {
        query.doctorId = userId;
    } else if (userRole === 'patient') {
        const patientUser = await User.findById(userId).populate('patientId');
        if (!patientUser?.patientId) {
            throw new ApiError(404, "Patient profile not found");
        }
        query.patientId = patientUser.patientId._id;
    }

    // Additional filters
    if (doctorId) query.doctorId = doctorId;
    if (patientId) query.patientId = patientId;

    // Date range based on period
    const dateRange = {};
    const now = new Date();
    
    switch (period) {
        case 'day':
            dateRange.$gte = new Date(now.setHours(0, 0, 0, 0));
            dateRange.$lte = new Date(now.setHours(23, 59, 59, 999));
            break;
        case 'week':
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            dateRange.$gte = startOfWeek;
            dateRange.$lte = new Date();
            break;
        case 'month':
            dateRange.$gte = new Date(now.getFullYear(), now.getMonth(), 1);
            dateRange.$lte = new Date();
            break;
        case 'year':
            dateRange.$gte = new Date(now.getFullYear(), 0, 1);
            dateRange.$lte = new Date();
            break;
        default:
            dateRange.$gte = new Date(now.getFullYear(), now.getMonth(), 1);
            dateRange.$lte = new Date();
    }

    query.paidAt = dateRange;

    // Get statistics
    const totalRevenue = await Payment.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const serviceTypeStats = await Payment.aggregate([
        { $match: query },
        { $group: { _id: '$serviceType', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const monthlyTrend = await Payment.aggregate([
        { $match: query },
        {
            $group: {
                _id: {
                    year: { $year: '$paidAt' },
                    month: { $month: '$paidAt' }
                },
                total: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
    ]);

    const refundStats = await Payment.aggregate([
        { 
            $match: { 
                ...query,
                status: { $in: ['refunded', 'partially_refunded'] }
            } 
        },
        { 
            $group: { 
                _id: null, 
                totalRefunded: { $sum: '$refundedAmount' },
                count: { $sum: 1 }
            } 
        }
    ]);

    const statistics = {
        period,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalTransactions: totalRevenue[0]?.count || 0,
        averageTransaction: totalRevenue[0] ? totalRevenue[0].total / totalRevenue[0].count : 0,
        byServiceType: serviceTypeStats.reduce((acc, stat) => {
            acc[stat._id] = {
                total: stat.total,
                count: stat.count
            };
            return acc;
        }, {}),
        monthlyTrend: monthlyTrend.map(item => ({
            period: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
            total: item.total,
            count: item.count
        })),
        refunds: {
            totalRefunded: refundStats[0]?.totalRefunded || 0,
            refundCount: refundStats[0]?.count || 0
        },
        dateRange: {
            from: dateRange.$gte,
            to: dateRange.$lte
        }
    };

    console.log('✅ Payment statistics fetched successfully');

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { statistics },
                "Payment statistics fetched successfully"
            )
        );
});

/**
 * CREATE MANUAL PAYMENT
 * Create a manual payment record (for cash, bank transfer, etc.)
 * 
 * POST /api/v1/payments/manual
 * Requires: verifyJWT middleware, admin or doctor role
 */
const createManualPayment = asyncHandler(async (req, res) => {
    const {
        patientId,
        doctorId,
        appointmentId,
        amount,
        currency = 'usd',
        serviceType,
        description,
        paymentMethod,
        referenceNumber,
        paidAt
    } = req.body;

    const createdBy = req.user._id;

    console.log("💵 Creating manual payment for patient:", patientId);

    // Validation
    const requiredFields = ['patientId', 'amount', 'serviceType', 'paymentMethod'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
        throw new ApiError(400, `Missing required fields: ${missingFields.join(', ')}`);
    }

    if (amount <= 0) {
        throw new ApiError(400, "Amount must be greater than 0");
    }

    // Verify patient exists
    const patient = await Patient.findById(patientId).populate('userId');
    if (!patient) {
        throw new ApiError(404, "Patient not found");
    }

    // Verify doctor if provided
    if (doctorId) {
        const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
        if (!doctor) {
            throw new ApiError(404, "Doctor not found");
        }
    }

    // Verify appointment if provided
    if (appointmentId) {
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            throw new ApiError(404, "Appointment not found");
        }
    }

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Create invoice
    const invoice = await Invoice.create({
        invoiceNumber,
        patientId,
        doctorId: doctorId || null,
        appointmentId: appointmentId || null,
        amount: amount,
        currency: currency,
        items: [
            {
                description: description || `Payment for ${serviceType}`,
                amount: amount,
                quantity: 1
            }
        ],
        totalAmount: amount,
        status: 'paid',
        dueDate: new Date(),
        paidDate: paidAt ? new Date(paidAt) : new Date()
    });

    // Create manual payment
    const payment = await Payment.create({
        patientId,
        doctorId: doctorId || null,
        appointmentId: appointmentId || null,
        invoiceId: invoice._id,
        amount: amount,
        currency: currency,
        serviceType: serviceType,
        description: description || `Payment for ${serviceType}`,
        paymentMethod: paymentMethod,
        status: 'completed',
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        referenceNumber: referenceNumber,
        createdBy: createdBy,
        metadata: {
            manual: true,
            referenceNumber: referenceNumber,
            createdBy: createdBy.toString()
        }
    });

    // Update appointment payment status if applicable
    if (appointmentId) {
        await Appointment.findByIdAndUpdate(appointmentId, {
            $set: { 
                paymentStatus: 'paid',
                paidAt: paidAt ? new Date(paidAt) : new Date()
            }
        });
    }

    // Populate payment for response
    const createdPayment = await Payment.findById(payment._id)
        .populate({
            path: 'patientId',
            populate: {
                path: 'userId',
                select: 'firstName lastName email'
            }
        })
        .populate({
            path: 'doctorId',
            select: 'firstName lastName'
        })
        .populate('invoiceId')
        .lean();

    // Send invoice to patient
    try {
        await sendInvoice(patient.userId.email, {
            patientName: `${patient.userId.firstName} ${patient.userId.lastName}`,
            invoiceNumber: invoiceNumber,
            amount: amount,
            currency: currency,
            serviceType: serviceType,
            paymentDate: (paidAt ? new Date(paidAt) : new Date()).toDateString(),
            paymentMethod: paymentMethod,
            items: [
                {
                    description: description || `Payment for ${serviceType}`,
                    amount: amount
                }
            ]
        });
    } catch (emailError) {
        console.error('⚠ Manual payment invoice email failed:', emailError);
    }

    console.log('✅ Manual payment created successfully');

    return res.status(201).json(
        new ApiResponse(
            201, 
            {
                payment: createdPayment,
                invoice: invoice
            }, 
            "Manual payment created successfully"
        )
    );
});

/**
 * GET PAYMENT METHODS
 * Get user's saved payment methods
 * 
 * GET /api/v1/payments/payment-methods
 * Requires: verifyJWT middleware
 */
const getPaymentMethods = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    console.log("💳 Fetching payment methods for user:", userId);

    const user = await User.findById(userId)
        .select('stripeCustomerId defaultPaymentMethod')
        .lean();

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // In a real implementation, you would fetch payment methods from Stripe
    // For now, return basic structure
    const paymentMethods = {
        stripeCustomerId: user.stripeCustomerId,
        defaultPaymentMethod: user.defaultPaymentMethod,
        methods: [] // Would be populated from Stripe API
    };

    console.log('✅ Payment methods fetched successfully');

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { paymentMethods },
                "Payment methods fetched successfully"
            )
        );
});

// Export all payment controller functions
export {
    createPaymentIntent,
    confirmPayment,
    getPaymentById,
    getUserPayments,
    processRefund,
    getPaymentStatistics,
    createManualPayment,
    getPaymentMethods
};

/**
 * Additional payment controllers that can be added:
 * - cancelPaymentIntent (cancel pending payment)
 * - updatePaymentMethod (change default payment method)
 * - getPaymentHistory (detailed transaction history)
 * - createSubscription (recurring payments)
 * - handleWebhook (Stripe webhook handler)
 * - exportPayments (PDF/Excel export)
 * - getPendingPayments (for admin)
 * - validateCoupon (discount code validation)
 */