/**
 * Healthcare System - Admin Controller
 * 
 * Handles administrative operations for healthcare system.
 * 
 * Features:
 * - User management and moderation
 * - System analytics and statistics
 * - Content moderation
 * - System configuration
 * - Audit logs and reporting
 * - Bulk operations
 */

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Patient } from "../models/patient.model.js";
import { Doctor } from "../models/doctor.model.js";
import { Appointment } from "../models/appointment.model.js";
import { Prescription } from "../models/prescription.model.js";
import { MedicalRecord } from "../models/medicalRecord.model.js";
import { LabResult } from "../models/labResult.model.js";
import { Payment } from "../models/payment.model.js";
import { Notification } from "../models/notification.model.js";
import { AuditLog } from "../models/auditLog.model.js";

/**
 * GET DASHBOARD STATISTICS
 * Get comprehensive dashboard statistics for admin
 * 
 * GET /api/v1/admin/dashboard
 * Requires: verifyJWT middleware, admin role
 */
const getDashboardStatistics = asyncHandler(async (req, res) => {
  console.log("📊 Fetching admin dashboard statistics");

  const currentDate = new Date();
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const startOfPreviousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);

  // User Statistics
  const totalUsers = await User.countDocuments();
  const totalPatients = await User.countDocuments({ role: 'patient' });
  const totalDoctors = await User.countDocuments({ role: 'doctor' });
  const totalAdmins = await User.countDocuments({ role: 'admin' });

  const newUsersThisMonth = await User.countDocuments({
    createdAt: { $gte: startOfMonth }
  });

  const activeUsers = await User.countDocuments({
    lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
  });

  // Appointment Statistics
  const totalAppointments = await Appointment.countDocuments();
  const appointmentsThisMonth = await Appointment.countDocuments({
    appointmentDate: { $gte: startOfMonth }
  });

  const appointmentStatusStats = await Appointment.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Payment Statistics
  const totalRevenue = await Payment.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const monthlyRevenue = await Payment.aggregate([
    {
      $match: {
        status: 'completed',
        paidAt: { $gte: startOfMonth }
      }
    },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const previousMonthRevenue = await Payment.aggregate([
    {
      $match: {
        status: 'completed',
        paidAt: {
          $gte: startOfPreviousMonth,
          $lt: startOfMonth
        }
      }
    },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  // Medical Statistics
  const totalPrescriptions = await Prescription.countDocuments();
  const totalMedicalRecords = await MedicalRecord.countDocuments();
  const totalLabResults = await LabResult.countDocuments();

  const criticalLabResults = await LabResult.countDocuments({
    isCritical: true,
    status: { $in: ['completed', 'verified'] }
  });

  // System Health
  const systemUptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  const activeSessions = await User.countDocuments({
    refreshToken: { $exists: true, $ne: null }
  });

  const statistics = {
    users: {
      total: totalUsers,
      patients: totalPatients,
      doctors: totalDoctors,
      admins: totalAdmins,
      newThisMonth: newUsersThisMonth,
      active: activeUsers
    },
    appointments: {
      total: totalAppointments,
      thisMonth: appointmentsThisMonth,
      byStatus: appointmentStatusStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    },
    financial: {
      totalRevenue: totalRevenue[0]?.total || 0,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      previousMonthRevenue: previousMonthRevenue[0]?.total || 0,
      growthRate: previousMonthRevenue[0]?.total ?
        ((monthlyRevenue[0]?.total - previousMonthRevenue[0]?.total) / previousMonthRevenue[0]?.total * 100).toFixed(2) : 0
    },
    medical: {
      prescriptions: totalPrescriptions,
      medicalRecords: totalMedicalRecords,
      labResults: totalLabResults,
      criticalResults: criticalLabResults
    },
    system: {
      uptime: Math.floor(systemUptime),
      memoryUsage: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024)
      },
      activeSessions: activeSessions,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV
    },
    timestamp: new Date()
  };

  console.log('✅ Admin dashboard statistics fetched successfully');

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { statistics },
        "Dashboard statistics fetched successfully"
      )
    );
});

