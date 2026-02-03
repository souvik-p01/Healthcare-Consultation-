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
        },
        
        // Professional Information
        medicalLicenseNumber: {
            type: String,
            required: [true, 'Medical license number is required'],
            unique: true,
            trim: true,
            uppercase: true,
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
            default: 'INR',
            enum: ['INR', 'USD', 'EUR', 'GBP']
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
                max: 5,
                set: v => Math.round(v * 10) / 10 // Round to 1 decimal
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
                zipCode: String,
                country: String
            },
            phoneNumber: String,
            position: String,
            isPrimary: {
                type: Boolean,
                default: false
            },
            startDate: Date,
            endDate: Date,
            current: {
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
            description: String,
            certificateUrl: String
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
            description: String,
            doi: String
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
            },
            avgRating: {
                type: Number,
                default: 0,
                min: 0,
                max: 5
            },
            monthlyEarnings: {
                type: Number,
                default: 0
            },
            yearlyEarnings: {
                type: Number,
                default: 0
            }
        },
        
        // Contact Information
        officePhone: {
            type: String,
            trim: true
        },
        emergencyContact: {
            type: String,
            trim: true
        },
        
        // Availability Status
        isAvailable: {
            type: Boolean,
            default: true
        },
        unavailableUntil: Date,
        unavailabilityReason: String,
        
        // Working Hours (for quick reference)
        workingHours: {
            type: String,
            default: '9:00 AM - 5:00 PM'
        },
        availableDays: [{
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        }],
        breakTimes: [{
            startTime: String,
            endTime: String,
            description: String
        }],
        
        // Verification Status
        isVerified: {
            type: Boolean,
            default: false,
        },
        verificationStatus: {
            type: String,
            enum: ['pending', 'verified', 'rejected', 'suspended'],
            default: 'pending'
        },
        verificationDate: Date,
        verifiedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        
        // Status
        status: {
            type: String,
            enum: ['active', 'inactive', 'on-leave', 'suspended', 'retired'],
            default: 'active',
        },
        
        // Profile Settings
        settings: {
            allowOnlineBooking: {
                type: Boolean,
                default: true
            },
            allowTeleconsultation: {
                type: Boolean,
                default: true
            },
            appointmentBufferTime: {
                type: Number,
                default: 15, // minutes between appointments
                min: 0,
                max: 60
            },
            autoConfirmAppointments: {
                type: Boolean,
                default: false
            },
            notificationPreferences: {
                email: {
                    type: Boolean,
                    default: true
                },
                sms: {
                    type: Boolean,
                    default: true
                },
                push: {
                    type: Boolean,
                    default: true
                }
            }
        },
        
        // Payment Information
        paymentMethods: [{
            type: {
                type: String,
                enum: ['bank_transfer', 'upi', 'credit_card', 'debit_card', 'paypal']
            },
            details: Schema.Types.Mixed,
            isDefault: {
                type: Boolean,
                default: false
            }
        }],
        
        // Social Media & Professional Links
        socialLinks: {
            website: String,
            linkedin: String,
            twitter: String,
            facebook: String,
            instagram: String
        },
        
        // Treatment Approach
        treatmentApproach: {
            type: String,
            trim: true,
            maxlength: 1000
        },
        
        // Services Offered
        servicesOffered: [{
            type: String,
            trim: true
        }],
        
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
            },
            lastProfileUpdate: Date,
            totalLoginCount: {
                type: Number,
                default: 0
            },
            lastLogin: Date
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
doctorSchema.index({ userId: 1 });
doctorSchema.index({ medicalLicenseNumber: 1 });
doctorSchema.index({ specializations: 1 });
doctorSchema.index({ 'affiliations.hospitalName': 1 });
doctorSchema.index({ status: 1, isVerified: 1 });
doctorSchema.index({ consultationFee: 1 });
doctorSchema.index({ 'ratings.average': -1 });
doctorSchema.index({ 'stats.totalConsultations': -1 });
doctorSchema.index({ 'experience.totalYears': -1 });
doctorSchema.index({ isAvailable: 1 });

/**
 * Add aggregation pagination plugin
 */
doctorSchema.plugin(mongooseAggregatePaginate);

/**
 * Virtual: Full Name (from User reference)
 */
doctorSchema.virtual('fullName').get(function() {
    if (this.populated('userId')) {
        return `${this.userId.firstName} ${this.userId.lastName}`;
    }
    return null;
});

/**
 * Virtual: Email (from User reference)
 */
doctorSchema.virtual('email').get(function() {
    if (this.populated('userId')) {
        return this.userId.email;
    }
    return null;
});

