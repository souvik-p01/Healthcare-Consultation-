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
            required: [true, 'Patient reference is required'],
            index: true
        },
        
        // Doctor Information
        doctorId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Doctor reference is required'],
            index: true
        },
        
        // Appointment Details
        appointmentDate: {
            type: Date,
            required: [true, 'Appointment date is required'],
            index: true
        },
        appointmentTime: {
            type: String,
            required: [true, 'Appointment time is required'],
            match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
        },
        duration: {
            type: Number, // in minutes
            default: 30,
            min: 15,
            max: 120
        },
        
        // Appointment Type
        appointmentType: {
            type: String,
            enum: ['in-person', 'video', 'phone', 'chat'],
            default: 'in-person',
            required: true
        },
        
        // Status Tracking
        status: {
            type: String,
            enum: [
                'scheduled', 
                'confirmed', 
                'checked-in', 
                'in-progress', 
                'completed', 
                'cancelled', 
                'no-show', 
                'rescheduled'
            ],
            default: 'scheduled',
            required: true,
            index: true
        },
        
        // Patient Symptoms and Concerns
        symptoms: {
            type: String,
            trim: true,
            maxlength: 1000
        },
        chiefComplaint: {
            type: String,
            trim: true,
            maxlength: 500
        },
        
        // Medical Information
        priority: {
            type: String,
            enum: ['routine', 'urgent', 'emergency'],
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
            maxlength: 1000
        },
        doctorNotes: {
            type: String,
            trim: true,
            maxlength: 1000
        },
        instructions: {
            type: String,
            trim: true,
            maxlength: 1000
        },
        
        // Payment Information
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded', 'free'],
            default: 'pending',
            index: true
        },
        consultationFee: {
            type: Number,
            required: true,
            min: 0
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
            enum: ['patient', 'doctor', 'system', 'admin']
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
        waitTime: Number, // in minutes
        
        // Consultation Details
        consultationStartTime: Date,
        consultationEndTime: Date,
        actualDuration: Number, // in minutes
        
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
                enum: ['patient', 'doctor', 'staff', 'family'],
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
appointmentSchema.index({ status: 1, appointmentDate: 1 });
appointmentSchema.index({ paymentStatus: 1 });

/**
 * Add aggregation pagination plugin
 */
appointmentSchema.plugin(mongooseAggregatePaginate);

/**
 * Virtual: Is Upcoming
 */
appointmentSchema.virtual('isUpcoming').get(function() {
    const now = new Date();
    const appointmentDateTime = new Date(this.appointmentDate);
    appointmentDateTime.setHours(
        parseInt(this.appointmentTime.split(':')[0]),
        parseInt(this.appointmentTime.split(':')[1])
    );
    return appointmentDateTime > now && this.status === 'scheduled';
});

/**
 * Virtual: Is Past
 */
appointmentSchema.virtual('isPast').get(function() {
    const now = new Date();
    const appointmentDateTime = new Date(this.appointmentDate);
    appointmentDateTime.setHours(
        parseInt(this.appointmentTime.split(':')[0]),
        parseInt(this.appointmentTime.split(':')[1])
    );
    return appointmentDateTime < now;
});

/**
 * Virtual: Total Time
 */
appointmentSchema.virtual('totalTime').get(function() {
    if (this.consultationStartTime && this.consultationEndTime) {
        return (this.consultationEndTime - this.consultationStartTime) / (1000 * 60); // minutes
    }
    return null;
});

/**
 * Pre-save middleware: Validate appointment date
 */
appointmentSchema.pre('save', function(next) {
    const appointmentDateTime = new Date(this.appointmentDate);
    appointmentDateTime.setHours(
        parseInt(this.appointmentTime.split(':')[0]),
        parseInt(this.appointmentTime.split(':')[1])
    );
    
    if (appointmentDateTime < new Date()) {
        return next(new Error('Appointment date cannot be in the past'));
    }
    next();
});

/**
 * Instance Method: Check in patient
 */
appointmentSchema.methods.checkIn = async function() {
    this.status = 'checked-in';
    this.checkInTime = new Date();
    return await this.save();
};

/**
 * Instance Method: Start consultation
 */
appointmentSchema.methods.startConsultation = async function() {
    this.status = 'in-progress';
    this.consultationStartTime = new Date();
    return await this.save();
};

/**
 * Instance Method: Complete consultation
 */
appointmentSchema.methods.completeConsultation = async function() {
    this.status = 'completed';
    this.consultationEndTime = new Date();
    if (this.consultationStartTime) {
        this.actualDuration = (this.consultationEndTime - this.consultationStartTime) / (1000 * 60);
    }
    return await this.save();
};

/**
 * Instance Method: Cancel appointment
 */
appointmentSchema.methods.cancelAppointment = async function(reason, cancelledBy) {
    this.status = 'cancelled';
    this.cancellationReason = reason;
    this.cancelledBy = cancelledBy;
    this.cancellationDate = new Date();
    return await this.save();
};

/**
 * Instance Method: Reschedule appointment
 */
appointment.methods.rescheduleAppointment = async function(newDate, newTime, reason) {
    this.status = 'rescheduled';
    this.rescheduleReason = reason;
    return await this.save();
};

/**
 * Static Method: Find appointments by patient
 */
appointmentSchema.statics.findByPatient = async function(patientId, options = {}) {
    const { status, limit = 50, page = 1 } = options;
    
    const query = { patientId };
    if (status) query.status = status;
    
    return await this.find(query)
        .populate('doctorId', 'firstName lastName specialization avatar')
        .sort({ appointmentDate: -1, appointmentTime: -1 })
        .limit(limit)
        .skip((page - 1) * limit);
};

/**
 * Static Method: Find appointments by doctor
 */
appointmentSchema.statics.findByDoctor = async function(doctorId, options = {}) {
    const { status, date, limit = 50, page = 1 } = options;
    
    const query = { doctorId };
    if (status) query.status = status;
    if (date) query.appointmentDate = date;
    
    return await this.find(query)
        .populate('patientId', 'userId')
        .populate({
            path: 'patientId',
            populate: { path: 'userId', select: 'firstName lastName phoneNumber email' }
        })
        .sort({ appointmentDate: 1, appointmentTime: 1 })
        .limit(limit)
        .skip((page - 1) * limit);
};

/**
 * Static Method: Get today's appointments
 */
appointmentSchema.statics.getTodaysAppointments = async function(doctorId = null) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const query = {
        appointmentDate: {
            $gte: today,
            $lt: tomorrow
        },
        status: { $in: ['scheduled', 'confirmed', 'checked-in'] }
    };
    
    if (doctorId) {
        query.doctorId = doctorId;
    }
    
    return await this.find(query)
        .populate('patientId', 'userId')
        .populate({
            path: 'patientId',
            populate: { path: 'userId', select: 'firstName lastName phoneNumber' }
        })
        .populate('doctorId', 'firstName lastName specialization')
        .sort({ appointmentTime: 1 });
};

/**
 * Static Method: Get appointment statistics
 */
appointmentSchema.statics.getStatistics = async function(doctorId = null, startDate, endDate) {
    const matchStage = {};
    
    if (doctorId) {
        matchStage.doctorId = doctorId;
    }
    
    if (startDate && endDate) {
        matchStage.appointmentDate = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }
    
    return await this.aggregate([
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
                ]
            }
        }
    ]);
};

export const Appointment = mongoose.model("Appointment", appointmentSchema);