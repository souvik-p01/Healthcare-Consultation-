/**
 * Healthcare System - Prescription Controller
 * 
 * Handles prescription management for healthcare system.
 * 
 * Features:
 * - Prescription creation and management
 * - Medication tracking and inventory
 * - Prescription refill requests
 * - Drug interaction checking
 * - E-prescription capabilities
 * - Multi-role access control (doctors, patients, pharmacists)
 */

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Prescription } from "../models/prescription.model.js";
import { User } from "../models/user.model.js";
import { Patient } from "../models/patient.model.js";
import { Doctor } from "../models/doctor.model.js";
import { Appointment } from "../models/appointment.model.js";
import { Medication } from "../models/medication.model.js";
import { 
    sendPrescriptionConfirmation,
    sendPrescriptionReady,
    sendRefillReminder
} from "../utils/emailUtils.js";

/**
 * CREATE PRESCRIPTION
 * Create a new prescription for a patient
 * 
 * POST /api/v1/prescriptions
 * Requires: verifyJWT middleware, doctor role
 */
const createPrescription = asyncHandler(async (req, res) => {
    const {
        patientId,
        appointmentId,
        medications,
        diagnosis,
        instructions,
        notes,
        followUpRequired,
        followUpDate,
        isElectronic = true,
        allowRefills = false,
        maxRefills = 0
    } = req.body;

    const doctorId = req.user._id;

    console.log("💊 Creating prescription for patient:", patientId, "by doctor:", doctorId);

    // 1. Validation - Check required fields
    const requiredFields = ['patientId', 'medications', 'diagnosis'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
        throw new ApiError(
            400, 
            `Missing required fields: ${missingFields.join(', ')}`
        );
    }

    // 2. Validate medications array
    if (!medications || !Array.isArray(medications) || medications.length === 0) {
        throw new ApiError(400, "At least one medication is required");
    }

    // Validate each medication
    for (const [index, med] of medications.entries()) {
        if (!med.name || !med.dosage || !med.frequency || !med.duration) {
            throw new ApiError(400, `Medication ${index + 1} is missing required fields (name, dosage, frequency, duration)`);
        }

        // Validate dosage format
        if (typeof med.dosage !== 'string' || med.dosage.trim() === '') {
            throw new ApiError(400, `Invalid dosage format for medication ${index + 1}`);
        }

        // Validate duration format (e.g., "10 days", "2 weeks", "1 month")
        if (typeof med.duration !== 'string' || med.duration.trim() === '') {
            throw new ApiError(400, `Invalid duration format for medication ${index + 1}`);
        }
    }

    // 3. Verify patient exists
    const patient = await Patient.findById(patientId).populate('userId');
    if (!patient) {
        throw new ApiError(404, "Patient not found");
    }

    // 4. Verify doctor has permission (has appointment with patient)
    if (appointmentId) {
        const appointment = await Appointment.findOne({
            _id: appointmentId,
            doctorId,
            patientId
        });

        if (!appointment) {
            throw new ApiError(403, "Access denied. No valid appointment found with this patient.");
        }
    } else {
        // If no appointment ID, check if doctor has any history with patient
        const hasHistory = await Appointment.findOne({
            doctorId,
            patientId
        });

        if (!hasHistory) {
            throw new ApiError(403, "Access denied. No appointment history with this patient.");
        }
    }

    // 5. Check for potential drug interactions
    const medicationNames = medications.map(med => med.name.toLowerCase());
    const potentialInteractions = await checkDrugInteractions(medicationNames, patientId);

    // 6. Check for patient allergies
    const patientAllergies = patient.allergies || [];
    const allergyWarnings = checkAllergyInteractions(medicationNames, patientAllergies);

    // 7. Generate prescription number
    const prescriptionCount = await Prescription.countDocuments();
    const prescriptionNumber = `RX-${String(prescriptionCount + 1).padStart(6, '0')}`;

    // 8. Calculate end date based on medication duration
    const startDate = new Date();
    const endDate = calculatePrescriptionEndDate(medications);

    // 9. Create prescription
    const prescriptionData = {
        prescriptionNumber,
        patientId,
        doctorId,
        appointmentId: appointmentId || null,
        medications: medications.map(med => ({
            name: med.name,
            dosage: med.dosage,
            frequency: med.frequency,
            duration: med.duration,
            instructions: med.instructions || '',
            quantity: med.quantity || 0,
            refills: med.refills || 0,
            route: med.route || 'oral',
            ...(med.beforeMeal !== undefined && { beforeMeal: med.beforeMeal }),
            ...(med.afterMeal !== undefined && { afterMeal: med.afterMeal }),
            ...(med.withFood !== undefined && { withFood: med.withFood })
        })),
        diagnosis,
        instructions: instructions || [],
        notes,
        followUpRequired: followUpRequired || false,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        isElectronic: isElectronic || true,
        allowRefills: allowRefills || false,
        maxRefills: maxRefills || 0,
        status: 'active',
        startDate: startDate,
        endDate: endDate,
        warnings: {
            drugInteractions: potentialInteractions,
            allergyWarnings: allergyWarnings
        },
        prescribedDate: new Date()
    };

    const prescription = await Prescription.create(prescriptionData);

    // 10. Populate prescription for response
    const createdPrescription = await Prescription.findById(prescription._id)
        .populate({
            path: 'patientId',
            populate: {
                path: 'userId',
                select: 'firstName lastName dateOfBirth gender phoneNumber email'
            }
        })
        .populate({
            path: 'doctorId',
            select: 'firstName lastName specialization qualification medicalLicense department'
        })
        .populate({
            path: 'appointmentId',
            select: 'appointmentDate appointmentTime type'
        })
        .lean();

    // 11. Update appointment with prescription reference if appointmentId provided
    if (appointmentId) {
        await Appointment.findByIdAndUpdate(appointmentId, {
            $set: { prescriptionId: prescription._id }
        });
    }

    // 12. Send prescription confirmation (async - don't wait)
    try {
        await sendPrescriptionConfirmation(patient.userId.email, {
            patientName: `${patient.userId.firstName} ${patient.userId.lastName}`,
            doctorName: `${req.user.firstName} ${req.user.lastName}`,
            prescriptionNumber: prescriptionNumber,
            prescribedDate: startDate.toDateString(),
            medications: medications.map(med => med.name),
            diagnosis: diagnosis,
            instructions: instructions
        });
    } catch (emailError) {
        console.error('⚠️ Prescription email sending failed:', emailError);
    }

    console.log('✅ Prescription created successfully:', prescriptionNumber);

    return res.status(201).json(
        new ApiResponse(
            201, 
            {
                prescription: createdPrescription,
                warnings: {
                    drugInteractions: potentialInteractions.length > 0 ? potentialInteractions : null,
                    allergyWarnings: allergyWarnings.length > 0 ? allergyWarnings : null
                }
            }, 
            "Prescription created successfully"
        )
    );
});

