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
 * - Health metrics tracking
 * - Document management
 * - Telemedicine integration
 */

import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

// Sub-schema for Health Metrics
const healthMetricSchema = new Schema({
    timestamp: {
        type: Date,
        required: true,
        default: Date.now
    },
    heartRate: {
        value: { type: Number, min: 0, max: 300 },
        unit: { type: String, default: 'bpm' }
    },
    bloodPressure: {
        systolic: { type: Number, min: 0, max: 300 },
        diastolic: { type: Number, min: 0, max: 300 },
        unit: { type: String, default: 'mmHg' }
    },
    bloodSugar: {
        value: { type: Number, min: 0 },
        unit: { type: String, default: 'mg/dL' }
    },
    weight: {
        value: { type: Number, min: 0 },
        unit: { type: String, default: 'kg' }
    },
    temperature: {
        value: { type: Number, min: 0 },
        unit: { type: String, default: '°C' }
    },
    oxygenSaturation: {
        value: { type: Number, min: 0, max: 100 },
        unit: { type: String, default: '%' }
    },
    respiratoryRate: {
        value: { type: Number, min: 0 },
        unit: { type: String, default: 'breaths/min' }
    },
    notes: {
        type: String,
        trim: true
    },
    measuredBy: {
        type: String,
        enum: ['patient', 'doctor', 'nurse', 'device'],
        default: 'patient'
    }
}, { _id: false });

// Sub-schema for Document References
const documentReferenceSchema = new Schema({
    documentId: {
        type: Schema.Types.ObjectId,
        ref: 'Document'
    },
    documentType: {
        type: String,
        required: true,
        enum: [
            'medical_record', 'lab_result', 'prescription', 
            'insurance', 'consent_form', 'imaging', 
            'report', 'referral', 'other'
        ]
    },
    fileName: {
        type: String,
        required: true,
        trim: true
    },
    fileUrl: {
        type: String,
        required: true
    },
    fileSize: Number,
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    description: {
        type: String,
        trim: true
    },
    uploadedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationDate: Date,
    verifiedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
}, { _id: false });

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
    },
    diagnosedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    lastReactionDate: Date
}, { _id: true });

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
    },
    prescribedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    pharmacy: {
        name: String,
        address: String,
        phone: String
    },
    refillsRemaining: {
        type: Number,
        min: 0,
        default: 0
    },
    instructions: {
        type: String,
        trim: true
    },
    sideEffects: [String]
}, { _id: true });

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
    },
    canMakeMedicalDecisions: {
        type: Boolean,
        default: false
    },
    notes: {
        type: String,
        trim: true
    }
}, { _id: true });

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
    },
    phoneNumber: String,
    website: String,
    notes: {
        type: String,
        trim: true
    }
}, { _id: false });

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
        notes: String,
        diagnosedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        lastFollowUp: Date,
        nextFollowUp: Date,
        severity: {
            type: String,
            enum: ['mild', 'moderate', 'severe'],
            default: 'moderate'
        }
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
        notes: String,
        recoveryTime: String
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
        notes: String,
        deceasedAge: Number
    }],
    lifestyle: {
        smoking: {
            status: {
                type: String,
                enum: ['never', 'former', 'current', 'unknown'],
                default: 'unknown'
            },
            years: Number,
            cigarettesPerDay: Number,
            quitDate: Date
        },
        alcohol: {
            status: {
                type: String,
                enum: ['never', 'occasional', 'moderate', 'heavy', 'unknown'],
                default: 'unknown'
            },
            drinksPerWeek: Number,
            type: String
        },
        exercise: {
            frequency: {
                type: String,
                enum: ['none', 'rarely', 'weekly', 'daily', 'unknown'],
                default: 'unknown'
            },
            type: String,
            durationMinutes: Number
        },
        diet: {
            type: {
                type: String,
                enum: ['regular', 'vegetarian', 'vegan', 'keto', 'gluten-free', 'other', 'unknown'],
                default: 'unknown'
            },
            notes: String,
            restrictions: [String]
        },
        sleep: {
            hoursPerNight: Number,
            quality: {
                type: String,
                enum: ['poor', 'fair', 'good', 'excellent', 'unknown'],
                default: 'unknown'
            }
        }
    }
}, { _id: false });

