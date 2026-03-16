/**
 * Healthcare Consultation System - Constants
 */

// Database name - make it shorter if possible (max 38 chars for MongoDB)
export const DB_NAME = "healthcare"; // Changed from "healthcare-consultation" to shorter name

// API version
export const API_VERSION = "v1";

// User roles
export const USER_ROLES = {
    PATIENT: "patient",
    DOCTOR: "doctor",
    ADMIN: "admin"
};

// Appointment statuses
export const APPOINTMENT_STATUS = {
    PENDING: "pending",
    CONFIRMED: "confirmed",
    CANCELLED: "cancelled",
    COMPLETED: "completed",
    NO_SHOW: "no_show"
};

// Payment statuses
export const PAYMENT_STATUS = {
    PENDING: "pending",
    COMPLETED: "completed",
    FAILED: "failed",
    REFUNDED: "refunded"
};

// Consultation types
export const CONSULTATION_TYPES = {
    VIDEO: "video",
    AUDIO: "audio",
    CHAT: "chat",
    IN_PERSON: "in_person"
};