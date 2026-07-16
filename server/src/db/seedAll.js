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
    { name: "Apollo Hospitals Greams Road", lat: 13.0602, lng: 80.2520, phone: "+91 44 2829 0200", city: "Chennai", state: "Tamil Nadu" },
    
    // Bankura Hospitals (West Bengal)
    { name: "Bankura Sammilani Medical College And Hospital", lat: 23.2205, lng: 87.0782, phone: "03242 250 929", city: "Bankura", state: "West Bengal", rating: 4.2 },
    { name: "JEEBAN SURAKSHA HOSPITAL", lat: 23.2355, lng: 87.0582, phone: "081700 21311", city: "Bankura", state: "West Bengal", rating: 3.7 },
    { name: "Bankura Seva Niketan Hospital", lat: 23.2381, lng: 87.0691, phone: "077977 01790", city: "Bankura", state: "West Bengal", rating: 4.3 },
    { name: "Bankura Nursing Home", lat: 23.2392, lng: 87.0702, phone: "095642 80791", city: "Bankura", state: "West Bengal", rating: 4.4 },
    { name: "Bankura Sammilani Medical College & Hospital Superspeciality Block", lat: 23.2212, lng: 87.0791, phone: "094342 31480", city: "Bankura", state: "West Bengal", rating: 4.3 },
    { name: "Hardik Hospital", lat: 23.2421, lng: 87.0601, phone: "094347 44690", city: "Bankura", state: "West Bengal", rating: 4.3 },
    { name: "Bishnupur Super Speciality Hospital", lat: 23.0673, lng: 87.3164, phone: "+91 3244 252 024", city: "Bankura", state: "West Bengal", rating: 3.7 },
    { name: "Pulse Hospital", lat: 23.2291, lng: 87.0812, phone: "090649 41192", city: "Bankura", state: "West Bengal", rating: 4.3 },
    { name: "Maa Mahamaya Hospital", lat: 23.2341, lng: 87.0652, phone: "074790 06140", city: "Bankura", state: "West Bengal", rating: 3.3 },
    { name: "Parasmoni Multi Speciality Hospital", lat: 23.2361, lng: 87.0672, phone: "03242 251 555", city: "Bankura", state: "West Bengal", rating: 4.5 },
    { name: "Sun hospital", lat: 23.2312, lng: 87.0622, phone: "+91 3242 251 111", city: "Bankura", state: "West Bengal", rating: 3.4 },
    { name: "Barjora Super Speciality Hospital", lat: 23.4285, lng: 87.2912, phone: "+91 3241 257 057", city: "Bankura", state: "West Bengal", rating: 3.8 },
    { name: "SIBANI SEVANIKETAN PVT. LTD.", lat: 23.2335, lng: 87.0645, phone: "083730 85100", city: "Bankura", state: "West Bengal", rating: 3.2 },
    { name: "Shamayita Jeevan Surya Hospital", lat: 23.3615, lng: 87.1122, phone: "+91 3242 247 247", city: "Bankura", state: "West Bengal", rating: 4.6 },
    { name: "Chhatna Super Speciality Hospital", lat: 23.3012, lng: 86.9812, phone: "+91 3242 277 277", city: "Bankura", state: "West Bengal", rating: 4.1 },
    { name: "Onda Super Speciality Hospital", lat: 23.1312, lng: 87.2012, phone: "+91 3242 266 266", city: "Bankura", state: "West Bengal", rating: 4.0 },
    { name: "DAMODAR HEALTHCARE", lat: 23.5355, lng: 87.2812, phone: "094752 40280", city: "Bankura", state: "West Bengal", rating: 4.5 }
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

        // 2. Generate 110 Indian Doctors distributed in major cities and Bankura
        console.log("👨‍⚕️ Generating 110 Indian Doctors...");
        const doctors = [];
        
        for (let i = 1; i <= 110; i++) {
            const specialty = specialtiesList[i % specialtiesList.length];
            const firstName = indianFirstNames[i % indianFirstNames.length];
            const lastName = indianLastNames[(i + 3) % indianLastNames.length];
            const gender = (i % 2 === 0) ? "Female" : "Male";
            const fullName = `Dr. ${firstName} ${lastName}`;
            
            // Distribute across 5 areas (Kolkata, Mumbai, Delhi, Bangalore, Bankura)
            let city = "Kolkata";
            let state = "West Bengal";
            let lat = 22.5726 + (Math.random() - 0.5) * 0.05;
            let lng = 88.3639 + (Math.random() - 0.5) * 0.05;
            
            if (i % 5 === 1) {
                city = "Mumbai";
                state = "Maharashtra";
                lat = 19.0760 + (Math.random() - 0.5) * 0.05;
                lng = 72.8777 + (Math.random() - 0.5) * 0.05;
            } else if (i % 5 === 2) {
                city = "Delhi";
                state = "Delhi";
                lat = 28.6139 + (Math.random() - 0.5) * 0.05;
                lng = 77.2090 + (Math.random() - 0.5) * 0.05;
            } else if (i % 5 === 3) {
                city = "Bangalore";
                state = "Karnataka";
                lat = 12.9716 + (Math.random() - 0.5) * 0.05;
                lng = 77.5946 + (Math.random() - 0.5) * 0.05;
            } else if (i % 5 === 4) {
                city = "Bankura";
                state = "West Bengal";
                lat = 23.2324 + (Math.random() - 0.5) * 0.05;
                lng = 87.0633 + (Math.random() - 0.5) * 0.05;
            }

            const exp = Math.floor(4 + Math.random() * 25);
            const fee = Math.floor(300 + Math.random() * 900);
            
            // Link to a hospital in that city
            const cityHospitals = hospitalsList.filter(h => h.city === city);
            const assignedHospital = cityHospitals.length > 0 
                ? cityHospitals[i % cityHospitals.length].name 
                : "General Care Hospital";

            doctors.push({
                doctorId: `doc_${100000 + i}`,
                fullName,
                gender,
                qualification: qualificationsMap[specialty] || "MBBS, MD",
                specialization: specialty,
                subspecialization: `${specialty} Specialist`,
                yearsOfExperience: exp,
                hospitalName: assignedHospital,
                clinicName: `${firstName} Clinic & Care`,
                consultationFee: fee,
                languages: i % 3 === 0 ? ["English", "Hindi", "Bengali"] : ["English", "Hindi"],
                rating: parseFloat((4.0 + Math.random() * 1.0).toFixed(1)),
                reviewCount: Math.floor(5 + Math.random() * 80),
                profilePhoto: gender === "Female" ? "👩‍⚕️" : "👨‍⚕️",
                availability: ["Mon", "Tue", "Wed", "Thu", "Fri"],
                nextAvailableSlot: "Tomorrow",
                address: `Hospital Road, Sector ${i % 5 + 1}`,
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
            rating: h.rating || parseFloat((4.0 + Math.random() * 1.0).toFixed(1)),
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

        // Seed ambulances for selected hospitals across all cities including Bankura
        hospitalsList.forEach((h, idx) => {
            if (idx % 3 === 0 || h.city === "Bankura") {
                providers.forEach((prov, pIdx) => {
                    const latOffset = (Math.random() - 0.5) * 0.015;
                    const lngOffset = (Math.random() - 0.5) * 0.015;
                    
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
            }
        });
        await Ambulance.insertMany(ambulancesToInsert);
        console.log(`✅ Seeded ${ambulancesToInsert.length} ambulances.`);

        // 5. Seed Pharmacies
        console.log("💊 Seeding Pharmacies...");
        const pharmacyNames = ["Apollo Pharmacy", "MedPlus Pharmacy", "Frank Ross Pharmacy", "Netmeds Store", "MedCare Pharmacy"];
        const pharmaciesToInsert = [];

        hospitalsList.forEach((h, idx) => {
            // Seed pharmacies selectively to optimize space
            if (idx % 2 === 0 || h.city === "Bankura") {
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
            }
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
