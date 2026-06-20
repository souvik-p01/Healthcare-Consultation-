import mongoose, { Schema } from "mongoose";

const pharmacyOrderItemSchema = new Schema({
    medicineId: {
        type: Schema.Types.ObjectId,
        ref: "Medicine"
    },
    name: {
        type: String,
        required: true
    },
    brand: {
        type: String
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true
    }
});

const pharmacyOrderSchema = new Schema(
    {
        orderId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        items: [pharmacyOrderItemSchema],
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        paymentMethod: {
            type: String,
            enum: ['online', 'cash'],
            default: 'online'
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded'],
            default: 'pending'
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'out_for_delivery', 'completed', 'cancelled'],
            default: 'pending'
        },
        address: {
            type: String
        },
        pharmacyName: {
            type: String,
            default: "MedCare Pharmacy"
        },
        deliveryDetails: {
            distance: {
                type: Number,
                default: 1.2
            },
            duration: {
                type: Number,
                default: 25
            },
            riderName: {
                type: String,
                default: "Rahul Sharma"
            },
            riderPhone: {
                type: String,
                default: "+91 98765 43210"
            },
            riderLocation: {
                lat: { type: Number },
                lng: { type: Number }
            }
        }
    },
    {
        timestamps: true
    }
);

export const PharmacyOrder = mongoose.models.PharmacyOrder || mongoose.model("PharmacyOrder", pharmacyOrderSchema);