/**
 * GET ALL USERS
 * Get all users with filtering and pagination
 * 
 * GET /api/v1/admin/users
 * Requires: verifyJWT middleware, admin role
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const {
    role,
    status,
    isActive,
    isVerified,
    dateFrom,
    dateTo,
    search,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  console.log("👥 Fetching all users for admin");

  // Build query
  const query = {};

  if (role) query.role = role;
  if (status) query.status = status;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (isVerified !== undefined) query.isEmailVerified = isVerified === 'true';

  // Date range filter
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  // Search filter
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phoneNumber: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const users = await User.find(query)
    .select('-password -refreshToken')
    .populate('patientId')
    .populate('doctorId')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await User.countDocuments(query);

  // Get user statistics
  const roleStats = await User.aggregate([
    { $match: query },
    { $group: { _id: '$role', count: { $sum: 1 } } }
  ]);

  const statusStats = await User.aggregate([
    { $match: query },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  const statistics = {
    byRole: roleStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {}),
    byStatus: statusStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {}),
    totalUsers: total,
    activeUsers: await User.countDocuments({ ...query, isActive: true }),
    verifiedUsers: await User.countDocuments({ ...query, isEmailVerified: true })
  };

  console.log(`✅ Found ${users.length} users`);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          users,
          statistics,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalUsers: total,
            hasNextPage: page * limit < total
          }
        },
        "Users fetched successfully"
      )
    );
});

/**
 * GET USER DETAILS
 * Get detailed information about a specific user
 * 
 * GET /api/v1/admin/users/:userId
 * Requires: verifyJWT middleware, admin role
 */
const getUserDetails = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  console.log("🔍 Fetching user details for:", userId);

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const user = await User.findById(userId)
    .select('-password -refreshToken')
    .populate({
      path: 'patientId',
      populate: [
        { path: 'emergencyContacts' },
        { path: 'allergies' },
        { path: 'currentMedications' }
      ]
    })
    .populate({
      path: 'doctorId',
      populate: [
        { path: 'specialties' },
        { path: 'educations' },
        { path: 'experiences' }
      ]
    })
    .lean();

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Get user activity statistics
  const appointmentStats = await Appointment.aggregate([
    { $match: getRoleBasedQuery(user) },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  const paymentStats = await Payment.aggregate([
    { $match: getRoleBasedQuery(user) },
    { $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } }
  ]);

  const recentActivity = await AuditLog.find({
    userId: userId
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  const userDetails = {
    ...user,
    statistics: {
      appointments: appointmentStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      payments: paymentStats.reduce((acc, stat) => {
        acc[stat._id] = {
          total: stat.total,
          count: stat.count
        };
        return acc;
      }, {})
    },
    recentActivity
  };

  console.log('✅ User details fetched successfully');

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: userDetails },
        "User details fetched successfully"
      )
    );
});

/**
 * UPDATE USER STATUS
 * Update user status (active, suspended, banned)
 * 
 * PATCH /api/v1/admin/users/:userId/status
 * Requires: verifyJWT middleware, admin role
 */
const updateUserStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { status, reason, notes } = req.body;
  const adminId = req.user._id;

  console.log("🔄 Updating user status:", userId, "to:", status);

  if (!userId || !status) {
    throw new ApiError(400, "User ID and status are required");
  }

  // Validate status
  const validStatuses = ['active', 'inactive', 'suspended', 'banned'];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  // Find user
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Cannot modify other admins
  if (user.role === 'admin' && user._id.toString() !== adminId.toString()) {
    throw new ApiError(403, "Cannot modify other admin users");
  }

  const oldStatus = user.status;

  // Update user status
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        status: status,
        isActive: status === 'active',
        updatedAt: new Date()
      }
    },
    { new: true, runValidators: true }
  ).select('-password -refreshToken');

  // Create audit log
  await AuditLog.create({
    action: 'USER_STATUS_UPDATE',
    userId: userId,
    performedBy: adminId,
    details: {
      oldStatus: oldStatus,
      newStatus: status,
      reason: reason,
      notes: notes
    },
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  console.log('✅ User status updated:', userId, 'from', oldStatus, 'to', status);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: updatedUser },
        "User status updated successfully"
      )
    );
});

/**
 * UPDATE USER ROLE
 * Update user role (patient, doctor, admin)
 * 
 * PATCH /api/v1/admin/users/:userId/role
 * Requires: verifyJWT middleware, admin role
 */
