import { Router } from "express";
import { 
    startSession, 
    processInput, 
    getQuestions, 
    submitAnswers, 
    submitAdditionalInfo, 
    generateReasoning, 
    saveToEHR, 
    getPatientSessions, 
    getDoctorPatientSessions, 
    getSessionDetails 
} from "../controllers/aiSymptom.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Secure all endpoints with JWT authentication
router.use(verifyJWT);

router.post("/start", startSession);
router.post("/:sessionId/process-input", processInput);
router.get("/:sessionId/questions", getQuestions);
router.post("/:sessionId/answers", submitAnswers);
router.post("/:sessionId/vitals", submitAdditionalInfo);
router.post("/:sessionId/reasoning", generateReasoning);
router.post("/:sessionId/save-ehr", saveToEHR);
router.get("/patient", getPatientSessions);
router.get("/doctor/:patientId", getDoctorPatientSessions);
router.get("/:sessionId", getSessionDetails);

export default router;
