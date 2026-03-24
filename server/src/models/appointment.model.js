/**
 * Healthcare System - Appointment Model
 * 
 * Manages patient-doctor appointments with scheduling,
 * status tracking, and consultation details.
 */

import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const appointmentSchema = new Schema(
    {
        // Patient Information
        patientId: {
            type: Schema.Types.ObjectId,
            ref: 'Patient',
            required: [true, 'Patient reference is required']
        },
        
        // Doctor Information
        doctorId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Doctor reference is required']
        },
        
        // Appointment Details
        appointmentDate: {
            type: Date,
            required: [true, 'Appointment date is required']
        },
        appointmentTime: {
            type: String,
            required: [true, 'Appointment time is required'],
            match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)']
        },
        duration: {
            type: Number, // in minutes
            default: 30,
            min: [15, 'Duration must be at least 15 minutes'],
            max: [120, 'Duration cannot exceed 120 minutes']
        },
        
        // Appointment Type
        appointmentType: {
            type: String,
            enum: {
                values: ['in-person', 'video', 'phone', 'chat'],
                message: '{VALUE} is not a valid appointment type'
            },
            default: 'in-person',
            required: true
        },
        
        // Status Tracking
        status: {
            type: String,
            enum: {
                values: ['scheduled', 'confirmed', 'checked-in', 'in-progress', 'completed', 'cancelled', 'no-show', 'rescheduled'],
                message: '{VALUE} is not a valid status'
            },
            default: 'scheduled',
            required: true
        },
        
        // Patient Symptoms and Concerns
        symptoms: {
            type: String,
            trim: true,
            maxlength: [1000, 'Symptoms cannot exceed 1000 characters']
        },
        chiefComplaint: {
            type: String,
            trim: true,
            maxlength: [500, 'Chief complaint cannot exceed 500 characters']
        },
        
        // Medical Information
        priority: {
            type: String,
            enum: {
                values: ['routine', 'urgent', 'emergency'],
                message: '{VALUE} is not a valid priority level'
            },
            default: 'routine'
        },
        
        // Location Information
        location: {
            type: String,
            trim: true
        },
        roomNumber: String,
        
        // Video Consultation Details
        videoConsultation: {
            meetingId: String,
            meetingUrl: String,
            joinUrl: String,
            hostUrl: String
        },
        
        // Notes and Instructions
        patientNotes: {
            type: String,
            trim: true,
            maxlength: [1000, 'Patient notes cannot exceed 1000 characters']
        },
        doctorNotes: {
            type: String,
            trim: true,
            maxlength: [1000, 'Doctor notes cannot exceed 1000 characters']
        },
        instructions: {
            type: String,
            trim: true,
            maxlength: [1000, 'Instructions cannot exceed 1000 characters']
        },
        
        // Payment Information
        paymentStatus: {
            type: String,
            enum: {
                values: ['pending', 'paid', 'failed', 'refunded', 'free'],
                message: '{VALUE} is not a valid payment status'
            },
            default: 'pending'
        },
        consultationFee: {
            type: Number,
            required: [true, 'Consultation fee is required'],
            min: [0, 'Consultation fee cannot be negative']
        },
        paymentId: {
            type: Schema.Types.ObjectId,
            ref: 'Payment'
        },
        
        // Cancellation Information
        cancellationReason: {
            type: String,
            trim: true
        },
        cancelledBy: {
            type: String,
            enum: {
                values: ['patient', 'doctor', 'system', 'admin'],
                message: '{VALUE} is not a valid cancellation source'
            }
        },
        cancellationDate: Date,
        
        // Rescheduling Information
        originalAppointmentId: {
            type: Schema.Types.ObjectId,
            ref: 'Appointment'
        },
        rescheduleReason: String,
        
        // Check-in Information
        checkInTime: Date,
        waitTime: {
            type: Number,
            min: [0, 'Wait time cannot be negative']
        },
        
        // Consultation Details
        consultationStartTime: Date,
        consultationEndTime: Date,
        actualDuration: {
            type: Number,
            min: [0, 'Actual duration cannot be negative']
        },
        
        // Follow-up Information
        isFollowUp: {
            type: Boolean,
            default: false
        },
        originalConsultationId: {
            type: Schema.Types.ObjectId,
            ref: 'Appointment'
        },
        followUpDate: Date,
        
        // Reminders and Notifications
        remindersSent: {
            '24_hours': { type: Boolean, default: false },
            '2_hours': { type: Boolean, default: false },
            '30_minutes': { type: Boolean, default: false }
        },
        
        // Metadata
        metadata: {
            ipAddress: String,
            userAgent: String,
            bookedBy: {
                type: String,
                enum: {
                    values: ['patient', 'doctor', 'staff', 'family'],
                    message: '{VALUE} is not a valid booking source'
                },
                default: 'patient'
            }
        }
    },
    {
        timestamps: true
    }
);

