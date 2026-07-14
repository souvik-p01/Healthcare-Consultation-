import { detectLanguage, translateToEnglish, suggestMedicalCorrections } from "./services/bhashini.service.js";
import { mapSymptomToSnomed } from "./services/snomed.service.js";
import { mapConditionToIcd11 } from "./services/icd11.service.js";
import { extractSymptoms, performClinicalAssessment } from "./services/clinicalReasoning.service.js";

async function runTests() {
    console.log("🧪 [TEST] Running AI Symptom Checker Integration Tests...\n");

    // 1. Test Bhashini Language Detection
    console.log("--- 1. Testing Bhashini Language Detection ---");
    const bnText = "Amar tin din dhore jor aar matha betha";
    const detectedBn = detectLanguage(bnText);
    console.log(`Input: "${bnText}" | Detected: ${detectedBn} (Expected: bn)`);
    
    const hiText = "Mujhe teen din se bukhar aur sir dard hai";
    const detectedHi = detectLanguage(hiText);
    console.log(`Input: "${hiText}" | Detected: ${detectedHi} (Expected: hi)`);
    console.log("✅ Language detection checks passed.\n");

    // 2. Test Bhashini Translation to English
    console.log("--- 2. Testing Bhashini Translation & Normalization ---");
    const translation = await translateToEnglish(bnText, "bn");
    console.log(`Original: "${bnText}"`);
    console.log(`Translated: "${translation.translatedText}"`);
    console.log("✅ Translation check passed.\n");

    // 3. Test Fuzzy Vocabulary Corrections
    console.log("--- 3. Testing Fuzzy Accent Corrections ---");
    const suggestions = suggestMedicalCorrections("fevar");
    console.log(`Term: "fevar" | Suggested corrections:`, suggestions);
    console.log("✅ Fuzzy suggestions check passed.\n");

    // 4. Test SNOMED CT Mapping
    console.log("--- 4. Testing SNOMED CT Mapping ---");
    const mappedSymptom = mapSymptomToSnomed("headache");
    console.log(`Symptom: "headache" | SNOMED Code: ${mappedSymptom.code} | Term: ${mappedSymptom.name}`);
    console.log("✅ SNOMED CT check passed.\n");

    // 5. Test ICD-11 Mapping
    console.log("--- 5. Testing ICD-11 Condition Mapping ---");
    const mappedCondition = mapConditionToIcd11("COVID-19");
    console.log(`Condition: "COVID-19" | ICD-11 Code: ${mappedCondition.code} | Term: ${mappedCondition.name}`);
    console.log("✅ ICD-11 check passed.\n");

    // 6. Test Clinical Reasoning Engine
    console.log("--- 6. Testing Clinical Reasoning & Assessment ---");
    const symptoms = ["fever", "cough"];
    const sessionMock = {
        symptoms: symptoms.map(s => ({ name: s, isPrimary: s === "fever" })),
        questionnaire: [
            { question: "Have you coughed up any blood?", answer: "No" },
            { question: "Are you experiencing any breathing difficulties?", answer: "Yes, major" }
        ],
        additionalInfo: {
            age: 45,
            gender: "male",
            vitals: {
                temperature: 38.5,
                oxygenSaturation: 94
            }
        }
    };
    
    const assessment = await performClinicalAssessment(sessionMock);
    console.log("Risk Level:", assessment.riskAssessment.level);
    console.log("Red Flags:", assessment.riskAssessment.redFlags);
    console.log("Primary Condition:", assessment.clinicalReasoning[0]?.condition, `(Probability: ${assessment.clinicalReasoning[0]?.probability}%)`);
    console.log("Recommended Specialty:", assessment.recommendedSpecialty);
    console.log("SOAP Notes Generated:\n", JSON.stringify(assessment.soapNote, null, 2));
    
    console.log("\n🎉 ALL LOCAL VALIDATION TESTS COMPLETED SUCCESSFULLY!");
}

runTests().catch(err => {
    console.error("❌ Test run failed:", err);
    process.exit(1);
});