/**
 * GET PRESCRIPTION BY ID
 * Get detailed prescription by ID with access control
 * 
 * GET /api/v1/prescriptions/:prescriptionId
 * Requires: verifyJWT middleware
 */
const getPrescriptionById = asyncHandler(async (req, res) => {
    const { prescriptionId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    console.log("🔍 Fetching prescription:", prescriptionId);

    if (!prescriptionId) {
        throw new ApiError(400, "Prescription ID is required");
    }

    // Find prescription
    const prescription = await Prescription.findById(prescriptionId)
        .populate({
            path: 'patientId',
            populate: {
                path: 'userId',
                select: 'firstName lastName dateOfBirth gender bloodGroup phoneNumber email'
            }
        })
        .populate({
            path: 'doctorId',
            select: 'firstName lastName specialization qualification department medicalLicense'
        })
        .populate({
            path: 'appointmentId',
            select: 'appointmentDate appointmentTime type'
        })
        .populate({
            path: 'pharmacistId',
            select: 'firstName lastName pharmacyName'
        })
        .lean();

    if (!prescription) {
        throw new ApiError(404, "Prescription not found");
    }

    // Access control based on user role
    if (userRole === 'patient') {
        const patientUser = await User.findById(userId).populate('patientId');
        if (!patientUser?.patientId || 
            prescription.patientId._id.toString() !== patientUser.patientId._id.toString()) {
            throw new ApiError(403, "Access denied. You can only view your own prescriptions.");
        }
    } else if (userRole === 'doctor') {
        // Check if doctor owns this prescription or has relationship with patient
        if (prescription.doctorId._id.toString() !== userId.toString()) {
            const hasRelationship = await Appointment.findOne({
                doctorId: userId,
                patientId: prescription.patientId._id
            });

            if (!hasRelationship) {
                throw new ApiError(403, "Access denied. No patient relationship found.");
            }
        }
    }
    // Admin and pharmacist roles can access all prescriptions

    console.log('✅ Prescription fetched successfully:', prescription.prescriptionNumber);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { prescription },
                "Prescription fetched successfully"
            )
        );
});

