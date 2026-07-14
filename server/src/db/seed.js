// server/src/db/seed.js
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/User.model.js";
import { Patient } from "../models/Patient.model.js";
import { Doctor } from "../models/Doctor.model.js";
import { Technician } from "../models/technician.model.js";

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/healthcare";

console.log("🔄 Starting database seeding...");
console.log(`📍 Connecting to: ${MONGODB_URI}`);

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB Connected for seeding");

    // 1. Clear existing users and profiles
    console.log("🧹 Clearing existing users and profiles...");
    await User.deleteMany({});
    await Patient.deleteMany({});
    await Doctor.deleteMany({});
    await Technician.deleteMany({});
    console.log("✅ Collections cleared");

    // 2. Define users to seed
    const usersData = [
      {
        firstName: "Patient",
        lastName: "One",
        email: "userone1@gmail.com",
        password: "User@one1",
        role: "patient",
        phoneNumber: "+1234567890",
        isEmailVerified: true,
      },
      {
        firstName: "Doctor",
        lastName: "Two",
        email: "usertwo2@gmail.com",
        password: "User@two2",
        role: "doctor",
        phoneNumber: "+1234567891",
        isEmailVerified: true,
      },
      {
        firstName: "Technician",
        lastName: "Three",
        email: "userthree3@gmail.com",
        password: "User@three3",
        role: "technician",
        phoneNumber: "+1234567892",
        isEmailVerified: true,
      },
      {
        firstName: "Admin",
        lastName: "User",
        email: "admin@example.com",
        password: "AdminPassword123!",
        role: "admin",
        phoneNumber: "+1234567893",
        isEmailVerified: true,
      },
      {
        firstName: "Souvik",
        lastName: "Patra",
        email: "patrasouvik313@gmail.com",
        password: "souvik@123456",
        role: "admin",
        phoneNumber: "+1234567894",
        isEmailVerified: true,
      }
    ];

    for (const u of usersData) {
      console.log(`👤 Creating user: ${u.email} (${u.role})...`);
      
      // We manually create because pre-save hook handles hashing
      const user = await User.create({
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        password: u.password,
        role: u.role,
        phoneNumber: u.phoneNumber,
        isEmailVerified: u.isEmailVerified,
      });

      // Create profiles depending on role
      if (u.role === "patient") {
        console.log(`  🏥 Creating patient profile for ${u.email}...`);
        const patient = await Patient.create({
          user: user._id,
        });
        user.patientId = patient._id;
        await user.save();
        console.log(`  ✅ Patient profile created: ${patient._id}`);
      } else if (u.role === "doctor") {
        console.log(`  👨‍⚕️ Creating doctor profile for ${u.email}...`);
        const doctor = await Doctor.create({
          name: `Dr. ${u.firstName} ${u.lastName}`,
          medicalLicenseNumber: "LIC" + Math.floor(100000 + Math.random() * 900000),
          specialty: "General Medicine",
          experience: "10 years",
          price: "₹590",
          rating: 4.8,
          reviews: 12,
        });
        user.doctorId = doctor._id;
        await user.save();
        console.log(`  ✅ Doctor profile created: ${doctor._id}`);
      } else if (u.role === "technician") {
        console.log(`  🧪 Creating technician profile for ${u.email}...`);
        const technician = await Technician.create({
          user: user._id,
          name: `${u.firstName} ${u.lastName}`,
          employeeId: "EMP" + Math.floor(100000 + Math.random() * 900000),
          role: "Lab Technician",
          experience: "5 years",
          department: "Pathology & Diagnostics",
          phone: u.phoneNumber,
          shift: "Morning (8 AM - 4 PM)",
        });
        console.log(`  ✅ Technician profile created: ${technician._id}`);
      }
    }

    console.log("🎉 Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  }
}

seed();
