import mongoose, { Schema } from "mongoose";

const reminderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    time: {
      type: String,
      required: true
    },
    action: {
      type: String,
      required: true,
      trim: true
    },
    reminderType: {
      type: String,
      enum: ['medication', 'measurement', 'activity', 'appointment', 'custom'],
      required: true
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    },
    repeatPattern: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'once', 'custom'],
      default: 'daily'
    },
    days: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    notificationMethod: {
      type: String,
      enum: ['push', 'email', 'sms', 'in_app'],
      default: 'push'
    },
    linkedMedication: {
      type: Schema.Types.ObjectId,
      ref: "Medication"
    },
    description: {
      type: String,
      trim: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    completedDates: [{
      type: Date
    }]
  },
  { timestamps: true }
);

reminderSchema.index({ userId: 1, active: 1 });
reminderSchema.index({ userId: 1, time: 1, active: 1 });

export default mongoose.model("Reminder", reminderSchema);
