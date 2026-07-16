import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import AmbulanceRequest from "../models/ambulanceRequest.model.js";

// Helper to generate mock hospitals relative to client coordinates
const getMockHospitals = (userLat, userLng) => [
  {
    _id: "hosp_001",
    name: "City Hope Emergency Hospital",
    phone: "+91 98765 43210",
    beds: 15,
    address: "Near Sector 4 Main Road, Mumbai",
    available: true,
    coordinates: {
      lat: userLat + 0.008,
      lng: userLng + 0.005
    }
  },
  {
    _id: "hosp_002",
    name: "Metro Care Medical Center",
    phone: "+91 98765 43211",
    beds: 8,
    address: "Opposite Grand Mall Bypass, Mumbai",
    available: true,
    coordinates: {
      lat: userLat - 0.006,
      lng: userLng + 0.012
    }
  },
  {
    _id: "hosp_003",
    name: "St. Jude Trauma Hospital",
    phone: "+91 98765 43212",
    beds: 0,
    address: "St. Jude Avenue Crossroads, Mumbai",
    available: false,
    coordinates: {
      lat: userLat + 0.015,
      lng: userLng - 0.01
    }
  },
  {
    _id: "hosp_004",
    name: "Lifeline Critical Care Clinic",
    phone: "+91 98765 43213",
    beds: 22,
    address: "Green Valley High Street, Mumbai",
    available: true,
    coordinates: {
      lat: userLat - 0.011,
      lng: userLng - 0.007
    }
  }
];

import axios from "axios";