/**
 * GET PATIENT PRESCRIPTIONS
 * Get all prescriptions for a patient with filtering
 * 
 * GET /api/v1/prescriptions/patient/:patientId
 * Requires: verifyJWT middleware
 */
const getPatientPrescriptions = asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;
    const {
        status,
        dateFrom,
        dateTo,
        doctorId,
        isActive,
        page = 1,
        limit = 10,
        sortBy = 'prescribedDate',
        sortOrder = 'desc'
    } = req.query;

    console.log("📋 Fetching prescriptions for patient:", patientId);

    if (!patientId) {
        throw new ApiError(400, "Patient ID is required");
    }

    // Verify patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
        throw new ApiError(404, "Patient not found");
    }

    // Access control
    if (userRole === 'patient') {
        const patientUser = await User.findById(userId).populate('patientId');
        if (!patientUser?.patientId || 
            patientId !== patientUser.patientId._id.toString()) {
            throw new ApiError(403, "Access denied. You can only view your own prescriptions.");
        }
    } else if (userRole === 'doctor') {
        // Check if doctor has relationship with patient
        const hasRelationship = await Appointment.findOne({
            doctorId: userId,
            patientId: patientId
        });

        if (!hasRelationship && doctorId !== userId) {
            throw new ApiError(403, "Access denied. No patient relationship found.");
        }
    }

    // Build query
    const query = { patientId };
    
    if (status) query.status = status;
    if (doctorId) query.doctorId = doctorId;
    if (isActive !== undefined) {
        if (isActive === 'true') {
            query.status = 'active';
            query.endDate = { $gte: new Date() };
        } else {
            query.$or = [
                { status: { $ne: 'active' } },
                { endDate: { $lt: new Date() } }
            ];
        }
    }
    
    // Date range filter
    if (dateFrom || dateTo) {
        query.prescribedDate = {};
        if (dateFrom) query.prescribedDate.$gte = new Date(dateFrom);
        if (dateTo) query.prescribedDate.$lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const prescriptions = await Prescription.find(query)
        .populate({
            path: 'doctorId',
            select: 'firstName lastName specialization department'
        })
        .populate({
            path: 'appointmentId',
            select: 'appointmentDate type'
        })
        .populate({
            path: 'pharmacistId',
            select: 'firstName lastName pharmacyName'
        })
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

    const total = await Prescription.countDocuments(query);

    // Get prescription statistics
    const statusStats = await Prescription.aggregate([
        { $match: { patientId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const statistics = {
        byStatus: statusStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {}),
        totalPrescriptions: total,
        activePrescriptions: await Prescription.countDocuments({ 
            patientId, 
            status: 'active',
            endDate: { $gte: new Date() }
        })
    };

    console.log(`✅ Found ${prescriptions.length} prescriptions for patient`);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    patient: {
                        id: patient._id,
                        name: `${patient.userId?.firstName} ${patient.userId?.lastName}`,
                        dateOfBirth: patient.userId?.dateOfBirth
                    },
                    prescriptions,
                    statistics,
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
 * UPDATE PRESCRIPTION STATUS
 * Update prescription status (filled, cancelled, etc.)
 * 
 * PATCH /api/v1/prescriptions/:prescriptionId/status
 * Requires: verifyJWT middleware (doctor, pharmacist, or admin)
 */
const updatePrescriptionStatus = asyncHandler(async (req, res) => {
    const { prescriptionId } = req.params;
    const { status, notes, pharmacistId, pharmacyName } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    console.log("🔄 Updating prescription status:", prescriptionId, "to:", status);

    if (!prescriptionId || !status) {
        throw new ApiError(400, "Prescription ID and status are required");
    }

    // Validate status
    const validStatuses = ['active', 'filled', 'cancelled', 'expired', 'refilled'];
    if (!validStatuses.includes(status)) {
        throw new ApiError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Find prescription
    const prescription = await Prescription.findById(prescriptionId)
        .populate({
            path: 'patientId',
            populate: {
                path: 'userId',
                select: 'firstName lastName email phoneNumber'
            }
        })
        .populate({
            path: 'doctorId',
            select: 'firstName lastName email'
        });

    if (!prescription) {
        throw new ApiError(404, "Prescription not found");
    }

    // Check permissions based on status change
    if (status === 'cancelled' && userRole === 'doctor') {
        // Only prescribing doctor can cancel
        if (prescription.doctorId._id.toString() !== userId.toString()) {
            throw new ApiError(403, "Access denied. Only prescribing doctor can cancel prescription.");
        }
    } else if (status === 'filled' && userRole !== 'pharmacist' && userRole !== 'admin') {
        throw new ApiError(403, "Access denied. Only pharmacists can mark prescriptions as filled.");
    }

    // Status transition validation
    const currentStatus = prescription.status;
    const allowedTransitions = {
        'active': ['filled', 'cancelled', 'expired'],
        'filled': ['refilled', 'expired'],
        'cancelled': [],
        'expired': [],
        'refilled': ['filled', 'expired']
    };

    if (!allowedTransitions[currentStatus]?.includes(status)) {
        throw new ApiError(400, `Cannot change status from ${currentStatus} to ${status}`);
    }

    // Update prescription
    const updateData = { 
        status,
        updatedBy: userId,
        updatedAt: new Date()
    };

    if (notes) {
        updateData.pharmacistNotes = notes;
    }

    if (status === 'filled' || status === 'refilled') {
        updateData.pharmacistId = pharmacistId || userId;
        updateData.pharmacyName = pharmacyName;
        updateData.filledDate = new Date();
        
        if (status === 'filled') {
            updateData.refillsUsed = 0;
        } else if (status === 'refilled') {
            updateData.refillsUsed = (prescription.refillsUsed || 0) + 1;
        }
    } else if (status === 'cancelled') {
        updateData.cancelledDate = new Date();
        updateData.cancelledBy = userId;
    }

    const updatedPrescription = await Prescription.findByIdAndUpdate(
        prescriptionId,
        { $set: updateData },
        { new: true, runValidators: true }
    )
    .populate({
        path: 'patientId',
        populate: {
            path: 'userId',
            select: 'firstName lastName email phoneNumber'
        }
    })
    .populate({
        path: 'doctorId',
        select: 'firstName lastName specialization'
    })
    .populate({
        path: 'pharmacistId',
        select: 'firstName lastName pharmacyName'
    });

    // Send notifications based on status change
    try {
        if (status === 'filled') {
            await sendPrescriptionReady(
                prescription.patientId.userId.email,
                {
                    patientName: `${prescription.patientId.userId.firstName} ${prescription.patientId.userId.lastName}`,
                    prescriptionNumber: prescription.prescriptionNumber,
                    medications: prescription.medications.map(med => med.name),
                    pharmacyName: pharmacyName,
                    filledDate: new Date().toDateString()
                }
            );
        }
    } catch (notificationError) {
        console.error('⚠️ Notification sending failed:', notificationError);
    }

    console.log('✅ Prescription status updated:', prescription.prescriptionNumber, '->', status);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { prescription: updatedPrescription },
                `Prescription ${status} successfully`
            )
        );
});

/**
 * REQUEST PRESCRIPTION REFILL
 * Patient requests refill for an existing prescription
 * 
 * POST /api/v1/prescriptions/:prescriptionId/refill
 * Requires: verifyJWT middleware, patient role
 */
const requestPrescriptionRefill = asyncHandler(async (req, res) => {
    const { prescriptionId } = req.params;
    const userId = req.user._id;
    const { pharmacyPreference, urgent = false, notes } = req.body;

    console.log("🔄 Requesting prescription refill:", prescriptionId);

    if (!prescriptionId) {
        throw new ApiError(400, "Prescription ID is required");
    }

    // Find prescription and verify patient ownership
    const prescription = await Prescription.findById(prescriptionId)
        .populate({
            path: 'patientId',
            populate: {
                path: 'userId',
                select: 'firstName lastName email phoneNumber'
            }
        })
        .populate({
            path: 'doctorId',
            select: 'firstName lastName email specialization'
        });

    if (!prescription) {
        throw new ApiError(404, "Prescription not found");
    }

    // Verify patient owns this prescription
    const patientUser = await User.findById(userId).populate('patientId');
    if (!patientUser?.patientId || 
        prescription.patientId._id.toString() !== patientUser.patientId._id.toString()) {
        throw new ApiError(403, "Access denied. You can only request refills for your own prescriptions.");
    }

    // Check if refill is allowed
    if (!prescription.allowRefills) {
        throw new ApiError(400, "Refills are not allowed for this prescription");
    }

    // Check if max refills reached
    const currentRefills = prescription.refillsUsed || 0;
    if (currentRefills >= prescription.maxRefills) {
        throw new ApiError(400, "Maximum refill limit reached for this prescription");
    }

    // Check if prescription is still valid
    if (prescription.endDate && new Date() > prescription.endDate) {
        throw new ApiError(400, "Prescription has expired");
    }

    // Check if prescription is active
    if (prescription.status !== 'active') {
        throw new ApiError(400, `Cannot refill prescription with status: ${prescription.status}`);
    }

    // Create refill request
    const refillRequest = {
        requestedBy: userId,
        requestedAt: new Date(),
        pharmacyPreference: pharmacyPreference || '',
        urgent: urgent || false,
        notes: notes || '',
        status: 'pending'
    };

    const updatedPrescription = await Prescription.findByIdAndUpdate(
        prescriptionId,
        {
            $push: { refillRequests: refillRequest },
            $set: { 
                updatedAt: new Date(),
                status: 'refill_requested'
            }
        },
        { new: true, runValidators: true }
    )
    .populate({
        path: 'patientId',
        populate: {
            path: 'userId',
            select: 'firstName lastName'
        }
    })
    .populate({
        path: 'doctorId',
        select: 'firstName lastName specialization'
    });

    console.log('✅ Refill request submitted for:', prescription.prescriptionNumber);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { 
                    prescription: updatedPrescription,
                    refillRequest: refillRequest
                },
                "Refill request submitted successfully"
            )
        );
});

/**
 * GET ACTIVE PRESCRIPTIONS
 * Get all active prescriptions for a patient
 * 
 * GET /api/v1/prescriptions/active/:patientId
 * Requires: verifyJWT middleware
 */
const getActivePrescriptions = asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    console.log("💊 Fetching active prescriptions for patient:", patientId);

    if (!patientId) {
        throw new ApiError(400, "Patient ID is required");
    }

    // Access control
    if (userRole === 'patient') {
        const patientUser = await User.findById(userId).populate('patientId');
        if (!patientUser?.patientId || 
            patientId !== patientUser.patientId._id.toString()) {
            throw new ApiError(403, "Access denied. You can only view your own prescriptions.");
        }
    } else if (userRole === 'doctor') {
        // Check if doctor has relationship with patient
        const hasRelationship = await Appointment.findOne({
            doctorId: userId,
            patientId: patientId
        });

        if (!hasRelationship) {
            throw new ApiError(403, "Access denied. No patient relationship found.");
        }
    }

    const currentDate = new Date();

    const activePrescriptions = await Prescription.find({
        patientId,
        status: 'active',
        $or: [
            { endDate: { $gte: currentDate } },
            { endDate: null }
        ]
    })
    .populate({
        path: 'doctorId',
        select: 'firstName lastName specialization department'
    })
    .populate({
        path: 'pharmacistId',
        select: 'firstName lastName pharmacyName'
    })
    .sort({ prescribedDate: -1 })
    .lean();

    // Calculate days remaining for each prescription
    const prescriptionsWithRemainingDays = activePrescriptions.map(prescription => {
        let daysRemaining = null;
        if (prescription.endDate) {
            const endDate = new Date(prescription.endDate);
            const timeDiff = endDate.getTime() - currentDate.getTime();
            daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
        }

        return {
            ...prescription,
            daysRemaining: daysRemaining
        };
    });

    console.log(`✅ Found ${prescriptionsWithRemainingDays.length} active prescriptions`);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { prescriptions: prescriptionsWithRemainingDays },
                "Active prescriptions fetched successfully"
            )
        );
});

