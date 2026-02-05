/**
 * Healthcare System - User Routes
 * 
 * Routes for user authentication, registration, and profile management.
 * Handles patients, doctors, admins, nurses, and staff.
 * 
 * Base URL: /api/v1/users
 * 
 * Features:
 * - User registration (multi-role)
 * - Login/Logout with JWT
 * - Password management
 * - Profile updates
 * - Email verification
 * - Doctor listings
 */

import { Router } from "express";
import {
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
} from "../controllers/user.controller.js";

// Import middlewares
import { 
    verifyJWT, 
    optionalVerifyJWT,
    restrictTo,
    checkVerification 
} from "../middlewares/auth.middleware.js";

// Import validation middlewares
import {
    validateEmail,
    validatePhone,
    validateDOB,
    validateRequiredFields,
    sanitizePatient,
    validateRole,  // ✅ Added role validation
    validatePasswordStrength,  // ✅ Added password strength validation
    validatePasswordMatch  // ✅ Added password match validation
} from "../middlewares/validation.middleware.js";

import {
    uploadProfilePhoto,
    handleUploadError,
    validateUploadedFiles
} from "../middlewares/multer.middleware.js";

import { 
    rateLimiter, 
    loginRateLimiter,
    strictRateLimiter 
} from "../middlewares/rateLimit.middleware.js";

// Initialize router
const router = Router();

/**
 * ==========================================
 * PUBLIC ROUTES (No Authentication Required)
 * ==========================================
 */

/**
 * @route   POST /api/v1/users/register
 * @desc    Register new user (Patient, Doctor, Admin, Nurse, Staff)
 * @access  Public
 * @body    {
 *            firstName, lastName, email, phoneNumber, password, role,
 *            dateOfBirth (for patients), gender (for patients),
 *            specialization, medicalLicense, qualification (for doctors)
 *          }
 */
router.post(
    "/register",
    rateLimiter(), // Prevent spam registration
    validateRequiredFields(['firstName', 'lastName', 'email', 'password']),
    validateEmail, // Validate email format
    validatePhone, // Validate phone number format
    validateDOB, // Validate date of birth (if provided)
    validateRole, // ✅ Validate role (patient, doctor, nurse only)
    validatePasswordStrength, // ✅ Validate password requirements
    validatePasswordMatch, // ✅ Ensure password and confirmPassword match
    sanitizePatient, // Sanitize input data
    uploadProfilePhoto.single('avatar'), // Optional avatar upload
    handleUploadError, // Handle multer errors
    registerUser // Controller function
);

/**
 * @route   POST /api/v1/users/login
 * @desc    Authenticate user and get tokens
 * @access  Public
 * @body    { email or phoneNumber, password }
 */
router.post(
    "/login",
    loginRateLimiter, // Strict rate limiting for login (5 attempts per 15 min)
    loginUser // Controller function
);

/**
 * @route   POST /api/v1/users/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public (but requires valid refresh token)
 * @body    { refreshToken } or from cookies
 */
router.post(
    "/refresh-token",
    rateLimiter(),
    refreshAccessToken // Controller function
);

/**
 * @route   GET /api/v1/users/profile/:userId
 * @desc    Get public profile of any user (doctor/patient)
 * @access  Public
 * @params  userId - User ID
 */
router.get(
    "/profile/:userId",
    optionalVerifyJWT, // Optional authentication for additional info
    getUserProfile // Controller function
);

/**
 * @route   GET /api/v1/users/doctors
 * @desc    Get list of all active doctors with filters
 * @access  Public
 * @query   specialization, department, page, limit
 */
router.get(
    "/doctors",
    getAllDoctors // Controller function
);

/**
 * @route   POST /api/v1/users/verify-email
 * @desc    Verify user email address with token
 * @access  Public
 * @body    { token }
 */
router.post(
    "/verify-email",
    rateLimiter(),
    verifyEmailController
);

/**
 * @route   POST /api/v1/users/forgot-password
 * @desc    Send password reset email
 * @access  Public
 * @body    { email }
 */
router.post(
    "/forgot-password",
    rateLimiter(),
    forgotPasswordController
);

/**
 * @route   POST /api/v1/users/reset-password
 * @desc    Reset password using reset token
 * @access  Public
 * @body    { token, newPassword, confirmPassword }
 */
