import axios from "axios";
import { mapSymptomToSnomed } from "./snomed.service.js";
import { mapConditionToIcd11 } from "./icd11.service.js";

// A robust local clinical knowledge base for offline or API fallback mode
const LOCAL_KNOWLEDGE_BASE = {
    symptoms: {
        "fever": {
            specialty: "General Medicine",
            questions: [
                { id: "temp", question: "What is your approximate body temperature?", options: ["Mild (<100°F)", "Moderate (100°F - 102°F)", "High (>102°F)"], type: "select" },
                { id: "duration", question: "How many days has the fever lasted?", options: ["1-2 days", "3-5 days", "More than 5 days"], type: "select" },
                { id: "chills", question: "Are you experiencing chills or shivering?", options: ["Yes", "No"], type: "select" },
                { id: "sweats", question: "Do you experience night sweats?", options: ["Yes", "No"], type: "select" }
            ],
            conditions: [
                { condition: "Viral Fever", baseProb: 0.70, evidence: ["Fever"] },
                { condition: "Influenza", baseProb: 0.60, evidence: ["Fever", "Chills"] },
                { condition: "COVID-19", baseProb: 0.50, evidence: ["Fever"] }
            ]
        },
        "cough": {
            specialty: "Pulmonology",
            questions: [
                { id: "dry_wet", question: "Is your cough dry or wet (producing phlegm)?", options: ["Dry", "Wet with clear phlegm", "Wet with yellow/green phlegm"], type: "select" },
                { id: "blood", question: "Have you coughed up any blood?", options: ["Yes", "No"], type: "select", isRedFlag: true },
                { id: "dyspnea", question: "Are you experiencing any breathing difficulties?", options: ["Yes, major", "Yes, minor", "No"], type: "select", isRedFlag: true }
            ],
            conditions: [
                { condition: "Acute Bronchitis", baseProb: 0.65, evidence: ["Cough"] },
                { condition: "Pneumonia", baseProb: 0.40, evidence: ["Cough", "Fever"] },
                { condition: "COVID-19", baseProb: 0.55, evidence: ["Cough", "Fever"] }
            ]
        },
        "headache": {
            specialty: "Neurology",
            questions: [
                { id: "severity", question: "On a scale of 1-10, how severe is the headache pain?", options: ["Mild (1-3)", "Moderate (4-7)", "Severe (8-10)"], type: "select" },
                { id: "nausea", question: "Are you experiencing nausea or vomiting?", options: ["Yes", "No"], type: "select" },
                { id: "light_sensitivity", question: "Are you sensitive to bright lights or loud sounds?", options: ["Yes", "No"], type: "select" },
                { id: "neck_stiffness", question: "Do you have a stiff neck or pain when bending your head forward?", options: ["Yes", "No"], type: "select", isRedFlag: true }
            ],
            conditions: [
                { condition: "Tension Headache", baseProb: 0.75, evidence: ["Headache"] },
                { condition: "Migraine", baseProb: 0.50, evidence: ["Headache", "Light Sensitivity", "Nausea"] }
            ]
        },
        "chest pain": {
            specialty: "Cardiology",
            questions: [
                { id: "pain_type", question: "What does the chest pain feel like?", options: ["Squeezing/Pressure", "Sharp/Stabbing", "Burning/Acidic"], type: "select", isRedFlag: true },
                { id: "radiation", question: "Does the pain travel to your arm, neck, shoulder, or jaw?", options: ["Yes", "No"], type: "select", isRedFlag: true },
                { id: "breathless", question: "Are you short of breath or sweating excessively?", options: ["Yes", "No"], type: "select", isRedFlag: true }
            ],
            conditions: [
                { condition: "Angina Pectoris", baseProb: 0.60, evidence: ["Chest Pain"] },
                { condition: "Gastroesophageal Reflux Disease", baseProb: 0.50, evidence: ["Chest Pain"] }
            ]
        }
    }
};

/**
 * Extract symptoms from plain text input
 */
