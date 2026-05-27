import HealthMetric from "../models/healthMetric.model.js";
import Device from "../models/device.model.js";
import Medication from "../models/medication.model.js";
import Reminder from "../models/reminder.model.js";
import HealthAlert from "../models/healthAlert.model.js";
import HealthGoal from "../models/healthGoal.model.js";

// ==================== HEALTH METRICS ====================

export const addHealthMetric = async (req, res) => {
  try {
    const { metricType, value, systolic, diastolic, unit, deviceId, notes } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    if (!metricType || !value || !unit) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: metricType, value, unit"
      });
    }

    const metric = new HealthMetric({
      userId,
      metricType,
      value,
      systolic,
      diastolic,
      unit,
      deviceId,
      notes,
      recordedAt: new Date()
    });

    await metric.save();

    res.status(201).json({
      success: true,
      message: "Health metric recorded successfully",
      data: metric
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add health metric",
      error: error.message
    });
  }
};

export const getHealthMetrics = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { metricType, limit = 30, skip = 0 } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const query = { userId };
    if (metricType) {
      query.metricType = metricType;
    }

    const metrics = await HealthMetric.find(query)
      .sort({ recordedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await HealthMetric.countDocuments(query);

    res.status(200).json({
      success: true,
      data: metrics,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch health metrics",
      error: error.message
    });
  }
};

export const getLatestMetrics = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const metricTypes = ['heart_rate', 'blood_pressure', 'temperature', 'blood_oxygen', 'blood_sugar', 'weight'];
    const latestMetrics = {};

    for (const type of metricTypes) {
      const metric = await HealthMetric.findOne({
        userId,
        metricType: type
      }).sort({ recordedAt: -1 });

      if (metric) {
        latestMetrics[type] = metric;
      }
    }

    res.status(200).json({
      success: true,
      data: latestMetrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch latest metrics",
      error: error.message
    });
  }
};

export const getMetricsTrend = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { metricType, days = 7 } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    if (!metricType) {
      return res.status(400).json({
        success: false,
        message: "metricType is required"
      });
    }

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

export const getLatestMetrics = asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user._id;
    await seedInitialData(userId);

    const types = ["heart_rate", "blood_pressure", "temperature", "blood_oxygen"];
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
      recordedAt: { $gte: startDate }
    }).sort({ recordedAt: 1 });

    res.status(200).json({
      success: true,
      data: metrics,
      trend: {
        metricType,
        days: parseInt(days),
        count: metrics.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch metrics trend",
      error: error.message
    });
  }
};

// ==================== DEVICES ====================

export const addDevice = async (req, res) => {
  try {
    const { name, type, manufacturer, model, serialNumber, capabilities } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, type"
      });
    }

    const device = new Device({
      userId,
      name,
      type,
      manufacturer,
      model,
      serialNumber,
      capabilities,
      connected: true,
      battery: 100
    });

    await device.save();

    res.status(201).json({
      success: true,
      message: "Device added successfully",
      data: device
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add device",
      error: error.message
    });
  }
};

export const getDevices = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const devices = await Device.find({ userId, isActive: true }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: devices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch devices",
      error: error.message
    });
  }
};

export const updateDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { connected, battery, lastSync, status } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const device = await Device.findOne({ _id: deviceId, userId });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found"
      });
    }

    if (connected !== undefined) device.connected = connected;
    if (battery !== undefined) device.battery = battery;
    if (lastSync !== undefined) device.lastSync = lastSync;
    if (status !== undefined) device.status = status;

    await device.save();

    res.status(200).json({
      success: true,
      message: "Device updated successfully",
      data: device
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update device",
      error: error.message
    });
  }
};

export const deleteDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const device = await Device.findOne({ _id: deviceId, userId });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found"
      });
    }

    device.isActive = false;
    await device.save();

    res.status(200).json({
      success: true,
      message: "Device deactivated successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete device",
      error: error.message
    });
  }
};

// ==================== MEDICATIONS ====================

export const addMedication = async (req, res) => {
  try {
    const { name, dosage, frequency, time, startDate, endDate, prescribedBy, reason, sideEffects } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    if (!name || !dosage || !frequency || !time) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    const medication = new Medication({
      userId,
      name,
      dosage,
      frequency,
      time,
      startDate: startDate || new Date(),
      endDate,
      prescribedBy,
      reason,
      sideEffects
    });

    await medication.save();

    res.status(201).json({
      success: true,
      message: "Medication added successfully",
      data: medication
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add medication",
      error: error.message
    });
  }
};

