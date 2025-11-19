/**
 * Healthcare System - User Model
 * 
 * Multi-role user model for healthcare consultation system.
 * Handles authentication, authorization, and profile management for:
 * - Patients
 * - Doctors (Providers)
 * - Admins
 * - Nurses
 * - Support Staff
 * 
 * Features:
 * - JWT token generation (access & refresh tokens)
 * - Password encryption with bcrypt
 * - Email and phone verification
 * - Role-based permissions
 * - Profile management
 * - HIPAA-compliant data handling
 */

import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const userSchema = new Schema(
    {
        // Basic Information
        firstName: {
            type: String,
            required: [true, "First name is required"],
            trim: true,
            maxlength: [50, "First name cannot exceed 50 characters"]
        },
        lastName: {
            type: String,
            required: [true, "Last name is required"],
            trim: true,
            maxlength: [50, "Last name cannot exceed 50 characters"]
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
            //index: true
        },
        phoneNumber: {
            type: String,
            required: [true, "Phone number is required"],
            trim: true,
            match: [/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/, "Please enter a valid phone number"],
            //index: true
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [8, "Password must be at least 8 characters"],
            select: false
        },
        
        // User Role and Status
        role: {
            type: String,
            enum: {
                values: ['patient', 'doctor', 'admin', 'nurse', 'staff'],
                message: '{VALUE} is not a valid role'
            },
            default: 'patient',
            required: true,
            //index: true
        },
        isActive: {
            type: Boolean,
            default: true,
            //index: true
        },
        isEmailVerified: {
            type: Boolean,
            default: false
        },
        isPhoneVerified: {
            type: Boolean,
            default: false
        },
        
        // Profile Information
        avatar: {
            type: String,
            default: null
        },
        dateOfBirth: {
            type: Date,
            required: function() {
                return this.role === 'patient';
            },
            validate: {
                validator: function(date) {
                    if (!date) return this.role !== 'patient';
                    return date < new Date();
                },
                message: 'Date of birth must be in the past'
            }
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'other', 'prefer-not-to-say'],
            required: function() {
                return this.role === 'patient';
            }
        },
        
        // Address Information
        address: {
            street: { type: String, trim: true },
            city: { type: String, trim: true },
            state: { type: String, trim: true },
            zipCode: { type: String, trim: true },
            country: { type: String, trim: true, default: 'India' }
        },
        
        // Professional Information (for healthcare providers)
        specialization: {
            type: String,
            trim: true,
            required: function() {
                return this.role === 'doctor';
            }
        },
        medicalLicense: {
            type: String,
            trim: true,
            unique: true,
            sparse: true,
            required: function() {
                return this.role === 'doctor';
            },
            //index: true
        },
        qualification: {
            type: String,
            trim: true,
            required: function() {
                return this.role === 'doctor';
            }
        },
        experience: {
            type: Number,
            min: 0,
            default: 0
        },
        department: {
            type: String,
            trim: true,
            required: function() {
                return ['doctor', 'nurse'].includes(this.role);
            }
        },
        
        // Consultation Fee (for doctors)
        consultationFee: {
            type: Number,
            min: 0,
            default: 0
        },
        
        // Permissions and Access Control
        permissions: {
            type: [String],
            default: function() {
                switch(this.role) {
                    case 'patient':
                        return ['view-own-records', 'book-appointments'];
                    case 'doctor':
                        return ['view-patient-records', 'create-prescriptions', 'manage-appointments'];
                    case 'nurse':
                        return ['view-patient-records', 'update-vital-signs'];
                    case 'admin':
                        return ['manage-all'];
                    default:
                        return [];
                }
            }
        },
        
        // Authentication Tokens
        refreshToken: {
            type: String,
            select: false
        },
        
        // Verification Codes
        emailVerificationToken: {
            type: String,
            select: false
        },
        emailVerificationExpires: {
            type: Date,
            select: false
        },
        phoneVerificationCode: {
            type: String,
            select: false
        },
        phoneVerificationExpires: {
            type: Date,
            select: false
        },
        
        // Password Reset
        passwordResetToken: {
            type: String,
            select: false
        },
        passwordResetExpires: {
            type: Date,
            select: false
        },
        
        // Account Security
        lastLogin: {
            type: Date
        },
        failedLoginAttempts: {
            type: Number,
            default: 0
        },
        accountLockedUntil: {
            type: Date
        },
        lastPasswordChange: {
            type: Date,
            default: Date.now
        },
        
        // References
        patientId: {
            type: Schema.Types.ObjectId,
            ref: 'Patient'
        },
        doctorId: {
            type: Schema.Types.ObjectId,
            ref: 'Doctor'
        },
        
        // Metadata
        loginCount: { 
            type: Number, 
            default: 0 
        },
        lastVerificationEmailSent: {
            type: Date
        },
        lastPasswordResetRequest: {
            type: Date
        }
    },
    { 
        timestamps: true
    }
);

