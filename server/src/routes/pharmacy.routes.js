import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getNearbyPharmacies } from "../controllers/pharmacy.controller.js";

const router = Router();

router.use(verifyJWT);
router.get("/nearby", getNearbyPharmacies);

export default router;
