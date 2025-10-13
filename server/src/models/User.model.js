/**
 * Healthcare System - User Model
 * 
 * Multi-role user model for healthcare consultation system.
 * Handles authentication, authorization, and profile management for:
 * - Patients
 * - Doctors
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
import bcrypt from "bcrypt";

const userSchema = new Schema(
    {
        // Basic Information
        firstName: {
            type: String,
            required: [true, "First name is required"],
            trim: true,
            maxlength: [50, "First name cannot exceed 50 characters"],
            index: true
        },
        lastName: {
            type: String,
            required: [true, "Last name is required"],
            trim: true,
            maxlength: [50, "Last name cannot exceed 50 characters"],
            index: true
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
            index: true
        },
        phoneNumber: {
            type: String,
            required: [true, "Phone number is required"],
            trim: true,
            match: [/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/, "Please enter a valid phone number"]
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [8, "Password must be at least 8 characters"],
            select: false // Don't include password in queries by default
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
            index: true
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
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
            type: String, // Cloudinary URL
            default: null
        },
        dateOfBirth: {
            type: Date,
            required: function() {
                return this.role === 'patient'; // Required only for patients
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
            sparse: true, // Allow null values but unique if present
            required: function() {
                return this.role === 'doctor';
            }
        },
        qualification: {
            type: String,
            trim: true,
            required: function() {
                return this.role === 'doctor';
            }
        },
        experience: {
            type: Number, // Years of experience
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
                // Default permissions based on role
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
            select: false // Don't include in queries by default
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
        
        // Patient-specific reference (if role is patient)
        patientId: {
            type: Schema.Types.ObjectId,
            ref: 'Patient',
            sparse: true
        },
        
        // Doctor-specific reference (if role is doctor)
        doctorId: {
            type: Schema.Types.ObjectId,
            ref: 'Doctor',
            sparse: true
        },
        
        // Metadata
        metadata: {
            lastPasswordChange: Date,
            loginCount: { type: Number, default: 0 },
            deviceInfo: [
                {
                    device: String,
                    lastUsed: Date,
                    ipAddress: String
                }
            ]
        }
    },
    { 
        timestamps: true // Automatically adds createdAt and updatedAt
    }
);

/**
 * Indexes for optimized queries
 * Critical for healthcare system performance
 */
userSchema.index({ email: 1, role: 1 });
userSchema.index({ phoneNumber: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ medicalLicense: 1 });
userSchema.index({ 'address.city': 1, 'address.state': 1 });

/**
 * Virtual field: Full Name
 * Combines firstName and lastName
 */
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

/**
 * Virtual field: Age
 * Calculates age from date of birth
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
 * Checks if account is currently locked
 */
userSchema.virtual('isLocked').get(function() {
    return !!(this.accountLockedUntil && this.accountLockedUntil > Date.now());
});

/**
 * Pre-save middleware: Hash password before saving
 * Only hashes if password is modified
 */
userSchema.pre("save", async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified("password")) return next();
    
    try {
        // Generate salt and hash password
        this.password = await bcrypt.hash(this.password, 10);
        next();
    } catch (error) {
        next(error);
    }
});

/**
 * Pre-save middleware: Update lastPasswordChange
 */
userSchema.pre("save", function(next) {
    if (this.isModified("password") && !this.isNew) {
        this.metadata.lastPasswordChange = Date.now();
    }
    next();
});

/**
 * Instance Method: Check if password is correct
 * Used during login authentication
 * 
 * @param {string} candidatePassword - Password to check
 * @returns {Promise<boolean>} - True if password matches
 */
userSchema.methods.isPasswordCorrect = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

/**
 * Instance Method: Generate Access Token (JWT)
 * Short-lived token for API authentication
 * 
 * @returns {string} - JWT access token
 */
userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            userId: this._id,
            email: this.email,
            role: this.role,
            userType: this.role, // For backward compatibility
            permissions: this.permissions,
            fullName: `${this.firstName} ${this.lastName}`
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m'
        }
    );
};

/**
 * Instance Method: Generate Refresh Token (JWT)
 * Long-lived token for refreshing access tokens
 * 
 * @returns {string} - JWT refresh token
 */
userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        {
            userId: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d'
        }
    );
};

/**
 * Instance Method: Increment login count
 * Updates login statistics
 */
userSchema.methods.incrementLoginCount = function() {
    this.metadata.loginCount += 1;
    this.lastLogin = new Date();
    this.failedLoginAttempts = 0; // Reset failed attempts on successful login
    return this.save();
};

/**
 * Instance Method: Record failed login attempt
 * Implements account lockout after too many failed attempts
 */
userSchema.methods.recordFailedLogin = function() {
    this.failedLoginAttempts += 1;
    
    // Lock account after 5 failed attempts
    if (this.failedLoginAttempts >= 5) {
        this.accountLockedUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
    }
    
    return this.save();
};

/**
 * Instance Method: Check if user has permission
 * 
 * @param {string} permission - Permission to check
 * @returns {boolean} - True if user has permission
 */
userSchema.methods.hasPermission = function(permission) {
    if (this.role === 'admin') return true; // Admins have all permissions
    return this.permissions.includes(permission);
};

/**
 * Instance Method: Sanitize user data for response
 * Removes sensitive information before sending to client
 * 
 * @returns {Object} - Sanitized user object
 */
userSchema.methods.toSafeObject = function() {
    const userObject = this.toObject();
    
    // Remove sensitive fields
    delete userObject.password;
    delete userObject.refreshToken;
    delete userObject.emailVerificationToken;
    delete userObject.phoneVerificationCode;
    delete userObject.passwordResetToken;
    delete userObject.__v;
    
    // Add virtual fields
    userObject.fullName = this.fullName;
    userObject.age = this.age;
    userObject.isLocked = this.isLocked;
    
    return userObject;
};

/**
 * Static Method: Find user by email or phone
 * 
 * @param {string} identifier - Email or phone number
 * @returns {Promise<User>} - User document
 */
userSchema.statics.findByEmailOrPhone = async function(identifier) {
    return await this.findOne({
        $or: [
            { email: identifier.toLowerCase() },
            { phoneNumber: identifier }
        ]
    }).select('+password');
};

/**
 * Static Method: Get active doctors by specialization
 * 
 * @param {string} specialization - Doctor specialization
 * @returns {Promise<Array>} - Array of doctor users
 */
userSchema.statics.getActiveDoctor = async function(specialization) {
    const query = {
        role: 'doctor',
        isActive: true
    };
    
    if (specialization) {
        query.specialization = specialization;
    }
    
    return await this.find(query)
        .select('-password -refreshToken')
        .sort({ experience: -1 });
};

/**
 * Ensure virtual fields are included in JSON output
 */
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Export User model
export const User = mongoose.model("User", userSchema);

/**
 * Usage Examples:
 * 
 * // Create new user (patient)
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
 * // Login and generate tokens
 * const user = await User.findByEmailOrPhone('john@example.com');
 * const isValidPassword = await user.isPasswordCorrect('securePassword123');
 * if (isValidPassword) {
 *     const accessToken = user.generateAccessToken();
 *     const refreshToken = user.generateRefreshToken();
 *     await user.incrementLoginCount();
 * }
 * 
 * // Check permissions
 * if (user.hasPermission('view-patient-records')) {
 *     // Allow access
 * }
 * 
 * // Get safe user object for response
 * const safeUser = user.toSafeObject();
 * res.json(safeUser);
 */