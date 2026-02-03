import { Router } from "express";
import { verifyJWT, verifyPatientAccess } from "../middlewares/auth.middleware.js";
import {
  createPatientProfile,
  getPatientProfile,
  updatePatientProfile,
  addAllergy,
  addMedication,
  updateEmergencyContact,
  updateInsurance,
  getMedicalHistory,
  getPatientAppointments,
  getPatientDashboard,
  uploadPatientDocument,
  deletePatientDocument,
  getPatientDocuments,
  updateHealthMetrics,
  getPatientPrescriptions,
  scheduleAppointment,
  cancelAppointment,
  rescheduleAppointment,
  getEmergencyContacts,
  updatePatientPreferences,
  getPatientNotifications,
  markNotificationAsRead,
  requestPrescriptionRefill,
  getPatientBilling,
  makePayment,
  getTelemedicineSessions,
  scheduleTelemedicineSession,
  joinTelemedicineSession,
  getHealthTips,
  submitFeedback,
  getPatientStatistics
} from "../controllers/patient.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// ==================== PROFILE MANAGEMENT ====================
router.post("/create-profile", verifyJWT, createPatientProfile);
router.get("/profile", verifyJWT, getPatientProfile);
router.patch("/profile", verifyJWT, updatePatientProfile);

// ==================== MEDICAL INFORMATION ====================
router.post("/allergies", verifyJWT, addAllergy);
router.get("/allergies", verifyJWT, getPatientProfile); // Included in profile
router.delete("/allergies/:allergyId", verifyJWT, async (req, res) => {
  // Add allergy deletion logic
});

router.post("/medications", verifyJWT, addMedication);
router.get("/medications", verifyJWT, getPatientProfile); // Included in profile
router.delete("/medications/:medicationId", verifyJWT, async (req, res) => {
  // Add medication deletion logic
});

router.get("/medical-history", verifyJWT, getMedicalHistory);
router.post("/medical-history/condition", verifyJWT, async (req, res) => {
  // Add condition logic
});

// ==================== APPOINTMENTS ====================
router.get("/appointments", verifyJWT, getPatientAppointments);
router.post("/appointments/schedule", verifyJWT, scheduleAppointment);
router.post("/appointments/:appointmentId/cancel", verifyJWT, cancelAppointment);
router.post("/appointments/:appointmentId/reschedule", verifyJWT, rescheduleAppointment);
router.get("/appointments/upcoming", verifyJWT, (req, res) => {
  // Filter for upcoming appointments
  req.query.status = "scheduled,confirmed";
  return getPatientAppointments(req, res);
});
router.get("/appointments/past", verifyJWT, (req, res) => {
  // Filter for past appointments
  req.query.status = "completed,cancelled";
  return getPatientAppointments(req, res);
});

// ==================== PRESCRIPTIONS ====================
router.get("/prescriptions", verifyJWT, getPatientPrescriptions);
router.get("/prescriptions/active", verifyJWT, (req, res) => {
  req.query.status = "active";
  return getPatientPrescriptions(req, res);
});
router.post("/prescriptions/:prescriptionId/refill", verifyJWT, requestPrescriptionRefill);
router.get("/prescriptions/:prescriptionId", verifyJWT, async (req, res) => {
  // Get single prescription
});

// ==================== DASHBOARD & ANALYTICS ====================
router.get("/dashboard", verifyJWT, getPatientDashboard);
router.get("/statistics", verifyJWT, getPatientStatistics);
router.get("/health-metrics", verifyJWT, (req, res) => {
  // Extract from profile or separate endpoint
});
router.post("/health-metrics", verifyJWT, updateHealthMetrics);
router.get("/health-tips", verifyJWT, getHealthTips);

// ==================== DOCUMENTS & RECORDS ====================
router.post("/documents/upload", 
  verifyJWT, 
  upload.fields([
    { name: 'document', maxCount: 1 },
    { name: 'report', maxCount: 1 },
    { name: 'image', maxCount: 5 }
  ]), 
  uploadPatientDocument
);
router.get("/documents", verifyJWT, getPatientDocuments);
router.delete("/documents/:documentId", verifyJWT, deletePatientDocument);
router.get("/documents/:documentId/download", verifyJWT, async (req, res) => {
  // Download document logic
});

