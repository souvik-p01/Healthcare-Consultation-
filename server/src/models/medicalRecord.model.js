/**
 * Healthcare System - Medical Record Model
 * 
 * Comprehensive medical records storing patient health information,
 * diagnoses, treatments, and clinical notes.
 */

import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const medicalRecordSchema = new Schema(
    {
        // Patient Information
        patientId: {
            type: Schema.Types.ObjectId,
            ref: 'Patient',
            required: [true, 'Patient reference is required'],
            //index: true
        },
        
        // Doctor Information
        doctorId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Doctor reference is required'],
            //index: true
        },
        
        // Appointment Reference
        appointmentId: {
            type: Schema.Types.ObjectId,
            ref: 'Appointment',
            //index: true
        },
        
        // Record Type and Category
        recordType: {
            type: String,
            enum: [
                'consultation', 
                'diagnosis', 
                'treatment', 
                'procedure', 
                'lab-result', 
                'imaging', 
                'vaccination',
                'general'
            ],
            required: true,
            //index: true
        },
        category: {
            type: String,
            trim: true
        },
        
        // Clinical Information
        chiefComplaint: {
            type: String,
            trim: true,
            maxlength: 500
        },
        presentIllness: {
            type: String,
            trim: true,
            maxlength: 2000
        },
        symptoms: [{
            symptom: {
                type: String,
                required: true,
                trim: true
            },
            severity: {
                type: String,
                enum: ['mild', 'moderate', 'severe'],
                default: 'moderate'
            },
            duration: String, // e.g., "3 days", "2 weeks"
            notes: String
        }],
        
        // Vital Signs
        vitalSigns: {
            bloodPressure: {
                systolic: { type: Number, min: 0 },
                diastolic: { type: Number, min: 0 }
            },
            heartRate: { type: Number, min: 0 },
            respiratoryRate: { type: Number, min: 0 },
            temperature: { type: Number, min: 0 }, // in Celsius
            oxygenSaturation: { type: Number, min: 0, max: 100 }, // SpO2 percentage
            weight: { type: Number, min: 0 },
            height: { type: Number, min: 0 },
            bmi: { type: Number, min: 0 }
        },
        
        // Physical Examination
        physicalExamination: {
            generalAppearance: String,
            cardiovascular: String,
            respiratory: String,
            abdominal: String,
            neurological: String,
            musculoskeletal: String,
            skin: String,
            notes: String
        },
        
        // Diagnosis
        diagnosis: [{
            condition: {
                type: String,
                required: true,
                trim: true
            },
            code: String, // ICD-10 code
            certainty: {
                type: String,
                enum: ['suspected', 'probable', 'confirmed'],
                default: 'confirmed'
            },
            type: {
                type: String,
                enum: ['primary', 'secondary', 'differential'],
                default: 'primary'
            },
            notes: String
        }],
        
        // Treatment Plan
        treatmentPlan: {
            plan: {
                type: String,
                trim: true,
                maxlength: 2000
            },
            recommendations: [String],
            lifestyleChanges: [String],
            followUpRequired: {
                type: Boolean,
                default: false
            },
            followUpDate: Date,
            followUpInstructions: String
        },
        
        // Procedures Performed
        procedures: [{
            name: {
                type: String,
                required: true,
                trim: true
            },
            date: {
                type: Date,
                default: Date.now
            },
            description: String,
            findings: String,
            complications: String,
            notes: String
        }],
        
        // Prescriptions (reference to Prescription model)
        prescriptions: [{
            type: Schema.Types.ObjectId,
            ref: 'Prescription'
        }],
        
        // Lab Results (reference to LabResult model)
        labResults: [{
            type: Schema.Types.ObjectId,
            ref: 'LabResult'
        }],
        
        // Imaging Studies
        imagingStudies: [{
            studyType: {
                type: String,
                required: true,
                trim: true
            },
            date: Date,
            facility: String,
            findings: String,
            impression: String,
            reportUrl: String, // Cloudinary URL
            images: [String] // Cloudinary URLs
        }],
        
        // Clinical Notes
        subjectiveNotes: {
            type: String,
            trim: true,
            maxlength: 2000
        },
        objectiveNotes: {
            type: String,
            trim: true,
            maxlength: 2000
        },
        assessmentNotes: {
            type: String,
            trim: true,
            maxlength: 2000
        },
        planNotes: {
            type: String,
            trim: true,
            maxlength: 2000
        },
        
        // Attachments
        attachments: [{
            name: {
                type: String,
                required: true,
                trim: true
            },
            fileUrl: {
                type: String,
                required: true
            },
            fileType: {
                type: String,
                required: true
            },
            uploadedAt: {
                type: Date,
                default: Date.now
            },
            description: String
        }],
        
        // Referrals
        referrals: [{
            specialist: {
                type: String,
                required: true,
                trim: true
            },
            reason: String,
            urgency: {
                type: String,
                enum: ['routine', 'urgent', 'emergency'],
                default: 'routine'
            },
            notes: String,
            referredTo: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            }
        }],
        
        // Allergy and Drug Reaction Documentation
        allergyDocumentation: [{
            allergen: String,
            reaction: String,
            severity: String,
            documentedDate: {
                type: Date,
                default: Date.now
            }
        }],
        
        // Progress Notes
        progressNotes: [{
            date: {
                type: Date,
                default: Date.now
            },
            note: {
                type: String,
                required: true,
                trim: true
            },
            recordedBy: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            }
        }],
        
        // Discharge Information (if applicable)
        dischargeSummary: {
            dischargeDate: Date,
            dischargeType: {
                type: String,
                enum: ['home', 'transfer', 'other']
            },
            conditionAtDischarge: {
                type: String,
                enum: ['improved', 'stable', 'worsened', 'expired']
            },
            followUpInstructions: String,
            medicationsAtDischarge: [String]
        },
        
        // Privacy and Access Control
        visibility: {
            type: String,
            enum: ['patient', 'providers', 'restricted'],
            default: 'providers'
        },
        sensitive: {
            type: Boolean,
            default: false
        },
        
        // Status
        status: {
            type: String,
            enum: ['draft', 'finalized', 'amended', 'void'],
            default: 'finalized',
            //index: true
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
        },
        
        // Versioning
        version: {
            type: Number,
            default: 1
        },
        previousVersion: {
            type: Schema.Types.ObjectId,
            ref: 'MedicalRecord'
        }
    },
    {
        timestamps: true
    }
);

