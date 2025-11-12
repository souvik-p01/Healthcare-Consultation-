/**
 * Healthcare System - Patient Model
 * 
 * Comprehensive patient information model for healthcare consultation system.
 * Extends user data with patient-specific medical information.
 * 
 * Features:
 * - Medical history and conditions
 * - Allergies and medications
 * - Emergency contacts
 * - Insurance information
 * - Family medical history
 * - HIPAA-compliant data storage
 * - Pagination for queries
 */


import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

// Sub-schema for Allergies
const allergySchema = new Schema({
    name: {
        type: String,
        required: [true, "Allergen name is required"],
        trim: true
    },
    severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe', 'life-threatening'],
        default: 'mild'
    },
    reaction: {
        type: String,
        trim: true
    },
    onsetDate: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    },
    diagnosedDate: {
        type: Date
    },
    notes: {
        type: String,
        trim: true
    }
});

// Sub-schema for Medications
const medicationSchema = new Schema({
    name: {
        type: String,
        required: [true, "Medication name is required"],
        trim: true
    },
    dosage: {
        type: String,
        trim: true
    },
    frequency: {
        type: String,
        trim: true
    },
    purpose: {
        type: String,
        trim: true
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

// Sub-schema for Emergency Contacts
const emergencyContactSchema = new Schema({
    name: {
        type: String,
        required: [true, "Emergency contact name is required"],
        trim: true
    },
    relationship: {
        type: String,
        required: [true, "Relationship is required"],
        trim: true
    },
    phone: {
        type: String,
        required: [true, "Phone number is required"],
        trim: true,
        match: [/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/, "Please enter a valid phone number"]
    },
    email: {
        type: String,
        lowercase: true,
        trim: true
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    isPrimary: {
        type: Boolean,
        default: false
    }
});

// Sub-schema for Insurance
const insuranceSchema = new Schema({
    provider: {
        type: String,
        trim: true
    },
    policyNumber: {
        type: String,
        trim: true
    },
    groupNumber: {
        type: String,
        trim: true
    },
    effectiveDate: {
        type: Date
    },
    expirationDate: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    },
    policyHolderName: {
        type: String,
        trim: true
    },
    policyHolderRelationship: {
        type: String,
        enum: ['self', 'spouse', 'parent', 'child', 'other'],
        default: 'self'
    },
    copay: {
        type: Number,
        min: 0
    },
    deductible: {
        type: Number,
        min: 0
    },
    insuranceCard: {
        front: String,
        back: String
    }
});

// Sub-schema for Medical History
const medicalHistorySchema = new Schema({
    conditions: [{
        name: {
            type: String,
            required: true,
            trim: true
        },
        diagnosisDate: Date,
        status: {
            type: String,
            enum: ['active', 'resolved', 'chronic', 'in-remission', 'cured', 'managed'],
            default: 'active'
        },
        treatment: String,
        notes: String
    }],
    surgeries: [{
        name: {
            type: String,
            required: true,
            trim: true
        },
        date: {
            type: Date,
            required: true
        },
        description: String,
        hospital: String,
        surgeon: String,
        complications: String,
        notes: String
    }],
    familyHistory: [{
        relationship: {
            type: String,
            required: true,
            enum: ['father', 'mother', 'sibling', 'grandparent', 'child', 'other'],
            trim: true
        },
        condition: {
            type: String,
            required: true,
            trim: true
        },
        ageAtDiagnosis: Number,
        status: {
            type: String,
            enum: ['living', 'deceased'],
            default: 'living'
        },
        notes: String
    }],
    lifestyle: {
        smoking: {
            type: String,
            enum: ['never', 'former', 'current', 'unknown'],
            default: 'unknown'
        },
        alcohol: {
            type: String,
            enum: ['never', 'occasional', 'moderate', 'heavy', 'unknown'],
            default: 'unknown'
        },
        exercise: {
            type: String,
            enum: ['none', 'rarely', 'weekly', 'daily', 'unknown'],
            default: 'unknown'
        },
        diet: {
            type: String,
            enum: ['regular', 'vegetarian', 'vegan', 'other', 'unknown'],
            default: 'unknown'
        }
    }
});

const patientSchema = new Schema(
    {
        // Reference to User model
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User reference is required'],
            unique: true
        },
        
        // Unique Medical Record Number
        medicalRecordNumber: {
            type: String,
            required: [true, 'Medical Record Number is required'],
            unique: true,
            uppercase: true,
            trim: true
        },
        
        // Blood Type Information
        bloodType: {
            type: String,
            enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
            default: 'Unknown'
        },
        
        // Height and Weight (for BMI calculation)
        height: {
            value: { 
                type: Number, 
                min: 0 
            },
            unit: { 
                type: String, 
                enum: ['cm', 'inches'], 
                default: 'cm' 
            }
        },
        weight: {
            value: { 
                type: Number, 
                min: 0 
            },
            unit: { 
                type: String, 
                enum: ['kg', 'lbs'], 
                default: 'kg' 
            }
        },
        
        // Sub-schemas
        allergies: [allergySchema],
        medications: [medicationSchema],
        emergencyContacts: [emergencyContactSchema],
        insurance: insuranceSchema,
        medicalHistory: medicalHistorySchema,
        
        // Primary Care Provider
        primaryCareProvider: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        
        // Preferred Pharmacy
        preferredPharmacy: {
            name: String,
            address: {
                street: String,
                city: String,
                state: String,
                zipCode: String
            },
            phoneNumber: String
        },
        
        // Immunization Records
        immunizations: [{
            vaccine: {
                type: String,
                required: true,
                trim: true
            },
            dateAdministered: {
                type: Date,
                required: true
            },
            nextDueDate: Date,
            batchNumber: String,
            administeredBy: String,
            reactions: String
        }],
        
        // Consent and Legal
        consents: [{
            consentType: {
                type: String,
                required: true,
                enum: ['treatment', 'data-sharing', 'research', 'emergency', 'telehealth']
            },
            consentGiven: {
                type: Boolean,
                default: false
            },
            consentDate: Date,
            documentUrl: String,
            expiryDate: Date
        }],
        
        // Notes and Preferences
        notes: {
            generalNotes: String,
            carePreferences: String,
            culturalConsiderations: String,
            languagePreference: String
        },
        
        // Status and Activity
        status: {
            type: String,
            enum: ['active', 'inactive', 'transferred', 'deceased'],
            default: 'active'
        },
        isActive: {
            type: Boolean,
            default: true
        },
        
        // Visit Information
        lastVisitDate: {
            type: Date
        },
        nextScheduledVisit: Date
    },
    {
        timestamps: true
    }
);

/**
 * Indexes for optimized queries
 * Define all indexes here to avoid duplicates
 */
// patientSchema.index({ user: 1 });
// patientSchema.index({ medicalRecordNumber: 1 });
patientSchema.index({ bloodType: 1 });
patientSchema.index({ status: 1 });
patientSchema.index({ primaryCareProvider: 1 });
patientSchema.index({ lastVisitDate: -1 });
patientSchema.index({ status: 1, lastVisitDate: -1 });
patientSchema.index({ 'medicalHistory.conditions.status': 1 });
patientSchema.index({ createdAt: -1 });

/**
 * Add aggregation pagination plugin
 */
patientSchema.plugin(mongooseAggregatePaginate);

/**
 * Virtual: BMI (Body Mass Index) Calculation
 */
patientSchema.virtual('bmi').get(function() {
    if (!this.height?.value || !this.weight?.value) return null;
    
    let heightInMeters = this.height.value;
    let weightInKg = this.weight.value;
    
    // Convert height to meters
    if (this.height.unit === 'inches') {
        heightInMeters = this.height.value * 0.0254;
    } else {
        heightInMeters = this.height.value / 100; // cm to meters
    }
    
    // Convert weight to kg
    if (this.weight.unit === 'lbs') {
        weightInKg = this.weight.value * 0.453592;
    }
    
    const bmi = weightInKg / (heightInMeters * heightInMeters);
    return Math.round(bmi * 10) / 10; // Round to 1 decimal place
});

/**
 * Virtual: BMI Category
 */
patientSchema.virtual('bmiCategory').get(function() {
    const bmi = this.bmi;
    if (!bmi) return 'Unknown';
    
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
});

/**
 * Virtual: Has Active Allergies
 */
patientSchema.virtual('hasActiveAllergies').get(function() {
    return this.allergies?.some(allergy => allergy.isActive) || false;
});

/**
 * Virtual: Has Chronic Conditions
 */
patientSchema.virtual('hasChronicConditions').get(function() {
    if (!this.medicalHistory?.conditions) return false;
    return this.medicalHistory.conditions.some(condition => 
        condition.status === 'chronic' || condition.status === 'active'
    );
});

/**
 * Virtual: Needs Follow Up
 */
patientSchema.virtual('needsFollowUp').get(function() {
    if (!this.lastVisitDate) return true;
    
    const daysSinceLastVisit = (Date.now() - this.lastVisitDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (this.hasChronicConditions && daysSinceLastVisit > 90) {
        return true;
    }
    
    if (daysSinceLastVisit > 365) {
        return true;
    }
    
    return false;
});

/**
 * Pre-save middleware: Generate Medical Record Number
 */
patientSchema.pre('save', async function(next) {
    if (this.isNew && !this.medicalRecordNumber) {
        try {
            const PatientModel = mongoose.model('Patient');
            const count = await PatientModel.countDocuments();
            this.medicalRecordNumber = `MRN${(count + 1).toString().padStart(6, '0')}`;
        } catch (error) {
            // Fallback if count fails
            this.medicalRecordNumber = `MRN${Date.now().toString().slice(-6)}`;
        }
    }
    next();
});

/**
 * Pre-save middleware: Ensure only one primary emergency contact
 */
patientSchema.pre('save', function(next) {
    if (this.emergencyContacts && this.emergencyContacts.length > 0) {
        let foundPrimary = false;
        
        this.emergencyContacts.forEach(contact => {
            if (contact.isPrimary) {
                if (foundPrimary) {
                    contact.isPrimary = false;
                } else {
                    foundPrimary = true;
                }
            }
        });
    }
    next();
});

/**
 * Instance Method: Calculate age from user's date of birth
 */
patientSchema.methods.calculateAge = async function() {
    try {
        const User = mongoose.model('User');
        const user = await User.findById(this.user).select('dateOfBirth');
        
        if (!user || !user.dateOfBirth) return null;
        
        const today = new Date();
        const birthDate = new Date(user.dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age;
    } catch (error) {
        console.error('Error calculating age:', error);
        return null;
    }
};

/**
 * Instance Method: Add allergy
 */
patientSchema.methods.addAllergy = async function(allergyData) {
    this.allergies.push(allergyData);
    return await this.save();
};

/**
 * Instance Method: Add medication
 */
patientSchema.methods.addMedication = async function(medicationData) {
    this.medications.push(medicationData);
    return await this.save();
};

/**
 * Instance Method: Add chronic condition
 */
patientSchema.methods.addChronicCondition = async function(conditionData) {
    if (!this.medicalHistory) {
        this.medicalHistory = new medicalHistorySchema();
    }
    if (!this.medicalHistory.conditions) {
        this.medicalHistory.conditions = [];
    }
    this.medicalHistory.conditions.push(conditionData);
    return await this.save();
};

/**
 * Instance Method: Update last visit date
 */
patientSchema.methods.updateLastVisit = async function() {
    this.lastVisitDate = new Date();
    return await this.save();
};

/**
 * Instance Method: Get full patient profile
 */
patientSchema.methods.getFullProfile = async function() {
    await this.populate('user', '-password -refreshToken');
    await this.populate('primaryCareProvider', 'firstName lastName specialization');
    
    const age = await this.calculateAge();
    
    return {
        patientId: this._id,
        medicalRecordNumber: this.medicalRecordNumber,
        user: this.user,
        primaryCareProvider: this.primaryCareProvider,
        demographics: {
            firstName: this.user?.firstName,
            lastName: this.user?.lastName,
            email: this.user?.email,
            phoneNumber: this.user?.phoneNumber,
            dateOfBirth: this.user?.dateOfBirth,
            age: age,
            gender: this.user?.gender
        },
        medicalInfo: {
            bloodType: this.bloodType,
            height: this.height,
            weight: this.weight,
            bmi: this.bmi,
            bmiCategory: this.bmiCategory
        },
        allergies: this.allergies,
        medications: this.medications,
        emergencyContacts: this.emergencyContacts,
        insurance: this.insurance,
        medicalHistory: this.medicalHistory,
        immunizations: this.immunizations,
        status: this.status,
        lastVisitDate: this.lastVisitDate,
        nextScheduledVisit: this.nextScheduledVisit
    };
};

/**
 * Instance Method: Check if patient needs follow-up
 */
patientSchema.methods.needsFollowUpCheck = function() {
    return this.needsFollowUp;
};

/**
 * Static Method: Find patients by primary care provider
 */
patientSchema.statics.findByPrimaryProvider = async function(providerId, options = {}) {
    const { limit = 50, page = 1 } = options;
    const skip = (page - 1) * limit;
    
    return await this.find({ 
        primaryCareProvider: providerId,
        status: 'active'
    })
    .populate('user', 'firstName lastName email phoneNumber dateOfBirth gender')
    .sort({ lastVisitDate: -1 })
    .limit(limit)
    .skip(skip);
};

/**
 * Static Method: Find patients needing follow-up
 */
patientSchema.statics.findNeedingFollowUp = async function(days = 90, options = {}) {
    const { limit = 50, page = 1 } = options;
    const skip = (page - 1) * limit;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return await this.find({
        status: 'active',
        $or: [
            { lastVisitDate: { $lt: cutoffDate } },
            { lastVisitDate: { $exists: false } }
        ]
    })
    .populate('user', 'firstName lastName email phoneNumber')
    .populate('primaryCareProvider', 'firstName lastName')
    .limit(limit)
    .skip(skip);
};

/**
 * Static Method: Search patients
 */
patientSchema.statics.searchPatients = async function(searchQuery, filters = {}) {
    const query = { status: 'active', ...filters };
    
    if (searchQuery) {
        query.$or = [
            { medicalRecordNumber: { $regex: searchQuery, $options: 'i' } },
            { 'user.firstName': { $regex: searchQuery, $options: 'i' } },
            { 'user.lastName': { $regex: searchQuery, $options: 'i' } }
        ];
    }
    
    return await this.find(query)
        .populate('user', 'firstName lastName email phoneNumber dateOfBirth gender')
        .populate('primaryCareProvider', 'firstName lastName specialization')
        .limit(50)
        .sort({ createdAt: -1 });
};

/**
 * Static Method: Get patient statistics
 */
patientSchema.statics.getStatistics = async function() {
    try {
        const stats = await this.aggregate([
            {
                $facet: {
                    total: [{ $count: 'count' }],
                    byStatus: [
                        { $group: { _id: '$status', count: { $sum: 1 } } }
                    ],
                    byBloodType: [
                        { $group: { _id: '$bloodType', count: { $sum: 1 } } }
                    ],
                    withChronicConditions: [
                        { $match: { 'medicalHistory.conditions': { $elemMatch: { status: { $in: ['active', 'chronic'] } } } } },
                        { $count: 'count' }
                    ],
                    withAllergies: [
                        { $match: { 'allergies': { $elemMatch: { isActive: true } } } },
                        { $count: 'count' }
                    ],
                    recentPatients: [
                        { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
                        { $count: 'count' }
                    ]
                }
            }
        ]);
        
        return stats[0] || {
            total: [{ count: 0 }],
            byStatus: [],
            byBloodType: [],
            withChronicConditions: [{ count: 0 }],
            withAllergies: [{ count: 0 }],
            recentPatients: [{ count: 0 }]
        };
    } catch (error) {
        console.error('Error getting patient statistics:', error);
        return {
            total: [{ count: 0 }],
            byStatus: [],
            byBloodType: [],
            withChronicConditions: [{ count: 0 }],
            withAllergies: [{ count: 0 }],
            recentPatients: [{ count: 0 }]
        };
    }
};

/**
 * Static Method: Create patient from user
 */
patientSchema.statics.createFromUser = async function(userId, patientData = {}) {
    try {
        const PatientModel = mongoose.model('Patient');
        
        // Check if patient already exists for this user
        const existingPatient = await PatientModel.findOne({ user: userId });
        if (existingPatient) {
            throw new Error('Patient profile already exists for this user');
        }
        
        const patient = new PatientModel({
            user: userId,
            ...patientData
        });
        
        await patient.save();
        return patient;
    } catch (error) {
        console.error('Error creating patient from user:', error);
        throw error;
    }
};

/**
 * Enable virtuals in JSON output
 */
patientSchema.set('toJSON', { 
    virtuals: true,
    transform: function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

patientSchema.set('toObject', { 
    virtuals: true,
    transform: function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

/**
 * Export Patient model with overwrite protection
 */
export const Patient = mongoose.models.Patient || mongoose.model("Patient", patientSchema);

/**
 * Usage Examples:
 * 
 * // Create new patient
 * const patient = await Patient.create({
 *     user: userId,
 *     bloodType: 'O+',
 *     height: { value: 175, unit: 'cm' },
 *     weight: { value: 70, unit: 'kg' },
 *     allergies: [{
 *         name: 'Penicillin',
 *         severity: 'severe',
 *         reaction: 'Anaphylaxis',
 *         isActive: true
 *     }],
 *     emergencyContacts: [{
 *         name: 'Jane Doe',
 *         relationship: 'Spouse',
 *         phone: '+1234567890',
 *         isPrimary: true
 *     }],
 *     medicalHistory: {
 *         conditions: [{
 *             name: 'Hypertension',
 *             status: 'chronic',
 *             diagnosisDate: new Date('2020-01-15')
 *         }],
 *         lifestyle: {
 *             smoking: 'never',
 *             alcohol: 'occasional',
 *             exercise: 'weekly'
 *         }
 *     }
 * });
 * 
 * // Get full patient profile
 * const fullProfile = await patient.getFullProfile();
 * 
 * // Add allergy
 * await patient.addAllergy({
 *     name: 'Peanuts',
 *     severity: 'moderate',
 *     reaction: 'Rash and itching',
 *     isActive: true
 * });
 * 
 * // Find patients needing follow-up
 * const patientsNeedingFollowUp = await Patient.findNeedingFollowUp(90);
 * 
 * // Search patients
 * const searchResults = await Patient.searchPatients('MRN', { bloodType: 'O+' });
 * 
 * // Get statistics
 * const stats = await Patient.getStatistics();
 */