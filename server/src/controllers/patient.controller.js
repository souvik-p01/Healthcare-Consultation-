/**
 * Healthcare System - Patient Controller
 *
 * Handles patient-specific operations in the healthcare consultation system.
 * 
 * Features:
 * - Patient profile management
 * - Medical records access
 * - Appointment management
 * - Prescription viewing
 * - Health metrics tracking
 * - Emergency contact management
 * - Extended profile CRUD operations
 */

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/User.model.js";
import { Patient } from "../models/Patient.model.js";
import { Appointment } from "../models/appointment.model.js";
import { Prescription } from "../models/prescription.model.js";
import { MedicalRecord } from "../models/medicalRecord.model.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";

/* ============================================================
   📌 CREATE PATIENT PROFILE
============================================================ */
export const createPatientProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const patientData = req.body;

  const existingPatient = await Patient.findOne({ user: userId });
  if (existingPatient) {
    throw new ApiError(400, "Patient profile already exists");
  }

  const patient = new Patient({ user: userId, ...patientData });
  await patient.save();

  await User.findByIdAndUpdate(userId, { role: "patient", patientId: patient._id });

  return res
    .status(201)
    .json(new ApiResponse(201, { patient }, "Patient profile created successfully"));
});

/* ============================================================
   📋 GET PATIENT PROFILE (Detailed)
============================================================ */
export const getPatientProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId)
    .select("-password -refreshToken")
    .populate({
      path: "patientId",
      populate: [
        { path: "emergencyContacts" },
        { path: "allergies" },
        { path: "currentMedications" },
      ],
    })
    .lean();

  if (!user) throw new ApiError(404, "User not found");
  if (!user.patientId) throw new ApiError(404, "Patient profile not found");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user, patient: user.patientId },
        "Patient profile fetched successfully"
      )
    );
});

/* ============================================================
   ✏ UPDATE PATIENT PROFILE
============================================================ */
export const updatePatientProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const updateData = req.body;

  const user = await User.findById(userId);
  if (!user || !user.patientId) throw new ApiError(404, "Patient profile not found");

  const updatedPatient = await Patient.findByIdAndUpdate(
    user.patientId,
    { $set: updateData },
    { new: true, runValidators: true }
  ).populate("emergencyContacts allergies currentMedications");

  return res
    .status(200)
    .json(
      new ApiResponse(200, { patient: updatedPatient }, "Patient profile updated successfully")
    );
});

/* ============================================================
   💊 ADD ALLERGY
============================================================ */
export const addAllergy = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { allergy } = req.body;

  const user = await User.findById(userId);
  if (!user || !user.patientId) throw new ApiError(404, "Patient not found");

  const updatedPatient = await Patient.findByIdAndUpdate(
    user.patientId,
    { $push: { allergies: allergy } },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, { patient: updatedPatient }, "Allergy added successfully"));
});

/* ============================================================
   💊 ADD MEDICATION
============================================================ */
export const addMedication = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { medication } = req.body;

  const user = await User.findById(userId);
  if (!user || !user.patientId) throw new ApiError(404, "Patient not found");

  const updatedPatient = await Patient.findByIdAndUpdate(
    user.patientId,
    { $push: { medications: medication } },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, { patient: updatedPatient }, "Medication added successfully"));
});

/* ============================================================
   🚑 UPDATE EMERGENCY CONTACT
============================================================ */
export const updateEmergencyContact = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { emergencyContact } = req.body;

  const user = await User.findById(userId);
  if (!user || !user.patientId) throw new ApiError(404, "Patient not found");

  const updatedPatient = await Patient.findByIdAndUpdate(
    user.patientId,
    { emergencyContact },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, { patient: updatedPatient }, "Emergency contact updated successfully")
    );
});

/* ============================================================
   🧾 UPDATE INSURANCE
============================================================ */
export const updateInsurance = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { insurance } = req.body;

  const user = await User.findById(userId);
  if (!user || !user.patientId) throw new ApiError(404, "Patient not found");

  const updatedPatient = await Patient.findByIdAndUpdate(
    user.patientId,
    { insurance },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, { patient: updatedPatient }, "Insurance information updated successfully")
    );
});

