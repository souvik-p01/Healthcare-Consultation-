import { Router } from "express";
import { verifyJWT, restrictTo } from "../../middlewares/auth.middleware.js";

const router = Router();

// POST /api/v1/consultations/start - Start consultation
router.post("/start", verifyJWT, restrictTo('doctor'), startConsultation);

// GET /api/v1/consultations/:consultationId - Get consultation
router.get("/:consultationId", verifyJWT, getConsultation);

// PATCH /api/v1/consultations/:consultationId/notes - Update notes
router.patch("/:consultationId/notes", verifyJWT, restrictTo('doctor'), updateConsultationNotes);

// POST /api/v1/consultations/:consultationId/end - End consultation
router.post("/:consultationId/end", verifyJWT, restrictTo('doctor'), endConsultation);

// GET /api/v1/consultations/appointment/:appointmentId - Get by appointment
router.get("/appointment/:appointmentId", verifyJWT, getConsultationByAppointment);

// GET /api/v1/consultations/history - Get consultation history
router.get("/history", verifyJWT, getConsultationHistory);

export default router;