router.post(
    "/reset-password",
    rateLimiter(),
    resetPasswordController
);

/**
 * ==========================================
 * PROTECTED ROUTES (Authentication Required)
 * ==========================================
 */

// Apply verifyJWT middleware to all routes below this line
router.use(verifyJWT);

/**
 * @route   POST /api/v1/users/logout
 * @desc    Logout user and clear tokens
 * @access  Private (All authenticated users)
 */
router.post(
    "/logout",
    logoutUser // Controller function
);

/**
 * @route   GET /api/v1/users/current
 * @desc    Get currently logged-in user details
 * @access  Private (All authenticated users)
 */
router.get(
    "/current",
    getCurrentUser // Controller function
);

/**
 * @route   GET /api/v1/users/profile
 * @desc    Get current user profile
 * @access  Private (All authenticated users)
 */
router.get(
    "/profile",
    getProfile
);

/**
 * @route   PATCH /api/v1/users/profile
 * @desc    Update current user profile
 * @access  Private (All authenticated users)
 */
router.patch(
    "/profile",
    updateProfile
);

/**
 * @route   PATCH /api/v1/users/complete-profile
 * @desc    Complete user profile with role-specific information
 * @access  Private (All authenticated users)
 * @body    Role-specific fields for patients and doctors
 */
router.patch(
    "/complete-profile",
    completeProfile
);

/**
 * @route   POST /api/v1/users/change-password
 * @desc    Change user password
 * @access  Private (All authenticated users)
 * @body    { oldPassword, newPassword, confirmPassword }
 */
router.post(
    "/change-password",
    checkVerification, // Ensure email is verified for sensitive operations
    validateRequiredFields(['oldPassword', 'newPassword', 'confirmPassword']),
    validatePasswordStrength, // ✅ Add password strength validation
    validatePasswordMatch, // ✅ Add password match validation
    changeCurrentPassword // Controller function
);

/**
 * @route   PATCH /api/v1/users/update-account
 * @desc    Update user account details (name, phone, etc.)
 * @access  Private (All authenticated users)
 * @body    { firstName, lastName, phoneNumber, dateOfBirth, gender }
 */
router.patch(
    "/update-account",
    validatePhone, // Validate phone if provided
    validateDOB, // Validate date of birth if provided
    updateAccountDetails // Controller function
);

/**
 * @route   PATCH /api/v1/users/avatar
 * @desc    Update user profile picture
 * @access  Private (All authenticated users)
 * @body    multipart/form-data with 'avatar' file
 */
router.patch(
    "/avatar",
    uploadProfilePhoto.single('avatar'), // Handle single file upload with name 'avatar'
    handleUploadError, // Handle upload errors (file size, type, etc.)
    validateUploadedFiles, // Validate uploaded file
    updateUserAvatar // Controller function
);

/**
 * @route   POST /api/v1/users/resend-verification
 * @desc    Resend email verification link
 * @access  Private (All authenticated users)
 */
router.post(
    "/resend-verification",
    resendVerificationEmail
);

/**
 * @route   DELETE /api/v1/users/delete-account
 * @desc    Soft delete user account
 * @access  Private (All authenticated users)
 * @body    { password, reason }
 */
router.delete(
    "/delete-account",
    strictRateLimiter,
    deleteAccountController
);

/**
 * ==========================================
 * ADMIN ROUTES (Admin Role Required)
 * ==========================================
 */

/**
 * @route   GET /api/v1/users/statistics
 * @desc    Get user statistics for admin dashboard
 * @access  Private (Admin only)
 */
router.get(
    "/statistics",
    restrictTo('admin'),
    getUserStatistics
);

/**
 * @route   PATCH /api/v1/users/:userId/role
 * @desc    Update user role (admin only)
 * @access  Private (Admin only)
 * @body    { role }
 */
router.patch(
    "/:userId/role",
    restrictTo('admin'),
    updateUserRole
);

/**
 * @route   PATCH /api/v1/users/:userId/deactivate
 * @desc    Deactivate user account (admin only)
 * @access  Private (Admin only)
 * @body    { reason }
 */
router.patch(
    "/:userId/deactivate",
    restrictTo('admin'),
    deactivateUser
);

export default router;