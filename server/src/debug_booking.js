import dotenv from "dotenv";
import mongoose from "mongoose";
import { User } from "./models/User.model.js";
import { Doctor } from "./models/Doctor.js";
import { scheduleAppointment } from "./controllers/patient.controller.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/healthcare";

async function run() {
    try {
        console.log(`🔌 Connecting to MongoDB: ${MONGODB_URI}`);
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected");

        // Find or create a test patient user
        let user = await User.findOne({ email: "test_patient@example.com" });
        if (!user) {
            user = await User.create({
                firstName: "Test",
                lastName: "Patient",
                email: "test_patient@example.com",
                password: "Password123!",
                role: "patient",
                isEmailVerified: true
            });
        }
        console.log(`👤 Using Patient User: ${user.email} (ID: ${user._id})`);

        // Get a doctor
        const doctor = await Doctor.findOne();
        if (!doctor) {
            console.log("❌ No doctor found. Please run seedAll.js first.");
            return;
        }
        console.log(`👨‍⚕️ Using Doctor: ${doctor.fullName} (ID: ${doctor._id})`);

        // Mock req and res objects
        const req = {
            user: user,
            body: {
                doctorId: doctor._id.toString(),
                appointmentDate: "2026-07-25",
                appointmentTime: "10:00",
                type: "video",
                reason: "Regular physical checkup"
            }
        };

        const res = {
            status: function(code) {
                console.log(`📥 Response Status: ${code}`);
                return this;
            },
            json: function(data) {
                console.log("📥 Response JSON:", JSON.stringify(data, null, 2));
                return this;
            }
        };

        console.log("🚀 Executing scheduleAppointment controller...");
        
        // Run with error middleware simulation
        try {
            await scheduleAppointment(req, res, (err) => {
                if (err) {
                    console.error("🚨 Controller threw error via next():", err);
                } else {
                    console.log("✅ Next called without error");
                }
            });
        } catch (controllerErr) {
            console.error("🚨 Controller threw direct exception:", controllerErr);
        }

    } catch (e) {
        console.error("❌ Crash during run script execution:", e);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 Disconnected from MongoDB");
    }
}

run();
