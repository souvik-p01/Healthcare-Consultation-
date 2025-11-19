/**
 * Healthcare System - Payment Model
 * 
 * Manages financial transactions, billing, invoices,
 * and payment processing for healthcare services.
 */

import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const paymentSchema = new Schema(
    {
        // Payer Information
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User reference is required'],
            //index: true
        },
        patientId: {
            type: Schema.Types.ObjectId,
            ref: 'Patient',
            //index: true
        },
        
        // Service Reference
        appointmentId: {
            type: Schema.Types.ObjectId,
            ref: 'Appointment',
            //index: true
        },
        serviceType: {
            type: String,
            enum: ['consultation', 'procedure', 'lab-test', 'pharmacy', 'other'],
            required: true
        },
        serviceDescription: {
            type: String,
            required: true,
            trim: true
        },
        
        // Payment Details
        amount: {
            type: Number,
            required: [true, 'Payment amount is required'],
            min: 0
        },
        currency: {
            type: String,
            default: 'INR',
            uppercase: true
        },
        taxAmount: {
            type: Number,
            default: 0,
            min: 0
        },
        discountAmount: {
            type: Number,
            default: 0,
            min: 0
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },
        
        // Payment Method
        paymentMethod: {
            type: String,
            enum: ['card', 'cash', 'online', 'insurance', 'wallet', 'upi', 'net-banking'],
            required: true,
            //index: true
        },
        paymentGateway: {
            type: String,
            trim: true
        },
        
        // Transaction Information
        transactionId: {
            type: String,
            trim: true,
            unique: true,
            sparse: true,
            //index: true
        },
        gatewayTransactionId: {
            type: String,
            trim: true
        },
        gatewayReference: {
            type: String,
            trim: true
        },
        
        // Status Tracking
        status: {
            type: String,
            enum: [
                'pending', 
                'processing', 
                'completed', 
                'failed', 
                'cancelled', 
                'refunded',
                'partially-refunded',
                'on-hold'
            ],
            default: 'pending',
            required: true,
            //index: true
        },
        
        // Timestamps for status changes
        initiatedAt: {
            type: Date,
            default: Date.now
        },
        processedAt: Date,
        completedAt: Date,
        failedAt: Date,
        cancelledAt: Date,
        refundedAt: Date,
        
        // Invoice Information
        invoice: {
            invoiceNumber: {
                type: String,
                unique: true,
                sparse: true,
                //index: true
            },
            invoiceDate: {
                type: Date,
                default: Date.now
            },
            dueDate: Date,
            items: [{
                description: {
                    type: String,
                    required: true,
                    trim: true
                },
                quantity: {
                    type: Number,
                    default: 1,
                    min: 1
                },
                unitPrice: {
                    type: Number,
                    required: true,
                    min: 0
                },
                amount: {
                    type: Number,
                    required: true,
                    min: 0
                },
                taxRate: {
                    type: Number,
                    default: 0,
                    min: 0,
                    max: 100
                }
            }],
            notes: String,
            terms: String
        },
        
        // Card Payment Details (PCI Compliant - store only what's necessary)
        cardDetails: {
            last4: String,
            brand: String,
            expiryMonth: Number,
            expiryYear: Number,
            cardHolderName: String
        },
        
        // Online Payment Details
        onlinePayment: {
            gateway: String,
            paymentMethod: String,
            bankName: String,
            upiId: String,
            walletType: String
        },
        
        // Insurance Information
        insurance: {
            claimId: String,
            insuranceProvider: String,
            policyNumber: String,
            approvedAmount: Number,
            copayAmount: Number,
            deductibleAmount: Number,
            claimStatus: {
                type: String,
                enum: ['submitted', 'approved', 'rejected', 'pending']
            }
        },
        
        // Refund Information
        refund: {
            refundId: String,
            refundAmount: Number,
            refundReason: String,
            refundDate: Date,
            refundMethod: String,
            gatewayRefundId: String
        },
        
        // Failure Information
        failure: {
            reason: String,
            code: String,
            message: String,
            gatewayResponse: Schema.Types.Mixed
        },
        
        // Receipt and Documentation
        receiptUrl: String, // Cloudinary URL
        paymentProof: String, // Cloudinary URL for cash payments
        documents: [{
            name: String,
            url: String,
            type: String
        }],
        
        // Billing Address
        billingAddress: {
            name: String,
            street: String,
            city: String,
            state: String,
            zipCode: String,
            country: String,
            phoneNumber: String,
            email: String
        },
        
        // Payment Metadata
        metadata: {
            ipAddress: String,
            userAgent: String,
            deviceId: String,
            location: {
                type: { type: String, default: 'Point' },
                coordinates: [Number] // [longitude, latitude]
            }
        },
        
        // Recurring Payment Information
        isRecurring: {
            type: Boolean,
            default: false
        },
        recurringDetails: {
            frequency: {
                type: String,
                enum: ['daily', 'weekly', 'monthly', 'yearly']
            },
            nextPaymentDate: Date,
            totalCycles: Number,
            completedCycles: Number
        },
        
        // Settlement Information
        settlement: {
            settled: {
                type: Boolean,
                default: false
            },
            settlementDate: Date,
            settlementAmount: Number,
            fees: {
                gatewayFee: Number,
                processingFee: Number,
                taxOnFees: Number
            },
            netAmount: Number
        },
        
        // Audit Trail
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        modifiedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    {
        timestamps: true
    }
);