/**
 * GET PRESCRIPTION STATISTICS
 * Get prescription statistics for dashboard
 * 
 * GET /api/v1/prescriptions/statistics
 * Requires: verifyJWT middleware
 */
const getPrescriptionStatistics = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { period = 'month', patientId, doctorId } = req.query;

    console.log("📊 Fetching prescription statistics for:", userRole, userId);

    // Build query based on user role
    const query = {};
    
    if (userRole === 'doctor') {
        query.doctorId = userId;
    } else if (userRole === 'patient') {
        const patientUser = await User.findById(userId).populate('patientId');
        if (!patientUser?.patientId) {
            throw new ApiError(404, "Patient profile not found");
        }
        query.patientId = patientUser.patientId._id;
    }

    // Additional filters
    if (patientId) query.patientId = patientId;
    if (doctorId) query.doctorId = doctorId;

    // Date range based on period
    const dateRange = {};
    const now = new Date();
    
    switch (period) {
        case 'day':
            dateRange.$gte = new Date(now.setHours(0, 0, 0, 0));
            dateRange.$lte = new Date(now.setHours(23, 59, 59, 999));
            break;
        case 'week':
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            dateRange.$gte = startOfWeek;
            dateRange.$lte = new Date();
            break;
        case 'month':
            dateRange.$gte = new Date(now.getFullYear(), now.getMonth(), 1);
            dateRange.$lte = new Date();
            break;
        case 'year':
            dateRange.$gte = new Date(now.getFullYear(), 0, 1);
            dateRange.$lte = new Date();
            break;
        default:
            dateRange.$gte = new Date(now.getFullYear(), now.getMonth(), 1);
            dateRange.$lte = new Date();
    }

    query.prescribedDate = dateRange;

    // Get statistics
    const totalPrescriptions = await Prescription.countDocuments(query);

    const statusStats = await Prescription.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const monthlyTrend = await Prescription.aggregate([
        { $match: query },
        {
            $group: {
                _id: {
                    year: { $year: '$prescribedDate' },
                    month: { $month: '$prescribedDate' }
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
    ]);

    // Get most prescribed medications
    const topMedications = await Prescription.aggregate([
        { $match: query },
        { $unwind: '$medications' },
        {
            $group: {
                _id: '$medications.name',
                count: { $sum: 1 },
                totalQuantity: { $sum: '$medications.quantity' }
            }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
    ]);

    const statistics = {
        period,
        totalPrescriptions,
        byStatus: statusStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {}),
        monthlyTrend: monthlyTrend.map(item => ({
            period: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
            count: item.count
        })),
        topMedications,
        dateRange: {
            from: dateRange.$gte,
            to: dateRange.$lte
        }
    };

    console.log('✅ Prescription statistics fetched successfully');

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { statistics },
                "Prescription statistics fetched successfully"
            )
        );
});