export const getMedications = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const medications = await Medication.find({ userId, isActive: true }).sort({ time: 1 });

    res.status(200).json({
      success: true,
      data: medications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch medications",
      error: error.message
    });
  }
};

export const toggleMedicationTaken = async (req, res) => {
  try {
    const { medicationId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const medication = await Medication.findOne({ _id: medicationId, userId });

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: "Medication not found"
      });
    }

    medication.taken = !medication.taken;
    medication.lastTakenAt = medication.taken ? new Date() : null;
    await medication.save();

    res.status(200).json({
      success: true,
      message: "Medication status updated",
      data: medication
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update medication",
      error: error.message
    });
  }
};

// ==================== REMINDERS ====================

export const addReminder = async (req, res) => {
  try {
    const { time, action, reminderType, repeatPattern, notificationMethod, description, priority, linkedMedication } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    if (!time || !action || !reminderType) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    const reminder = new Reminder({
      userId,
      time,
      action,
      reminderType,
      repeatPattern,
      notificationMethod,
      description,
      priority,
      linkedMedication
    });

    await reminder.save();

    res.status(201).json({
      success: true,
      message: "Reminder added successfully",
      data: reminder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add reminder",
      error: error.message
    });
  }
};

export const getReminders = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const reminders = await Reminder.find({ userId, active: true }).sort({ time: 1 });

    res.status(200).json({
      success: true,
      data: reminders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch reminders",
      error: error.message
    });
  }
};

export const toggleReminder = async (req, res) => {
  try {
    const { reminderId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const reminder = await Reminder.findOne({ _id: reminderId, userId });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: "Reminder not found"
      });
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

    res.status(200).json({
      success: true,
      message: "Reminder status updated",
      data: reminder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update reminder",
      error: error.message
    });
  }
};

// ==================== HEALTH ALERTS ====================

export const addHealthAlert = async (req, res) => {
  try {
    const { alertType, threshold, severity, notificationMethods, description, notifyDoctor } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    if (!alertType || !threshold) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    const alert = new HealthAlert({
      userId,
      alertType,
      threshold,
      severity,
      notificationMethods,
      description,
      notifyDoctor
    });

    await alert.save();

    res.status(201).json({
      success: true,
      message: "Health alert configured successfully",
      data: alert
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add health alert",
      error: error.message
    });
  }
};

export const getHealthAlerts = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const alerts = await HealthAlert.find({ userId, enabled: true });

    res.status(200).json({
      success: true,
      data: alerts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch health alerts",
      error: error.message
    });
  }
};

export const updateHealthAlert = async (req, res) => {
  try {
    const { alertId } = req.params;
    const { enabled, severity, notificationMethods } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const alert = await HealthAlert.findOne({ _id: alertId, userId });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found"
      });
    }

    if (enabled !== undefined) alert.enabled = enabled;
    if (severity !== undefined) alert.severity = severity;
    if (notificationMethods !== undefined) alert.notificationMethods = notificationMethods;

    await alert.save();

    res.status(200).json({
      success: true,
      message: "Health alert updated successfully",
      data: alert
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update health alert",
      error: error.message
    });
  }
};

// ==================== HEALTH GOALS ====================

export const addHealthGoal = async (req, res) => {
  try {
    const { goalType, title, description, targetValue, unit, targetDate, priority, category } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    if (!goalType || !title || !targetValue || !unit || !targetDate) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    const goal = new HealthGoal({
      userId,
      goalType,
      title,
      description,
      targetValue,
      unit,
      targetDate,
      priority,
      category,
      status: 'not_started'
    });

    await goal.save();

    res.status(201).json({
      success: true,
      message: "Health goal created successfully",
      data: goal
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add health goal",
      error: error.message
    });
  }
};

export const getHealthGoals = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { status } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const goals = await HealthGoal.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: goals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch health goals",
      error: error.message
    });
  }
};

export const updateHealthGoal = async (req, res) => {
  try {
    const { goalId } = req.params;
    const { currentValue, progress, status } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const goal = await HealthGoal.findOne({ _id: goalId, userId });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Goal not found"
      });
    }

    if (currentValue !== undefined) goal.currentValue = currentValue;
    if (progress !== undefined) goal.progress = progress;
    if (status !== undefined) goal.status = status;

    await goal.save();

    res.status(200).json({
      success: true,
      message: "Health goal updated successfully",
      data: goal
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update health goal",
      error: error.message
    });
  }
};
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
