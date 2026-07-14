import mongoose, { Schema } from "mongoose";

const pharmacySchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Pharmacy name is required"],
            trim: true
        },
        phone: {
            type: String,
            required: [true, "Phone number is required"],
            default: "+91 22 6666 6666"
        },
        address: {
            type: String,
            required: [true, "Address is required"]
        },
        rating: {
            type: Number,
            default: 4.5,
            min: 0,
            max: 5
        },
        coordinates: {
            lat: {
                type: Number,
                required: [true, "Latitude is required"]
            },
            lng: {
                type: Number,
                required: [true, "Longitude is required"]
            }
        },
        availableMedicines: [
            {
                type: Schema.Types.ObjectId,
                ref: "Medicine"
            }
        ],
        isGooglePlace: {
            type: Boolean,
            default: false
        },
        latOffset: {
            type: Number,
            default: 0
        },
        lngOffset: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

export const Pharmacy = mongoose.models.Pharmacy || mongoose.model("Pharmacy", pharmacySchema);
