import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Medicine } from "../models/medicine.model.js";
import { Pharmacy } from "../models/Pharmacy.model.js";

/**
 * GET ALL MEDICINES
 * GET /api/v1/medicine
 */
export const getMedicines = asyncHandler(async (req, res) => {
    const { page = 1, limit = 6, name, category } = req.query;
    console.log("👉 [DEBUG] getMedicines controller hit!", { page, limit, name, category });

    const query = {};

    if (name) {
        query.name = { $regex: name, $options: "i" };
    }

    if (category && category !== "all") {
        query.category = category;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const parsedLimit = parseInt(limit);

    const medicines = await Medicine.find(query)
        .skip(skip)
        .limit(parsedLimit)
        .lean();

    const total = await Medicine.countDocuments(query);

    return res.status(200).json(
        new ApiResponse(200, {
            medicines,
            current_page: parseInt(page),
            last_page: Math.ceil(total / parsedLimit),
            total
        }, "Medicines fetched successfully")
    );
});

/**
 * GET NEARBY PHARMACIES
 * GET /api/v1/medicine/pharmacies
 */
export const getPharmacies = asyncHandler(async (req, res) => {
    const { lat, lng } = req.query;
    console.log("👉 [DEBUG] getPharmacies controller hit!", { lat, lng });

    // Fetch all pharmacies to query and return
    const pharmacies = await Pharmacy.find().populate("availableMedicines").lean();

    // In a real production app we'd use MongoDB geospatial $near query,
    // but in this setup we populate all registered pharmacies with offsets.
    return res.status(200).json(
        new ApiResponse(200, {
            pharmacies
        }, "Pharmacies fetched successfully")
    );
});
