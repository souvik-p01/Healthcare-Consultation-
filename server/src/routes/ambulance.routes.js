import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getNearbyAmbulances } from "../controllers/ambulance.controller.js";

const router = Router();

router.use(verifyJWT);
router.get("/nearby", getNearbyAmbulances);

export default router;
