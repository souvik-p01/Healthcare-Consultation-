import mongoose, { Schema } from "mongoose";

const doctorSchema = new Schema({
    doctorId: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    gender: {
        type: String,
        enum: ["Male", "Female", "Other", "male", "female"],
        required: true
    },
    qualification: {
        type: String,
        required: true,
        trim: true
    },
    specialization: {
        type: String,
        required: true,
        trim: true
    },
    subspecialization: {
        type: String,
        trim: true,
        default: ""
    },
    yearsOfExperience: {
        type: Number,
        required: true,
        min: 0
    },
    hospitalName: {
        type: String,
        required: true,
        trim: true
    },
    clinicName: {
        type: String,
        trim: true,
        default: ""
    },
    consultationFee: {
        type: Number,
        required: true,
        min: 0
    },
    languages: {
        type: [String],
        default: ["English", "Hindi"]
    },
    rating: {
        type: Number,
        default: 4.5,
        min: 0,
        max: 5
    },
    reviewCount: {
        type: Number,
        default: 0
    },
    profilePhoto: {
        type: String,
        default: "👨‍⚕️" // Emoji or image URL
    },
    availability: {
        type: [String], // e.g. ["Mon", "Tue", "Wed", "Thu", "Fri"]
        default: ["Mon", "Tue", "Wed", "Thu", "Fri"]
    },
    nextAvailableSlot: {
        type: String,
        default: "Tomorrow"
    },
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    state: {
        type: String,
        required: true,
        trim: true
    },
    country: {
        type: String,
        required: true,
        trim: true,
        default: "India"
    },
    latitude: {
        type: Number,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    teleconsultAvailable: {
        type: Boolean,
        default: true
    },
    emergencyAvailable: {
        type: Boolean,
        default: false
    },
    verified: {
        type: Boolean,
        default: true
    },
    licenseNumber: {
        type: String,
        required: true,
        unique: true
    },
    // GeoJSON location field for MongoDB geospatial indexing
    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point"
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Create geospatial 2dsphere index on location field
doctorSchema.index({ location: "2dsphere" });

// Backwards compatibility virtuals/aliases for old database fields
doctorSchema.virtual("name").get(function() {
    return this.fullName;
}).set(function(val) {
    this.fullName = val;
});

doctorSchema.virtual("specialty").get(function() {
    return this.specialization;
}).set(function(val) {
    this.specialization = val;
});

doctorSchema.virtual("experience").get(function() {
    return `${this.yearsOfExperience} years`;
}).set(function(val) {
    const matched = String(val).match(/\d+/);
    this.yearsOfExperience = matched ? parseInt(matched[0]) : 5;
});

doctorSchema.virtual("price").get(function() {
    return `₹${this.consultationFee}`;
}).set(function(val) {
    const matched = String(val).match(/\d+/);
    this.consultationFee = matched ? parseInt(matched[0]) : 500;
});

doctorSchema.virtual("reviews").get(function() {
    return this.reviewCount;
}).set(function(val) {
    this.reviewCount = val;
});

doctorSchema.virtual("image").get(function() {
    return this.profilePhoto;
}).set(function(val) {
    this.profilePhoto = val;
});

doctorSchema.virtual("videoConsultation").get(function() {
    return this.teleconsultAvailable;
}).set(function(val) {
    this.teleconsultAvailable = val;
});

export const Doctor = mongoose.models.Doctor || mongoose.model("Doctor", doctorSchema);
