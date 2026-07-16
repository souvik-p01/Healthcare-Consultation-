import mongoose, { Schema } from "mongoose";

const ambulanceSchema = new Schema({
    ambulanceNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    providerName: {
        type: String,
        required: true,
        enum: ["Apollo Ambulance", "Ruby Ambulance", "AMRI Ambulance", "Medica Ambulance", "Fortis Ambulance"],
        trim: true
    },
    driverName: {
        type: String,
        required: true,
        trim: true
    },
    driverPhone: {
        type: String,
        required: true
    },
    vehicleType: {
        type: String,
        required: true,
        enum: ["ALS", "BLS", "ICU", "Neonatal", "Standard"],
        default: "Standard"
    },
    ALS: {
        type: Boolean,
        default: false
    },
    BLS: {
        type: Boolean,
        default: false
    },
    ICU: {
        type: Boolean,
        default: false
    },
    Neonatal: {
        type: Boolean,
        default: false
    },
    latitude: {
        type: Number,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    },
    availability: {
        type: Boolean,
        default: true
    },
    estimatedArrival: {
        type: Number, // in minutes
        default: 15
    },
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

// Geospatial index for nearby querying
ambulanceSchema.index({ location: "2dsphere" });

export const Ambulance = mongoose.models.Ambulance || mongoose.model("Ambulance", ambulanceSchema);
