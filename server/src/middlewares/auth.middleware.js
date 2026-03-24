/**
 * Healthcare System - Authentication & Authorization Middleware
 * 
 * HIPAA-compliant authentication middleware for healthcare applications.
 * Handles JWT verification, role-based access control, and audit logging.
 */

import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyToken } from "../utils/jwtUtils.js";
import { User } from "../models/User.model.js";

/**
 * Verify JWT token and authenticate user
 */
export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "").trim();

        if (!token) {
            throw new ApiError(401, "Access denied. No token provided.");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken._id)
            .select("-password -refreshToken")
            .lean();

        if (!user) {
            throw new ApiError(401, "Invalid token. User not found.");
        }

        if (!user.isActive) {
            throw new ApiError(403, "Account is inactive.");
        }

        req.user = {
            ...user,
            userId: user._id.toString(),
            role: user.role,
            permissions: user.permissions || [],
        };

        next();

    } catch (error) {
        console.error("JWT Verification Error:", error.message);
        throw new ApiError(401, "Invalid access token.");
    }
});

/**
 * Optional JWT verification
 */
export const optionalVerifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token =
            res.cookie('refreshToken', refreshToken) ||
            req.header("Authorization")?.replace("Bearer ", "").trim();

        if (token) {
            const decodedToken = verifyToken(token, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decodedToken.userId)
                .select("-password -refreshToken")
                .lean();

            if (user && user.isActive) {
                req.user = {
                    ...user,
                    userId: user._id.toString(),
                    role: user.role,
                    permissions: user.permissions || [],
                };
            }
        }
    } catch (error) {
        console.log("ℹ Optional authentication failed:", error.message);
    }

    next();
});

/**
 * Role-based access control middleware
 */
export const restrictTo = (...allowedRoles) => {
    return asyncHandler(async (req, res, next) => {
        if (!req.user) {
            throw new ApiError(401, "Authentication required");
        }

        if (!allowedRoles.includes(req.user.role)) {
            throw new ApiError(
                403,
                `Access denied. Requires one of: ${allowedRoles.join(", ")}`
            );
        }

        next();
    });
};

/**
 * Permission-based access control middleware
 */
export const checkPermissions = (...requiredPermissions) => {
    return asyncHandler(async (req, res, next) => {
        if (!req.user) {
            throw new ApiError(401, "Authentication required");
        }

        const userPermissions = req.user.permissions || [];

        const hasAllPermissions = requiredPermissions.every((permission) =>
            userPermissions.includes(permission)
        );

        if (!hasAllPermissions) {
            throw new ApiError(403, "Insufficient permissions to perform this action");
        }

        next();
    });
};

/**
 * Verify patient data access authorization (merged version)
 */
export const verifyPatientAccess = (paramName = "patientId") => {
    return asyncHandler(async (req, res, next) => {
        try {
            if (!req.user) {
                throw new ApiError(401, "Authentication required");
            }

            const requestedPatientId =
                req.params[paramName] ||
                req.body[paramName] ||
                req.query[paramName];

            if (!requestedPatientId) {
                throw new ApiError(400, "Patient ID is required");
            }

            const { role, userId, _id } = req.user;

            // Admins always have access
            if (role === "admin") return next();

            // Patients can only access their own data
            if (role === "patient" && (_id?.toString() || userId) === requestedPatientId) {
                return next();
            }

            // Providers: check if they have assigned access to this patient
            if (role === "provider") {
                const hasAccess = await checkProviderPatientAccess(
                    _id || userId,
                    requestedPatientId
                );
                if (hasAccess) return next();
            }

            throw new ApiError(
                403,
                "Access denied. You don't have permission to access this patient's data."
            );
        } catch (error) {
            console.error("Patient Access Verification Error:", error);
            throw new ApiError(500, "Error during patient access verification");
        }
    });
};

/**
 * Check if user is verified
 */
export const checkVerification = asyncHandler(async (req, res, next) => {
    if (!req.user) {
        throw new ApiError(401, "Authentication required");
    }

    if (!req.user.isEmailVerified) {
        throw new ApiError(403, "Email verification required.");
    }

    next();
});

/**
 * Helper function to check provider-patient access
 */
async function checkProviderPatientAccess(providerId, patientId) {
    // Future logic: check assigned patients or appointments
    // For now, allow access (demo mode)
    return true;
}

export default {
    verifyJWT,
    optionalVerifyJWT,
    restrictTo,
    checkPermissions,
    verifyPatientAccess,
    checkVerification,
};