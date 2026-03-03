// server/src/models/invoice.model.js

import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'Item description is required'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    default: 1
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  type: {
    type: String,
    enum: ['consultation', 'service', 'medication', 'lab_test', 'other'],
    default: 'other'
  },
  notes: {
    type: String,
    trim: true
  }
}, { _id: true });

const paymentHistorySchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
    sparse: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative']
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash', 'insurance', 'other'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['success', 'failed', 'pending', 'refunded'],
    default: 'pending'
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  metadata: {
    type: Map,
    of: String
  }
}, { _id: true, timestamps: true });

const invoiceSchema = new mongoose.Schema({
  // Invoice identification
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },

  // Related entities
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient ID is required'],
    index: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor ID is required'],
    index: true
  },
  consultationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consultation',
    index: true,
    sparse: true
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    index: true,
    sparse: true
  },

  // Invoice details
  items: [invoiceItemSchema],
  
  // Financial details
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative']
  },
  taxRate: {
    type: Number,
    default: 0,
    min: [0, 'Tax rate cannot be negative'],
    max: [100, 'Tax rate cannot exceed 100%']
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: [0, 'Tax amount cannot be negative']
  },
  discountRate: {
    type: Number,
    default: 0,
    min: [0, 'Discount rate cannot be negative'],
    max: [100, 'Discount rate cannot exceed 100%']
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: [0, 'Discount amount cannot be negative']
  },
  total: {
    type: Number,
    required: true,
    min: [0, 'Total cannot be negative']
  },

  // Payment details
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'cancelled', 'refunded', 'partially_paid'],
    default: 'pending',
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash', 'insurance', 'other'],
    default: 'other'
  },
  paymentDate: {
    type: Date
  },
  paymentHistory: [paymentHistorySchema],

  // Insurance details (if applicable)
  insuranceClaim: {
    provider: String,
    policyNumber: String,
    claimNumber: String,
    coverageAmount: Number,
    copayAmount: Number,
    status: {
      type: String,
      enum: ['pending', 'approved', 'denied', 'paid']
    }
  },

  // Dates
  issueDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },

  // Additional information
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
    trim: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  termsAndConditions: {
    type: String,
    default: 'Payment is due within 30 days. Late payments may incur additional fees.'
  },

  // Billing address
  billingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  metadata: {
    type: Map,
    of: String
  },

  // Audit fields
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
invoiceSchema.index({ patientId: 1, createdAt: -1 });
invoiceSchema.index({ doctorId: 1, createdAt: -1 });
invoiceSchema.index({ paymentStatus: 1, dueDate: 1 });
invoiceSchema.index({ invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ 'paymentHistory.transactionId': 1 }, { sparse: true });

