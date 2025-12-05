/**
 * Healthcare System - Appointment Controller
 * 
 * Handles appointment scheduling, management, and tracking for healthcare system.
 * 
 * Features:
 * - Appointment scheduling and booking
 * - Appointment status management
 * - Doctor availability checking
 * - Appointment rescheduling and cancellation
 * - Reminder system integration
 * - Multi-role access (patients, doctors, admins)
 */

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Appointment } from "../models/appointment.model.js";
import { User } from "../models/User.model.js";
import { Patient } from "../models/Patient.model.js";
import { Doctor } from "../models/doctor.model.js";
import { 
    sendAppointmentConfirmation,
    sendAppointmentReminder,
    sendAppointmentCancellation,
    sendAppointmentReschedule
} from "../utils/emailUtils.js";
import { 
    sendSMSNotification,
    sendPushNotification 
} from "../utils/notificationUtils.js";

/**
 * CREATE APPOINTMENT
 * Book a new appointment with a doctor
 * 
 * POST /api/v1/appointments
 * Requires: verifyJWT middleware
 */
const createAppointment = asyncHandler(async (req, res) => {
    const {
        doctorId,
        appointmentDate,
        appointmentTime,
        type,
        reason,
        symptoms,
        priority = 'routine',
        notes
    } = req.body;

    const patientId = req.user._id;

    console.log("📅 Creating appointment for patient:", patientId, "with doctor:", doctorId);

    // 1. Validation - Check required fields
    const requiredFields = ['doctorId', 'appointmentDate', 'appointmentTime', 'type', 'reason'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
        throw new ApiError(
            400, 
            `Missing required fields: ${missingFields.join(', ')}`
        );
    }

    // 2. Validate appointment date (should not be in past)
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    const currentDateTime = new Date();

    if (appointmentDateTime <= currentDateTime) {
        throw new ApiError(400, "Appointment date and time must be in the future");
    }

    // 3. Check if doctor exists and is active
    const doctor = await User.findOne({ 
        _id: doctorId, 
        role: 'doctor', 
        isActive: true 
    });

    if (!doctor) {
        throw new ApiError(404, "Doctor not found or inactive");
    }

    // 4. Check if patient exists and get patientId
    const patientUser = await User.findById(patientId).populate('patientId');
    if (!patientUser || !patientUser.patientId) {
        throw new ApiError(404, "Patient profile not found");
    }

    // 5. Check doctor availability for the requested time slot
    const existingAppointment = await Appointment.findOne({
        doctorId,
        appointmentDate: new Date(appointmentDate),
        appointmentTime,
        status: { $in: ['scheduled', 'confirmed'] }
    });

    if (existingAppointment) {
        throw new ApiError(409, "Doctor is not available at the requested time slot");
    }

    // 6. Check if patient has conflicting appointment
    const patientConflict = await Appointment.findOne({
        patientId: patientUser.patientId._id,
        appointmentDate: new Date(appointmentDate),
        appointmentTime,
        status: { $in: ['scheduled', 'confirmed'] }
    });

    if (patientConflict) {
        throw new ApiError(409, "You already have an appointment at this time");
    }

    // 7. Validate appointment type and doctor specialization compatibility
    const validTypes = ['consultation', 'follow-up', 'checkup', 'emergency', 'surgery', 'test'];
    if (!validTypes.includes(type)) {
        throw new ApiError(400, `Invalid appointment type. Must be one of: ${validTypes.join(', ')}`);
    }

    // 8. Generate appointment number
    const appointmentCount = await Appointment.countDocuments();
    const appointmentNumber = `APT-${String(appointmentCount + 1).padStart(6, '0')}`;

    // 9. Create appointment
    const appointmentData = {
        appointmentNumber,
        patientId: patientUser.patientId._id,
        doctorId,
        appointmentDate: new Date(appointmentDate),
        appointmentTime,
        type,
        reason,
        symptoms: symptoms || [],
        priority,
        notes,
        status: 'scheduled',
        createdBy: patientId
    };

    const appointment = await Appointment.create(appointmentData);

    // 10. Populate appointment details for response
    const createdAppointment = await Appointment.findById(appointment._id)
        .populate({
            path: 'patientId',
            populate: {
                path: 'userId',
                select: 'firstName lastName email phoneNumber avatar'
            }
        })
        .populate({
            path: 'doctorId',
            select: 'firstName lastName specialization qualification department avatar'
        })
        .lean();

    // 11. Send confirmation emails (async - don't wait)
   try {
    // Send to patient
    await sendAppointmentConfirmation(patientUser.email, {
        patientName: `${patientUser.firstName} ${patientUser.lastName}`,
        doctorName: `${doctor.firstName} ${doctor.lastName}`,
        appointmentDate: appointmentDate,
        appointmentTime: appointmentTime,
        appointmentNumber: appointmentNumber,
        type: type,
        reason: reason
    });

    // Send to doctor
    await sendAppointmentConfirmation(doctor.email, {
        patientName: `${patientUser.firstName} ${patientUser.lastName}`,
        doctorName: `${doctor.firstName} ${doctor.lastName}`,
        appointmentDate: appointmentDate,
        appointmentTime: appointmentTime,
        appointmentNumber: appointmentNumber,
        type: type,
        reason: reason
    });

    } catch (emailError) {
        console.error('⚠ Email sending failed:', emailError);
        // Don't throw error - appointment was created successfully
    }

    console.log('✅ Appointment created successfully:', appointmentNumber);

    return res.status(201).json(
        new ApiResponse(
            201, 
            {
                appointment: createdAppointment,
                message: "Appointment scheduled successfully. Confirmation sent to your email."
            }, 
            "Appointment created successfully"
        )
    );
});

