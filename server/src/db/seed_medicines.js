// server/src/db/seed_medicines.js
// Seed comprehensive medicine data into MongoDB
import dotenv from "dotenv";
import mongoose from "mongoose";
import { Medicine } from "../models/medicine.model.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/healthcare";

console.log("🔄 Starting medicine seeding...");
console.log(`📍 Connecting to: ${MONGODB_URI}`);

const PHARMACIES = [
  "Apollo Pharmacy", "MedPlus", "Wellness Forever",
  "Frank Ross Pharmacy", "Healthkart", "Netmeds"
];

const medicineData = [
  // =================== ALLOPATH ===================
  {
    name: "Paracetamol 500mg",
    brand: "Calpol",
    category: "Allopath",
    price: 28,
    discountPrice: 22,
    stock: 500,
    requiresPrescription: false,
    form: "Tablet",
    packaging: "Strip of 15 tablets",
    description: "Used to reduce fever and relieve mild to moderate pain.",
    availableIn: ["Apollo Pharmacy", "MedPlus", "Wellness Forever"]
  },
  {
    name: "Amoxicillin 500mg",
    brand: "Mox",
    category: "Allopath",
    price: 120,
    discountPrice: 98,
    stock: 200,
    requiresPrescription: true,
    form: "Capsule",
    packaging: "Strip of 10 capsules",
    description: "Antibiotic used to treat bacterial infections.",
    availableIn: ["Apollo Pharmacy", "Frank Ross Pharmacy"]
  },
  {
    name: "Metformin 500mg",
    brand: "Glycomet",
    category: "Allopath",
    price: 65,
    discountPrice: 52,
    stock: 350,
    requiresPrescription: true,
    form: "Tablet",
    packaging: "Strip of 20 tablets",
    description: "Used to manage type 2 diabetes.",
    availableIn: ["MedPlus", "Healthkart", "Netmeds"]
  },
  {
    name: "Atorvastatin 10mg",
    brand: "Atorva",
    category: "Allopath",
    price: 89,
    discountPrice: 72,
    stock: 280,
    requiresPrescription: true,
    form: "Tablet",
    packaging: "Strip of 15 tablets",
    description: "Reduces cholesterol and risk of heart disease.",
    availableIn: ["Apollo Pharmacy", "Wellness Forever"]
  },
  {
    name: "Omeprazole 20mg",
    brand: "Omez",
    category: "Allopath",
    price: 55,
    discountPrice: 45,
    stock: 400,
    requiresPrescription: false,
    form: "Capsule",
    packaging: "Strip of 10 capsules",
    description: "Treats acid reflux and stomach ulcers.",
    availableIn: ["MedPlus", "Frank Ross Pharmacy", "Netmeds"]
  },
  {
    name: "Amlodipine 5mg",
    brand: "Amlong",
    category: "Allopath",
    price: 45,
    discountPrice: 38,
    stock: 300,
    requiresPrescription: true,
    form: "Tablet",
    packaging: "Strip of 10 tablets",
    description: "Calcium channel blocker for hypertension.",
    availableIn: ["Apollo Pharmacy", "Healthkart"]
  },
  {
    name: "Cetirizine 10mg",
    brand: "Zyrtec",
    category: "Allopath",
    price: 35,
    discountPrice: 28,
    stock: 450,
    requiresPrescription: false,
    form: "Tablet",
    packaging: "Strip of 10 tablets",
    description: "Antihistamine for allergies and hay fever.",
    availableIn: ["Wellness Forever", "MedPlus", "Netmeds"]
  },
  {
    name: "Azithromycin 500mg",
    brand: "Azee",
    category: "Allopath",
    price: 145,
    discountPrice: 118,
    stock: 150,
    requiresPrescription: true,
    form: "Tablet",
    packaging: "Pack of 3 tablets",
    description: "Macrolide antibiotic for respiratory and skin infections.",
    availableIn: ["Apollo Pharmacy", "Frank Ross Pharmacy"]
  },
  {
    name: "Pantoprazole 40mg",
    brand: "Pan 40",
    category: "Allopath",
    price: 72,
    discountPrice: 58,
    stock: 320,
    requiresPrescription: false,
    form: "Tablet",
    packaging: "Strip of 15 tablets",
    description: "Proton pump inhibitor for GERD and peptic ulcer.",
    availableIn: ["MedPlus", "Healthkart", "Apollo Pharmacy"]
  },
  {
    name: "Losartan 50mg",
    brand: "Losar",
    category: "Allopath",
    price: 58,
    discountPrice: null,
    stock: 270,
    requiresPrescription: true,
    form: "Tablet",
    packaging: "Strip of 10 tablets",
    description: "ARB medication for high blood pressure and kidney protection in diabetes.",
    availableIn: ["Wellness Forever", "Netmeds"]
  },

  // =================== AYURVEDA ===================
  {
    name: "Ashwagandha Root Extract",
    brand: "Himalaya",
    category: "Ayurveda",
    price: 199,
    discountPrice: 169,
    stock: 200,
    requiresPrescription: false,
    form: "Capsule",
    packaging: "Bottle of 60 capsules",
    description: "Adaptogen herb for stress relief and vitality.",
    availableIn: ["Apollo Pharmacy", "Wellness Forever", "Healthkart"]
  },
  {
    name: "Triphala Churna",
    brand: "Dabur",
    category: "Ayurveda",
    price: 85,
    discountPrice: 72,
    stock: 180,
    requiresPrescription: false,
    form: "Powder",
    packaging: "250g pouch",
    description: "Traditional tridoshic herbal blend for digestive health.",
    availableIn: ["MedPlus", "Frank Ross Pharmacy"]
  },
  {
    name: "Shilajit Resin",
    brand: "Zandu",
    category: "Ayurveda",
    price: 449,
    discountPrice: 380,
    stock: 90,
    requiresPrescription: false,
    form: "Resin",
    packaging: "20g jar",
    description: "Mineral-rich resin for energy, stamina and male vitality.",
    availableIn: ["Apollo Pharmacy", "Healthkart"]
  },
  {
    name: "Brahmi Tablets",
    brand: "Patanjali",
    category: "Ayurveda",
    price: 125,
    discountPrice: 105,
    stock: 160,
    requiresPrescription: false,
    form: "Tablet",
    packaging: "Strip of 60 tablets",
    description: "Brain tonic for memory, concentration and cognitive function.",
    availableIn: ["Wellness Forever", "Netmeds"]
  },
  {
    name: "Chyawanprash",
    brand: "Dabur",
    category: "Ayurveda",
    price: 225,
    discountPrice: 189,
    stock: 250,
    requiresPrescription: false,
    form: "Paste",
    packaging: "500g jar",
    description: "Herbal jam for immunity building and strength.",
    availableIn: ["Apollo Pharmacy", "MedPlus", "Frank Ross Pharmacy"]
  },
  {
    name: "Turmeric Curcumin",
    brand: "Himalaya",
    category: "Ayurveda",
    price: 299,
    discountPrice: 249,
    stock: 130,
    requiresPrescription: false,
    form: "Capsule",
    packaging: "Bottle of 60 capsules",
    description: "Anti-inflammatory and antioxidant herbal supplement.",
    availableIn: ["Healthkart", "Wellness Forever", "Netmeds"]
  },
  {
    name: "Neem Capsules",
    brand: "Organic India",
    category: "Ayurveda",
    price: 175,
    discountPrice: null,
    stock: 110,
    requiresPrescription: false,
    form: "Capsule",
    packaging: "Bottle of 60 capsules",
    description: "Blood purifier and skin health support.",
    availableIn: ["Apollo Pharmacy", "Healthkart"]
  },
  {
    name: "Giloy Ghanvati",
    brand: "Baidyanath",
    category: "Ayurveda",
    price: 140,
    discountPrice: 118,
    stock: 145,
    requiresPrescription: false,
    form: "Tablet",
    packaging: "Strip of 40 tablets",
    description: "Immunity booster and anti-fever herb.",
    availableIn: ["MedPlus", "Frank Ross Pharmacy", "Netmeds"]
  },

  // =================== HOMEOPATH ===================
  {
    name: "Arnica Montana 30C",
    brand: "SBL",
    category: "Homeopath",
    price: 95,
    discountPrice: 80,
    stock: 75,
    requiresPrescription: false,
    form: "Pellets",
    packaging: "Bottle of 25g",
    description: "Homeopathic remedy for bruises, sprains and muscle soreness.",
    availableIn: ["Apollo Pharmacy", "MedPlus"]
  },
  {
    name: "Belladonna 30C",
    brand: "Dr. Reckeweg",
    category: "Homeopath",
    price: 110,
    discountPrice: 92,
    stock: 60,
    requiresPrescription: false,
    form: "Drops",
    packaging: "Bottle of 22ml",
    description: "For fever, throbbing headaches and inflammation.",
    availableIn: ["Wellness Forever", "Frank Ross Pharmacy"]
  },
  {
    name: "Nux Vomica 30C",
    brand: "Schwabe",
    category: "Homeopath",
    price: 88,
    discountPrice: 75,
    stock: 65,
    requiresPrescription: false,
    form: "Pellets",
    packaging: "Bottle of 25g",
    description: "Digestive complaints, hangover, irritability.",
    availableIn: ["MedPlus", "Netmeds"]
  },
  {
    name: "Rhus Toxicodendron 200C",
    brand: "SBL",
    category: "Homeopath",
    price: 105,
    discountPrice: null,
    stock: 55,
    requiresPrescription: false,
    form: "Pellets",
    packaging: "Bottle of 25g",
    description: "Joint pain, stiffness better with motion.",
    availableIn: ["Apollo Pharmacy", "Healthkart"]
  },

  // =================== UNANI ===================
  {
    name: "Hamdard Safi",
    brand: "Hamdard",
    category: "Unani",
    price: 195,
    discountPrice: 165,
    stock: 120,
    requiresPrescription: false,
    form: "Syrup",
    packaging: "Bottle of 200ml",
    description: "Blood purifier for skin disorders and acne.",
    availableIn: ["Apollo Pharmacy", "MedPlus", "Frank Ross Pharmacy"]
  },
  {
    name: "Roghan Badam Shirin",
    brand: "Hamdard",
    category: "Unani",
    price: 255,
    discountPrice: 218,
    stock: 85,
    requiresPrescription: false,
    form: "Oil",
    packaging: "Bottle of 100ml",
    description: "Sweet almond oil for brain and memory strength.",
    availableIn: ["MedPlus", "Wellness Forever"]
  },
  {
    name: "Majun Ushba",
    brand: "Rex",
    category: "Unani",
    price: 175,
    discountPrice: null,
    stock: 45,
    requiresPrescription: false,
    form: "Paste",
    packaging: "125g jar",
    description: "Unani medicine for skin and blood purification.",
    availableIn: ["Netmeds", "Frank Ross Pharmacy"]
  },

  // =================== GENERAL ===================
  {
    name: "Vitamin D3 60000 IU",
    brand: "Calcirol",
    category: "General",
    price: 140,
    discountPrice: 118,
    stock: 300,
    requiresPrescription: false,
    form: "Capsule",
    packaging: "Strip of 4 sachets",
    description: "Vitamin D supplement for bone health and immunity.",
    availableIn: ["Apollo Pharmacy", "Healthkart", "Netmeds"]
  },
  {
    name: "Vitamin C 500mg",
    brand: "Limcee",
    category: "General",
    price: 42,
    discountPrice: 35,
    stock: 500,
    requiresPrescription: false,
    form: "Chewable Tablet",
    packaging: "Strip of 15 tablets",
    description: "Antioxidant vitamin for immune support.",
    availableIn: ["MedPlus", "Wellness Forever", "Apollo Pharmacy"]
  },
  {
    name: "Zinc + Vitamin C Effervescent",
    brand: "Zincovit",
    category: "General",
    price: 95,
    discountPrice: 80,
    stock: 220,
    requiresPrescription: false,
    form: "Effervescent Tablet",
    packaging: "Tube of 10 tablets",
    description: "Immune booster with zinc and vitamin C.",
    availableIn: ["Healthkart", "Netmeds", "Frank Ross Pharmacy"]
  },
  {
    name: "Multivitamin + Minerals",
    brand: "Supradyn",
    category: "General",
    price: 225,
    discountPrice: 189,
    stock: 180,
    requiresPrescription: false,
    form: "Tablet",
    packaging: "Strip of 15 tablets",
    description: "Daily multivitamin for overall health and energy.",
    availableIn: ["Apollo Pharmacy", "MedPlus", "Healthkart"]
  },
  {
    name: "Omega 3 Fish Oil 1000mg",
    brand: "Cardium",
    category: "General",
    price: 320,
    discountPrice: 269,
    stock: 150,
    requiresPrescription: false,
    form: "Softgel Capsule",
    packaging: "Bottle of 30 capsules",
    description: "Heart health supplement with EPA and DHA.",
    availableIn: ["Wellness Forever", "Healthkart", "Netmeds"]
  },
  {
    name: "Probiotic Lactobacillus",
    brand: "Ecosprin",
    category: "General",
    price: 185,
    discountPrice: 155,
    stock: 120,
    requiresPrescription: false,
    form: "Capsule",
    packaging: "Strip of 10 capsules",
    description: "Gut flora support for digestive and immune health.",
    availableIn: ["MedPlus", "Apollo Pharmacy"]
  },
  {
    name: "Iron + Folic Acid",
    brand: "Feronia",
    category: "General",
    price: 68,
    discountPrice: 55,
    stock: 400,
    requiresPrescription: false,
    form: "Tablet",
    packaging: "Strip of 30 tablets",
    description: "Iron supplement for anemia prevention and energy.",
    availableIn: ["Frank Ross Pharmacy", "Wellness Forever", "Netmeds"]
  },
  {
    name: "Calcium + Vitamin D3",
    brand: "Shelcal",
    category: "General",
    price: 130,
    discountPrice: 108,
    stock: 260,
    requiresPrescription: false,
    form: "Tablet",
    packaging: "Strip of 15 tablets",
    description: "Bone strength supplement with calcium and Vitamin D3.",
    availableIn: ["Apollo Pharmacy", "Healthkart", "MedPlus"]
  }
];

const seedMedicines = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const existing = await Medicine.countDocuments();
    console.log(`📊 Existing medicines in DB: ${existing}`);

    if (existing >= medicineData.length) {
      console.log("⚠️  Medicines already seeded. Skipping.");
      await mongoose.disconnect();
      process.exit(0);
    }

    // Delete existing ones only if re-seeding
    await Medicine.deleteMany({});
    console.log("🗑️  Cleared existing medicines");

    const inserted = await Medicine.insertMany(medicineData);
    console.log(`✅ Successfully seeded ${inserted.length} medicines!`);

    // Print summary by category
    const summary = {};
    inserted.forEach(m => {
      summary[m.category] = (summary[m.category] || 0) + 1;
    });
    console.log("📦 Seeding summary by category:", summary);

  } catch (error) {
    console.error("❌ Error seeding medicines:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
};

seedMedicines();
