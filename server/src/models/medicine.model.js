import mongoose, { Schema } from "mongoose";

const medicineSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Medicine name is required"],
            trim: true,
            index: true
        },
        brand: {
            type: String,
            required: [true, "Brand name is required"],
            trim: true,
            default: "Generic"
        },
        category: {
            type: String,
            enum: {
                values: ['Allopath', 'Ayurveda', 'Homeopath', 'Unani', 'General'],
                message: '{VALUE} is not a valid category'
            },
            required: [true, "Category is required"],
            default: "General",
            index: true
        },
        price: {
            type: Number,
            required: [true, "Price is required"],
            min: [0, "Price cannot be negative"]
        },
        discountPrice: {
            type: Number,
            min: [0, "Discount price cannot be negative"],
            default: null
        },
        stock: {
            type: Number,
            required: [true, "Stock is required"],
            min: [0, "Stock cannot be negative"],
            default: 0
        },
        requiresPrescription: {
            type: Boolean,
            default: false
        },
        form: {
            type: String,
            default: "Tablet"
        },
        packaging: {
            type: String,
            default: "Standard packaging"
        },
        description: {
            type: String,
            trim: true
        },
        image: {
            type: String,
            default: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60"
        },
        availableIn: {
            type: [String],
            default: []
        }
    },
    {
        timestamps: true
    }
);

export const Medicine = mongoose.models.Medicine || mongoose.model("Medicine", medicineSchema);
