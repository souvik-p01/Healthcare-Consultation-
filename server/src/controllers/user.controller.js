/**
 * Healthcare System - User Controller
 * 
 * Handles user authentication, registration, and profile management
 * for healthcare consultation system (patients, doctors, admins, staff).
 * 
 * Features:
 * - User registration with role-based setup
 * - Login/Logout with JWT tokens
 * - Password management
 * - Profile updates
 * - Email/Phone verification
 * - Healthcare-specific user operations
 */

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/User.model.js";
import { Patient } from "../models/Patient.model.js";
import { Doctor } from "../models/doctor.model.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { 
    generateAccessToken, 
    generateRefreshToken, 
    verifyRefreshToken,
    generateEmailVerificationToken,
    generatePasswordResetToken
} from "../utils/jwtUtils.js";
import { 
    sendEmailVerification,
    sendPasswordReset,
    sendWelcomeEmail
} from "../utils/emailUtils.js";
import jwt from "jsonwebtoken";

/**
 * Generate Access and Refresh Tokens
 * Helper function for login and token refresh operations
 * 
 * @param {String} userId - User ID
 * @returns {Object} - Access and refresh tokens
 */
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            throw new ApiError(404, "User not found while generating tokens");
        }

        // Generate tokens using user model methods
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // Save refresh token to database
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        console.log('✅ Tokens generated successfully for user:', user.email);

        return { accessToken, refreshToken };

    } catch (error) {
        console.error("❌ Token generation error:", error.message);
        throw new ApiError(
            500, 
            "Something went wrong while generating authentication tokens"
        );
    }
};

/**
 * REGISTER USER
 * Register new user in healthcare system (Patient, Doctor, or Staff)
 * 
 * POST /api/v1/users/register
 */