/**
 * Indexes for optimized queries
 */
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ appointmentId: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });
// paymentSchema.index({ transactionId: 1 });
// paymentSchema.index({ 'invoice.invoiceNumber': 1 });
paymentSchema.index({ createdAt: 1 });
paymentSchema.index({ 'metadata.location': '2dsphere' });

/**
 * Add aggregation pagination plugin
 */
paymentSchema.plugin(mongooseAggregatePaginate);

/**
 * Virtual: Is Successful
 */
paymentSchema.virtual('isSuccessful').get(function() {
    return this.status === 'completed';
});

/**
 * Virtual: Is Refundable
 */
paymentSchema.virtual('isRefundable').get(function() {
    return this.status === 'completed' && 
           !this.refund?.refundAmount &&
           this.completedAt > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days
});

/**
 * Virtual: Payment Age (days since initiation)
 */
paymentSchema.virtual('paymentAgeInDays').get(function() {
    const today = new Date();
    const diffTime = today - this.initiatedAt;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

/**
 * Virtual: Formatted Amount
 */
paymentSchema.virtual('formattedAmount').get(function() {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: this.currency
    }).format(this.totalAmount);
});

/**
 * Pre-save middleware: Calculate total amount and generate invoice number
 */
paymentSchema.pre('save', function(next) {
    // Calculate total amount
    this.totalAmount = this.amount + this.taxAmount - this.discountAmount;
    
    // Generate invoice number if not present
    if (!this.invoice.invoiceNumber && this.isNew) {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        this.invoice.invoiceNumber = `INV${timestamp}${random}`;
    }
    
    // Set due date if not present (30 days from invoice date)
    if (!this.invoice.dueDate) {
        const dueDate = new Date(this.invoice.invoiceDate);
        dueDate.setDate(dueDate.getDate() + 30);
        this.invoice.dueDate = dueDate;
    }
    
    next();
});

/**
 * Instance Method: Mark as completed
 */
paymentSchema.methods.markCompleted = async function(transactionId = null, gatewayData = {}) {
    this.status = 'completed';
    this.transactionId = transactionId || this.transactionId;
    this.gatewayTransactionId = gatewayData.gatewayTransactionId;
    this.gatewayReference = gatewayData.gatewayReference;
    this.completedAt = new Date();
    
    // Store card details if available (only last4 and brand for PCI compliance)
    if (gatewayData.cardDetails) {
        this.cardDetails = {
            last4: gatewayData.cardDetails.last4,
            brand: gatewayData.cardDetails.brand,
            expiryMonth: gatewayData.cardDetails.expiryMonth,
            expiryYear: gatewayData.cardDetails.expiryYear,
            cardHolderName: gatewayData.cardDetails.cardHolderName
        };
    }
    
    return await this.save();
};

/**
 * Instance Method: Mark as failed
 */
