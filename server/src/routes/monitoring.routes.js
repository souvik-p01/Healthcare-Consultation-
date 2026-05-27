import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addHealthMetric,
  getHealthMetrics,
  getLatestMetrics,
  getMetricsTrend,
  addDevice,
  getDevices,
  updateDevice,
  deleteDevice,
  addMedication,
  getMedications,
  toggleMedicationTaken,
  addReminder,
  getReminders,
  toggleReminder,
  addHealthAlert,
  getHealthAlerts,
  updateHealthAlert,
  addHealthGoal,
  getHealthGoals,
  updateHealthGoal
} from "../controllers/monitoring.controller.js";

const router = Router();

// All routes require JWT authentication
router.use(verifyJWT);

// ==================== HEALTH METRICS ROUTES ====================
router.get("/metrics/latest", getLatestMetrics);
router.get("/metrics/trend", getMetricsTrend);
router.post("/metrics", addHealthMetric);
router.get("/metrics", getHealthMetrics);

// ==================== DEVICE ROUTES ====================
router.post("/devices", addDevice);
router.get("/devices", getDevices);
router.put("/devices/:deviceId", updateDevice);
router.delete("/devices/:deviceId", deleteDevice);

// ==================== MEDICATION ROUTES ====================
router.post("/medications", addMedication);
router.get("/medications", getMedications);
router.put("/medications/:medicationId/toggle", toggleMedicationTaken);

// ==================== REMINDER ROUTES ====================
router.post("/reminders", addReminder);
router.get("/reminders", getReminders);
router.put("/reminders/:reminderId/toggle", toggleReminder);

// ==================== HEALTH ALERT ROUTES ====================
router.post("/alerts", addHealthAlert);
router.get("/alerts", getHealthAlerts);
router.put("/alerts/:alertId", updateHealthAlert);

// ==================== HEALTH GOAL ROUTES ====================
router.post("/goals", addHealthGoal);
router.get("/goals", getHealthGoals);
router.put("/goals/:goalId", updateHealthGoal);

export default router;