/**
 * GET APPOINTMENT BY ID
 * Get detailed information about a specific appointment
 * 
 * GET /api/v1/appointments/:appointmentId
 * Requires: verifyJWT middleware
 */
const getAppointmentById = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    console.log("🔍 Fetching appointment:", appointmentId);

    if (!appointmentId) {
        throw new ApiError(400, "Appointment ID is required");
    }

    // Build query based on user role
    let query = { _id: appointmentId };

    if (userRole === 'patient') {
        const patientUser = await User.findById(userId).populate('patientId');
        if (!patientUser?.patientId) {
            throw new ApiError(404, "Patient profile not found");
        }
        query.patientId = patientUser.patientId._id;
    } else if (userRole === 'doctor') {
        query.doctorId = userId;
    }
    // Admin can access all appointments without additional filters

    const appointment = await Appointment.findOne(query)
        .populate({
            path: 'patientId',
            populate: {
                path: 'userId',
                select: 'firstName lastName email phoneNumber dateOfBirth gender bloodGroup'
            }
        })
        .populate({
            path: 'doctorId',
            select: 'firstName lastName specialization qualification department experience consultationFee avatar'
        })
        .populate('medicalRecordId')
        .populate('prescriptionId')
        .lean();

    if (!appointment) {
        throw new ApiError(404, "Appointment not found");
    }

    console.log('✅ Appointment fetched successfully:', appointment.appointmentNumber);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { appointment },
                "Appointment fetched successfully"
            )
        );
});

/**
 * GET APPOINTMENTS WITH FILTERS
 * Get appointments with filtering, pagination, and sorting
 * 
 * GET /api/v1/appointments
 * Requires: verifyJWT middleware
 */
const getAppointments = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;
    const {
        status,
        type,
        dateFrom,
        dateTo,
        doctorId,
        patientId,
        priority,
        page = 1,
        limit = 10,
        sortBy = 'appointmentDate',
        sortOrder = 'desc'
    } = req.query;

    console.log("📋 Fetching appointments for:", userRole, userId);

    // Build query based on user role and filters
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
    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (doctorId) query.doctorId = doctorId;
    if (patientId) query.patientId = patientId;

    // Date range filter
    if (dateFrom || dateTo) {
        query.appointmentDate = {};
        if (dateFrom) query.appointmentDate.$gte = new Date(dateFrom);
        if (dateTo) query.appointmentDate.$lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const appointments = await Appointment.find(query)
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

    const total = await Appointment.countDocuments(query);

    console.log(`✅ Found ${appointments.length} appointments`);

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
                "Appointments fetched successfully"
            )
        );
});

