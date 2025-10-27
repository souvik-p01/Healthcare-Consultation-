/**
 * Healthcare System - Patient Controller
 * 
 * Handles patient-specific operations in the healthcare consultation system.
 * 
 * Features:
 * - Patient profile management
 * - Medical records access
 * - Appointment management
 * - Prescription viewing
 * - Health metrics tracking
 * - Emergency contact management
 */

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Patient } from "../models/patient.model.js";
import { Appointment } from "../models/appointment.model.js";
import { Prescription } from "../models/prescription.model.js";
import { MedicalRecord } from "../models/medicalRecord.model.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

/**
 * GET PATIENT PROFILE
 * Get complete patient profile with medical information
 * 
 * GET /api/v1/patients/profile
 * Requires: verifyJWT middleware, patient role
 */
const getPatientProfile = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    console.log("📋 Fetching patient profile for user:", userId);

    // Get user with patient population
    const user = await User.findById(userId)
        .select("-password -refreshToken")
        .populate({
            path: 'patientId',
            populate: [
                { path: 'emergencyContacts' },
                { path: 'allergies' },
                { path: 'currentMedications' }
            ]
        })
        .lean();

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (!user.patientId) {
        throw new ApiError(404, "Patient profile not found");
    }

    console.log('✅ Patient profile fetched successfully:', user.patientId.medicalRecordNumber);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    user: user,
                    patient: user.patientId
                },
                "Patient profile fetched successfully"
            )
        );
});

/**
 * UPDATE PATIENT PROFILE
 * Update patient-specific information and medical details
 * 
 * PATCH /api/v1/patients/profile
 * Requires: verifyJWT middleware, patient role
 */
const updatePatientProfile = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const {
        // Personal information
        bloodGroup,
        height,
        weight,
        // Medical information
        knownAllergies,
        currentMedications,
        chronicConditions,
        surgicalHistory,
        familyMedicalHistory,
        // Lifestyle information
        smokingStatus,
        alcoholConsumption,
        activityLevel,
        dietaryPreferences,
        // Emergency contact information
        emergencyContactName,
        emergencyContactPhone,
        emergencyContactRelationship
    } = req.body;

    console.log("✏️ Updating patient profile for user:", userId);

    // Get user to access patientId
    const user = await User.findById(userId);
    if (!user || !user.patientId) {
        throw new ApiError(404, "Patient profile not found");
    }

    // Build update object for patient
    const patientUpdateData = {};
    
    // Personal information
    if (bloodGroup) patientUpdateData.bloodGroup = bloodGroup;
    if (height) patientUpdateData.height = height;
    if (weight) patientUpdateData.weight = weight;
    
    // Medical information
    if (knownAllergies) patientUpdateData.knownAllergies = knownAllergies;
    if (currentMedications) patientUpdateData.currentMedications = currentMedications;
    if (chronicConditions) patientUpdateData.chronicConditions = chronicConditions;
    if (surgicalHistory) patientUpdateData.surgicalHistory = surgicalHistory;
    if (familyMedicalHistory) patientUpdateData.familyMedicalHistory = familyMedicalHistory;
    
    // Lifestyle information
    if (smokingStatus) patientUpdateData.smokingStatus = smokingStatus;
    if (alcoholConsumption) patientUpdateData.alcoholConsumption = alcoholConsumption;
    if (activityLevel) patientUpdateData.activityLevel = activityLevel;
    if (dietaryPreferences) patientUpdateData.dietaryPreferences = dietaryPreferences;

    // Emergency contact information
    if (emergencyContactName || emergencyContactPhone || emergencyContactRelationship) {
        patientUpdateData.emergencyContact = {
            name: emergencyContactName,
            phone: emergencyContactPhone,
            relationship: emergencyContactRelationship
        };
    }

    // Update BMI if height and weight are provided
    if (height && weight) {
        const heightInMeters = height / 100; // Convert cm to meters
        patientUpdateData.bmi = (weight / (heightInMeters * heightInMeters)).toFixed(2);
    }

    if (Object.keys(patientUpdateData).length === 0) {
        throw new ApiError(400, "At least one field is required to update");
    }

    // Update patient profile
    const updatedPatient = await Patient.findByIdAndUpdate(
        user.patientId,
        { $set: patientUpdateData },
        { new: true, runValidators: true }
    ).populate('emergencyContacts allergies currentMedications');

    console.log('✅ Patient profile updated successfully:', updatedPatient.medicalRecordNumber);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    patient: updatedPatient
                },
                "Patient profile updated successfully"
            )
        );
});

