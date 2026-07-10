import { Router } from "express";
import { aiChat } from "../controllers/ai.controller.js";

const router = Router();

router.post("/chat", aiChat);

router.post("/analyze-test", (req, res) => {
    res.json({ success: true, message: "AI Analysis stub response" });
});

router.post("/suggest-maintenance", (req, res) => {
    res.json({ success: true, message: "AI Maintenance suggestion stub response" });
});

router.post("/quality-check", (req, res) => {
    res.json({ success: true, message: "AI Quality check stub response" });
});

export default router;