/* ============================================================
   🩺 GET MEDICAL HISTORY
============================================================ */
export const getMedicalHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId);
  if (!user || !user.patientId) throw new ApiError(404, "Patient not found");

  const patient = await Patient.findById(user.patientId)
    .select("medicalHistory allergies medications")
    .populate("medicalHistory.appointments");

  if (!patient) throw new ApiError(404, "Medical history not found");

  return res
    .status(200)
    .json(
      new ApiResponse(200, { medicalHistory: patient }, "Medical history retrieved successfully")
    );
});

/* ============================================================
   📅 GET PATIENT APPOINTMENTS
============================================================ */
export const getPatientAppointments = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { status, type, dateFrom, dateTo, page = 1, limit = 10 } = req.query;

  const user = await User.findById(userId);
  if (!user || !user.patientId) throw new ApiError(404, "Patient not found");

  const query = { patientId: user.patientId };
  if (status) {
    if (Array.isArray(status)) {
      query.status = { $in: status };
    } else {
      query.status = status;
    }
  }
  if (type) query.type = type;
  if (dateFrom || dateTo) {
    query.appointmentDate = {};
    if (dateFrom) query.appointmentDate.$gte = new Date(dateFrom);
    if (dateTo) query.appointmentDate.$lte = new Date(dateTo);
  }

  const skip = (page - 1) * limit;

  const appointments = await Appointment.find(query)
    .populate({
      path: "doctorId",
      select: "firstName lastName specialization qualification avatar",
    })
    .sort({ appointmentDate: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Appointment.countDocuments(query);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          appointments,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalAppointments: total,
          },
        },
        "Appointments fetched successfully"
      )
    );
});

/* ============================================================
   📊 PATIENT DASHBOARD
============================================================ */
export const getPatientDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId);
  if (!user || !user.patientId) throw new ApiError(404, "Patient not found");

  const recentAppointments = await Appointment.find({ patientId: user.patientId })
    .populate({ path: "doctorId", select: "firstName lastName specialization avatar" })
    .sort({ appointmentDate: -1 })
    .limit(5)
    .lean();

  const upcomingAppointments = await Appointment.find({
    patientId: user.patientId,
    status: { $in: ["scheduled", "confirmed"] },
    appointmentDate: { $gte: new Date() },
  })
    .populate({ path: "doctorId", select: "firstName lastName specialization avatar" })
    .sort({ appointmentDate: 1 })
    .limit(5)
    .lean();

  const recentPrescriptions = await Prescription.find({ patientId: user.patientId })
    .populate({ path: "doctorId", select: "firstName lastName specialization" })
    .sort({ prescribedDate: -1 })
    .limit(5)
    .lean();

  const patient = await Patient.findById(user.patientId)
    .select("healthMetrics bloodGroup height weight bmi lastHealthCheck emergencyContacts")
    .lean();

  const totalAppointments = await Appointment.countDocuments({ patientId: user.patientId });
  const completedAppointments = await Appointment.countDocuments({
    patientId: user.patientId,
    status: "completed",
  });
  const activePrescriptions = await Prescription.countDocuments({
    patientId: user.patientId,
    status: "active",
  });

  // Get health metrics with recent values
  const recentHealthMetrics = patient.healthMetrics
    ? patient.healthMetrics.slice(-10).reverse()
    : [];

  const dashboardData = {
    patientSummary: {
      bloodGroup: patient.bloodGroup,
      height: patient.height,
      weight: patient.weight,
      bmi: patient.bmi,
      lastHealthCheck: patient.lastHealthCheck,
      memberSince: user.createdAt?.getFullYear() || new Date().getFullYear(),
    },
    appointments: {
      recent: recentAppointments,
      upcoming: upcomingAppointments,
      statistics: {
        total: totalAppointments,
        completed: completedAppointments,
        upcoming: upcomingAppointments.length,
      },
    },
    prescriptions: {
      recent: recentPrescriptions,
      active: activePrescriptions,
    },
    healthMetrics: recentHealthMetrics,
    notifications: {
      unread: 3, // This should come from a Notification model
      total: 10,
    },
    quickStats: {
      healthScore: calculateHealthScore(patient),
      daysSinceLastCheckup: calculateDaysSince(patient.lastHealthCheck),
      upcomingAppointments: upcomingAppointments.length,
      activePrescriptions: activePrescriptions,
    },
  };

  return res
    .status(200)
    .json(new ApiResponse(200, dashboardData, "Patient dashboard data fetched successfully"));
});

