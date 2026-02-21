// server/src/utils/invoiceUtils.js

/**
 * Generate a unique invoice number
 * Format: INV-YYYYMMDD-XXXXX (where XXXXX is a random 5-digit number)
 */
export const generateInvoiceNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 90000 + 10000); // 5-digit random number
  
  return `INV-${year}${month}${day}-${random}`;
};

/**
 * Calculate invoice totals including tax and discounts
 * @param {Array} items - Array of invoice items with price and quantity
 * @param {number} taxRate - Tax rate percentage (default: 0)
 * @param {number} discountRate - Discount rate percentage (default: 0)
 */
export const calculateInvoiceTotals = (items, taxRate = 0, discountRate = 0) => {
  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => {
    const itemTotal = (item.price || 0) * (item.quantity || 1);
    return sum + itemTotal;
  }, 0);

  // Calculate discount amount
  const discountAmount = (subtotal * discountRate) / 100;

  // Calculate taxable amount after discount
  const taxableAmount = subtotal - discountAmount;

  // Calculate tax amount
  const taxAmount = (taxableAmount * taxRate) / 100;

  // Calculate total
  const total = taxableAmount + taxAmount;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    taxableAmount: Number(taxableAmount.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    total: Number(total.toFixed(2)),
    taxRate,
    discountRate
  };
};

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: 'USD')
 */
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
};

/**
 * Create invoice items from consultation data
 * @param {Object} consultation - Consultation object
 * @param {Object} doctor - Doctor object with consultation fee
 */
export const createInvoiceItemsFromConsultation = (consultation, doctor) => {
  const items = [];

  // Add consultation fee
  if (doctor?.consultationFee) {
    items.push({
      description: `Consultation with Dr. ${doctor.name || 'Doctor'}`,
      quantity: 1,
      price: doctor.consultationFee,
      type: 'consultation'
    });
  }

  // Add any additional services (if applicable)
  if (consultation?.services && Array.isArray(consultation.services)) {
    consultation.services.forEach(service => {
      items.push({
        description: service.name || 'Additional Service',
        quantity: service.quantity || 1,
        price: service.price || 0,
        type: 'service'
      });
    });
  }

  return items;
};

/**
 * Validate invoice data
 * @param {Object} invoiceData - Invoice data to validate
 */