/**
 * GET PATIENT APPOINTMENTS
 * Get all appointments for the patient with filtering and pagination
 * 
 * GET /api/v1/patients/appointments
 * Requires: verifyJWT middleware, patient role
 */
const getPatientAppointments = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { 
        status, 
        type, 
        dateFrom, 
        dateTo, 
        page = 1, 
        limit = 10 
    } = req.query;

    console.log("📅 Fetching appointments for patient:", userId);

    // Get user to access patientId
    const user = await User.findById(userId);
    if (!user || !user.patientId) {
        throw new ApiError(404, "Patient profile not found");
    }

    // Build query for appointments
    const query = { patientId: user.patientId };
    
    if (status) query.status = status;
    if (type) query.type = type;
    
    // Date range filter
    if (dateFrom || dateTo) {
        query.appointmentDate = {};
        if (dateFrom) query.appointmentDate.$gte = new Date(dateFrom);
        if (dateTo) query.appointmentDate.$lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;

    // Get appointments with doctor population
    const appointments = await Appointment.find(query)
        .populate({
            path: 'doctorId',
            select: 'firstName lastName specialization qualification avatar'
        })
        .populate({
            path: 'medicalRecordId',
            select: 'recordType diagnosis treatment'
        })
        .sort({ appointmentDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

    const total = await Appointment.countDocuments(query);

    console.log(`✅ Found ${appointments.length} appointments for patient`);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    appointments,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(total / limit),
                        totalAppointments: total,
                        hasNextPage: page * limit < total
                    }
                },
                "Patient appointments fetched successfully"
            )
        );
});

/**
 * GET PATIENT PRESCRIPTIONS
 * Get all prescriptions for the patient
 * 
 * GET /api/v1/patients/prescriptions
 * Requires: verifyJWT middleware, patient role
 */
const getPatientPrescriptions = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { 
        status, 
        dateFrom, 
        dateTo, 
        page = 1, 
        limit = 10 
    } = req.query;

    console.log("💊 Fetching prescriptions for patient:", userId);

    // Get user to access patientId
    const user = await User.findById(userId);
    if (!user || !user.patientId) {
        throw new ApiError(404, "Patient profile not found");
    }

    // Build query for prescriptions
    const query = { patientId: user.patientId };
    
    if (status) query.status = status;
    
    // Date range filter
    if (dateFrom || dateTo) {
        query.prescribedDate = {};
        if (dateFrom) query.prescribedDate.$gte = new Date(dateFrom);
        if (dateTo) query.prescribedDate.$lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;

    const prescriptions = await Prescription.find(query)
        .populate({
            path: 'doctorId',
            select: 'firstName lastName specialization qualification'
        })
        .populate({
            path: 'appointmentId',
            select: 'appointmentDate type'
        })
        .sort({ prescribedDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

    const total = await Prescription.countDocuments(query);

    console.log(`✅ Found ${prescriptions.length} prescriptions for patient`);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    prescriptions,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(total / limit),
                        totalPrescriptions: total,
                        hasNextPage: page * limit < total
                    }
                },
                "Patient prescriptions fetched successfully"
            )
        );
});

/**
 * GET PATIENT MEDICAL RECORDS
 * Get medical records and health history for the patient
 * 
 * GET /api/v1/patients/medical-records
 * Requires: verifyJWT middleware, patient role
 */