/**
 * UPDATE APPOINTMENT STATUS
 * Update appointment status (confirm, cancel, complete, etc.)
 * 
 * PATCH /api/v1/appointments/:appointmentId/status
 * Requires: verifyJWT middleware
 */
const updateAppointmentStatus = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;
    const { status, cancellationReason, notes } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    console.log("🔄 Updating appointment status:", appointmentId, "to:", status);

    if (!appointmentId || !status) {
        throw new ApiError(400, "Appointment ID and status are required");
    }

    // Validate status
    const validStatuses = ['scheduled', 'confirmed', 'cancelled', 'completed', 'no-show', 'rescheduled'];
    if (!validStatuses.includes(status)) {
        throw new ApiError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Find appointment
    const appointment = await Appointment.findById(appointmentId)
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

    if (!appointment) {
        throw new ApiError(404, "Appointment not found");
    }

    // Check permissions
    if (userRole === 'patient' && appointment.patientId.userId._id.toString() !== userId.toString()) {
        throw new ApiError(403, "Access denied. You can only update your own appointments.");
    }

    if (userRole === 'doctor' && appointment.doctorId._id.toString() !== userId.toString()) {
        throw new ApiError(403, "Access denied. You can only update your own appointments.");
    }

    // Status transition validation
    const currentStatus = appointment.status;
    const allowedTransitions = {
        'scheduled': ['confirmed', 'cancelled'],
        'confirmed': ['completed', 'cancelled', 'no-show'],
        'completed': [], // No transitions from completed
        'cancelled': [], // No transitions from cancelled
        'no-show': ['rescheduled'],
        'rescheduled': ['scheduled', 'confirmed']
    };

    if (!allowedTransitions[currentStatus]?.includes(status)) {
        throw new ApiError(400, `Cannot change status from ${currentStatus} to ${status}`);
    }

    // Cancellation requires reason
    if (status === 'cancelled' && !cancellationReason) {
        throw new ApiError(400, "Cancellation reason is required when cancelling an appointment");
    }

    // Update appointment
    const updateData = { 
        status,
        updatedBy: userId
    };

    if (cancellationReason) {
        updateData.cancellationReason = cancellationReason;
        updateData.cancelledBy = userId;
        updateData.cancelledAt = new Date();
    }

    if (notes) {
        updateData.notes = notes;
    }

    if (status === 'completed') {
        updateData.completedAt = new Date();
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
        appointmentId,
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
        select: 'firstName lastName email phoneNumber specialization'
    });

    // Send notifications based on status change
    try {
        if (status === 'cancelled') {
            await sendAppointmentCancellation(
                appointment.patientId.userId.email,
                {
                    patientName: `${appointment.patientId.userId.firstName} ${appointment.patientId.userId.lastName}`,
                    doctorName: `${appointment.doctorId.firstName} ${appointment.doctorId.lastName}`,
                    appointmentDate: appointment.appointmentDate,
                    appointmentTime: appointment.appointmentTime,
                    appointmentNumber: appointment.appointmentNumber,
                    cancellationReason

                }
            );
        } else if (status === 'confirmed') {
            await sendAppointmentConfirmation(
                appointment.patientId.userId.email,
                {
                    patientName: `${appointment.patientId.userId.firstName} ${appointment.patientId.userId.lastName}`,
                    doctorName: `${appointment.doctorId.firstName} ${appointment.doctorId.lastName}`,
                    appointmentDate: appointment.appointmentDate,
                    appointmentTime: appointment.appointmentTime,
                    appointmentNumber: appointment.appointmentNumber
                }
            );
        }
    } catch (notificationError) {
        console.error('⚠ Notification sending failed:', notificationError);
    }

    console.log('✅ Appointment status updated:', appointment.appointmentNumber, '->', status);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { appointment: updatedAppointment },
                `Appointment ${status} successfully`
            )
        );
});