const registerUser = asyncHandler(async (req, res) => {
    // 1. Get user details from request body
    const {
        firstName,
        lastName,
        email,
        phoneNumber,
        password,
        role = 'patient', // Default to patient
        dateOfBirth,
        gender,
        // Doctor-specific fields
        specialization,
        medicalLicense,
        qualification,
        department,
        experience,
        consultationFee
    } = req.body;

    console.log("📝 Registration attempt for:", email);

    // 2. ✅ ADDED: Backend Role Validation
    // Only allow specific roles for public registration
    const allowedRoles = ["patient", "doctor", "nurse"];
    
    if (!allowedRoles.includes(role)) {
        throw new ApiError(
            400, 
            `Invalid role selection. Allowed roles: ${allowedRoles.join(', ')}`
        );
    }

    // 3. Validation - Check required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'password'];
    const missingFields = requiredFields.filter(field => !req.body[field]?.trim());

    if (missingFields.length > 0) {
        throw new ApiError(
            400, 
            `Missing required fields: ${missingFields.join(', ')}`
        );
    }

    // 4. ✅ ADDED: Password Strength Validation
    if (password.length < 8) {
        throw new ApiError(400, "Password must be at least 8 characters long");
    }
    
    if (!/[A-Z]/.test(password)) {
        throw new ApiError(400, "Password must contain at least one uppercase letter");
    }
    
    if (!/[a-z]/.test(password)) {
        throw new ApiError(400, "Password must contain at least one lowercase letter");
    }
    
    if (!/\d/.test(password)) {
        throw new ApiError(400, "Password must contain at least one number");
    }
    
    if (!/[@$!%*?&]/.test(password)) {
        throw new ApiError(400, "Password must contain at least one special character (@$!%*?&)");
    }

    // 5. Check if user already exists
    const existingUser = await User.findOne({
        email: email.toLowerCase()
    });

    if (existingUser) {
        throw new ApiError(
            409, 
            "User with this email already exists"
        );
    }

    // 6. Handle avatar upload (optional)
    let avatarUrl = null;
    if (req.file) {
        const avatarLocalPath = req.file.path;
        const avatar = await uploadOnCloudinary(avatarLocalPath, {
            category: 'profile_photos',
            uploadedBy: 'system',
            documentType: 'avatar'
        });

        if (avatar && avatar.secureUrl) {
            avatarUrl = avatar.secureUrl;
        }
    }

    // 7. Create user object - Create entry in database
    const userData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        password,
        role, // ✅ Use validated role
        avatar: avatarUrl,
        isEmailVerified: false, // Email verification required
        status: 'active'
    };

    // Add optional fields if provided
    if (phoneNumber) userData.phoneNumber = phoneNumber;
    if (dateOfBirth) userData.dateOfBirth = dateOfBirth;
    if (gender) userData.gender = gender;
    
    // Add doctor-specific fields only if role is doctor
    if (role === 'doctor') {
        if (specialization) userData.specialization = specialization;
        if (medicalLicense) userData.medicalLicense = medicalLicense;
        if (qualification) userData.qualification = qualification;
        if (department) userData.department = department;
        if (experience) userData.experience = experience;
        if (consultationFee) userData.consultationFee = consultationFee;
    }

    const user = await User.create(userData);

    // 8. Create role-specific profile (Patient or Doctor)
    if (role === 'patient') {
        const patient = await Patient.create({
            user: user._id,
            // Medical record number will be auto-generated
        });
        user.patientId = patient._id;
        await user.save({ validateBeforeSave: false });
        
        console.log('✅ Patient profile created:', patient.medicalRecordNumber);
    }

    if (role === 'doctor') {
        // Create Doctor profile (when Doctor model is ready)
        // const doctor = await Doctor.create({
        //     userId: user._id,
        //     // additional doctor fields
        // });
        // user.doctorId = doctor._id;
        // await user.save({ validateBeforeSave: false });
    }

    // 9. Get created user without sensitive fields
    const createdUser = await User.findById(user._id)
        .select("-password -refreshToken -emailVerificationToken -passwordResetToken")
        .lean();

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user");
    }

    // 10. ✅ UPDATED: Send verification email (async, don't wait)
    try {
        const verificationToken = generateEmailVerificationToken(
            user._id.toString(), 
            user.email
        );
        const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
        
        sendEmailVerification(user.email, {
            firstName: user.firstName,
            verificationLink,
            verificationCode: Math.floor(100000 + Math.random() * 900000) // 6-digit code
        }).catch(err => console.error('Email sending failed:', err));
    } catch (error) {
        console.error('⚠ Email verification sending failed:', error);
    }

    // 11. ✅ UPDATED: Send welcome email (async, don't wait)
    try {
        sendWelcomeEmail(user.email, {
            firstName: user.firstName,
            role: user.role,
            userId: user._id.toString(),
            loginLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`
        }).catch(err => console.error('Welcome email sending failed:', err));
    } catch (error) {
        console.error('⚠ Welcome email sending failed:', error);
    }

    // 12. ✅ UPDATED: Return success response WITHOUT authentication tokens
    return res.status(201).json(
        new ApiResponse(
            201, 
            {
                user: createdUser,
                message: "Account created successfully! Please check your email to verify your account.",
                nextStep: "verify_email",
                loginRequired: true
            }, 
            "User registered successfully"
        )
    );
});

/**
 * COMPLETE PROFILE
 * Complete user profile with role-specific information
 * 
 * PATCH /api/v1/users/complete-profile
 */
const completeProfile = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const {
        // Common fields
        phoneNumber,
        dateOfBirth,
        gender,
        address,
        
        // Patient specific
        emergencyContact,
        medicalHistory,
        allergies,
        currentMedications,
        
        // Doctor specific
        specialization,
        qualification,
        medicalLicense,
        department,
        experience,
        consultationFee,
        bio
    } = req.body;

    console.log("📝 Profile completion for user:", req.user.email);

    try {
        // Update user basic information
        const updateData = {};
        if (phoneNumber) updateData.phoneNumber = phoneNumber;
        if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
        if (gender) updateData.gender = gender;
        if (address) updateData.address = address;
        if (specialization) updateData.specialization = specialization;
        if (qualification) updateData.qualification = qualification;
        if (medicalLicense) updateData.medicalLicense = medicalLicense;
        if (department) updateData.department = department;
        if (experience) updateData.experience = experience;
        if (consultationFee) updateData.consultationFee = consultationFee;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select("-password -refreshToken");

        // Handle role-specific profile creation/update
        if (req.user.role === 'patient') {
            let patient = await Patient.findOne({ user: userId });
            
            if (!patient) {
                // Create new patient profile
                patient = await Patient.create({
                    user: userId
                });
                
                // Update user with patient reference
                updatedUser.patientId = patient._id;
                await updatedUser.save({ validateBeforeSave: false });
            }
            
            // Update patient-specific information
            const patientUpdateData = {};
            if (emergencyContact) {
                patientUpdateData.emergencyContacts = [{
                    name: emergencyContact.name,
                    relationship: emergencyContact.relationship,
                    phone: emergencyContact.phoneNumber,
                    isPrimary: true
                }];
            }
            
            if (medicalHistory || allergies || currentMedications) {
                patientUpdateData.notes = {
                    generalNotes: medicalHistory || '',
                    carePreferences: currentMedications || ''
                };
                
                if (allergies) {
                    patientUpdateData.allergies = allergies.split(',').map(allergy => ({
                        name: allergy.trim(),
                        severity: 'mild',
                        isActive: true
                    }));
                }
            }
            
            if (Object.keys(patientUpdateData).length > 0) {
                await Patient.findByIdAndUpdate(patient._id, patientUpdateData);
            }
        }
        
        if (req.user.role === 'doctor') {
            let doctor = await Doctor.findOne({ userId: userId });
            
            if (!doctor) {
                // Create new doctor profile
                const doctorData = {
                    userId: userId,
                    medicalLicenseNumber: medicalLicense || `LIC${Date.now()}`,
                    specializations: specialization ? [specialization] : [],
                    consultationFee: consultationFee || 0
                };
                
                if (qualification) {
                    doctorData.qualifications = [{
                        degree: qualification,
                        institution: 'Not specified',
                        year: new Date().getFullYear()
                    }];
                }
                
                if (experience) {
                    doctorData.experience = {
                        totalYears: parseInt(experience) || 0,
                        workHistory: []
                    };
                }
                
                if (bio) {
                    doctorData.bio = bio;
                }
                
                doctor = await Doctor.create(doctorData);
                
                // Update user with doctor reference
                updatedUser.doctorId = doctor._id;
                await updatedUser.save({ validateBeforeSave: false });
            }
        }

        console.log('✅ Profile completed successfully for:', updatedUser.email);

        return res.status(200).json(
            new ApiResponse(
                200,
                updatedUser,
                "Profile completed successfully"
            )
        );

    } catch (error) {
        console.error("❌ Profile completion error:", error.message);
        throw new ApiError(
            500,
            error.message || "Something went wrong while completing profile"
        );
    }
});

/**
 * LOGIN USER
 * Authenticate user and provide access/refresh tokens
 * 
 * POST /api/v1/users/login
 */
const loginUser = asyncHandler(async (req, res) => {
    // 1. Get login credentials from request body
    const { email, phoneNumber, password } = req.body;

    // 2. Validate input - require email or phone number
    if (!(email || phoneNumber)) {
        throw new ApiError(400, "Email or phone number is required");
    }

    if (!password) {
        throw new ApiError(400, "Password is required");
    }

    console.log("🔐 Login attempt:", email || phoneNumber);

    // 3. Find user by email or phone
    const user = await User.findOne({
        $or: [
            { email: email?.toLowerCase() }, 
            { phoneNumber }
        ]
    }).select('+password'); // Include password field for verification

    if (!user) {
        throw new ApiError(404, "User not found with provided credentials");
    }

    // ✅ Check if email is verified (if email verification is enabled)
    if (process.env.REQUIRE_EMAIL_VERIFICATION === 'true' && !user.isEmailVerified) {
        throw new ApiError(403, "Please verify your email before logging in");
    }

    // Check if account is active
    if (!user.isActive) {
        throw new ApiError(403, "Account is inactive. Please contact support.");
    }

    // Check if account is locked
    if (user.isLocked) {
        const lockTime = Math.ceil((user.accountLockedUntil - Date.now()) / 60000);
        throw new ApiError(
            423, 
            `Account is locked due to multiple failed login attempts. Try again in ${lockTime} minutes.`
        );
    }

    // 4. Verify password
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        // Record failed login attempt
        await user.recordFailedLogin();
        
        throw new ApiError(401, "Invalid password");
    }

    // 5. Generate access and refresh tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    // 6. Update login statistics
    await user.incrementLoginCount();

    // 7. Get user data without sensitive fields
    const loggedInUser = await User.findById(user._id)
        .select("-password -refreshToken")
        .lean();

    // 8. Set cookie options
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };

    console.log('✅ User logged in successfully:', user.email);

    // 9. Send response with cookies
    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged in successfully"
            )
        );
});

/**
 * LOGOUT USER
 * Clear user session and invalidate refresh token
 * 
 * POST /api/v1/users/logout
 * Requires: verifyJWT middleware
 */
const logoutUser = asyncHandler(async (req, res) => {
    // Clear refresh token from database
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: { refreshToken: 1 } // Remove field from document
        },
        { new: true }
    );

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    };

    console.log('👋 User logged out:', req.user.email);

    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(
            new ApiResponse(200, {}, "User logged out successfully")
        );
});

/**
 * REFRESH ACCESS TOKEN
 * Generate new access token using refresh token
 * 
 * POST /api/v1/users/refresh-token
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is required");
    }

    try {
        // Verify refresh token
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET || process.env.JWT_REFRESH_SECRET
        );

        // Find user
        const user = await User.findById(decodedToken.userId || decodedToken._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        // Check if refresh token matches
        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or has been used");
        }

        // Generate new tokens
        const { accessToken, refreshToken: newRefreshToken } = 
            await generateAccessAndRefreshTokens(user._id);

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        };

        console.log('🔄 Access token refreshed for:', user.email);

        return res
            .status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", newRefreshToken, cookieOptions)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed successfully"
                )
            );

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

/**
 * CHANGE PASSWORD
 * Allow user to change their password
 * 
 * POST /api/v1/users/change-password
 * Requires: verifyJWT middleware
 */
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    // Validation
    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Old password and new password are required");
    }

    if (newPassword !== confirmPassword) {
        throw new ApiError(400, "New password and confirm password do not match");
    }

    // ✅ ADDED: Password strength validation
    if (newPassword.length < 8) {
        throw new ApiError(400, "New password must be at least 8 characters long");
    }
    
    if (!/[A-Z]/.test(newPassword)) {
        throw new ApiError(400, "New password must contain at least one uppercase letter");
    }
    
    if (!/[a-z]/.test(newPassword)) {
        throw new ApiError(400, "New password must contain at least one lowercase letter");
    }
    
    if (!/\d/.test(newPassword)) {
        throw new ApiError(400, "New password must contain at least one number");
    }
    
    if (!/[@$!%*?&]/.test(newPassword)) {
        throw new ApiError(400, "New password must contain at least one special character (@$!%*?&)");
    }

    // Get user with password field
    const user = await User.findById(req.user._id).select('+password');

    // Verify old password
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Old password is incorrect");
    }

    // Update password
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    console.log('🔒 Password changed for:', user.email);

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Password changed successfully")
        );
});

/**
 * GET CURRENT USER
 * Get currently logged-in user details
 * 
 * GET /api/v1/users/current
 * Requires: verifyJWT middleware
 */
const getCurrentUser = asyncHandler(async (req, res) => {
    // User is already available in req.user from verifyJWT middleware
    const user = await User.findById(req.user._id)
        .select("-password -refreshToken")
        .populate('patientId')
        .populate('doctorId')
        .lean();

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Current user fetched successfully")
        );
});

/**
 * UPDATE ACCOUNT DETAILS
 * Update user's basic information
 * 
 * PATCH /api/v1/users/update-account
 * Requires: verifyJWT middleware
 */
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { firstName, lastName, phoneNumber, dateOfBirth, gender } = req.body;

    // Build update object
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
    if (gender) updateData.gender = gender;

    if (Object.keys(updateData).length === 0) {
        throw new ApiError(400, "At least one field is required to update");
    }

    // Check if phone number is already taken by another user
    if (phoneNumber) {
        const existingUser = await User.findOne({
            phoneNumber,
            _id: { $ne: req.user._id }
        });

        if (existingUser) {
            throw new ApiError(409, "Phone number is already in use");
        }
    }

    // Update user
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updateData },
        { new: true, runValidators: true }
    ).select("-password -refreshToken");

    console.log('✏ Account details updated for:', user.email);

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Account details updated successfully")
        );
});

/**
 * UPDATE AVATAR
 * Update user's profile picture
 * 
 * PATCH /api/v1/users/avatar
 * Requires: verifyJWT middleware, upload.single('avatar')
 */
const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    // Upload new avatar to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath, {
        category: 'profile_photos',
        uploadedBy: req.user._id,
        documentType: 'avatar'
    });

    if (!avatar || !avatar.secureUrl) {
        throw new ApiError(500, "Error while uploading avatar");
    }

    // Delete old avatar from Cloudinary (if exists)
    const oldUser = await User.findById(req.user._id);
    if (oldUser.avatar) {
        try {
            // Extract public_id from URL and delete
            await deleteFromCloudinary(oldUser.avatar);
        } catch (error) {
            console.error('⚠ Failed to delete old avatar:', error);
        }
    }

    // Update user with new avatar URL
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { avatar: avatar.secureUrl } },
        { new: true }
    ).select("-password -refreshToken");

    console.log('📸 Avatar updated for:', user.email);

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Avatar updated successfully")
        );
});

/**
 * GET USER PROFILE BY ID
 * Get public profile of any user (doctor/patient)
 * 
 * GET /api/v1/users/profile/:userId
 */
const getUserProfile = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    const user = await User.findById(userId)
        .select("-password -refreshToken -emailVerificationToken -passwordResetToken")
        .populate('patientId')
        .populate('doctorId')
        .lean();

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "User profile fetched successfully")
        );
});

/**
 * GET PROFILE
 * Get current user profile
 * 
 * GET /api/v1/users/profile
 * Requires: verifyJWT middleware
 */
const getProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
        .select("-password -refreshToken")
        .populate('patientId')
        .populate('doctorId')
        .lean();

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "User profile fetched successfully")
        );
});

/**
 * UPDATE PROFILE
 * Update current user profile
 * 
 * PATCH /api/v1/users/profile
 * Requires: verifyJWT middleware
 */
const updateProfile = asyncHandler(async (req, res) => {
    const { firstName, lastName, phoneNumber, dateOfBirth, gender } = req.body;

    // Build update object
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
    if (gender) updateData.gender = gender;

    if (Object.keys(updateData).length === 0) {
        throw new ApiError(400, "At least one field is required to update");
    }

    // Check if phone number is already taken by another user
    if (phoneNumber) {
        const existingUser = await User.findOne({
            phoneNumber,
            _id: { $ne: req.user._id }
        });

        if (existingUser) {
            throw new ApiError(409, "Phone number is already in use");
        }
    }

    // Update user
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updateData },
        { new: true, runValidators: true }
    ).select("-password -refreshToken");

    console.log('✏ Profile updated for:', user.email);

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Profile updated successfully")
        );
});

/**
 * GET ALL DOCTORS
 * Get list of all active doctors with optional filters
 * 
 * GET /api/v1/users/doctors
 */
const getAllDoctors = asyncHandler(async (req, res) => {
    const { specialization, department, page = 1, limit = 10 } = req.query;

    const query = { role: 'doctor', isActive: true, isEmailVerified: true };

    if (specialization) {
        query.specialization = specialization;
    }

    if (department) {
        query.department = department;
    }

    const skip = (page - 1) * limit;

    const doctors = await User.find(query)
        .select("-password -refreshToken")
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ experience: -1 })
        .lean();

    const total = await User.countDocuments(query);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    doctors,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(total / limit),
                        totalDoctors: total,
                        hasNextPage: page * limit < total
                    }
                },
                "Doctors fetched successfully"
            )
        );
});

/**
 * VERIFY EMAIL
 * Verify user's email address
 * 
 * POST /api/v1/users/verify-email
 */
const verifyEmailController = asyncHandler(async (req, res) => {
    const { token } = req.body;

    if (!token) {
        throw new ApiError(400, "Verification token is required");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.ACCESS_TOKEN_SECRET);
        
        const user = await User.findById(decoded.userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        if (user.isEmailVerified) {
            return res.status(200).json(
                new ApiResponse(200, {}, "Email is already verified")
            );
        }

        user.isEmailVerified = true;
        user.emailVerifiedAt = new Date();
        await user.save({ validateBeforeSave: false });

        console.log('✅ Email verified for:', user.email);

        return res.status(200).json(
            new ApiResponse(200, {}, "Email verified successfully")
        );

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new ApiError(401, "Verification token has expired");
        }
        if (error.name === 'JsonWebTokenError') {
            throw new ApiError(401, "Invalid verification token");
        }
        throw new ApiError(500, "Email verification failed");
    }
});

/**
 * RESEND VERIFICATION EMAIL
 * Resend email verification link
 * 
 * POST /api/v1/users/resend-verification
 */
const resendVerificationEmail = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user.isEmailVerified) {
        throw new ApiError(400, "Email is already verified");
    }

    // Check rate limiting for resend requests
    const now = Date.now();
    const lastSent = user.lastVerificationEmailSent;
    if (lastSent && (now - lastSent) < 60000) { // 1 minute cooldown
        throw new ApiError(429, "Please wait before requesting another verification email");
    }

    try {
        const verificationToken = generateEmailVerificationToken(
            user._id.toString(), 
            user.email
        );
        const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        
        await sendEmailVerification(user.email, {
            firstName: user.firstName,
            verificationLink,
            verificationCode: Math.floor(100000 + Math.random() * 900000)
        });

        user.lastVerificationEmailSent = new Date();
        await user.save({ validateBeforeSave: false });

        console.log('📧 Verification email resent to:', user.email);

        return res.status(200).json(
            new ApiResponse(200, {}, "Verification email sent successfully")
        );

    } catch (error) {
        console.error('❌ Failed to resend verification email:', error);
        throw new ApiError(500, "Failed to send verification email");
    }
});

/**
 * FORGOT PASSWORD
 * Send password reset email
 * 
 * POST /api/v1/users/forgot-password
 */
const forgotPasswordController = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
        // Don't reveal whether email exists for security
        return res.status(200).json(
            new ApiResponse(200, {}, "If the email exists, a password reset link has been sent")
        );
    }

    // Check rate limiting
    const now = Date.now();
    const lastResetRequest = user.lastPasswordResetRequest;
    if (lastResetRequest && (now - lastResetRequest) < 60000) { // 1 minute cooldown
        throw new ApiError(429, "Please wait before requesting another password reset");
    }

    try {
        const resetToken = generatePasswordResetToken(user._id.toString());
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        
        await sendPasswordReset(user.email, {
            resetLink,
            firstName: user.firstName
        });

        user.lastPasswordResetRequest = new Date();
        await user.save({ validateBeforeSave: false });

        console.log('🔐 Password reset email sent to:', user.email);

        return res.status(200).json(
            new ApiResponse(200, {}, "Password reset email sent successfully")
        );

    } catch (error) {
        console.error('❌ Failed to send password reset email:', error);
        throw new ApiError(500, "Failed to send password reset email");
    }
});

/**
 * RESET PASSWORD
 * Reset user password using token
 * 
 * POST /api/v1/users/reset-password
 */
const resetPasswordController = asyncHandler(async (req, res) => {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
        throw new ApiError(400, "Token, new password, and confirm password are required");
    }

    if (newPassword !== confirmPassword) {
        throw new ApiError(400, "New password and confirm password do not match");
    }

    // ✅ ADDED: Password strength validation
    if (newPassword.length < 8) {
        throw new ApiError(400, "Password must be at least 8 characters long");
    }
    
    if (!/[A-Z]/.test(newPassword)) {
        throw new ApiError(400, "Password must contain at least one uppercase letter");
    }
    
    if (!/[a-z]/.test(newPassword)) {
        throw new ApiError(400, "Password must contain at least one lowercase letter");
    }
    
    if (!/\d/.test(newPassword)) {
        throw new ApiError(400, "Password must contain at least one number");
    }
    
    if (!/[@$!%*?&]/.test(newPassword)) {
        throw new ApiError(400, "Password must contain at least one special character (@$!%*?&)");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.ACCESS_TOKEN_SECRET);
        
        const user = await User.findById(decoded.userId);
        if (!user) {
            throw new ApiError(404, "Invalid or expired reset token");
        }

        user.password = newPassword;
        await user.save({ validateBeforeSave: false });

        console.log('🔒 Password reset successfully for:', user.email);

        return res.status(200).json(
            new ApiResponse(200, {}, "Password reset successfully")
        );

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new ApiError(401, "Password reset token has expired");
        }
        if (error.name === 'JsonWebTokenError') {
            throw new ApiError(401, "Invalid password reset token");
        }
        throw new ApiError(500, "Password reset failed");
    }
});

/**
 * DELETE ACCOUNT
 * Soft delete user account
 * 
 * DELETE /api/v1/users/delete-account
 */
const deleteAccountController = asyncHandler(async (req, res) => {
    const { password, reason } = req.body;

    if (!password) {
        throw new ApiError(400, "Password is required to delete account");
    }

    const user = await User.findById(req.user._id).select('+password');
    
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password");
    }

    // Soft delete - mark as inactive
    user.isActive = false;
    user.accountDeletionDate = new Date();
    user.deletionReason = reason;
    await user.save({ validateBeforeSave: false });

    console.log('🗑 Account marked for deletion:', user.email);

    // Clear cookies
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    };

    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(
            new ApiResponse(200, {}, "Account deleted successfully")
        );
});

/**
 * GET USER STATISTICS (Admin only)
 * 
 * GET /api/v1/users/statistics
 */
const getUserStatistics = asyncHandler(async (req, res) => {
    // Only admin can access this
    if (req.user.role !== 'admin') {
        throw new ApiError(403, "Access denied. Admin role required.");
    }

    const stats = await User.aggregate([
        {
            $facet: {
                totalUsers: [{ $count: 'count' }],
                usersByRole: [
                    { $group: { _id: '$role', count: { $sum: 1 } } }
                ],
                usersByStatus: [
                    { $group: { _id: '$isActive', count: { $sum: 1 } } }
                ],
                verifiedUsers: [
                    { $match: { isEmailVerified: true } },
                    { $count: 'count' }
                ],
                recentRegistrations: [
                    { 
                        $match: { 
                            createdAt: { 
                                $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                            } 
                        } 
                    },
                    { $count: 'count' }
                ]
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, stats[0], "User statistics fetched successfully")
    );
});

/**
 * UPDATE USER ROLE (Admin only)
 * 
 * PATCH /api/v1/users/:userId/role
 */
const updateUserRole = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role) {
        throw new ApiError(400, "Role is required");
    }

    // ✅ Only allow valid roles
    const validRoles = ['patient', 'doctor', 'nurse', 'technician', 'staff', 'admin'];
    if (!validRoles.includes(role)) {
        throw new ApiError(400, `Invalid role. Valid roles: ${validRoles.join(', ')}`);
    }

    const user = await User.findByIdAndUpdate(
        userId,
        { role },
        { new: true }
    ).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    console.log('👤 User role updated:', { userId, newRole: role });

    return res.status(200).json(
        new ApiResponse(200, user, "User role updated successfully")
    );
});

/**
 * DEACTIVATE USER (Admin only)
 * 
 * PATCH /api/v1/users/:userId/deactivate
 */
const deactivateUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findByIdAndUpdate(
        userId,
        { 
            isActive: false,
            deactivationReason: reason,
            deactivatedAt: new Date()
        },
        { new: true }
    ).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    console.log('👤 User deactivated:', { userId, reason });

    return res.status(200).json(
        new ApiResponse(200, user, "User deactivated successfully")
    );
});

// Export all controller functions
export {
    registerUser,
    completeProfile,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    getUserProfile,
    getAllDoctors,
    getProfile,
    updateProfile,
    verifyEmailController,
    resendVerificationEmail,
    forgotPasswordController,
    resetPasswordController,
    deleteAccountController,
    getUserStatistics,
    updateUserRole,
    deactivateUser
};