export const extractSymptoms = async (text) => {
    console.log(`🤖 [REASONING SERVICE] Extracting symptoms from: "${text}"`);
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    if (apiKey) {
        try {
            const prompt = `Analyze the following patient text describing their symptoms:
"${text}"

Extract all clinical symptoms mentioned. Return a JSON object with this exact structure:
{
  "symptoms": ["symptom1", "symptom2"]
}
Only output the JSON object. Do not include markdown code blocks or text explanation.`;

            const response = await axios.post(
                "https://api.deepseek.com/chat/completions",
                {
                    model: "deepseek-chat",
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.1,
                    response_format: { type: "json_object" }
                },
                {
                    headers: { "Authorization": `Bearer ${apiKey}` },
                    timeout: 8000
                }
            );

            const result = JSON.parse(response.data.choices[0].message.content.trim());
            if (Array.isArray(result.symptoms)) {
                return result.symptoms.map(s => s.toLowerCase());
            }
        } catch (error) {
            console.warn("⚠️ DeepSeek extraction failed, using fallback keyword matcher:", error.message);
        }
    }

    // Heuristic Fallback
    const extracted = [];
    const textLower = text.toLowerCase();
    const availableSymptoms = Object.keys(LOCAL_KNOWLEDGE_BASE.symptoms);
    
    availableSymptoms.forEach(sym => {
        if (textLower.includes(sym)) {
            extracted.push(sym);
        }
    });

    // Custom fallback words
    if (textLower.match(/(fever|temp|hot|jor|bukhar)/i) && !extracted.includes("fever")) extracted.push("fever");
    if (textLower.match(/(headache|head pain|sir dard|matha betha)/i) && !extracted.includes("headache")) extracted.push("headache");
    if (textLower.match(/(cough|kashi|khansi)/i) && !extracted.includes("cough")) extracted.push("cough");
    if (textLower.match(/(chest pain|buk betha|chhati dard)/i) && !extracted.includes("chest pain")) extracted.push("chest pain");

    return extracted.length > 0 ? extracted : ["general malaise"];
};

/**
 * Generate questionnaire based on symptoms
 */
export const generateQuestions = async (symptoms, history = []) => {
    console.log(`🤖 [REASONING SERVICE] Generating questions for symptoms: ${symptoms.join(", ")}`);
    
    const questions = [];
    
    // Incomplete input check
    if (symptoms.length === 1 && symptoms[0] === "general malaise") {
        return [
            {
                id: "general_inquiry",
                question: "Which symptom is bothering you the most right now?",
                options: ["Fever", "Headache", "Cough", "Chest Pain", "Other"],
                type: "select"
            }
        ];
    }

    symptoms.forEach(s => {
        const data = LOCAL_KNOWLEDGE_BASE.symptoms[s];
        if (data) {
            questions.push(...data.questions);
        }
    });

    // Remove duplicates
    const seen = new Set();
    const filteredQuestions = questions.filter(q => {
        const isDuplicate = seen.has(q.id);
        seen.add(q.id);
        return !isDuplicate;
    });

    return filteredQuestions;
};

/**
 * Clinical Reasoning & Assessment Engine
 * Incorporates SNOMED mapping, ICD-11 conditions, Red Flags, Vitals check, and SOAP note writing
 */
