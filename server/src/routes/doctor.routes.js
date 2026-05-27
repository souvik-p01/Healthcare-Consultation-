import { Router } from "express";
import { 
    getAllDoctors, 
    addDoctor, 
    deleteDoctor,
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
import { verifyJWT, restrictTo } from "../middlewares/auth.middleware.js";

const router = Router();

// Public doctor list
router.get("/", getAllDoctors);
router.get("/public/:id", getDoctorProfile); // Public profile view

// Admin endpoints
router.post("/", verifyJWT, restrictTo("admin"), addDoctor);
router.delete("/:doctorId", verifyJWT, restrictTo("admin"), deleteDoctor);

// Protected endpoints (require doctor or admin authentication)
router.use(verifyJWT, restrictTo('doctor', 'admin'));

// DOCTOR PORTAL ROUTES
router.get("/dashboard/data", getDoctorDashboard);
router.get("/dashboard/today-appointments", getTodaysAppointments);

router.route("/profile")
    .get(getDoctorProfile)
    .patch(updateDoctorProfile);

router.get("/patients", getDoctorsPatients);
router.get("/patients/:id", getPatientDetails);
router.get("/patients/:id/history", getPatientMedicalHistory);

router.get("/appointments", getDoctorAppointments);
router.get("/appointments/today", getTodaysAppointments);
router.patch("/appointments/:id", updateAppointmentStatus);

router.route("/schedule")
    .get(getDoctorSchedule)
    .patch(updateDoctorAvailability);

router.post("/prescriptions", createPrescription);
router.post("/medical-records", addMedicalRecord);

export default router;
