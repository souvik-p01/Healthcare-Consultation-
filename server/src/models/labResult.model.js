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
        // Identification
        labResultNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true
        },
        
        // Patient Information
        patientId: {
            type: Schema.Types.ObjectId,
            ref: 'Patient',
            required: [true, 'Patient reference is required'],
            index: true
        },
        
        // Appointment Reference
        appointmentId: {
            type: Schema.Types.ObjectId,
            ref: 'Appointment',
            index: true
        },
        
        // Ordering Information
        orderedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Ordering physician is required'],
            index: true
        },
        
        // Test Information
        testName: {
            type: String,
            required: [true, 'Test name is required'],
            trim: true,
            index: true
        },
        testType: {
            type: String,
            enum: [
                'blood_test',
                'urine_test', 
                'imaging',
                'biopsy',
                'culture',
                'genetic_test',
                'hormone_test',
                'allergy_test',
                'cancer_screening',
                'infectious_disease',
                'metabolic_panel',
                'cardiac_marker',
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
        labTestCode: {
            type: String,
            trim: true,
            uppercase: true,
            index: true
        },
        
        // Test Results Data
        results: [{
            parameter: {
                type: String,
                required: true,
                trim: true
            },
            testItem: {
                type: String,
                required: true,
                trim: true
            },
            value: {
                type: Schema.Types.Mixed,
                required: true
            },
            unit: {
                type: String,
                trim: true
            },
            referenceRange: String,
            normalRange: {
                low: Schema.Types.Mixed,
                high: Schema.Types.Mixed,
                text: String
            },
            flag: {
                type: String,
                enum: ['normal', 'low', 'high', 'critical', 'abnormal'],
                default: 'normal'
            },
            interpretation: String,
            isAbnormal: {
                type: Boolean,
                default: false
            },
            isCritical: {
                type: Boolean,
                default: false
            },
            notes: String
        }],
        
        // Reference Ranges
        referenceRanges: {
            type: Map,
            of: String
        },
        
        // Units
        units: {
            type: Map,
            of: String
        },
        
        // Overall Interpretation
        interpretation: {
            type: String,
            trim: true
        },
        clinicalSignificance: {
            type: String,
            trim: true
        },
        recommendations: [{
            type: String,
            trim: true
        }],
        
        // Status and Timeline
        status: {
            type: String,
            enum: ['pending', 'collected', 'in_progress', 'completed', 'verified', 'cancelled'],
            default: 'pending',
            required: true,
            index: true
        },
        isCritical: {
            type: Boolean,
            default: false,
            index: true
        },
        hasAbnormalValues: {
            type: Boolean,
            default: false,
            index: true
        },
        
        // Dates
        orderedDate: {
            type: Date,
            required: true,
            default: Date.now
        },
        collectedDate: {
            type: Date,
            index: true
        },
        receivedDate: {
            type: Date,
            required: true,
            default: Date.now
        },
        reportedDate: {
            type: Date,
            index: true
        },
        verifiedDate: Date,
        
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
        
        // Personnel
        performedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        verifiedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        
        // Critical Result Handling
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
        acknowledgmentNotes: String,
        actionTaken: String,
        
        // Attachments
        labReportFiles: [{
            fileName: String,
            fileUrl: String,
            fileType: String,
            description: String,
            uploadedAt: {
                type: Date,
                default: Date.now
            },
            uploadedBy: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            }
        }],
        reportUrl: String,
        
        // Notes and Comments
        notes: {
            type: String,
            trim: true
        },
        verificationNotes: {
            type: String,
            trim: true
        },
        technicianNotes: {
            type: String,
            trim: true
        },
        pathologistNotes: {
            type: String,
            trim: true
        },
        
        // Follow-up
        followUpRequired: {
            type: Boolean,
            default: false
        },
        followUpTest: String,
        followUpDate: Date,
        
        // Quality Control
        qualityControl: {
            inControl: Boolean,
            issues: [String],
            correctiveActions: [String]
        },
        
        // Billing
        testCost: Number,
        billingStatus: {
            type: String,
            enum: ['pending', 'billed', 'paid', 'insurance_pending', 'rejected'],
            default: 'pending'
        },
        
        // Metadata
        metadata: {
            type: Map,
            of: Schema.Types.Mixed
        }
    },
    {
        timestamps: true
    }
);

/**
 * Indexes for optimized queries
 */