// Sub-schema for Preferences
const preferencesSchema = new Schema({
    notifications: {
        email: {
            appointmentReminders: { type: Boolean, default: true },
            labResults: { type: Boolean, default: true },
            prescriptionRefills: { type: Boolean, default: true },
            healthTips: { type: Boolean, default: false }
        },
        sms: {
            appointmentReminders: { type: Boolean, default: true },
            emergencyAlerts: { type: Boolean, default: true }
        },
        push: {
            appointmentReminders: { type: Boolean, default: true },
            messages: { type: Boolean, default: true }
        }
    },
    communication: {
        preferredLanguage: {
            type: String,
            default: 'en',
            enum: ['en', 'es', 'fr', 'de', 'hi', 'zh', 'other']
        },
        preferredContactMethod: {
            type: String,
            enum: ['email', 'phone', 'sms', 'app'],
            default: 'email'
        },
        contactTimeWindow: {
            start: { type: String, default: '09:00' },
            end: { type: String, default: '17:00' }
        }
    },
    privacy: {
        shareDataWithProviders: { type: Boolean, default: true },
        shareDataForResearch: { type: Boolean, default: false },
        emergencyAccess: { type: Boolean, default: true }
    },
    accessibility: {
        fontSize: {
            type: String,
            enum: ['small', 'medium', 'large'],
            default: 'medium'
        },
        highContrast: { type: Boolean, default: false },
        screenReader: { type: Boolean, default: false }
    }
}, { _id: false });

// Sub-schema for Telemedicine
const telemedicineSchema = new Schema({
    sessions: [{
        sessionId: String,
        doctorId: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        date: Date,
        duration: Number,
        recordingUrl: String,
        notes: String,
        prescriptions: [{
            type: Schema.Types.ObjectId,
            ref: 'Prescription'
        }]
    }],
    preferences: {
        videoQuality: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium'
        },
        autoJoin: { type: Boolean, default: false },
        virtualBackground: { type: Boolean, default: true }
    }
}, { _id: false });

// Sub-schema for Billing
const billingSchema = new Schema({
    invoices: [{
        invoiceId: String,
        date: Date,
        amount: Number,
        status: {
            type: String,
            enum: ['pending', 'paid', 'overdue', 'cancelled'],
            default: 'pending'
        },
        dueDate: Date,
        paidDate: Date,
        description: String
    }],
    paymentMethods: [{
        type: {
            type: String,
            enum: ['credit_card', 'debit_card', 'bank_transfer', 'insurance']
        },
        lastFour: String,
        expiryDate: Date,
        isDefault: { type: Boolean, default: false }
    }],
    insuranceClaims: [{
        claimId: String,
        date: Date,
        amount: Number,
        status: String,
        notes: String
    }]
}, { _id: false });