/**
 * Indexes for optimized queries
 */
appointmentSchema.index({ patientId: 1, appointmentDate: -1 });
appointmentSchema.index({ doctorId: 1, appointmentDate: -1 });
appointmentSchema.index({ appointmentDate: 1, status: 1 });
// appointmentSchema.index({ status: 1, appointmentDate: 1 });
appointmentSchema.index({ paymentStatus: 1 });
appointmentSchema.index({ createdAt: -1 });
appointmentSchema.index({ 'metadata.bookedBy': 1 });

/**
 * Add aggregation pagination plugin
 */
appointmentSchema.plugin(mongooseAggregatePaginate);

/**
 * Virtual: Get combined appointment date and time
 */
appointmentSchema.virtual('appointmentDateTime').get(function() {
    if (!this.appointmentDate || !this.appointmentTime) return null;
    
    try {
        const appointmentDateTime = new Date(this.appointmentDate);
        const [hours, minutes] = this.appointmentTime.split(':').map(Number);
        
        if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            return null;
        }
        
        appointmentDateTime.setHours(hours, minutes, 0, 0);
        return appointmentDateTime;
    } catch (error) {
        return null;
    }
});

/**
 * Virtual: Is Upcoming
 */
appointmentSchema.virtual('isUpcoming').get(function() {
    const appointmentDateTime = this.appointmentDateTime;
    if (!appointmentDateTime) return false;
    
    const now = new Date();
    return appointmentDateTime > now && ['scheduled', 'confirmed'].includes(this.status);
});

/**
 * Virtual: Is Past
 */
appointmentSchema.virtual('isPast').get(function() {
    const appointmentDateTime = this.appointmentDateTime;
    if (!appointmentDateTime) return false;
    
    const now = new Date();
    return appointmentDateTime < now;
});

/**
 * Virtual: Is Active (currently happening)
 */
appointmentSchema.virtual('isActive').get(function() {
    const appointmentDateTime = this.appointmentDateTime;
    if (!appointmentDateTime || !this.duration) return false;
    
    const now = new Date();
    const appointmentStart = new Date(appointmentDateTime);
    const appointmentEnd = new Date(appointmentStart.getTime() + (this.duration * 60000));
    
    return now >= appointmentStart && now <= appointmentEnd && this.status === 'in-progress';
});

/**
 * Virtual: Total Consultation Time
 */
appointmentSchema.virtual('totalConsultationTime').get(function() {
    if (this.consultationStartTime && this.consultationEndTime) {
        const duration = Math.round((this.consultationEndTime - this.consultationStartTime) / (1000 * 60));
        return duration >= 0 ? duration : null;
    }
    return null;
});

/**
 * Virtual: Calculated Wait Time
 */
appointmentSchema.virtual('calculatedWaitTime').get(function() {
    if (this.checkInTime && this.consultationStartTime) {
        const waitTime = Math.round((this.consultationStartTime - this.checkInTime) / (1000 * 60));
        return waitTime >= 0 ? waitTime : null;
    }
    return null;
});

