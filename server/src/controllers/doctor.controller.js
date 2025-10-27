/**
 * Healthcare System - Doctor Controller
 * 
 * Handles doctor-specific operations in the healthcare consultation system.
 * 
 * Features:
 * - Doctor profile management
 * - Appointment management
 * - Patient management
 * - Schedule and availability
 * - Prescription management
 * - Medical records access
 */

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Doctor } from "../models/doctor.model.js";
import { Patient } from "../models/patient.model.js";
import { Appointment } from "../models/appointment.model.js";
import { Prescription } from "../models/prescription.model.js";
import { MedicalRecord } from "../models/medicalRecord.model.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

/**
 * GET DOCTOR PROFILE
 * Get complete doctor profile with professional information
 * 
 * GET /api/v1/doctors/profile
 * Requires: verifyJWT middleware, doctor role
 */
const getDoctorProfile = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    console.log("📋 Fetching doctor profile for user:", userId);

    // Get user with doctor population and professional details
    const user = await User.findById(userId)
        .select("-password -refreshToken")
        .populate({
            path: 'doctorId',
            populate: [
                { path: 'specialties' },
                { path: 'educations' },
                { path: 'experiences' },
                { path: 'certifications' },
                { path: 'schedules' }
            ]
        })
        .lean();

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (!user.doctorId) {
        throw new ApiError(404, "Doctor profile not found");
    }

    console.log('✅ Doctor profile fetched successfully:', user.doctorId.medicalLicense);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    user: user,
                    doctor: user.doctorId
                },
                "Doctor profile fetched successfully"
            )
        );
});

/**
 * UPDATE DOCTOR PROFILE
 * Update doctor's professional information and schedule
 * 
 * PATCH /api/v1/doctors/profile
 * Requires: verifyJWT middleware, doctor role
 */
const updateDoctorProfile = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const {
        // Professional information
        specialization,
        qualifications,
        department,
        experience,
        consultationFee,
        bio,
        // Contact information
        officePhone,
        emergencyContact,
        // Schedule and availability
        workingHours,
        availableDays,
        breakTimes,
        // Professional details
        awards,
        publications,
        languages,
        // Service information
        servicesOffered,
        treatmentApproach
    } = req.body;

    console.log("✏️ Updating doctor profile for user:", userId);

    // Get user to access doctorId
    const user = await User.findById(userId);
    if (!user || !user.doctorId) {
        throw new ApiError(404, "Doctor profile not found");
    }

    // Build update object for doctor
    const doctorUpdateData = {};
    
    // Professional information
    if (specialization) doctorUpdateData.specialization = specialization;
    if (qualifications) doctorUpdateData.qualifications = qualifications;
    if (department) doctorUpdateData.department = department;
    if (experience) doctorUpdateData.experience = experience;
    if (consultationFee) doctorUpdateData.consultationFee = consultationFee;
    if (bio) doctorUpdateData.bio = bio;
    
    // Contact information
    if (officePhone) doctorUpdateData.officePhone = officePhone;
    if (emergencyContact) doctorUpdateData.emergencyContact = emergencyContact;
    
    // Schedule and availability
    if (workingHours) doctorUpdateData.workingHours = workingHours;
    if (availableDays) doctorUpdateData.availableDays = availableDays;
    if (breakTimes) doctorUpdateData.breakTimes = breakTimes;
    
    // Professional details
    if (awards) doctorUpdateData.awards = awards;
    if (publications) doctorUpdateData.publications = publications;
    if (languages) doctorUpdateData.languages = languages;
    
    // Service information
    if (servicesOffered) doctorUpdateData.servicesOffered = servicesOffered;
    if (treatmentApproach) doctorUpdateData.treatmentApproach = treatmentApproach;

    if (Object.keys(doctorUpdateData).length === 0) {
        throw new ApiError(400, "At least one field is required to update");
    }

    // Update doctor profile
    const updatedDoctor = await Doctor.findByIdAndUpdate(
        user.doctorId,
        { $set: doctorUpdateData },
        { new: true, runValidators: true }
    ).populate('specialties educations experiences certifications schedules');

    console.log('✅ Doctor profile updated successfully:', updatedDoctor.medicalLicense);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    doctor: updatedDoctor
                },
                "Doctor profile updated successfully"
            )
        );
});

/**
 * GET DOCTOR APPOINTMENTS
 * Get all appointments for the doctor with filtering and pagination
 * 
 * GET /api/v1/doctors/appointments
 * Requires: verifyJWT middleware, doctor role
 */