/* ============================================================
   💊 GET PATIENT PRESCRIPTIONS
============================================================ */
export const getPatientPrescriptions = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { status, page = 1, limit = 10 } = req.query;

  const user = await User.findById(userId);
  if (!user || !user.patientId) throw new ApiError(404, "Patient not found");

  const query = { patientId: user.patientId };
  if (status) query.status = status;

  const skip = (page - 1) * limit;

  const prescriptions = await Prescription.find(query)
    .populate({
      path: "doctorId",
      select: "firstName lastName specialization",
    })
    .sort({ prescribedDate: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Prescription.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(200, {
      prescriptions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalPrescriptions: total,
      },
    }, "Prescriptions fetched successfully")
  );
});

/* ============================================================
   📅 SCHEDULE APPOINTMENT
============================================================ */
export const scheduleAppointment = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { doctorId, date, time, type, reason, notes } = req.body;

  const user = await User.findById(userId);
  if (!user || !user.patientId) throw new ApiError(404, "Patient not found");

  // Combine date and time
  const appointmentDateTime = new Date(`${date}T${time}:00`);
  
  // Check if doctor is available (you would implement this logic)
  const existingAppointment = await Appointment.findOne({
    doctorId,
    appointmentDate: appointmentDateTime,
    status: { $in: ["scheduled", "confirmed"] }
  });
  
  if (existingAppointment) {
    throw new ApiError(400, "Doctor is not available at this time");
  }

  const appointment = new Appointment({
    patientId: user.patientId,
    doctorId,
    appointmentDate: appointmentDateTime,
    type: type || "in-person",
    reason,
    notes,
    status: "pending",
  });

  await appointment.save();

  // Populate doctor details
  await appointment.populate({
    path: "doctorId",
    select: "firstName lastName specialization avatar",
  });

  return res.status(201).json(
    new ApiResponse(201, { appointment }, "Appointment scheduled successfully")
  );
});

/* ============================================================
   📅 CANCEL APPOINTMENT
============================================================ */
export const cancelAppointment = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { appointmentId } = req.params;
  const { cancellationReason } = req.body;

  const user = await User.findById(userId);
  if (!user || !user.patientId) throw new ApiError(404, "Patient not found");

  const appointment = await Appointment.findOne({
    _id: appointmentId,
    patientId: user.patientId,
  });

  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  if (["cancelled", "completed"].includes(appointment.status)) {
    throw new ApiError(400, `Appointment is already ${appointment.status}`);
  }

  // Check if appointment is within cancellation window (e.g., 24 hours)
  const hoursUntilAppointment = (appointment.appointmentDate - new Date()) / (1000 * 60 * 60);
  if (hoursUntilAppointment < 24) {
    throw new ApiError(400, "Appointment cannot be cancelled within 24 hours");
  }

  appointment.status = "cancelled";
  appointment.cancellationReason = cancellationReason;
  appointment.cancelledAt = new Date();
  await appointment.save();

  return res.status(200).json(
    new ApiResponse(200, { appointment }, "Appointment cancelled successfully")
  );
});

/* ============================================================
   📅 RESCHEDULE APPOINTMENT
============================================================ */
export const rescheduleAppointment = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { appointmentId } = req.params;
  const { newDate, newTime } = req.body;

  const user = await User.findById(userId);
  if (!user || !user.patientId) throw new ApiError(404, "Patient not found");

  const appointment = await Appointment.findOne({
    _id: appointmentId,
    patientId: user.patientId,
  });

  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  if (["cancelled", "completed"].includes(appointment.status)) {
    throw new ApiError(400, `Cannot reschedule a ${appointment.status} appointment`);
  }

  const newAppointmentDateTime = new Date(`${newDate}T${newTime}:00`);
  
  // Check if new time is available
  const conflictingAppointment = await Appointment.findOne({
    doctorId: appointment.doctorId,
    appointmentDate: newAppointmentDateTime,
    status: { $in: ["scheduled", "confirmed"] },
    _id: { $ne: appointmentId }
  });
  
  if (conflictingAppointment) {
    throw new ApiError(400, "Doctor is not available at the new time");
  }

  appointment.appointmentDate = newAppointmentDateTime;
  appointment.status = "rescheduled";
  appointment.rescheduledAt = new Date();
  await appointment.save();

  await appointment.populate({
    path: "doctorId",
    select: "firstName lastName specialization avatar",
  });

  return res.status(200).json(
    new ApiResponse(200, { appointment }, "Appointment rescheduled successfully")
  );
});

