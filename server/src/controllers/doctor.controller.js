import { Doctor } from "../models/Doctor.js";
import { Appointment } from "../models/appointment.model.js";
import { Patient } from "../models/Patient.model.js";
import { Prescription } from "../models/prescription.model.js";
import { MedicalRecord } from "../models/medicalRecord.model.js";
import { User } from "../models/User.model.js";
import doctorService from "../services/doctor.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Helper: Get or self-heal Doctor document linked to the User
const getDoctorOrCreate = async (user) => {
    let doctor = null;
    if (user.doctorId) {
        doctor = await Doctor.findById(user.doctorId);
    }
    
    if (!doctor) {
        // Try searching by name
        const fullName = `${user.firstName} ${user.lastName}`.trim();
        doctor = await Doctor.findOne({ fullName: new RegExp('^Dr\\.?\\s*' + fullName + '$', 'i') }) ||
                 await Doctor.findOne({ fullName: new RegExp('^' + fullName + '$', 'i') });
    }
    
    if (!doctor) {
        // Create new Doctor document
        const generatedId = `doc_${user._id.toString().substring(18)}`;
        doctor = await Doctor.create({
            doctorId: generatedId,
            fullName: `Dr. ${user.firstName} ${user.lastName}`,
            gender: user.gender || "Male",
            qualification: "MBBS, MD",
            specialization: "General Medicine",
            yearsOfExperience: 5,
            hospitalName: "HealthCare Plus Hospital",
            consultationFee: 500,
            languages: ["English", "Hindi"],
            rating: 4.8,
            reviewCount: 10,
            profilePhoto: user.avatar || "👨‍⚕️",
            availability: ["Mon", "Tue", "Wed", "Thu", "Fri"],
            nextAvailableSlot: "Tomorrow",
            address: "Sector 5, Salt Lake",
            city: "Kolkata",
            state: "West Bengal",
            country: "India",
            latitude: 22.5726,
            longitude: 88.3639,
            phone: user.phoneNumber || "+91 98765 43210",
            email: user.email,
            teleconsultAvailable: true,
            emergencyAvailable: true,
            verified: true,
            licenseNumber: `LIC-${user._id.toString().substring(18).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`
        });
    }
    
    // Ensure User links to this Doctor
    if (!user.doctorId || user.doctorId.toString() !== doctor._id.toString()) {
        await User.findByIdAndUpdate(user._id, { $set: { doctorId: doctor._id } });
        user.doctorId = doctor._id;
    }
    
    return doctor;
};

/**
 * Get all doctors with optional filterings
 */
export const getAllDoctors = asyncHandler(async (req, res) => {
    const result = await doctorService.queryDoctors(req.query);
    
    // Format response data to array of doctors for backwards compatibility if needed, 
    // but returning full result object containing the list
    return res.status(200).json(
        new ApiResponse(200, result.doctors, "Doctors fetched successfully", { pagination: result.pagination })
    );
});

/**
 * Add a new doctor (Admin only)
 */
export const addDoctor = asyncHandler(async (req, res) => {
    const { 
        fullName, 
        gender, 
        qualification, 
        specialization, 
        subspecialization, 
        yearsOfExperience, 
        hospitalName, 
        clinicName, 
        consultationFee, 
        languages, 
        profilePhoto, 
        availability, 
        address, 
        city, 
        state, 
        latitude, 
        longitude, 
        phone, 
        email, 
        teleconsultAvailable, 
        emergencyAvailable, 
        licenseNumber 
    } = req.body;

    const doctorId = `doc_${Math.floor(100000 + Math.random() * 900000)}`;

    const doctor = await doctorService.addDoctor({
        doctorId,
        fullName,
        gender,
        qualification,
        specialization,
        subspecialization: subspecialization || "",
        yearsOfExperience: parseInt(yearsOfExperience),
        hospitalName,
        clinicName: clinicName || "",
        consultationFee: parseFloat(consultationFee),
        languages: languages || ["English", "Hindi"],
        profilePhoto: profilePhoto || "👨‍⚕️",
        availability: availability || ["Mon", "Tue", "Wed", "Thu", "Fri"],
        address,
        city,
        state,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        phone,
        email,
        teleconsultAvailable: teleconsultAvailable !== false,
        emergencyAvailable: emergencyAvailable === true,
        licenseNumber
    });

    return res.status(201).json(
        new ApiResponse(201, doctor, "Doctor added successfully")
    );
});

/**
 * Delete a doctor (Admin only)
 */
export const deleteDoctor = asyncHandler(async (req, res) => {
    const { doctorId } = req.params;

    const doctor = await doctorService.deleteDoctor(doctorId);

    if (!doctor) {
        throw new ApiError(404, "Doctor not found");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Doctor removed successfully")
    );
});

/**
 * Get specialties count dynamically from database
 */
export const getSpecialties = asyncHandler(async (req, res) => {
    const specialties = await doctorService.getSpecialties();
    return res.status(200).json(
        new ApiResponse(200, specialties, "Specialties counts retrieved successfully")
    );
});

// ==========================================
// DOCTOR PORTAL CONTROLLERS
// ==========================================