const updateUserRole = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role, reason } = req.body;
  const adminId = req.user._id;

  console.log("🎭 Updating user role:", userId, "to:", role);

  if (!userId || !role) {
    throw new ApiError(400, "User ID and role are required");
  }

  // Validate role
  const validRoles = ['patient', 'doctor', 'admin'];
  if (!validRoles.includes(role)) {
    throw new ApiError(400, `Invalid role. Must be one of: ${validRoles.join(', ')}`);
  }

  // Find user
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Cannot modify other admins
  if (user.role === 'admin' && user._id.toString() !== adminId.toString()) {
    throw new ApiError(403, "Cannot modify other admin users");
  }

  const oldRole = user.role;

  // Update user role
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        role: role,
        updatedAt: new Date()
      }
    },
    { new: true, runValidators: true }
  ).select('-password -refreshToken');

  // Create audit log
  await AuditLog.create({
    action: 'USER_ROLE_UPDATE',
    userId: userId,
    performedBy: adminId,
    details: {
      oldRole: oldRole,
      newRole: role,
      reason: reason
    },
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  console.log('✅ User role updated:', userId, 'from', oldRole, 'to', role);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: updatedUser },
        "User role updated successfully"
      )
    );
});

/**
 * DELETE USER
 * Soft delete a user account
 * 
 * DELETE /api/v1/admin/users/:userId
 * Requires: verifyJWT middleware, admin role
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { reason, permanent = false } = req.body;
  const adminId = req.user._id;

  console.log("🗑️ Deleting user:", userId, "Permanent:", permanent);

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  // Find user
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Cannot delete other admins
  if (user.role === 'admin' && user._id.toString() !== adminId.toString()) {
    throw new ApiError(403, "Cannot delete other admin users");
  }

  if (permanent) {
    // Permanent deletion (use with caution)
    await User.findByIdAndDelete(userId);

    // Also delete related records if needed
    await Patient.deleteMany({ userId: userId });
    await Doctor.deleteMany({ userId: userId });
  } else {
    // Soft delete
    await User.findByIdAndUpdate(userId, {
      $set: {
        isActive: false,
        status: 'deleted',
        deletedAt: new Date(),
        deletedBy: adminId
      }
    });
  }

  // Create audit log
  await AuditLog.create({
    action: permanent ? 'USER_PERMANENT_DELETE' : 'USER_SOFT_DELETE',
    userId: userId,
    performedBy: adminId,
    details: {
      permanent: permanent,
      reason: reason,
      userEmail: user.email,
      userRole: user.role
    },
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  console.log('✅ User deleted:', userId, 'Permanent:', permanent);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          message: `User ${permanent ? 'permanently deleted' : 'soft deleted'} successfully`
        },
        "User deleted successfully"
      )
    );
});

/**
 * GET SYSTEM ANALYTICS
 * Get detailed system analytics and reports
 * 
 * GET /api/v1/admin/analytics
 * Requires: verifyJWT middleware, admin role
 */
const getSystemAnalytics = asyncHandler(async (req, res) => {
  const { period = 'month', type = 'overview' } = req.query;

  console.log("📈 Fetching system analytics, period:", period, "type:", type);

  const currentDate = new Date();
  let dateRange = {};

  switch (period) {
    case 'day':
      dateRange.$gte = new Date(currentDate.setHours(0, 0, 0, 0));
      dateRange.$lte = new Date(currentDate.setHours(23, 59, 59, 999));
      break;
    case 'week':
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      dateRange.$gte = startOfWeek;
      dateRange.$lte = new Date();
      break;
    case 'month':
      dateRange.$gte = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      dateRange.$lte = new Date();
      break;
    case 'year':
      dateRange.$gte = new Date(currentDate.getFullYear(), 0, 1);
      dateRange.$lte = new Date();
      break;
    default:
      dateRange.$gte = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      dateRange.$lte = new Date();
  }

  let analytics = {};

  switch (type) {
    case 'overview':
      analytics = await getOverviewAnalytics(dateRange);
      break;
    case 'user-growth':
      analytics = await getUserGrowthAnalytics(dateRange);
      break;
    case 'revenue':
      analytics = await getRevenueAnalytics(dateRange);
      break;
    case 'appointments':
      analytics = await getAppointmentAnalytics(dateRange);
      break;
    default:
      analytics = await getOverviewAnalytics(dateRange);
  }

  console.log('✅ System analytics fetched successfully');

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { analytics },
        "System analytics fetched successfully"
      )
    );
});

/**
 * GET AUDIT LOGS
 * Get system audit logs with filtering
 * 
 * GET /api/v1/admin/audit-logs
 * Requires: verifyJWT middleware, admin role
 */