const patientSchema = new Schema(
    {
        // Reference to User model
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User reference is required'],
            unique: true,
            index: true
        },
        
        // Unique Medical Record Number
        medicalRecordNumber: {
            type: String,
            unique: true,
            uppercase: true,
            trim: true,
            index: true
        },
        
        // Blood Type Information
        bloodType: {
            type: String,
            enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
            default: 'Unknown',
            index: true
        },
        
        // Height and Weight (for BMI calculation)
        height: {
            value: { 
                type: Number, 
                min: 0,
                max: 300
            },
            unit: { 
                type: String, 
                enum: ['cm', 'inches', 'meters', 'feet'], 
                default: 'cm' 
            },
            lastUpdated: Date
        },
        weight: {
            value: { 
                type: Number, 
                min: 0,
                max: 500
            },
            unit: { 
                type: String, 
                enum: ['kg', 'lbs'], 
                default: 'kg' 
            },
            lastUpdated: Date
        },
        
        // Health Metrics History
        healthMetrics: [healthMetricSchema],
        
        // Document References
        documents: [documentReferenceSchema],
        
        // Sub-schemas
        allergies: [allergySchema],
        medications: [medicationSchema],
        emergencyContacts: [emergencyContactSchema],
        insurance: insuranceSchema,
        medicalHistory: medicalHistorySchema,
        
        // Preferences
        preferences: preferencesSchema,
        
        // Telemedicine
        telemedicine: telemedicineSchema,
        
        // Billing
        billing: billingSchema,
        
        // Primary Care Provider
        primaryCareProvider: {
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
                zipCode: String,
                country: String
            },
            phoneNumber: String,
            email: String,
            website: String,
            distance: Number,
            is24Hours: { type: Boolean, default: false }
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
            administeredAt: String,
            reactions: String,
            doseNumber: Number,
            totalDoses: Number,
            notes: String
        }],
        
        // Consent and Legal
        consents: [{
            consentType: {
                type: String,
                required: true,
                enum: ['treatment', 'data-sharing', 'research', 'emergency', 'telehealth', 'marketing']
            },
            consentGiven: {
                type: Boolean,
                default: false
            },
            consentDate: Date,
            documentUrl: String,
            expiryDate: Date,
            revokedDate: Date,
            version: String,
            acknowledgedBy: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            }
        }],
        
        // Notes and Preferences
        notes: {
            generalNotes: String,
            carePreferences: String,
            culturalConsiderations: String,
            languagePreference: String,
            religiousConsiderations: String,
            mobilityConsiderations: String
        },
        
        // Status and Activity
        status: {
            type: String,
            enum: ['active', 'inactive', 'transferred', 'deceased', 'archived'],
            default: 'active',
            index: true
        },
        isActive: {
            type: Boolean,
            default: true
        },
        
        // Visit Information
        lastVisitDate: {
            type: Date,
            index: true
        },
        nextScheduledVisit: Date,
        
        // Health Goals
        healthGoals: [{
            goal: String,
            targetValue: mongoose.Schema.Types.Mixed,
            currentValue: mongoose.Schema.Types.Mixed,
            unit: String,
            startDate: Date,
            targetDate: Date,
            progress: Number,
            status: {
                type: String,
                enum: ['not_started', 'in_progress', 'achieved', 'abandoned'],
                default: 'not_started'
            },
            notes: String
        }],
        
        // Notifications
        notifications: [{
            type: {
                type: String,
                enum: ['appointment', 'prescription', 'lab_result', 'billing', 'general']
            },
            title: String,
            message: String,
            read: { type: Boolean, default: false },
            createdAt: { type: Date, default: Date.now },
            actionUrl: String,
            priority: {
                type: String,
                enum: ['low', 'medium', 'high', 'urgent'],
                default: 'medium'
            }
        }],
        
        // Audit Trail
        lastHealthCheck: Date,
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        
        // Metadata
        metadata: {
            healthScore: {
                type: Number,
                min: 0,
                max: 100,
                default: 75
            },
            riskLevel: {
                type: String,
                enum: ['low', 'medium', 'high'],
                default: 'low'
            },
            lastScreening: Date,
            nextScreening: Date
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

/**
 * Indexes for optimized queries
 */
patientSchema.index({ user: 1 });
patientSchema.index({ medicalRecordNumber: 1 });
patientSchema.index({ bloodType: 1 });
patientSchema.index({ status: 1 });
patientSchema.index({ primaryCareProvider: 1 });
patientSchema.index({ lastVisitDate: -1 });
patientSchema.index({ status: 1, lastVisitDate: -1 });
patientSchema.index({ 'medicalHistory.conditions.status': 1 });
patientSchema.index({ createdAt: -1 });
patientSchema.index({ 'metadata.healthScore': -1 });
patientSchema.index({ 'metadata.riskLevel': 1 });
patientSchema.index({ 'allergies.isActive': 1 });
patientSchema.index({ 'medications.isActive': 1 });
patientSchema.index({ 'notifications.read': 1, 'notifications.createdAt': -1 });
patientSchema.index({ 'healthGoals.status': 1 });
patientSchema.index({ 'billing.invoices.status': 1 });

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
    switch (this.height.unit) {
        case 'inches':
            heightInMeters = this.height.value * 0.0254;
            break;
        case 'feet':
            heightInMeters = this.height.value * 0.3048;
            break;
        case 'cm':
            heightInMeters = this.height.value / 100;
            break;
        case 'meters':
        default:
            // Already in meters or assume meters
            break;
    }
    
    // Convert weight to kg
    if (this.weight.unit === 'lbs') {
        weightInKg = this.weight.value * 0.453592;
    }
    
    const bmi = weightInKg / (heightInMeters * heightInMeters);
    return Math.round(bmi * 100) / 100; // Round to 2 decimal places
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
 * Virtual: Age (calculated from user's date of birth)
 */
patientSchema.virtual('age').get(async function() {
    try {
        const User = mongoose.model('User');
        const user = await User.findById(this.user).select('dateOfBirth').lean();
        
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
 * Virtual: Unread Notifications Count
 */
patientSchema.virtual('unreadNotificationsCount').get(function() {
    return this.notifications?.filter(n => !n.read).length || 0;
});

/**
 * Virtual: Active Medications Count
 */
patientSchema.virtual('activeMedicationsCount').get(function() {
    return this.medications?.filter(med => med.isActive).length || 0;
});

/**
 * Virtual: Upcoming Appointments Count
 */
patientSchema.virtual('upcomingAppointmentsCount').get(async function() {
    try {
        const Appointment = mongoose.model('Appointment');
        return await Appointment.countDocuments({
            patientId: this._id,
            status: { $in: ['scheduled', 'confirmed'] },
            appointmentDate: { $gte: new Date() }
        });
    } catch (error) {
        console.error('Error counting upcoming appointments:', error);
        return 0;
    }
});

/**
 * Pre-save middleware: Generate Medical Record Number
 */
patientSchema.pre('save', async function(next) {
    if (!this.medicalRecordNumber) {
        try {
            const PatientModel = this.constructor;
            const count = await PatientModel.countDocuments();
            const paddedCount = (count + 1).toString().padStart(8, '0');
            const year = new Date().getFullYear();
            this.medicalRecordNumber = `MRN${year}${paddedCount}`;
        } catch (error) {
            // Fallback if count fails
            const timestamp = Date.now().toString().slice(-8);
            this.medicalRecordNumber = `MRN${timestamp}`;
        }
    }
    
    // Ensure only one primary emergency contact
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
        
        // If no primary found, set first one as primary
        if (!foundPrimary && this.emergencyContacts.length > 0) {
            this.emergencyContacts[0].isPrimary = true;
        }
    }
    
    // Update last updated dates for height and weight
    if (this.isModified('height.value') || this.isModified('height.unit')) {
        this.height.lastUpdated = new Date();
    }
    
    if (this.isModified('weight.value') || this.isModified('weight.unit')) {
        this.weight.lastUpdated = new Date();
    }
    
    next();
});

/**
 * Instance Method: Calculate health score based on various factors
 */
patientSchema.methods.calculateHealthScore = function() {
    let score = 75; // Base score
    
    // Adjust based on BMI
    const bmi = this.bmi;
    if (bmi) {
        if (bmi >= 18.5 && bmi <= 24.9) {
            score += 15; // Normal weight
        } else if (bmi < 18.5) {
            score -= 10; // Underweight
        } else if (bmi <= 29.9) {
            score -= 5; // Overweight
        } else {
            score -= 20; // Obese
        }
    }
    
    // Adjust based on recent health check
    if (this.lastHealthCheck) {
        const daysSinceCheck = (new Date() - this.lastHealthCheck) / (1000 * 60 * 60 * 24);
        if (daysSinceCheck < 90) {
            score += 10; // Recent checkup
        } else if (daysSinceCheck > 365) {
            score -= 15; // Overdue for checkup
        }
    }
    
    // Adjust for chronic conditions
    if (this.medicalHistory?.conditions) {
        const chronicConditions = this.medicalHistory.conditions.filter(
            condition => condition.status === 'chronic'
        ).length;
        score -= chronicConditions * 5;
        
        const activeConditions = this.medicalHistory.conditions.filter(
            condition => condition.status === 'active'
        ).length;
        score -= activeConditions * 3;
    }
    
    // Adjust for severe allergies
    if (this.allergies?.some(allergy => allergy.isActive && allergy.severity === 'life-threatening')) {
        score -= 20;
    } else if (this.allergies?.some(allergy => allergy.isActive && allergy.severity === 'severe')) {
        score -= 10;
    }
    
    // Adjust for lifestyle factors
    if (this.medicalHistory?.lifestyle) {
        const lifestyle = this.medicalHistory.lifestyle;
        
        if (lifestyle.smoking?.status === 'current') score -= 20;
        if (lifestyle.smoking?.status === 'former') score -= 5;
        
        if (lifestyle.alcohol?.status === 'heavy') score -= 15;
        if (lifestyle.alcohol?.status === 'moderate') score -= 5;
        
        if (lifestyle.exercise?.frequency === 'daily') score += 10;
        if (lifestyle.exercise?.frequency === 'weekly') score += 5;
        if (lifestyle.exercise?.frequency === 'none') score -= 10;
        
        if (lifestyle.sleep?.quality === 'excellent') score += 5;
        if (lifestyle.sleep?.quality === 'poor') score -= 10;
    }
    
    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, Math.round(score)));
};

/**
 * Instance Method: Add health metric
 */
patientSchema.methods.addHealthMetric = async function(metricData) {
    const metric = {
        timestamp: new Date(),
        ...metricData
    };
    
    if (!this.healthMetrics) {
        this.healthMetrics = [];
    }
    
    this.healthMetrics.push(metric);
    
    // Keep only last 1000 metrics
    if (this.healthMetrics.length > 1000) {
        this.healthMetrics = this.healthMetrics.slice(-1000);
    }
    
    // Update health score
    this.metadata.healthScore = this.calculateHealthScore();
    
    // Update risk level based on health score
    const healthScore = this.metadata.healthScore;
    if (healthScore >= 80) {
        this.metadata.riskLevel = 'low';
    } else if (healthScore >= 60) {
        this.metadata.riskLevel = 'medium';
    } else {
        this.metadata.riskLevel = 'high';
    }
    
    return await this.save();
};

/**
 * Instance Method: Add document reference
 */
patientSchema.methods.addDocument = async function(documentData) {
    const document = {
        ...documentData,
        uploadedAt: new Date()
    };
    
    if (!this.documents) {
        this.documents = [];
    }
    
    this.documents.push(document);
    return await this.save();
};

/**
 * Instance Method: Add notification
 */
patientSchema.methods.addNotification = async function(notificationData) {
    const notification = {
        ...notificationData,
        createdAt: new Date(),
        read: false
    };
    
    if (!this.notifications) {
        this.notifications = [];
    }
    
    this.notifications.unshift(notification); // Add to beginning
    
    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
        this.notifications = this.notifications.slice(0, 100);
    }
    
    return await this.save();
};

/**
 * Instance Method: Mark notification as read
 */
patientSchema.methods.markNotificationAsRead = async function(notificationIndex) {
    if (this.notifications && this.notifications[notificationIndex]) {
        this.notifications[notificationIndex].read = true;
        return await this.save();
    }
    return this;
};

/**
 * Instance Method: Mark all notifications as read
 */
patientSchema.methods.markAllNotificationsAsRead = async function() {
    if (this.notifications) {
        this.notifications.forEach(notification => {
            notification.read = true;
        });
        return await this.save();
    }
    return this;
};

/**
 * Instance Method: Add allergy with validation
 */
patientSchema.methods.addAllergy = async function(allergyData) {
    // Check for duplicate allergy
    const duplicate = this.allergies?.find(
        allergy => allergy.name.toLowerCase() === allergyData.name.toLowerCase() && allergy.isActive
    );
    
    if (duplicate) {
        throw new Error(`Allergy "${allergyData.name}" already exists`);
    }
    
    this.allergies.push(allergyData);
    this.metadata.healthScore = this.calculateHealthScore();
    return await this.save();
};

/**
 * Instance Method: Add medication with validation
 */
patientSchema.methods.addMedication = async function(medicationData) {
    this.medications.push(medicationData);
    return await this.save();
};

/**
 * Instance Method: Add emergency contact
 */
patientSchema.methods.addEmergencyContact = async function(contactData) {
    this.emergencyContacts.push(contactData);
    return await this.save();
};

/**
 * Instance Method: Update last visit date
 */
patientSchema.methods.updateLastVisit = async function() {
    this.lastVisitDate = new Date();
    this.lastHealthCheck = new Date();
    return await this.save();
};

/**
 * Instance Method: Get latest health metrics
 */
patientSchema.methods.getLatestHealthMetrics = function(limit = 10) {
    if (!this.healthMetrics || this.healthMetrics.length === 0) {
        return [];
    }
    
    return this.healthMetrics
        .slice()
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
};

/**
 * Instance Method: Get health metrics summary
 */
patientSchema.methods.getHealthMetricsSummary = function() {
    if (!this.healthMetrics || this.healthMetrics.length === 0) {
        return null;
    }
    
    const latestMetrics = this.getLatestHealthMetrics(1)[0];
    const recentMetrics = this.getLatestHealthMetrics(30);
    
    return {
        latest: latestMetrics,
        trends: {
            heartRate: calculateTrend(recentMetrics, 'heartRate.value'),
            bloodPressure: {
                systolic: calculateTrend(recentMetrics, 'bloodPressure.systolic'),
                diastolic: calculateTrend(recentMetrics, 'bloodPressure.diastolic')
            },
            bloodSugar: calculateTrend(recentMetrics, 'bloodSugar.value'),
            weight: calculateTrend(recentMetrics, 'weight.value')
        },
        summary: {
            totalMeasurements: this.healthMetrics.length,
            lastMeasurement: latestMetrics.timestamp,
            averageHeartRate: calculateAverage(recentMetrics, 'heartRate.value'),
            averageBloodPressure: calculateAverage(recentMetrics, metric => 
                metric.bloodPressure ? (metric.bloodPressure.systolic + metric.bloodPressure.diastolic) / 2 : null
            )
        }
    };
};

/**
 * Instance Method: Get full patient profile
 */
patientSchema.methods.getFullProfile = async function() {
    await this.populate('user', '-password -refreshToken');
    await this.populate('primaryCareProvider', 'firstName lastName specialization avatar');
    
    const age = await this.age; // Using virtual property
    
    // Get upcoming appointments count
    const upcomingAppointmentsCount = await this.upcomingAppointmentsCount;
    
    // Get recent health metrics
    const recentHealthMetrics = this.getLatestHealthMetrics(10);
    const healthMetricsSummary = this.getHealthMetricsSummary();
    
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
            gender: this.user?.gender,
            address: this.user?.address
        },
        medicalInfo: {
            bloodType: this.bloodType,
            height: this.height,
            weight: this.weight,
            bmi: this.bmi,
            bmiCategory: this.bmiCategory,
            lastHealthCheck: this.lastHealthCheck
        },
        healthData: {
            metrics: recentHealthMetrics,
            summary: healthMetricsSummary,
            score: this.metadata.healthScore,
            riskLevel: this.metadata.riskLevel
        },
        allergies: this.allergies,
        medications: this.medications,
        emergencyContacts: this.emergencyContacts,
        insurance: this.insurance,
        medicalHistory: this.medicalHistory,
        documents: this.documents?.slice(0, 10) || [],
        preferences: this.preferences,
        telemedicine: this.telemedicine,
        billing: {
            ...this.billing,
            outstandingBalance: this.billing?.invoices?.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0) || 0
        },
        statistics: {
            activeMedications: this.activeMedicationsCount,
            activeAllergies: this.allergies?.filter(a => a.isActive).length || 0,
            upcomingAppointments: upcomingAppointmentsCount,
            unreadNotifications: this.unreadNotificationsCount,
            totalDocuments: this.documents?.length || 0
        },
        notifications: this.notifications?.slice(0, 20) || [],
        consents: this.consents,
        immunizations: this.immunizations,
        status: this.status,
        lastVisitDate: this.lastVisitDate,
        nextScheduledVisit: this.nextScheduledVisit,
        healthGoals: this.healthGoals,
        metadata: this.metadata,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