// Helper functions

/**
 * Check for potential drug interactions
 */
const checkDrugInteractions = async (medicationNames, patientId) => {
    // In a real system, this would integrate with a drug interaction API
    // For now, return mock data or basic checks
    
    const interactions = [];
    
    // Simple check for common interactions
    const commonInteractions = {
        'warfarin': ['aspirin', 'ibuprofen', 'naproxen'],
        'simvastatin': ['clarithromycin', 'erythromycin', 'cyclosporine'],
        'lisinopril': ['ibuprofen', 'naproxen', 'indomethacin']
    };

    medicationNames.forEach(med => {
        if (commonInteractions[med]) {
            const interactingMeds = medicationNames.filter(otherMed => 
                commonInteractions[med].includes(otherMed) && otherMed !== med
            );
            
            if (interactingMeds.length > 0) {
                interactions.push({
                    medication: med,
                    interactingWith: interactingMeds,
                    severity: 'moderate',
                    description: `Potential interaction between ${med} and ${interactingMeds.join(', ')}`
                });
            }
        }
    });

    return interactions;
};

/**
 * Check for allergy interactions
 */
const checkAllergyInteractions = (medicationNames, patientAllergies) => {
    const warnings = [];
    
    // Simple check for common allergy interactions
    medicationNames.forEach(med => {
        patientAllergies.forEach(allergy => {
            if (allergy.name && med.toLowerCase().includes(allergy.name.toLowerCase())) {
                warnings.push({
                    medication: med,
                    allergy: allergy.name,
                    severity: 'high',
                    description: `Patient has allergy to ${allergy.name} which may interact with ${med}`
                });
            }
        });
    });

    return warnings;
};