const getAuditLogs = asyncHandler(async (req, res) => {
  const {
    action,
    userId,
    performedBy,
    dateFrom,
    dateTo,
    page = 1,
    limit = 50,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  console.log("📋 Fetching audit logs");

  // Build query
  const query = {};

  if (action) query.action = action;
  if (userId) query.userId = userId;
  if (performedBy) query.performedBy = performedBy;

  // Date range filter
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const auditLogs = await AuditLog.find(query)
    .populate({
      path: 'userId',
      select: 'firstName lastName email role'
    })
    .populate({
      path: 'performedBy',
      select: 'firstName lastName email role'
    })
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await AuditLog.countDocuments(query);

  // Get action statistics
  const actionStats = await AuditLog.aggregate([
    { $match: query },
    { $group: { _id: '$action', count: { $sum: 1 } } }
  ]);

  const statistics = {
    byAction: actionStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {}),
    totalLogs: total
  };

  console.log(`✅ Found ${auditLogs.length} audit logs`);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          auditLogs,
          statistics,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalLogs: total,
            hasNextPage: page * limit < total
          }
        },
        "Audit logs fetched successfully"
      )
    );
});

/**
 * BULK OPERATIONS
 * Perform bulk operations on users
 * 
 * POST /api/v1/admin/bulk-operations
 * Requires: verifyJWT middleware, admin role
 */
const bulkOperations = asyncHandler(async (req, res) => {
  const {
    operation,
    userIds,
    data
  } = req.body;

  const adminId = req.user._id;

  console.log("⚡ Performing bulk operation:", operation, "on", userIds?.length, "users");

  if (!operation || !userIds || !Array.isArray(userIds)) {
    throw new ApiError(400, "Operation and user IDs array are required");
  }

  if (userIds.length === 0) {
    throw new ApiError(400, "At least one user ID is required");
  }

  if (userIds.length > 1000) {
    throw new ApiError(400, "Cannot perform bulk operations on more than 1000 users at once");
  }

  const validOperations = ['activate', 'deactivate', 'suspend', 'send_notification', 'assign_role'];
  if (!validOperations.includes(operation)) {
    throw new ApiError(400, `Invalid operation. Must be one of: ${validOperations.join(', ')}`);
  }

  const results = {
    total: userIds.length,
    successful: 0,
    failed: 0,
    errors: []
  };

  // Perform bulk operation
  for (const userId of userIds) {
    try {
      switch (operation) {
        case 'activate':
          await User.findByIdAndUpdate(userId, {
            $set: {
              isActive: true,
              status: 'active',
              updatedAt: new Date()
            }
          });
          break;

        case 'deactivate':
          await User.findByIdAndUpdate(userId, {
            $set: {
              isActive: false,
              status: 'inactive',
              updatedAt: new Date()
            }
          });
          break;

        case 'suspend':
          await User.findByIdAndUpdate(userId, {
            $set: {
              isActive: false,
              status: 'suspended',
              updatedAt: new Date()
            }
          });
          break;

        case 'assign_role':
          if (!data?.role) {
            throw new ApiError(400, "Role is required for assign_role operation");
          }
          await User.findByIdAndUpdate(userId, {
            $set: {
              role: data.role,
              updatedAt: new Date()
            }
          });
          break;

        case 'send_notification':
          // Implementation for bulk notifications
          // This would integrate with your notification system
          break;
      }

      results.successful++;

      // Create audit log for each operation
      await AuditLog.create({
        action: `BULK_${operation.toUpperCase()}`,
        userId: userId,
        performedBy: adminId,
        details: {
          operation: operation,
          data: data
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

    } catch (error) {
      results.failed++;
      results.errors.push({
        userId: userId,
        error: error.message
      });
    }
  }

  console.log(`✅ Bulk operation completed: ${results.successful} successful, ${results.failed} failed`);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { results },
        "Bulk operation completed successfully"
      )
    );
});

/**
 * GET SYSTEM HEALTH
 * Get system health and performance metrics
 * 
 * GET /api/v1/admin/system-health
 * Requires: verifyJWT middleware, admin role
 */
const getSystemHealth = asyncHandler(async (req, res) => {
  console.log("🏥 Checking system health");

  // System metrics
  const systemUptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  // Database health check
  const dbStats = await getDatabaseStats();

  // Service status check
  const serviceStatus = await checkServiceStatus();

  // Recent errors from logs (you would integrate with your logging system)
  const recentErrors = await getRecentErrors();

  const healthStatus = {
    system: {
      uptime: Math.floor(systemUptime),
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024)
      },
      cpu: {
        user: Math.round(cpuUsage.user / 1000), // microseconds to milliseconds
        system: Math.round(cpuUsage.system / 1000)
      },
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV
    },
    database: dbStats,
    services: serviceStatus,
    errors: recentErrors,
    timestamp: new Date(),
    overallStatus: 'healthy' // You would determine this based on checks
  };

  console.log('✅ System health check completed');

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { health: healthStatus },
        "System health check completed successfully"
      )
    );
});

