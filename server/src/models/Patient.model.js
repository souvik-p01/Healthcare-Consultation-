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
 */

import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const patientSchema = new Schema(
    {
        // Reference to User model
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User reference is required'],
            unique: true,
            index: true
        },
        
        // Unique Medical Record Number
        medicalRecordNumber: {
            type: String,
            required: [true, 'Medical Record Number is required'],
            unique: true,
            uppercase: true,
            trim: true,
            index: true
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
        
        // Allergies
        allergies: [{
            allergen: {
                type: String,
                required: true,
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
            diagnosedDate: Date,
            notes: String
        }],
        
        // Current Medications
        currentMedications: [{
            medicationName: {
                type: String,
                required: true,
                trim: true
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
            startDate: {
                type: Date,
                required: true
            },
            endDate: Date,
            prescribedBy: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            },
            purpose: String,
            sideEffects: [String]
        }],
        
        // Chronic Conditions
        chronicConditions: [{
            condition: {
                type: String,
                required: true,
                trim: true
            },
            diagnosedDate: {
                type: Date,
                required: true
            },
            severity: {
                type: String,
                enum: ['mild', 'moderate', 'severe', 'critical'],
                default: 'moderate'
            },
            status: {
                type: String,
                enum: ['active', 'in-remission', 'cured', 'managed'],
                default: 'active'
            },
            notes: String
        }],
        
        // Past Medical History
        medicalHistory: [{
            condition: {
                type: String,
                required: true,
                trim: true
            },
            diagnosedDate: Date,
            resolvedDate: Date,
            treatment: String,
            notes: String
        }],
        
        // Surgical History
        surgicalHistory: [{
            surgery: {
                type: String,
                required: true,
                trim: true
            },
            surgeryDate: {
                type: Date,
                required: true
            },
            hospital: String,
            surgeon: String,
            complications: String,
            notes: String
        }],
        
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
        
        // Family Medical History
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
        
        // Emergency Contacts
        emergencyContacts: [{
            name: {
                type: String,
                required: [true, 'Emergency contact name is required'],
                trim: true
            },
            relationship: {
                type: String,
                required: [true, 'Relationship is required'],
                trim: true
            },
            phoneNumber: {
                type: String,
                required: [true, 'Phone number is required'],
                trim: true
            },
            alternatePhone: String,
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
        }],
        
        // Insurance Information
        insurance: {
            providerName: {
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
            policyHolderName: {
                type: String,
                trim: true
            },
            policyHolderRelationship: {
                type: String,
                enum: ['self', 'spouse', 'parent', 'child', 'other'],
                default: 'self'
            },
            coverageStartDate: Date,
            coverageEndDate: Date,
            copay: Number,
            deductible: Number,
            insuranceCard: {
                front: String, // Cloudinary URL
                back: String   // Cloudinary URL
            }
        },
        
        // Primary Care Physician
        primaryCarePhysician: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            index: true
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
        
        // Lifestyle Information
        lifestyle: {
            smokingStatus: {
                type: String,
                enum: ['never', 'former', 'current', 'unknown'],
                default: 'unknown'
            },
            alcoholConsumption: {
                type: String,
                enum: ['none', 'occasional', 'moderate', 'heavy', 'unknown'],
                default: 'unknown'
            },
            exerciseFrequency: {
                type: String,
                enum: ['none', 'rarely', 'weekly', 'daily', 'unknown'],
                default: 'unknown'
            },
            diet: {
                type: String,
                enum: ['regular', 'vegetarian', 'vegan', 'other', 'unknown'],
                default: 'unknown'
            }
        },
        
        // Special Notes and Preferences
        notes: {
            generalNotes: String,
            carePreferences: String,
            culturalConsiderations: String,
            languagePreference: String
        },
        
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
            documentUrl: String, // Signed consent form URL
            expiryDate: Date
        }],
        
        // Status and Activity
        status: {
            type: String,
            enum: ['active', 'inactive', 'transferred', 'deceased'],
            default: 'active',
            index: true
        },
        
        // Last Visit Information
        lastVisitDate: {
            type: Date,
            index: true
        },
        nextScheduledVisit: Date
    },
    {
        timestamps: true
    }
);

