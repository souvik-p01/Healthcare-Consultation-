/**
 * Healthcare System - Prescription Model
 * 
 * Manages patient prescriptions with medication details,
 * dosage instructions, and refill tracking.
 */

import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const prescriptionSchema = new Schema(
    {
        // Patient Information
        patientId: {
            type: Schema.Types.ObjectId,
            ref: 'Patient',
            required: [true, 'Patient reference is required'],
            //index: true
        },
        
        // Prescribing Doctor
        doctorId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Doctor reference is required'],
            //index: true
        },
        
        // Medical Record Reference
        medicalRecordId: {
            type: Schema.Types.ObjectId,
            ref: 'MedicalRecord',
            index: true
        },
        
        // Appointment Reference
        appointmentId: {
            type: Schema.Types.ObjectId,
            ref: 'Appointment',
            index: true
        },
        
        // Prescription Details
        prescriptionDate: {
            type: Date,
            required: true,
            default: Date.now,
            //index: true
        },
        expiryDate: {
            type: Date,
            required: true
        },
        
        // Medications
        medications: [{
            medicationName: {
                type: String,
                required: true,
                trim: true
            },
            genericName: {
                type: String,
                trim: true
            },
            strength: {
                type: String,
                required: true,
                trim: true
            },
            form: {
                type: String,
                enum: ['tablet', 'capsule', 'syrup', 'injection', 'ointment', 'inhaler', 'other'],
                default: 'tablet'
            },
            dosage: {
                type: String,
                required: true,
                trim: true
            },
            frequency: {
                type: String,
                required: true,
                trim: true
            },
            timing: {
                type: String,
                enum: ['before-food', 'after-food', 'with-food', 'empty-stomach', 'as-needed'],
                default: 'after-food'
            },
            duration: {
                value: { type: Number, required: true },
                unit: { 
                    type: String, 
                    enum: ['days', 'weeks', 'months'], 
                    default: 'days' 
                }
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            },
            unit: {
                type: String,
                trim: true
            },
            route: {
                type: String,
                enum: ['oral', 'topical', 'inhalation', 'injection', 'other'],
                default: 'oral'
            },
            instructions: {
                type: String,
                trim: true,
                maxlength: 500
            },
            purpose: {
                type: String,
                trim: true
            },
            sideEffects: [String],
            contraindications: [String],
            isControlledSubstance: {
                type: Boolean,
                default: false
            }
        }],
        
        // Refill Information
        refillsAllowed: {
            type: Number,
            default: 0,
            min: 0,
            max: 12
        },
        refillsRemaining: {
            type: Number,
            default: 0,
            min: 0
        },
        lastRefillDate: Date,
        nextRefillDate: Date,
        
        // Pharmacy Information
        pharmacy: {
            name: String,
            address: {
                street: String,
                city: String,
                state: String,
                zipCode: String
            },
            phoneNumber: String,
            instructions: String
        },
        
        // Status and Tracking
        status: {
            type: String,
            enum: ['active', 'completed', 'cancelled', 'expired', 'on-hold'],
            default: 'active',
            //index: true
        },
        dispenseStatus: {
            type: String,
            enum: ['not-dispensed', 'partially-dispensed', 'fully-dispensed'],
            default: 'not-dispensed'
        },
        
        // Clinical Information
        diagnosis: {
            type: String,
            trim: true
        },
        clinicalNotes: {
            type: String,
            trim: true,
            maxlength: 1000
        },
        
        // Patient Instructions
        patientInstructions: {
            type: String,
            trim: true,
            maxlength: 1000
        },
        warnings: [String],
        
        // Digital Signature
        digitalSignature: {
            doctorSignature: String,
            signedDate: Date,
            signatureUrl: String // Cloudinary URL for scanned signature
        },
        
        // Prescription Format
        prescriptionFormat: {
            type: String,
            enum: ['digital', 'printed', 'handwritten'],
            default: 'digital'
        },
        
        // Regulatory Information
        deaNumber: String, // For controlled substances
        stateLicense: String,
        
        // Audit Trail
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        modifiedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        
        // Soft Delete
        isDeleted: {
            type: Boolean,
            default: false
        },
        deletedAt: Date,
        deletedBy: {
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
prescriptionSchema.index({ patientId: 1, prescriptionDate: -1 });
prescriptionSchema.index({ doctorId: 1, prescriptionDate: -1 });
prescriptionSchema.index({ status: 1, expiryDate: 1 });
prescriptionSchema.index({ 'medications.medicationName': 'text' });

/**
 * Add aggregation pagination plugin
 */
prescriptionSchema.plugin(mongooseAggregatePaginate);

/**
 * Virtual: Is Active
 */
prescriptionSchema.virtual('isActive').get(function() {
    return this.status === 'active' && this.expiryDate > new Date();
});

/**
 * Virtual: Needs Refill
 */
prescriptionSchema.virtual('needsRefill').get(function() {
    return this.refillsRemaining > 0 && this.status === 'active';
});

/**
 * Virtual: Total Medications
 */
prescriptionSchema.virtual('totalMedications').get(function() {
    return this.medications.length;
});

/**
 * Virtual: Days Until Expiry
 */
prescriptionSchema.virtual('daysUntilExpiry').get(function() {
    const today = new Date();
    const expiry = new Date(this.expiryDate);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

/**
 * Pre-save middleware: Set refills remaining
 */
prescriptionSchema.pre('save', function(next) {
    if (this.isNew) {
        this.refillsRemaining = this.refillsAllowed;
    }
    next();
});

/**
 * Pre-save middleware: Validate expiry date
 */
prescriptionSchema.pre('save', function(next) {
    if (this.expiryDate && this.expiryDate <= new Date()) {
        this.status = 'expired';
    }
    next();
});

/**
 * Instance Method: Refill prescription
 */
prescriptionSchema.methods.refill = async function() {
    if (this.refillsRemaining > 0) {
        this.refillsRemaining -= 1;
        this.lastRefillDate = new Date();
        
        // Calculate next refill date (30 days from last refill)
        const nextRefill = new Date(this.lastRefillDate);
        nextRefill.setDate(nextRefill.getDate() + 30);
        this.nextRefillDate = nextRefill;
        
        return await this.save();
    }
    throw new Error('No refills remaining');
};

/**
 * Instance Method: Update dispense status
 */
prescriptionSchema.methods.updateDispenseStatus = async function(status) {
    this.dispenseStatus = status;
    return await this.save();
};

/**
 * Instance Method: Cancel prescription
 */
prescriptionSchema.methods.cancelPrescription = async function(reason) {
    this.status = 'cancelled';
    this.clinicalNotes = reason;
    return await this.save();
};

/**
 * Instance Method: Get prescription summary
 */
prescriptionSchema.methods.getSummary = function() {
    return {
        prescriptionId: this._id,
        patientId: this.patientId,
        doctorId: this.doctorId,
        prescriptionDate: this.prescriptionDate,
        status: this.status,
        medications: this.medications.map(med => ({
            name: med.medicationName,
            dosage: med.dosage,
            frequency: med.frequency,
            duration: `${med.duration.value} ${med.duration.unit}`
        })),
        refillsRemaining: this.refillsRemaining,
        isActive: this.isActive
    };
};

/**
 * Static Method: Find active prescriptions by patient
 */
prescriptionSchema.statics.findActiveByPatient = async function(patientId) {
    return await this.find({
        patientId,
        status: 'active',
        expiryDate: { $gt: new Date() }
    })
    .populate('doctorId', 'firstName lastName specialization')
    .populate('medicalRecordId', 'diagnosis')
    .sort({ prescriptionDate: -1 });
};

/**
 * Static Method: Find prescriptions needing refill
 */
prescriptionSchema.statics.findNeedRefill = async function() {
    return await this.find({
        status: 'active',
        refillsRemaining: { $gt: 0 },
        expiryDate: { $gt: new Date() }
    })
    .populate('patientId', 'userId')
    .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'firstName lastName phoneNumber' }
    })
    .populate('doctorId', 'firstName lastName');
};

/**
 * Static Method: Find expired prescriptions
 */
prescriptionSchema.statics.findExpired = async function() {
    return await this.find({
        status: 'active',
        expiryDate: { $lte: new Date() }
    });
};

/**
 * Static Method: Get prescription statistics
 */
prescriptionSchema.statics.getStatistics = async function(doctorId = null, startDate, endDate) {
    const matchStage = {
        prescriptionDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        }
    };
    
    if (doctorId) {
        matchStage.doctorId = doctorId;
    }
    
    return await this.aggregate([
        { $match: matchStage },
        {
            $facet: {
                total: [{ $count: 'count' }],
                byStatus: [
                    { $group: { _id: '$status', count: { $sum: 1 } } }
                ],
                byMonth: [
                    {
                        $group: {
                            _id: {
                                year: { $year: '$prescriptionDate' },
                                month: { $month: '$prescriptionDate' }
                            },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { '_id.year': 1, '_id.month': 1 } }
                ],
                topMedications: [
                    { $unwind: '$medications' },
                    {
                        $group: {
                            _id: '$medications.medicationName',
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { count: -1 } },
                    { $limit: 10 }
                ]
            }
        }
    ]);
};

export const Prescription = mongoose.model("Prescription", prescriptionSchema);