const getDoctorAppointments = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { 
        status, 
        type, 
        dateFrom, 
        dateTo, 
        page = 1, 
        limit = 10 
    } = req.query;

    console.log("📅 Fetching appointments for doctor:", userId);

    // Get user to access doctorId
    const user = await User.findById(userId);
    if (!user || !user.doctorId) {
        throw new ApiError(404, "Doctor profile not found");
    }

    // Build query for appointments
    const query = { doctorId: userId };
    
    if (status) query.status = status;
    if (type) query.type = type;
    
    // Date range filter
    if (dateFrom || dateTo) {
        query.appointmentDate = {};
        if (dateFrom) query.appointmentDate.$gte = new Date(dateFrom);
        if (dateTo) query.appointmentDate.$lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;

    // Get appointments with patient population
    const appointments = await Appointment.find(query)
        .populate({
            path: 'patientId',
            populate: {
                path: 'userId',
                select: 'firstName lastName phoneNumber dateOfBirth gender bloodGroup avatar'
            }
        })
        .populate({
            path: 'medicalRecordId',
            select: 'recordType diagnosis'
        })
        .sort({ appointmentDate: 1, appointmentTime: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

    const total = await Appointment.countDocuments(query);

    console.log(`✅ Found ${appointments.length} appointments for doctor`);

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
                "Doctor appointments fetched successfully"
            )
        );
});

/**
 * GET TODAY'S APPOINTMENTS
 * Get today's appointments for the doctor
 * 
 * GET /api/v1/doctors/appointments/today
 * Requires: verifyJWT middleware, doctor role
 */
const getTodaysAppointments = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { status = 'scheduled,confirmed', page = 1, limit = 20 } = req.query;

    console.log("📅 Fetching today's appointments for doctor:", userId);

    // Get user to access doctorId
    const user = await User.findById(userId);
    if (!user || !user.doctorId) {
        throw new ApiError(404, "Doctor profile not found");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const statusArray = status.split(',');

    const query = {
        doctorId: userId,
        appointmentDate: {
            $gte: today,
            $lt: tomorrow
        },
        status: { $in: statusArray }
    };

    const skip = (page - 1) * limit;

    const appointments = await Appointment.find(query)
        .populate({
            path: 'patientId',
            populate: {
                path: 'userId',
                select: 'firstName lastName phoneNumber dateOfBirth gender bloodGroup avatar'
            }
        })
        .sort({ appointmentTime: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

    const total = await Appointment.countDocuments(query);

    // Group appointments by status for quick overview
    const statusCounts = await Appointment.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const statusSummary = {};
    statusCounts.forEach(item => {
        statusSummary[item._id] = item.count;
    });

    console.log(`✅ Found ${appointments.length} appointments for today`);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    date: today,
                    appointments,
                    summary: statusSummary,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(total / limit),
                        totalAppointments: total,
                        hasNextPage: page * limit < total
                    }
                },
                "Today's appointments fetched successfully"
            )
        );
});

/**
 * GET DOCTOR'S PATIENTS
 * Get list of patients who have appointments with the doctor
 * 
 * GET /api/v1/doctors/patients
 * Requires: verifyJWT middleware, doctor role
 */
const getDoctorsPatients = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { 
        search,
        page = 1, 
        limit = 10 
    } = req.query;

    console.log("👥 Fetching patients for doctor:", userId);

    // Get user to access doctorId
    const user = await User.findById(userId);
    if (!user || !user.doctorId) {
        throw new ApiError(404, "Doctor profile not found");
    }

    // Get unique patient IDs from appointments
    const patientAppointments = await Appointment.aggregate([
        {
            $match: { doctorId: userId }
        },
        {
            $group: {
                _id: '$patientId',
                lastAppointment: { $max: '$appointmentDate' },
                totalAppointments: { $sum: 1 },
                completedAppointments: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                }
            }
        },
        {
            $sort: { lastAppointment: -1 }
        },
        {
            $skip: (parseInt(page) - 1) * parseInt(limit)
        },
        {
            $limit: parseInt(limit)
        }
    ]);

    // Get patient details
    const patientIds = patientAppointments.map(pa => pa._id);
    
    const patients = await Patient.find({ _id: { $in: patientIds } })
        .populate({
            path: 'userId',
            select: 'firstName lastName email phoneNumber dateOfBirth gender avatar'
        })
        .select('bloodGroup height weight allergies currentMedications chronicConditions')
        .lean();

    // Combine appointment stats with patient details
    const patientsWithStats = patients.map(patient => {
        const appointmentStats = patientAppointments.find(
            pa => pa._id.toString() === patient._id.toString()
        );
        
        return {
            ...patient,
            appointmentStats: {
                lastAppointment: appointmentStats?.lastAppointment,
                totalAppointments: appointmentStats?.totalAppointments || 0,
                completedAppointments: appointmentStats?.completedAppointments || 0
            }
        };
    });

    const totalPatients = await Appointment.distinct('patientId', { doctorId: userId });

    console.log(`✅ Found ${patientsWithStats.length} patients for doctor`);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    patients: patientsWithStats,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(totalPatients.length / limit),
                        totalPatients: totalPatients.length,
                        hasNextPage: page * limit < totalPatients.length
                    }
                },
                "Doctor's patients fetched successfully"
            )
        );
});

