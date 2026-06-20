import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    addMetric,
    getMetrics,
    getLatestMetrics,
    getMetricsTrend,
    getDevices,
    addDevice,
    updateDevice,
    deleteDevice,
    getMedications,
    addMedication,
    toggleMedicationTaken,
    getReminders,
    addReminder,
    toggleReminder,
    getAlerts,
    addAlert,
    updateAlert,
    getGoals,
    addGoal,
    updateGoal,
    getSettings,
    updateSettings
} from "../controllers/monitoring.controller.js";

const router = Router();

// All routes require JWT authentication
router.use(verifyJWT);

// ==================== HEALTH METRICS ROUTES ====================
router.route("/metrics")
    .get(getMetrics)
    .post(addMetric);

router.get("/metrics/latest", getLatestMetrics);
router.get("/metrics/trend", getMetricsTrend);

// ==================== DEVICES ROUTES ====================
router.route("/devices")
    .get(getDevices)
    .post(addDevice);

router.route("/devices/:deviceId")
    .put(updateDevice)
    .delete(deleteDevice);

// ==================== MEDICATIONS ROUTES ====================
router.route("/medications")
    .get(getMedications)
    .post(addMedication);

router.put("/medications/:medicationId/toggle", toggleMedicationTaken);

// ==================== REMINDERS ROUTES ====================
router.route("/reminders")
    .get(getReminders)
    .post(addReminder);

router.put("/reminders/:reminderId/toggle", toggleReminder);

// ==================== HEALTH ALERTS ROUTES ====================
router.route("/alerts")
    .get(getAlerts)
    .post(addAlert);

router.put("/alerts/:alertId", updateAlert);

// ==================== HEALTH GOALS ROUTES ====================
router.route("/goals")
    .get(getGoals)
    .post(addGoal);

router.put("/goals/:goalId", updateGoal);

// ==================== SETTINGS ROUTES ====================
router.route("/settings")
    .get(getSettings)
    .patch(updateSettings);

export default router;