/**
 * Instance Method: Get dashboard data
 */
patientSchema.methods.getDashboardData = async function() {
    const fullProfile = await this.getFullProfile();
    
    return {
        summary: {
            name: `${fullProfile.demographics.firstName} ${fullProfile.demographics.lastName}`,
            age: fullProfile.demographics.age,
            bloodType: fullProfile.medicalInfo.bloodType,
            healthScore: fullProfile.healthData.score,
            riskLevel: fullProfile.healthData.riskLevel,
            bmi: fullProfile.medicalInfo.bmi,
            bmiCategory: fullProfile.medicalInfo.bmiCategory
        },
        quickStats: {
            activeMedications: fullProfile.statistics.activeMedications,
            upcomingAppointments: fullProfile.statistics.upcomingAppointments,
            unreadNotifications: fullProfile.statistics.unreadNotifications,
            outstandingBalance: fullProfile.billing.outstandingBalance
        },
        recentActivity: {
            lastVisit: fullProfile.lastVisitDate,
            lastHealthCheck: fullProfile.medicalInfo.lastHealthCheck,
            recentMetrics: fullProfile.healthData.metrics.slice(0, 5)
        },
        alerts: fullProfile.notifications.filter(n => !n.read && n.priority === 'high'),
        healthGoals: fullProfile.healthGoals.filter(g => g.status === 'in_progress')
    };
};

