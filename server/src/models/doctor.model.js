/**
 * Healthcare System - Doctor Model
 * 
 * Comprehensive doctor profile model extending user data with
 * professional medical information, qualifications, and availability.
 */

import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const doctorSchema = new Schema(
    {
        // Reference to User model
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User reference is required'],
            unique: true,
            index: true
        },
        
        // Professional Information
        medicalLicenseNumber: {
            type: String,
            required: [true, 'Medical license number is required'],
            unique: true,
            trim: true,
            uppercase: true,
            index: true
        },
        
        // Specializations and Expertise
        specializations: [{
            type: String,
            required: true,
            trim: true
        }],
        
        // Professional Qualifications
        qualifications: [{
            degree: {
                type: String,
                required: true,
                trim: true
            },
            institution: {
                type: String,
                required: true,
                trim: true
            },
            year: {
                type: Number,
                required: true,
                min: 1950,
                max: new Date().getFullYear()
            },
            country: {
                type: String,
                trim: true
            },
            certificateUrl: String // Cloudinary URL
        }],
        
        // Professional Experience
        experience: {
            totalYears: {
                type: Number,
                required: true,
                min: 0,
                max: 60
            },
            workHistory: [{
                hospital: {
                    type: String,
                    required: true,
                    trim: true
                },
                position: {
                    type: String,
                    required: true,
                    trim: true
                },
                startDate: {
                    type: Date,
                    required: true
                },
                endDate: Date,
                current: {
                    type: Boolean,
                    default: false
                },
                description: String
            }]
        },
        
        // Consultation Information
        consultationFee: {
            type: Number,
            required: [true, 'Consultation fee is required'],
            min: 0
        },
        followUpFee: {
            type: Number,
            min: 0,
            default: 0
        },
        currency: {
            type: String,
            default: 'INR'
        },
        
        // Working Schedule
        schedule: [{
            dayOfWeek: {
                type: Number,
                required: true,
                min: 0, // Sunday
                max: 6  // Saturday
            },
            startTime: {
                type: String,
                required: true,
                match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
            },
            endTime: {
                type: String,
                required: true,
                match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
            },
            appointmentDuration: {
                type: Number,
                default: 30, // minutes
                min: 15,
                max: 120
            },
            maxPatients: {
                type: Number,
                default: 10,
                min: 1
            }
        }],
        
        // Availability for specific dates (overrides schedule)
        availability: [{
            date: {
                type: Date,
                required: true
            },
            slots: [{
                startTime: String,
                endTime: String,
                isBooked: {
                    type: Boolean,
                    default: false
                },
                appointmentId: {
                    type: Schema.Types.ObjectId,
                    ref: 'Appointment'
                }
            }]
        }],
        
        // Languages Spoken
        languages: [{
            type: String,
            trim: true
        }],
        
        // Professional Ratings and Reviews
        ratings: {
            average: {
                type: Number,
                default: 0,
                min: 0,
                max: 5
            },
            count: {
                type: Number,
                default: 0
            },
            totalPoints: {
                type: Number,
                default: 0
            }
        },
        
        reviews: [{
            patientId: {
                type: Schema.Types.ObjectId,
                ref: 'Patient',
                required: true
            },
            rating: {
                type: Number,
                required: true,
                min: 1,
                max: 5
            },
            comment: {
                type: String,
                trim: true,
                maxlength: 1000
            },
            appointmentId: {
                type: Schema.Types.ObjectId,
                ref: 'Appointment'
            },
            isVerified: {
                type: Boolean,
                default: false
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }],
        
        // Professional Documents
        documents: {
            medicalLicense: {
                url: String,
                expiryDate: Date,
                verified: {
                    type: Boolean,
                    default: false
                }
            },
            identityProof: {
                url: String,
                verified: {
                    type: Boolean,
                    default: false
                }
            },
            degreeCertificates: [{
                name: String,
                url: String,
                verified: {
                    type: Boolean,
                    default: false
                }
            }]
        },
        
        // Hospital/Clinic Affiliation
        affiliations: [{
            hospitalName: {
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
            position: String,
            isPrimary: {
                type: Boolean,
                default: false
            }
        }],
        
        // Consultation Types Offered
        consultationTypes: [{
            type: String,
            enum: ['in-person', 'video', 'phone', 'chat'],
            default: 'in-person'
        }],
        
        // Professional Bio
        bio: {
            type: String,
            trim: true,
            maxlength: 2000
        },
        
        // Awards and Achievements
        awards: [{
            title: {
                type: String,
                required: true,
                trim: true
            },
            year: Number,
            organization: String,
            description: String
        }],
        
        // Publications and Research
        publications: [{
            title: {
                type: String,
                required: true,
                trim: true
            },
            journal: String,
            year: Number,
            url: String,
            description: String
        }],
        
        // Statistics
        stats: {
            totalConsultations: {
                type: Number,
                default: 0
            },
            totalPatients: {
                type: Number,
                default: 0
            },
            successRate: {
                type: Number,
                default: 0,
                min: 0,
                max: 100
            }
        },
        
        // Verification Status
        isVerified: {
            type: Boolean,
            default: false,
            index: true
        },
        verificationStatus: {
            type: String,
            enum: ['pending', 'verified', 'rejected', 'suspended'],
            default: 'pending'
        },
        
        // Status
        status: {
            type: String,
            enum: ['active', 'inactive', 'on-leave', 'suspended'],
            default: 'active',
            index: true
        },
        
        // Metadata
        metadata: {
            profileCompletion: {
                type: Number,
                default: 0,
                min: 0,
                max: 100
            },
            lastActive: Date,
            joinDate: {
                type: Date,
                default: Date.now
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
doctorSchema.index({ userId: 1 });
doctorSchema.index({ specializations: 1 });
doctorSchema.index({ 'affiliations.hospitalName': 1 });
doctorSchema.index({ status: 1, isVerified: 1 });
doctorSchema.index({ consultationFee: 1 });
doctorSchema.index({ 'ratings.average': -1 });

/**
 * Add aggregation pagination plugin
 */
doctorSchema.plugin(mongooseAggregatePaginate);

/**
 * Virtual: Full Name (from User reference)
 */
doctorSchema.virtual('fullName').get(function() {
    if (!this.userId) return null;
    return `${this.userId.firstName} ${this.userId.lastName}`;
});

/**
 * Virtual: Years of Experience
 */
doctorSchema.virtual('experienceYears').get(function() {
    return this.experience?.totalYears || 0;
});

/**
 * Virtual: Is Available Today
 */
doctorSchema.virtual('isAvailableToday').get(function() {
    const today = new Date().getDay();
    return this.schedule?.some(slot => slot.dayOfWeek === today) || false;
});

/**
 * Virtual: Next Available Slot
 */
doctorSchema.virtual('nextAvailableSlot').get(function() {
    // Implementation would calculate next available appointment slot
    return null; // Placeholder
});

/**
 * Pre-save middleware: Calculate average rating
 */
doctorSchema.pre('save', function(next) {
    if (this.reviews && this.reviews.length > 0) {
        const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
        this.ratings.average = Math.round((totalRating / this.reviews.length) * 10) / 10;
        this.ratings.count = this.reviews.length;
        this.ratings.totalPoints = totalRating;
    }
    next();
});

/**
 * Instance Method: Add review
 */
doctorSchema.methods.addReview = async function(reviewData) {
    this.reviews.push(reviewData);
    return await this.save();
};

/**
 * Instance Method: Update schedule
 */
doctorSchema.methods.updateSchedule = async function(scheduleData) {
    this.schedule = scheduleData;
    return await this.save();
};

/**
 * Instance Method: Check availability for date/time
 */
doctorSchema.methods.isAvailable = function(date, time) {
    const dayOfWeek = date.getDay();
    const schedule = this.schedule.find(s => s.dayOfWeek === dayOfWeek);
    
    if (!schedule) return false;
    
    // Check if time falls within working hours
    const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
    const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
    
    const [checkHour, checkMinute] = time.split(':').map(Number);
    const checkTime = checkHour * 60 + checkMinute;
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    
    return checkTime >= startTime && checkTime <= endTime;
};

/**
 * Instance Method: Get complete doctor profile
 */
doctorSchema.methods.getFullProfile = async function() {
    await this.populate('userId', 'firstName lastName email phoneNumber avatar');
    
    return {
        ...this.toObject(),
        fullName: this.fullName,
        email: this.userId?.email,
        phoneNumber: this.userId?.phoneNumber,
        avatar: this.userId?.avatar
    };
};

/**
 * Static Method: Find doctors by specialization
 */
doctorSchema.statics.findBySpecialization = async function(specialization) {
    return await this.find({
        specializations: { $in: [specialization] },
        status: 'active',
        isVerified: true
    })
    .populate('userId', 'firstName lastName avatar')
    .sort({ 'ratings.average': -1, experience: -1 });
};

/**
 * Static Method: Search doctors
 */
doctorSchema.statics.searchDoctors = async function(searchQuery, filters = {}) {
    const query = {
        status: 'active',
        isVerified: true,
        ...filters
    };
    
    if (searchQuery) {
        query.$or = [
            { specializations: { $regex: searchQuery, $options: 'i' } },
            { bio: { $regex: searchQuery, $options: 'i' } }
        ];
    }
    
    return await this.find(query)
        .populate('userId', 'firstName lastName avatar email phoneNumber')
        .sort({ 'ratings.average': -1, experience: -1 })
        .limit(50);
};

/**
 * Static Method: Get top rated doctors
 */
doctorSchema.statics.getTopRated = async function(limit = 10) {
    return await this.find({
        status: 'active',
        isVerified: true,
        'ratings.count': { $gte: 5 }
    })
    .populate('userId', 'firstName lastName avatar')
    .sort({ 'ratings.average': -1, 'ratings.count': -1 })
    .limit(limit);
};

/**
 * Enable virtuals in JSON output
 */
doctorSchema.set('toJSON', { virtuals: true });
doctorSchema.set('toObject', { virtuals: true });

export const Doctor = mongoose.model("Doctor", doctorSchema);