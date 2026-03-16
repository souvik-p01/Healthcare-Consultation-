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
    deactivateUser,
    getCurrentUser  // ✅ Only add this one - changeCurrentPassword already exists
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
    validateRole,
    validatePasswordStrength,
    validatePasswordMatch
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
 * @desc    Register new user (Patient, Doctor, Nurse, Technician)
 * @access  Public
 */
router.post(
    "/register",
    rateLimiter(),
    validateRequiredFields(['firstName', 'lastName', 'email', 'password']),
    validateEmail,
    validatePhone,
    validateDOB,
    validateRole,
    validatePasswordStrength,
    validatePasswordMatch,
    sanitizePatient,
    uploadProfilePhoto.single('avatar'),
    handleUploadError,
    registerUser
);

/**
 * @route   POST /api/v1/users/login
 * @desc    Authenticate user and get tokens
 * @access  Public
 */
router.post(
    "/login",
    loginRateLimiter,
    loginUser
);

/**
 * @route   POST /api/v1/users/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post(
    "/refresh-token",
    rateLimiter(),
    refreshAccessToken
);

/**
 * @route   GET /api/v1/users/profile/:userId
 * @desc    Get public profile of any user
 * @access  Public
 */
router.get(
    "/profile/:userId",
    optionalVerifyJWT,
    getUserProfile
);

/**
 * @route   GET /api/v1/users/doctors
 * @desc    Get list of all active doctors with filters
 * @access  Public
 */
router.get(
    "/doctors",
    getAllDoctors
);

/**
 * @route   POST /api/v1/users/verify-email
 * @desc    Verify user email address with token
 * @access  Public
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
 * @route   GET /api/v1/users/me
 * @desc    Get current user details
 * @access  Private
 */
router.get("/me", getCurrentUser);

/**
 * @route   PATCH /api/v1/users/me
 * @desc    Update current user profile
 * @access  Private
 */
router.patch("/me", updateProfile);

/**
 * @route   POST /api/v1/users/logout
 * @desc    Logout user and clear tokens
 * @access  Private
 */
router.post("/logout", logoutUser);

/**
 * @route   GET /api/v1/users/current
 * @desc    Get currently logged-in user details
 * @access  Private
 */
router.get("/current", getCurrentUser);

/**
 * @route   GET /api/v1/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/profile", getProfile);

/**
 * @route   PATCH /api/v1/users/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.patch("/profile", updateProfile);

/**
 * @route   PATCH /api/v1/users/complete-profile
 * @desc    Complete user profile with role-specific information
 * @access  Private
 */
router.patch("/complete-profile", completeProfile);

/**
 * @route   POST /api/v1/users/change-password
 * @desc    Change user password (with validation)
 * @access  Private
 */
router.post(
    "/change-password",
    checkVerification,
    validateRequiredFields(['oldPassword', 'newPassword', 'confirmPassword']),
    validatePasswordStrength,
    validatePasswordMatch,
    changeCurrentPassword
);

/**
 * @route   PATCH /api/v1/users/update-account
 * @desc    Update user account details
 * @access  Private
 */
router.patch(
    "/update-account",
    validatePhone,
    validateDOB,
    updateAccountDetails
);

/**
 * @route   PATCH /api/v1/users/avatar
 * @desc    Update user profile picture
 * @access  Private
 */
router.patch(
    "/avatar",
    uploadProfilePhoto.single('avatar'),
    handleUploadError,
    validateUploadedFiles,
    updateUserAvatar
);

/**
 * @route   POST /api/v1/users/resend-verification
 * @desc    Resend email verification link
 * @access  Private
 */
router.post("/resend-verification", resendVerificationEmail);

/**
 * @route   DELETE /api/v1/users/delete-account
 * @desc    Soft delete user account
 * @access  Private
 */
router.delete("/delete-account", strictRateLimiter, deleteAccountController);

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
router.get("/statistics", restrictTo('admin'), getUserStatistics);

/**
 * @route   PATCH /api/v1/users/:userId/role
 * @desc    Update user role
 * @access  Private (Admin only)
 */
router.patch("/:userId/role", restrictTo('admin'), updateUserRole);

/**
 * @route   PATCH /api/v1/users/:userId/deactivate
 * @desc    Deactivate user account
 * @access  Private (Admin only)
 */
router.patch("/:userId/deactivate", restrictTo('admin'), deactivateUser);

export default router;