/**
 * RESCHEDULE APPOINTMENT
 * Reschedule an existing appointment to new date/time
 * 
 * PATCH /api/v1/appointments/:appointmentId/reschedule
 * Requires: verifyJWT middleware
 */
const rescheduleAppointment = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;
    const { newAppointmentDate, newAppointmentTime, reason } = req.body;
    const userId = req.user._id;

    console.log("🕐 Rescheduling appointment:", appointmentId);

    if (!appointmentId || !newAppointmentDate || !newAppointmentTime) {
        throw new ApiError(400, "Appointment ID, new date, and new time are required");
    }

    // Find appointment
    const appointment = await Appointment.findById(appointmentId)
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

    if (!appointment) {
        throw new ApiError(404, "Appointment not found");
    }

    // Check permissions
    const isPatient = appointment.patientId.userId._id.toString() === userId.toString();
    const isDoctor = appointment.doctorId._id.toString() === userId.toString();
    
    if (!isPatient && !isDoctor) {
        throw new ApiError(403, "Access denied. You can only reschedule your own appointments.");
    }

    // Check if appointment can be rescheduled
    if (!['scheduled', 'confirmed', 'no-show'].includes(appointment.status)) {
        throw new ApiError(400, `Cannot reschedule appointment with status: ${appointment.status}`);
    }

    // Validate new date/time
    const newAppointmentDateTime = new Date(`${newAppointmentDate}T${newAppointmentTime}`);
    const currentDateTime = new Date();

    if (newAppointmentDateTime <= currentDateTime) {
        throw new ApiError(400, "New appointment date and time must be in the future");
    }

    // Check doctor availability for new time slot
    const conflictingAppointment = await Appointment.findOne({
        doctorId: appointment.doctorId._id,
        appointmentDate: new Date(newAppointmentDate),
        appointmentTime: newAppointmentTime,
        status: { $in: ['scheduled', 'confirmed'] },
        _id: { $ne: appointmentId }
    });

    if (conflictingAppointment) {
        throw new ApiError(409, "Doctor is not available at the requested time slot");
    }

    // Check patient availability for new time slot
    const patientConflict = await Appointment.findOne({
        patientId: appointment.patientId._id,
        appointmentDate: new Date(newAppointmentDate),
        appointmentTime: newAppointmentTime,
        status: { $in: ['scheduled', 'confirmed'] },
        _id: { $ne: appointmentId }
    });

    if (patientConflict) {
        throw new ApiError(409, "You already have an appointment at this time");
    }

    // Store old appointment details for notification
    const oldAppointmentDate = appointment.appointmentDate;
    const oldAppointmentTime = appointment.appointmentTime;

    // Update appointment
    const updatedAppointment = await Appointment.findByIdAndUpdate(
        appointmentId,
        {
            $set: {
                appointmentDate: new Date(newAppointmentDate),
                appointmentTime: newAppointmentTime,
                status: 'rescheduled',
                previousAppointment: {
                    appointmentDate: oldAppointmentDate,
                    appointmentTime: oldAppointmentTime,
                    rescheduledAt: new Date(),
                    rescheduledBy: userId,
                    rescheduleReason: reason
                },
                updatedBy: userId
            }
        },
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
        select: 'firstName lastName email phoneNumber specialization'
    });

    // Send reschedule notifications
    try {
        await sendAppointmentReschedule(
            appointment.patientId.userId.email,
            {
                patientName: `${appointment.patientId.userId.firstName} ${appointment.patientId.userId.lastName}`,
                doctorName: `${appointment.doctorId.firstName} ${appointment.doctorId.lastName}`,
                oldAppointmentDate: oldAppointmentDate,
                oldAppointmentTime: oldAppointmentTime,
                newAppointmentDate: newAppointmentDate,
                newAppointmentTime: newAppointmentTime,
                appointmentNumber: appointment.appointmentNumber,
                reason: reason
            }
        );

        // Also notify doctor
        await sendAppointmentReschedule(
            appointment.doctorId.email,
            {
                patientName: `${appointment.patientId.userId.firstName} ${appointment.patientId.userId.lastName}`,
                doctorName: `${appointment.doctorId.firstName} ${appointment.doctorId.lastName}`,
                oldAppointmentDate: oldAppointmentDate,
                oldAppointmentTime: oldAppointmentTime,
                newAppointmentDate: newAppointmentDate,
                newAppointmentTime: newAppointmentTime,
                appointmentNumber: appointment.appointmentNumber,
                reason: reason
            }
        );
    } catch (notificationError) {
        console.error('⚠ Reschedule notification failed:', notificationError);
    }

    console.log('✅ Appointment rescheduled successfully:', appointment.appointmentNumber);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { appointment: updatedAppointment },
                "Appointment rescheduled successfully"
            )
        );
});

