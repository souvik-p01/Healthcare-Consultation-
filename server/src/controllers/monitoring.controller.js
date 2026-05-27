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