export const getDoctorProfile = asyncHandler(async (req, res) => {
    const doctor = await getDoctorOrCreate(req.user);
    return res.status(200).json(new ApiResponse(200, doctor, "Doctor profile fetched"));
});

export const updateDoctorProfile = asyncHandler(async (req, res) => {
    const doctor = await getDoctorOrCreate(req.user);
    const updatedDoctor = await Doctor.findByIdAndUpdate(doctor._id, { $set: req.body }, { new: true });
    return res.status(200).json(new ApiResponse(200, updatedDoctor, "Doctor profile updated"));
});

export const getDoctorDashboard = asyncHandler(async (req, res) => {
    const doctor = await getDoctorOrCreate(req.user);
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    // Find all appointments for today for this doctor
    const appointmentsToday = await Appointment.find({
        doctorId: req.user._id,
        appointmentDate: { $gte: startOfDay, $lte: endOfDay }
    }).populate({
        path: 'patientId',
        populate: { path: 'user', select: 'firstName lastName dateOfBirth gender avatar' }
    });
    
    const formattedAppointments = appointmentsToday.map(apt => {
        const patientName = apt.patientId?.user 
            ? `${apt.patientId.user.firstName} ${apt.patientId.user.lastName}` 
            : apt.patientId?.name || 'Unknown Patient';
        const age = apt.patientId?.user?.dateOfBirth 
            ? new Date().getFullYear() - new Date(apt.patientId.user.dateOfBirth).getFullYear() 
            : 35;
        const gender = apt.patientId?.user?.gender || 'Male';
        const initials = apt.patientId?.user 
            ? `${apt.patientId.user.firstName[0]}${apt.patientId.user.lastName[0]}` 
            : 'PT';
            
        return {
            id: apt._id,
            name: patientName,
            time: apt.appointmentTime || '10:00 AM',
            type: apt.appointmentType === 'video' ? 'Video Consultation' : 'In-Person',
            condition: apt.chiefComplaint || apt.symptoms || 'General Checkup',
            status: apt.status === 'scheduled' ? 'pending' : apt.status,
            avatar: initials,
            age,
            gender,
            bloodType: apt.patientId?.bloodType || 'O+',
            notes: apt.symptoms || 'No specific symptoms reported'
        };
    });
    
    const videoCount = appointmentsToday.filter(apt => apt.appointmentType === 'video').length;
    const totalCount = appointmentsToday.length;
    
    const prescriptionsTodayCount = await Prescription.countDocuments({
        doctorId: req.user._id,
        createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    
    const medicalRecordsTodayCount = await MedicalRecord.countDocuments({
        doctorId: req.user._id,
        createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    
    const todayStats = [
        { label: 'Patients Today', value: totalCount.toString(), change: '+0 from yesterday', trend: 'up' },
        { label: 'Video Consultations', value: videoCount.toString(), change: '+0 from yesterday', trend: 'up' },
        { label: 'Prescriptions', value: prescriptionsTodayCount.toString(), change: '+0 from yesterday', trend: 'up' },
        { label: 'Reports Reviewed', value: medicalRecordsTodayCount.toString(), change: '+0 from yesterday', trend: 'up' }
    ];
    
    const doctorInfo = {
        name: doctor.fullName,
        specialty: doctor.specialization,
        experience: `${doctor.yearsOfExperience} years`,
        rating: doctor.rating,
        totalPatients: doctor.reviewCount * 12 + 15
    };
    
    return res.status(200).json(new ApiResponse(200, {
        doctorInfo,
        todayStats,
        todaysSchedule: {
            appointments: formattedAppointments
        }
    }, "Dashboard data fetched successfully"));
});

export const getTodaysAppointments = asyncHandler(async (req, res) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    const appointments = await Appointment.find({
        doctorId: req.user._id,
        appointmentDate: { $gte: startOfDay, $lte: endOfDay }
    }).populate({
        path: 'patientId',
        populate: { path: 'user', select: 'firstName lastName dateOfBirth gender' }
    }).sort({ appointmentTime: 1 });
    
    const formatted = appointments.map(apt => {
        const patientName = apt.patientId?.user 
            ? `${apt.patientId.user.firstName} ${apt.patientId.user.lastName}` 
            : apt.patientId?.name || 'Unknown Patient';
        return {
            id: apt._id,
            name: patientName,
            time: apt.appointmentTime || '10:00 AM',
            type: apt.appointmentType === 'video' ? 'Video Consultation' : 'In-Person',
            condition: apt.chiefComplaint || apt.symptoms || 'General Checkup',
            status: apt.status === 'scheduled' ? 'pending' : apt.status,
            age: apt.patientId?.user?.dateOfBirth 
                ? new Date().getFullYear() - new Date(apt.patientId.user.dateOfBirth).getFullYear() 
                : 35,
            gender: apt.patientId?.user?.gender || 'Male'
        };
    });
    
    return res.status(200).json(new ApiResponse(200, formatted, "Today's appointments fetched"));
});

export const getDoctorAppointments = asyncHandler(async (req, res) => {
    const appointments = await Appointment.find({ doctorId: req.user._id })
        .populate({
            path: 'patientId',
            populate: { path: 'user', select: 'firstName lastName dateOfBirth gender' }
        })
        .sort({ appointmentDate: 1, appointmentTime: 1 });
        
    const formatted = appointments.map(apt => {
        const patientName = apt.patientId?.user 
            ? `${apt.patientId.user.firstName} ${apt.patientId.user.lastName}` 
            : apt.patientId?.name || 'Unknown Patient';
        
        let typeStr = 'In-Person';
        if (apt.appointmentType === 'video') typeStr = 'Video Consultation';
        else if (apt.appointmentType === 'phone') typeStr = 'Phone Call';
        else if (apt.appointmentType === 'chat') typeStr = 'Online Chat';
 
        return {
            id: apt._id,
            name: patientName,
            time: apt.appointmentTime || '10:00 AM',
            date: apt.appointmentDate,
            type: typeStr,
            appointmentType: apt.appointmentType || 'in-person',
            paymentStatus: apt.paymentStatus || 'pending',
            condition: apt.chiefComplaint || apt.symptoms || 'General Checkup',
            status: apt.status === 'scheduled' ? 'pending' : apt.status,
            age: apt.patientId?.user?.dateOfBirth 
                ? new Date().getFullYear() - new Date(apt.patientId.user.dateOfBirth).getFullYear() 
                : 35,
            gender: apt.patientId?.user?.gender || 'Male'
        };
    });
    
    return res.status(200).json(new ApiResponse(200, { appointments: formatted }, "All doctor appointments fetched"));
});

export const updateAppointmentStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    const appointment = await Appointment.findByIdAndUpdate(id, { $set: { status } }, { new: true });
    if (!appointment) throw new ApiError(404, "Appointment not found");
    
    return res.status(200).json(new ApiResponse(200, appointment, "Appointment status updated"));
});

export const getDoctorsPatients = asyncHandler(async (req, res) => {
    const appointments = await Appointment.find({ doctorId: req.user._id }).select('patientId').lean();
    const patientIds = [...new Set(appointments.map(apt => apt.patientId?.toString()).filter(Boolean))];
    
    const patients = await Patient.find({ _id: { $in: patientIds } })
        .populate('user', 'firstName lastName email phoneNumber dateOfBirth gender')
        .lean();
        
    const formatted = patients.map(p => {
        const name = p.user ? `${p.user.firstName} ${p.user.lastName}` : p.name || 'Unknown Patient';
        const age = p.user?.dateOfBirth 
            ? new Date().getFullYear() - new Date(p.user.dateOfBirth).getFullYear() 
            : p.age || 35;
        const gender = p.user?.gender || p.gender || 'Male';
        return {
            id: p._id,
            name,
            email: p.user?.email || p.email,
            phone: p.user?.phoneNumber || p.phone,
            age,
            gender,
            condition: p.medicalHistory?.[0]?.condition || 'General Checkup',
            status: p.status || 'Stable',
            lastVisit: p.lastActive ? new Date(p.lastActive).toLocaleDateString() : 'N/A'
        };
    });
    
    return res.status(200).json(new ApiResponse(200, { patients: formatted }, "Doctor patients fetched"));
});

export const getPatientDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const patient = await Patient.findById(id).populate('user', 'firstName lastName email phoneNumber dateOfBirth gender');
    if (!patient) throw new ApiError(404, "Patient not found");
    return res.status(200).json(new ApiResponse(200, patient, "Patient details fetched"));
});