/* ============================================================
   📊 GET PATIENT NOTIFICATIONS
============================================================ */
export const getPatientNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20, unreadOnly } = req.query;

  const user = await User.findById(userId);
  if (!user || !user.patientId) throw new ApiError(404, "Patient not found");

  // In a real system, you would have a Notification model
  // This is a placeholder implementation
  const notifications = [
    {
      id: 1,
      title: 'Appointment Reminder',
      desc: 'Dr. Sarah Johnson at 2:00 PM',
      time: '10 min ago',
      read: false,
      type: 'appointment'
    },
    {
      id: 2,
      title: 'Lab Results Ready',
      desc: 'Blood test results available',
      time: '1 hour ago',
      read: false,
      type: 'lab'
    },
    {
      id: 3,
      title: 'Prescription Refill',
      desc: 'Medication ready for pickup',
      time: '2 hours ago',
      read: true,
      type: 'pharmacy'
    }
  ];

  // Filter unread if requested
  let filteredNotifications = notifications;
  if (unreadOnly === 'true') {
    filteredNotifications = notifications.filter(n => !n.read);
  }

  const total = filteredNotifications.length;
  const skip = (page - 1) * limit;
  const paginatedNotifications = filteredNotifications.slice(skip, skip + parseInt(limit));

  return res.status(200).json(
    new ApiResponse(200, {
      notifications: paginatedNotifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalNotifications: total,
        unreadCount: notifications.filter(n => !n.read).length,
      },
    }, "Notifications fetched successfully")
  );
});

/* ============================================================
   🔔 MARK NOTIFICATION AS READ
============================================================ */
export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { notificationId } = req.params;

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  // In a real system, you would update the Notification model
  // This is a placeholder response
  return res.status(200).json(
    new ApiResponse(200, {}, "Notification marked as read")
  );
});

/* ============================================================
   📈 UPDATE HEALTH METRICS
============================================================ */
export const updateHealthMetrics = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { heartRate, bloodPressure, bloodSugar, weight, temperature, notes } = req.body;

  const user = await User.findById(userId);
  if (!user || !user.patientId) throw new ApiError(404, "Patient not found");

  const patient = await Patient.findById(user.patientId);
  
  // Add to health metrics history
  const newMetric = {
    timestamp: new Date(),
    heartRate: heartRate ? parseInt(heartRate) : null,
    bloodPressure: bloodPressure || null,
    bloodSugar: bloodSugar ? parseFloat(bloodSugar) : null,
    weight: weight ? parseFloat(weight) : null,
    temperature: temperature ? parseFloat(temperature) : null,
    notes: notes || '',
  };

  if (!patient.healthMetrics) patient.healthMetrics = [];
  patient.healthMetrics.push(newMetric);
  
  // Keep only last 100 entries
  if (patient.healthMetrics.length > 100) {
    patient.healthMetrics = patient.healthMetrics.slice(-100);
  }

  // Update patient's last health check
  patient.lastHealthCheck = new Date();
  
  // If weight is provided, update patient weight
  if (weight) {
    patient.weight = { value: weight, unit: 'kg' };
  }

  await patient.save();

  return res.status(200).json(
    new ApiResponse(200, { 
      metrics: patient.healthMetrics.slice(-10).reverse(),
      latestMetric: newMetric 
    }, "Health metrics updated successfully")
  );
});

/* ============================================================
   🚑 GET EMERGENCY CONTACTS
============================================================ */
export const getEmergencyContacts = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId);
  if (!user || !user.patientId) throw new ApiError(404, "Patient not found");

  const patient = await Patient.findById(user.patientId).select("emergencyContacts");

  return res.status(200).json(
    new ApiResponse(200, { 
      emergencyContacts: patient.emergencyContacts || [],
      primaryContact: patient.emergencyContacts?.find(ec => ec.isPrimary) || null
    }, "Emergency contacts fetched successfully")
  );
});

