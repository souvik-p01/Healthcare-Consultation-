/**
 * SNOMED CT Mapping Service
 * 
 * Maps normalized clinical symptoms to official SNOMED CT terminology codes.
 */

const SNOMED_MAP = {
    "fever": { code: "386661006", name: "Fever" },
    "headache": { code: "25064002", name: "Headache" },
    "cough": { code: "49727002", name: "Cough" },
    "shortness of breath": { code: "267036007", name: "Dyspnea" },
    "difficulty breathing": { code: "267036007", name: "Dyspnea" },
    "chest pain": { code: "29857009", name: "Chest pain" },
    "fatigue": { code: "84229001", name: "Fatigue" },
    "weakness": { code: "84229001", name: "Fatigue" },
    "nausea": { code: "422587007", name: "Nausea" },
    "vomiting": { code: "422400008", name: "Vomiting" },
    "sore throat": { code: "162397003", name: "Sore throat" },
    "body pain": { code: "224960004", name: "Myalgia" },
    "muscle pain": { code: "68962001", name: "Muscle pain" },
    "joint pain": { code: "57676002", name: "Arthralgia" },
    "diarrhea": { code: "62315008", name: "Diarrhoea" },
    "abdominal pain": { code: "21522001", name: "Abdominal pain" },
    "stomach pain": { code: "21522001", name: "Abdominal pain" },
    "chills": { code: "43724002", name: "Chills" },
    "night sweats": { code: "429584007", name: "Night sweats" },
    "loss of appetite": { type: "79890006", name: "Loss of appetite" },
    "runny nose": { code: "64531003", name: "Rhinorrhea" },
    "sneezing": { code: "116288000", name: "Sneezing" },
    "dizziness": { code: "404640003", name: "Dizziness" },
    "skin rash": { code: "271807003", name: "Skin rash" },
    "itchiness": { code: "418363000", name: "Itchiness" },
    "wheezing": { code: "56018004", name: "Wheezing" },
    "fainting": { code: "271594007", name: "Syncope" }
};

/**
 * Map symptom description to SNOMED CT Code
 */
export const mapSymptomToSnomed = (symptomText) => {
    const cleanText = symptomText.toLowerCase().trim();
    
    // 1. Direct match check
    if (SNOMED_MAP[cleanText]) {
        return {
            name: SNOMED_MAP[cleanText].name,
            code: SNOMED_MAP[cleanText].code,
            confidence: 100
        };
    }
    
    // 2. Substring match check
    const keys = Object.keys(SNOMED_MAP);
    for (const key of keys) {
        if (cleanText.includes(key) || key.includes(cleanText)) {
            return {
                name: SNOMED_MAP[key].name,
                code: SNOMED_MAP[key].code,
                confidence: 85
            };
        }
    }
    
    // 3. Fallback to generic symptom code
    return {
        name: symptomText,
        code: "404684003", // Clinical finding SNOMED generic fallback
        confidence: 60
    };
};

export default {
    mapSymptomToSnomed
};