/**
 * Indexes for optimized queries
 * Only define indexes here, not in schema fields
 */
userSchema.index({ email: 1, role: 1 });
userSchema.index({ phoneNumber: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ specialization: 1 });
userSchema.index({ department: 1 });
userSchema.index({ 'address.city': 1, 'address.state': 1 });
userSchema.index({ createdAt: -1 });

/**
 * Virtual field: Full Name
 */
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`.trim();
});

/**
 * Virtual field: Age
 */
userSchema.virtual('age').get(function() {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
});

/**
 * Virtual field: Is Account Locked
 */
userSchema.virtual('isLocked').get(function() {
    return !!(this.accountLockedUntil && this.accountLockedUntil > Date.now());
});

/**
 * Pre-save middleware: Hash password
 */
userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        this.lastPasswordChange = new Date();
        next();
    } catch (error) {
        next(error);
    }
});

/**
 * Pre-save middleware: Validate role-specific fields
 */
userSchema.pre("save", function(next) {
    // Validate patient-specific fields
    if (this.role === 'patient') {
        if (!this.dateOfBirth) {
            return next(new Error('Date of birth is required for patients'));
        }
        if (!this.gender) {
            return next(new Error('Gender is required for patients'));
        }
    }
    
    // Validate doctor-specific fields
    if (this.role === 'doctor') {
        if (!this.specialization) {
            return next(new Error('Specialization is required for doctors'));
        }
        if (!this.medicalLicense) {
            return next(new Error('Medical license is required for doctors'));
        }
        if (!this.qualification) {
            return next(new Error('Qualification is required for doctors'));
        }
    }
    
    next();
});

/**
 * Instance Method: Compare password
 */
userSchema.methods.isPasswordCorrect = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

/**
 * Instance Method: Generate Access Token
 */
userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            role: this.role,
            permissions: this.permissions
        },
        process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '24h'
        }
    );
};

/**
 * Instance Method: Generate Refresh Token
 */
userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET || process.env.JWT_REFRESH_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d'
        }
    );
};

/**
 * Instance Method: Increment login count
 */
userSchema.methods.incrementLoginCount = async function() {
    this.loginCount += 1;
    this.lastLogin = new Date();
    this.failedLoginAttempts = 0;
    return await this.save({ validateBeforeSave: false });
};

/**
 * Instance Method: Record failed login
 */
userSchema.methods.recordFailedLogin = async function() {
    this.failedLoginAttempts += 1;
    
    // Lock account after 5 failed attempts for 15 minutes
    if (this.failedLoginAttempts >= 5) {
        this.accountLockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    }
    
    return await this.save({ validateBeforeSave: false });
};

/**
 * Instance Method: Reset failed login attempts
 */
userSchema.methods.resetFailedLogins = async function() {
    this.failedLoginAttempts = 0;
    this.accountLockedUntil = null;
    return await this.save({ validateBeforeSave: false });
};

/**
 * Instance Method: Check permission
 */
userSchema.methods.hasPermission = function(permission) {
    if (this.role === 'admin') return true;
    return this.permissions.includes(permission);
};

/**
 * Instance Method: Generate email verification token
 */
userSchema.methods.generateEmailVerificationToken = function() {
    const token = jwt.sign(
        { 
            userId: this._id,
            email: this.email 
        },
        process.env.JWT_SECRET || process.env.ACCESS_TOKEN_SECRET,
        { 
            expiresIn: '24h' 
        }
    );
    
    this.emailVerificationToken = token;
    this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    return token;
};

/**
 * Instance Method: Generate password reset token
 */
userSchema.methods.generatePasswordResetToken = function() {
    const token = jwt.sign(
        { 
            userId: this._id 
        },
        process.env.JWT_SECRET || process.env.ACCESS_TOKEN_SECRET,
        { 
            expiresIn: '30m' // 30 minutes
        }
    );
    
    this.passwordResetToken = token;
    this.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    
    return token;
};

/**
 * Instance Method: Verify email
 */
userSchema.methods.verifyEmail = async function() {
    this.isEmailVerified = true;
    this.emailVerificationToken = undefined;
    this.emailVerificationExpires = undefined;
    return await this.save({ validateBeforeSave: false });
};

/**
 * Instance Method: Sanitize user data for response
 */
userSchema.methods.toSafeObject = function() {
    const userObject = this.toObject();
    
    // Remove sensitive fields
    delete userObject.password;
    delete userObject.refreshToken;
    delete userObject.emailVerificationToken;
    delete userObject.emailVerificationExpires;
    delete userObject.phoneVerificationCode;
    delete userObject.phoneVerificationExpires;
    delete userObject.passwordResetToken;
    delete userObject.passwordResetExpires;
    delete userObject.__v;
    
    // Add virtual fields
    userObject.fullName = this.fullName;
    userObject.age = this.age;
    userObject.isLocked = this.isLocked;
    
    return userObject;
};

/**
 * Remove sensitive fields from JSON output
 */
userSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    delete user.refreshToken;
    delete user.emailVerificationToken;
    delete user.phoneVerificationCode;
    delete user.passwordResetToken;
    return user;
};

/**
 * Static Method: Find by email or phone
 */
userSchema.statics.findByEmailOrPhone = async function(identifier) {
    return await this.findOne({
        $or: [
            { email: identifier.toLowerCase() },
            { phoneNumber: identifier }
        ]
    }).select('+password +refreshToken');
};

/**
 * Static Method: Find active doctors
 */
userSchema.statics.findActiveDoctors = async function(filters = {}) {
    const query = {
        role: 'doctor',
        isActive: true,
        ...filters
    };
    
    return await this.find(query)
        .select('-password -refreshToken')
        .sort({ experience: -1, createdAt: -1 });
};

/**
 * Static Method: Find by verification token
 */
userSchema.statics.findByVerificationToken = async function(token) {
    return await this.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: Date.now() }
    });
};

/**
 * Static Method: Find by password reset token
 */
userSchema.statics.findByPasswordResetToken = async function(token) {
    return await this.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: Date.now() }
    });
};

/**
 * Ensure virtual fields are included in JSON output
 */
userSchema.set('toJSON', { 
    virtuals: true,
    transform: function(doc, ret) {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.emailVerificationToken;
        delete ret.phoneVerificationCode;
        delete ret.passwordResetToken;
        return ret;
    }
});

userSchema.set('toObject', { 
    virtuals: true,
    transform: function(doc, ret) {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.emailVerificationToken;
        delete ret.phoneVerificationCode;
        delete ret.passwordResetToken;
        return ret;
    }
});

/**
 * Export User model with overwrite protection
 */
export const User = mongoose.models.User || mongoose.model("User", userSchema);

/**
 * Usage Examples:
 * 
 * // Create new patient
 * const patient = await User.create({
 *     firstName: 'John',
 *     lastName: 'Doe',
 *     email: 'john@example.com',
 *     phoneNumber: '+1234567890',
 *     password: 'securePassword123',
 *     role: 'patient',
 *     dateOfBirth: '1990-05-15',
 *     gender: 'male'
 * });
 * 
 * // Create new doctor
 * const doctor = await User.create({
 *     firstName: 'Jane',
 *     lastName: 'Smith',
 *     email: 'jane@example.com',
 *     phoneNumber: '+1234567891',
 *     password: 'securePassword123',
 *     role: 'doctor',
 *     specialization: 'Cardiology',
 *     medicalLicense: 'MED123456',
 *     qualification: 'MD, Cardiology',
 *     experience: 10,
 *     department: 'Cardiology',
 *     consultationFee: 500
 * });
 * 
 * // Login
 * const user = await User.findByEmailOrPhone('john@example.com');
 * const isValid = await user.isPasswordCorrect('password');
 * if (isValid) {
 *     const accessToken = user.generateAccessToken();
 *     const refreshToken = user.generateRefreshToken();
 *     await user.incrementLoginCount();
 * }
 * 
 * // Check permissions
 * if (user.hasPermission('view-patient-records')) {
 *     // Allow access
 * }
 */