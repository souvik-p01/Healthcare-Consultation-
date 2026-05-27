import mongoose, { Schema } from "mongoose";

const healthAlertSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    alertType: {
      type: String,
      enum: ['high_blood_pressure', 'low_blood_pressure', 'high_heart_rate', 'low_heart_rate', 'high_temperature', 'low_temperature', 'high_blood_sugar', 'low_blood_sugar', 'low_oxygen', 'other'],
      required: true
    },
    threshold: {
      min: {
        type: Number,
        required: true
      },
      max: {
        type: Number,
        required: true
      },
      unit: {
        type: String,
        required: true
      }
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    notificationMethods: [{
      type: String,
      enum: ['push', 'email', 'sms', 'in_app']
    }],
    notifyDoctor: {
      type: Boolean,
      default: false
    },
    description: {
      type: String,
      trim: true
    },
    triggeredCount: {
      type: Number,
      default: 0
    },
    lastTriggered: {
      type: Date
    },
    acknowledgedAt: {
      type: Date
    },
    isResolved: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

healthAlertSchema.index({ userId: 1, enabled: 1 });
healthAlertSchema.index({ userId: 1, alertType: 1, enabled: 1 });

export default mongoose.model("HealthAlert", healthAlertSchema);