/* ============================================================
   💊 REQUEST PRESCRIPTION REFILL
============================================================ */
export const requestPrescriptionRefill = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { prescriptionId } = req.params;
  const { pharmacyId, notes } = req.body;

  const user = await User.findById(userId);
  if (!user || !user.patientId) throw new ApiError(404, "Patient not found");

  const prescription = await Prescription.findOne({
    _id: prescriptionId,
    patientId: user.patientId,
  });

  if (!prescription) {
    throw new ApiError(404, "Prescription not found");
  }

  if (prescription.status !== 'active') {
    throw new ApiError(400, "Only active prescriptions can be refilled");
  }

  // In a real system, you would create a refill request
  // This is a placeholder implementation
  const refillRequest = {
    prescriptionId: prescription._id,
    patientId: user.patientId,
    pharmacyId,
    notes,
    status: 'pending',
    requestedAt: new Date(),
    estimatedReadyTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
  };

  return res.status(201).json(
    new ApiResponse(201, { refillRequest }, "Prescription refill requested successfully")
  );
});

/* ============================================================
   🏥 GET TELEMEDICINE SESSIONS
============================================================ */
export const getTelemedicineSessions = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { status, page = 1, limit = 10 } = req.query;

  const user = await User.findById(userId);
  if (!user || !user.patientId) throw new ApiError(404, "Patient not found");

  // In a real system, you would have a TelemedicineSession model
  // This is a placeholder implementation
  const telemedicineSessions = await Appointment.find({
    patientId: user.patientId,
    type: 'video',
  })
  .populate({
    path: "doctorId",
    select: "firstName lastName specialization avatar",
  })
  .sort({ appointmentDate: -1 })
  .skip((page - 1) * limit)
  .limit(parseInt(limit))
  .lean();

  const total = await Appointment.countDocuments({
    patientId: user.patientId,
    type: 'video',
  });

  return res.status(200).json(
    new ApiResponse(200, {
      sessions: telemedicineSessions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalSessions: total,
      },
    }, "Telemedicine sessions fetched successfully")
  );
});

/* ============================================================
   🏥 SCHEDULE TELEMEDICINE SESSION
============================================================ */
export const scheduleTelemedicineSession = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { doctorId, date, time, reason, notes } = req.body;

  const user = await User.findById(userId);
  if (!user || !user.patientId) throw new ApiError(404, "Patient not found");

  const appointmentDateTime = new Date(`${date}T${time}:00`);

  const appointment = new Appointment({
    patientId: user.patientId,
    doctorId,
    appointmentDate: appointmentDateTime,
    type: "video",
    reason,
    notes,
    status: "pending",
    meetingLink: generateMeetingLink(), // You would implement this
  });

  await appointment.save();

  await appointment.populate({
    path: "doctorId",
    select: "firstName lastName specialization avatar",
  });

  return res.status(201).json(
    new ApiResponse(201, { appointment }, "Telemedicine session scheduled successfully")
  );
});

/* ============================================================
   🏥 JOIN TELEMEDICINE SESSION
============================================================ */
export const joinTelemedicineSession = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { sessionId } = req.params;

  const user = await User.findById(userId);
  if (!user || !user.patientId) throw new ApiError(404, "Patient not found");

  const appointment = await Appointment.findOne({
    _id: sessionId,
    patientId: user.patientId,
    type: 'video',
  });

  if (!appointment) {
    throw new ApiError(404, "Session not found");
  }

  if (appointment.status !== 'confirmed') {
    throw new ApiError(400, "Session is not confirmed");
  }

  const now = new Date();
  const sessionTime = new Date(appointment.appointmentDate);
  const timeDiff = (sessionTime - now) / (1000 * 60); // minutes

  // Allow joining 10 minutes before and 30 minutes after scheduled time
  if (timeDiff > 10 || timeDiff < -30) {
    throw new ApiError(400, "Cannot join session at this time");
  }

  return res.status(200).json(
    new ApiResponse(200, { 
      meetingLink: appointment.meetingLink,
      sessionDetails: appointment 
    }, "Session join details retrieved successfully")
  );
});

/* ============================================================
   📄 UPLOAD PATIENT DOCUMENT
============================================================ */
export const uploadPatientDocument = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { documentType, description } = req.body;
  
  const user = await User.findById(userId);
  if (!user || !user.patientId) throw new ApiError(404, "Patient not found");

  const documentLocalPath = req.files?.document?.[0]?.path;
  if (!documentLocalPath) {
    throw new ApiError(400, "Document file is required");
  }

  const document = await uploadOnCloudinary(documentLocalPath);
  if (!document?.url) {
    throw new ApiError(500, "Failed to upload document");
  }

  // In a real system, you would save this to a Document model
  const documentData = {
    documentType: documentType || 'medical_record',
    description: description || '',
    fileUrl: document.url,
    fileName: req.files.document[0].originalname,
    fileType: req.files.document[0].mimetype,
    fileSize: req.files.document[0].size,
    uploadedAt: new Date(),
  };

  return res.status(201).json(
    new ApiResponse(201, { document: documentData }, "Document uploaded successfully")
  );
});