/**
 * Virtual: Phone Number (from User reference)
 */
doctorSchema.virtual('phoneNumber').get(function() {
    if (this.populated('userId')) {
        return this.userId.phoneNumber;
    }
    return null;
});

/**
 * Virtual: Avatar (from User reference)
 */
doctorSchema.virtual('avatar').get(function() {
    if (this.populated('userId')) {
        return this.userId.avatar;
    }
    return null;
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
    if (!this.isAvailable) return false;
    
    if (this.unavailableUntil && new Date() < this.unavailableUntil) {
        return false;
    }
    
    const today = new Date().getDay();
    return this.schedule?.some(slot => slot.dayOfWeek === today) || false;
});

/**
 * Virtual: Next Available Slot
 */
doctorSchema.virtual('nextAvailableSlot').get(function() {
    if (!this.isAvailableToday) return null;
    
    const today = new Date();
    const currentTime = today.getHours() * 60 + today.getMinutes();
    
    for (const slot of this.schedule || []) {
        if (slot.dayOfWeek === today.getDay()) {
            const [startHour, startMinute] = slot.startTime.split(':').map(Number);
            const slotStartTime = startHour * 60 + startMinute;
            
            if (currentTime < slotStartTime) {
                return {
                    day: this.getDayName(slot.dayOfWeek),
                    time: slot.startTime,
                    duration: slot.appointmentDuration
                };
            }
        }
    }
    
    return null;
});

/**
 * Virtual: Total Earnings
 */
doctorSchema.virtual('totalEarnings').get(function() {
    return this.stats?.yearlyEarnings || 0;
});

/**
 * Virtual: Profile Completion Percentage
 */
doctorSchema.virtual('profileCompletionPercentage').get(function() {
    let completion = 0;
    const totalFields = 10;
    
    if (this.medicalLicenseNumber) completion++;
    if (this.specializations && this.specializations.length > 0) completion++;
    if (this.qualifications && this.qualifications.length > 0) completion++;
    if (this.experience && this.experience.totalYears > 0) completion++;
    if (this.consultationFee) completion++;
    if (this.schedule && this.schedule.length > 0) completion++;
    if (this.bio && this.bio.length > 50) completion++;
    if (this.affiliations && this.affiliations.length > 0) completion++;
    if (this.documents && this.documents.medicalLicense?.url) completion++;
    if (this.avatar) completion++;
    
    return Math.round((completion / totalFields) * 100);
});

/**
 * Pre-save middleware: Calculate average rating and update stats
 */
doctorSchema.pre('save', function(next) {
    // Calculate average rating
    if (this.reviews && this.reviews.length > 0) {
        const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
        this.ratings.average = Math.round((totalRating / this.reviews.length) * 10) / 10;
        this.ratings.count = this.reviews.length;
        this.ratings.totalPoints = totalRating;
    }
    
    // Update profile completion
    this.metadata.profileCompletion = this.profileCompletionPercentage;
    
    // Update last profile update timestamp
    if (this.isModified()) {
        this.metadata.lastProfileUpdate = new Date();
    }
    
    next();
});

/**
 * Pre-find middleware: Populate user data for common queries
 */
doctorSchema.pre(/^find/, function(next) {
    if (this.options.populateUser !== false) {
        this.populate({
            path: 'userId',
            select: 'firstName lastName email phoneNumber avatar dateOfBirth gender'
        });
    }
    next();
});

/**
 * Instance Method: Add review
 */
doctorSchema.methods.addReview = async function(reviewData) {
    this.reviews.push(reviewData);
    await this.save();
    return this;
};

/**
 * Instance Method: Update schedule
 */
doctorSchema.methods.updateSchedule = async function(scheduleData) {
    this.schedule = scheduleData;
    await this.save();
    return this;
};

/**
 * Instance Method: Check availability for date/time
 */
