import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
    HealthMetric,
    Device,
    Medication,
    Reminder,
    HealthAlert,
    HealthGoal,
    HealthSettings
} from "../models/monitoring.model.js";

// Helper: Seed default data if collections are empty for a user
const seedInitialData = async (userId) => {
    // 1. Check & Seed Settings
    let settings = await HealthSettings.findOne({ userId });
    if (!settings) {
        settings = await HealthSettings.create({
            userId,
            language: "en",
            preferredContactMethod: "email",
            notifications: { email: true, sms: true, push: true }
        });
    }

    // 2. Check & Seed Devices
    const deviceCount = await Device.countDocuments({ userId });
    if (deviceCount === 0) {
        await Device.insertMany([
            { userId, name: "Smart Watch", type: "wearable", manufacturer: "Apple", connected: true, battery: 85 },
            { userId, name: "Blood Pressure Monitor", type: "device", manufacturer: "Omron", connected: true, battery: 60 },
            { userId, name: "Glucose Meter", type: "device", manufacturer: "Accu-Chek", connected: false, battery: 0 }
        ]);
    }

    // 3. Check & Seed Medications
    const medCount = await Medication.countDocuments({ userId });
    if (medCount === 0) {
        await Medication.insertMany([
            { userId, name: "Metformin 500mg", dosage: "1 tablet", time: "08:00 AM", taken: true },
            { userId, name: "Lisinopril 10mg", dosage: "1 tablet", time: "09:00 AM", taken: true },
            { userId, name: "Atorvastatin 20mg", dosage: "1 tablet", time: "08:00 PM", taken: false },
            { userId, name: "Vitamin D3 1000IU", dosage: "1 softgel", time: "10:00 AM", taken: false }
        ]);
    }

    // 4. Check & Seed Reminders
    const reminderCount = await Reminder.countDocuments({ userId });
    if (reminderCount === 0) {
        await Reminder.insertMany([
            { userId, time: "08:00 AM", action: "Take morning medications", reminderType: "medication", priority: "high", active: true },
            { userId, time: "01:00 PM", action: "Measure blood pressure", reminderType: "measurement", priority: "medium", active: true },
            { userId, time: "07:00 PM", action: "Evening walk 30 mins", reminderType: "activity", priority: "low", active: false },
            { userId, time: "10:00 PM", action: "Take night medications", reminderType: "medication", priority: "high", active: true }
        ]);
    }

    // 5. Check & Seed Alerts
    const alertCount = await HealthAlert.countDocuments({ userId });
    if (alertCount === 0) {
        await HealthAlert.insertMany([
            { userId, type: "High Blood Pressure", threshold: "> 140/90 mmHg", enabled: true },
            { userId, type: "Low Blood Pressure", threshold: "< 90/60 mmHg", enabled: false },
            { userId, type: "High Heart Rate", threshold: "> 100 bpm", enabled: true },
            { userId, type: "Low Oxygen", threshold: "< 95%", enabled: true }
        ]);
    }

    // 6. Check & Seed Goals
    const goalCount = await HealthGoal.countDocuments({ userId });
    if (goalCount === 0) {
        await HealthGoal.insertMany([
            { userId, title: "Daily Steps", progress: 65, status: "in_progress", targetValue: "10000 steps", currentValue: "6500 steps", unit: "steps" },
            { userId, title: "Active Minutes", progress: 40, status: "in_progress", targetValue: "30 mins/day", currentValue: "12 mins/day", unit: "mins" }
        ]);
    }

    // 7. Check & Seed Metrics (including historical records for trends)
    const metricCount = await HealthMetric.countDocuments({ userId });
    if (metricCount === 0) {
        const now = new Date();
        const metricsToInsert = [];
        
        // Generate last 7 days of historical vitals for trend mapping
        const heartRates = [72, 75, 70, 68, 74, 72, 71];
        const systolicBP = [120, 118, 122, 119, 121, 120, 118];
        const diastolicBP = [80, 78, 81, 79, 82, 80, 79];
        const temperatures = [98.6, 98.4, 98.7, 98.5, 98.8, 98.6, 98.6];
        const oxygens = [98, 97, 98, 99, 98, 98, 98];
        const respiration = [16, 17, 15, 16, 18, 16, 16];
        const sugar = [90, 95, 88, 92, 94, 89, 90];
        const bmiVals = [22.4, 22.4, 22.5, 22.5, 22.5, 22.5, 22.5];
        const weightVals = [70.2, 70.1, 70.3, 70.4, 70.4, 70.3, 70.2];
        const sleepHours = [7.2, 7.5, 6.8, 8.0, 7.4, 7.1, 7.5];
        const stepCounts = [8400, 9200, 7500, 6800, 8100, 10200, 8400];
        const calorieCounts = [2200, 2350, 2100, 2050, 2250, 2450, 2200];

        for (let i = 6; i >= 0; i--) {
            const timestamp = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const idx = 6 - i;

            // Heart Rate
            metricsToInsert.push({
                userId,
                metricType: "heart_rate",
                value: heartRates[idx],
                unit: "bpm",
                status: "normal",
                range: "60-100",
                trend: "stable",
                timestamp
            });

            // Blood Pressure
            metricsToInsert.push({
                userId,
                metricType: "blood_pressure",
                systolic: systolicBP[idx],
                diastolic: diastolicBP[idx],
                unit: "mmHg",
                status: "normal",
                range: "120/80",
                trend: "stable",
                timestamp
            });

            // Temperature
            metricsToInsert.push({
                userId,
                metricType: "temperature",
                value: temperatures[idx],
                unit: "°F",
                status: "normal",
                range: "97-99",
                trend: "stable",
                timestamp
            });

            // Oxygen
            metricsToInsert.push({
                userId,
                metricType: "blood_oxygen",
                value: oxygens[idx],
                unit: "%",
                status: "good",
                range: "95-100",
                trend: "stable",
                timestamp
            });

            // Respiratory Rate
            metricsToInsert.push({
                userId,
                metricType: "respiratory_rate",
                value: respiration[idx],
                unit: "breaths/min",
                status: "normal",
                range: "12-20",
                trend: "stable",
                timestamp
            });

            // Blood Sugar
            metricsToInsert.push({
                userId,
                metricType: "blood_sugar",
                value: sugar[idx],
                unit: "mg/dL",
                status: "normal",
                range: "70-140",
                trend: "stable",
                timestamp
            });

            // BMI
            metricsToInsert.push({
                userId,
                metricType: "bmi",
                value: bmiVals[idx],
                unit: "kg/m²",
                status: "normal",
                range: "18.5-24.9",
                trend: "stable",
                timestamp
            });

            // Weight
            metricsToInsert.push({
                userId,
                metricType: "weight",
                value: weightVals[idx],
                unit: "kg",
                status: "normal",
                range: "60-80",
                trend: "stable",
                timestamp
            });

            // Sleep
            metricsToInsert.push({
                userId,
                metricType: "sleep",
                value: sleepHours[idx],
                unit: "hrs",
                status: "normal",
                range: "7-9",
                trend: "stable",
                timestamp
            });

            // Steps
            metricsToInsert.push({
                userId,
                metricType: "steps",
                value: stepCounts[idx],
                unit: "steps",
                status: "normal",
                range: "5000-10000",
                trend: "stable",
                timestamp
            });

            // Calories
            metricsToInsert.push({
                userId,
                metricType: "calories",
                value: calorieCounts[idx],
                unit: "kcal",
                status: "normal",
                range: "1800-2500",
                trend: "stable",
                timestamp
            });
        }
        await HealthMetric.insertMany(metricsToInsert);
    }
};

