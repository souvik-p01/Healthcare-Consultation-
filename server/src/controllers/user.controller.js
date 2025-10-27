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
import { User } from "../models/user.model.js";
import { Patient } from "../models/patient.model.js";
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
        role,
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

    // 2. Validation - Check required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'phoneNumber', 'password'];
    const missingFields = requiredFields.filter(field => !req.body[field]?.trim());

    if (missingFields.length > 0) {
        throw new ApiError(
            400, 
            `Missing required fields: ${missingFields.join(', ')}`
        );
    }

    // Role-specific validation
    if (role === 'patient' && (!dateOfBirth || !gender)) {
        throw new ApiError(400, "Date of birth and gender are required for patients");
    }

    if (role === 'doctor' && (!specialization || !medicalLicense || !qualification)) {
        throw new ApiError(
            400, 
            "Specialization, medical license, and qualification are required for doctors"
        );
    }

    // 3. Check if user already exists
    const existingUser = await User.findOne({
        $or: [{ email: email.toLowerCase() }, { phoneNumber }]
    });

    if (existingUser) {
        throw new ApiError(
            409, 
            "User with this email or phone number already exists"
        );
    }

    // For doctors, check if medical license is unique
    if (role === 'doctor') {
        const existingDoctor = await User.findOne({ medicalLicense });
        if (existingDoctor) {
            throw new ApiError(409, "Medical license number already registered");
        }
    }

    // 4. Handle avatar upload (optional)
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

    // 5. Create user object - Create entry in database
    const userData = {
        firstName,
        lastName,
        email: email.toLowerCase(),
        phoneNumber,
        password,
        role: role || 'patient',
        avatar: avatarUrl,
        dateOfBirth: role === 'patient' ? dateOfBirth : undefined,
        gender: role === 'patient' ? gender : undefined,
        // Doctor-specific fields
        specialization: role === 'doctor' ? specialization : undefined,
        medicalLicense: role === 'doctor' ? medicalLicense : undefined,
        qualification: role === 'doctor' ? qualification : undefined,
        department: role === 'doctor' ? department : undefined,
        experience: role === 'doctor' ? experience : undefined,
        consultationFee: role === 'doctor' ? consultationFee : undefined
    };

    const user = await User.create(userData);

    // 6. Create role-specific profile (Patient or Doctor)
    if (role === 'patient') {
        const patient = await Patient.create({
            userId: user._id,
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

    // 7. Get created user without sensitive fields
    const createdUser = await User.findById(user._id)
        .select("-password -refreshToken")
        .lean();

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user");
    }

    // 8. Send verification email (async, don't wait)
    try {
        const verificationToken = generateEmailVerificationToken(
            user._id.toString(), 
            user.email
        );
        const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        
        sendEmailVerification(user.email, {
            firstName: user.firstName,
            verificationLink,
            verificationCode: Math.floor(100000 + Math.random() * 900000) // 6-digit code
        }).catch(err => console.error('Email sending failed:', err));
    } catch (error) {
        console.error('⚠️ Email verification sending failed:', error);
    }

    // 9. Return success response
    return res.status(201).json(
        new ApiResponse(
            201, 
            {
                user: createdUser,
                message: "Registration successful! Please verify your email."
            }, 
            "User registered successfully"
        )
    );
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

    if (newPassword.length < 8) {
        throw new ApiError(400, "New password must be at least 8 characters long");
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

    console.log('✏️ Account details updated for:', user.email);

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
            console.error('⚠️ Failed to delete old avatar:', error);
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
 * GET ALL DOCTORS
 * Get list of all active doctors with optional filters
 * 
 * GET /api/v1/users/doctors
 */
const getAllDoctors = asyncHandler(async (req, res) => {
    const { specialization, department, page = 1, limit = 10 } = req.query;

    const query = { role: 'doctor', isActive: true };

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

// Export all controller functions
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    getUserProfile,
    getAllDoctors
};

/**
 * Additional controllers needed for complete healthcare system:
 * - verifyEmail
 * - resendVerificationEmail
 * - forgotPassword
 * - resetPassword
 * - verifyPhone
 * - deleteAccount
 * - getUserStatistics (for admin)
 */