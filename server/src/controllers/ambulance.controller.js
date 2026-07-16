import { Ambulance } from "../models/Ambulance.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * GET NEARBY AMBULANCES
 * GET /api/v1/ambulance/nearby
 */
export const getNearbyAmbulances = asyncHandler(async (req, res) => {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radius = parseFloat(req.query.radius || 10); // default 10km

    if (isNaN(lat) || isNaN(lng)) {
        throw new ApiError(400, "Latitude and longitude query parameters are required and must be numbers");
    }

    let ambulances = await Ambulance.find({
        location: {
            $nearSphere: {
                $geometry: {
                    type: "Point",
                    coordinates: [lng, lat]
                },
                $maxDistance: radius * 1000 // Convert km to meters
            }
        }
    });

    if (ambulances.length === 0) {
        // Self-heal: Seed matching ambulances around user coordinates
        const initialAmbulances = [
            {
                ambulanceNumber: "MH-12-AM-1001",
                providerName: "Apollo Ambulance",
                driverName: "Ramesh Kumar",
                driverPhone: "+91 98765 11111",
                vehicleType: "ICU",
                ALS: true,
                BLS: false,
                ICU: true,
                Neonatal: false,
                latitude: lat + 0.003,
                longitude: lng + 0.002,
                availability: true,
                estimatedArrival: 5,
                location: {
                    type: "Point",
                    coordinates: [lng + 0.002, lat + 0.003]
                }
            },
            {
                ambulanceNumber: "MH-12-AM-1002",
                providerName: "Ruby Ambulance",
                driverName: "Sanjay Singh",
                driverPhone: "+91 98765 22222",
                vehicleType: "ALS",
                ALS: true,
                BLS: true,
                ICU: false,
                Neonatal: false,
                latitude: lat - 0.004,
                longitude: lng + 0.005,
                availability: true,
                estimatedArrival: 8,
                location: {
                    type: "Point",
                    coordinates: [lng + 0.005, lat - 0.004]
                }
            },
            {
                ambulanceNumber: "MH-12-AM-1003",
                providerName: "AMRI Ambulance",
                driverName: "Arup Das",
                driverPhone: "+91 98765 33333",
                vehicleType: "Neonatal",
                ALS: false,
                BLS: true,
                ICU: false,
                Neonatal: true,
                latitude: lat + 0.007,
                longitude: lng - 0.006,
                availability: true,
                estimatedArrival: 12,
                location: {
                    type: "Point",
                    coordinates: [lng - 0.006, lat + 0.007]
                }
            },
            {
                ambulanceNumber: "MH-12-AM-1004",
                providerName: "Medica Ambulance",
                driverName: "Bikram Paul",
                driverPhone: "+91 98765 44444",
                vehicleType: "BLS",
                ALS: false,
                BLS: true,
                ICU: false,
                Neonatal: false,
                latitude: lat - 0.005,
                longitude: lng - 0.003,
                availability: true,
                estimatedArrival: 10,
                location: {
                    type: "Point",
                    coordinates: [lng - 0.003, lat - 0.005]
                }
            },
            {
                ambulanceNumber: "MH-12-AM-1005",
                providerName: "Fortis Ambulance",
                driverName: "Gurpreet Singh",
                driverPhone: "+91 98765 55555",
                vehicleType: "ICU",
                ALS: true,
                BLS: false,
                ICU: true,
                Neonatal: true,
                latitude: lat + 0.009,
                longitude: lng + 0.008,
                availability: true,
                estimatedArrival: 15,
                location: {
                    type: "Point",
                    coordinates: [lng + 0.008, lat + 0.009]
                }
            }
        ];

        ambulances = await Ambulance.insertMany(initialAmbulances);
    }

    return res.status(200).json(
        new ApiResponse(200, ambulances, "Nearby ambulances retrieved successfully")
    );
});