/* ============================================================
   📄 GET PATIENT DOCUMENTS
============================================================ */
export const getPatientDocuments = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { type, page = 1, limit = 10 } = req.query;

  const user = await User.findById(userId);
  if (!user || !user.patientId) throw new ApiError(404, "Patient not found");

  // In a real system, you would query a Document model
  // This is a placeholder response
  const documents = [
    {
      id: 1,
      name: 'Blood Test Results',
      type: 'lab_report',
      date: '2024-02-10',
      size: '2.5 MB',
      url: '#',
      doctor: 'Dr. Sarah Johnson'
    },
    {
      id: 2,
      name: 'MRI Scan Report',
      type: 'imaging',
      date: '2024-01-25',
      size: '15.2 MB',
      url: '#',
      doctor: 'Dr. Michael Chen'
    }
  ];

  let filteredDocs = documents;
  if (type) {
    filteredDocs = documents.filter(doc => doc.type === type);
  }

  const total = filteredDocs.length;
  const skip = (page - 1) * limit;
  const paginatedDocs = filteredDocs.slice(skip, skip + parseInt(limit));

  return res.status(200).json(
    new ApiResponse(200, {
      documents: paginatedDocs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalDocuments: total,
      },
    }, "Documents fetched successfully")
  );
});

/* ============================================================
   📄 DELETE PATIENT DOCUMENT
============================================================ */
export const deletePatientDocument = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { documentId } = req.params;

  const user = await User.findById(userId);
  if (!user || !user.patientId) throw new ApiError(404, "Patient not found");

  // In a real system, you would delete from Document model and Cloudinary
  // This is a placeholder implementation
  return res.status(200).json(
    new ApiResponse(200, {}, "Document deleted successfully")
  );
});

/* ============================================================
   💰 GET PATIENT BILLING
============================================================ */
export const getPatientBilling = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { status, page = 1, limit = 10 } = req.query;

  const user = await User.findById(userId);
  if (!user || !user.patientId) throw new ApiError(404, "Patient not found");

  // In a real system, you would query a Billing/Invoice model
  // This is a placeholder response
  const invoices = [
    {
      id: 'INV-2024-001',
      date: '2024-02-01',
      amount: 150.00,
      status: 'paid',
      description: 'Consultation Fee - Dr. Sarah Johnson'
    },
    {
      id: 'INV-2024-002',
      date: '2024-02-15',
      amount: 75.50,
      status: 'pending',
      description: 'Lab Tests'
    }
  ];

  let filteredInvoices = invoices;
  if (status) {
    filteredInvoices = invoices.filter(inv => inv.status === status);
  }

  const total = filteredInvoices.length;
  const skip = (page - 1) * limit;
  const paginatedInvoices = filteredInvoices.slice(skip, skip + parseInt(limit));

  // Calculate totals
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidAmount = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
  const pendingAmount = invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0);

  return res.status(200).json(
    new ApiResponse(200, {
      invoices: paginatedInvoices,
      summary: {
        totalAmount,
        paidAmount,
        pendingAmount,
        totalInvoices: total,
        paidInvoices: invoices.filter(inv => inv.status === 'paid').length,
        pendingInvoices: invoices.filter(inv => inv.status === 'pending').length,
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalInvoices: total,
      },
    }, "Billing information fetched successfully")
  );
});

/* ============================================================
   💰 MAKE PAYMENT
============================================================ */
export const makePayment = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { invoiceId, amount, paymentMethod, cardDetails } = req.body;

  const user = await User.findById(userId);
  if (!user || !user.patientId) throw new ApiError(404, "Patient not found");

  // In a real system, you would integrate with a payment gateway
  // This is a placeholder implementation
  const payment = {
    invoiceId,
    amount,
    paymentMethod,
    status: 'completed',
    transactionId: `TXN${Date.now()}`,
    paidAt: new Date(),
  };

  return res.status(200).json(
    new ApiResponse(200, { payment }, "Payment processed successfully")
  );
});

