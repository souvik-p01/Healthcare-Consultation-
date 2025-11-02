/**
 * Healthcare System - Admin Routes
 * 
 * Admin-only routes for system management and oversight
 * All routes require authentication and admin role
 * 
 * Base path: /api/v1/admin
 */

import { Router } from "express";
import {
    getDashboardStats,
    getAllUsers,
    getUserById,
    updateUserStatus,
    deleteUser,
    getAllDoctors,
    approveDoctorVerification,
    rejectDoctorVerification,
    getAllAppointments,
    getAppointmentById,
    cancelAppointment,
    getSystemLogs,
    getSystemSettings,
    updateSystemSettings,
    exportData,
    getAnalytics,
    generateReport
} from "../controllers/admin.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/roleAuth.middleware.js";

const router = Router();

/**
 * ==========================================
 * MIDDLEWARE - All admin routes require authentication and admin role
 * ==========================================
 */
router.use(verifyJWT);
router.use(authorizeRoles("admin"));

/**
 * ==========================================
 * DASHBOARD & ANALYTICS
 * ==========================================
 */

/**
 * @route   GET /api/v1/admin/dashboard
 * @desc    Get admin dashboard statistics
 * @access  Admin only
 * @returns {Object} Dashboard stats including user counts, appointments, revenue, etc.
 */
router.get("/dashboard", getDashboardStats);

/**
 * @route   GET /api/v1/admin/analytics
 * @desc    Get detailed analytics data
 * @access  Admin only
 * @query   {String} period - Time period (day, week, month, year)
 * @query   {String} metric - Specific metric to analyze
 */
router.get("/analytics", getAnalytics);

/**
 * @route   POST /api/v1/admin/reports/generate
 * @desc    Generate custom reports
 * @access  Admin only
 * @body    {String} reportType - Type of report (users, appointments, revenue, etc.)
 * @body    {Date} startDate - Start date for report
 * @body    {Date} endDate - End date for report
 */
router.post("/reports/generate", generateReport);

/**
 * ==========================================
 * USER MANAGEMENT
 * ==========================================
 */

/**
 * @route   GET /api/v1/admin/users
 * @desc    Get all users with pagination and filters
 * @access  Admin only
 * @query   {Number} page - Page number (default: 1)
 * @query   {Number} limit - Items per page (default: 10)
 * @query   {String} role - Filter by role (patient, doctor, admin)
 * @query   {String} status - Filter by status (active, inactive, suspended)
 * @query   {String} search - Search by name or email
 */
router.get("/users", getAllUsers);

/**
 * @route   GET /api/v1/admin/users/:userId
 * @desc    Get detailed user information by ID
 * @access  Admin only
 */
router.get("/users/:userId", getUserById);

/**
 * @route   PATCH /api/v1/admin/users/:userId/status
 * @desc    Update user status (activate, deactivate, suspend)
 * @access  Admin only
 * @body    {String} status - New status (active, inactive, suspended)
 * @body    {String} reason - Reason for status change
 */
router.patch("/users/:userId/status", updateUserStatus);

/**
 * @route   DELETE /api/v1/admin/users/:userId
 * @desc    Permanently delete a user account
 * @access  Admin only
 * @warning This action is irreversible
 */
router.delete("/users/:userId", deleteUser);

/**
 * ==========================================
 * DOCTOR MANAGEMENT & VERIFICATION
 * ==========================================
 */

/**
 * @route   GET /api/v1/admin/doctors
 * @desc    Get all doctors with filters
 * @access  Admin only
 * @query   {String} verificationStatus - Filter by verification (pending, verified, rejected)
 * @query   {String} specialization - Filter by specialization
 * @query   {Number} page - Page number
 * @query   {Number} limit - Items per page
 */
router.get("/doctors", getAllDoctors);

/**
 * @route   POST /api/v1/admin/doctors/:doctorId/verify
 * @desc    Approve doctor verification
 * @access  Admin only
 * @body    {String} notes - Verification notes
 */
router.post("/doctors/:doctorId/verify", approveDoctorVerification);

/**
 * @route   POST /api/v1/admin/doctors/:doctorId/reject
 * @desc    Reject doctor verification
 * @access  Admin only
 * @body    {String} reason - Rejection reason
 * @body    {String} notes - Additional notes
 */
router.post("/doctors/:doctorId/reject", rejectDoctorVerification);

/**
 * ==========================================
 * APPOINTMENT MANAGEMENT
 * ==========================================
 */

/**
 * @route   GET /api/v1/admin/appointments
 * @desc    Get all appointments with filters
 * @access  Admin only
 * @query   {String} status - Filter by status
 * @query   {Date} startDate - Filter by start date
 * @query   {Date} endDate - Filter by end date
 * @query   {Number} page - Page number
 * @query   {Number} limit - Items per page
 */