export const getPatientMedicalHistory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const history = await MedicalRecord.find({ patientId: id }).populate('doctorId', 'firstName lastName');
    return res.status(200).json(new ApiResponse(200, history, "Patient medical history fetched"));
});

export const getDoctorSchedule = asyncHandler(async (req, res) => {
    const doctor = await getDoctorOrCreate(req.user);
    return res.status(200).json(new ApiResponse(200, { availability: doctor.availability || [] }, "Schedule fetched"));
});

export const updateDoctorAvailability = asyncHandler(async (req, res) => {
    const doctor = await getDoctorOrCreate(req.user);
    const { availability } = req.body;
    const updatedDoctor = await Doctor.findByIdAndUpdate(doctor._id, { $set: { availability } }, { new: true });
    return res.status(200).json(new ApiResponse(200, { availability: updatedDoctor.availability }, "Availability updated"));
});

export const createPrescription = asyncHandler(async (req, res) => {
    const { patientId, medications, instructions, diagnosis } = req.body;
    
    const prescription = await Prescription.create({
        doctorId: req.user._id,
        patientId,
        medications,
        instructions,
        diagnosis,
        prescriptionDate: new Date()
    });
    
    return res.status(201).json(new ApiResponse(201, prescription, "Prescription created successfully"));
});

export const addMedicalRecord = asyncHandler(async (req, res) => {
    const { patientId, recordType, notes, diagnosis, attachments } = req.body;
    
    const record = await MedicalRecord.create({
        doctorId: req.user._id,
        patientId,
        recordType,
        notes,
        diagnosis,
        attachments,
        createdAt: new Date()
    });
    
    return res.status(201).json(new ApiResponse(201, record, "Medical record added successfully"));
});