const getPatientMedicalRecords = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { 
        recordType, 
        dateFrom, 
        dateTo, 
        page = 1, 
        limit = 10 
    } = req.query;

    console.log("🏥 Fetching medical records for patient:", userId);

    // Get user to access patientId
    const user = await User.findById(userId);
    if (!user || !user.patientId) {
        throw new ApiError(404, "Patient profile not found");
    }

    // Build query for medical records
    const query = { patientId: user.patientId };
    
    if (recordType) query.recordType = recordType;
    
    // Date range filter
    if (dateFrom || dateTo) {
        query.recordDate = {};
        if (dateFrom) query.recordDate.$gte = new Date(dateFrom);
        if (dateTo) query.recordDate.$lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;

    const medicalRecords = await MedicalRecord.find(query)
        .populate({
            path: 'doctorId',
            select: 'firstName lastName specialization'
        })
        .populate({
            path: 'appointmentId',
            select: 'appointmentDate type'
        })
        .sort({ recordDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

    const total = await MedicalRecord.countDocuments(query);

    console.log(`✅ Found ${medicalRecords.length} medical records for patient`);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    medicalRecords,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(total / limit),
                        totalRecords: total,
                        hasNextPage: page * limit < total
                    }
                },
                "Medical records fetched successfully"
            )
        );
});

/**
 * ADD HEALTH METRICS
 * Add or update patient health metrics (blood pressure, sugar levels, etc.)
 * 
 * POST /api/v1/patients/health-metrics
 * Requires: verifyJWT middleware, patient role
 */
const addHealthMetrics = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const {
        bloodPressureSystolic,
        bloodPressureDiastolic,
        heartRate,
        bloodSugar,
        cholesterol,
        temperature,
        oxygenSaturation,
        weight,
        notes,
        recordedDate
    } = req.body;

    console.log("📊 Adding health metrics for patient:", userId);

    // Get user to access patientId
    const user = await User.findById(userId);
    if (!user || !user.patientId) {
        throw new ApiError(404, "Patient profile not found");
    }

    // Validate required fields
    if (!recordedDate) {
        throw new ApiError(400, "Recorded date is required");
    }

    // Create health metrics object
    const healthMetric = {
        bloodPressure: bloodPressureSystolic && bloodPressureDiastolic ? {
            systolic: bloodPressureSystolic,
            diastolic: bloodPressureDiastolic
        } : undefined,
        heartRate,
        bloodSugar,
        cholesterol,
        temperature,
        oxygenSaturation,
        weight,
        notes,
        recordedDate: new Date(recordedDate)
    };

    // Remove undefined fields
    Object.keys(healthMetric).forEach(key => 
        healthMetric[key] === undefined && delete healthMetric[key]
    );

    if (Object.keys(healthMetric).length === 0) {
        throw new ApiError(400, "At least one health metric is required");
    }

    // Add health metrics to patient profile
    const updatedPatient = await Patient.findByIdAndUpdate(
        user.patientId,
        {
            $push: { healthMetrics: healthMetric },
            $set: { 
                lastHealthCheck: new Date(),
                ...(weight && { weight: weight }) // Update current weight if provided
            }
        },
        { new: true, runValidators: true }
    ).select('healthMetrics lastHealthCheck weight');

    console.log('✅ Health metrics added successfully');

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                {
                    healthMetrics: updatedPatient.healthMetrics
                },
                "Health metrics added successfully"
            )
        );
});

/**
 * GET HEALTH METRICS
 * Get patient health metrics with date range filtering
 * 
 * GET /api/v1/patients/health-metrics
 * Requires: verifyJWT middleware, patient role
 */