export const performClinicalAssessment = async (sessionData) => {
    console.log(`🤖 [REASONING SERVICE] Performing clinical assessment...`);
    const { symptoms, questionnaire, additionalInfo } = sessionData;
    
    const activeSymptoms = symptoms.map(s => s.name.toLowerCase());
    
    // Evaluate Red Flags & Risk
    const redFlags = [];
    let riskLevel = "low";
    
    // Check questionnaire responses for red flags
    questionnaire.forEach(q => {
        const ans = q.answer.toLowerCase();
        if (ans.includes("yes") || ans.includes("severe") || ans.includes("squeezing") || ans.includes("major")) {
            // Find if this question is a red flag trigger
            if (q.question.toLowerCase().match(/(blood|breathing|stiff neck|chest|radiation|consciousness|bleeding)/)) {
                redFlags.push(`Positive response to: ${q.question}`);
            }
        }
    });
    
    // Check vitals
    if (additionalInfo?.vitals) {
        const { temperature, oxygenSaturation, bloodPressure } = additionalInfo.vitals;
        if (temperature && temperature > 39.4) {
            redFlags.push(`High fever (>103°F / 39.4°C)`);
        }
        if (oxygenSaturation && oxygenSaturation < 92) {
            redFlags.push(`Hypoxia / Low oxygen saturation (${oxygenSaturation}%)`);
        }
        if (bloodPressure) {
            const { systolic, diastolic } = bloodPressure;
            if (systolic > 180 || diastolic > 120) {
                redFlags.push(`Hypertensive crisis BP (${systolic}/${diastolic})`);
            }
        }
    }
    
    // Evaluate main symptoms for immediate emergency red flags
    if (activeSymptoms.includes("chest pain") || activeSymptoms.includes("dyspnea") || activeSymptoms.includes("fainting")) {
        redFlags.push(`Critical primary symptom reported: ${activeSymptoms.filter(s => ["chest pain", "dyspnea", "fainting"].includes(s)).join(", ")}`);
    }

    if (redFlags.length > 0) {
        riskLevel = redFlags.some(r => r.match(/(chest|oxygen|hypoxia|BP|blood|breathing)/i)) ? "emergency" : "high";
    } else if (activeSymptoms.length > 1) {
        riskLevel = "medium";
    }

    // Rank Conditions
    const conditions = [];
    const matchedConditions = {};

    activeSymptoms.forEach(s => {
        const kb = LOCAL_KNOWLEDGE_BASE.symptoms[s];
        if (kb) {
            kb.conditions.forEach(cond => {
                if (!matchedConditions[cond.condition]) {
                    matchedConditions[cond.condition] = {
                        condition: cond.condition,
                        probability: cond.baseProb,
                        evidence: [...cond.evidence]
                    };
                } else {
                    // Boost probability if symptom matches multiple criteria
                    matchedConditions[cond.condition].probability = Math.min(0.95, matchedConditions[cond.condition].probability + 0.15);
                    matchedConditions[cond.condition].evidence.push(s);
                }
            });
        }
    });

    // Build array and map to ICD-11
    const rankedConditions = Object.values(matchedConditions)
        .map(c => {
            const mapped = mapConditionToIcd11(c.condition);
            return {
                condition: mapped.name,
                icd11: mapped.code,
                probability: Math.round(c.probability * 100),
                evidence: c.evidence
            };
        })
        .sort((a, b) => b.probability - a.probability);

    // If no conditions matched, offer a general diagnosis
    if (rankedConditions.length === 0) {
        rankedConditions.push({
            condition: "Undifferentiated Symptoms",
            icd11: "MG48",
            probability: 60,
            evidence: activeSymptoms
        });
    }

    // Specialty recommendation
    let recommendedSpecialty = "General Medicine";
    for (const sym of activeSymptoms) {
        const kb = LOCAL_KNOWLEDGE_BASE.symptoms[sym];
        if (kb && kb.specialty !== "General Medicine") {
            recommendedSpecialty = kb.specialty;
            break;
        }
    }

    // SOAP Note Generation
    const subjective = `Patient reports chief complaint of ${activeSymptoms.join(" and ")}. Duration reported: ${additionalInfo?.duration || "not specified"}. Severity rated at ${additionalInfo?.severity || "unspecified"}/10. Historical conditions listed: ${additionalInfo?.medicalHistory?.join(", ") || "None"}.`;
    const objective = `Vitals recorded: Temperature: ${additionalInfo?.vitals?.temperature || "N/A"}°C, SpO2: ${additionalInfo?.vitals?.oxygenSaturation || "N/A"}%, Pulse: ${additionalInfo?.vitals?.pulse || "N/A"} bpm, BP: ${additionalInfo?.vitals?.bloodPressure?.systolic || "N/A"}/${additionalInfo?.vitals?.bloodPressure?.diastolic || "N/A"} mmHg.`;
    const assessment = `Primary suspect condition: ${rankedConditions[0]?.condition || "Undifferentiated illness"} (ICD-11: ${rankedConditions[0]?.icd11 || "N/A"}). Risk level classified as: ${riskLevel.toUpperCase()}.`;
    const plan = `Recommend urgent consultation with ${recommendedSpecialty} specialist. Rest, hydration, and immediate emergency evaluation if red flags worsen.`;

    return {
        clinicalReasoning: rankedConditions,
        riskAssessment: {
            level: riskLevel,
            redFlags,
            hasEmergencyBanner: riskLevel === "emergency"
        },
        soapNote: {
            subjective,
            objective,
            assessment,
            plan
        },
        recommendedSpecialty
    };
};

export default {
    extractSymptoms,
    generateQuestions,
    performClinicalAssessment
};
