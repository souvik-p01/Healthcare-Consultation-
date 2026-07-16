import { ApiError } from "../utils/ApiError.js";

/**
 * Validate doctor query parameters
 */
export const validateDoctorQuery = (req, res, next) => {
    const { lat, lng } = req.query;

    if (lat && isNaN(parseFloat(lat))) {
        return next(new ApiError(400, "Latitude must be a valid number"));
    }

    if (lng && isNaN(parseFloat(lng))) {
        return next(new ApiError(400, "Longitude must be a valid number"));
    }

    next();
};

/**
 * Validate doctor creation payload
 */
export const validateDoctorCreation = (req, res, next) => {
    const { fullName, specialization, consultationFee, phone, email, licenseNumber } = req.body;

    if (!fullName || !specialization || !consultationFee || !phone || !email || !licenseNumber) {
        return next(new ApiError(400, "Missing required doctor fields (fullName, specialization, consultationFee, phone, email, licenseNumber)"));
    }

    next();
};
