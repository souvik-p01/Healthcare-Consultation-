/**
 * Healthcare System - Consultation Model
 * 
 * Detailed consultation records capturing clinical encounters,
 * diagnoses, treatment plans, and follow-up requirements.
 */

import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const consultationSchema = new Schema(
    {
        // Core References
        appointmentId: {
            type: Schema.Types.ObjectId,
            ref: 'Appointment',
            required: [true, 'Appointment reference is required'],
            unique: true,
            index: true
        },
        patientId: {
            type: Schema.Types.ObjectId,
            ref: 'Patient',
            required: [true, 'Patient reference is required'],
            index: true
        },
        doctorId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Doctor reference is required'],
            index: true
        },
        
        // Consultation Type and Context
        consultationType: {
            type: String,
            enum: ['initial', 'follow-up', 'review', 'emergency', 'routine'],
            required: true,
            index: true
        },
        consultationContext: {
            type: String,
            enum: ['office-visit', 'hospital-round', 'telemedicine', 'urgent-care'],
            default: 'office-visit'
        },
        
        // Chief Complaint and History
        chiefComplaint: {
            type: String,
            required: [true, 'Chief complaint is required'],
            trim: true,
            maxlength: 500
        },
        historyOfPresentIllness: {
            type: String,
            trim: true,
            maxlength: 2000
        },
        durationOfComplaint: String,
        
        // Medical History Review
        pastMedicalHistory: {
            type: String,
            trim: true,
            maxlength: 1000
        },
        familyHistory: {
            type: String,
            trim: true,
            maxlength: 1000
        },
        socialHistory: {
            type: String,
            trim: true,
            maxlength: 1000
        },
        
        // Review of Systems
        reviewOfSystems: {
            constitutional: String,
            eyes: String,
            earsNoseThroat: String,
            cardiovascular: String,
            respiratory: String,
            gastrointestinal: String,
            genitourinary: String,
            musculoskeletal: String,
            integumentary: String,
            neurological: String,
            psychiatric: String,
            endocrine: String,
            hematologic: String,
            allergicImmunologic: String
        },
        
        // Physical Examination Findings
        physicalExamination: {
            generalAppearance: String,
            vitalSigns: {
                bloodPressure: String,
                heartRate: Number,
                respiratoryRate: Number,
                temperature: Number,
                oxygenSaturation: Number,
                weight: Number,
                height: Number
            },
            head: String,
            eyes: String,
            ears: String,
            nose: String,
            throat: String,
            neck: String,
            chest: String,
            heart: String,
            abdomen: String,
            extremities: String,
            neurological: String,
            skin: String,
            otherFindings: String
        },
        
        // Assessment and Diagnosis
        assessment: {
            type: String,
            trim: true,
            maxlength: 2000
        },
        differentialDiagnosis: [{
            condition: String,
            probability: {
                type: String,
                enum: ['low', 'medium', 'high']
            },
            notes: String
        }],
        finalDiagnosis: [{
            condition: {
                type: String,
                required: true,
                trim: true
            },
            icd10Code: String,
            certainty: {
                type: String,
                enum: ['suspected', 'probable', 'confirmed'],
                default: 'confirmed'
            },
            isPrimary: {
                type: Boolean,
                default: false
            }
        }],
        
        // Treatment Plan
        treatmentPlan: {
            planDescription: {
                type: String,
                trim: true,
                maxlength: 2000
            },
            medicationsPrescribed: [{
                medication: String,
                dosage: String,
                duration: String,
                purpose: String
            }],
            proceduresRecommended: [{
                procedure: String,
                reason: String,
                urgency: String
            }],
            lifestyleRecommendations: [String],
            patientEducation: [String]
        },
        
        // Investigations Ordered
        investigations: [{
            type: {
                type: String,
                required: true,
                enum: ['laboratory', 'imaging', 'other']
            },
            testName: {
                type: String,
                required: true,
                trim: true
            },
            reason: String,
            urgency: {
                type: String,
                enum: ['routine', 'urgent', 'stat'],
                default: 'routine'
            },
            instructions: String
        }],
        
        // Referrals
        referrals: [{
            specialist: {
                type: String,
                required: true,
                trim: true
            },
            reason: {
                type: String,
                required: true,
                trim: true
            },
            urgency: {
                type: String,
                enum: ['routine', 'urgent'],
                default: 'routine'
            },
            notes: String
        }],
        
        // Follow-up Planning
        followUp: {
            required: {
                type: Boolean,
                default: false
            },
            reason: String,
            timeframe: String, // e.g., "2 weeks", "1 month"
            specificDate: Date,
            instructions: String
        },
        
        // Clinical Notes (SOAP Format)
        subjective: {
            type: String,
            trim: true,
            maxlength: 2000
        },
        objective: {
            type: String,
            trim: true,
            maxlength: 2000
        },
        assessment: {
            type: String,
            trim: true,
            maxlength: 2000
        },
        plan: {
            type: String,
            trim: true,
            maxlength: 2000
        },
        
        // Consultation Metrics
        consultationDuration: {
            type: Number, // in minutes
            min: 0
        },
        complexity: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium'
        },
        
        // Patient Response and Outcome
        patientResponse: {
            understanding: {
                type: String,
                enum: ['good', 'fair', 'poor']
            },
            questionsAsked: [String],
            concernsExpressed: [String],
            satisfaction: {
                type: Number,
                min: 1,
                max: 5
            }
        },
        
        // Clinical Decision Support
        clinicalGuidelines: [{
            guideline: String,
            applied: Boolean,
            deviationReason: String
        }],
        
        // Risk Assessment
        riskFactors: [{
            factor: String,
            level: {
                type: String,
                enum: ['low', 'medium', 'high']
            },
            management: String
        }],
        
        // Progress and Outcome
        expectedOutcome: String,
        actualOutcome: String,
        complications: [String],
        
        // Documentation Quality
        documentationQuality: {
            completeness: {
                type: Number,
                min: 1,
                max: 5
            },
            clarity: {
                type: Number,
                min: 1,
                max: 5
            },
            timeliness: {
                type: String,
                enum: ['timely', 'delayed']
            }
        },
        
        // Status
        status: {
            type: String,
            enum: ['draft', 'finalized', 'amended', 'signed-off'],
            default: 'finalized',
            index: true
        },
        
        // Digital Signature
        signedOff: {
            by: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            },
            at: Date,
            signature: String
        },
        
        // Audit Trail
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        lastModifiedBy: {
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
consultationSchema.index({ patientId: 1, createdAt: -1 });
consultationSchema.index({ doctorId: 1, createdAt: -1 });
consultationSchema.index({ consultationType: 1 });
consultationSchema.index({ 'finalDiagnosis.condition': 'text', chiefComplaint: 'text' });

/**
 * Add aggregation pagination plugin
 */
consultationSchema.plugin(mongooseAggregatePaginate);

/**
 * Virtual: Primary Diagnosis
 */
consultationSchema.virtual('primaryDiagnosis').get(function() {
    const primary = this.finalDiagnosis.find(d => d.isPrimary);
    return primary ? primary.condition : null;
});

/**
 * Virtual: Has Abnormal Findings
 */
consultationSchema.virtual('hasAbnormalFindings').get(function() {
    return !!this.physicalExamination?.otherFindings || 
           this.complications?.length > 0 ||
           this.riskFactors?.some(r => r.level === 'high');
});

/**
 * Virtual: Is Follow-up Required
 */
consultationSchema.virtual('isFollowUpRequired').get(function() {
    return this.followUp?.required || false;
});

/**
 * Pre-save middleware: Calculate consultation duration
 */
consultationSchema.pre('save', function(next) {
    if (this.appointmentId && this.appointmentId.consultationStartTime && this.appointmentId.consultationEndTime) {
        const start = new Date(this.appointmentId.consultationStartTime);
        const end = new Date(this.appointmentId.consultationEndTime);
        this.consultationDuration = (end - start) / (1000 * 60); // Convert to minutes
    }
    next();
});

/**
 * Instance Method: Add diagnosis
 */
consultationSchema.methods.addDiagnosis = async function(diagnosisData) {
    this.finalDiagnosis.push(diagnosisData);
    return await this.save();
};

/**
 * Instance Method: Mark as signed off
 */
consultationSchema.methods.signOff = async function(doctorId, signature) {
    this.signedOff = {
        by: doctorId,
        at: new Date(),
        signature: signature
    };
    this.status = 'signed-off';
    return await this.save();
};

/**
 * Instance Method: Get consultation summary
 */
consultationSchema.methods.getSummary = function() {
    return {
        consultationId: this._id,
        appointmentId: this.appointmentId,
        patientId: this.patientId,
        doctorId: this.doctorId,
        consultationType: this.consultationType,
        chiefComplaint: this.chiefComplaint,
        primaryDiagnosis: this.primaryDiagnosis,
        followUpRequired: this.isFollowUpRequired,
        consultationDate: this.createdAt
    };
};

/**
 * Static Method: Find consultations by patient
 */
consultationSchema.statics.findByPatient = async function(patientId, options = {}) {
    const { consultationType, limit = 50, page = 1 } = options;
    
    const query = { patientId };
    if (consultationType) query.consultationType = consultationType;
    
    return await this.find(query)
        .populate('doctorId', 'firstName lastName specialization')
        .populate('appointmentId', 'appointmentDate appointmentType')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit);
};

