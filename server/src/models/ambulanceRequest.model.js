import mongoose, { Schema } from "mongoose";

const ambulanceRequestSchema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    hospitalId: {
      type: String,
      required: true
    },
    hospitalName: {
      type: String,
      required: true
    },
    pickupLocation: {
      lat: {
        type: Number,
        required: true
      },
      lng: {
        type: Number,
        required: true
      },
      address: {
        type: String,
        required: true
      }
    },
    status: {
      type: String,
      enum: ["pending", "dispatched", "arrived", "cancelled"],
      default: "dispatched",
      index: true
    },
    eta: {
      type: Number,
      default: 15
    },
    driverName: {
      type: String,
      default: "Vikram Singh"
    },
    driverPhone: {
      type: String,
      default: "+91 98765 43210"
    },
    ambulanceNumber: {
      type: String,
      default: "MH-12-EM-4567"
    },
    currentLocation: {
      lat: {
        type: Number
      },
      lng: {
        type: Number
      }
    }
  },
  { timestamps: true }
);

export default mongoose.model("AmbulanceRequest", ambulanceRequestSchema);
