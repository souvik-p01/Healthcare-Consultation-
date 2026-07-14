// server/src/db/seed_doctors.js
import dotenv from "dotenv";
import mongoose from "mongoose";
import { User } from "../models/User.model.js";
import { Doctor } from "../models/Doctor.model.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/healthcare";

console.log("🔄 Starting direct doctor seeding...");
console.log(`📍 Connecting to: ${MONGODB_URI}`);

const doctorsToSeed = [
  {
    firstName: "Cardo",
    lastName: "Heart",
    email: "cardiologist@example.com",
    password: "DoctorPassword123!",
    role: "doctor",
    phoneNumber: "+919876543201",
    specialization: "Cardiology",
    experience: 15,
    consultationFee: 800,
    qualification: "MD Cardiology, DM",
    department: "Cardiology"
  },
  {
    firstName: "Neuro",
    lastName: "Brain",
    email: "neurologist@example.com",
    password: "DoctorPassword123!",
    role: "doctor",
    phoneNumber: "+919876543202",
    specialization: "Neurology",
    experience: 12,
    consultationFee: 900,
    qualification: "MD Neurology, DM",
    department: "Neurology"
  },
  {
    firstName: "Pulmo",
    lastName: "Lung",
    email: "pulmonologist@example.com",
    password: "DoctorPassword123!",
    role: "doctor",
    phoneNumber: "+919876543203",
    specialization: "Pulmonology",
    experience: 10,
    consultationFee: 750,
    qualification: "MD Pulmonology, DNB",
    department: "Pulmonology"
  },
  {
    firstName: "Alice",
    lastName: "Medicine",
    email: "generalphysician@example.com",
    password: "DoctorPassword123!",
    role: "doctor",
    phoneNumber: "+919876543204",
    specialization: "General Medicine",
    experience: 8,
    consultationFee: 500,
    qualification: "MBBS, MD Internal Medicine",
    department: "General Medicine"
  }
];

async function seedDoctors() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB Connected for direct doctor seeding");

    for (const doc of doctorsToSeed) {
      console.log(`🔎 Checking if doctor exists: ${doc.email}...`);
      let user = await User.findOne({ email: doc.email });

      if (user) {
        console.log(`⚠️ User with email ${doc.email} already exists. Updating specialization details...`);
        user.role = "doctor";
        user.specialization = doc.specialization;
        user.experience = doc.experience;
        user.consultationFee = doc.consultationFee;
        user.qualification = doc.qualification;
        user.department = doc.department;
        await user.save();
        console.log(`✅ User ${doc.email} updated.`);
      } else {
        console.log(`🆕 Creating new User document for ${doc.email}...`);
        user = await User.create({
          firstName: doc.firstName,
          lastName: doc.lastName,
          email: doc.email,
          password: doc.password,
          role: "doctor",
          phoneNumber: doc.phoneNumber,
          isEmailVerified: true,
          specialization: doc.specialization,
          experience: doc.experience,
          consultationFee: doc.consultationFee,
          qualification: doc.qualification,
          department: doc.department
        });
        console.log(`✅ User ${doc.email} created.`);
      }

      // Sync linked Doctor profile
      console.log(`👨‍⚕️ Checking linked Doctor profile for ${doc.email}...`);
      let doctorProfile = await Doctor.findOne({ name: `Dr. ${doc.firstName} ${doc.lastName}` });
      if (!doctorProfile) {
        console.log(`🆕 Creating new Doctor profile document...`);
        doctorProfile = await Doctor.create({
          name: `Dr. ${doc.firstName} ${doc.lastName}`,
          medicalLicenseNumber: "LIC" + Math.floor(100000 + Math.random() * 900000),
          specialty: doc.specialization,
          experience: doc.experience.toString() + " years",
          price: "₹" + doc.consultationFee,
          rating: 4.9,
          reviews: 15
        });
      } else {
        doctorProfile.specialty = doc.specialization;
        doctorProfile.experience = doc.experience.toString() + " years";
        doctorProfile.price = "₹" + doc.consultationFee;
        await doctorProfile.save();
      }

      user.doctorId = doctorProfile._id;
      await user.save({ validateBeforeSave: false });
      console.log(`✅ Doctor profile successfully linked: ${doctorProfile._id}\n`);
    }

    console.log("🎉 Seeding of specialized doctors completed successfully!");
  } catch (error) {
    console.error("❌ Direct seeding failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  }
}

seedDoctors();