/**
 * Static Method: Find patients by primary care provider
 */
patientSchema.statics.findByPrimaryProvider = async function(providerId, options = {}) {
    const { limit = 50, page = 1, status = 'active' } = options;
    const skip = (page - 1) * limit;
    
    return await this.find({ 
        primaryCareProvider: providerId,
        status: status
    })
    .populate('user', 'firstName lastName email phoneNumber dateOfBirth gender avatar')
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
            { lastVisitDate: { $exists: false } },
            { 'medicalHistory.conditions': { $elemMatch: { status: 'active', nextFollowUp: { $lt: new Date() } } } }
        ]
    })
    .populate('user', 'firstName lastName email phoneNumber avatar')
    .populate('primaryCareProvider', 'firstName lastName specialization')
    .limit(limit)
    .skip(skip);
};

/**
 * Static Method: Search patients with advanced filters
 */
patientSchema.statics.searchPatients = async function(searchQuery, filters = {}, options = {}) {
    const { limit = 50, page = 1 } = options;
    const skip = (page - 1) * limit;
    
    const query = { status: 'active', ...filters };
    
    if (searchQuery) {
        query.$or = [
            { medicalRecordNumber: { $regex: searchQuery, $options: 'i' } },
            { 'user.firstName': { $regex: searchQuery, $options: 'i' } },
            { 'user.lastName': { $regex: searchQuery, $options: 'i' } },
            { 'user.email': { $regex: searchQuery, $options: 'i' } },
            { 'user.phoneNumber': { $regex: searchQuery, $options: 'i' } }
        ];
    }
    
    const patients = await this.find(query)
        .populate('user', 'firstName lastName email phoneNumber dateOfBirth gender avatar')
        .populate('primaryCareProvider', 'firstName lastName specialization')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    
    const total = await this.countDocuments(query);
    
    return {
        patients,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalPatients: total,
            hasNextPage: page * limit < total,
            hasPreviousPage: page > 1
        }
    };
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
                    byRiskLevel: [
                        { $group: { _id: '$metadata.riskLevel', count: { $sum: 1 } } }
                    ],
                    withChronicConditions: [
                        { $match: { 'medicalHistory.conditions': { $elemMatch: { status: { $in: ['active', 'chronic'] } } } } },
                        { $count: 'count' }
                    ],
                    withActiveAllergies: [
                        { $match: { 'allergies': { $elemMatch: { isActive: true } } } },
                        { $count: 'count' }
                    ],
                    withActiveMedications: [
                        { $match: { 'medications': { $elemMatch: { isActive: true } } } },
                        { $count: 'count' }
                    ],
                    recentPatients: [
                        { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
                        { $count: 'count' }
                    ],
                    healthScoreDistribution: [
                        {
                            $bucket: {
                                groupBy: "$metadata.healthScore",
                                boundaries: [0, 40, 60, 80, 100],
                                default: "Unknown",
                                output: {
                                    count: { $sum: 1 },
                                    avgScore: { $avg: "$metadata.healthScore" }
                                }
                            }
                        }
                    ],
                    ageDistribution: [
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'user',
                                foreignField: '_id',
                                as: 'userData'
                            }
                        },
                        { $unwind: '$userData' },
                        {
                            $bucket: {
                                groupBy: {
                                    $floor: {
                                        $divide: [
                                            { $subtract: [new Date(), '$userData.dateOfBirth'] },
                                            365 * 24 * 60 * 60 * 1000
                                        ]
                                    }
                                },
                                boundaries: [0, 18, 30, 45, 60, 75, 100],
                                default: "Unknown",
                                output: {
                                    count: { $sum: 1 }
                                }
                            }
                        }
                    ]
                }
            }
        ]);
        
        return stats[0] || {
            total: [{ count: 0 }],
            byStatus: [],
            byBloodType: [],
            byRiskLevel: [],
            withChronicConditions: [{ count: 0 }],
            withActiveAllergies: [{ count: 0 }],
            withActiveMedications: [{ count: 0 }],
            recentPatients: [{ count: 0 }],
            healthScoreDistribution: [],
            ageDistribution: []
        };
    } catch (error) {
        console.error('Error getting patient statistics:', error);
        return {
            total: [{ count: 0 }],
            byStatus: [],
            byBloodType: [],
            byRiskLevel: [],
            withChronicConditions: [{ count: 0 }],
            withActiveAllergies: [{ count: 0 }],
            withActiveMedications: [{ count: 0 }],
            recentPatients: [{ count: 0 }],
            healthScoreDistribution: [],
            ageDistribution: []
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
        
        // Calculate initial health score
        patient.metadata.healthScore = patient.calculateHealthScore();
        
        await patient.save();
        return patient;
    } catch (error) {
        console.error('Error creating patient from user:', error);
        throw error;
    }
};

