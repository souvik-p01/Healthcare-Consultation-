import { Router } from "express";
import { verifyJWT, restrictTo, verifyPatientAccess } from "../../middlewares/auth.middleware.js";
import { upload, handleUploadError } from "../../middlewares/multer.middleware.js";

const router = Router();

// POST /api/v1/medical-records - Create medical record
router.post("/", verifyJWT, restrictTo('doctor'), createMedicalRecord);

// GET /api/v1/medical-records/patient/:patientId - Get patient records
router.get("/patient/:patientId", verifyJWT, verifyPatientAccess('patientId'), getPatientRecords);

// GET /api/v1/medical-records/:recordId - Get specific record
router.get("/:recordId", verifyJWT, getMedicalRecordById);

// PATCH /api/v1/medical-records/:recordId - Update record
router.patch("/:recordId", verifyJWT, restrictTo('doctor'), updateMedicalRecord);

// DELETE /api/v1/medical-records/:recordId - Delete record
router.delete("/:recordId", verifyJWT, restrictTo('doctor', 'admin'), deleteMedicalRecord);

// POST /api/v1/medical-records/:recordId/vital-signs - Add vital signs
router.post("/:recordId/vital-signs", verifyJWT, restrictTo('doctor', 'nurse'), addVitalSigns);

// POST /api/v1/medical-records/:recordId/attachments - Upload documents
router.post("/:recordId/attachments", verifyJWT, upload.array('documents', 5), handleUploadError, attachDocuments);

export default router;