import { Router } from "express";
import { verifyJWT, verifyPatientAccess } from "../middlewares/auth.middleware.js";

const router = Router();

// POST /api/v1/patients - Create patient profile
router.post("/", verifyJWT, createPatientProfile);

// GET /api/v1/patients/:patientId - Get patient profile
router.get("/:patientId", verifyJWT, verifyPatientAccess('patientId'), getPatientProfile);

// PATCH /api/v1/patients/:patientId - Update patient profile
router.patch("/:patientId", verifyJWT, verifyPatientAccess('patientId'), updatePatientProfile);

// POST /api/v1/patients/:patientId/allergies - Add allergy
router.post("/:patientId/allergies", verifyJWT, addAllergy);

// POST /api/v1/patients/:patientId/medications - Add medication
router.post("/:patientId/medications", verifyJWT, addMedication);

// PATCH /api/v1/patients/:patientId/emergency-contact - Update emergency contact
router.patch("/:patientId/emergency-contact", verifyJWT, updateEmergencyContact);

// PATCH /api/v1/patients/:patientId/insurance - Update insurance
router.patch("/:patientId/insurance", verifyJWT, updateInsurance);

// GET /api/v1/patients/:patientId/medical-history - Get medical history
router.get("/:patientId/medical-history", verifyJWT, getMedicalHistory);

export default router;