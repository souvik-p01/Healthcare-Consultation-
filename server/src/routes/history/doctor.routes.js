import { Router } from "express";
import { verifyJWT, restrictTo } from "../../middlewares/auth.middleware.js";
import {
    getDoctorProfile,
    updateDoctorProfile,
    getDoctorDashboard,
    getDoctorSchedule,
    updateDoctorAvailability,
    getDoctorAppointments,
    getTodaysAppointments,
    updateAppointmentStatus,
    getDoctorsPatients,
    getPatientDetails,
    getPatientMedicalHistory,
    createPrescription,
    addMedicalRecord
} from "../controllers/doctor.controller.js";

const router = Router();

// ================================
// ROUTE STRUCTURE FOR DOCTOR PORTAL
// ================================

// Public endpoints (can be accessed without authentication)
router.get("/public/:id", getDoctorProfile); // For patient view

// Protected endpoints (require doctor authentication)
router.use(verifyJWT, restrictTo('doctor'));

// DOCTOR PORTAL ROUTES (Match frontend needs)
// --------------------------------------------------

// 1. Dashboard Routes (ActiveTab: 'dashboard')
router.get("/dashboard/data", getDoctorDashboard);               // Dashboard overview
router.get("/dashboard/today-appointments", getTodaysAppointments); // Today's schedule

// 2. Profile Routes (ActiveTab: 'settings')
router.route("/profile")
    .get(getDoctorProfile)          // Get profile data
    .patch(updateDoctorProfile);    // Update profile

// 3. Patients Routes (ActiveTab: 'patients')
router.get("/patients", getDoctorsPatients);                      // All patients list
router.get("/patients/:id", getPatientDetails);                   // Single patient details
router.get("/patients/:id/history", getPatientMedicalHistory);    // Medical history

// 4. Appointments Routes (ActiveTab: 'appointments')
router.get("/appointments", getDoctorAppointments);               // All appointments
router.get("/appointments/today", getTodaysAppointments);         // Today's appointments
router.patch("/appointments/:id", updateAppointmentStatus);       // Update appointment

// 5. Schedule Routes (Settings section)
router.route("/schedule")
    .get(getDoctorSchedule)                    // Get schedule
    .patch(updateDoctorAvailability);          // Update schedule

// 6. Prescriptions Routes (ActiveTab: 'prescriptions')
router.post("/prescriptions", createPrescription);                // Create prescription

// 7. Medical Records Routes (ActiveTab: 'reports')
router.post("/medical-records", addMedicalRecord);                // Add medical record

// 8. Telemedicine Routes (ActiveTab: 'consultations')
// Note: These would be in a separate telemedicine controller
router.get("/telemedicine/sessions", (req, res) => {
    // Telemedicine sessions logic
    res.json({ message: "Telemedicine sessions endpoint" });
});

// 9. AI Assistant Routes (ActiveTab: 'ai-assist')
router.get("/ai-assistant/suggestions", (req, res) => {
    // AI assistant logic
    res.json({ message: "AI Assistant endpoint" });
});

// ================================
// FRONTEND API ENDPOINT MAPPING
// ================================

/*
Frontend DoctorPortal.jsx expects these endpoints:

1. Dashboard:
   - GET /api/v1/doctors/dashboard/data
   - GET /api/v1/doctors/dashboard/today-appointments

2. Profile/Settings:
   - GET /api/v1/doctors/profile
   - PATCH /api/v1/doctors/profile

3. Patients:
   - GET /api/v1/doctors/patients
   - GET /api/v1/doctors/patients/:id

4. Appointments:
   - GET /api/v1/doctors/appointments
   - GET /api/v1/doctors/appointments/today

5. Schedule:
   - GET /api/v1/doctors/schedule
   - PATCH /api/v1/doctors/schedule

6. Prescriptions:
   - POST /api/v1/doctors/prescriptions

7. Medical Records:
   - POST /api/v1/doctors/medical-records
*/

export default router;