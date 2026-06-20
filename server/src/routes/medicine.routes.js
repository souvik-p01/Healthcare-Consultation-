import { Router } from "express";
import { getMedicines, getPharmacies } from "../controllers/medicine.controller.js";

const router = Router();

router.get("/", getMedicines);
router.get("/pharmacies", getPharmacies);

export default router;
