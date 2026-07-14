// server/src/db/seed_pharmacies.js
// Seed pharmacy data into MongoDB linked to seeded medicines
import dotenv from "dotenv";
import mongoose from "mongoose";
import { Medicine } from "../models/medicine.model.js";
import { Pharmacy } from "../models/Pharmacy.model.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/healthcare";

console.log("🔄 Starting pharmacy seeding...");

const seedPharmacies = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Check if medicines exist
    const medicineCount = await Medicine.countDocuments();
    if (medicineCount === 0) {
      console.error("❌ No medicines found. Run seed_medicines.js first!");
      process.exit(1);
    }
    console.log(`📊 Found ${medicineCount} medicines to link`);

    // Get all medicine IDs
    const allMedicines = await Medicine.find({}, '_id name availableIn').lean();

    // Helper: get medicine IDs for a given pharmacy name
    const getMedIdsForPharmacy = (pharmacyName) => {
      return allMedicines
        .filter(m => m.availableIn && m.availableIn.some(p =>
          p.toLowerCase().includes(pharmacyName.toLowerCase()) ||
          pharmacyName.toLowerCase().includes(p.toLowerCase())
        ))
        .map(m => m._id);
    };

    const pharmacyData = [
      {
        name: "Apollo Pharmacy",
        phone: "+91 22 4343 4343",
        address: "Ground Floor, Phoenix Market City, LBS Marg, Mumbai",
        rating: 4.8,
        coordinates: { lat: 19.0760, lng: 72.8777 },
        latOffset: 0.002,
        lngOffset: 0.003,
        isGooglePlace: false,
        availableMedicines: getMedIdsForPharmacy("Apollo Pharmacy")
      },
      {
        name: "MedPlus",
        phone: "+91 22 2828 2828",
        address: "Shop No 12, Andheri West, Mumbai",
        rating: 4.5,
        coordinates: { lat: 19.0760, lng: 72.8777 },
        latOffset: -0.003,
        lngOffset: 0.005,
        isGooglePlace: false,
        availableMedicines: getMedIdsForPharmacy("MedPlus")
      },
      {
        name: "Wellness Forever",
        phone: "+91 22 3939 3939",
        address: "Linking Road, Bandra West, Mumbai",
        rating: 4.6,
        coordinates: { lat: 19.0760, lng: 72.8777 },
        latOffset: 0.005,
        lngOffset: -0.002,
        isGooglePlace: false,
        availableMedicines: getMedIdsForPharmacy("Wellness Forever")
      },
      {
        name: "Frank Ross Pharmacy",
        phone: "+91 33 2222 3333",
        address: "Park Street, Kolkata",
        rating: 4.4,
        coordinates: { lat: 22.5726, lng: 88.3639 },
        latOffset: 0.004,
        lngOffset: 0.004,
        isGooglePlace: false,
        availableMedicines: getMedIdsForPharmacy("Frank Ross Pharmacy")
      },
      {
        name: "Healthkart",
        phone: "+91 11 6666 7777",
        address: "Connaught Place, New Delhi",
        rating: 4.7,
        coordinates: { lat: 28.7041, lng: 77.1025 },
        latOffset: -0.002,
        lngOffset: 0.006,
        isGooglePlace: false,
        availableMedicines: getMedIdsForPharmacy("Healthkart")
      },
      {
        name: "Netmeds",
        phone: "+91 44 5555 8888",
        address: "Anna Salai, Chennai",
        rating: 4.6,
        coordinates: { lat: 13.0827, lng: 80.2707 },
        latOffset: 0.003,
        lngOffset: -0.003,
        isGooglePlace: false,
        availableMedicines: getMedIdsForPharmacy("Netmeds")
      }
    ];

    // Clear and re-seed
    const existingCount = await Pharmacy.countDocuments();
    if (existingCount > 0) {
      await Pharmacy.deleteMany({});
      console.log(`🗑️  Cleared ${existingCount} existing pharmacies`);
    }

    const inserted = await Pharmacy.insertMany(pharmacyData);
    console.log(`✅ Successfully seeded ${inserted.length} pharmacies!`);

    inserted.forEach(p => {
      console.log(`  📍 ${p.name} - ${p.availableMedicines.length} medicines linked`);
    });

  } catch (error) {
    console.error("❌ Error seeding pharmacies:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
};

seedPharmacies();
