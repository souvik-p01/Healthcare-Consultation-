import { Router } from "express";
import { verifyJWT, restrictTo, verifyPatientAccess } from "../../middlewares/auth.middleware.js";

const router = Router();

// POST /api/v1/prescriptions - Create prescription
router.post("/", verifyJWT, restrictTo('doctor'), createPrescription);

// GET /api/v1/prescriptions/patient/:patientId - Get patient prescriptions
router.get("/patient/:patientId", verifyJWT, verifyPatientAccess('patientId'), getPatientPrescriptions);

// GET /api/v1/prescriptions/:prescriptionId - Get prescription details
router.get("/:prescriptionId", verifyJWT, getPrescriptionById);

// PATCH /api/v1/prescriptions/:prescriptionId - Update prescription
router.patch("/:prescriptionId", verifyJWT, restrictTo('doctor'), updatePrescription);

// DELETE /api/v1/prescriptions/:prescriptionId/cancel - Cancel prescription
router.delete("/:prescriptionId/cancel", verifyJWT, restrictTo('doctor'), cancelPrescription);

// POST /api/v1/prescriptions/:prescriptionId/refill - Request refill
router.post("/:prescriptionId/refill", verifyJWT, restrictTo('patient'), refillPrescription);

// GET /api/v1/prescriptions/:prescriptionId/download - Download PDF
router.get("/:prescriptionId/download", verifyJWT, downloadPrescription);

// GET /api/v1/prescriptions/active - Get active prescriptions
router.get("/active", verifyJWT, restrictTo('patient'), getActivePrescriptions);

export default router;