// ==================== EMERGENCY & CONTACTS ====================
router.get("/emergency-contacts", verifyJWT, getEmergencyContacts);
router.post("/emergency-contacts", verifyJWT, updateEmergencyContact);
router.put("/emergency-contacts/:contactId", verifyJWT, async (req, res) => {
  // Update specific contact
});
router.delete("/emergency-contacts/:contactId", verifyJWT, async (req, res) => {
  // Delete contact
});

// ==================== INSURANCE ====================
router.get("/insurance", verifyJWT, (req, res) => {
  // Extract from profile
  return getPatientProfile(req, res);
});
router.post("/insurance", verifyJWT, updateInsurance);

// ==================== TELEMEDICINE ====================
router.get("/telemedicine/sessions", verifyJWT, getTelemedicineSessions);
router.post("/telemedicine/schedule", verifyJWT, scheduleTelemedicineSession);
router.post("/telemedicine/:sessionId/join", verifyJWT, joinTelemedicineSession);
router.post("/telemedicine/:sessionId/cancel", verifyJWT, async (req, res) => {
  // Cancel session
});

// ==================== NOTIFICATIONS ====================
router.get("/notifications", verifyJWT, getPatientNotifications);
router.post("/notifications/:notificationId/read", verifyJWT, markNotificationAsRead);
router.post("/notifications/mark-all-read", verifyJWT, async (req, res) => {
  // Mark all as read
});
router.get("/notifications/unread-count", verifyJWT, async (req, res) => {
  // Get unread count
});

// ==================== BILLING & PAYMENTS ====================
router.get("/billing", verifyJWT, getPatientBilling);
router.get("/billing/invoices", verifyJWT, async (req, res) => {
  // Get invoices
});
router.get("/billing/invoices/:invoiceId", verifyJWT, async (req, res) => {
  // Get specific invoice
});
router.post("/billing/payment", verifyJWT, makePayment);
router.get("/billing/payment-history", verifyJWT, async (req, res) => {
  // Payment history
});

// ==================== PREFERENCES & SETTINGS ====================
router.get("/preferences", verifyJWT, async (req, res) => {
  // Get preferences from profile
});
router.post("/preferences", verifyJWT, updatePatientPreferences);
router.post("/preferences/notification", verifyJWT, async (req, res) => {
  // Update notification preferences
});

// ==================== FEEDBACK & SUPPORT ====================
router.post("/feedback", verifyJWT, submitFeedback);
router.post("/support/ticket", verifyJWT, async (req, res) => {
  // Create support ticket
});
router.get("/support/tickets", verifyJWT, async (req, res) => {
  // Get support tickets
});

// ==================== HEALTH ASSISTANT ====================
router.post("/ai/analyze-symptoms", verifyJWT, async (req, res) => {
  // AI symptom analysis
});
router.post("/ai/chat", verifyJWT, async (req, res) => {
  // AI chat assistant
});
router.get("/ai/health-recommendations", verifyJWT, async (req, res) => {
  // Personalized health recommendations
});

// ==================== PHARMACY ====================
router.get("/pharmacy/orders", verifyJWT, async (req, res) => {
  // Get pharmacy orders
});
router.post("/pharmacy/order", verifyJWT, async (req, res) => {
  // Place pharmacy order
});
router.get("/pharmacy/nearby", verifyJWT, async (req, res) => {
  // Find nearby pharmacies
});

// ==================== EMERGENCY SERVICES ====================
router.post("/emergency/alert", verifyJWT, async (req, res) => {
  // Send emergency alert
});
router.get("/emergency/hospitals", verifyJWT, async (req, res) => {
  // Find nearby hospitals
});
router.get("/emergency/ambulance", verifyJWT, async (req, res) => {
  // Request ambulance
});

// ==================== APPOINTMENT REMINDERS ====================
router.get("/reminders", verifyJWT, async (req, res) => {
  // Get upcoming reminders
});
router.post("/reminders/preferences", verifyJWT, async (req, res) => {
  // Set reminder preferences
});