/**
 * Static Method: Get patients with upcoming appointments
 */
patientSchema.statics.getPatientsWithUpcomingAppointments = async function(days = 7) {
    try {
        const Appointment = mongoose.model('Appointment');
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() + days);
        
        const upcomingAppointments = await Appointment.find({
            appointmentDate: { $gte: new Date(), $lte: cutoffDate },
            status: { $in: ['scheduled', 'confirmed'] }
        })
        .populate('patientId')
        .lean();
        
        // Group appointments by patient
        const patientsMap = new Map();
        upcomingAppointments.forEach(apt => {
            if (apt.patientId) {
                if (!patientsMap.has(apt.patientId._id.toString())) {
                    patientsMap.set(apt.patientId._id.toString(), {
                        patient: apt.patientId,
                        appointments: []
                    });
                }
                patientsMap.get(apt.patientId._id.toString()).appointments.push(apt);
            }
        });
        
        return Array.from(patientsMap.values());
    } catch (error) {
        console.error('Error getting patients with upcoming appointments:', error);
        return [];
    }
};

/**
 * Static Method: Bulk update patient status
 */
patientSchema.statics.bulkUpdateStatus = async function(patientIds, status) {
    try {
        const result = await this.updateMany(
            { _id: { $in: patientIds } },
            { $set: { status: status } }
        );
        
        return {
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount
        };
    } catch (error) {
        console.error('Error in bulk update status:', error);
        throw error;
    }
};