router.get("/appointments", getAllAppointments);

/**
 * @route   GET /api/v1/admin/appointments/:appointmentId
 * @desc    Get detailed appointment information
 * @access  Admin only
 */
router.get("/appointments/:appointmentId", getAppointmentById);

/**
 * @route   POST /api/v1/admin/appointments/:appointmentId/cancel
 * @desc    Cancel an appointment (admin override)
 * @access  Admin only
 * @body    {String} reason - Cancellation reason
 */
router.post("/appointments/:appointmentId/cancel", cancelAppointment);

/**
 * ==========================================
 * SYSTEM MANAGEMENT
 * ==========================================
 */

/**
 * @route   GET /api/v1/admin/system/logs
 * @desc    Get system logs and activity
 * @access  Admin only
 * @query   {String} level - Log level (info, warning, error)
 * @query   {Date} startDate - Start date
 * @query   {Date} endDate - End date
 * @query   {Number} page - Page number
 * @query   {Number} limit - Items per page
 */
router.get("/system/logs", getSystemLogs);

/**
 * @route   GET /api/v1/admin/system/settings
 * @desc    Get system settings
 * @access  Admin only
 */
router.get("/system/settings", getSystemSettings);

/**
 * @route   PATCH /api/v1/admin/system/settings
 * @desc    Update system settings
 * @access  Admin only
 * @body    {Object} settings - Settings to update
 */
router.patch("/system/settings", updateSystemSettings);

/**
 * ==========================================
 * DATA EXPORT
 * ==========================================
 */

/**
 * @route   POST /api/v1/admin/export
 * @desc    Export data in various formats (CSV, JSON, PDF)
 * @access  Admin only
 * @body    {String} dataType - Type of data to export (users, appointments, etc.)
 * @body    {String} format - Export format (csv, json, pdf)
 * @body    {Date} startDate - Start date for data range
 * @body    {Date} endDate - End date for data range
 * @body    {Object} filters - Additional filters
 */
router.post("/export", exportData);

/**
 * ==========================================
 * EXPORT ROUTES
 * ==========================================
 */
export default router;

/**
 * ==========================================
 * ROUTE SUMMARY
 * ==========================================
 * 
 * Dashboard & Analytics (3 routes):
 *   - GET  /dashboard              → Dashboard stats
 *   - GET  /analytics              → Detailed analytics
 *   - POST /reports/generate       → Generate reports
 * 
 * User Management (4 routes):
 *   - GET    /users                → List all users
 *   - GET    /users/:userId        → Get user details
 *   - PATCH  /users/:userId/status → Update user status
 *   - DELETE /users/:userId        → Delete user
 * 
 * Doctor Management (3 routes):
 *   - GET  /doctors                → List all doctors
 *   - POST /doctors/:doctorId/verify → Verify doctor
 *   - POST /doctors/:doctorId/reject → Reject doctor
 * 
 * Appointment Management (3 routes):
 *   - GET  /appointments                      → List appointments
 *   - GET  /appointments/:appointmentId       → Get appointment details
 *   - POST /appointments/:appointmentId/cancel → Cancel appointment
 * 
 * System Management (3 routes):
 *   - GET   /system/logs      → Get system logs
 *   - GET   /system/settings  → Get settings
 *   - PATCH /system/settings  → Update settings
 * 
 * Data Export (1 route):
 *   - POST /export            → Export data
 * 
 * Total: 17 routes
 * 
 * ==========================================
 * TESTING WITH POSTMAN/CURL
 * ==========================================
 * 
 * 1. Get Dashboard Stats:
 *    GET http://localhost:8000/api/v1/admin/dashboard
 *    Headers: Authorization: Bearer <admin_token>
 * 
 * 2. Get All Users:
 *    GET http://localhost:8000/api/v1/admin/users?page=1&limit=10&role=patient
 *    Headers: Authorization: Bearer <admin_token>
 * 
 * 3. Verify Doctor:
 *    POST http://localhost:8000/api/v1/admin/doctors/123/verify
 *    Headers: Authorization: Bearer <admin_token>
 *    Body: { "notes": "All credentials verified" }
 * 
 * 4. Update User Status:
 *    PATCH http://localhost:8000/api/v1/admin/users/456/status
 *    Headers: Authorization: Bearer <admin_token>
 *    Body: { "status": "suspended", "reason": "Violation of terms" }
 * 
 * 5. Export Data:
 *    POST http://localhost:8000/api/v1/admin/export
 *    Headers: Authorization: Bearer <admin_token>
 *    Body: { 
 *      "dataType": "users", 
 *      "format": "csv",
 *      "startDate": "2025-01-01",
 *      "endDate": "2025-01-31"
 *    }
 */