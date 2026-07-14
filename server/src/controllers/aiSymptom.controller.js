import { SymptomSession } from "../models/SymptomSession.model.js";
import { User } from "../models/User.model.js";
import { MedicalRecord } from "../models/medicalRecord.model.js";
import { Patient } from "../models/Patient.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { detectLanguage, translateToEnglish, transcribeAudio, suggestMedicalCorrections } from "../services/bhashini.service.js";
import { mapSymptomToSnomed } from "../services/snomed.service.js";
import { extractSymptoms, generateQuestions, performClinicalAssessment } from "../services/clinicalReasoning.service.js";

/**
 * START SYMPTOM CHECKER SESSION
 * POST /api/v1/ai-symptom/start
 */
export const startSession = asyncHandler(async (req, res) => {
    const patientId = req.user._id;
    console.log(`🏥 [AI INTAKE] Starting new session for patient: ${patientId}`);

    const session = await SymptomSession.create({
        patientId,
        status: "active"
    });

    return res.status(201).json(
        new ApiResponse(201, { session }, "AI Symptom Session started successfully")
    );
});

/**
 * PROCESS PATIENT INPUT (VOICE OR TEXT)
 * POST /api/v1/ai-symptom/:sessionId/process-input
 */
export const processInput = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { text, audio, language } = req.body;
    
    console.log(`🏥 [AI INTAKE] Processing input for session: ${sessionId}`);

    const session = await SymptomSession.findById(sessionId);
    if (!session) {
        throw new ApiError(404, "Symptom session not found");
    }

    let rawText = text;
    let confidence = 100;
    let detectedLang = language || "en";

    // 1. Handle Voice Input Transcription (if audio buffer is provided)
    if (audio) {
        const audioBuffer = Buffer.from(audio, 'base64');
        const transcription = await transcribeAudio(audioBuffer, detectedLang);
        rawText = transcription.transcript;
        detectedLang = transcription.detectedLang;
        confidence = transcription.confidence;
    }

    if (!rawText) {
        throw new ApiError(400, "Text input or voice input is required");
    }

    // 2. Perform Bhashini Translation to English
    const translationResult = await translateToEnglish(rawText, detectedLang);
    
    // Save voice/input metadata
    session.voiceInput = {
        transcript: rawText,
        language: detectedLang,
        translatedText: translationResult.translatedText,
        confidenceScore: confidence
    };

    // 3. Extract Symptoms from translated English text
    const symptomNames = await extractSymptoms(translationResult.translatedText);
    
    // 4. Map each symptom to SNOMED CT and update session
    const mappedSymptoms = symptomNames.map((s, idx) => {
        const mapped = mapSymptomToSnomed(s);
        return {
            name: mapped.name,
            somedCode: mapped.code,
            confidence: mapped.confidence,
            isPrimary: idx === 0 // Mark first symptom as chief complaint
        };
    });

    session.symptoms = mappedSymptoms;
    await session.save();

    // 5. Provide accent corrections if ASR confidence was low
    let suggestions = [];
    if (confidence < 70) {
        const words = rawText.split(/\s+/);
        words.forEach(w => {
            const corr = suggestMedicalCorrections(w);
            if (corr.length > 0) suggestions.push({ word: w, corrections: corr });
        });
    }

    return res.status(200).json(
        new ApiResponse(200, {
            session,
            correctionsRequired: confidence < 70,
            suggestions
        }, "Input processed and symptoms extracted successfully")
    );
});

/**
 * GET DYNAMIC CLINICAL QUESTIONS
 * GET /api/v1/ai-symptom/:sessionId/questions
 */
export const getQuestions = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    
    const session = await SymptomSession.findById(sessionId);
    if (!session) {
        throw new ApiError(404, "Symptom session not found");
    }

    const symptomsList = session.symptoms.map(s => s.name);
    const questions = await generateQuestions(symptomsList);

    return res.status(200).json(
        new ApiResponse(200, { questions }, "Dynamic questions fetched successfully")
    );
});

/**
 * SUBMIT QUESTIONNAIRE ANSWERS
 * POST /api/v1/ai-symptom/:sessionId/answers
 */
export const submitAnswers = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { answers } = req.body; // Array of { question, answer, stepType }

    if (!Array.isArray(answers)) {
        throw new ApiError(400, "Answers array is required");
    }

    const session = await SymptomSession.findById(sessionId);
    if (!session) {
        throw new ApiError(404, "Symptom session not found");
    }

    session.questionnaire = answers;
    await session.save();

    return res.status(200).json(
        new ApiResponse(200, { session }, "Answers saved successfully")
    );
});

/**
 * SUBMIT VITALS AND ADDITIONAL INFORMATION
 * POST /api/v1/ai-symptom/:sessionId/vitals
 */
export const submitAdditionalInfo = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { age, gender, height, weight, pregnancy, medicalHistory, vitals, severity, duration } = req.body;

    const session = await SymptomSession.findById(sessionId);
    if (!session) {
        throw new ApiError(404, "Symptom session not found");
    }

    session.additionalInfo = {
        age,
        gender,
        height,
        weight,
        pregnancy,
        medicalHistory,
        vitals,
        severity,
        duration
    };

    await session.save();

    return res.status(200).json(
        new ApiResponse(200, { session }, "Additional clinical details saved successfully")
    );
});

/**
 * EVALUATE AND GENERATE CLINICAL REASONING
 * POST /api/v1/ai-symptom/:sessionId/reasoning
 */
