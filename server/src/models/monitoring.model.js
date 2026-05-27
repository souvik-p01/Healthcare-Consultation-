import mongoose, { Schema } from "mongoose";

// ==================== HEALTH METRICS SCHEMA ====================
const metricSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    metricType: {
        type: String,
        required: true,
        enum: ["heart_rate", "blood_pressure", "temperature", "blood_oxygen"]
    },
    value: {
        type: Number
    },
    systolic: {
        type: Number // For blood pressure
    },
    diastolic: {
        type: Number // For blood pressure
    },
    unit: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["normal", "good", "warning", "critical"],
        default: "normal"
    },
    range: {
        type: String
    },
    trend: {
        type: String,
        enum: ["stable", "upward", "downward"],
        default: "stable"
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// ==================== DEVICES SCHEMA ====================
const deviceSchema = new Schema({
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
        required: true,
        enum: ["wearable", "device", "smartphone"],
        default: "wearable"
    },
    manufacturer: {
        type: String,
        trim: true
    },
    connected: {
        type: Boolean,
        default: true
    },
    battery: {
        type: Number,
        min: 0,
        max: 100,
        default: 100
    }
}, { timestamps: true });

// ==================== MEDICATIONS SCHEMA ====================
const medicationSchema = new Schema({
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
    time: {
        type: String, // e.g. "08:00 AM"
        required: true
    },
    taken: {
        type: Boolean,
        default: false
    },
    date: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// ==================== REMINDERS SCHEMA ====================
const reminderSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    time: {
        type: String, // e.g. "08:00 AM" or "22:00"
        required: true
    },
    action: {
        type: String,
        required: true,
        trim: true
    },
    reminderType: {
        type: String,
        enum: ["medication", "measurement", "activity", "custom"],
        default: "custom"
    },
    priority: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium"
    },
    active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// ==================== HEALTH ALERTS SCHEMA ====================
const alertSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    type: {
        type: String,
        required: true
    },
    threshold: {
        type: String,
        required: true
    },
    enabled: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// ==================== HEALTH GOALS SCHEMA ====================
const goalSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    status: {
        type: String,
        enum: ["not_started", "in_progress", "completed", "abandoned"],
        default: "in_progress"
    },
    targetValue: {
        type: String
    },
    currentValue: {
        type: String
    },
    unit: {
        type: String
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    targetDate: {
        type: Date
    }
}, { timestamps: true });

// ==================== HEALTH SETTINGS SCHEMA ====================
const settingsSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
        index: true
    },
    language: {
        type: String,
        default: "en"
    },
    preferredContactMethod: {
        type: String,
        enum: ["email", "sms", "push", "app"],
        default: "email"
    },
    notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
        push: { type: Boolean, default: true }
    }
}, { timestamps: true });

// Export Models
export const HealthMetric = mongoose.models.HealthMetric || mongoose.model("HealthMetric", metricSchema);
export const Device = mongoose.models.Device || mongoose.model("Device", deviceSchema);
export const Medication = mongoose.models.Medication || mongoose.model("Medication", medicationSchema);
export const Reminder = mongoose.models.Reminder || mongoose.model("Reminder", reminderSchema);
export const HealthAlert = mongoose.models.HealthAlert || mongoose.model("HealthAlert", alertSchema);
export const HealthGoal = mongoose.models.HealthGoal || mongoose.model("HealthGoal", goalSchema);
export const HealthSettings = mongoose.models.HealthSettings || mongoose.model("HealthSettings", settingsSchema);