/**
 * Indexes for optimized queries
 */
patientSchema.index({ userId: 1 });
patientSchema.index({ medicalRecordNumber: 1 });
patientSchema.index({ bloodType: 1 });
patientSchema.index({ status: 1, lastVisitDate: -1 });
patientSchema.index({ primaryCarePhysician: 1 });

/**
 * Add aggregation pagination plugin
 */
patientSchema.plugin(mongooseAggregatePaginate);

/**
 * Virtual: BMI (Body Mass Index) Calculation
 */
patientSchema.virtual('bmi').get(function() {
    if (!this.height?.value || !this.weight?.value) return null;
    
    // Convert to metric (kg and meters)
    let heightInMeters = this.height.value;
    let weightInKg = this.weight.value;
    
    if (this.height.unit === 'inches') {
        heightInMeters = this.height.value * 0.0254;
    } else {
        heightInMeters = this.height.value / 100; // cm to meters
    }
    
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
 * Virtual: Age (from User model reference)
 */
patientSchema.virtual('age').get(function() {
    if (!this.userId || !this.userId.dateOfBirth) return null;
    
    const today = new Date();
    const birthDate = new Date(this.userId.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
});

/**
 * Virtual: Has Active Allergies
 */
patientSchema.virtual('hasActiveAllergies').get(function() {
    return this.allergies && this.allergies.length > 0;
});

/**
 * Virtual: Has Chronic Conditions
 */
patientSchema.virtual('hasChronicConditions').get(function() {
    return this.chronicConditions?.some(c => c.status === 'active') || false;
});

/**
 * Pre-save middleware: Generate Medical Record Number if not exists
 */
patientSchema.pre('save', async function(next) {
    if (!this.medicalRecordNumber && this.isNew) {
        // Generate unique MRN: MRN + timestamp + random
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        this.medicalRecordNumber = `MRN${timestamp}${random}`;
    }
    next();
});

/**
 * Pre-save middleware: Ensure only one primary emergency contact
 */
patientSchema.pre('save', function(next) {
    const primaryContacts = this.emergencyContacts.filter(c => c.isPrimary);
    
    if (primaryContacts.length > 1) {
        // Keep only the first one as primary
        this.emergencyContacts.forEach((contact, index) => {
            if (index > 0 && contact.isPrimary) {
                contact.isPrimary = false;
            }
        });
    }
    
    next();
});

/**
 * Instance Method: Add allergy
 * 
 * @param {Object} allergyData - Allergy information
 * @returns {Promise<Patient>} - Updated patient
 */
patientSchema.methods.addAllergy = async function(allergyData) {
    this.allergies.push(allergyData);
    return await this.save();
};

/**
 * Instance Method: Add medication
 * 
 * @param {Object} medicationData - Medication information
 * @returns {Promise<Patient>} - Updated patient
 */
patientSchema.methods.addMedication = async function(medicationData) {
    this.currentMedications.push(medicationData);
    return await this.save();
};

/**
 * Instance Method: Add chronic condition
 * 
 * @param {Object} conditionData - Condition information
 * @returns {Promise<Patient>} - Updated patient
 */
patientSchema.methods.addChronicCondition = async function(conditionData) {
    this.chronicConditions.push(conditionData);
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
 * Instance Method: Get full patient profile with user data
 * 
 * @returns {Promise<Object>} - Complete patient profile
 */
patientSchema.methods.getFullProfile = async function() {
    await this.populate('userId', '-password -refreshToken');
    await this.populate('primaryCarePhysician', 'firstName lastName specialization');
    
    return {
        ...this.toObject(),
        fullName: this.userId?.fullName,
        email: this.userId?.email,
        phoneNumber: this.userId?.phoneNumber,
        bmi: this.bmi,
        bmiCategory: this.bmiCategory,
        age: this.age
    };
};

/**
 * Instance Method: Check if patient needs follow-up
 * 
 * @returns {boolean} - True if follow-up is overdue
 */
patientSchema.methods.needsFollowUp = function() {
    if (!this.lastVisitDate) return true;
    
    const daysSinceLastVisit = (Date.now() - this.lastVisitDate) / (1000 * 60 * 60 * 24);
    
    // If has chronic conditions and no visit in 90 days
    if (this.hasChronicConditions && daysSinceLastVisit > 90) {
        return true;
    }
    
    // If no visit in 365 days
    if (daysSinceLastVisit > 365) {
        return true;
    }
    
    return false;
};

/**
 * Static Method: Find patients by primary care physician
 * 
 * @param {String} doctorId - Doctor's user ID
 * @returns {Promise<Array>} - Array of patients
 */
patientSchema.statics.findByPrimaryPhysician = async function(doctorId) {
    return await this.find({ 
        primaryCarePhysician: doctorId,
        status: 'active'
    })
    .populate('userId', 'firstName lastName email phoneNumber dateOfBirth')
    .sort({ lastVisitDate: -1 });
};

/**
 * Static Method: Find patients needing follow-up
 * 
 * @param {Number} days - Days since last visit
 * @returns {Promise<Array>} - Array of patients
 */
patientSchema.statics.findNeedingFollowUp = async function(days = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return await this.find({
        status: 'active',
        $or: [
            { lastVisitDate: { $lt: cutoffDate } },
            { lastVisitDate: { $exists: false } }
        ]
    })
    .populate('userId', 'firstName lastName email phoneNumber')
    .populate('primaryCarePhysician', 'firstName lastName');
};

/**
 * Static Method: Search patients
 * 
 * @param {String} searchQuery - Search term
 * @param {Object} filters - Additional filters
 * @returns {Promise<Array>} - Array of matching patients
 */
patientSchema.statics.searchPatients = async function(searchQuery, filters = {}) {
    const query = { status: 'active', ...filters };
    
    if (searchQuery) {
        query.$or = [
            { medicalRecordNumber: { $regex: searchQuery, $options: 'i' } }
        ];
    }
    
    return await this.find(query)
        .populate('userId', 'firstName lastName email phoneNumber dateOfBirth')
        .populate('primaryCarePhysician', 'firstName lastName specialization')
        .limit(50);
};

/**
 * Static Method: Get patient statistics
 * 
 * @returns {Promise<Object>} - Patient statistics
 */
patientSchema.statics.getStatistics = async function() {
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
                    { $match: { 'chronicConditions.0': { $exists: true } } },
                    { $count: 'count' }
                ],
                withAllergies: [
                    { $match: { 'allergies.0': { $exists: true } } },
                    { $count: 'count' }
                ]
            }
        }
    ]);
    
    return stats[0];
};