export const validateInvoiceData = (invoiceData) => {
  const errors = [];

  // Check required fields
  if (!invoiceData.patientId) {
    errors.push('Patient ID is required');
  }

  if (!invoiceData.doctorId) {
    errors.push('Doctor ID is required');
  }

  if (!invoiceData.items || !Array.isArray(invoiceData.items) || invoiceData.items.length === 0) {
    errors.push('At least one invoice item is required');
  } else {
    // Validate each item
    invoiceData.items.forEach((item, index) => {
      if (!item.description) {
        errors.push(`Item ${index + 1}: Description is required`);
      }
      if (typeof item.price !== 'number' || item.price < 0) {
        errors.push(`Item ${index + 1}: Valid price is required`);
      }
      if (typeof item.quantity !== 'number' || item.quantity < 1) {
        errors.push(`Item ${index + 1}: Valid quantity is required`);
      }
    });
  }

  // Validate tax rate if provided
  if (invoiceData.taxRate !== undefined && (typeof invoiceData.taxRate !== 'number' || invoiceData.taxRate < 0 || invoiceData.taxRate > 100)) {
    errors.push('Tax rate must be between 0 and 100');
  }

  // Validate discount rate if provided
  if (invoiceData.discountRate !== undefined && (typeof invoiceData.discountRate !== 'number' || invoiceData.discountRate < 0 || invoiceData.discountRate > 100)) {
    errors.push('Discount rate must be between 0 and 100');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Generate invoice PDF data structure
 * @param {Object} invoice - Invoice object
 * @param {Object} patient - Patient object
 * @param {Object} doctor - Doctor object
 */
export const generateInvoicePDFData = (invoice, patient, doctor) => {
  return {
    invoiceNumber: invoice.invoiceNumber,
    date: invoice.createdAt || new Date(),
    dueDate: invoice.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    
    // Patient information
    patient: {
      name: patient?.name || 'N/A',
      email: patient?.email || 'N/A',
      phone: patient?.phone || 'N/A',
      address: patient?.address || 'N/A'
    },
    
    // Doctor information
    doctor: {
      name: doctor?.name || 'N/A',
      specialization: doctor?.specialization || 'N/A',
      licenseNumber: doctor?.licenseNumber || 'N/A'
    },
    
    // Invoice items
    items: invoice.items || [],
    
    // Totals
    subtotal: invoice.subtotal || 0,
    taxRate: invoice.taxRate || 0,
    taxAmount: invoice.taxAmount || 0,
    discountRate: invoice.discountRate || 0,
    discountAmount: invoice.discountAmount || 0,
    total: invoice.total || 0,
    
    // Payment details
    paymentStatus: invoice.paymentStatus || 'pending',
    paymentMethod: invoice.paymentMethod || null,
    paymentDate: invoice.paymentDate || null,
    
    // Notes
    notes: invoice.notes || 'Thank you for choosing our healthcare services!',
    terms: 'Payment is due within 30 days. Please contact us for any questions regarding this invoice.'
  };
};

/**
 * Calculate payment due date
 * @param {Date} startDate - Start date (default: current date)
 * @param {number} days - Number of days until due (default: 30)
 */
export const calculateDueDate = (startDate = new Date(), days = 30) => {
  const dueDate = new Date(startDate);
  dueDate.setDate(dueDate.getDate() + days);
  return dueDate;
};

/**
 * Get payment status display text
 * @param {string} status - Payment status code
 */
export const getPaymentStatusDisplay = (status) => {
  const statusMap = {
    'pending': { text: 'Pending', color: 'yellow', icon: '⏳' },
    'paid': { text: 'Paid', color: 'green', icon: '✅' },
    'overdue': { text: 'Overdue', color: 'red', icon: '⚠️' },
    'cancelled': { text: 'Cancelled', color: 'gray', icon: '❌' },
    'refunded': { text: 'Refunded', color: 'blue', icon: '↩️' },
    'partially_paid': { text: 'Partially Paid', color: 'orange', icon: '💰' }
  };

  return statusMap[status] || { text: status, color: 'gray', icon: '❓' };
};

/**
 * Check if invoice is overdue
 * @param {Date} dueDate - Invoice due date
 * @param {string} paymentStatus - Current payment status
 */
export const isInvoiceOverdue = (dueDate, paymentStatus) => {
  if (paymentStatus === 'paid' || paymentStatus === 'cancelled' || paymentStatus === 'refunded') {
    return false;
  }
  
  const today = new Date();
  const due = new Date(dueDate);
  return today > due;
};

/**
 * Calculate late payment fee
 * @param {number} amount - Invoice amount
 * @param {number} daysOverdue - Number of days overdue
 * @param {number} dailyRate - Daily late fee rate (default: 0.001 = 0.1%)
 */
export const calculateLateFee = (amount, daysOverdue, dailyRate = 0.001) => {
  if (daysOverdue <= 0) return 0;
  
  const fee = amount * dailyRate * daysOverdue;
  return Number(fee.toFixed(2));
};

/**
 * Group invoices by status
 * @param {Array} invoices - Array of invoice objects
 */
export const groupInvoicesByStatus = (invoices) => {
  return invoices.reduce((groups, invoice) => {
    const status = invoice.paymentStatus || 'pending';
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(invoice);
    return groups;
  }, {});
};

/**
 * Calculate total revenue from paid invoices
 * @param {Array} invoices - Array of invoice objects
 * @param {Date} startDate - Optional start date filter
 * @param {Date} endDate - Optional end date filter
 */
export const calculateTotalRevenue = (invoices, startDate = null, endDate = null) => {
  return invoices
    .filter(invoice => {
      if (invoice.paymentStatus !== 'paid') return false;
      
      if (startDate && endDate) {
        const paymentDate = new Date(invoice.paymentDate);
        return paymentDate >= startDate && paymentDate <= endDate;
      }
      
      return true;
    })
    .reduce((total, invoice) => total + (invoice.total || 0), 0);
};

/**
 * Format invoice for email sending
 * @param {Object} invoice - Invoice object
 * @param {Object} patient - Patient object
 */
export const formatInvoiceEmail = (invoice, patient) => {
  const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A';
  const total = formatCurrency(invoice.total || 0);
  
  return {
    subject: `Invoice ${invoice.invoiceNumber} from Healthcare System`,
    html: `
      <h2>Invoice from Healthcare Consultation System</h2>
      <p>Dear ${patient?.name || 'Patient'},</p>
      <p>Your invoice <strong>${invoice.invoiceNumber}</strong> has been generated.</p>
      <p><strong>Amount Due:</strong> ${total}</p>
      <p><strong>Due Date:</strong> ${dueDate}</p>
      <p>Please log in to your account to view and pay this invoice.</p>
      <p>Thank you for choosing our services!</p>
    `
  };
};

export default {
  generateInvoiceNumber,
  calculateInvoiceTotals,
  formatCurrency,
  createInvoiceItemsFromConsultation,
  validateInvoiceData,
  generateInvoicePDFData,
  calculateDueDate,
  getPaymentStatusDisplay,
  isInvoiceOverdue,
  calculateLateFee,
  groupInvoicesByStatus,
  calculateTotalRevenue,
  formatInvoiceEmail
};