/**
 * Static Method: Find consultations by doctor
 */
consultationSchema.statics.findByDoctor = async function(doctorId, options = {}) {
    const { startDate, endDate, limit = 50, page = 1 } = options;
    
    const query = { doctorId };
    if (startDate && endDate) {
        query.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }
    
    return await this.find(query)
        .populate('patientId', 'userId')
        .populate({
            path: 'patientId',
            populate: { path: 'userId', select: 'firstName lastName dateOfBirth' }
        })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit);
};

/**
 * Static Method: Get consultation statistics
 */
consultationSchema.statics.getStatistics = async function(doctorId = null, startDate, endDate) {
    const matchStage = {
        createdAt: {
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
                byType: [
                    { $group: { _id: '$consultationType', count: { $sum: 1 } } }
                ],
                byComplexity: [
                    { $group: { _id: '$complexity', count: { $sum: 1 } } }
                ],
                commonDiagnoses: [
                    { $unwind: '$finalDiagnosis' },
                    {
                        $group: {
                            _id: '$finalDiagnosis.condition',
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { count: -1 } },
                    { $limit: 10 }
                ],
                monthlyTrend: [
                    {
                        $group: {
                            _id: {
                                year: { $year: '$createdAt' },
                                month: { $month: '$createdAt' }
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

export const Consultation = mongoose.model("Consultation", consultationSchema);