// ==================== HEALTH METRICS CONTROLLERS ====================

export const addMetric = asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user._id;
    const { metricType, value, systolic, diastolic, unit } = req.body;

    if (!metricType || !unit) {
        throw new ApiError(400, "metricType and unit are required");
    }

    // Determine status & range
    let status = "normal";
    let range = "";
    if (metricType === "heart_rate") {
        range = "60-100";
        if (value < 60 || value > 100) status = "warning";
    } else if (metricType === "blood_pressure") {
        range = "120/80";
        if (systolic > 140 || diastolic > 90) status = "warning";
    } else if (metricType === "temperature") {
        range = "97-99";
        if (value < 97 || value > 99.5) status = "warning";
    } else if (metricType === "blood_oxygen") {
        range = "95-100";
        status = value >= 95 ? "good" : "warning";
    } else if (metricType === "respiratory_rate") {
        range = "12-20";
        if (value < 12 || value > 20) status = "warning";
    } else if (metricType === "blood_sugar") {
        range = "70-140";
        if (value < 70 || value > 140) status = "warning";
    } else if (metricType === "bmi") {
        range = "18.5-24.9";
        if (value < 18.5 || value > 24.9) status = "warning";
    } else if (metricType === "weight") {
        range = "60-80";
    } else if (metricType === "sleep") {
        range = "7-9";
        if (value < 7) status = "warning";
    } else if (metricType === "steps") {
        range = "5000-10000";
    } else if (metricType === "calories") {
        range = "1800-2500";
    }

    const metric = await HealthMetric.create({
        userId,
        metricType,
        value,
        systolic,
        diastolic,
        unit,
        status,
        range,
        timestamp: new Date()
    });

    return res.status(201).json(new ApiResponse(201, metric, "Metric added successfully"));
});

