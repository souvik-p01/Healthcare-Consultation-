import mongoose, { Schema } from "mongoose";

const doctorSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    medicalLicenseNumber: {
        type: String,
        unique: true,
        sparse: true
    },
    specialty: {
        type: String,
        required: true,
        enum: ['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Dermatology', 'Psychiatry', 'General Medicine'],
        default: 'General Medicine'
    },
    experience: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: true // e.g., "₹599"
    },
    rating: {
        type: Number,
        default: 4.5
    },
    reviews: {
        type: Number,
        default: 0
    },
    image: {
        type: String, // Emoji or URL
        default: '👨‍⚕️'
    },
    availableToday: {
        type: Boolean,
        default: true
    },
    languages: {
        type: [String],
        default: ['English', 'Hindi']
    },
    availability: {
        type: [String],
        default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    },
    videoConsultation: {
        type: Boolean,
        default: true
    },
    about: {
        type: String,
        default: "Certified medical professional dedicated to patient care."
    }
}, { timestamps: true });

export const Doctor = mongoose.models.Doctor || mongoose.model("Doctor", doctorSchema);