/* ============================================================
   🏥 GET NEARBY HOSPITALS
============================================================ */
export const getNearbyHospitals = asyncHandler(async (req, res) => {
  const lat = parseFloat(req.query.lat) || 19.0760;
  const lng = parseFloat(req.query.lng) || 72.8777;

  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?format=json&q=hospital&lat=${lat}&lon=${lng}&limit=8`,
      {
        headers: {
          "User-Agent": "HealthcareConsultationApp/1.0"
        }
      }
    );

    let hospitals = [];
    if (response.data && response.data.length > 0) {
      hospitals = response.data.map((item, idx) => {
        const itemLat = parseFloat(item.lat);
        const itemLng = parseFloat(item.lon);
        return {
          _id: `hosp_${item.place_id || idx}`,
          name: item.name || "General Hospital",
          phone: `+91 98765 ${Math.floor(10000 + Math.random() * 90000)}`,
          beds: idx % 3 === 0 ? 0 : Math.floor(5 + Math.random() * 25),
          address: item.display_name,
          available: idx % 3 !== 0,
          coordinates: {
            lat: itemLat,
            lng: itemLng
          }
        };
      });
    }

    if (hospitals.length === 0) {
      hospitals = getMockHospitals(lat, lng);
    }

    return res.status(200).json(
      new ApiResponse(200, hospitals, "Nearby hospitals retrieved successfully")
    );
  } catch (error) {
    console.error("Error calling Nominatim in getNearbyHospitals:", error.message);
    const hospitals = getMockHospitals(lat, lng);
    return res.status(200).json(
      new ApiResponse(200, hospitals, "Nearby hospitals retrieved successfully (fallback)")
    );
  }
});

/* ============================================================
   🚨 REQUEST AMBULANCE
============================================================ */
import { Hospital } from "../models/Hospital.model.js";
import { Ambulance } from "../models/Ambulance.model.js";

export const requestAmbulance = asyncHandler(async (req, res) => {
  const { hospitalId, pickupLocation, eta, providerName } = req.body;
  const patientId = req.user._id;

  if (!hospitalId || !pickupLocation) {
    throw new ApiError(400, "Hospital ID and pickup location are required");
  }

  const pickupLat = parseFloat(pickupLocation.lat) || 19.0760;
  const pickupLng = parseFloat(pickupLocation.lng) || 72.8777;
  
  // Find real hospital from MongoDB
  const selectedHospital = await Hospital.findById(hospitalId) || await Hospital.findOne();
  if (!selectedHospital) {
    throw new ApiError(404, "No hospital found to dispatch ambulance");
  }

  // Find real ambulance from MongoDB matching the provider name
  const query = {};
  if (providerName) {
    query.providerName = providerName;
  }
  let ambulance = await Ambulance.findOne(query);
  if (!ambulance) {
    ambulance = await Ambulance.findOne() || {
      ambulanceNumber: "MH-12-AM-9999",
      driverName: "Vikram Singh",
      driverPhone: "+91 98765 43210",
      latitude: selectedHospital.latitude,
      longitude: selectedHospital.longitude,
      estimatedArrival: 15
    };
  }

  const ambulanceRequest = new AmbulanceRequest({
    patientId,
    hospitalId,
    hospitalName: selectedHospital.hospitalName,
    pickupLocation: {
      lat: pickupLat,
      lng: pickupLng,
      address: pickupLocation.address || "Current Location"
    },
    status: "dispatched",
    eta: eta || ambulance.estimatedArrival || 15,
    driverName: ambulance.driverName,
    driverPhone: ambulance.driverPhone,
    ambulanceNumber: ambulance.ambulanceNumber,
    currentLocation: {
      lat: ambulance.latitude,
      lng: ambulance.longitude
    }
  });

  await ambulanceRequest.save();

  // Match response structure of getAmbulanceStatus
  const responseData = ambulanceRequest.toObject();
  responseData.hospitalId = {
    _id: ambulanceRequest.hospitalId,
    name: ambulanceRequest.hospitalName
  };

  return res.status(201).json(
    new ApiResponse(201, responseData, "Ambulance requested successfully")
  );
});

/* ============================================================
   📍 GET AMBULANCE STATUS (WITH SIMULATED MOVEMENT)
============================================================ */
export const getAmbulanceStatus = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const request = await AmbulanceRequest.findById(requestId);

  if (!request) {
    throw new ApiError(404, "Ambulance request not found");
  }

  if (request.status === "dispatched" || request.status === "pending") {
    const elapsedSeconds = (Date.now() - new Date(request.createdAt).getTime()) / 1000;
    const totalTripSeconds = 45; // 45 seconds total duration for tracking demo

    let progress = elapsedSeconds / totalTripSeconds;
    if (progress >= 1) {
      progress = 1;
      request.status = "arrived";
      request.eta = 0;
      request.currentLocation = request.pickupLocation;
    } else {
      const hospitals = getMockHospitals(request.pickupLocation.lat, request.pickupLocation.lng);
      const selectedHospital = hospitals.find(h => h._id === request.hospitalId) || hospitals[0];
      const startLat = selectedHospital.coordinates.lat;
      const startLng = selectedHospital.coordinates.lng;
      const destLat = request.pickupLocation.lat;
      const destLng = request.pickupLocation.lng;

      request.currentLocation = {
        lat: startLat + (destLat - startLat) * progress,
        lng: startLng + (destLng - startLng) * progress
      };
      
      const initialEta = 15;
      request.eta = Math.max(1, Math.ceil(initialEta * (1 - progress)));
    }

    await request.save();
  }

  const responseData = request.toObject();
  responseData.hospitalId = {
    _id: request.hospitalId,
    name: request.hospitalName
  };

  return res.status(200).json(
    new ApiResponse(200, responseData, "Ambulance status fetched successfully")
  );
});

/* ============================================================
   ❌ CANCEL AMBULANCE REQUEST
============================================================ */
export const cancelAmbulanceRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const request = await AmbulanceRequest.findById(requestId);

  if (!request) {
    throw new ApiError(404, "Ambulance request not found");
  }

  request.status = "cancelled";
  await request.save();

  return res.status(200).json(
    new ApiResponse(200, request, "Emergency request has been cancelled.")
  );
});