/**
 * GET PATIENT MEDICAL HISTORY
 * Get complete medical history of a specific patient
 * 
 * GET /api/v1/doctors/patients/:patientId/medical-history
 * Requires: verifyJWT middleware, doctor role
 */
const getPatientMedicalHistory = asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const userId = req.user._id;
    const { 
        recordType, 
        dateFrom, 
        dateTo, 
        page = 1, 
        limit = 10 
    } = req.query;

    console.log("🏥 Fetching medical history for patient:", patientId, "by doctor:", userId);

    if (!patientId) {
        throw new ApiError(400, "Patient ID is required");
    }

    // Verify that doctor has relationship with this patient (has appointments)
    const hasRelationship = await Appointment.findOne({
        doctorId: userId,
        patientId: patientId
    });

    if (!hasRelationship) {
        throw new ApiError(403, "Access denied. No appointment history with this patient.");
    }

    // Build query for medical records
    const query = { patientId };
    
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

    // Get patient basic information
    const patient = await Patient.findById(patientId)
        .populate({
            path: 'userId',
            select: 'firstName lastName dateOfBirth gender phoneNumber'
        })
        .select('bloodGroup height weight allergies currentMedications chronicConditions surgicalHistory familyMedicalHistory')
        .lean();

    const totalRecords = await MedicalRecord.countDocuments(query);

    console.log(`✅ Found ${medicalRecords.length} medical records for patient`);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    patient,
                    medicalRecords,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(totalRecords / limit),
                        totalRecords: totalRecords,
                        hasNextPage: page * limit < totalRecords
                    }
                },
                "Patient medical history fetched successfully"
            )
        );
});

/**
 * CREATE PRESCRIPTION
 * Create a new prescription for a patient
 * 
 * POST /api/v1/doctors/prescriptions
 * Requires: verifyJWT middleware, doctor role
 */
const createPrescription = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const {
        patientId,
        appointmentId,
        medications,
        diagnosis,
        instructions,
        followUpDate,
        testsRecommended,
        notes
    } = req.body;

    console.log("💊 Creating prescription for patient:", patientId, "by doctor:", userId);

    // Validation
    const requiredFields = ['patientId', 'medications', 'diagnosis'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
        throw new ApiError(400, `Missing required fields: ${missingFields.join(', ')}`);
    }

    if (!medications || medications.length === 0) {
        throw new ApiError(400, "At least one medication is required");
    }

    // Verify that doctor has relationship with this patient
    const hasRelationship = await Appointment.findOne({
        doctorId: userId,
        patientId: patientId,
        ...(appointmentId && { _id: appointmentId })
    });

    if (!hasRelationship) {
        throw new ApiError(403, "Access denied. No appointment history with this patient.");
    }

    // Generate prescription number
    const prescriptionCount = await Prescription.countDocuments();
    const prescriptionNumber = `RX-${String(prescriptionCount + 1).padStart(6, '0')}`;

    // Create prescription
    const prescriptionData = {
        prescriptionNumber,
        patientId,
        doctorId: userId,
        appointmentId: appointmentId || null,
        medications: medications.map(med => ({
            name: med.name,
            dosage: med.dosage,
            frequency: med.frequency,
            duration: med.duration,
            instructions: med.instructions,
            ...(med.beforeMeal && { beforeMeal: med.beforeMeal }),
            ...(med.afterMeal && { afterMeal: med.afterMeal })
        })),
        diagnosis,
        instructions: instructions || [],
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        testsRecommended: testsRecommended || [],
        notes,
        status: 'active',
        prescribedDate: new Date()
    };

    const prescription = await Prescription.create(prescriptionData);

    // Populate prescription for response
    const createdPrescription = await Prescription.findById(prescription._id)
        .populate({
            path: 'patientId',
            populate: {
                path: 'userId',
                select: 'firstName lastName phoneNumber dateOfBirth gender'
            }
        })
        .populate({
            path: 'doctorId',
            select: 'firstName lastName specialization qualification medicalLicense'
        })
        .populate({
            path: 'appointmentId',
            select: 'appointmentDate type'
        })
        .lean();

    // Update appointment with prescription reference if appointmentId provided
    if (appointmentId) {
        await Appointment.findByIdAndUpdate(appointmentId, {
            $set: { prescriptionId: prescription._id }
        });
    }

    console.log('✅ Prescription created successfully:', prescriptionNumber);

    return res.status(201).json(
        new ApiResponse(
            201, 
            {
                prescription: createdPrescription
            }, 
            "Prescription created successfully"
        )
    );
});

