import dotenv from "dotenv";
import mongoose from "mongoose";
import { Doctor } from "../models/Doctor.js";
import { Hospital } from "../models/Hospital.model.js";
import { Ambulance } from "../models/Ambulance.model.js";
import { Pharmacy } from "../models/Pharmacy.model.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/healthcare";

console.log("🔄 Starting database seeding for all modules...");
console.log(`📍 Connecting to: ${MONGODB_URI}`);

const specialtiesList = [
    "Cardiology", "Neurology", "Pediatrics", "Orthopedics", "Dermatology",
    "Psychiatry", "ENT", "General Physician", "Gynecology", "Oncology",
    "Endocrinology", "Pulmonology", "Nephrology", "Gastroenterology",
    "Dentistry", "Ophthalmology", "Urology", "Physiotherapy", "Emergency Medicine"
];

const indianFirstNames = [
    "Arvind", "Rakesh", "Sanjay", "Vivek", "Rohit", "Kaushik", "Rahul", "Nitin", 
    "Abhishek", "Deepak", "Ashish", "Manish", "Kunal", "Rajesh", "Amit", "Vikram", 
    "Anil", "Sunil", "Pankaj", "Alok", "Vijay", "Suresh", "Ramesh", "Harish",
    "Neha", "Priya", "Aditi", "Anjali", "Sneha", "Pooja", "Soumya", "Ritu", 
    "Aparna", "Meenal", "Shreya", "Kiran", "Divya", "Swati", "Kavita", "Ananya"
];

const indianLastNames = [
    "Kumar", "Sharma", "Mehta", "Gupta", "Kapoor", "Agarwal", "Banerjee", "Sen", 
    "Roy", "Mukherjee", "Das", "Jain", "Singh", "Verma", "Chakraborty", "Ghosh", 
    "Mishra", "Patel", "Dey", "Sinha", "Choudhury", "Nair", "Iyer", "Reddy"
];

const qualificationsMap = {
    "Cardiology": "MD, DM (Cardiology), FACC",
    "Neurology": "MD, DM (Neurology)",
    "Pediatrics": "MBBS, MD (Pediatrics), DCH",
    "Orthopedics": "MS (Orthopedics), M.Ch",
    "Dermatology": "MD (Dermatology, Venereology & Leprosy)",
    "Psychiatry": "MD (Psychiatry), DPM",
    "ENT": "MS (ENT), DLO",
    "General Physician": "MBBS, MD (Internal Medicine)",
    "Gynecology": "MD, MS (Obstetrics & Gynecology), DGO",
    "Oncology": "MD, DM (Medical Oncology)",
    "Endocrinology": "MD, DM (Endocrinology)",
    "Pulmonology": "MD (Pulmonary Medicine), DTCD",
    "Nephrology": "MD, DM (Nephrology)",
    "Gastroenterology": "MD, DM (Gastroenterology)",
    "Dentistry": "BDS, MDS",
    "Ophthalmology": "MS (Ophthalmology), DO",
    "Urology": "MS, M.Ch (Urology)",
    "Physiotherapy": "BPT, MPT",
    "Emergency Medicine": "MD (Emergency Medicine)"
};