// Helper functions

/**
 * Get role-based query for user activity
 */
const getRoleBasedQuery = (user) => {
  if (user.role === 'patient') {
    return { patientId: user.patientId?._id };
  } else if (user.role === 'doctor') {
    return { doctorId: user._id };
  }
  return {};
};

/**
 * Get overview analytics
 */
const getOverviewAnalytics = async (dateRange) => {
  const [
    userGrowth,
    appointmentGrowth,
    revenueGrowth,
    activeDoctors,
    systemLoad
  ] = await Promise.all([
    User.countDocuments({ createdAt: dateRange }),
    Appointment.countDocuments({ createdAt: dateRange }),
    Payment.aggregate([
      { $match: { status: 'completed', paidAt: dateRange } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    User.countDocuments({ role: 'doctor', isActive: true }),
    getSystemLoad()
  ]);

  return {
    userGrowth: userGrowth,
    appointmentGrowth: appointmentGrowth,
    revenueGrowth: revenueGrowth[0]?.total || 0,
    activeDoctors: activeDoctors,
    systemLoad: systemLoad
  };
};

/**
 * Get user growth analytics
 */
const getUserGrowthAnalytics = async (dateRange) => {
  const monthlyGrowth = await User.aggregate([
    { $match: { createdAt: dateRange } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        total: { $sum: 1 },
        patients: {
          $sum: { $cond: [{ $eq: ['$role', 'patient'] }, 1, 0] }
        },
        doctors: {
          $sum: { $cond: [{ $eq: ['$role', 'doctor'] }, 1, 0] }
        }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  return {
    monthlyGrowth: monthlyGrowth.map(item => ({
      period: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      total: item.total,
      patients: item.patients,
      doctors: item.doctors
    }))
  };
};

/**
 * Get revenue analytics
 */
const getRevenueAnalytics = async (dateRange) => {
  const monthlyRevenue = await Payment.aggregate([
    {
      $match: {
        status: 'completed',
        paidAt: dateRange
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$paidAt' },
          month: { $month: '$paidAt' }
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
        average: { $avg: '$amount' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  return {
    monthlyRevenue: monthlyRevenue.map(item => ({
      period: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      total: item.total,
      count: item.count,
      average: item.average
    }))
  };
};

/**
 * Get appointment analytics
 */
const getAppointmentAnalytics = async (dateRange) => {
  const appointmentStats = await Appointment.aggregate([
    { $match: { createdAt: dateRange } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const typeStats = await Appointment.aggregate([
    { $match: { createdAt: dateRange } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 }
      }
    }
  ]);

  return {
    byStatus: appointmentStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {}),
    byType: typeStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {})
  };
};

/**
 * Get database statistics
 */
const getDatabaseStats = async () => {
  // This would be implemented based on your database
  // For MongoDB, you might use db.stats()
  return {
    status: 'connected',
    collections: 10, // Example count
    size: '2.5 GB', // Example size
    lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000) // Example
  };
};

/**
 * Check service status
 */
const checkServiceStatus = async () => {
  // Implement checks for external services
  return {
    database: 'healthy',
    emailService: 'healthy',
    paymentGateway: 'healthy',
    fileStorage: 'healthy'
  };
};

/**
 * Get recent errors
 */
const getRecentErrors = async () => {
  // Integrate with your logging system
  return [];
};

/**
 * Get system load
 */
const getSystemLoad = async () => {
  // Implement system load calculation
  return {
    loadAverage: [1.5, 1.2, 1.0], // Example load averages
    responseTime: '125ms' // Example response time
  };
};

// Export all admin controller functions
export {
  getDashboardStatistics,
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getSystemAnalytics,
  getAuditLogs,
  bulkOperations,
  getSystemHealth
};

/**
 * Additional admin controllers that can be added:
 * - exportData (export users, appointments, etc. to CSV/Excel)
 * - manageSystemSettings (update system configuration)
 * - backupDatabase (initiate database backups)
 * - clearCache (clear system caches)
 * - manageContent (manage static content, FAQs, etc.)
 * - viewErrorLogs (access detailed error logs)
 * - manageApiKeys (manage API keys for integrations)
 * - systemMaintenance (put system in maintenance mode)
 */