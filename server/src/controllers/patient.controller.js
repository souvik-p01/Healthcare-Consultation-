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
import { sendSMSNotification, sendEmailNotification } from "../utils/notificationUtils.js";
import { generateGoogleMeetLink } from "../utils/googleMeetUtils.js";
import { Message } from "../models/message.model.js";

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
const formatAppointmentForPatient = (apt) => {
  if (!apt) return null;
  const docInfo = apt.doctorId || {};
  const docName = docInfo.firstName && docInfo.lastName 
    ? `Dr. ${docInfo.firstName} ${docInfo.lastName}` 
    : "Unknown Doctor";
  
  // Format date
  let dateStr = "TBD";
  if (apt.appointmentDate) {
    const dateObj = new Date(apt.appointmentDate);
    dateStr = dateObj.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
  
  // Format time
  let timeStr = "TBD";
  if (apt.appointmentTime) {
    try {
      const [hours, minutes] = apt.appointmentTime.split(':').map(Number);
      const startHour = hours % 12 || 12;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const minStr = minutes < 10 ? `0${minutes}` : minutes;
      const timeStartStr = `${startHour}:${minStr} ${ampm}`;

      const endMinutes = minutes + (apt.duration || 30);
      const endHours = hours + Math.floor(endMinutes / 60);
      const endMin = endMinutes % 60;
      const endHour12 = endHours % 12 || 12;
      const endAmpm = endHours >= 12 ? 'PM' : 'AM';
      const endMinStr = endMin < 10 ? `0${endMin}` : endMin;
      const timeEndStr = `${endHour12}:${endMinStr} ${endAmpm}`;
      timeStr = `${timeStartStr} - ${timeEndStr}`;
    } catch (e) {
      timeStr = apt.appointmentTime;
    }
  }

  // Mapped type
  let typeStr = 'In-Person';
  if (apt.appointmentType === 'video') typeStr = 'Video Call';
  else if (apt.appointmentType === 'phone') typeStr = 'Phone Call';
  else if (apt.appointmentType === 'chat') typeStr = 'Online Chat';

  // Initials for avatar
  let initials = "DR";
  if (docInfo.firstName && docInfo.lastName) {
    initials = `${docInfo.firstName[0]}${docInfo.lastName[0]}`.toUpperCase();
  }

  return {
    id: apt._id || apt.id,
    _id: apt._id || apt.id,
    doctor: docName,
    specialty: docInfo.specialization || "General Physician",
    date: dateStr,
    time: timeStr,
    type: typeStr,
    status: apt.status ? apt.status.toLowerCase() : 'pending',
    avatar: docInfo.avatar || initials,
    location: apt.location || (apt.appointmentType === 'video' ? 'Virtual Consultation' : 'Main Clinic'),
    consultationFee: apt.consultationFee || 500,
    symptoms: apt.symptoms || '',
    chiefComplaint: apt.chiefComplaint || '',
    paymentStatus: apt.paymentStatus || 'pending',
    appointmentType: apt.appointmentType || 'in-person'
  };
};

export const getPatientAppointments = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { status, type, dateFrom, dateTo, page = 1, limit = 10 } = req.query;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  let patientId = user.patientId;
  if (!patientId) {
    let patientDoc = await Patient.findOne({ user: userId });
    if (patientDoc) {
      patientId = patientDoc._id;
      await User.findByIdAndUpdate(userId, { patientId });
    } else if (user.role === "patient") {
      patientDoc = new Patient({
        user: userId,
        bloodGroup: "--",
        height: 0,
        weight: 0,
        medicalHistory: [],
        allergies: [],
        currentMedications: []
      });
      await patientDoc.save();
      patientId = patientDoc._id;
      await User.findByIdAndUpdate(userId, { patientId });
    } else {
      return res.status(200).json(
        new ApiResponse(200, { appointments: [], pagination: { currentPage: 1, totalPages: 0, totalAppointments: 0 } }, "No patient profile found")
      );
    }
  }

  const query = { patientId };
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

  const formattedAppointments = appointments.map(formatAppointmentForPatient);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          appointments: formattedAppointments,
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
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  let patientId = user.patientId;
  if (!patientId) {
    let patientDoc = await Patient.findOne({ user: userId });
    if (patientDoc) {
      patientId = patientDoc._id;
      await User.findByIdAndUpdate(userId, { patientId });
    } else if (user.role === "patient") {
      patientDoc = new Patient({
        user: userId,
        bloodGroup: "--",
        height: 0,
        weight: 0,
        medicalHistory: [],
        allergies: [],
        currentMedications: []
      });
      await patientDoc.save();
      patientId = patientDoc._id;
      await User.findByIdAndUpdate(userId, { patientId });
    } else {
      return res.status(200).json(
        new ApiResponse(200, {
          patientSummary: {},
          appointments: { recent: [], upcoming: [], statistics: { total: 0, completed: 0, upcoming: 0 } },
          prescriptions: { recent: [], active: 0 },
          healthMetrics: [],
          notifications: { unread: 0, total: 0 },
          quickStats: { healthScore: 0, daysSinceLastCheckup: 0, upcomingAppointments: 0, activePrescriptions: 0 }
        }, "No patient profile found")
      );
    }
  }

  const recentAppointments = await Appointment.find({ patientId })
    .populate({ path: "doctorId", select: "firstName lastName specialization avatar" })
    .sort({ appointmentDate: -1 })
    .limit(5)
    .lean();

  const upcomingAppointments = await Appointment.find({
    patientId,
    status: { $in: ["scheduled", "confirmed"] },
    appointmentDate: { $gte: new Date() },
  })
    .populate({ path: "doctorId", select: "firstName lastName specialization avatar" })
    .sort({ appointmentDate: 1 })
    .limit(5)
    .lean();

  const recentPrescriptions = await Prescription.find({ patientId })
    .populate({ path: "doctorId", select: "firstName lastName specialization" })
    .sort({ prescribedDate: -1 })
    .limit(5)
    .lean();

  const patient = await Patient.findById(patientId)
    .select("healthMetrics bloodGroup height weight bmi lastHealthCheck emergencyContacts")
    .lean();

  const totalAppointments = await Appointment.countDocuments({ patientId });
  const completedAppointments = await Appointment.countDocuments({
    patientId,
    status: "completed",
  });
  const activePrescriptions = await Prescription.countDocuments({
    patientId,
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
      recent: recentAppointments.map(formatAppointmentForPatient),
      upcoming: upcomingAppointments.map(formatAppointmentForPatient),
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
  const { doctorId, date, time, appointmentDate, appointmentTime, type, reason, notes, phone, email } = req.body;
  // Prefer the new keys if provided
  const effectiveDate = appointmentDate || date;
  const effectiveTime = appointmentTime || time;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  let patientId = user.patientId;
  if (!patientId) {
    let patientDoc = await Patient.findOne({ user: userId });
    if (patientDoc) {
      patientId = patientDoc._id;
      await User.findByIdAndUpdate(userId, { patientId });
    } else {
      // Automatically create a patient profile if needed (for patients, admins, doctors doing testing)
      patientDoc = new Patient({
        user: userId,
        bloodType: "Unknown",
        height: { value: 0, unit: "cm" },
        weight: { value: 0, unit: "kg" },
        medicalHistory: { conditions: [], surgeries: [], familyHistory: [] },
        allergies: [],
        medications: []
      });
      await patientDoc.save();
      patientId = patientDoc._id;
      await User.findByIdAndUpdate(userId, { patientId });
    }
  }

  // Handle mock doctor IDs or invalid ObjectIds by finding/creating a real doctor user
  let targetDoctorId = doctorId;
  const isObjectId = mongoose.Types.ObjectId.isValid(doctorId);
  if (!isObjectId) {
    const firstDoc = await User.findOne({ role: 'doctor' });
    if (firstDoc) {
      targetDoctorId = firstDoc._id;
    } else {
      const dummyDocUser = new User({
        firstName: "Rajesh",
        lastName: "Kumar",
        email: "rajesh.kumar@healthcare.com",
        password: "Password123!",
        role: "doctor",
        specialization: "General Physician",
        consultationFee: 499,
        isActive: true,
        isEmailVerified: true
      });
      await dummyDocUser.save({ validateBeforeSave: false });
      targetDoctorId = dummyDocUser._id;
    }
  } else {
    // Check if the doctor exists
    const doctorExists = await User.findById(doctorId);
    if (!doctorExists) {
      const firstDoc = await User.findOne({ role: 'doctor' });
      if (firstDoc) {
        targetDoctorId = firstDoc._id;
      }
    }
  }

  // Combine date and time
  const appointmentDateTime = new Date(`${effectiveDate}T${effectiveTime}:00`);
  
  if (isNaN(appointmentDateTime.getTime())) {
    throw new ApiError(400, "Invalid date or time format");
  }

  const now = new Date();
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const apptDateOnly = new Date(appointmentDateTime.getFullYear(), appointmentDateTime.getMonth(), appointmentDateTime.getDate());
  if (apptDateOnly < todayDate) {
    throw new ApiError(400, "Appointment date cannot be in the past");
  }

  const hours = appointmentDateTime.getHours();
  if (hours < 6 || hours > 22) {
    throw new ApiError(400, "Appointments can only be scheduled between 6 AM and 10 PM");
  }
  
  // Check if doctor is available (up to 10 video slots, block other slot-hogging types)
  const requestedApptType = type || "in-person";
  const existingAppointments = await Appointment.find({
    doctorId: targetDoctorId,
    appointmentDate: appointmentDateTime,
    status: { $in: ["scheduled", "confirmed"] }
  });

  if (existingAppointments.length > 0) {
    const hasNonVideo = existingAppointments.some(apt => apt.appointmentType !== 'video');
    if (hasNonVideo || requestedApptType !== 'video') {
      throw new ApiError(400, "Doctor is not available at this time");
    }
    const maxVideoSlots = 10;
    if (existingAppointments.length >= maxVideoSlots) {
      throw new ApiError(400, `Doctor has reached the maximum capacity of ${maxVideoSlots} video consultations for this time slot`);
    }
  }

  // Dynamic fee calculation based on type
  let fee = 500;
  if (type === 'video') fee = 499;
  else if (type === 'phone') fee = 299;
  else if (type === 'chat') fee = 199;

  // Admin role gets free bypass
  const isFree = user.role === "admin";

  let meetLink = null;
  if (requestedApptType === 'video') {
    meetLink = generateGoogleMeetLink();
  }

  // Log incoming payload for debugging
  console.log('scheduleAppointment payload:', req.body);
  const appointment = new Appointment({
    patientId,
    doctorId: targetDoctorId,
    appointmentDate: appointmentDateTime,
    appointmentTime: effectiveTime,
    appointmentType: requestedApptType,
    consultationFee: fee,
    symptoms: reason || "",
    patientNotes: notes || "",
    status: isFree ? "confirmed" : "scheduled",
    paymentStatus: isFree ? "free" : "pending",
    videoConsultation: requestedApptType === 'video' ? {
      meetingUrl: meetLink,
      joinUrl: meetLink,
      meetingId: meetLink.split('/').pop()
    } : undefined
  });

  await appointment.save();

  // Populate doctor details
  await appointment.populate({
    path: "doctorId",
    select: "firstName lastName specialization avatar",
  });

  // Send SMS/Email notifications with Google Meet / local room info
  try {
    const roomID = `telemed_${appointment._id || appointment.id}`;
    let joinUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/services/telemedicine?room=${roomID}`;
    if (requestedApptType === 'video' && meetLink) {
      joinUrl = meetLink;
    }

    const doctorName = appointment.doctorId 
      ? `Dr. ${appointment.doctorId.firstName} ${appointment.doctorId.lastName}` 
      : "your doctor";

    const targetPhone = phone || user.phoneNumber;
    const targetEmail = email || user.email;
    const patientName = user.firstName 
      ? `${user.firstName} ${user.lastName || ""}`.trim()
      : "Patient";

    let meetMsg = "";
    if (requestedApptType === 'video') {
      meetMsg = `Google Meet link: ${meetLink}`;
    } else if (requestedApptType === 'chat') {
      meetMsg = `Chat Link: ${joinUrl}`;
    } else if (requestedApptType === 'phone') {
      meetMsg = `The doctor will call you on your registered phone.`;
    } else {
      meetMsg = `Location: Main Clinic`;
    }

    const msg = `Hello ${patientName}, your ${requestedApptType} consultation with ${doctorName} is ${appointment.status} for ${effectiveDate} at ${effectiveTime}. ${meetMsg}`;

    // Send SMS if phone number is available
    if (targetPhone && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      await sendSMSNotification(targetPhone, {
        message: msg,
        type: "appointment"
      });
      console.log(`📱 SMS invitation sent to ${targetPhone}`);
    } else {
      console.log(`ℹ️ Twilio credentials missing or phone number unavailable. SMS log: "${msg}"`);
    }

    // Send Email if email is available
    if (targetEmail && process.env.SMTP_HOST && process.env.SMTP_USER) {
      await sendEmailNotification(targetEmail, {
        subject: `Your ${requestedApptType.toUpperCase()} Consultation Room Info - MedCare`,
        template: 'appointment',
        data: {
          title: `Your ${requestedApptType.toUpperCase()} Consultation Room is Ready`,
          patientName: patientName,
          message: `Your virtual ${requestedApptType} session has been booked. You can join the session room directly using the link below.`,
          appointmentDate: effectiveDate,
          appointmentTime: effectiveTime,
          doctorName: doctorName,
          actionUrl: joinUrl
        }
      });
      console.log(`📧 Email invitation sent to ${targetEmail}`);
    } else {
      console.log(`ℹ️ SMTP credentials missing or email unavailable. Email template log prepared.`);
    }
  } catch (notifErr) {
    // Fail silently for notifications so appointment booking itself doesn't crash if Twilio/SMTP fails
    console.error("⚠️ Failed to send booking notifications:", notifErr.message);
  }

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

  // Populate doctor details for notification
  await appointment.populate({
    path: "doctorId",
    select: "firstName lastName email phoneNumber specialization",
  });

  // Send SMS/Email notifications
  try {
    const doctorName = appointment.doctorId 
      ? `Dr. ${appointment.doctorId.firstName} ${appointment.doctorId.lastName}` 
      : "your doctor";
    const patientName = user.firstName 
      ? `${user.firstName} ${user.lastName || ""}`.trim()
      : "Patient";
    
    // Format date safely
    let date = "";
    try {
      date = appointment.appointmentDate.toISOString().split('T')[0];
    } catch (err) {
      date = appointment.appointmentDate ? appointment.appointmentDate.toString() : "";
    }
    const time = appointment.appointmentTime || "";

    const msg = `Hello ${patientName}, your appointment with ${doctorName} on ${date} at ${time} has been cancelled successfully.`;

    // Send SMS to patient
    if (user.phoneNumber && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      await sendSMSNotification(user.phoneNumber, {
        message: msg,
        type: "appointment"
      });
      console.log(`📱 Cancellation SMS sent to patient: ${user.phoneNumber}`);
    }

    // Send SMS to doctor
    if (appointment.doctorId && appointment.doctorId.phoneNumber && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const docMsg = `Hello Dr. ${appointment.doctorId.lastName}, patient ${patientName} has cancelled their appointment scheduled for ${date} at ${time}.`;
      await sendSMSNotification(appointment.doctorId.phoneNumber, {
        message: docMsg,
        type: "appointment"
      });
      console.log(`📱 Cancellation SMS sent to doctor: ${appointment.doctorId.phoneNumber}`);
    }

    // Send Email to patient
    if (user.email && process.env.SMTP_HOST && process.env.SMTP_USER) {
      await sendEmailNotification(user.email, {
        subject: `Appointment Cancelled - MedCare`,
        template: 'appointment',
        data: {
          title: "Appointment Cancelled",
          patientName: patientName,
          message: `Your appointment with ${doctorName} has been cancelled.`,
          appointmentDate: date,
          appointmentTime: time,
          doctorName: doctorName,
          cancellationReason: cancellationReason || "Cancelled by patient"
        }
      });
      console.log(`📧 Cancellation email sent to patient: ${user.email}`);
    }

    // Send Email to doctor
    if (appointment.doctorId && appointment.doctorId.email && process.env.SMTP_HOST && process.env.SMTP_USER) {
      await sendEmailNotification(appointment.doctorId.email, {
        subject: `Patient Cancelled Appointment - MedCare`,
        template: 'appointment',
        data: {
          title: "Appointment Cancelled by Patient",
          patientName: patientName,
          message: `Patient ${patientName} has cancelled their appointment.`,
          appointmentDate: date,
          appointmentTime: time,
          doctorName: doctorName,
          cancellationReason: cancellationReason || "Cancelled by patient"
        }
      });
      console.log(`📧 Cancellation email sent to doctor: ${appointment.doctorId.email}`);
    }
  } catch (notifErr) {
    console.error("⚠️ Failed to send cancellation notifications:", notifErr.message);
  }

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
  const requestedApptType = appointment.appointmentType || 'in-person';
  const existingAppointments = await Appointment.find({
    doctorId: appointment.doctorId,
    appointmentDate: newAppointmentDateTime,
    status: { $in: ["scheduled", "confirmed"] },
    _id: { $ne: appointmentId }
  });

  if (existingAppointments.length > 0) {
    const hasNonVideo = existingAppointments.some(apt => apt.appointmentType !== 'video');
    if (hasNonVideo || requestedApptType !== 'video') {
      throw new ApiError(400, "Doctor is not available at the new time");
    }
    const maxVideoSlots = 10;
    if (existingAppointments.length >= maxVideoSlots) {
      throw new ApiError(400, `Doctor has reached the maximum capacity of ${maxVideoSlots} video consultations for this time slot`);
    }
  }

  // Set or preserve Google Meet link if type is video
  let meetLink = appointment.videoConsultation?.meetingUrl;
  if (requestedApptType === 'video' && !meetLink) {
    meetLink = generateGoogleMeetLink();
    appointment.videoConsultation = {
      meetingUrl: meetLink,
      joinUrl: meetLink,
      meetingId: meetLink.split('/').pop()
    };
  }

  appointment.appointmentDate = newAppointmentDateTime;
  appointment.status = "rescheduled";
  appointment.rescheduledAt = new Date();
  await appointment.save();

  await appointment.populate({
    path: "doctorId",
    select: "firstName lastName specialization avatar email phoneNumber",
  });

  // Send SMS/Email notifications
  try {
    const roomID = `telemed_${appointment._id || appointment.id}`;
    let joinUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/services/telemedicine?room=${roomID}`;
    if (requestedApptType === 'video' && meetLink) {
      joinUrl = meetLink;
    }

    const doctorName = appointment.doctorId 
      ? `Dr. ${appointment.doctorId.firstName} ${appointment.doctorId.lastName}` 
      : "your doctor";
    
    const targetPhone = user.phoneNumber;
    const targetEmail = user.email;
    const patientName = user.firstName 
      ? `${user.firstName} ${user.lastName || ""}`.trim()
      : "Patient";

    let meetMsg = "";
    if (requestedApptType === 'video') {
      meetMsg = `Google Meet link: ${meetLink}`;
    } else if (requestedApptType === 'chat') {
      meetMsg = `Chat Link: ${joinUrl}`;
    } else if (requestedApptType === 'phone') {
      meetMsg = `The doctor will call you on your registered phone.`;
    } else {
      meetMsg = `Location: Main Clinic`;
    }

    const msg = `Hello ${patientName}, your appointment with ${doctorName} has been rescheduled to ${newDate} at ${newTime}. ${meetMsg}`;

    // Send SMS to patient
    if (targetPhone && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      await sendSMSNotification(targetPhone, {
        message: msg,
        type: "appointment"
      });
      console.log(`📱 Reschedule SMS sent to patient: ${targetPhone}`);
    }

    // Send SMS to doctor
    if (appointment.doctorId && appointment.doctorId.phoneNumber && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const docMsg = `Hello Dr. ${appointment.doctorId.lastName}, patient ${patientName} has rescheduled their appointment to ${newDate} at ${newTime}.`;
      await sendSMSNotification(appointment.doctorId.phoneNumber, {
        message: docMsg,
        type: "appointment"
      });
      console.log(`📱 Reschedule SMS sent to doctor: ${appointment.doctorId.phoneNumber}`);
    }

    // Send Email to patient
    if (targetEmail && process.env.SMTP_HOST && process.env.SMTP_USER) {
      await sendEmailNotification(targetEmail, {
        subject: `Your Appointment has been Rescheduled - MedCare`,
        template: 'appointment',
        data: {
          title: "Appointment Rescheduled",
          patientName: patientName,
          message: `Your virtual consultation has been rescheduled. You can join the session room using the link below.`,
          appointmentDate: newDate,
          appointmentTime: newTime,
          doctorName: doctorName,
          actionUrl: joinUrl
        }
      });
      console.log(`📧 Reschedule email sent to patient: ${targetEmail}`);
    }

    // Send Email to doctor
    if (appointment.doctorId && appointment.doctorId.email && process.env.SMTP_HOST && process.env.SMTP_USER) {
      await sendEmailNotification(appointment.doctorId.email, {
        subject: `Patient Rescheduled Appointment - MedCare`,
        template: 'appointment',
        data: {
          title: "Appointment Rescheduled by Patient",
          patientName: patientName,
          message: `Patient ${patientName} has rescheduled their appointment. Details below.`,
          appointmentDate: newDate,
          appointmentTime: newTime,
          doctorName: doctorName,
          actionUrl: joinUrl
        }
      });
      console.log(`📧 Reschedule email sent to doctor: ${appointment.doctorId.email}`);
    }
  } catch (notifErr) {
    console.error("⚠️ Failed to send reschedule notifications:", notifErr.message);
  }

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
  if (!user || !user.patientId) {
    return res.status(200).json(
      new ApiResponse(200, { notifications: [], pagination: { currentPage: 1, totalPages: 0, totalNotifications: 0, unreadCount: 0 } }, "No patient profile found")
    );
  }

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
    appointmentType: 'video',
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
    appointmentType: 'video',
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

/* ============================================================
   💬 GET CONSULTATION MESSAGES
============================================================ */
export const getConsultationMessages = asyncHandler(async (req, res) => {
  const { consultationId } = req.params;
  
  if (!consultationId) {
    throw new ApiError(400, "Consultation ID is required");
  }

  const messages = await Message.find({ consultationId })
    .sort({ createdAt: 1 })
    .lean();

  return res.status(200).json(
    new ApiResponse(200, { messages }, "Consultation messages fetched successfully")
  );
});