/**
 * Indexes for optimized queries
 */
medicalRecordSchema.index({ patientId: 1, createdAt: -1 });
medicalRecordSchema.index({ doctorId: 1, createdAt: -1 });
medicalRecordSchema.index({ recordType: 1, createdAt: -1 });
medicalRecordSchema.index({ 'diagnosis.condition': 'text', chiefComplaint: 'text' });

/**
 * Add aggregation pagination plugin
 */
medicalRecordSchema.plugin(mongooseAggregatePaginate);

/**
 * Virtual: Has Abnormal Vitals
 */
medicalRecordSchema.virtual('hasAbnormalVitals').get(function() {
    const vitals = this.vitalSigns;
    if (!vitals) return false;
    
    // Check for abnormal values (simplified logic)
    if (vitals.bloodPressure) {
        if (vitals.bloodPressure.systolic > 140 || vitals.bloodPressure.diastolic > 90) {
            return true;
        }
    }
    
    if (vitals.heartRate && (vitals.heartRate < 60 || vitals.heartRate > 100)) {
        return true;
    }
    
    if (vitals.temperature && vitals.temperature > 38) {
        return true;
    }
    
    return false;
});

/**
 * Virtual: Primary Diagnosis
 */
medicalRecordSchema.virtual('primaryDiagnosis').get(function() {
    const primary = this.diagnosis.find(d => d.type === 'primary');
    return primary ? primary.condition : null;
});

/**
 * Pre-save middleware: Calculate BMI if height and weight are provided
 */
medicalRecordSchema.pre('save', function(next) {
    if (this.vitalSigns?.height && this.vitalSigns?.weight) {
        const heightInMeters = this.vitalSigns.height / 100;
        this.vitalSigns.bmi = this.vitalSigns.weight / (heightInMeters * heightInMeters);
    }
    next();
});

/**
 * Instance Method: Add prescription reference
 */
medicalRecordSchema.methods.addPrescription = async function(prescriptionId) {
    this.prescriptions.push(prescriptionId);
    return await this.save();
};

/**
 * Instance Method: Add lab result reference
 */
medicalRecordSchema.methods.addLabResult = async function(labResultId) {
    this.labResults.push(labResultId);
    return await this.save();
};

/**
 * Instance Method: Get complete record with populated references
 */
medicalRecordSchema.methods.getCompleteRecord = async function() {
    await this.populate('patientId', 'userId medicalRecordNumber')
        .populate({
            path: 'patientId',
            populate: { path: 'userId', select: 'firstName lastName dateOfBirth gender' }
        })
        .populate('doctorId', 'firstName lastName specialization')
        .populate('appointmentId', 'appointmentDate appointmentType')
        .populate('prescriptions')
        .populate('labResults');
    
    return this;
};

/**
 * Static Method: Find records by patient
 */
medicalRecordSchema.statics.findByPatient = async function(patientId, options = {}) {
    const { recordType, limit = 50, page = 1 } = options;
    
    const query = { patientId, status: 'finalized' };
    if (recordType) query.recordType = recordType;
    
    return await this.find(query)
        .populate('doctorId', 'firstName lastName specialization')
        .populate('appointmentId', 'appointmentDate')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit);
};

/**
 * Static Method: Search medical records
 */
medicalRecordSchema.statics.searchRecords = async function(patientId, searchQuery) {
    return await this.find({
        patientId,
        status: 'finalized',
        $or: [
            { chiefComplaint: { $regex: searchQuery, $options: 'i' } },
            { 'diagnosis.condition': { $regex: searchQuery, $options: 'i' } },
            { 'symptoms.symptom': { $regex: searchQuery, $options: 'i' } }
        ]
    })
    .populate('doctorId', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(20);
};

export const MedicalRecord = mongoose.model("MedicalRecord", medicalRecordSchema);