const getHealthMetrics = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { dateFrom, dateTo, limit = 50 } = req.query;

    console.log("📈 Fetching health metrics for patient:", userId);

    // Get user to access patientId
    const user = await User.findById(userId);
    if (!user || !user.patientId) {
        throw new ApiError(404, "Patient profile not found");
    }

    const patient = await Patient.findById(user.patientId)
        .select('healthMetrics')
        .lean();

    if (!patient || !patient.healthMetrics) {
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { healthMetrics: [] },
                    "No health metrics found"
                )
            );
    }

    // Filter health metrics by date range if provided
    let healthMetrics = patient.healthMetrics;

    if (dateFrom || dateTo) {
        healthMetrics = healthMetrics.filter(metric => {
            const metricDate = new Date(metric.recordedDate);
            const fromDate = dateFrom ? new Date(dateFrom) : null;
            const toDate = dateTo ? new Date(dateTo) : null;

            if (fromDate && metricDate < fromDate) return false;
            if (toDate && metricDate > toDate) return false;
            return true;
        });
    }

    // Sort by date (newest first) and limit results
    healthMetrics.sort((a, b) => new Date(b.recordedDate) - new Date(a.recordedDate));
    healthMetrics = healthMetrics.slice(0, parseInt(limit));

    console.log(`✅ Found ${healthMetrics.length} health metrics`);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { healthMetrics },
                "Health metrics fetched successfully"
            )
        );
});

/**
 * ADD EMERGENCY CONTACT
 * Add emergency contact for the patient
 * 
 * POST /api/v1/patients/emergency-contacts
 * Requires: verifyJWT middleware, patient role
 */
const addEmergencyContact = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const {
        name,
        phone,
        relationship,
        address,
        isPrimary = false
    } = req.body;

    console.log("📞 Adding emergency contact for patient:", userId);

    // Validation
    if (!name || !phone || !relationship) {
        throw new ApiError(400, "Name, phone, and relationship are required");
    }

    // Get user to access patientId
    const user = await User.findById(userId);
    if (!user || !user.patientId) {
        throw new ApiError(404, "Patient profile not found");
    }

    const emergencyContact = {
        name,
        phone,
        relationship,
        address,
        isPrimary
    };

    // If setting as primary, unset other primary contacts
    if (isPrimary) {
        await Patient.findByIdAndUpdate(
            user.patientId,
            { 
                $set: { 
                    "emergencyContacts.$[].isPrimary": false 
                } 
            }
        );
    }

    // Add emergency contact
    const updatedPatient = await Patient.findByIdAndUpdate(
        user.patientId,
        {
            $push: { emergencyContacts: emergencyContact }
        },
        { new: true, runValidators: true }
    ).select('emergencyContacts');

    console.log('✅ Emergency contact added successfully');

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                {
                    emergencyContacts: updatedPatient.emergencyContacts
                },
                "Emergency contact added successfully"
            )
        );
});

/**
 * UPDATE EMERGENCY CONTACT
 * Update existing emergency contact
 * 
 * PATCH /api/v1/patients/emergency-contacts/:contactId
 * Requires: verifyJWT middleware, patient role
 */
const updateEmergencyContact = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { contactId } = req.params;
    const updateData = req.body;

    console.log("✏️ Updating emergency contact:", contactId);

    if (!contactId) {
        throw new ApiError(400, "Contact ID is required");
    }

    // Get user to access patientId
    const user = await User.findById(userId);
    if (!user || !user.patientId) {
        throw new ApiError(404, "Patient profile not found");
    }

    // If setting as primary, unset other primary contacts
    if (updateData.isPrimary === true) {
        await Patient.findByIdAndUpdate(
            user.patientId,
            { 
                $set: { 
                    "emergencyContacts.$[].isPrimary": false 
                } 
            }
        );
    }

    // Build update fields for the specific contact
    const updateFields = {};
    Object.keys(updateData).forEach(key => {
        updateFields[`emergencyContacts.$.${key}`] = updateData[key];
    });

    // Update specific emergency contact
    const updatedPatient = await Patient.findOneAndUpdate(
        {
            _id: user.patientId,
            "emergencyContacts._id": contactId
        },
        {
            $set: updateFields
        },
        { new: true, runValidators: true }
    ).select('emergencyContacts');

    if (!updatedPatient) {
        throw new ApiError(404, "Emergency contact not found");
    }

    console.log('✅ Emergency contact updated successfully');

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    emergencyContacts: updatedPatient.emergencyContacts
                },
                "Emergency contact updated successfully"
            )
        );
});

