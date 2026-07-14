import mongoose, { Schema } from "mongoose";

const symptomSessionSchema = new Schema(
    {
        patientId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Patient reference is required']
        },
        voiceInput: {
            transcript: { type: String, default: "" },
            language: { type: String, default: "" },
            translatedText: { type: String, default: "" },
            confidenceScore: { type: Number, default: 100 }
        },
        symptoms: [{
            name: { type: String, required: true },
            somedCode: { type: String, default: "" },
            confidence: { type: Number, default: 100 },
            isPrimary: { type: Boolean, default: false }
        }],
        questionnaire: [{
            question: { type: String, required: true },
            answer: { type: String, required: true },
            stepType: { type: String, enum: ['primary', 'secondary', 'additional'], default: 'primary' }
        }],
        additionalInfo: {
            age: { type: Number },
            gender: { type: String },
            height: { type: Number },
            weight: { type: Number },
            pregnancy: { type: Boolean, default: false },
            medicalHistory: [{ type: String }],
            vitals: {
                temperature: { type: Number }, // In Celsius or Fahrenheit
                pulse: { type: Number },
                bloodPressure: {
                    systolic: { type: Number },
                    diastolic: { type: Number }
                },
                oxygenSaturation: { type: Number }
            },
            severity: { type: Number, min: 0, max: 10 },
            duration: { type: String }
        },
        clinicalReasoning: [{
            condition: { type: String, required: true },
            icd11: { type: String, default: "" },
            probability: { type: Number, required: true },
            evidence: [{ type: String }]
        }],
        riskAssessment: {
            level: { 
                type: String, 
                enum: ['low', 'medium', 'high', 'emergency'], 
                default: 'low' 
            },
            redFlags: [{ type: String }],
            hasEmergencyBanner: { type: Boolean, default: false }
        },
        soapNote: {
            subjective: { type: String, default: "" },
            objective: { type: String, default: "" },
            assessment: { type: String, default: "" },
            plan: { type: String, default: "" }
        },
        doctorRecommendation: {
            specialty: { type: String, default: "" },
            matchingDoctors: [{ 
                type: Schema.Types.ObjectId, 
                ref: 'User' 
            }]
        },
        ehrRecordId: {
            type: Schema.Types.ObjectId,
            ref: 'MedicalRecord'
        },
        status: {
            type: String,
            enum: ['active', 'completed', 'reviewed'],
            default: 'active'
        }
    },
    {
        timestamps: true
    }
);

symptomSessionSchema.index({ patientId: 1, status: 1 });
symptomSessionSchema.index({ createdAt: -1 });

export const SymptomSession = mongoose.model("SymptomSession", symptomSessionSchema);
