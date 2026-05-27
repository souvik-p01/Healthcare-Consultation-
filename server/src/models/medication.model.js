import mongoose, { Schema } from "mongoose";

const medicationSchema = new Schema(
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
    dosage: {
      type: String,
      required: true,
      trim: true
    },
    frequency: {
      type: String,
      enum: ['once_daily', 'twice_daily', 'thrice_daily', 'four_times_daily', 'as_needed'],
      required: true
    },
    time: {
      type: String,
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date
    },
    prescribedBy: {
      type: String,
      trim: true
    },
    reason: {
      type: String,
      trim: true
    },
    sideEffects: [{
      type: String
    }],
    taken: {
      type: Boolean,
      default: false
    },
    lastTakenAt: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true
    },
    reminders: [{
      type: Schema.Types.ObjectId,
      ref: "Reminder"
    }]
  },
  { timestamps: true }
);

medicationSchema.index({ userId: 1, isActive: 1 });
medicationSchema.index({ userId: 1, startDate: 1, endDate: 1 });

export default mongoose.model("Medication", medicationSchema);