doctorSchema.methods.isAvailableForAppointment = function(date, time) {
    // Check if doctor is generally available
    if (!this.isAvailable) return false;
    
    // Check if doctor is on leave/unavailable until specific date
    if (this.unavailableUntil && new Date(date) < this.unavailableUntil) {
        return false;
    }
    
    const dayOfWeek = new Date(date).getDay();
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
 * Instance Method: Get available slots for a date
 */
doctorSchema.methods.getAvailableSlots = function(date) {
    const dayOfWeek = new Date(date).getDay();
    const schedule = this.schedule.find(s => s.dayOfWeek === dayOfWeek);
    
    if (!schedule) return [];
    
    const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
    const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
    const duration = schedule.appointmentDuration;
    
    const slots = [];
    let currentTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    
    while (currentTime + duration <= endTime) {
        const slotStartHour = Math.floor(currentTime / 60);
        const slotStartMinute = currentTime % 60;
        const slotEndTime = currentTime + duration;
        const slotEndHour = Math.floor(slotEndTime / 60);
        const slotEndMinute = slotEndTime % 60;
        
        const slotTime = {
            start: `${String(slotStartHour).padStart(2, '0')}:${String(slotStartMinute).padStart(2, '0')}`,
            end: `${String(slotEndHour).padStart(2, '0')}:${String(slotEndMinute).padStart(2, '0')}`,
            available: true
        };
        
        // Check if slot is booked in availability
        const specificAvailability = this.availability?.find(a => 
            new Date(a.date).toDateString() === new Date(date).toDateString()
        );
        
        if (specificAvailability) {
            const isBooked = specificAvailability.slots.some(slot =>
                slot.startTime === slotTime.start && slot.isBooked
            );
            slotTime.available = !isBooked;
        }
        
        slots.push(slotTime);
        currentTime += duration + (this.settings?.appointmentBufferTime || 15);
    }
    
    return slots;
};

/**
 * Instance Method: Get complete doctor profile with user data
 */
doctorSchema.methods.getFullProfile = async function() {
    await this.populate('userId', 'firstName lastName email phoneNumber avatar dateOfBirth gender address');
    
    return {
        ...this.toObject(),
        fullName: this.fullName,
        email: this.email,
        phoneNumber: this.phoneNumber,
        avatar: this.avatar,
        name: this.fullName // Alias for frontend compatibility
    };
};

/**
 * Instance Method: Update statistics
 */
doctorSchema.methods.updateStatistics = async function(appointmentData) {
    this.stats.totalConsultations += 1;
    
    if (appointmentData.consultationFee) {
        this.stats.monthlyEarnings += appointmentData.consultationFee;
        this.stats.yearlyEarnings += appointmentData.consultationFee;
    }
    
    // Update patient count if new patient
    // This would require checking if this is the patient's first appointment
    
    await this.save();
    return this;
};

/**
 * Static Method: Find doctors by specialization
 */
doctorSchema.statics.findBySpecialization = async function(specialization, options = {}) {
    const query = {
        specializations: { $in: [new RegExp(specialization, 'i')] },
        status: 'active',
        isVerified: true
    };
    
    return await this.find(query)
        .populate('userId', 'firstName lastName avatar')
        .sort({ 'ratings.average': -1, 'experience.totalYears': -1 })
        .limit(options.limit || 50);
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
            { bio: { $regex: searchQuery, $options: 'i' } },
            { 'affiliations.hospitalName': { $regex: searchQuery, $options: 'i' } }
        ];
    }
    
    return await this.find(query)
        .populate('userId', 'firstName lastName avatar email phoneNumber')
        .sort({ 'ratings.average': -1, 'experience.totalYears': -1 })
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
 * Static Method: Get available doctors for timeslot
 */
doctorSchema.statics.getAvailableDoctors = async function(date, time, specialization = null) {
    const dayOfWeek = new Date(date).getDay();
    const [hour, minute] = time.split(':').map(Number);
    const queryTime = hour * 60 + minute;
    
    const query = {
        status: 'active',
        isVerified: true,
        isAvailable: true,
        schedule: {
            $elemMatch: {
                dayOfWeek: dayOfWeek,
                $expr: {
                    $and: [
                        {
                            $lte: [
                                {
                                    $add: [
                                        { $multiply: [{ $toInt: { $arrayElemAt: [{ $split: ["$startTime", ":"] }, 0] } }, 60] },
                                        { $toInt: { $arrayElemAt: [{ $split: ["$startTime", ":"] }, 1] } }
                                    ]
                                },
                                queryTime
                            ]
                        },
                        {
                            $gte: [
                                {
                                    $add: [
                                        { $multiply: [{ $toInt: { $arrayElemAt: [{ $split: ["$endTime", ":"] }, 0] } }, 60] },
                                        { $toInt: { $arrayElemAt: [{ $split: ["$endTime", ":"] }, 1] } }
                                    ]
                                },
                                queryTime
                            ]
                        }
                    ]
                }
            }
        }
    };
    
    if (specialization) {
        query.specializations = { $in: [new RegExp(specialization, 'i')] };
    }
    
    return await this.find(query)
        .populate('userId', 'firstName lastName avatar')
        .limit(20);
};

/**
 * Helper Method: Get day name from day number
 */
doctorSchema.methods.getDayName = function(dayOfWeek) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek] || 'Unknown';
};

export const Doctor = mongoose.model("Doctor", doctorSchema);