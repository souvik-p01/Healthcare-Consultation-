import mongoose, { Schema } from "mongoose";

const healthGoalSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    goalType: {
      type: String,
      enum: ['weight', 'steps', 'exercise_minutes', 'water_intake', 'sleep_hours', 'reduce_stress', 'blood_pressure', 'blood_sugar', 'other'],
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    targetValue: {
      type: Number,
      required: true
    },
    currentValue: {
      type: Number,
      default: 0
    },
    unit: {
      type: String,
      required: true
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    targetDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'abandoned'],
      default: 'not_started'
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    category: {
      type: String,
      trim: true
    },
    reminders: [{
      type: Schema.Types.ObjectId,
      ref: "Reminder"
    }],
    milestones: [{
      value: Number,
      achievedAt: Date
    }],
    notes: [{
      date: Date,
      note: String
    }]
  },
  { timestamps: true }
);

healthGoalSchema.index({ userId: 1, status: 1 });
healthGoalSchema.index({ userId: 1, goalType: 1, status: 1 });

export default mongoose.model("HealthGoal", healthGoalSchema);