labResultSchema.index({ patientId: 1, reportedDate: -1 });
labResultSchema.index({ orderedBy: 1, reportedDate: -1 });
labResultSchema.index({ labResultNumber: 1 }, { unique: true });
labResultSchema.index({ status: 1, reportedDate: -1 });
labResultSchema.index({ isCritical: 1, reportedDate: -1 });
labResultSchema.index({ 'results.flag': 1 });
labResultSchema.index({ createdBy: 1, createdAt: -1 });

/**
 * Add aggregation pagination plugin
 */
labResultSchema.plugin(mongooseAggregatePaginate);

/**
 * Virtual: Age of result in days
 */
labResultSchema.virtual('resultAgeInDays').get(function() {
    if (!this.reportedDate) return null;
    const today = new Date();
    const diffTime = today - this.reportedDate;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

/**
 * Virtual: Turnaround time in hours
 */
labResultSchema.virtual('turnaroundTimeHours').get(function() {
    if (!this.orderedDate || !this.reportedDate) return null;
    const diffTime = this.reportedDate - this.orderedDate;
    return Math.floor(diffTime / (1000 * 60 * 60));
});

/**
 * Virtual: Is verified
 */
labResultSchema.virtual('isVerified').get(function() {
    return this.status === 'verified' && this.verifiedBy && this.verifiedDate;
});

/**
 * Virtual: Has attachments
 */
labResultSchema.virtual('hasAttachments').get(function() {
    return (this.labReportFiles && this.labReportFiles.length > 0) || this.reportUrl;
});

/**
 * Pre-save middleware
 */
labResultSchema.pre('save', function(next) {
    // Set reported date when completed or verified
    if ((this.status === 'completed' || this.status === 'verified') && !this.reportedDate) {
        this.reportedDate = new Date();
    }
    
    // Set verified date when verified
    if (this.status === 'verified' && !this.verifiedDate) {
        this.verifiedDate = new Date();
    }
    
    // Ensure labResultNumber is set
    if (!this.labResultNumber && this.isNew) {
        // Generate if not provided
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        this.labResultNumber = `LAB-${timestamp}-${random}`;
    }
    
    next();
});

/**
 * Instance Method: Mark as collected
 */
labResultSchema.methods.markAsCollected = async function(collectionDate = new Date(), collectorId = null) {
    this.status = 'collected';
    this.collectedDate = collectionDate;
    if (collectorId) {
        this.performedBy = collectorId;
    }
    return await this.save();
};

/**
 * Instance Method: Mark as completed
 */
labResultSchema.methods.markAsCompleted = async function(completedDate = new Date()) {
    this.status = 'completed';
    this.reportedDate = completedDate;
    return await this.save();
};

/**
 * Instance Method: Verify result
 */
labResultSchema.methods.verify = async function(verifiedById, notes = '') {
    this.status = 'verified';
    this.verifiedBy = verifiedById;
    this.verifiedDate = new Date();
    this.verificationNotes = notes;
    return await this.save();
};

/**
 * Instance Method: Add critical alert
 */
labResultSchema.methods.addCriticalAlert = async function() {
    this.isCritical = true;
    this.criticalAlertSent = true;
    this.criticalAlertDate = new Date();
    return await this.save();
};

/**
 * Instance Method: Acknowledge critical result
 */
labResultSchema.methods.acknowledgeCritical = async function(acknowledgedById, notes = '', action = '') {
    this.criticalAcknowledgedBy = acknowledgedById;
    this.acknowledgmentNotes = notes;
    this.actionTaken = action;
    return await this.save();
};

/**
 * Instance Method: Get abnormal results
 */
labResultSchema.methods.getAbnormalResults = function() {
    return this.results.filter(result => result.isAbnormal || result.flag !== 'normal');
};

/**
 * Instance Method: Get critical results
 */
labResultSchema.methods.getCriticalResults = function() {
    return this.results.filter(result => result.isCritical || result.flag === 'critical');
};

/**
 * Static Method: Find by patient with pagination
 */
labResultSchema.statics.findByPatient = async function(patientId, options = {}) {
    const { 
        status, 
        testType, 
        startDate, 
        endDate,
        page = 1, 
        limit = 20 
    } = options;
    
    const query = { patientId };
    
    if (status) query.status = status;
    if (testType) query.testType = testType;
    if (startDate || endDate) {
        query.reportedDate = {};
        if (startDate) query.reportedDate.$gte = new Date(startDate);
        if (endDate) query.reportedDate.$lte = new Date(endDate);
    }
    
    const skip = (page - 1) * limit;
    
    return await this.find(query)
        .populate('orderedBy', 'firstName lastName specialization')
        .populate('verifiedBy', 'firstName lastName')
        .populate('createdBy', 'firstName lastName')
        .sort({ reportedDate: -1 })
        .skip(skip)
        .limit(limit);
};

/**
 * Static Method: Find pending results
 */
labResultSchema.statics.findPendingResults = async function() {
    return await this.find({
        status: { $in: ['pending', 'collected', 'in_progress'] }
    })
    .populate('patientId', 'userId')
    .populate({
        path: 'patientId',
        populate: { 
            path: 'userId', 
            select: 'firstName lastName phoneNumber email' 
        }
    })
    .populate('orderedBy', 'firstName lastName phoneNumber')
    .sort({ orderedDate: 1 });
};

/**
 * Static Method: Find critical unacknowledged results
 */
labResultSchema.statics.findUnacknowledgedCritical = async function() {
    return await this.find({
        isCritical: true,
        criticalAcknowledgedBy: { $exists: false }
    })
    .populate('patientId', 'userId')
    .populate({
        path: 'patientId',
        populate: { 
            path: 'userId', 
            select: 'firstName lastName phoneNumber' 
        }
    })
    .populate('orderedBy', 'firstName lastName phoneNumber email')
    .sort({ reportedDate: -1 });
};

/**
 * Static Method: Get statistics
 */
labResultSchema.statics.getStatistics = async function(options = {}) {
    const { 
        startDate, 
        endDate, 
        patientId, 
        orderedBy,
        testType 
    } = options;
    
    const matchStage = {};
    
    if (startDate || endDate) {
        matchStage.reportedDate = {};
        if (startDate) matchStage.reportedDate.$gte = new Date(startDate);
        if (endDate) matchStage.reportedDate.$lte = new Date(endDate);
    }
    
    if (patientId) matchStage.patientId = patientId;
    if (orderedBy) matchStage.orderedBy = orderedBy;
    if (testType) matchStage.testType = testType;
    
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
                criticalStats: [
                    { $group: { 
                        _id: null,
                        totalCritical: { $sum: { $cond: ['$isCritical', 1, 0] } },
                        totalAbnormal: { $sum: { $cond: ['$hasAbnormalValues', 1, 0] } }
                    } }
                ],
                turnaroundStats: [
                    { $match: { status: { $in: ['completed', 'verified'] } } },
                    {
                        $group: {
                            _id: null,
                            avgTurnaroundHours: { 
                                $avg: { 
                                    $divide: [
                                        { $subtract: ['$reportedDate', '$orderedDate'] },
                                        1000 * 60 * 60
                                    ]
                                }
                            },
                            maxTurnaroundHours: {
                                $max: {
                                    $divide: [
                                        { $subtract: ['$reportedDate', '$orderedDate'] },
                                        1000 * 60 * 60
                                    ]
                                }
                            }
                        }
                    }
                ],
                monthlyTrend: [
                    {
                        $group: {
                            _id: {
                                year: { $year: '$reportedDate' },
                                month: { $month: '$reportedDate' }
                            },
                            count: { $sum: 1 },
                            criticalCount: { $sum: { $cond: ['$isCritical', 1, 0] } }
                        }
                    },
                    { $sort: { '_id.year': 1, '_id.month': 1 } },
                    { $limit: 12 }
                ]
            }
        }
    ]);
};

/**
 * Static Method: Search lab results
 */
labResultSchema.statics.search = async function(searchTerm, options = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;
    
    return await this.aggregate([
        {
            $lookup: {
                from: 'patients',
                localField: 'patientId',
                foreignField: '_id',
                as: 'patient'
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'patient.userId',
                foreignField: '_id',
                as: 'patientUser'
            }
        },
        {
            $match: {
                $or: [
                    { labResultNumber: { $regex: searchTerm, $options: 'i' } },
                    { testName: { $regex: searchTerm, $options: 'i' } },
                    { labTestCode: { $regex: searchTerm, $options: 'i' } },
                    { 'patientUser.firstName': { $regex: searchTerm, $options: 'i' } },
                    { 'patientUser.lastName': { $regex: searchTerm, $options: 'i' } }
                ]
            }
        },
        { $unwind: '$patient' },
        { $unwind: '$patientUser' },
        { $sort: { reportedDate: -1 } },
        { $skip: skip },
        { $limit: limit }
    ]);
};

export const LabResult = mongoose.model("LabResult", labResultSchema);