paymentSchema.methods.markFailed = async function(failureReason, gatewayResponse = null) {
    this.status = 'failed';
    this.failure = {
        reason: failureReason,
        code: gatewayResponse?.code,
        message: gatewayResponse?.message,
        gatewayResponse: gatewayResponse
    };
    this.failedAt = new Date();
    return await this.save();
};

/**
 * Instance Method: Process refund
 */
paymentSchema.methods.processRefund = async function(refundAmount, reason, refundMethod = 'original') {
    if (!this.isRefundable) {
        throw new Error('Payment is not refundable');
    }
    
    if (refundAmount > this.totalAmount) {
        throw new Error('Refund amount cannot exceed payment amount');
    }
    
    this.refund = {
        refundAmount: refundAmount,
        refundReason: reason,
        refundDate: new Date(),
        refundMethod: refundMethod
    };
    
    this.status = refundAmount === this.totalAmount ? 'refunded' : 'partially-refunded';
    this.refundedAt = new Date();
    
    return await this.save();
};

/**
 * Instance Method: Generate receipt
 */
paymentSchema.methods.generateReceiptData = function() {
    return {
        invoiceNumber: this.invoice.invoiceNumber,
        invoiceDate: this.invoice.invoiceDate,
        patientName: this.billingAddress?.name,
        serviceDescription: this.serviceDescription,
        amount: this.amount,
        taxAmount: this.taxAmount,
        discountAmount: this.discountAmount,
        totalAmount: this.totalAmount,
        paymentMethod: this.paymentMethod,
        transactionId: this.transactionId,
        status: this.status
    };
};

/**
 * Static Method: Find payments by user
 */
paymentSchema.statics.findByUser = async function(userId, options = {}) {
    const { status, limit = 50, page = 1 } = options;
    
    const query = { userId };
    if (status) query.status = status;
    
    return await this.find(query)
        .populate('appointmentId', 'appointmentDate doctorId')
        .populate({
            path: 'appointmentId',
            populate: { path: 'doctorId', select: 'firstName lastName specialization' }
        })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit);
};

/**
 * Static Method: Find pending payments
 */
paymentSchema.statics.findPendingPayments = async function() {
    return await this.find({
        status: { $in: ['pending', 'processing'] },
        initiatedAt: { $lt: new Date(Date.now() - 30 * 60 * 1000) } // Older than 30 minutes
    })
    .populate('userId', 'firstName lastName email phoneNumber')
    .limit(100);
};

/**
 * Static Method: Get payment statistics
 */
paymentSchema.statics.getStatistics = async function(startDate, endDate) {
    return await this.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            }
        },
        {
            $facet: {
                total: [{ $count: 'count' }],
                byStatus: [
                    { $group: { _id: '$status', count: { $sum: 1 } } }
                ],
                byPaymentMethod: [
                    { $group: { _id: '$paymentMethod', count: { $sum: 1 }, totalAmount: { $sum: '$totalAmount' } } }
                ],
                byServiceType: [
                    { $group: { _id: '$serviceType', count: { $sum: 1 }, totalAmount: { $sum: '$totalAmount' } } }
                ],
                revenueStats: [
                    {
                        $group: {
                            _id: null,
                            totalRevenue: { $sum: '$totalAmount' },
                            successfulPayments: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                            failedPayments: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
                            refundedAmount: { $sum: { $ifNull: ['$refund.refundAmount', 0] } }
                        }
                    }
                ],
                dailyRevenue: [
                    { $match: { status: 'completed' } },
                    {
                        $group: {
                            _id: {
                                year: { $year: '$completedAt' },
                                month: { $month: '$completedAt' },
                                day: { $dayOfMonth: '$completedAt' }
                            },
                            dailyRevenue: { $sum: '$totalAmount' },
                            transactionCount: { $sum: 1 }
                        }
                    },
                    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
                ]
            }
        }
    ]);
};

/**
 * Static Method: Find payments for settlement
 */
paymentSchema.statics.findForSettlement = async function(gateway = null) {
    const query = {
        status: 'completed',
        'settlement.settled': false,
        completedAt: { $lt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) } // Older than 2 days
    };
    
    if (gateway) {
        query.paymentGateway = gateway;
    }
    
    return await this.find(query)
        .limit(500);
};

export const Payment = mongoose.model("Payment", paymentSchema);