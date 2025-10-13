/**
 * Healthcare System - Lab Result Model
 * 
 * Manages laboratory test results with comprehensive
 * test data, reference ranges, and clinical interpretation.
 */

import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const labResultSchema = new Schema(
    {
        // Patient Information
        patientId: {
            type: Schema.Types.ObjectId,
            ref: 'Patient',
            required: [true, 'Patient reference is required'],
            index: true
        },
        
        // Ordering Physician
        orderedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Ordering physician is required'],
            index: true
        },
        
        // Medical Record Reference
        medicalRecordId: {
            type: Schema.Types.ObjectId,
            ref: 'MedicalRecord',
            index: true
        },
        
        // Test Information
        testName: {
            type: String,
            required: [true, 'Test name is required'],
            trim: true,
            index: true
        },
        testCode: {
            type: String, // LOINC code
            trim: true,
            uppercase: true
        },
        testType: {
            type: String,
            enum: [
                'hematology', 
                'biochemistry', 
                'microbiology', 
                'immunology', 
                'urinalysis',
                'hormonal', 
                'genetic', 
                'toxicology', 
                'other'
            ],
            required: true,
            index: true
        },
        testCategory: {
            type: String,
            trim: true
        },
        
        // Test Results
        results: [{
            parameter: {
                type: String,
                required: true,
                trim: true
            },
            value: {
                type: Schema.Types.Mixed, // Can be number, string, or boolean
                required: true
            },
            unit: {
                type: String,
                trim: true
            },
            normalRange: {
                low: Schema.Types.Mixed,
                high: Schema.Types.Mixed,
                text: String // For non-numeric ranges
            },
            flag: {
                type: String,
                enum: ['normal', 'low', 'high', 'critical', 'abnormal'],
                default: 'normal'
            },
            interpretation: String,
            notes: String
        }],
        
        // Overall Result Summary
        overallResult: {
            summary: String,
            interpretation: String,
            clinicalSignificance: String,
            recommendations: [String]
        },
        
        // Test Status and Timeline
        status: {
            type: String,
            enum: ['ordered', 'collected', 'in-progress', 'completed', 'cancelled', 'rejected'],
            default: 'ordered',
            required: true,
            index: true
        },
        orderDate: {
            type: Date,
            required: true,
            default: Date.now
        },
        collectionDate: Date,
        receivedDate: Date,
        completedDate: Date,
        resultDate: {
            type: Date,
            index: true
        },
        
        // Specimen Information
        specimen: {
            type: {
                type: String,
                required: true,
                trim: true
            },
            collectionMethod: String,
            collectionSite: String,
            volume: String,
            container: String,
            notes: String
        },
        
        // Laboratory Information
        laboratory: {
            name: {
                type: String,
                required: true,
                trim: true
            },
            address: {
                street: String,
                city: String,
                state: String,
                zipCode: String
            },
            phoneNumber: String,
            labId: String,
            accreditations: [String]
        },
        
        // Performing Technologist
        performedBy: {
            name: String,
            license: String,
            signature: String
        },
        
        // Verifying Pathologist/Doctor
        verifiedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        verificationDate: Date,
        
        // Critical Results
        isCritical: {
            type: Boolean,
            default: false
        },
        criticalValue: String,
        criticalAlertSent: {
            type: Boolean,
            default: false
        },
        criticalAlertDate: Date,
        criticalAcknowledgedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        
        // Quality Control
        qualityControl: {
            inControl: Boolean,
            issues: [String],
            correctiveActions: [String]
        },
        
        // Attachments and Reports
        reportUrl: String, // Cloudinary URL for PDF report
        attachments: [{
            name: String,
            url: String,
            type: String
        }],
        
        // Comments and Notes
        technicianNotes: String,
        pathologistNotes: String,
        clinicalCorrelation: String,
        
        // Follow-up and Repeat Testing
        followUpRequired: {
            type: Boolean,
            default: false
        },
        followUpTest: String,
        followUpDate: Date,
        repeatTest: {
            required: Boolean,
            reason: String,
            scheduledDate: Date
        },
        
        // Cost and Billing
        testCost: Number,
        billingStatus: {
            type: String,
            enum: ['billed', 'paid', 'pending', 'insurance'],
            default: 'pending'
        },
        
        // Privacy and Access
        sensitivity: {
            type: String,
            enum: ['normal', 'confidential', 'restricted'],
            default: 'normal'
        },
        
        // Audit Trail
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
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
labResultSchema.index({ patientId: 1, resultDate: -1 });
labResultSchema.index({ orderedBy: 1, orderDate: -1 });
labResultSchema.index({ testType: 1, status: 1 });
labResultSchema.index({ status: 1, completedDate: 1 });
labResultSchema.index({ 'results.flag': 1 });

/**
 * Add aggregation pagination plugin
 */
labResultSchema.plugin(mongooseAggregatePaginate);

/**
 * Virtual: Has Abnormal Results
 */
labResultSchema.virtual('hasAbnormalResults').get(function() {
    return this.results.some(result => 
        result.flag && result.flag !== 'normal'
    );
});

/**
 * Virtual: Has Critical Results
 */
labResultSchema.virtual('hasCriticalResults').get(function() {
    return this.results.some(result => result.flag === 'critical') || this.isCritical;
});

/**
 * Virtual: Test Age (days since completion)
 */
labResultSchema.virtual('testAgeInDays').get(function() {
    if (!this.completedDate) return null;
    const today = new Date();
    const diffTime = today - this.completedDate;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

/**
 * Virtual: Turnaround Time (days from order to completion)
 */
labResultSchema.virtual('turnaroundTime').get(function() {
    if (!this.orderDate || !this.completedDate) return null;
    const diffTime = this.completedDate - this.orderDate;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

/**
 * Pre-save middleware: Set result date when completed
 */
labResultSchema.pre('save', function(next) {
    if (this.status === 'completed' && !this.resultDate) {
        this.resultDate = new Date();
    }
    
    // Auto-detect critical values
    if (this.results && this.results.length > 0) {
        const hasCritical = this.results.some(result => result.flag === 'critical');
        if (hasCritical && !this.isCritical) {
            this.isCritical = true;
        }
    }
    
    next();
});

/**
 * Instance Method: Mark as collected
 */
labResultSchema.methods.markCollected = async function(collectionDate = new Date()) {
    this.status = 'collected';
    this.collectionDate = collectionDate;
    return await this.save();
};

/**
 * Instance Method: Mark as completed
 */
labResultSchema.methods.markCompleted = async function(results, completedDate = new Date()) {
    this.status = 'completed';
    this.results = results;
    this.completedDate = completedDate;
    this.resultDate = completedDate;
    return await this.save();
};

/**
 * Instance Method: Add critical alert
 */
labResultSchema.methods.addCriticalAlert = async function(acknowledgedBy = null) {
    this.isCritical = true;
    this.criticalAlertSent = true;
    this.criticalAlertDate = new Date();
    if (acknowledgedBy) {
        this.criticalAcknowledgedBy = acknowledgedBy;
    }
    return await this.save();
};

/**
 * Instance Method: Get abnormal results
 */
labResultSchema.methods.getAbnormalResults = function() {
    return this.results.filter(result => 
        result.flag && result.flag !== 'normal'
    );
};

/**
 * Static Method: Find results by patient
 */
labResultSchema.statics.findByPatient = async function(patientId, options = {}) {
    const { testType, status, limit = 50, page = 1 } = options;
    
    const query = { patientId };
    if (testType) query.testType = testType;
    if (status) query.status = status;
    
    return await this.find(query)
        .populate('orderedBy', 'firstName lastName specialization')
        .populate('verifiedBy', 'firstName lastName')
        .sort({ orderDate: -1 })
        .limit(limit)
        .skip((page - 1) * limit);
};

/**
 * Static Method: Find pending results
 */
labResultSchema.statics.findPendingResults = async function() {
    return await this.find({
        status: { $in: ['ordered', 'collected', 'in-progress'] }
    })
    .populate('patientId', 'userId')
    .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'firstName lastName phoneNumber' }
    })
    .populate('orderedBy', 'firstName lastName')
    .sort({ orderDate: 1 });
};

/**
 * Static Method: Find critical results
 */
labResultSchema.statics.findCriticalResults = async function() {
    return await this.find({
        isCritical: true,
        criticalAlertSent: false
    })
    .populate('patientId', 'userId')
    .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'firstName lastName phoneNumber' }
    })
    .populate('orderedBy', 'firstName lastName phoneNumber');
};

