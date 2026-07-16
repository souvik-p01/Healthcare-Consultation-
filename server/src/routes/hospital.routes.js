import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getNearbyHospitals } from "../controllers/hospital.controller.js";

const router = Router();

router.use(verifyJWT);
router.get("/nearby", getNearbyHospitals);

export default router;