/**
 * Enable virtuals in JSON output
 */
patientSchema.set('toJSON', { virtuals: true });
patientSchema.set('toObject', { virtuals: true });

// Export Patient model
export const Patient = mongoose.model("Patient", patientSchema);

/**
 * Usage Examples:
 * 
 * // Create new patient
 * const patient = await Patient.create({
 *     userId: userId,
 *     bloodType: 'O+',
 *     height: { value: 175, unit: 'cm' },
 *     weight: { value: 70, unit: 'kg' },
 *     allergies: [{
 *         allergen: 'Penicillin',
 *         severity: 'severe',
 *         reaction: 'Anaphylaxis'
 *     }],
 *     emergencyContacts: [{
 *         name: 'Jane Doe',
 *         relationship: 'Spouse',
 *         phoneNumber: '+1234567890',
 *         isPrimary: true
 *     }]
 * });
 * 
 * // Get full patient profile
 * const fullProfile = await patient.getFullProfile();
 * 
 * // Add allergy
 * await patient.addAllergy({
 *     allergen: 'Peanuts',
 *     severity: 'moderate',
 *     reaction: 'Rash and itching'
 * });
 * 
 * // Find patients needing follow-up
 * const patientsNeedingFollowUp = await Patient.findNeedingFollowUp(90);
 * 
 * // Search patients
 * const searchResults = await Patient.searchPatients('John', { bloodType: 'O+' });
 * 
 * // Get statistics
 * const stats = await Patient.getStatistics();
 */