export const getMetrics = asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user._id;
    const { metricType, limit = 30, skip = 0 } = req.query;

    const query = { userId };
    if (metricType) {
        query.metricType = metricType;
    }

    const metrics = await HealthMetric.find(query)
        .sort({ timestamp: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .lean();

    const total = await HealthMetric.countDocuments(query);

    return res.status(200).json(new ApiResponse(200, {
        metrics,
        pagination: {
            total,
            limit: parseInt(limit),
            skip: parseInt(skip)
        }
    }, "Health metrics fetched successfully"));
});

export const getLatestMetrics = asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user._id;
    await seedInitialData(userId);

    const types = [
        "heart_rate", "blood_pressure", "temperature", "blood_oxygen",
        "respiratory_rate", "blood_sugar", "bmi", "weight", "sleep", "steps", "calories"
    ];
    const latestMetrics = {};

    for (const type of types) {
        const metric = await HealthMetric.findOne({ userId, metricType: type })
            .sort({ timestamp: -1 })
            .lean();
        
        if (metric) {
            latestMetrics[type] = metric;
        }
    }

    return res.status(200).json(new ApiResponse(200, latestMetrics, "Latest metrics fetched successfully"));
});

export const getMetricsTrend = asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user._id;
    const { metricType, days = 7 } = req.query;

    if (!metricType) {
        throw new ApiError(400, "metricType query parameter is required");
    }

    await seedInitialData(userId);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const metrics = await HealthMetric.find({
        userId,
        metricType,
        timestamp: { $gte: startDate }
    })
    .sort({ timestamp: 1 })
    .lean();

    return res.status(200).json(new ApiResponse(200, metrics, "Metrics trend fetched successfully"));
});

// ==================== DEVICES CONTROLLERS ====================

export const getDevices = asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user._id;
    await seedInitialData(userId);

    const devices = await Device.find({ userId }).sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, devices, "Devices fetched successfully"));
});

export const addDevice = asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user._id;
    const { name, type, manufacturer } = req.body;

    if (!name) {
        throw new ApiError(400, "Device name is required");
    }

    const device = await Device.create({
        userId,
        name,
        type: type || "wearable",
        manufacturer,
        connected: true,
        battery: Math.floor(Math.random() * 30) + 70 // Random battery 70-100%
    });

    return res.status(201).json(new ApiResponse(201, device, "Device added successfully"));
});

export const updateDevice = asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user._id;
    const { deviceId } = req.params;

    const device = await Device.findOneAndUpdate(
        { _id: deviceId, userId },
        req.body,
        { new: true, runValidators: true }
    );

    if (!device) {
        throw new ApiError(404, "Device not found");
    }

    return res.status(200).json(new ApiResponse(200, device, "Device updated successfully"));
});

export const deleteDevice = asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user._id;
    const { deviceId } = req.params;

    const device = await Device.findOneAndDelete({ _id: deviceId, userId });
    if (!device) {
        throw new ApiError(404, "Device not found");
    }

    return res.status(200).json(new ApiResponse(200, {}, "Device deleted successfully"));
});

// ==================== MEDICATIONS CONTROLLERS ====================

export const getMedications = asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user._id;
    await seedInitialData(userId);

    const medications = await Medication.find({ userId }).sort({ time: 1 });
    return res.status(200).json(new ApiResponse(200, medications, "Medications fetched successfully"));
});

export const addMedication = asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user._id;
    const { name, dosage, time } = req.body;

    if (!name || !dosage || !time) {
        throw new ApiError(400, "Name, dosage, and time are required");
    }

    const medication = await Medication.create({
        userId,
        name,
        dosage,
        time,
        taken: false
    });

    return res.status(201).json(new ApiResponse(201, medication, "Medication added successfully"));
});