/**
 * GET DOCTOR AVAILABILITY
 * Check available time slots for a doctor on specific date
 * 
 * GET /api/v1/appointments/availability/:doctorId
 * Requires: verifyJWT middleware (optional)
 */
const getDoctorAvailability = asyncHandler(async (req, res) => {
    const { doctorId } = req.params;
    const { date } = req.query;

    console.log("📅 Checking availability for doctor:", doctorId, "on:", date);

    if (!doctorId || !date) {
        throw new ApiError(400, "Doctor ID and date are required");
    }

    // Validate date
    const requestedDate = new Date(date);
    if (isNaN(requestedDate.getTime())) {
        throw new ApiError(400, "Invalid date format");
    }

    // Check if doctor exists and is active
    const doctor = await User.findOne({ 
        _id: doctorId, 
        role: 'doctor', 
        isActive: true 
    });

    if (!doctor) {
        throw new ApiError(404, "Doctor not found or inactive");
    }

    // Get doctor's working hours (in real system, this would come from doctor profile)
    const workingHours = {
        start: '09:00',
        end: '17:00',
        breakStart: '13:00',
        breakEnd: '14:00'
    };

    // Get existing appointments for the doctor on requested date
    const existingAppointments = await Appointment.find({
        doctorId,
        appointmentDate: requestedDate,
        status: { $in: ['scheduled', 'confirmed'] }
    }).select('appointmentTime');

    const bookedSlots = existingAppointments.map(apt => apt.appointmentTime);

    // Generate available time slots (30-minute intervals)
    const availableSlots = [];
    const startTime = new Date(`${date}T${workingHours.start}`);
    const endTime = new Date(`${date}T${workingHours.end}`);
    const breakStart = new Date(`${date}T${workingHours.breakStart}`);
    const breakEnd = new Date(`${date}T${workingHours.breakEnd}`);


    let currentTime = new Date(startTime);

    while (currentTime < endTime) {
        // Skip break time
        if (currentTime >= breakStart && currentTime < breakEnd) {
            currentTime.setMinutes(currentTime.getMinutes() + 30);
            continue;
        }

        const timeString = currentTime.toTimeString().slice(0, 5);
        
        if (!bookedSlots.includes(timeString)) {
            availableSlots.push({
                time: timeString,
                available: true
            });
        } else {
            availableSlots.push({
                time: timeString,
                available: false,
                booked: true
            });
        }

        currentTime.setMinutes(currentTime.getMinutes() + 30);
    }

    console.log(`✅ Found ${availableSlots.filter(slot => slot.available).length} available slots`);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    doctor: {
                        id: doctor._id,
                        name: `${doctor.firstName} ${doctor.lastName}`,
                        specialization: doctor.specialization
                    },
                    date: requestedDate,
                    workingHours,
                    availableSlots,
                    totalAvailable: availableSlots.filter(slot => slot.available).length
                },
                "Doctor availability fetched successfully"
            )
        );
});

