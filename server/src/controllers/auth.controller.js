// server/src/controllers/auth.controller.js
import { User } from "../models/User.model.js";
import { Patient } from "../models/Patient.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Generate Access and Refresh Tokens
 */
const generateTokens = (user) => {
    const accessToken = jwt.sign(
        {
            _id: user._id,
            email: user.email,
            role: user.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m" }
    );

    const refreshToken = jwt.sign(
        {
            _id: user._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" }
    );

    return { accessToken, refreshToken };
};

/**
 * Set token cookies
 */
const setTokenCookies = (res, refreshToken) => {
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
};

/**
 * REGISTER USER
 */
export const register = async (req, res) => {
    try {
        const { firstName, lastName, name, email, password, phoneNumber, phone, role = 'patient' } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists with this email"
            });
        }

        // Handle name fields - support both formats
        let userFirstName = firstName;
        let userLastName = lastName;
        
        if (!firstName && !lastName && name) {
            const nameParts = name.trim().split(' ');
            userFirstName = nameParts[0];
            userLastName = nameParts.slice(1).join(' ') || 'User';
        }

        // Create new user
        const user = await User.create({
            firstName: userFirstName,
            lastName: userLastName,
            email,
            password,
            phoneNumber: phoneNumber || phone,
            role,
            authProvider: 'local'
        });

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);

        // Set refresh token in cookie
        setTokenCookies(res, refreshToken);

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                user: {
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    fullName: user.fullName,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                    role: user.role
                },
                accessToken,
                refreshToken
            }
        });

    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

/**
 * LOGIN USER
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Check password
        const isPasswordValid = await user.isPasswordCorrect(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);

        // Set refresh token in cookie
        setTokenCookies(res, refreshToken);

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                user: {
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    fullName: user.fullName,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                    role: user.role
                },
                accessToken,
                refreshToken
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

/**
 * GOOGLE AUTHENTICATION
 */
export const googleAuth = async (req, res) => {
    console.log("👉 [googleAuth] Controller hit — method:", req.method, "| body keys:", Object.keys(req.body || {}));
    try {
        const { credential } = req.body;
        console.log("📥 [googleAuth] credential received:", credential ? `${credential.substring(0, 20)}...` : "MISSING");

        if (!credential) {
            return res.status(400).json({
                success: false,
                message: "Google credential is required"
            });
        }

        // ── Step 1: Verify Google token ──────────────────────────
        console.log("🔍 [googleAuth] Verifying Google ID token with audience:", process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + "...");
        let ticket;
        try {
            ticket = await googleClient.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID
            });
        } catch (verifyError) {
            console.error("❌ [googleAuth] Google token verification FAILED:", verifyError.message);
            return res.status(401).json({
                success: false,
                message: "Google token verification failed — invalid or expired credential",
                error: verifyError.message
            });
        }

        const payload = ticket.getPayload();
        const { email, name, picture, sub: googleId } = payload;
        console.log("✅ [googleAuth] Token verified — email:", email, "| googleId:", googleId?.substring(0, 10) + "...");

        // ── Step 2: Parse name ───────────────────────────────────
        const nameParts = (name || "").split(" ");
        const firstName = nameParts[0] || "User";
        const lastName = nameParts.slice(1).join(" ") || "Unknown";

        // ── Step 3: Find or create user ──────────────────────────
        console.log("🔎 [googleAuth] Looking up user by email/googleId:", email);
        let user = await User.findOne({
            $or: [{ email }, { googleId }]
        });

        if (!user) {
            console.log("🆕 [googleAuth] Creating new Google user:", email);
            user = await User.create({
                firstName,
                lastName,
                email,
                googleId,
                avatar: picture,
                role: "patient",
                isEmailVerified: true,
                authProvider: "google"
            });
            console.log("✅ [googleAuth] New user created:", user._id);

            // Create patient profile for new Google user
            const patient = await Patient.create({ user: user._id });
            user.patientId = patient._id;
            await user.save({ validateBeforeSave: false });
            console.log("✅ [googleAuth] Patient profile created:", patient._id);

        } else {
            console.log("🔄 [googleAuth] Existing user found:", user._id, "| provider:", user.authProvider);
            let needsSave = false;

            if (!user.googleId) {
                user.googleId = googleId;
                user.authProvider = "google";
                user.avatar = picture || user.avatar;
                user.isEmailVerified = true;
                needsSave = true;
            }

            if (user.role === "patient" && !user.patientId) {
                const patient = await Patient.create({ user: user._id });
                user.patientId = patient._id;
                needsSave = true;
                console.log("✅ [googleAuth] Fixed missing Patient profile for:", email);
            }

            if (needsSave) {
                await user.save({ validateBeforeSave: false });
            }
        }

        // ── Step 4: Generate JWT tokens ──────────────────────────
        console.log("🔑 [googleAuth] Generating JWT access token for:", user._id);
        const accessToken = jwt.sign(
            { _id: user._id, email: user.email, role: user.role },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d" }
        );

        console.log("🔄 [googleAuth] Generating refresh token for:", user._id);
        const refreshToken = jwt.sign(
            { _id: user._id },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" }
        );

        // ── Step 5: Set cookie ────────────────────────────────────
        console.log("🍪 [googleAuth] Setting refreshToken cookie — httpOnly, sameSite:lax, secure:", process.env.NODE_ENV === "production");
        setTokenCookies(res, refreshToken);

        console.log("🎉 [googleAuth] Authentication successful for:", email);
        return res.status(200).json({
            success: true,
            message: "Google authentication successful",
            data: {
                user: {
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar,
                    authProvider: user.authProvider
                },
                accessToken,
                refreshToken
            }
        });

    } catch (error) {
        console.error("💥 [googleAuth] Unexpected error:", error.name, "|", error.message);
        // Return 500 for unexpected server errors, not 401
        // 401 is only for authentication failures (handled above per-step)
        return res.status(500).json({
            success: false,
            message: "Google authentication failed due to a server error",
            error: process.env.NODE_ENV === "development" ? error.message : undefined
        });
    }
};

/**
 * LOGOUT USER
 */
export const logout = async (req, res) => {
    try {
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });

        return res.status(200).json({
            success: true,
            message: "Logout successful"
        });

    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

/**
 * REFRESH TOKEN
 */
export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken || req.headers?.["x-refresh-token"];

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh token required"
            });
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        
        // Find user
        const user = await User.findById(decoded._id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token"
            });
        }

        // Generate new access token
        const accessToken = jwt.sign(
            {
                _id: user._id,
                email: user.email,
                role: user.role
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m" }
        );

        // Generate new refresh token (optional - for rotation)
        const newRefreshToken = jwt.sign(
            { _id: user._id },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" }
        );

        // Update cookie with new refresh token
        setTokenCookies(res, newRefreshToken);

        return res.status(200).json({
            success: true,
            message: "Token refreshed successfully",
            data: {
                accessToken,
                refreshToken: newRefreshToken // Return new refresh token
            }
        });

    } catch (error) {
        console.error("Refresh token error:", error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token"
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: "Refresh token expired"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};