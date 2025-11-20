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
 * - Extended profile CRUD operations (create, add allergy, medication, insurance)
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
   ✏️ UPDATE PATIENT PROFILE
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
  if (status) query.status = status;
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

  const dashboardData = {
    patientSummary: {
      bloodGroup: patient.bloodGroup,
      height: patient.height,
      weight: patient.weight,
      bmi: patient.bmi,
      lastHealthCheck: patient.lastHealthCheck,
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
    healthMetrics: patient.healthMetrics?.slice(0, 10) || [],
  };

  return res
    .status(200)
    .json(new ApiResponse(200, dashboardData, "Patient dashboard data fetched successfully"));
});