/* ============================================================
   🏥 GET HEALTH TIPS
============================================================ */
export const getHealthTips = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { category, limit = 5 } = req.query;

  const user = await User.findById(userId);
  if (!user || !user.patientId) throw new ApiError(404, "Patient not found");

  const patient = await Patient.findById(user.patientId);
  
  // Personalized health tips based on patient data
  let tips = [
    {
      id: 1,
      title: "Stay Hydrated",
      content: "Drink at least 8 glasses of water daily to maintain optimal health.",
      category: "general",
      relevance: "high"
    },
    {
      id: 2,
      title: "Regular Exercise",
      content: "Aim for 30 minutes of moderate exercise most days of the week.",
      category: "fitness",
      relevance: "medium"
    },
    {
      id: 3,
      title: "Balanced Diet",
      content: "Include fruits, vegetables, and whole grains in your daily meals.",
      category: "nutrition",
      relevance: "high"
    }
  ];

  // Filter by category if specified
  if (category) {
    tips = tips.filter(tip => tip.category === category);
  }

  // Limit number of tips
  tips = tips.slice(0, parseInt(limit));

  return res.status(200).json(
    new ApiResponse(200, { tips }, "Health tips fetched successfully")
  );
});

/* ============================================================
   📝 SUBMIT FEEDBACK
============================================================ */
export const submitFeedback = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { type, rating, comments, doctorId, appointmentId } = req.body;

  const user = await User.findById(userId);
  if (!user || !user.patientId) throw new ApiError(404, "Patient not found");

  // In a real system, you would save to a Feedback model
  const feedback = {
    patientId: user.patientId,
    type: type || 'general',
    rating: rating || 5,
    comments,
    doctorId,
    appointmentId,
    submittedAt: new Date(),
    status: 'submitted'
  };

  return res.status(201).json(
    new ApiResponse(201, { feedback }, "Feedback submitted successfully")
  );
});

/* ============================================================
   📊 GET PATIENT STATISTICS
============================================================ */
export const getPatientStatistics = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId);
  if (!user || !user.patientId) throw new ApiError(404, "Patient not found");

  const patient = await Patient.findById(user.patientId);
  
  // Appointments statistics
  const totalAppointments = await Appointment.countDocuments({ patientId: user.patientId });
  const completedAppointments = await Appointment.countDocuments({ 
    patientId: user.patientId, 
    status: 'completed' 
  });
  const upcomingAppointments = await Appointment.countDocuments({ 
    patientId: user.patientId, 
    status: { $in: ['scheduled', 'confirmed'] },
    appointmentDate: { $gte: new Date() }
  });
  const cancelledAppointments = await Appointment.countDocuments({ 
    patientId: user.patientId, 
    status: 'cancelled' 
  });

  // Prescriptions statistics
  const totalPrescriptions = await Prescription.countDocuments({ patientId: user.patientId });
  const activePrescriptions = await Prescription.countDocuments({ 
    patientId: user.patientId, 
    status: 'active' 
  });

  // Health metrics statistics
  const recentMetrics = patient.healthMetrics?.slice(-30) || [];
  const avgHeartRate = recentMetrics.length > 0 
    ? Math.round(recentMetrics.reduce((sum, m) => sum + (m.heartRate || 0), 0) / recentMetrics.length)
    : null;

  const statistics = {
    appointments: {
      total: totalAppointments,
      completed: completedAppointments,
      upcoming: upcomingAppointments,
      cancelled: cancelledAppointments,
      completionRate: totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0,
    },
    prescriptions: {
      total: totalPrescriptions,
      active: activePrescriptions,
      refilled: 0, // You would track this
    },
    health: {
      avgHeartRate: avgHeartRate,
      lastCheckupDays: patient.lastHealthCheck 
        ? Math.floor((new Date() - patient.lastHealthCheck) / (1000 * 60 * 60 * 24))
        : null,
      bmi: patient.bmi,
      bmiCategory: patient.bmiCategory,
    },
    engagement: {
      daysSinceRegistration: Math.floor((new Date() - user.createdAt) / (1000 * 60 * 60 * 24)),
      documentsUploaded: 0, // You would track this
      feedbackSubmitted: 0, // You would track this
    }
  };

  return res.status(200).json(
    new ApiResponse(200, { statistics }, "Patient statistics fetched successfully")
  );
});