/**
 * GET PATIENT DASHBOARD
 * Get comprehensive dashboard data for patient
 * 
 * GET /api/v1/patients/dashboard
 * Requires: verifyJWT middleware, patient role
 */
const getPatientDashboard = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    console.log("📊 Fetching dashboard data for patient:", userId);

    // Get user to access patientId
    const user = await User.findById(userId);
    if (!user || !user.patientId) {
        throw new ApiError(404, "Patient profile not found");
    }

    // Get recent appointments (last 5)
    const recentAppointments = await Appointment.find({ 
        patientId: user.patientId 
    })
    .populate({
        path: 'doctorId',
        select: 'firstName lastName specialization avatar'
    })
    .sort({ appointmentDate: -1 })
    .limit(5)
    .lean();

    // Get upcoming appointments
    const upcomingAppointments = await Appointment.find({ 
        patientId: user.patientId,
        status: { $in: ['scheduled', 'confirmed'] },
        appointmentDate: { $gte: new Date() }
    })
    .populate({
        path: 'doctorId',
        select: 'firstName lastName specialization avatar'
    })
    .sort({ appointmentDate: 1 })
    .limit(5)
    .lean();

    // Get recent prescriptions (last 5)
    const recentPrescriptions = await Prescription.find({ 
        patientId: user.patientId 
    })
    .populate({
        path: 'doctorId',
        select: 'firstName lastName specialization'
    })
    .sort({ prescribedDate: -1 })
    .limit(5)
    .lean();

    // Get patient profile with health metrics
    const patient = await Patient.findById(user.patientId)
        .select('healthMetrics bloodGroup height weight bmi lastHealthCheck emergencyContacts')
        .lean();

    // Calculate statistics
    const totalAppointments = await Appointment.countDocuments({ 
        patientId: user.patientId 
    });
    
    const completedAppointments = await Appointment.countDocuments({ 
        patientId: user.patientId,
        status: 'completed'
    });

    const activePrescriptions = await Prescription.countDocuments({ 
        patientId: user.patientId,
        status: 'active'
    });

    const dashboardData = {
        patientSummary: {
            bloodGroup: patient.bloodGroup,
            height: patient.height,
            weight: patient.weight,
            bmi: patient.bmi,
            lastHealthCheck: patient.lastHealthCheck
        },
        appointments: {
            recent: recentAppointments,
            upcoming: upcomingAppointments,
            statistics: {
                total: totalAppointments,
                completed: completedAppointments,
                upcoming: upcomingAppointments.length
            }
        },
        prescriptions: {
            recent: recentPrescriptions,
            active: activePrescriptions
        },
        healthMetrics: patient.healthMetrics?.slice(0, 10) || [] // Last 10 metrics
    };

    console.log('✅ Dashboard data fetched successfully');

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                dashboardData,
                "Patient dashboard data fetched successfully"
            )
        );
});

// Export all patient controller functions
export {
    getPatientProfile,
    updatePatientProfile,
    getPatientAppointments,
    getPatientPrescriptions,
    getPatientMedicalRecords,
    addHealthMetrics,
    getHealthMetrics,
    addEmergencyContact,
    updateEmergencyContact,
    getPatientDashboard
};

/**
 * Additional patient controllers that can be added:
 * - cancelAppointment
 * - rescheduleAppointment
 * - requestPrescriptionRefill
 * - uploadMedicalDocuments
 * - setHealthReminders
 * - getMedicalAlerts
 * - shareMedicalRecords
 * - updateNotificationPreferences
 */