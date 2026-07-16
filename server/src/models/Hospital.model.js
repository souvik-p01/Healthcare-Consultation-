import mongoose, { Schema } from "mongoose";

const hospitalSchema = new Schema({
    hospitalName: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        required: true
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
    rating: {
        type: Number,
        default: 4.5
    },
    ambulanceAvailable: {
        type: Boolean,
        default: true
    },
    emergency: {
        type: Boolean,
        default: true
    },
    departments: {
        type: [String],
        default: ["Emergency", "Cardiology", "Neurology", "General Medicine"]
    },
    beds: {
        type: Number,
        default: 10
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
hospitalSchema.index({ location: "2dsphere" });

// Backwards compatibility virtuals/aliases for frontend
hospitalSchema.virtual("name").get(function() {
    return this.hospitalName;
}).set(function(val) {
    this.hospitalName = val;
});

hospitalSchema.virtual("available").get(function() {
    return this.ambulanceAvailable;
}).set(function(val) {
    this.ambulanceAvailable = val;
});

hospitalSchema.virtual("coordinates").get(function() {
    return {
        lat: this.latitude,
        lng: this.longitude
    };
});

export const Hospital = mongoose.models.Hospital || mongoose.model("Hospital", hospitalSchema);