/**
 * GET APPOINTMENT STATISTICS
 * Get appointment statistics for dashboard (admin/doctor)
 * 
 * GET /api/v1/appointments/statistics
 * Requires: verifyJWT middleware
 */
const getAppointmentStatistics = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { period = 'month' } = req.query; // day, week, month, year

    console.log("📊 Fetching appointment statistics for:", userRole, userId);

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

    // Get statistics
    const totalAppointments = await Appointment.countDocuments({
        ...query,
        appointmentDate: dateRange
    });

    const statusStats = await Appointment.aggregate([
        {
            $match: {
                ...query,
                appointmentDate: dateRange
            }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    const typeStats = await Appointment.aggregate([
        {
            $match: {
                ...query,
                appointmentDate: dateRange
            }
        },
        {
            $group: {
                _id: '$type',
                count: { $sum: 1 }
            }
        }
    ]);

    // Convert aggregation results to objects
    const statusStatistics = {};
    statusStats.forEach(stat => {
        statusStatistics[stat._id] = stat.count;
    });

    const typeStatistics = {};
    typeStats.forEach(stat => {
        typeStatistics[stat._id] = stat.count;
    });

    // Get upcoming appointments count
    const upcomingAppointments = await Appointment.countDocuments({
        ...query,
        appointmentDate: { $gte: new Date() },
        status: { $in: ['scheduled', 'confirmed'] }
    });

    const statistics = {
        period,
        total: totalAppointments,
        upcoming: upcomingAppointments,
        byStatus: statusStatistics,
        byType: typeStatistics,
        dateRange: {
            from: dateRange.$gte,
            to: dateRange.$lte
        }
    };

    console.log('✅ Appointment statistics fetched successfully');

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { statistics },
                "Appointment statistics fetched successfully"
            )
        );
});

/**
 * ADD APPOINTMENT NOTES
 * Add clinical notes to an appointment (doctor only)
 * 
 * PATCH /api/v1/appointments/:appointmentId/notes
 * Requires: verifyJWT middleware, doctor role
 */
const addAppointmentNotes = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;
    const { clinicalNotes, followUpRequired, followUpDate, recommendations } = req.body;
    const userId = req.user._id;

    console.log("📝 Adding notes to appointment:", appointmentId);

    if (!appointmentId || !clinicalNotes) {
        throw new ApiError(400, "Appointment ID and clinical notes are required");
    }

    // Find appointment and verify doctor ownership
    const appointment = await Appointment.findOne({
        _id: appointmentId,
        doctorId: userId
    });

    if (!appointment) {
        throw new ApiError(404, "Appointment not found or access denied");
    }

    // Update appointment with notes
    const updatedAppointment = await Appointment.findByIdAndUpdate(
        appointmentId,
        {
            $set: {
                clinicalNotes,
                followUpRequired: followUpRequired || false,
                followUpDate: followUpDate ? new Date(followUpDate) : undefined,
                recommendations: recommendations || [],
                updatedBy: userId,
                notesAddedAt: new Date()
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
    });

    console.log('✅ Clinical notes added to appointment:', appointment.appointmentNumber);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { appointment: updatedAppointment },
                "Clinical notes added successfully"
            )
        );
});

// Export all appointment controller functions
export {
    createAppointment,
    getAppointmentById,
    getAppointments,
    updateAppointmentStatus,
    rescheduleAppointment,
    getDoctorAvailability,
    getAppointmentStatistics,
    addAppointmentNotes
};

/**
 * Additional appointment controllers that can be added:
 * - cancelAppointment (specific cancellation endpoint)
 * - getUpcomingAppointments
 * - getAppointmentHistory
 * - bulkUpdateAppointments (for admin)
 * - sendAppointmentReminders (cron job trigger)
 * - getAppointmentCalendar (calendar view)
 * - assignAppointmentToDoctor (admin function)
 * - getWaitlistAppointments
 **/