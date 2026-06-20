import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getPharmacyOrder,
    listPharmacyOrders,
    updatePharmacyOrderStatus,
    getPharmacyOrderStats
} from "../controllers/pharmacyOrder.controller.js";

const router = Router();

// Apply auth middleware to all pharmacy order endpoints
router.use(verifyJWT);

router.get("/stats", getPharmacyOrderStats);
router.get("/", listPharmacyOrders);
router.get("/:orderId", getPharmacyOrder);
router.patch("/:orderId/status", updatePharmacyOrderStatus);

export default router;