// Virtual for days overdue
invoiceSchema.virtual('daysOverdue').get(function() {
  if (this.paymentStatus === 'paid' || this.paymentStatus === 'cancelled') {
    return 0;
  }
  
  const today = new Date();
  const due = new Date(this.dueDate);
  
  if (today > due) {
    const diffTime = Math.abs(today - due);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  
  return 0;
});

// Virtual for payment progress
invoiceSchema.virtual('paymentProgress').get(function() {
  if (this.paymentStatus === 'paid') return 100;
  if (this.paymentStatus === 'pending' || this.paymentStatus === 'overdue') return 0;
  
  // For partially paid, calculate percentage
  if (this.paymentHistory && this.paymentHistory.length > 0) {
    const paidAmount = this.paymentHistory
      .filter(p => p.paymentStatus === 'success')
      .reduce((sum, p) => sum + p.amount, 0);
    
    return Math.min(100, Math.round((paidAmount / this.total) * 100));
  }
  
  return 0;
});

// Pre-save middleware to calculate totals
invoiceSchema.pre('save', function(next) {
  try {
    // Recalculate totals if items are modified
    if (this.isModified('items') || this.isNew) {
      // Calculate subtotal
      this.subtotal = this.items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);

      // Calculate discount
      this.discountAmount = (this.subtotal * this.discountRate) / 100;

      // Calculate taxable amount after discount
      const taxableAmount = this.subtotal - this.discountAmount;

      // Calculate tax
      this.taxAmount = (taxableAmount * this.taxRate) / 100;

      // Calculate total
      this.total = taxableAmount + this.taxAmount;

      // Round to 2 decimal places
      this.subtotal = Number(this.subtotal.toFixed(2));
      this.discountAmount = Number(this.discountAmount.toFixed(2));
      this.taxAmount = Number(this.taxAmount.toFixed(2));
      this.total = Number(this.total.toFixed(2));
    }

    // Update payment status based on date
    if (!this.isModified('paymentStatus')) {
      const today = new Date();
      if (this.paymentStatus === 'pending' && today > this.dueDate) {
        this.paymentStatus = 'overdue';
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Pre-find middleware to exclude deleted invoices
invoiceSchema.pre(/^find/, function(next) {
  this.where({ isDeleted: { $ne: true } });
  next();
});

// Instance methods
invoiceSchema.methods.markAsPaid = async function(transactionId, paymentMethod) {
  this.paymentStatus = 'paid';
  this.paymentDate = new Date();
  
  // Add to payment history
  this.paymentHistory.push({
    transactionId,
    amount: this.total,
    paymentMethod,
    paymentStatus: 'success',
    paymentDate: new Date()
  });
  
  return this.save();
};

invoiceSchema.methods.addPartialPayment = async function(amount, transactionId, paymentMethod) {
  if (amount <= 0) {
    throw new Error('Payment amount must be positive');
  }
  
  // Add to payment history
  this.paymentHistory.push({
    transactionId,
    amount,
    paymentMethod,
    paymentStatus: 'success',
    paymentDate: new Date()
  });
  
  // Check if fully paid
  const totalPaid = this.paymentHistory
    .filter(p => p.paymentStatus === 'success')
    .reduce((sum, p) => sum + p.amount, 0);
  
  if (totalPaid >= this.total) {
    this.paymentStatus = 'paid';
    this.paymentDate = new Date();
  } else {
    this.paymentStatus = 'partially_paid';
  }
  
  return this.save();
};

invoiceSchema.methods.cancelInvoice = async function(reason, cancelledBy) {
  this.paymentStatus = 'cancelled';
  this.notes = this.notes 
    ? `${this.notes}\nCancelled: ${reason}`
    : `Cancelled: ${reason}`;
  this.deletedAt = new Date();
  this.deletedBy = cancelledBy;
  
  return this.save();
};

invoiceSchema.methods.processRefund = async function(transactionId, amount, reason) {
  if (this.paymentStatus !== 'paid') {
    throw new Error('Only paid invoices can be refunded');
  }
  
  // Add refund record
  this.paymentHistory.push({
    transactionId,
    amount: -amount,
    paymentMethod: this.paymentMethod,
    paymentStatus: 'refunded',
    paymentDate: new Date(),
    metadata: new Map([['reason', reason]])
  });
  
  this.paymentStatus = 'refunded';
  
  return this.save();
};

// Static methods
invoiceSchema.statics.getPatientInvoices = async function(patientId, options = {}) {
  const { limit = 50, skip = 0, status } = options;
  
  const query = { patientId };
  if (status) {
    query.paymentStatus = status;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('doctorId', 'name email specialization')
    .populate('consultationId');
};

invoiceSchema.statics.getDoctorInvoices = async function(doctorId, options = {}) {
  const { limit = 50, skip = 0, status } = options;
  
  const query = { doctorId };
  if (status) {
    query.paymentStatus = status;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('patientId', 'name email')
    .populate('consultationId');
};

invoiceSchema.statics.getRevenueReport = async function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        paymentStatus: 'paid',
        paymentDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$paymentDate' },
          month: { $month: '$paymentDate' },
          day: { $dayOfMonth: '$paymentDate' }
        },
        totalRevenue: { $sum: '$total' },
        count: { $sum: 1 },
        averageAmount: { $avg: '$total' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);
};

invoiceSchema.statics.getOutstandingInvoices = async function() {
  const today = new Date();
  
  return this.find({
    paymentStatus: { $in: ['pending', 'overdue'] },
    dueDate: { $lt: today }
  }).populate('patientId', 'name email phone');
};

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;