/* ============================================================
   ⚙️ UPDATE PATIENT PREFERENCES
============================================================ */
export const updatePatientPreferences = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { 
    notificationPreferences, 
    communicationPreferences, 
    privacySettings,
    language,
    timezone 
  } = req.body;

  const user = await User.findById(userId);
  if (!user || !user.patientId) throw new ApiError(404, "Patient not found");

  const patient = await Patient.findById(user.patientId);
  
  // Initialize preferences if not exists
  if (!patient.preferences) {
    patient.preferences = {};
  }

  // Update preferences
  if (notificationPreferences) {
    patient.preferences.notifications = {
      ...patient.preferences.notifications,
      ...notificationPreferences
    };
  }
  
  if (communicationPreferences) {
    patient.preferences.communication = {
      ...patient.preferences.communication,
      ...communicationPreferences
    };
  }
  
  if (privacySettings) {
    patient.preferences.privacy = {
      ...patient.preferences.privacy,
      ...privacySettings
    };
  }
  
  if (language) patient.preferences.language = language;
  if (timezone) patient.preferences.timezone = timezone;

  await patient.save();

  return res.status(200).json(
    new ApiResponse(200, { preferences: patient.preferences }, "Preferences updated successfully")
  );
});

/* ============================================================
   🚨 EMERGENCY ALERT
============================================================ */
export const sendEmergencyAlert = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { location, symptoms, additionalInfo } = req.body;

  const user = await User.findById(userId);
  if (!user || !user.patientId) throw new ApiError(404, "Patient not found");

  const patient = await Patient.findById(user.patientId).populate('emergencyContacts');

  // In a real system, you would:
  // 1. Notify emergency services
  // 2. Alert emergency contacts
  // 3. Send location to ambulance
  // 4. Create emergency record

  const emergencyAlert = {
    patientId: user.patientId,
    patientName: `${user.firstName} ${user.lastName}`,
    location: location || 'Unknown',
    symptoms: symptoms || 'Emergency assistance needed',
    additionalInfo: additionalInfo || '',
    triggeredAt: new Date(),
    status: 'active',
    emergencyContactsNotified: patient.emergencyContacts?.map(ec => ({
      name: ec.name,
      phone: ec.phone,
      notified: false // In real system, you would actually send notifications
    })) || []
  };

  return res.status(200).json(
    new ApiResponse(200, { 
      emergencyAlert,
      message: "Emergency alert sent. Help is on the way!" 
    }, "Emergency alert sent successfully")
  );
});

/* ============================================================
   🔧 HELPER FUNCTIONS
============================================================ */

// Helper function to calculate health score
const calculateHealthScore = (patient) => {
  let score = 75; // Base score
  
  // Adjust based on BMI
  if (patient.bmi) {
    if (patient.bmi >= 18.5 && patient.bmi <= 24.9) {
      score += 10; // Normal weight
    } else if (patient.bmi < 18.5 || patient.bmi > 30) {
      score -= 15; // Underweight or obese
    } else {
      score -= 5; // Overweight
    }
  }

  // Adjust based on recent health check
  if (patient.lastHealthCheck) {
    const daysSinceCheck = (new Date() - patient.lastHealthCheck) / (1000 * 60 * 60 * 24);
    if (daysSinceCheck < 90) {
      score += 5; // Recent checkup
    } else if (daysSinceCheck > 365) {
      score -= 10; // Overdue for checkup
    }
  }

  // Adjust for chronic conditions
  if (patient.medicalHistory?.conditions) {
    const chronicConditions = patient.medicalHistory.conditions.filter(
      condition => condition.status === 'chronic' || condition.status === 'active'
    ).length;
    score -= chronicConditions * 5;
  }

  // Adjust for allergies
  if (patient.allergies?.some(allergy => allergy.isActive && allergy.severity === 'severe')) {
    score -= 10;
  }

  // Ensure score is between 0 and 100
  return Math.min(Math.max(score, 0), 100);
};

// Helper function to calculate days since
const calculateDaysSince = (date) => {
  if (!date) return null;
  return Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
};

// Helper function to generate meeting link
const generateMeetingLink = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let meetingId = '';
  for (let i = 0; i < 10; i++) {
    meetingId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `https://telemedicine.example.com/join/${meetingId}`;
};