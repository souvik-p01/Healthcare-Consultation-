import mongoose, { Schema } from "mongoose";

const healthMetricSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    metricType: {
      type: String,
      enum: ['heart_rate', 'blood_pressure', 'temperature', 'blood_oxygen', 'blood_sugar', 'weight'],
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    systolic: {
      type: Number
    },
    diastolic: {
      type: Number
    },
    unit: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['normal', 'warning', 'critical', 'good'],
      default: 'normal'
    },
    recordedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    deviceId: {
      type: Schema.Types.ObjectId,
      ref: "Device"
    },
    notes: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

// Index for efficient querying
healthMetricSchema.index({ userId: 1, recordedAt: -1 });
healthMetricSchema.index({ userId: 1, metricType: 1, recordedAt: -1 });

export default mongoose.model("HealthMetric", healthMetricSchema);