/**
 * Calculate prescription end date based on medication duration
 */
const calculatePrescriptionEndDate = (medications) => {
    if (!medications || medications.length === 0) return null;

    // Find the medication with the longest duration
    let maxDays = 0;
    
    medications.forEach(med => {
        const duration = med.duration.toLowerCase();
        let days = 0;

        if (duration.includes('day')) {
            days = parseInt(duration) || 0;
        } else if (duration.includes('week')) {
            days = (parseInt(duration) || 0) * 7;
        } else if (duration.includes('month')) {
            days = (parseInt(duration) || 0) * 30;
        }

        if (days > maxDays) {
            maxDays = days;
        }
    });

    if (maxDays > 0) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + maxDays);
        return endDate;
    }

    return null;
};

// Export all prescription controller functions
export {
    createPrescription,
    getPrescriptionById,
    getPatientPrescriptions,
    updatePrescriptionStatus,
    requestPrescriptionRefill,
    getActivePrescriptions,
    getPrescriptionStatistics
};

/**
 * Additional prescription controllers that can be added:
 * - approveRefillRequest (doctor approval)
 * - getRefillRequests (for doctors/pharmacists)
 * - updateMedicationDetails
 * - checkDrugAvailability
 * - sendPrescriptionToPharmacy
 * - getPrescriptionHistory (timeline view)
 * - exportPrescription (PDF generation)
 * - bulkPrescriptionUpdate
 */