/**
 * Pre-save middleware: Validate appointment date and time
 */
appointmentSchema.pre('save', function(next) {
    // Only validate for new appointments or when date/time is modified
    if (this.isModified('appointmentDate') || this.isModified('appointmentTime') || this.isNew) {
        const appointmentDateTime = this.appointmentDateTime;
        
        if (!appointmentDateTime) {
            return next(new Error('Invalid appointment date or time format'));
        }
        
        const now = new Date();
        if (appointmentDateTime < now) {
            return next(new Error('Appointment date and time cannot be in the past'));
        }
        
        // Validate appointment time is during reasonable hours (6 AM - 10 PM)
        const hours = appointmentDateTime.getHours();
        if (hours < 6 || hours > 22) {
            return next(new Error('Appointments can only be scheduled between 6 AM and 10 PM'));
        }
    }
    next();
});

/**
 * Pre-save middleware: Set default location based on appointment type
 */
appointmentSchema.pre('save', function(next) {
    if (this.isNew && !this.location) {
        switch (this.appointmentType) {
            case 'video':
                this.location = 'Virtual Consultation';
                break;
            case 'phone':
                this.location = 'Phone Consultation';
                break;
            case 'chat':
                this.location = 'Online Chat';
                break;
            default:
                this.location = 'Main Clinic';
        }
    }
    next();
});

/**
 * Pre-save middleware: Calculate actual duration and wait time
 */
appointmentSchema.pre('save', function(next) {
    // Calculate actual duration if consultation times are available
    if (this.consultationStartTime && this.consultationEndTime && !this.actualDuration) {
        const duration = Math.round((this.consultationEndTime - this.consultationStartTime) / (1000 * 60));
        if (duration >= 0) {
            this.actualDuration = duration;
        }
    }
    
    // Calculate wait time if check-in time and consultation start time are available
    if (this.checkInTime && this.consultationStartTime && !this.waitTime) {
        const waitTime = Math.round((this.consultationStartTime - this.checkInTime) / (1000 * 60));
        if (waitTime >= 0) {
            this.waitTime = waitTime;
        }
    }
    
    next();
});

/**
 * Instance Method: Check in patient
 */
appointmentSchema.methods.checkIn = async function() {
    try {
        if (this.status !== 'scheduled' && this.status !== 'confirmed') {
            throw new Error(`Cannot check in appointment with status: ${this.status}`);
        }
        
        this.status = 'checked-in';
        this.checkInTime = new Date();
        return await this.save();
    } catch (error) {
        throw new Error(`Failed to check in patient: ${error.message}`);
    }
};

/**
 * Instance Method: Start consultation
 */
appointmentSchema.methods.startConsultation = async function() {
    try {
        if (this.status !== 'checked-in' && this.status !== 'confirmed') {
            throw new Error(`Cannot start consultation with status: ${this.status}`);
        }
        
        this.status = 'in-progress';
        this.consultationStartTime = new Date();
        return await this.save();
    } catch (error) {
        throw new Error(`Failed to start consultation: ${error.message}`);
    }
};

/**
 * Instance Method: Complete consultation
 */
appointmentSchema.methods.completeConsultation = async function(doctorNotes = '') {
    try {
        if (this.status !== 'in-progress') {
            throw new Error(`Cannot complete consultation with status: ${this.status}`);
        }
        
        this.status = 'completed';
        this.consultationEndTime = new Date();
        
        // Add doctor notes if provided
        if (doctorNotes && doctorNotes.trim()) {
            this.doctorNotes = doctorNotes.trim();
        }
        
        return await this.save();
    } catch (error) {
        throw new Error(`Failed to complete consultation: ${error.message}`);
    }
};

/**
 * Instance Method: Cancel appointment
 */
