import mongoose, { Schema } from "mongoose";

const deviceSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['wearable', 'device', 'smartphone', 'tablet', 'other'],
      required: true
    },
    manufacturer: {
      type: String,
      trim: true
    },
    model: {
      type: String,
      trim: true
    },
    serialNumber: {
      type: String,
      trim: true,
      unique: true,
      sparse: true
    },
    connected: {
      type: Boolean,
      default: false,
      index: true
    },
    battery: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    lastSync: {
      type: Date
    },
    capabilities: [{
      type: String,
      enum: [
        'heart_rate',
        'blood_pressure',
        'temperature',
        'blood_oxygen',
        'blood_sugar',
        'weight',
        'steps',
        'sleep',
        'activity'
      ]
    }],
    status: {
      type: String,
      enum: ['active', 'inactive', 'offline', 'disconnected'],
      default: 'active'
    },
    pairedDate: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

deviceSchema.index({ userId: 1, isActive: 1 });

export default mongoose.model("Device", deviceSchema);