const hospitalsList = [
    { name: "Apollo Gleneagles Hospital", lat: 22.5794, lng: 88.4011, phone: "+91 33 2320 3040", city: "Kolkata", state: "West Bengal" },
    { name: "Fortis Hospital", lat: 22.5165, lng: 88.4025, phone: "+91 33 6628 4444", city: "Kolkata", state: "West Bengal" },
    { name: "Ruby General Hospital", lat: 22.5133, lng: 88.4042, phone: "+91 33 3987 1800", city: "Kolkata", state: "West Bengal" },
    { name: "AMRI Hospital Salt Lake", lat: 22.5694, lng: 88.4087, phone: "+91 33 2335 7710", city: "Kolkata", state: "West Bengal" },
    { name: "Medica Superspecialty Hospital", lat: 22.4828, lng: 88.3976, phone: "+91 33 6652 0000", city: "Kolkata", state: "West Bengal" },
    { name: "Nanavati Max Hospital", lat: 19.0967, lng: 72.8404, phone: "+91 22 2626 7500", city: "Mumbai", state: "Maharashtra" },
    { name: "Lilavati Hospital & Research Centre", lat: 19.0510, lng: 72.8285, phone: "+91 22 2675 1000", city: "Mumbai", state: "Maharashtra" },
    { name: "Max Super Specialty Hospital Saket", lat: 28.5283, lng: 77.2117, phone: "+91 11 2651 5050", city: "Delhi", state: "Delhi" },
    { name: "Manipal Hospital", lat: 12.9592, lng: 77.6444, phone: "+91 80 2502 4444", city: "Bangalore", state: "Karnataka" },
    { name: "Apollo Hospitals Greams Road", lat: 13.0602, lng: 80.2520, phone: "+91 44 2829 0200", city: "Chennai", state: "Tamil Nadu" }
];

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("✅ MongoDB Connected for all seeding");

        // 1. Clear existing collections
        console.log("🧹 Clearing existing doctors, hospitals, pharmacies, and ambulances...");
        await Doctor.deleteMany({});
        await Hospital.deleteMany({});
        await Ambulance.deleteMany({});
        await Pharmacy.deleteMany({});
        console.log("✅ Collections cleared");

        // 2. Generate 100+ Indian Doctors
        console.log("👨‍⚕️ Generating 100+ Indian Doctors...");
        const doctors = [];
        
        // Loop to generate 105 doctors to ensure at least 100+ distributed among specialties
        for (let i = 1; i <= 105; i++) {
            const specialty = specialtiesList[i % specialtiesList.length];
            const firstName = indianFirstNames[i % indianFirstNames.length];
            const lastName = indianLastNames[(i + 3) % indianLastNames.length];
            const gender = (i % 2 === 0) ? "Female" : "Male";
            const fullName = `Dr. ${firstName} ${lastName}`;
            
            // Distribute across major cities (Kolkata, Mumbai, Delhi, Bangalore)
            let city = "Kolkata";
            let state = "West Bengal";
            let lat = 22.5726 + (Math.random() - 0.5) * 0.05;
            let lng = 88.3639 + (Math.random() - 0.5) * 0.05;
            
            if (i % 4 === 1) {
                city = "Mumbai";
                state = "Maharashtra";
                lat = 19.0760 + (Math.random() - 0.5) * 0.05;
                lng = 72.8777 + (Math.random() - 0.5) * 0.05;
            } else if (i % 4 === 2) {
                city = "Delhi";
                state = "Delhi";
                lat = 28.6139 + (Math.random() - 0.5) * 0.05;
                lng = 77.2090 + (Math.random() - 0.5) * 0.05;
            } else if (i % 4 === 3) {
                city = "Bangalore";
                state = "Karnataka";
                lat = 12.9716 + (Math.random() - 0.5) * 0.05;
                lng = 77.5946 + (Math.random() - 0.5) * 0.05;
            }

            const exp = Math.floor(4 + Math.random() * 25);
            const fee = Math.floor(300 + Math.random() * 900);
            
            doctors.push({
                doctorId: `doc_${100000 + i}`,
                fullName,
                gender,
                qualification: qualificationsMap[specialty] || "MBBS, MD",
                specialization: specialty,
                subspecialization: `${specialty} Specialist`,
                yearsOfExperience: exp,
                hospitalName: `${hospitalsList[i % hospitalsList.length].name}`,
                clinicName: `${firstName} Clinic & Care`,
                consultationFee: fee,
                languages: i % 3 === 0 ? ["English", "Hindi", "Bengali"] : ["English", "Hindi"],
                rating: parseFloat((4.0 + Math.random() * 1.0).toFixed(1)),
                reviewCount: Math.floor(5 + Math.random() * 80),
                profilePhoto: gender === "Female" ? "👩‍⚕️" : "👨‍⚕️",
                availability: ["Mon", "Tue", "Wed", "Thu", "Fri"],
                nextAvailableSlot: "Tomorrow",
                address: `Avenue Road, Block ${i % 10 + 1}`,
                city,
                state,
                country: "India",
                latitude: lat,
                longitude: lng,
                phone: `+91 98765 ${Math.floor(10000 + Math.random() * 90000)}`,
                email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
                teleconsultAvailable: i % 5 !== 0,
                emergencyAvailable: i % 4 === 0,
                verified: true,
                licenseNumber: `LIC-IND-${1000000 + i}`,
                location: {
                    type: "Point",
                    coordinates: [lng, lat]
                }
            });
        }

        await Doctor.insertMany(doctors);
        console.log(`✅ Seeded ${doctors.length} doctors.`);

        // 3. Seed Hospitals
        console.log("🏥 Seeding Hospitals...");
        const hospitalsToInsert = hospitalsList.map((h, idx) => ({
            hospitalName: h.name,
            address: `Opposite Main Bypass Road, ${h.city}`,
            latitude: h.lat,
            longitude: h.lng,
            phone: h.phone,
            rating: parseFloat((4.0 + Math.random() * 1.0).toFixed(1)),
            ambulanceAvailable: idx % 3 !== 0,
            emergency: true,
            departments: ["Emergency", "Cardiology", "Neurology", "General Medicine"],
            beds: idx % 3 === 0 ? 0 : Math.floor(5 + Math.random() * 30),
            location: {
                type: "Point",
                coordinates: [h.lng, h.lat]
            }
        }));
        await Hospital.insertMany(hospitalsToInsert);
        console.log(`✅ Seeded ${hospitalsToInsert.length} hospitals.`);

        // 4. Seed Ambulances
        console.log("🚨 Seeding Ambulances...");
        const providers = ["Apollo Ambulance", "Ruby Ambulance", "AMRI Ambulance", "Medica Ambulance", "Fortis Ambulance"];
        const ambulancesToInsert = [];

        // Seed 2 ambulances for each provider at various city coordinates
        hospitalsList.slice(0, 5).forEach((h, idx) => {
            providers.forEach((prov, pIdx) => {
                const latOffset = (Math.random() - 0.5) * 0.01;
                const lngOffset = (Math.random() - 0.5) * 0.01;
                
                ambulancesToInsert.push({
                    ambulanceNumber: `MH-12-AM-${idx}${pIdx}00`,
                    providerName: prov,
                    driverName: `Driver ${idx + pIdx + 1}`,
                    driverPhone: `+91 98765 ${Math.floor(10000 + Math.random() * 90000)}`,
                    vehicleType: pIdx % 2 === 0 ? "ICU" : "ALS",
                    ALS: pIdx % 2 === 0,
                    BLS: true,
                    ICU: pIdx % 2 === 0,
                    Neonatal: pIdx === 4,
                    latitude: h.lat + latOffset,
                    longitude: h.lng + lngOffset,
                    availability: true,
                    estimatedArrival: Math.floor(5 + Math.random() * 15),
                    location: {
                        type: "Point",
                        coordinates: [h.lng + lngOffset, h.lat + latOffset]
                    }
                });
            });
        });
        await Ambulance.insertMany(ambulancesToInsert);
        console.log(`✅ Seeded ${ambulancesToInsert.length} ambulances.`);

        // 5. Seed Pharmacies
        console.log("💊 Seeding Pharmacies...");
        const pharmacyNames = ["Apollo Pharmacy", "MedPlus Pharmacy", "Frank Ross Pharmacy", "Netmeds Store", "MedCare Pharmacy"];
        const pharmaciesToInsert = [];

        hospitalsList.forEach((h, idx) => {
            pharmacyNames.forEach((name, pIdx) => {
                const latOffset = (Math.random() - 0.5) * 0.015;
                const lngOffset = (Math.random() - 0.5) * 0.015;
                
                pharmaciesToInsert.push({
                    pharmacyName: `${h.city} ${name}`,
                    address: `Market Lane, ${h.city}`,
                    latitude: h.lat + latOffset,
                    longitude: h.lng + lngOffset,
                    phone: `+91 22 6666 ${Math.floor(1000 + Math.random() * 9000)}`,
                    openNow: pIdx % 3 !== 0,
                    deliveryAvailable: pIdx % 2 === 0,
                    rating: parseFloat((3.8 + Math.random() * 1.2).toFixed(1)),
                    location: {
                        type: "Point",
                        coordinates: [h.lng + lngOffset, h.lat + latOffset]
                    }
                });
            });
        });
        await Pharmacy.insertMany(pharmaciesToInsert);
        console.log(`✅ Seeded ${pharmaciesToInsert.length} pharmacies.`);

        console.log("🎉 Database seeding completed successfully!");
    } catch (error) {
        console.error("❌ Seeding failed:", error);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 MongoDB disconnected");
    }
}

seed();