// ==================== HEALTH GOALS ====================
router.get("/health-goals", verifyJWT, async (req, res) => {
  // Get health goals
});
router.post("/health-goals", verifyJWT, async (req, res) => {
  // Set health goals
});
router.post("/health-goals/:goalId/progress", verifyJWT, async (req, res) => {
  // Update goal progress
});

// ==================== FAMILY MEMBERS ====================
router.get("/family", verifyJWT, async (req, res) => {
  // Get linked family members
});
router.post("/family/link", verifyJWT, async (req, res) => {
  // Link family member
});

// ==================== EXPORT DATA ====================
router.get("/export/medical-records", verifyJWT, async (req, res) => {
  // Export medical records
});
router.get("/export/appointments", verifyJWT, async (req, res) => {
  // Export appointments
});
router.get("/export/prescriptions", verifyJWT, async (req, res) => {
  // Export prescriptions
});

// ==================== VITAL SIGNS ====================
router.get("/vitals", verifyJWT, async (req, res) => {
  // Get vital signs history
});
router.post("/vitals", verifyJWT, async (req, res) => {
  // Record new vital signs
});
router.get("/vitals/recent", verifyJWT, async (req, res) => {
  // Get recent vitals
});

// ==================== WELLNESS CHECK ====================
router.post("/wellness-check", verifyJWT, async (req, res) => {
  // Submit wellness check
});
router.get("/wellness-check/history", verifyJWT, async (req, res) => {
  // Get wellness check history
});

// ==================== TEST RESULTS ====================
router.get("/test-results", verifyJWT, async (req, res) => {
  // Get lab test results
});
router.get("/test-results/:testId", verifyJWT, async (req, res) => {
  // Get specific test result
});

// ==================== IMMUNIZATION ====================
router.get("/immunizations", verifyJWT, async (req, res) => {
  // Get immunization records
});
router.post("/immunizations", verifyJWT, async (req, res) => {
  // Add immunization record
});

// ==================== ALLERGIES (Detailed) ====================
router.get("/allergies/detailed", verifyJWT, async (req, res) => {
  // Get detailed allergies
});
router.put("/allergies/:allergyId", verifyJWT, async (req, res) => {
  // Update specific allergy
});

// ==================== MEDICATIONS (Detailed) ====================
router.get("/medications/detailed", verifyJWT, async (req, res) => {
  // Get detailed medications
});
router.put("/medications/:medicationId", verifyJWT, async (req, res) => {
  // Update specific medication
});

// ==================== SURGERIES & PROCEDURES ====================
router.get("/surgeries", verifyJWT, async (req, res) => {
  // Get surgery history
});
router.post("/surgeries", verifyJWT, async (req, res) => {
  // Add surgery record
});

// ==================== DOCTORS & SPECIALISTS ====================
router.get("/doctors", verifyJWT, async (req, res) => {
  // Find doctors
});
router.get("/doctors/:doctorId", verifyJWT, async (req, res) => {
  // Get doctor details
});
router.post("/doctors/:doctorId/rating", verifyJWT, async (req, res) => {
  // Rate doctor
});

// ==================== APPOINTMENT AVAILABILITY ====================
router.get("/availability/:doctorId", verifyJWT, async (req, res) => {
  // Check doctor availability
});

// ==================== HEALTH INSIGHTS ====================
router.get("/insights", verifyJWT, async (req, res) => {
  // Get health insights
});

// ==================== MEDICATION REMINDERS ====================
router.get("/medication-reminders", verifyJWT, async (req, res) => {
  // Get medication reminders
});
router.post("/medication-reminders", verifyJWT, async (req, res) => {
  // Set medication reminders
});

// ==================== EMERGENCY PROFILE ====================
router.get("/emergency-profile", verifyJWT, async (req, res) => {
  // Get emergency profile (printable)
});

// ==================== SHARE RECORDS ====================
router.post("/records/share", verifyJWT, async (req, res) => {
  // Share records with provider
});

// ==================== PATIENT EDUCATION ====================
router.get("/education/:condition", verifyJWT, async (req, res) => {
  // Get educational materials
});

export default router;
