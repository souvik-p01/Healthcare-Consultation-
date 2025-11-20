/**
 * Healthcare System - Consultation Controller
 * 
 * Handles real-time and asynchronous consultations for healthcare system.
 * 
 * Features:
 * - Real-time video consultations
 * - Chat-based consultations
 * - Consultation notes and documentation
 * - Symptom checker integration
 * - Follow-up consultation scheduling
 * - Multi-format consultations (video, audio, chat)
 */

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Consultation } from "../models/consultation.model.js";
import { User } from "../models/User.model.js";
import { Patient } from "../models/Patient.model.js";
import { Doctor } from "../models/doctor.model.js";
import { Appointment } from "../models/appointment.model.js";
import { Prescription } from "../models/prescription.model.js";
import { MedicalRecord } from "../models/medicalRecord.model.js";
import { 
    sendConsultationConfirmation,
    sendConsultationReminder,
    sendConsultationSummary
} from "../utils/emailUtils.js";

/**
 * INITIATE CONSULTATION
 * Start a new consultation session (video/audio/chat)
 * 
 * POST /api/v1/consultations/initiate
 * Requires: verifyJWT middleware
 */
const initiateConsultation = asyncHandler(async (req, res) => {
    const {
        doctorId,
        patientId,
        appointmentId,
        consultationType,
        symptoms,
        priority = 'normal',
        notes,
        duration = 30, // default 30 minutes
        isEmergency = false
    } = req.body;

    const initiatedBy = req.user._id;
    const userRole = req.user.role;

    console.log("🎬 Initiating consultation for patient:", patientId, "with doctor:", doctorId);

    // 1. Validation - Check required fields
    const requiredFields = ['doctorId', 'patientId', 'consultationType'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
        throw new ApiError(
            400, 
            `Missing required fields: ${missingFields.join(', ')}`
        );
    }

    // 2. Validate consultation type
    const validConsultationTypes = ['video', 'audio', 'chat', 'in_person'];
    if (!validConsultationTypes.includes(consultationType)) {
        throw new ApiError(400, `Invalid consultation type. Must be one of: ${validConsultationTypes.join(', ')}`);
    }

    // 3. Validate priority
    const validPriorities = ['low', 'normal', 'high', 'emergency'];
    if (!validPriorities.includes(priority)) {
        throw new ApiError(400, `Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
    }

    // 4. Verify patient exists
    const patient = await Patient.findById(patientId).populate('userId');
    if (!patient) {
        throw new ApiError(404, "Patient not found");
    }

    // 5. Verify doctor exists and is available
    const doctor = await User.findOne({ 
        _id: doctorId, 
        role: 'doctor', 
        isActive: true 
    }).populate('doctorId');

    if (!doctor) {
        throw new ApiError(404, "Doctor not found or inactive");
    }

    // 6. Check if doctor is available for consultation
    if (doctor.doctorId && !doctor.doctorId.isAvailable) {
        throw new ApiError(423, "Doctor is currently unavailable for consultations");
    }

    // 7. Check for existing active consultation
    const existingConsultation = await Consultation.findOne({
        $or: [
            { patientId, status: { $in: ['scheduled', 'active', 'waiting'] } },
            { doctorId, status: { $in: ['scheduled', 'active', 'waiting'] } }
        ]
    });

    if (existingConsultation) {
        throw new ApiError(409, "Patient or doctor already has an active consultation");
    }

    // 8. Verify permissions based on role
    if (userRole === 'patient') {
        if (patientId !== req.user.patientId?.toString()) {
            throw new ApiError(403, "Access denied. You can only initiate consultations for yourself.");
        }
    } else if (userRole === 'doctor') {
        // Check if doctor has relationship with patient
        const hasRelationship = await Appointment.findOne({
            doctorId,
            patientId
        });

        if (!hasRelationship) {
            throw new ApiError(403, "Access denied. No patient relationship found.");
        }
    }

    // 9. Generate consultation ID and room ID
    const consultationCount = await Consultation.countDocuments();
    const consultationNumber = `CONS-${String(consultationCount + 1).padStart(6, '0')}`;
    const roomId = `room-${doctorId}-${patientId}-${Date.now()}`;

    // 10. Calculate start and end times
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + duration * 60000);

    // 11. Create consultation
    const consultationData = {
        consultationNumber,
        roomId,
        patientId,
        doctorId,
        appointmentId: appointmentId || null,
        consultationType,
        symptoms: symptoms || [],
        priority,
        notes,
        duration,
        isEmergency: isEmergency || false,
        status: 'scheduled',
        startTime,
        endTime,
        initiatedBy,
        participants: {
            patient: patientId,
            doctor: doctorId,
            joined: []
        }
    };

    const consultation = await Consultation.create(consultationData);

    // 12. Populate consultation for response
    const createdConsultation = await Consultation.findById(consultation._id)
        .populate({
            path: 'patientId',
            populate: {
                path: 'userId',
                select: 'firstName lastName dateOfBirth gender phoneNumber avatar'
            }
        })
        .populate({
            path: 'doctorId',
            select: 'firstName lastName specialization qualification department avatar'
        })
        .populate({
            path: 'appointmentId',
            select: 'appointmentDate appointmentTime type'
        })
        .lean();

    // 13. Send consultation initiation notifications (async)
    try {
        await sendConsultationConfirmation(patient.userId.email, {
            patientName: `${patient.userId.firstName} ${patient.userId.lastName}`,
            doctorName: `${doctor.firstName} ${doctor.lastName}`,
            consultationType: consultationType,
            startTime: startTime.toLocaleString(),
            duration: duration,
            consultationNumber: consultationNumber
        });

        await sendConsultationConfirmation(doctor.email, {
            patientName: `${patient.userId.firstName} ${patient.userId.lastName}`,
            doctorName: `${doctor.firstName} ${doctor.lastName}`,
            consultationType: consultationType,
            startTime: startTime.toLocaleString(),
            duration: duration,
            consultationNumber: consultationNumber
        });
    } catch (emailError) {
        console.error('⚠️ Consultation email sending failed:', emailError);
    }

    console.log('✅ Consultation initiated successfully:', consultationNumber);

    return res.status(201).json(
        new ApiResponse(
            201, 
            {
                consultation: createdConsultation,
                connectionDetails: {
                    roomId: roomId,
                    consultationId: consultation._id,
                    startTime: startTime,
                    endTime: endTime
                }
            }, 
            "Consultation initiated successfully"
        )
    );
});

/**
 * JOIN CONSULTATION
 * Join an existing consultation session
 * 
 * POST /api/v1/consultations/:consultationId/join
 * Requires: verifyJWT middleware
 */
const joinConsultation = asyncHandler(async (req, res) => {
    const { consultationId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    console.log("🚪 Joining consultation:", consultationId, "by user:", userId);

    if (!consultationId) {
        throw new ApiError(400, "Consultation ID is required");
    }

    // Find consultation
    const consultation = await Consultation.findById(consultationId)
        .populate({
            path: 'patientId',
            populate: {
                path: 'userId',
                select: 'firstName lastName'
            }
        })
        .populate({
            path: 'doctorId',
            select: 'firstName lastName'
        });

    if (!consultation) {
        throw new ApiError(404, "Consultation not found");
    }

    // Verify user is a participant
    const isPatient = consultation.patientId.userId._id.toString() === userId.toString();
    const isDoctor = consultation.doctorId._id.toString() === userId.toString();

    if (!isPatient && !isDoctor) {
        throw new ApiError(403, "Access denied. You are not a participant in this consultation.");
    }

    // Check consultation status
    if (consultation.status === 'completed') {
        throw new ApiError(400, "Consultation has already been completed");
    }

    if (consultation.status === 'cancelled') {
        throw new ApiError(400, "Consultation has been cancelled");
    }

    if (consultation.status === 'ended') {
        throw new ApiError(400, "Consultation has ended");
    }

    // Update consultation status and participant join time
    const participantType = isPatient ? 'patient' : 'doctor';
    const joinTime = new Date();

    const updatedConsultation = await Consultation.findByIdAndUpdate(
        consultationId,
        {
            $set: { 
                status: 'active',
                startTime: consultation.startTime || joinTime
            },
            $addToSet: { 
                'participants.joined': {
                    user: userId,
                    role: participantType,
                    joinTime: joinTime
                }
            }
        },
        { new: true, runValidators: true }
    )
    .populate({
        path: 'patientId',
        populate: {
            path: 'userId',
            select: 'firstName lastName avatar'
        }
    })
    .populate({
        path: 'doctorId',
        select: 'firstName lastName avatar specialization'
    });

    console.log('✅ User joined consultation:', consultation.consultationNumber, 'as', participantType);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    consultation: updatedConsultation,
                    connectionDetails: {
                        roomId: consultation.roomId,
                        participantType: participantType,
                        joinTime: joinTime
                    }
                },
                "Joined consultation successfully"
            )
        );
});

/**
 * GET CONSULTATION DETAILS
 * Get detailed information about a consultation
 * 
 * GET /api/v1/consultations/:consultationId
 * Requires: verifyJWT middleware
 */
const getConsultationById = asyncHandler(async (req, res) => {
    const { consultationId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    console.log("🔍 Fetching consultation details:", consultationId);

    if (!consultationId) {
        throw new ApiError(400, "Consultation ID is required");
    }

    // Find consultation
    const consultation = await Consultation.findById(consultationId)
        .populate({
            path: 'patientId',
            populate: {
                path: 'userId',
                select: 'firstName lastName dateOfBirth gender phoneNumber email avatar'
            }
        })
        .populate({
            path: 'doctorId',
            select: 'firstName lastName specialization qualification department experience avatar'
        })
        .populate({
            path: 'appointmentId',
            select: 'appointmentDate appointmentTime type reason'
        })
        .populate({
            path: 'prescriptionId',
            select: 'prescriptionNumber medications diagnosis'
        })
        .populate({
            path: 'medicalRecordId',
            select: 'recordNumber diagnosis treatment'
        })
        .lean();

    if (!consultation) {
        throw new ApiError(404, "Consultation not found");
    }

    // Access control based on user role
    if (userRole === 'patient') {
        const patientUser = await User.findById(userId).populate('patientId');
        if (!patientUser?.patientId || 
            consultation.patientId._id.toString() !== patientUser.patientId._id.toString()) {
            throw new ApiError(403, "Access denied. You can only view your own consultations.");
        }
    } else if (userRole === 'doctor') {
        // Check if doctor owns this consultation or has relationship with patient
        if (consultation.doctorId._id.toString() !== userId.toString()) {
            const hasRelationship = await Appointment.findOne({
                doctorId: userId,
                patientId: consultation.patientId._id
            });

            if (!hasRelationship) {
                throw new ApiError(403, "Access denied. No patient relationship found.");
            }
        }
    }

    console.log('✅ Consultation details fetched successfully:', consultation.consultationNumber);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { consultation },
                "Consultation details fetched successfully"
            )
        );
});

/**
 * GET CONSULTATIONS WITH FILTERS
 * Get consultations with filtering, pagination, and sorting
 * 
 * GET /api/v1/consultations
 * Requires: verifyJWT middleware
 */
const getConsultations = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;
    const {
        status,
        consultationType,
        dateFrom,
        dateTo,
        doctorId,
        patientId,
        priority,
        page = 1,
        limit = 10,
        sortBy = 'startTime',
        sortOrder = 'desc'
    } = req.query;

    console.log("📋 Fetching consultations for:", userRole, userId);

    // Build query based on user role
    const query = {};

    // Role-based access control
    if (userRole === 'patient') {
        const patientUser = await User.findById(userId).populate('patientId');
        if (!patientUser?.patientId) {
            throw new ApiError(404, "Patient profile not found");
        }
        query.patientId = patientUser.patientId._id;
    } else if (userRole === 'doctor') {
        query.doctorId = userId;
    }

    // Apply filters
    if (status) query.status = status;
    if (consultationType) query.consultationType = consultationType;
    if (priority) query.priority = priority;
    if (doctorId) query.doctorId = doctorId;
    if (patientId) query.patientId = patientId;

    // Date range filter
    if (dateFrom || dateTo) {
        query.startTime = {};
        if (dateFrom) query.startTime.$gte = new Date(dateFrom);
        if (dateTo) query.startTime.$lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const consultations = await Consultation.find(query)
        .populate({
            path: 'patientId',
            populate: {
                path: 'userId',
                select: 'firstName lastName phoneNumber avatar'
            }
        })
        .populate({
            path: 'doctorId',
            select: 'firstName lastName specialization department avatar'
        })
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

    const total = await Consultation.countDocuments(query);

    console.log(`✅ Found ${consultations.length} consultations`);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    consultations,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(total / limit),
                        totalConsultations: total,
                        hasNextPage: page * limit < total
                    }
                },
                "Consultations fetched successfully"
            )
        );
});

/**
 * UPDATE CONSULTATION STATUS
 * Update consultation status (active, completed, cancelled, etc.)
 * 
 * PATCH /api/v1/consultations/:consultationId/status
 * Requires: verifyJWT middleware
 */
const updateConsultationStatus = asyncHandler(async (req, res) => {
    const { consultationId } = req.params;
    const { status, reason, notes } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    console.log("🔄 Updating consultation status:", consultationId, "to:", status);

    if (!consultationId || !status) {
        throw new ApiError(400, "Consultation ID and status are required");
    }

    // Validate status
    const validStatuses = ['scheduled', 'active', 'completed', 'cancelled', 'ended', 'no_show'];
    if (!validStatuses.includes(status)) {
        throw new ApiError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Find consultation
    const consultation = await Consultation.findById(consultationId)
        .populate({
            path: 'patientId',
            populate: {
                path: 'userId',
                select: 'firstName lastName email phoneNumber'
            }
        })
        .populate({
            path: 'doctorId',
            select: 'firstName lastName email phoneNumber'
        });

    if (!consultation) {
        throw new ApiError(404, "Consultation not found");
    }

    // Check permissions
    const isPatient = consultation.patientId.userId._id.toString() === userId.toString();
    const isDoctor = consultation.doctorId._id.toString() === userId.toString();

    if (!isPatient && !isDoctor && userRole !== 'admin') {
        throw new ApiError(403, "Access denied. You can only update consultations you're participating in.");
    }

    // Status transition validation
    const currentStatus = consultation.status;
    const allowedTransitions = {
        'scheduled': ['active', 'cancelled', 'no_show'],
        'active': ['completed', 'ended', 'cancelled'],
        'completed': [],
        'cancelled': [],
        'ended': [],
        'no_show': ['rescheduled']
    };

    if (!allowedTransitions[currentStatus]?.includes(status)) {
        throw new ApiError(400, `Cannot change status from ${currentStatus} to ${status}`);
    }

    // Update consultation
    const updateData = { 
        status,
        updatedBy: userId,
        updatedAt: new Date()
    };

    if (reason) updateData.cancellationReason = reason;
    if (notes) updateData.notes = notes;

    // Set end time if completing or ending consultation
    if (status === 'completed' || status === 'ended') {
        updateData.endTime = new Date();
        
        // Calculate actual duration
        const startTime = consultation.startTime;
        const endTime = updateData.endTime;
        const actualDuration = Math.round((endTime - startTime) / 60000); // in minutes
        updateData.actualDuration = actualDuration;
    }

    if (status === 'cancelled') {
        updateData.cancelledAt = new Date();
        updateData.cancelledBy = userId;
    }

    const updatedConsultation = await Consultation.findByIdAndUpdate(
        consultationId,
        { $set: updateData },
        { new: true, runValidators: true }
    )
    .populate({
        path: 'patientId',
        populate: {
            path: 'userId',
            select: 'firstName lastName email'
        }
    })
    .populate({
        path: 'doctorId',
        select: 'firstName lastName specialization'
    });

    console.log('✅ Consultation status updated:', consultation.consultationNumber, '->', status);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { consultation: updatedConsultation },
                `Consultation ${status} successfully`
            )
        );
});

/**
 * ADD CONSULTATION NOTES
 * Add clinical notes and documentation to consultation
 * 
 * POST /api/v1/consultations/:consultationId/notes
 * Requires: verifyJWT middleware, doctor role
 */
const addConsultationNotes = asyncHandler(async (req, res) => {
    const { consultationId } = req.params;
    const doctorId = req.user._id;
    const {
        clinicalNotes,
        assessment,
        plan,
        recommendations,
        followUpRequired,
        followUpDate,
        vitalSigns,
        diagnosis
    } = req.body;

    console.log("📝 Adding notes to consultation:", consultationId);

    if (!consultationId) {
        throw new ApiError(400, "Consultation ID is required");
    }

    if (!clinicalNotes) {
        throw new ApiError(400, "Clinical notes are required");
    }

    // Find consultation and verify doctor ownership
    const consultation = await Consultation.findOne({
        _id: consultationId,
        doctorId: doctorId
    });

    if (!consultation) {
        throw new ApiError(404, "Consultation not found or access denied");
    }

    // Update consultation with notes
    const updatedConsultation = await Consultation.findByIdAndUpdate(
        consultationId,
        {
            $set: {
                clinicalNotes,
                assessment: assessment || '',
                plan: plan || '',
                recommendations: recommendations || [],
                followUpRequired: followUpRequired || false,
                followUpDate: followUpDate ? new Date(followUpDate) : null,
                vitalSigns: vitalSigns || {},
                diagnosis: diagnosis || '',
                notesAddedAt: new Date(),
                updatedBy: doctorId
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

    console.log('✅ Clinical notes added to consultation:', consultation.consultationNumber);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { consultation: updatedConsultation },
                "Consultation notes added successfully"
            )
        );
});

/**
 * CREATE PRESCRIPTION FROM CONSULTATION
 * Create prescription based on consultation
 * 
 * POST /api/v1/consultations/:consultationId/prescription
 * Requires: verifyJWT middleware, doctor role
 */
const createPrescriptionFromConsultation = asyncHandler(async (req, res) => {
    const { consultationId } = req.params;
    const doctorId = req.user._id;
    const {
        medications,
        instructions,
        notes,
        allowRefills = false,
        maxRefills = 0
    } = req.body;

    console.log("💊 Creating prescription from consultation:", consultationId);

    if (!consultationId) {
        throw new ApiError(400, "Consultation ID is required");
    }

    // Find consultation and verify doctor ownership
    const consultation = await Consultation.findOne({
        _id: consultationId,
        doctorId: doctorId
    })
    .populate({
        path: 'patientId',
        populate: {
            path: 'userId',
            select: 'firstName lastName'
        }
    });

    if (!consultation) {
        throw new ApiError(404, "Consultation not found or access denied");
    }

    // Use consultation diagnosis if available
    const diagnosis = consultation.diagnosis || 'Medical consultation';

    // Create prescription using existing prescription controller logic
    const prescriptionData = {
        patientId: consultation.patientId._id,
        appointmentId: consultation.appointmentId,
        medications,
        diagnosis,
        instructions,
        notes,
        allowRefills,
        maxRefills
    };

    // Import prescription controller function (in real implementation)
    // For now, create prescription directly
    const prescriptionCount = await Prescription.countDocuments();
    const prescriptionNumber = `RX-${String(prescriptionCount + 1).padStart(6, '0')}`;

    const prescription = await Prescription.create({
        prescriptionNumber,
        patientId: consultation.patientId._id,
        doctorId: doctorId,
        appointmentId: consultation.appointmentId,
        consultationId: consultationId,
        medications: medications.map(med => ({
            name: med.name,
            dosage: med.dosage,
            frequency: med.frequency,
            duration: med.duration,
            instructions: med.instructions || '',
            quantity: med.quantity || 0,
            refills: med.refills || 0
        })),
        diagnosis,
        instructions: instructions || [],
        notes,
        allowRefills: allowRefills || false,
        maxRefills: maxRefills || 0,
        status: 'active',
        prescribedDate: new Date()
    });

    // Update consultation with prescription reference
    const updatedConsultation = await Consultation.findByIdAndUpdate(
        consultationId,
        {
            $set: { prescriptionId: prescription._id }
        },
        { new: true }
    );

    console.log('✅ Prescription created from consultation:', prescriptionNumber);

    return res.status(201).json(
        new ApiResponse(
            201, 
            {
                consultation: updatedConsultation,
                prescription: prescription
            }, 
            "Prescription created from consultation successfully"
        )
    );
});

/**
 * GET CONSULTATION SUMMARY
 * Get comprehensive summary of completed consultation
 * 
 * GET /api/v1/consultations/:consultationId/summary
 * Requires: verifyJWT middleware
 */
const getConsultationSummary = asyncHandler(async (req, res) => {
    const { consultationId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    console.log("📄 Fetching consultation summary:", consultationId);

    if (!consultationId) {
        throw new ApiError(400, "Consultation ID is required");
    }

    // Find consultation with all related data
    const consultation = await Consultation.findById(consultationId)
        .populate({
            path: 'patientId',
            populate: {
                path: 'userId',
                select: 'firstName lastName dateOfBirth gender phoneNumber email'
            }
        })
        .populate({
            path: 'doctorId',
            select: 'firstName lastName specialization qualification department'
        })
        .populate({
            path: 'prescriptionId',
            select: 'prescriptionNumber medications diagnosis instructions'
        })
        .populate({
            path: 'medicalRecordId',
            select: 'recordNumber diagnosis treatment clinicalNotes'
        })
        .lean();

    if (!consultation) {
        throw new ApiError(404, "Consultation not found");
    }

    // Access control
    if (userRole === 'patient') {
        const patientUser = await User.findById(userId).populate('patientId');
        if (!patientUser?.patientId || 
            consultation.patientId._id.toString() !== patientUser.patientId._id.toString()) {
            throw new ApiError(403, "Access denied. You can only view your own consultations.");
        }
    } else if (userRole === 'doctor') {
        if (consultation.doctorId._id.toString() !== userId.toString()) {
            throw new ApiError(403, "Access denied. You can only view your own consultations.");
        }
    }

    // Prepare summary data
    const summary = {
        consultationDetails: {
            number: consultation.consultationNumber,
            type: consultation.consultationType,
            status: consultation.status,
            startTime: consultation.startTime,
            endTime: consultation.endTime,
            duration: consultation.actualDuration || consultation.duration
        },
        patientInfo: {
            name: `${consultation.patientId.userId.firstName} ${consultation.patientId.userId.lastName}`,
            dateOfBirth: consultation.patientId.userId.dateOfBirth,
            gender: consultation.patientId.userId.gender
        },
        doctorInfo: {
            name: `${consultation.doctorId.firstName} ${consultation.doctorId.lastName}`,
            specialization: consultation.doctorId.specialization,
            department: consultation.doctorId.department
        },
        clinicalData: {
            symptoms: consultation.symptoms,
            diagnosis: consultation.diagnosis,
            assessment: consultation.assessment,
            plan: consultation.plan,
            vitalSigns: consultation.vitalSigns,
            clinicalNotes: consultation.clinicalNotes
        },
        outcomes: {
            prescription: consultation.prescriptionId,
            medicalRecord: consultation.medicalRecordId,
            recommendations: consultation.recommendations,
            followUpRequired: consultation.followUpRequired,
            followUpDate: consultation.followUpDate
        }
    };

    console.log('✅ Consultation summary fetched successfully:', consultation.consultationNumber);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { summary },
                "Consultation summary fetched successfully"
            )
        );
});

/**
 * GET CONSULTATION STATISTICS
 * Get consultation statistics for dashboard
 * 
 * GET /api/v1/consultations/statistics
 * Requires: verifyJWT middleware
 */
const getConsultationStatistics = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { period = 'month', patientId, doctorId } = req.query;

    console.log("📊 Fetching consultation statistics for:", userRole, userId);

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

    query.startTime = dateRange;

    // Get statistics
    const totalConsultations = await Consultation.countDocuments(query);

    const statusStats = await Consultation.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const typeStats = await Consultation.aggregate([
        { $match: query },
        { $group: { _id: '$consultationType', count: { $sum: 1 } } }
    ]);

    const durationStats = await Consultation.aggregate([
        { 
            $match: { 
                ...query, 
                actualDuration: { $exists: true, $ne: null } 
            } 
        },
        {
            $group: {
                _id: null,
                averageDuration: { $avg: '$actualDuration' },
                totalDuration: { $sum: '$actualDuration' },
                minDuration: { $min: '$actualDuration' },
                maxDuration: { $max: '$actualDuration' }
            }
        }
    ]);

    const monthlyTrend = await Consultation.aggregate([
        { $match: query },
        {
            $group: {
                _id: {
                    year: { $year: '$startTime' },
                    month: { $month: '$startTime' }
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
    ]);

    const statistics = {
        period,
        totalConsultations,
        byStatus: statusStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {}),
        byType: typeStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {}),
        duration: durationStats[0] || {
            averageDuration: 0,
            totalDuration: 0,
            minDuration: 0,
            maxDuration: 0
        },
        monthlyTrend: monthlyTrend.map(item => ({
            period: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
            count: item.count
        })),
        dateRange: {
            from: dateRange.$gte,
            to: dateRange.$lte
        }
    };

    console.log('✅ Consultation statistics fetched successfully');

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { statistics },
                "Consultation statistics fetched successfully"
            )
        );
});

// Export all consultation controller functions
export {
    initiateConsultation,
    joinConsultation,
    getConsultationById,
    getConsultations,
    updateConsultationStatus,
    addConsultationNotes,
    createPrescriptionFromConsultation,
    getConsultationSummary,
    getConsultationStatistics
};

/**
 * Additional consultation controllers that can be added:
 * - endConsultation (specific endpoint for ending)
 * - sendConsultationMessage (real-time chat)
 * - uploadConsultationFiles (reports, images)
 * - scheduleFollowUpConsultation
 * - getConsultationRecording (for video consultations)
 * - rateConsultation (patient feedback)
 * - getWaitingConsultations (for doctors)
 * - transferConsultation (to another doctor)
 */