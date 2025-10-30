import { Router } from "express";
import { verifyJWT, restrictTo } from "../middlewares/auth.middleware.js";

const router = Router();

// POST /api/v1/doctors - Create doctor profile
router.post("/", verifyJWT, restrictTo('doctor'), createDoctorProfile);

// GET /api/v1/doctors/:doctorId - Get doctor profile
router.get("/:doctorId", getDoctorProfile);

// PATCH /api/v1/doctors/:doctorId - Update doctor profile
router.patch("/:doctorId", verifyJWT, restrictTo('doctor'), updateDoctorProfile);

// GET /api/v1/doctors/:doctorId/schedule - Get schedule
router.get("/:doctorId/schedule", getDoctorSchedule);

// PATCH /api/v1/doctors/:doctorId/schedule - Update schedule
router.patch("/:doctorId/schedule", verifyJWT, restrictTo('doctor'), updateSchedule);

// GET /api/v1/doctors/:doctorId/appointments - Get doctor appointments
router.get("/:doctorId/appointments", verifyJWT, restrictTo('doctor'), getDoctorAppointments);

// GET /api/v1/doctors/:doctorId/patients - Get doctor's patients
router.get("/:doctorId/patients", verifyJWT, restrictTo('doctor'), getDoctorPatients);

// GET /api/v1/doctors/specialization/:spec - Get by specialization
router.get("/specialization/:spec", getDoctorsBySpecialization);

export default router;