export const generateReasoning = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    const session = await SymptomSession.findById(sessionId);
    if (!session) {
        throw new ApiError(404, "Symptom session not found");
    }

    // 1. Perform clinical assessment using the reasoning service
    const assessment = await performClinicalAssessment(session);

    session.clinicalReasoning = assessment.clinicalReasoning;
    session.riskAssessment = assessment.riskAssessment;
    session.soapNote = assessment.soapNote;
    session.status = "completed";

    // 2. Lookup matching doctors by specialty from the database
    const specialty = assessment.recommendedSpecialty;
    const matchingDoctors = await User.find({
        role: "doctor",
        isActive: true,
        specialization: { $regex: new RegExp(specialty, "i") }
    }).select("_id firstName lastName fullName specialization avatar consultationFee experience qualification department");

    session.doctorRecommendation = {
        specialty,
        matchingDoctors: matchingDoctors.map(d => d._id)
    };

    await session.save();

    return res.status(200).json(
        new ApiResponse(200, { 
            session,
            doctors: matchingDoctors
        }, "Clinical reasoning and doctor recommendation completed successfully")
    );
});

/**
 * SAVE ASSESSMENT TO EHR (COMMITS AS CLINICAL MEDICAL RECORD)
 * POST /api/v1/ai-symptom/:sessionId/save-ehr
 */
export const saveToEHR = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { subjective, objective, assessment, plan, doctorId } = req.body;

    const session = await SymptomSession.findById(sessionId);
    if (!session) {
        throw new ApiError(404, "Symptom session not found");
    }

    // Find Patient ID associated with user
    const patientProfile = await Patient.findOne({ user: session.patientId });
    if (!patientProfile) {
        throw new ApiError(404, "Patient profile not found in EHR");
    }

    // Compile symptoms in EHR format
    const formattedSymptoms = session.symptoms.map(s => ({
        symptom: s.name,
        severity: session.additionalInfo?.severity > 7 ? 'severe' : session.additionalInfo?.severity > 3 ? 'moderate' : 'mild',
        duration: session.additionalInfo?.duration || "N/A"
    }));

    // Compile diagnoses in EHR format
    const formattedDiagnoses = session.clinicalReasoning.map(c => ({
        condition: c.condition,
        code: c.icd11,
        certainty: 'suspected',
        type: 'differential'
    }));

    // Generate clinical medical record (SOAP format)
    const medicalRecord = await MedicalRecord.create({
        patientId: patientProfile._id,
        doctorId: doctorId || req.user._id, // Associated doctor
        recordType: "consultation",
        category: "AI Intake Assessment",
        chiefComplaint: session.symptoms.find(s => s.isPrimary)?.name || "General Symptoms",
        presentIllness: subjective || session.soapNote.subjective,
        symptoms: formattedSymptoms,
        vitalSigns: {
            temperature: session.additionalInfo?.vitals?.temperature,
            oxygenSaturation: session.additionalInfo?.vitals?.oxygenSaturation,
            pulse: session.additionalInfo?.vitals?.pulse,
            bloodPressure: {
                systolic: session.additionalInfo?.vitals?.bloodPressure?.systolic,
                diastolic: session.additionalInfo?.vitals?.bloodPressure?.diastolic
            },
            weight: session.additionalInfo?.weight,
            height: session.additionalInfo?.height
        },
        diagnosis: formattedDiagnoses,
        treatmentPlan: {
            plan: plan || session.soapNote.plan,
            recommendations: ["AI intake summary saved for clinical review"]
        }
    });

    // Link EHR record back to session
    session.ehrRecordId = medicalRecord._id;
    session.status = "reviewed";
    await session.save();

    return res.status(201).json(
        new ApiResponse(201, { medicalRecord, session }, "AI encounter committed to patient EHR successfully")
    );
});

/**
 * GET PATIENT SESSION HISTORY
 * GET /api/v1/ai-symptom/patient
 */
export const getPatientSessions = asyncHandler(async (req, res) => {
    const patientId = req.user._id;
    const sessions = await SymptomSession.find({ patientId })
        .sort({ createdAt: -1 })
        .populate("doctorRecommendation.matchingDoctors", "_id firstName lastName fullName specialization avatar");

    return res.status(200).json(
        new ApiResponse(200, { sessions }, "Patient sessions fetched successfully")
    );
});

/**
 * GET DOCTOR-PORTAL INTAKE VIEW
 * GET /api/v1/ai-symptom/doctor/:patientId
 */
export const getDoctorPatientSessions = asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const sessions = await SymptomSession.find({ patientId })
        .sort({ createdAt: -1 })
        .populate("doctorRecommendation.matchingDoctors", "_id firstName lastName fullName specialization avatar");

    return res.status(200).json(
        new ApiResponse(200, { sessions }, "Patient symptom checker logs retrieved for doctor review")
    );
});

/**
 * GET SINGLE SESSION DETAILS
 * GET /api/v1/ai-symptom/:sessionId
 */
export const getSessionDetails = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const session = await SymptomSession.findById(sessionId)
        .populate("doctorRecommendation.matchingDoctors", "_id firstName lastName fullName specialization avatar consultationFee experience qualification department");

    if (!session) {
        throw new ApiError(404, "Symptom session not found");
    }

    return res.status(200).json(
        new ApiResponse(200, { session }, "Session details fetched successfully")
    );
});
