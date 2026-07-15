import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import patientRoutes from "./patient.routes.js";
import adminRoutes from "./admin.routes.js";
import paymentRoutes from "./payment.routes.js";
import equipmentRoutes from "./equipment.routes.js";
import notificationRoutes from "./notification.routes.js";
import technicianRoutes from "./technician.routes.js";
import testRoutes from "./test.routes.js";
import monitoringRoutes from "./monitoring.routes.js";
import doctorRoutes from "./doctor.routes.js";
import aiRoutes from "./ai.routes.js";
import medicineRoutes from "./medicine.routes.js";
import pharmacyOrderRoutes from "./pharmacyOrder.routes.js";
import aiSymptomRoutes from "./aiSymptom.routes.js";
import emergencyRoutes from "./emergency.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/patients", patientRoutes);
router.use("/admin", adminRoutes);
router.use("/payments", paymentRoutes);
router.use("/equipment", equipmentRoutes);
router.use("/notifications", notificationRoutes);
router.use("/technicians", technicianRoutes);
router.use("/tests", testRoutes);
router.use("/monitoring", monitoringRoutes);
router.use("/doctors", doctorRoutes);
router.use("/ai", aiRoutes);
router.use("/medicine", medicineRoutes);
router.use("/pharmacy-orders", pharmacyOrderRoutes);
router.use("/ai-symptom", aiSymptomRoutes);
router.use("/emergency", emergencyRoutes);

export default router;