/**
 * UPDATE DOCTOR AVAILABILITY
 * Update doctor's working schedule and availability
 * 
 * PATCH /api/v1/doctors/availability
 * Requires: verifyJWT middleware, doctor role
 */
const updateDoctorAvailability = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const {
        workingHours,
        availableDays,
        breakTimes,
        isAvailable,
        unavailableUntil,
        reason
    } = req.body;

    console.log("🕐 Updating availability for doctor:", userId);

    // Get user to access doctorId
    const user = await User.findById(userId);
    if (!user || !user.doctorId) {
        throw new ApiError(404, "Doctor profile not found");
    }

    const updateData = {};

    if (workingHours) updateData.workingHours = workingHours;
    if (availableDays) updateData.availableDays = availableDays;
    if (breakTimes) updateData.breakTimes = breakTimes;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
    if (unavailableUntil) updateData.unavailableUntil = new Date(unavailableUntil);
    if (reason) updateData.unavailabilityReason = reason;

    if (Object.keys(updateData).length === 0) {
        throw new ApiError(400, "At least one field is required to update");
    }

    // Update doctor availability
    const updatedDoctor = await Doctor.findByIdAndUpdate(
        user.doctorId,
        { $set: updateData },
        { new: true, runValidators: true }
    ).select('workingHours availableDays breakTimes isAvailable unavailableUntil unavailabilityReason');

    console.log('✅ Doctor availability updated successfully');

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    availability: updatedDoctor
                },
                "Doctor availability updated successfully"
            )
        );
});

/**
 * GET DOCTOR DASHBOARD
 * Get comprehensive dashboard data for doctor
 * 
 * GET /api/v1/doctors/dashboard
 * Requires: verifyJWT middleware, doctor role
 */
const getDoctorDashboard = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    console.log("📊 Fetching dashboard data for doctor:", userId);

    // Get user to access doctorId
    const user = await User.findById(userId);
    if (!user || !user.doctorId) {
        throw new ApiError(404, "Doctor profile not found");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's appointments
    const todaysAppointments = await Appointment.find({
        doctorId: userId,
        appointmentDate: {
            $gte: today,
            $lt: tomorrow
        }
    })
    .populate({
        path: 'patientId',
        populate: {
            path: 'userId',
            select: 'firstName lastName avatar'
        }
    })
    .sort({ appointmentTime: 1 })
    .limit(10)
    .lean();

    // Get appointment statistics
    const appointmentStats = await Appointment.aggregate([
        {
            $match: { 
                doctorId: userId,
                appointmentDate: { $gte: new Date(today.getFullYear(), today.getMonth(), 1) }
            }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    // Get patient statistics
    const totalPatients = await Appointment.distinct('patientId', { doctorId: userId });
    
    const newPatientsThisMonth = await Appointment.aggregate([
        {
            $match: { 
                doctorId: userId,
                appointmentDate: { $gte: new Date(today.getFullYear(), today.getMonth(), 1) }
            }
        },
        {
            $group: {
                _id: '$patientId',
                firstAppointment: { $min: '$appointmentDate' }
            }
        },
        {
            $match: {
                firstAppointment: { $gte: new Date(today.getFullYear(), today.getMonth(), 1) }
            }
        },
        {
            $count: 'newPatients'
        }
    ]);

    // Get recent prescriptions
    const recentPrescriptions = await Prescription.find({ 
        doctorId: userId 
    })
    .populate({
        path: 'patientId',
        populate: {
            path: 'userId',
            select: 'firstName lastName'
        }
    })
    .sort({ prescribedDate: -1 })
    .limit(5)
    .lean();

    // Convert appointment stats to object
    const stats = {};
    appointmentStats.forEach(stat => {
        stats[stat._id] = stat.count;
    });

    const dashboardData = {
        doctorInfo: {
            name: `${user.firstName} ${user.lastName}`,
            specialization: user.specialization,
            department: user.department
        },
        todaysSchedule: {
            appointments: todaysAppointments,
            total: todaysAppointments.length
        },
        statistics: {
            appointments: {
                total: Object.values(stats).reduce((sum, count) => sum + count, 0),
                byStatus: stats
            },
            patients: {
                total: totalPatients.length,
                newThisMonth: newPatientsThisMonth[0]?.newPatients || 0
            }
        },
        recentActivity: {
            prescriptions: recentPrescriptions
        },
        quickActions: {
            canCreatePrescription: true,
            canViewSchedule: true,
            canUpdateAvailability: true
        }
    };

    console.log('✅ Doctor dashboard data fetched successfully');

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                dashboardData,
                "Doctor dashboard data fetched successfully"
            )
        );
});