appointmentSchema.methods.cancelAppointment = async function(reason, cancelledBy) {
    try {
        if (!reason || !reason.trim()) {
            throw new Error('Cancellation reason is required');
        }
        
        if (!cancelledBy || !['patient', 'doctor', 'system', 'admin'].includes(cancelledBy)) {
            throw new Error('Valid cancellation source is required');
        }
        
        if (this.status === 'completed' || this.status === 'cancelled') {
            throw new Error(`Cannot cancel appointment with status: ${this.status}`);
        }
        
        this.status = 'cancelled';
        this.cancellationReason = reason.trim();
        this.cancelledBy = cancelledBy;
        this.cancellationDate = new Date();
        
        return await this.save();
    } catch (error) {
        throw new Error(`Failed to cancel appointment: ${error.message}`);
    }
};

/**
 * Instance Method: Mark as no-show
 */
appointmentSchema.methods.markAsNoShow = async function() {
    try {
        if (this.status !== 'scheduled' && this.status !== 'confirmed') {
            throw new Error(`Cannot mark as no-show with status: ${this.status}`);
        }
        
        this.status = 'no-show';
        return await this.save();
    } catch (error) {
        throw new Error(`Failed to mark as no-show: ${error.message}`);
    }
};

/**
 * Instance Method: Send reminder
 */
appointmentSchema.methods.sendReminder = async function(reminderType) {
    try {
        const validReminderTypes = ['24_hours', '2_hours', '30_minutes'];
        
        if (!validReminderTypes.includes(reminderType)) {
            throw new Error(`Invalid reminder type. Must be one of: ${validReminderTypes.join(', ')}`);
        }
        
        this.remindersSent[reminderType] = true;
        return await this.save();
    } catch (error) {
        throw new Error(`Failed to send reminder: ${error.message}`);
    }
};

/**
 * Instance Method: Get appointment summary
 */
appointmentSchema.methods.getSummary = function() {
    return {
        id: this._id,
        patientId: this.patientId,
        doctorId: this.doctorId,
        appointmentDate: this.appointmentDate,
        appointmentTime: this.appointmentTime,
        appointmentDateTime: this.appointmentDateTime,
        appointmentType: this.appointmentType,
        status: this.status,
        priority: this.priority,
        location: this.location,
        consultationFee: this.consultationFee,
        paymentStatus: this.paymentStatus,
        duration: this.duration,
        isUpcoming: this.isUpcoming,
        isPast: this.isPast,
        isActive: this.isActive,
        actualDuration: this.actualDuration,
        waitTime: this.waitTime || this.calculatedWaitTime
    };
};

/**
 * Static Method: Find appointments by patient
 */
appointmentSchema.statics.findByPatient = async function(patientId, options = {}) {
    try {
        const { status, limit = 50, page = 1, sortBy = '-appointmentDate' } = options;
        
        const query = { patientId: new mongoose.Types.ObjectId(patientId) };
        
        if (status) {
            query.status = Array.isArray(status) ? { $in: status } : status;
        }
        
        const skip = (page - 1) * parseInt(limit);
        
        const appointments = await this.find(query)
            .populate('doctorId', 'firstName lastName specialization avatar experience')
            .populate('patientId', 'medicalRecordNumber')
            .populate({
                path: 'patientId',
                populate: { path: 'user', select: 'firstName lastName phoneNumber email' }
            })
            .sort(sortBy)
            .limit(parseInt(limit))
            .skip(skip);
            
        return appointments;
    } catch (error) {
        throw new Error(`Failed to find appointments by patient: ${error.message}`);
    }
};

/**
 * Static Method: Find appointments by doctor
 */
