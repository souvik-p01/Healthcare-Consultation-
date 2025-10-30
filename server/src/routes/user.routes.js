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
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    getUserProfile,
    getAllDoctors
} from "../controllers/user.controller.js";

// Import middlewares
import { 
    verifyJWT, 
    optionalVerifyJWT,
    restrictTo,
    checkVerification 
} from "../middlewares/auth.middleware.js";

import {
    validateEmail,
    validatePhone,
    validateDOB,
    validateRequiredFields,
    sanitizePatient
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
    validateRequiredFields(['firstName', 'lastName', 'email', 'phoneNumber', 'password']),
    validateEmail, // Validate email format
    validatePhone, // Validate phone number format
    validateDOB, // Validate date of birth (if provided)
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
    validateEmail, // Validate email format (if email provided)
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
 * ==========================================
 * PROTECTED ROUTES (Authentication Required)
 * ==========================================
 */

/**
 * @route   POST /api/v1/users/logout
 * @desc    Logout user and clear tokens
 * @access  Private (All authenticated users)
 */
router.post(
    "/logout",
    verifyJWT, // Verify JWT token and attach user to req.user
    logoutUser // Controller function
);

/**
 * @route   GET /api/v1/users/current
 * @desc    Get currently logged-in user details
 * @access  Private (All authenticated users)
 */
router.get(
    "/current",
    verifyJWT, // Verify JWT token
    getCurrentUser // Controller function
);

/**
 * @route   POST /api/v1/users/change-password
 * @desc    Change user password
 * @access  Private (All authenticated users)
 * @body    { oldPassword, newPassword, confirmPassword }
 */
router.post(
    "/change-password",
    verifyJWT, // Verify JWT token
    checkVerification, // Ensure email is verified for sensitive operations
    validateRequiredFields(['oldPassword', 'newPassword', 'confirmPassword']),
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
    verifyJWT, // Verify JWT token
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
    verifyJWT, // Verify JWT token
    uploadProfilePhoto.single('avatar'), // Handle single file upload with name 'avatar'
    handleUploadError, // Handle upload errors (file size, type, etc.)
    validateUploadedFiles, // Validate uploaded file
    updateUserAvatar // Controller function
);

/**
 * ==========================================
 * ADDITIONAL ROUTES (To be implemented)
 * ==========================================
 */

// Email verification route
// router.post("/verify-email", verifyEmailController);

// Resend verification email
// router.post("/resend-verification", verifyJWT, resendVerificationEmail);

// Forgot password route
// router.post("/forgot-password", forgotPasswordController);

// Reset password route
// router.post("/reset-password", resetPasswordController);

// Phone verification route
// router.post("/verify-phone", verifyJWT, verifyPhoneController);

// Delete account route (soft delete)
// router.delete("/delete-account", verifyJWT, strictRateLimiter, deleteAccountController);

// Get user statistics (for admin dashboard)
// router.get("/statistics", verifyJWT, restrictTo('admin'), getUserStatistics);

// Update user role (admin only)
// router.patch("/:userId/role", verifyJWT, restrictTo('admin'), updateUserRole);

// Deactivate user account (admin only)
// router.patch("/:userId/deactivate", verifyJWT, restrictTo('admin'), deactivateUser);

/**
 * ==========================================
 * ROUTE TESTING & DEBUGGING
 * ==========================================
 * 
 * Test these routes using Postman or any API client:
 * 
 * 1. Register User:
 *    POST http://localhost:8000/api/v1/users/register
 *    Body: { firstName, lastName, email, phoneNumber, password, role }
 * 
 * 2. Login:
 *    POST http://localhost:8000/api/v1/users/login
 *    Body: { email, password }
 * 
 * 3. Get Current User:
 *    GET http://localhost:8000/api/v1/users/current
 *    Headers: Authorization: Bearer {accessToken}
 * 
 * 4. Logout:
 *    POST http://localhost:8000/api/v1/users/logout
 *    Headers: Authorization: Bearer {accessToken}
 * 
 * 5. Update Profile:
 *    PATCH http://localhost:8000/api/v1/users/update-account
 *    Headers: Authorization: Bearer {accessToken}
 *    Body: { firstName, lastName, phoneNumber }
 * 
 * 6. Update Avatar:
 *    PATCH http://localhost:8000/api/v1/users/avatar
 *    Headers: Authorization: Bearer {accessToken}
 *    Body: multipart/form-data with 'avatar' file
 * 
 * 7. Get Doctors List:
 *    GET http://localhost:8000/api/v1/users/doctors?specialization=Cardiology&page=1&limit=10
 * 
 * 8. Change Password:
 *    POST http://localhost:8000/api/v1/users/change-password
 *    Headers: Authorization: Bearer {accessToken}
 *    Body: { oldPassword, newPassword, confirmPassword }
 */

// Export router
export default router;

/**
 * Route Summary:
 * 
 * Public Routes (5):
 * - POST   /register
 * - POST   /login
 * - POST   /refresh-token
 * - GET    /profile/:userId
 * - GET    /doctors
 * 
 * Protected Routes (5):
 * - POST   /logout
 * - GET    /current
 * - POST   /change-password
 * - PATCH  /update-account
 * - PATCH  /avatar
 * 
 * Total Active Routes: 10
 * Additional Routes (Commented): 7
 * 
 * Middleware Usage:
 * - Authentication: verifyJWT, optionalVerifyJWT
 * - Validation: validateEmail, validatePhone, validateDOB, validateRequiredFields
 * - File Upload: uploadProfilePhoto, handleUploadError, validateUploadedFiles
 * - Rate Limiting: rateLimiter, loginRateLimiter, strictRateLimiter
 * - Authorization: restrictTo (for role-based access)
 * - Verification: checkVerification (for email/phone verification)
 */