/**
 * ADD MEDICAL RECORD
 * Add medical record for a patient after consultation
 * 
 * POST /api/v1/doctors/medical-records
 * Requires: verifyJWT middleware, doctor role
 */
const addMedicalRecord = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const {
        patientId,
        appointmentId,
        recordType,
        diagnosis,
        symptoms,
        treatment,
        medicationsPrescribed,
        vitalSigns,
        notes,
        followUpRequired,
        followUpDate
    } = req.body;

    console.log("🏥 Adding medical record for patient:", patientId, "by doctor:", userId);

    // Validation
    const requiredFields = ['patientId', 'recordType', 'diagnosis'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
        throw new ApiError(400, `Missing required fields: ${missingFields.join(', ')}`);
    }

    // Verify that doctor has relationship with this patient
    const hasRelationship = await Appointment.findOne({
        doctorId: userId,
        patientId: patientId,
        ...(appointmentId && { _id: appointmentId })
    });

    if (!hasRelationship) {
        throw new ApiError(403, "Access denied. No appointment history with this patient.");
    }

    // Generate medical record number
    const recordCount = await MedicalRecord.countDocuments();
    const recordNumber = `MR-${String(recordCount + 1).padStart(6, '0')}`;

    // Create medical record
    const medicalRecordData = {
        recordNumber,
        patientId,
        doctorId: userId,
        appointmentId: appointmentId || null,
        recordType,
        diagnosis,
        symptoms: symptoms || [],
        treatment: treatment || [],
        medicationsPrescribed: medicationsPrescribed || [],
        vitalSigns: vitalSigns || {},
        notes,
        followUpRequired: followUpRequired || false,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        recordDate: new Date()
    };

    const medicalRecord = await MedicalRecord.create(medicalRecordData);

    // Populate medical record for response
    const createdRecord = await MedicalRecord.findById(medicalRecord._id)
        .populate({
            path: 'patientId',
            populate: {
                path: 'userId',
                select: 'firstName lastName dateOfBirth gender'
            }
        })
        .populate({
            path: 'doctorId',
            select: 'firstName lastName specialization'
        })
        .lean();

    // Update appointment with medical record reference if appointmentId provided
    if (appointmentId) {
        await Appointment.findByIdAndUpdate(appointmentId, {
            $set: { medicalRecordId: medicalRecord._id }
        });
    }

    console.log('✅ Medical record created successfully:', recordNumber);

    return res.status(201).json(
        new ApiResponse(
            201, 
            {
                medicalRecord: createdRecord
            }, 
            "Medical record created successfully"
        )
    );
});

// Export all doctor controller functions
export {
    getDoctorProfile,
    updateDoctorProfile,
    getDoctorAppointments,
    getTodaysAppointments,
    getDoctorsPatients,
    getPatientMedicalHistory,
    createPrescription,
    updateDoctorAvailability,
    getDoctorDashboard,
    addMedicalRecord
};

/**
 * Additional doctor controllers that can be added:
 * - getDoctorSchedule (detailed schedule view)
 * - updateAppointmentNotes (add clinical notes)
 * - getPrescriptionHistory
 * - bulkUpdateAppointments
 * - getDoctorStatistics (detailed analytics)
 * - setVacationMode
 * - getDoctorReviews (when review system implemented)
 * - updateConsultationFee
 * - getDoctorEarnings (financial analytics)
 */