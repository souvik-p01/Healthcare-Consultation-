import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getNearbyHospitals,
  requestAmbulance,
  getAmbulanceStatus,
  cancelAmbulanceRequest
} from "../controllers/emergency.controller.js";

const router = Router();

router.use(verifyJWT);

router.get("/hospitals", getNearbyHospitals);
router.post("/request-ambulance", requestAmbulance);
router.get("/ambulance-request/:requestId", getAmbulanceStatus);
router.post("/ambulance-request/:requestId/cancel", cancelAmbulanceRequest);

export default router;