/**
 * Helper function: Calculate trend
 */
const calculateTrend = (metrics, field) => {
    if (!metrics || metrics.length < 2) return 'stable';
    
    const values = metrics.map(m => {
        const keys = field.split('.');
        let value = m;
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return null;
            }
        }
        return value;
    }).filter(v => v !== null);
    
    if (values.length < 2) return 'stable';
    
    const first = values[0];
    const last = values[values.length - 1];
    const change = ((last - first) / first) * 100;
    
    if (Math.abs(change) < 5) return 'stable';
    return change > 0 ? 'increasing' : 'decreasing';
};

/**
 * Helper function: Calculate average
 */
const calculateAverage = (metrics, fieldOrFn) => {
    if (!metrics || metrics.length === 0) return null;
    
    const values = metrics.map(m => {
        if (typeof fieldOrFn === 'function') {
            return fieldOrFn(m);
        } else {
            const keys = fieldOrFn.split('.');
            let value = m;
            for (const key of keys) {
                if (value && typeof value === 'object' && key in value) {
                    value = value[key];
                } else {
                    return null;
                }
            }
            return value;
        }
    }).filter(v => v !== null);
    
    if (values.length === 0) return null;
    
    const sum = values.reduce((a, b) => a + b, 0);
    return Math.round((sum / values.length) * 10) / 10;
};

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
 *         isActive: true,
 *         diagnosedBy: doctorId
 *     }],
 *     emergencyContacts: [{
 *         name: 'Jane Doe',
 *         relationship: 'Spouse',
 *         phone: '+1234567890',
 *         isPrimary: true,
 *         canMakeMedicalDecisions: true
 *     }],
 *     medicalHistory: {
 *         conditions: [{
 *             name: 'Hypertension',
 *             status: 'chronic',
 *             diagnosisDate: new Date('2020-01-15'),
 *             severity: 'moderate'
 *         }],
 *         lifestyle: {
 *             smoking: { status: 'never' },
 *             alcohol: { status: 'occasional' },
 *             exercise: { frequency: 'weekly', durationMinutes: 30 },
 *             diet: { type: 'regular' },
 *             sleep: { hoursPerNight: 7, quality: 'good' }
 *         }
 *     },
 *     preferences: {
 *         notifications: {
 *             email: { appointmentReminders: true, labResults: true },
 *             sms: { appointmentReminders: true, emergencyAlerts: true }
 *         }
 *     }
 * });
 * 
 * // Get full patient profile
 * const fullProfile = await patient.getFullProfile();
 * 
 * // Add health metric
 * await patient.addHealthMetric({
 *     heartRate: { value: 72, unit: 'bpm' },
 *     bloodPressure: { systolic: 120, diastolic: 80, unit: 'mmHg' },
 *     bloodSugar: { value: 98, unit: 'mg/dL' },
 *     temperature: { value: 36.6, unit: '°C' },
 *     measuredBy: 'patient'
 * });
 * 
 * // Add notification
 * await patient.addNotification({
 *     type: 'appointment',
 *     title: 'Appointment Reminder',
 *     message: 'You have an appointment tomorrow at 2:00 PM',
 *     priority: 'medium',
 *     actionUrl: '/appointments/123'
 * });
 * 
 * // Get dashboard data
 * const dashboardData = await patient.getDashboardData();
 * 
 * // Find patients needing follow-up
 * const patientsNeedingFollowUp = await Patient.findNeedingFollowUp(90);
 * 
 * // Search patients with filters
 * const searchResults = await Patient.searchPatients(
 *     'John',
 *     { bloodType: 'O+', 'metadata.riskLevel': 'low' },
 *     { page: 1, limit: 20 }
 * );
 * 
 * // Get statistics
 * const stats = await Patient.getStatistics();
 * 
 * // Get patients with upcoming appointments
 * const upcomingPatients = await Patient.getPatientsWithUpcomingAppointments(7);
 */