appointmentSchema.statics.findByDoctor = async function(doctorId, options = {}) {
    try {
        const { status, date, limit = 50, page = 1 } = options;
        
        const query = { doctorId: new mongoose.Types.ObjectId(doctorId) };
        
        if (status) {
            query.status = Array.isArray(status) ? { $in: status } : status;
        }
        
        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            
            query.appointmentDate = {
                $gte: startDate,
                $lte: endDate
            };
        }
        
        const skip = (page - 1) * parseInt(limit);
        
        const appointments = await this.find(query)
            .populate('patientId', 'medicalRecordNumber')
            .populate({
                path: 'patientId',
                populate: { 
                    path: 'user', 
                    select: 'firstName lastName phoneNumber email dateOfBirth gender' 
                }
            })
            .sort({ appointmentDate: 1, appointmentTime: 1 })
            .limit(parseInt(limit))
            .skip(skip);
            
        return appointments;
    } catch (error) {
        throw new Error(`Failed to find appointments by doctor: ${error.message}`);
    }
};

/**
 * Static Method: Get today's appointments
 */
appointmentSchema.statics.getTodaysAppointments = async function(doctorId = null) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const query = {
            appointmentDate: {
                $gte: today,
                $lt: tomorrow
            },
            status: { $in: ['scheduled', 'confirmed', 'checked-in', 'in-progress'] }
        };
        
        if (doctorId) {
            query.doctorId = new mongoose.Types.ObjectId(doctorId);
        }
        
        const appointments = await this.find(query)
            .populate('patientId', 'medicalRecordNumber')
            .populate({
                path: 'patientId',
                populate: { path: 'user', select: 'firstName lastName phoneNumber' }
            })
            .populate('doctorId', 'firstName lastName specialization department')
            .sort({ appointmentTime: 1 });
            
        return appointments;
    } catch (error) {
        throw new Error(`Failed to get today's appointments: ${error.message}`);
    }
};

/**
 * Static Method: Get appointment statistics
 */
appointmentSchema.statics.getStatistics = async function(doctorId = null, startDate, endDate) {
    try {
        const matchStage = {};
        
        if (doctorId) {
            matchStage.doctorId = new mongoose.Types.ObjectId(doctorId);
        }
        
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            
            matchStage.appointmentDate = {
                $gte: start,
                $lte: end
            };
        }
        
        const stats = await this.aggregate([
            { $match: matchStage },
            {
                $facet: {
                    total: [{ $count: 'count' }],
                    byStatus: [
                        { $group: { _id: '$status', count: { $sum: 1 } } }
                    ],
                    byType: [
                        { $group: { _id: '$appointmentType', count: { $sum: 1 } } }
                    ],
                    byPriority: [
                        { $group: { _id: '$priority', count: { $sum: 1 } } }
                    ],
                    monthlyTrend: [
                        {
                            $group: {
                                _id: {
                                    year: { $year: '$appointmentDate' },
                                    month: { $month: '$appointmentDate' }
                                },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { '_id.year': 1, '_id.month': 1 } }
                    ],
                    revenue: [
                        { 
                            $match: { 
                                paymentStatus: 'paid',
                                consultationFee: { $gt: 0 }
                            } 
                        },
                        {
                            $group: {
                                _id: null,
                                totalRevenue: { $sum: '$consultationFee' },
                                averageFee: { $avg: '$consultationFee' },
                                appointmentCount: { $sum: 1 }
                            }
                        }
                    ]
                }
            }
        ]);
        
        return stats[0] || {
            total: [{ count: 0 }],
            byStatus: [],
            byType: [],
            byPriority: [],
            monthlyTrend: [],
            revenue: []
        };
    } catch (error) {
        throw new Error(`Failed to get appointment statistics: ${error.message}`);
    }
};

/**
 * Enable virtuals in JSON output
 */
appointmentSchema.set('toJSON', { 
    virtuals: true,
    transform: function(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

appointmentSchema.set('toObject', { 
    virtuals: true,
    transform: function(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

/**
 * Export Appointment model with overwrite protection
 */
export const Appointment = mongoose.models.Appointment || mongoose.model("Appointment", appointmentSchema);