/**
 * Static Method: Get lab statistics
 */
labResultSchema.statics.getStatistics = async function(labName = null, startDate, endDate) {
    const matchStage = {
        orderDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        }
    };
    
    if (labName) {
        matchStage['laboratory.name'] = labName;
    }
    
    return await this.aggregate([
        { $match: matchStage },
        {
            $facet: {
                total: [{ $count: 'count' }],
                byStatus: [
                    { $group: { _id: '$status', count: { $sum: 1 } } }
                ],
                byTestType: [
                    { $group: { _id: '$testType', count: { $sum: 1 } } }
                ],
                abnormalResults: [
                    { $unwind: '$results' },
                    { $match: { 'results.flag': { $in: ['low', 'high', 'critical', 'abnormal'] } } },
                    { $count: 'count' }
                ],
                turnaroundTime: [
                    { $match: { status: 'completed' } },
                    {
                        $group: {
                            _id: null,
                            avgTurnaround: { $avg: { $subtract: ['$completedDate', '$orderDate'] } },
                            maxTurnaround: { $max: { $subtract: ['$completedDate', '$orderDate'] } },
                            minTurnaround: { $min: { $subtract: ['$completedDate', '$orderDate'] } }
                        }
                    }
                ]
            }
        }
    ]);
};

export const LabResult = mongoose.model("LabResult", labResultSchema);