export const toggleMedicationTaken = asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user._id;
    const { medicationId } = req.params;

    const medication = await Medication.findOne({ _id: medicationId, userId });
    if (!medication) {
        throw new ApiError(404, "Medication not found");
    }

    medication.taken = !medication.taken;
    await medication.save();

    return res.status(200).json(new ApiResponse(200, medication, "Medication adherence toggled successfully"));
});

// ==================== REMINDERS CONTROLLERS ====================

export const getReminders = asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user._id;
    await seedInitialData(userId);

    const reminders = await Reminder.find({ userId }).sort({ time: 1 });
    return res.status(200).json(new ApiResponse(200, reminders, "Reminders fetched successfully"));
});

export const addReminder = asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user._id;
    const { time, action, reminderType, priority } = req.body;

    if (!time || !action) {
        throw new ApiError(400, "Time and action description are required");
    }

    const reminder = await Reminder.create({
        userId,
        time,
        action,
        reminderType: reminderType || "custom",
        priority: priority || "medium",
        active: true
    });

    return res.status(201).json(new ApiResponse(201, reminder, "Reminder added successfully"));
});

export const toggleReminder = asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user._id;
    const { reminderId } = req.params;

    const reminder = await Reminder.findOne({ _id: reminderId, userId });
    if (!reminder) {
        throw new ApiError(404, "Reminder not found");
    }

    reminder.active = !reminder.active;
    await reminder.save();

    return res.status(200).json(new ApiResponse(200, reminder, "Reminder active status toggled successfully"));
});

// ==================== HEALTH ALERTS CONTROLLERS ====================

export const getAlerts = asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user._id;
    await seedInitialData(userId);

    const alerts = await HealthAlert.find({ userId }).sort({ createdAt: 1 });
    return res.status(200).json(new ApiResponse(200, alerts, "Alerts fetched successfully"));
});

export const addAlert = asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user._id;
    const { type, threshold, enabled } = req.body;

    if (!type || !threshold) {
        throw new ApiError(400, "Type and threshold are required");
    }

    const alert = await HealthAlert.create({
        userId,
        type,
        threshold,
        enabled: enabled !== undefined ? enabled : true
    });

    return res.status(201).json(new ApiResponse(201, alert, "Alert created successfully"));
});

export const updateAlert = asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user._id;
    const { alertId } = req.params;

    const alert = await HealthAlert.findOneAndUpdate(
        { _id: alertId, userId },
        req.body,
        { new: true, runValidators: true }
    );

    if (!alert) {
        throw new ApiError(404, "Alert not found");
    }

    return res.status(200).json(new ApiResponse(200, alert, "Alert updated successfully"));
});

// ==================== HEALTH GOALS CONTROLLERS ====================

export const getGoals = asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user._id;
    await seedInitialData(userId);

    const goals = await HealthGoal.find({ userId }).sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, goals, "Goals fetched successfully"));
});

export const addGoal = asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user._id;
    const { title, targetValue, currentValue, unit, startDate, targetDate } = req.body;

    if (!title) {
        throw new ApiError(400, "Goal title is required");
    }

    const goal = await HealthGoal.create({
        userId,
        title,
        progress: 0,
        status: "in_progress",
        targetValue,
        currentValue,
        unit,
        startDate: startDate || new Date(),
        targetDate
    });

    return res.status(201).json(new ApiResponse(201, goal, "Goal created successfully"));
});

export const updateGoal = asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user._id;
    const { goalId } = req.params;

    const goal = await HealthGoal.findOneAndUpdate(
        { _id: goalId, userId },
        req.body,
        { new: true, runValidators: true }
    );

    if (!goal) {
        throw new ApiError(404, "Goal not found");
    }

    return res.status(200).json(new ApiResponse(200, goal, "Goal updated successfully"));
});

// ==================== SETTINGS CONTROLLERS ====================

export const getSettings = asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user._id;
    await seedInitialData(userId);

    const settings = await HealthSettings.findOne({ userId });
    return res.status(200).json(new ApiResponse(200, settings, "Settings fetched successfully"));
});

export const updateSettings = asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user._id;

    const settings = await HealthSettings.findOneAndUpdate(
        { userId },
        req.body,
        { new: true, runValidators: true, upsert: true }
    );

    return res.status(200).json(new ApiResponse(200, settings, "Settings updated successfully"));
});
