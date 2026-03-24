import { Router } from "express";
import { verifyJWT, restrictTo } from "../../middlewares/auth.middleware.js";

const router = Router();

// POST /api/v1/appointments/book - Book new appointment
router.post("/book", verifyJWT, restrictTo('patient'), bookAppointment);

// GET /api/v1/appointments - Get user's appointments
router.get("/", verifyJWT, getAppointments);

// GET /api/v1/appointments/:appointmentId - Get appointment details
router.get("/:appointmentId", verifyJWT, getAppointmentById);

// PATCH /api/v1/appointments/:appointmentId - Update appointment
router.patch("/:appointmentId", verifyJWT, updateAppointment);

// DELETE /api/v1/appointments/:appointmentId/cancel - Cancel appointment
router.delete("/:appointmentId/cancel", verifyJWT, cancelAppointment);

// PATCH /api/v1/appointments/:appointmentId/reschedule - Reschedule
router.patch("/:appointmentId/reschedule", verifyJWT, rescheduleAppointment);

// PATCH /api/v1/appointments/:appointmentId/confirm - Confirm (Doctor)
router.patch("/:appointmentId/confirm", verifyJWT, restrictTo('doctor'), confirmAppointment);

// GET /api/v1/appointments/available-slots - Get available slots
router.get("/available-slots", getAvailableSlots);

// GET /api/v1/appointments/upcoming - Get upcoming appointments
router.get("/upcoming", verifyJWT, getUpcomingAppointments);

export default router;