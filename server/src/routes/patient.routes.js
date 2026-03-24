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

// ==================== ALIAS ROUTES (Frontend Compatibility) ====================
// These aliases ensure frontend calls work with the correct paths
router.get("/patients/notifications", verifyJWT, getPatientNotifications);
router.get("/patients/appointments", verifyJWT, getPatientAppointments);
router.get("/patients/dashboard", verifyJWT, getPatientDashboard);
router.get("/patients/profile", verifyJWT, getPatientProfile);
router.get("/patients/medical-history", verifyJWT, getMedicalHistory);
router.get("/patients/prescriptions", verifyJWT, getPatientPrescriptions);
router.get("/patients/billing", verifyJWT, getPatientBilling);

// ==================== PROFILE MANAGEMENT ====================
router.post("/create-profile", verifyJWT, createPatientProfile);
router.get("/profile", verifyJWT, getPatientProfile);
router.patch("/profile", verifyJWT, updatePatientProfile);

// ==================== MEDICAL INFORMATION ====================
router.post("/allergies", verifyJWT, addAllergy);
router.get("/allergies", verifyJWT, getPatientProfile);
router.delete("/allergies/:allergyId", verifyJWT, async (req, res) => {
  try {
    // Add allergy deletion logic
    const { allergyId } = req.params;
    const user = req.user;
    
    // Update user's allergies array
    const updatedUser = await User.findByIdAndUpdate(
      user.id,
      { $pull: { allergies: { _id: allergyId } } },
      { new: true }
    );
    
    res.json({ success: true, data: updatedUser.allergies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/medications", verifyJWT, addMedication);
router.get("/medications", verifyJWT, getPatientProfile);
router.delete("/medications/:medicationId", verifyJWT, async (req, res) => {
  try {
    // Add medication deletion logic
    const { medicationId } = req.params;
    const user = req.user;
    
    const updatedUser = await User.findByIdAndUpdate(
      user.id,
      { $pull: { medications: { _id: medicationId } } },
      { new: true }
    );
    
    res.json({ success: true, data: updatedUser.medications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/medical-history", verifyJWT, getMedicalHistory);
router.post("/medical-history/condition", verifyJWT, async (req, res) => {
  try {
    // Add condition logic
    const { condition, diagnosedDate, notes } = req.body;
    const user = req.user;
    
    const updatedUser = await User.findByIdAndUpdate(
      user.id,
      { $push: { medicalHistory: { condition, diagnosedDate, notes } } },
      { new: true }
    );
    
    res.json({ success: true, data: updatedUser.medicalHistory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== APPOINTMENTS ====================
router.get("/appointments", verifyJWT, getPatientAppointments);
router.post("/appointments/schedule", verifyJWT, scheduleAppointment);
router.post("/appointments/:appointmentId/cancel", verifyJWT, cancelAppointment);
router.post("/appointments/:appointmentId/reschedule", verifyJWT, rescheduleAppointment);
router.get("/appointments/upcoming", verifyJWT, (req, res, next) => {
  req.query.status = "scheduled,confirmed";
  next();
}, getPatientAppointments);
router.get("/appointments/past", verifyJWT, (req, res, next) => {
  req.query.status = "completed,cancelled";
  next();
}, getPatientAppointments);

// ==================== PRESCRIPTIONS ====================
router.get("/prescriptions", verifyJWT, getPatientPrescriptions);
router.get("/prescriptions/active", verifyJWT, (req, res, next) => {
  req.query.status = "active";
  next();
}, getPatientPrescriptions);
router.post("/prescriptions/:prescriptionId/refill", verifyJWT, requestPrescriptionRefill);
router.get("/prescriptions/:prescriptionId", verifyJWT, async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    const prescriptions = await Prescription.findById(prescriptionId);
    res.json({ success: true, data: prescriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== DASHBOARD & ANALYTICS ====================
router.get("/dashboard", verifyJWT, getPatientDashboard);
router.get("/statistics", verifyJWT, getPatientStatistics);
router.get("/health-metrics", verifyJWT, async (req, res) => {
  try {
    const user = req.user;
    const metrics = await HealthMetric.find({ userId: user.id })
      .sort({ date: -1 })
      .limit(30);
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
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
  try {
    const { documentId } = req.params;
    const document = await PatientDocument.findById(documentId);
    
    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }
    
    // Check if user has access to this document
    if (document.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    
    res.download(document.path, document.originalName);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== EMERGENCY & CONTACTS ====================
router.get("/emergency-contacts", verifyJWT, getEmergencyContacts);
router.post("/emergency-contacts", verifyJWT, updateEmergencyContact);
router.put("/emergency-contacts/:contactId", verifyJWT, async (req, res) => {
  try {
    const { contactId } = req.params;
    const user = req.user;
    
    const updatedUser = await User.findByIdAndUpdate(
      user.id,
      { $set: { [`emergencyContacts.${contactId}`]: req.body } },
      { new: true }
    );
    
    res.json({ success: true, data: updatedUser.emergencyContacts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.delete("/emergency-contacts/:contactId", verifyJWT, async (req, res) => {
  try {
    const { contactId } = req.params;
    const user = req.user;
    
    const updatedUser = await User.findByIdAndUpdate(
      user.id,
      { $pull: { emergencyContacts: { _id: contactId } } },
      { new: true }
    );
    
    res.json({ success: true, data: updatedUser.emergencyContacts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== INSURANCE ====================
router.get("/insurance", verifyJWT, async (req, res) => {
  try {
    const user = req.user;
    res.json({ success: true, data: user.insurance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.post("/insurance", verifyJWT, updateInsurance);

// ==================== TELEMEDICINE ====================
router.get("/telemedicine/sessions", verifyJWT, getTelemedicineSessions);
router.post("/telemedicine/schedule", verifyJWT, scheduleTelemedicineSession);
router.post("/telemedicine/:sessionId/join", verifyJWT, joinTelemedicineSession);
router.post("/telemedicine/:sessionId/cancel", verifyJWT, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await TelemedicineSession.findByIdAndUpdate(
      sessionId,
      { status: 'cancelled' },
      { new: true }
    );
    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== NOTIFICATIONS ====================
router.get("/notifications", verifyJWT, getPatientNotifications);
router.post("/notifications/:notificationId/read", verifyJWT, markNotificationAsRead);
router.post("/notifications/mark-all-read", verifyJWT, async (req, res) => {
  try {
    const user = req.user;
    await Notification.updateMany(
      { userId: user.id, isRead: false },
      { isRead: true }
    );
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get("/notifications/unread-count", verifyJWT, async (req, res) => {
  try {
    const user = req.user;
    const count = await Notification.countDocuments({ userId: user.id, isRead: false });
    res.json({ success: true, data: { unreadCount: count } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== BILLING & PAYMENTS ====================
router.get("/billing", verifyJWT, getPatientBilling);
router.get("/billing/invoices", verifyJWT, async (req, res) => {
  try {
    const user = req.user;
    const invoices = await Invoice.find({ userId: user.id }).sort({ date: -1 });
    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get("/billing/invoices/:invoiceId", verifyJWT, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const invoice = await Invoice.findById(invoiceId);
    
    if (invoice.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.post("/billing/payment", verifyJWT, makePayment);
router.get("/billing/payment-history", verifyJWT, async (req, res) => {
  try {
    const user = req.user;
    const payments = await Payment.find({ userId: user.id }).sort({ date: -1 });
    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== PREFERENCES & SETTINGS ====================
router.get("/preferences", verifyJWT, async (req, res) => {
  try {
    const user = req.user;
    res.json({ success: true, data: user.preferences || {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.post("/preferences", verifyJWT, updatePatientPreferences);
router.post("/preferences/notification", verifyJWT, async (req, res) => {
  try {
    const user = req.user;
    const updatedUser = await User.findByIdAndUpdate(
      user.id,
      { $set: { 'preferences.notifications': req.body } },
      { new: true }
    );
    res.json({ success: true, data: updatedUser.preferences });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== FEEDBACK & SUPPORT ====================
router.post("/feedback", verifyJWT, submitFeedback);
router.post("/support/ticket", verifyJWT, async (req, res) => {
  try {
    const ticket = await SupportTicket.create({
      userId: req.user.id,
      ...req.body
    });
    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get("/support/tickets", verifyJWT, async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== HEALTH ASSISTANT ====================
router.post("/ai/analyze-symptoms", verifyJWT, async (req, res) => {
  try {
    const { symptoms } = req.body;
    // Implement AI symptom analysis logic
    const analysis = await analyzeSymptoms(symptoms);
    res.json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.post("/ai/chat", verifyJWT, async (req, res) => {
  try {
    const { message } = req.body;
    // Implement AI chat logic
    const response = await aiChat(message);
    res.json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get("/ai/health-recommendations", verifyJWT, async (req, res) => {
  try {
    // Generate personalized recommendations based on user data
    const recommendations = await generateRecommendations(req.user);
    res.json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== PHARMACY ====================
router.get("/pharmacy/orders", verifyJWT, async (req, res) => {
  try {
    const orders = await PharmacyOrder.find({ userId: req.user.id }).sort({ date: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.post("/pharmacy/order", verifyJWT, async (req, res) => {
  try {
    const order = await PharmacyOrder.create({
      userId: req.user.id,
      ...req.body
    });
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get("/pharmacy/nearby", verifyJWT, async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query;
    const pharmacies = await findNearbyPharmacies(lat, lng, radius);
    res.json({ success: true, data: pharmacies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== EMERGENCY SERVICES ====================
router.post("/emergency/alert", verifyJWT, async (req, res) => {
  try {
    const { location, emergencyType, message } = req.body;
    // Send emergency alert logic
    await sendEmergencyAlert(req.user, { location, emergencyType, message });
    res.json({ success: true, message: "Emergency alert sent" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get("/emergency/hospitals", verifyJWT, async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;
    const hospitals = await findNearbyHospitals(lat, lng, radius);
    res.json({ success: true, data: hospitals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get("/emergency/ambulance", verifyJWT, async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const ambulance = await requestAmbulance(lat, lng);
    res.json({ success: true, data: ambulance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== APPOINTMENT REMINDERS ====================
router.get("/reminders", verifyJWT, async (req, res) => {
  try {
    const reminders = await Reminder.find({ userId: req.user.id }).sort({ date: 1 });
    res.json({ success: true, data: reminders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.post("/reminders/preferences", verifyJWT, async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { 'preferences.reminders': req.body } },
      { new: true }
    );
    res.json({ success: true, data: updatedUser.preferences });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== HEALTH GOALS ====================
router.get("/health-goals", verifyJWT, async (req, res) => {
  try {
    const goals = await HealthGoal.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: goals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.post("/health-goals", verifyJWT, async (req, res) => {
  try {
    const goal = await HealthGoal.create({
      userId: req.user.id,
      ...req.body
    });
    res.json({ success: true, data: goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.post("/health-goals/:goalId/progress", verifyJWT, async (req, res) => {
  try {
    const { goalId } = req.params;
    const goal = await HealthGoal.findByIdAndUpdate(
      goalId,
      { $push: { progress: req.body } },
      { new: true }
    );
    res.json({ success: true, data: goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== FAMILY MEMBERS ====================
router.get("/family", verifyJWT, async (req, res) => {
  try {
    const family = await FamilyMember.find({ userId: req.user.id });
    res.json({ success: true, data: family });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.post("/family/link", verifyJWT, async (req, res) => {
  try {
    const member = await FamilyMember.create({
      userId: req.user.id,
      ...req.body
    });
    res.json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== EXPORT DATA ====================
router.get("/export/medical-records", verifyJWT, async (req, res) => {
  try {
    const records = await exportMedicalRecords(req.user.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=medical-records.pdf');
    res.send(records);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get("/export/appointments", verifyJWT, async (req, res) => {
  try {
    const appointments = await exportAppointments(req.user.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=appointments.pdf');
    res.send(appointments);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get("/export/prescriptions", verifyJWT, async (req, res) => {
  try {
    const prescriptions = await exportPrescriptions(req.user.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=prescriptions.pdf');
    res.send(prescriptions);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== VITAL SIGNS ====================
router.get("/vitals", verifyJWT, async (req, res) => {
  try {
    const vitals = await VitalSign.find({ userId: req.user.id }).sort({ date: -1 });
    res.json({ success: true, data: vitals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.post("/vitals", verifyJWT, async (req, res) => {
  try {
    const vital = await VitalSign.create({
      userId: req.user.id,
      ...req.body
    });
    res.json({ success: true, data: vital });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get("/vitals/recent", verifyJWT, async (req, res) => {
  try {
    const vitals = await VitalSign.find({ userId: req.user.id })
      .sort({ date: -1 })
      .limit(1);
    res.json({ success: true, data: vitals[0] || null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== WELLNESS CHECK ====================
router.post("/wellness-check", verifyJWT, async (req, res) => {
  try {
    const wellness = await WellnessCheck.create({
      userId: req.user.id,
      ...req.body
    });
    res.json({ success: true, data: wellness });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get("/wellness-check/history", verifyJWT, async (req, res) => {
  try {
    const checks = await WellnessCheck.find({ userId: req.user.id }).sort({ date: -1 });
    res.json({ success: true, data: checks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== TEST RESULTS ====================
router.get("/test-results", verifyJWT, async (req, res) => {
  try {
    const results = await LabResult.find({ userId: req.user.id }).sort({ date: -1 });
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get("/test-results/:testId", verifyJWT, async (req, res) => {
  try {
    const { testId } = req.params;
    const result = await LabResult.findById(testId);
    
    if (result.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== IMMUNIZATION ====================
router.get("/immunizations", verifyJWT, async (req, res) => {
  try {
    const immunizations = await Immunization.find({ userId: req.user.id }).sort({ date: -1 });
    res.json({ success: true, data: immunizations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.post("/immunizations", verifyJWT, async (req, res) => {
  try {
    const immunization = await Immunization.create({
      userId: req.user.id,
      ...req.body
    });
    res.json({ success: true, data: immunization });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== ALLERGIES (Detailed) ====================
router.get("/allergies/detailed", verifyJWT, async (req, res) => {
  try {
    const user = req.user;
    res.json({ success: true, data: user.allergies || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.put("/allergies/:allergyId", verifyJWT, async (req, res) => {
  try {
    const { allergyId } = req.params;
    const user = req.user;
    
    const updatedUser = await User.findOneAndUpdate(
      { _id: user.id, "allergies._id": allergyId },
      { $set: { "allergies.$": req.body } },
      { new: true }
    );
    
    res.json({ success: true, data: updatedUser.allergies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== MEDICATIONS (Detailed) ====================
router.get("/medications/detailed", verifyJWT, async (req, res) => {
  try {
    const user = req.user;
    res.json({ success: true, data: user.medications || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.put("/medications/:medicationId", verifyJWT, async (req, res) => {
  try {
    const { medicationId } = req.params;
    const user = req.user;
    
    const updatedUser = await User.findOneAndUpdate(
      { _id: user.id, "medications._id": medicationId },
      { $set: { "medications.$": req.body } },
      { new: true }
    );
    
    res.json({ success: true, data: updatedUser.medications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== SURGERIES & PROCEDURES ====================
router.get("/surgeries", verifyJWT, async (req, res) => {
  try {
    const user = req.user;
    res.json({ success: true, data: user.surgeries || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.post("/surgeries", verifyJWT, async (req, res) => {
  try {
    const user = req.user;
    const updatedUser = await User.findByIdAndUpdate(
      user.id,
      { $push: { surgeries: req.body } },
      { new: true }
    );
    res.json({ success: true, data: updatedUser.surgeries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== DOCTORS & SPECIALISTS ====================
router.get("/doctors", verifyJWT, async (req, res) => {
  try {
    const { specialization, location, page = 1, limit = 10 } = req.query;
    const doctors = await User.find({
      role: "doctor",
      ...(specialization && { specialization }),
      ...(location && { "address.city": location })
    })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    res.json({ success: true, data: doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get("/doctors/:doctorId", verifyJWT, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const doctor = await User.findById(doctorId);
    
    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    
    res.json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.post("/doctors/:doctorId/rating", verifyJWT, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { rating, review } = req.body;
    
    const doctor = await User.findByIdAndUpdate(
      doctorId,
      { $push: { ratings: { userId: req.user.id, rating, review } } },
      { new: true }
    );
    
    res.json({ success: true, data: doctor.ratings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== APPOINTMENT AVAILABILITY ====================
router.get("/availability/:doctorId", verifyJWT, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;
    
    const slots = await getDoctorAvailability(doctorId, date);
    res.json({ success: true, data: slots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== HEALTH INSIGHTS ====================
router.get("/insights", verifyJWT, async (req, res) => {
  try {
    const insights = await generateHealthInsights(req.user.id);
    res.json({ success: true, data: insights });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== MEDICATION REMINDERS ====================
router.get("/medication-reminders", verifyJWT, async (req, res) => {
  try {
    const reminders = await MedicationReminder.find({ userId: req.user.id }).sort({ time: 1 });
    res.json({ success: true, data: reminders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.post("/medication-reminders", verifyJWT, async (req, res) => {
  try {
    const reminder = await MedicationReminder.create({
      userId: req.user.id,
      ...req.body
    });
    res.json({ success: true, data: reminder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== EMERGENCY PROFILE ====================
router.get("/emergency-profile", verifyJWT, async (req, res) => {
  try {
    const user = req.user;
    const emergencyProfile = {
      name: user.name,
      dateOfBirth: user.dateOfBirth,
      bloodGroup: user.bloodGroup,
      allergies: user.allergies,
      medications: user.medications,
      medicalConditions: user.medicalHistory,
      emergencyContacts: user.emergencyContacts,
      insurance: user.insurance
    };
    res.json({ success: true, data: emergencyProfile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== SHARE RECORDS ====================
router.post("/records/share", verifyJWT, async (req, res) => {
  try {
    const { providerEmail, records, expiryDate } = req.body;
    const shareToken = await shareMedicalRecords(req.user.id, providerEmail, records, expiryDate);
    res.json({ success: true, data: { shareToken, message: "Records shared successfully" } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== PATIENT EDUCATION ====================
router.get("/education/:condition", verifyJWT, async (req, res) => {
  try {
    const { condition } = req.params;
    const materials = await getEducationalMaterials(condition);
    res.json({ success: true, data: materials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;


