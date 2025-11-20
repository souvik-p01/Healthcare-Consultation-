/**
 * Healthcare System - Medical Record Controller
 * 
 * Handles medical records management for healthcare system.
 * 
 * Features:
 * - Medical record creation and management
 * - Patient health history tracking
 * - Lab results and test reports
 * - Medical imaging records
 * - Prescription history
 * - Multi-role access control (doctors, patients, admins)
 */

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { MedicalRecord } from "../models/medicalRecord.model.js";
import { User } from "../models/User.model.js";
import { Patient } from "../models/Patient.model.js";
import { Doctor } from "../models/doctor.model.js";
import { Appointment } from "../models/appointment.model.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

/**
 * CREATE MEDICAL RECORD
 * Create a new medical record for a patient
 * 
 * POST /api/v1/medical-records
 * Requires: verifyJWT middleware, doctor role
 */
const createMedicalRecord = asyncHandler(async (req, res) => {
    const {
        patientId,
        appointmentId,
        recordType,
        diagnosis,
        symptoms,
        treatment,
        medications,
        vitalSigns,
        labResults,
        imagingResults,
        clinicalNotes,
        followUpRequired,
        followUpDate,
        isCritical = false,
        tags
    } = req.body;

    const doctorId = req.user._id;

    console.log("🏥 Creating medical record for patient:", patientId, "by doctor:", doctorId);

    // 1. Validation - Check required fields
    const requiredFields = ['patientId', 'recordType', 'diagnosis'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
        throw new ApiError(
            400, 
            `Missing required fields: ${missingFields.join(', ')}`
        );
    }

    // 2. Validate record type
    const validRecordTypes = [
        'consultation',
        'lab_test',
        'imaging',
        'surgery',
        'emergency',
        'follow_up',
        'vaccination',
        'physical_exam',
        'chronic_care',
        'mental_health'
    ];

    if (!validRecordTypes.includes(recordType)) {
        throw new ApiError(400, `Invalid record type. Must be one of: ${validRecordTypes.join(', ')}`);
    }

    // 3. Verify patient exists
    const patient = await Patient.findById(patientId);
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

    // 5. Handle file uploads if any
    let labReports = [];
    let imagingFiles = [];

    if (req.files) {
        if (req.files.labReports) {
            for (const file of req.files.labReports) {
                const uploadResult = await uploadOnCloudinary(file.path, {
                    category: 'medical_documents',
                    uploadedBy: doctorId,
                    documentType: 'lab_report',
                    patientId: patientId
                });
                
                if (uploadResult && uploadResult.secureUrl) {
                    labReports.push({
                        fileName: file.originalname,
                        fileUrl: uploadResult.secureUrl,
                        fileType: file.mimetype,
                        uploadedAt: new Date()
                    });
                }
            }
        }

        if (req.files.imagingFiles) {
            for (const file of req.files.imagingFiles) {
                const uploadResult = await uploadOnCloudinary(file.path, {
                    category: 'medical_imaging',
                    uploadedBy: doctorId,
                    documentType: 'imaging',
                    patientId: patientId
                });
                
                if (uploadResult && uploadResult.secureUrl) {
                    imagingFiles.push({
                        fileName: file.originalname,
                        fileUrl: uploadResult.secureUrl,
                        fileType: file.mimetype,
                        imagingType: file.mimetype.includes('dicom') ? 'dicom' : 'image',
                        uploadedAt: new Date()
                    });
                }
            }
        }
    }

    // 6. Generate medical record number
    const recordCount = await MedicalRecord.countDocuments();
    const recordNumber = `MR-${String(recordCount + 1).padStart(6, '0')}`;

    // 7. Create medical record
    const medicalRecordData = {
        recordNumber,
        patientId,
        doctorId,
        appointmentId: appointmentId || null,
        recordType,
        diagnosis,
        symptoms: symptoms || [],
        treatment: treatment || [],
        medications: medications || [],
        vitalSigns: vitalSigns || {},
        labResults: labResults || {},
        imagingResults: imagingResults || {},
        labReports,
        imagingFiles,
        clinicalNotes,
        followUpRequired: followUpRequired || false,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        isCritical: isCritical || false,
        tags: tags || [],
        recordedDate: new Date()
    };

    const medicalRecord = await MedicalRecord.create(medicalRecordData);

    // 8. Populate medical record for response
    const createdRecord = await MedicalRecord.findById(medicalRecord._id)
        .populate({
            path: 'patientId',
            populate: {
                path: 'userId',
                select: 'firstName lastName dateOfBirth gender bloodGroup'
            }
        })
        .populate({
            path: 'doctorId',
            select: 'firstName lastName specialization qualification department'
        })
        .populate({
            path: 'appointmentId',
            select: 'appointmentDate appointmentTime type'
        })
        .lean();

    // 9. Update patient's last visit date
    await Patient.findByIdAndUpdate(patientId, {
        lastVisitDate: new Date()
    });

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

/**
 * GET MEDICAL RECORD BY ID
 * Get detailed medical record by ID with access control
 * 
 * GET /api/v1/medical-records/:recordId
 * Requires: verifyJWT middleware
 */
const getMedicalRecordById = asyncHandler(async (req, res) => {
    const { recordId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    console.log("🔍 Fetching medical record:", recordId);

    if (!recordId) {
        throw new ApiError(400, "Medical record ID is required");
    }

    // Find medical record
    const medicalRecord = await MedicalRecord.findById(recordId)
        .populate({
            path: 'patientId',
            populate: {
                path: 'userId',
                select: 'firstName lastName dateOfBirth gender bloodGroup phoneNumber email'
            }
        })
        .populate({
            path: 'doctorId',
            select: 'firstName lastName specialization qualification department avatar'
        })
        .populate({
            path: 'appointmentId',
            select: 'appointmentDate appointmentTime type reason'
        })
        .lean();

    if (!medicalRecord) {
        throw new ApiError(404, "Medical record not found");
    }

    // Access control based on user role
    if (userRole === 'patient') {
        const patientUser = await User.findById(userId).populate('patientId');
        if (!patientUser?.patientId || 
            medicalRecord.patientId._id.toString() !== patientUser.patientId._id.toString()) {
            throw new ApiError(403, "Access denied. You can only view your own medical records.");
        }
    } else if (userRole === 'doctor') {
        // Check if doctor has relationship with patient
        const hasRelationship = await Appointment.findOne({
            doctorId: userId,
            patientId: medicalRecord.patientId._id
        });

        if (!hasRelationship && medicalRecord.doctorId._id.toString() !== userId.toString()) {
            throw new ApiError(403, "Access denied. No patient relationship found.");
        }
    }
    // Admin role can access all records

    console.log('✅ Medical record fetched successfully:', medicalRecord.recordNumber);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { medicalRecord },
                "Medical record fetched successfully"
            )
        );
});

/**
 * GET PATIENT MEDICAL RECORDS
 * Get all medical records for a patient with filtering
 * 
 * GET /api/v1/medical-records/patient/:patientId
 * Requires: verifyJWT middleware
 */
const getPatientMedicalRecords = asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;
    const {
        recordType,
        dateFrom,
        dateTo,
        isCritical,
        doctorId,
        page = 1,
        limit = 10,
        sortBy = 'recordedDate',
        sortOrder = 'desc'
    } = req.query;

    console.log("📋 Fetching medical records for patient:", patientId);

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
            throw new ApiError(403, "Access denied. You can only view your own medical records.");
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

    // Build query
    const query = { patientId };
    
    if (recordType) query.recordType = recordType;
    if (isCritical !== undefined) query.isCritical = isCritical === 'true';
    if (doctorId) query.doctorId = doctorId;
    
    // Date range filter
    if (dateFrom || dateTo) {
        query.recordedDate = {};
        if (dateFrom) query.recordedDate.$gte = new Date(dateFrom);
        if (dateTo) query.recordedDate.$lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const medicalRecords = await MedicalRecord.find(query)
        .populate({
            path: 'doctorId',
            select: 'firstName lastName specialization department'
        })
        .populate({
            path: 'appointmentId',
            select: 'appointmentDate type'
        })
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

    const total = await MedicalRecord.countDocuments(query);

    // Get record type statistics
    const typeStats = await MedicalRecord.aggregate([
        { $match: query },
        { $group: { _id: '$recordType', count: { $sum: 1 } } }
    ]);

    const statistics = {
        byType: typeStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {}),
        totalRecords: total,
        criticalRecords: await MedicalRecord.countDocuments({ ...query, isCritical: true })
    };

    console.log(`✅ Found ${medicalRecords.length} medical records for patient`);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    patient: {
                        id: patient._id,
                        name: `${patient.userId?.firstName} ${patient.userId?.lastName}`,
                        dateOfBirth: patient.userId?.dateOfBirth,
                        bloodGroup: patient.bloodGroup
                    },
                    medicalRecords,
                    statistics,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(total / limit),
                        totalRecords: total,
                        hasNextPage: page * limit < total
                    }
                },
                "Patient medical records fetched successfully"
            )
        );
});

/**
 * UPDATE MEDICAL RECORD
 * Update an existing medical record (doctor only)
 * 
 * PATCH /api/v1/medical-records/:recordId
 * Requires: verifyJWT middleware, doctor role
 */
const updateMedicalRecord = asyncHandler(async (req, res) => {
    const { recordId } = req.params;
    const doctorId = req.user._id;
    const updateData = req.body;

    console.log("✏️ Updating medical record:", recordId, "by doctor:", doctorId);

    if (!recordId) {
        throw new ApiError(400, "Medical record ID is required");
    }

    // Find medical record and verify ownership
    const medicalRecord = await MedicalRecord.findById(recordId);
    if (!medicalRecord) {
        throw new ApiError(404, "Medical record not found");
    }

    // Verify doctor owns this record or has relationship with patient
    if (medicalRecord.doctorId.toString() !== doctorId.toString()) {
        const hasRelationship = await Appointment.findOne({
            doctorId: doctorId,
            patientId: medicalRecord.patientId
        });

        if (!hasRelationship) {
            throw new ApiError(403, "Access denied. You can only update your own medical records.");
        }
    }

    // Remove fields that shouldn't be updated
    const allowedFields = [
        'diagnosis',
        'symptoms',
        'treatment',
        'medications',
        'vitalSigns',
        'labResults',
        'imagingResults',
        'clinicalNotes',
        'followUpRequired',
        'followUpDate',
        'isCritical',
        'tags'
    ];

    const filteredUpdate = {};
    Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key)) {
            filteredUpdate[key] = updateData[key];
        }
    });

    if (Object.keys(filteredUpdate).length === 0) {
        throw new ApiError(400, "No valid fields to update");
    }

    // Add update timestamp
    filteredUpdate.updatedAt = new Date();
    filteredUpdate.updatedBy = doctorId;

    const updatedRecord = await MedicalRecord.findByIdAndUpdate(
        recordId,
        { $set: filteredUpdate },
        { new: true, runValidators: true }
    )
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

    console.log('✅ Medical record updated successfully:', updatedRecord.recordNumber);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { medicalRecord: updatedRecord },
                "Medical record updated successfully"
            )
        );
});

/**
 * ADD LAB REPORT TO RECORD
 * Add lab report files to existing medical record
 * 
 * POST /api/v1/medical-records/:recordId/lab-reports
 * Requires: verifyJWT middleware, doctor role
 */
const addLabReport = asyncHandler(async (req, res) => {
    const { recordId } = req.params;
    const doctorId = req.user._id;
    const { description, testType, results } = req.body;

    console.log("🧪 Adding lab report to medical record:", recordId);

    if (!recordId) {
        throw new ApiError(400, "Medical record ID is required");
    }

    if (!req.files || req.files.length === 0) {
        throw new ApiError(400, "Lab report file is required");
    }

    // Find medical record and verify access
    const medicalRecord = await MedicalRecord.findById(recordId);
    if (!medicalRecord) {
        throw new ApiError(404, "Medical record not found");
    }

    if (medicalRecord.doctorId.toString() !== doctorId.toString()) {
        throw new ApiError(403, "Access denied. You can only update your own medical records.");
    }

    // Upload lab report files
    const labReports = [];
    for (const file of req.files) {
        const uploadResult = await uploadOnCloudinary(file.path, {
            category: 'medical_documents',
            uploadedBy: doctorId,
            documentType: 'lab_report',
            patientId: medicalRecord.patientId.toString()
        });
        
        if (uploadResult && uploadResult.secureUrl) {
            labReports.push({
                fileName: file.originalname,
                fileUrl: uploadResult.secureUrl,
                fileType: file.mimetype,
                description: description || `Lab report - ${testType || 'Unknown'}`,
                testType: testType || 'general',
                results: results || {},
                uploadedAt: new Date(),
                uploadedBy: doctorId
            });
        }
    }

    if (labReports.length === 0) {
        throw new ApiError(500, "Failed to upload lab reports");
    }

    // Add lab reports to medical record
    const updatedRecord = await MedicalRecord.findByIdAndUpdate(
        recordId,
        {
            $push: { labReports: { $each: labReports } },
            $set: { 
                updatedAt: new Date(),
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
    .select('labReports recordNumber');

    console.log('✅ Lab reports added successfully to:', updatedRecord.recordNumber);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    medicalRecord: {
                        recordNumber: updatedRecord.recordNumber,
                        labReports: updatedRecord.labReports
                    }
                },
                "Lab reports added successfully"
            )
        );
});

/**
 * ADD IMAGING TO RECORD
 * Add medical imaging files to existing medical record
 * 
 * POST /api/v1/medical-records/:recordId/imaging
 * Requires: verifyJWT middleware, doctor role
 */
const addImaging = asyncHandler(async (req, res) => {
    const { recordId } = req.params;
    const doctorId = req.user._id;
    const { 
        imagingType, 
        bodyPart, 
        description, 
        findings,
        radiologistNotes 
    } = req.body;

    console.log("📷 Adding imaging to medical record:", recordId);

    if (!recordId) {
        throw new ApiError(400, "Medical record ID is required");
    }

    if (!req.files || req.files.length === 0) {
        throw new ApiError(400, "Imaging file is required");
    }

    // Find medical record and verify access
    const medicalRecord = await MedicalRecord.findById(recordId);
    if (!medicalRecord) {
        throw new ApiError(404, "Medical record not found");
    }

    if (medicalRecord.doctorId.toString() !== doctorId.toString()) {
        throw new ApiError(403, "Access denied. You can only update your own medical records.");
    }

    // Upload imaging files
    const imagingFiles = [];
    for (const file of req.files) {
        const uploadResult = await uploadOnCloudinary(file.path, {
            category: 'medical_imaging',
            uploadedBy: doctorId,
            documentType: 'imaging',
            patientId: medicalRecord.patientId.toString()
        });
        
        if (uploadResult && uploadResult.secureUrl) {
            imagingFiles.push({
                fileName: file.originalname,
                fileUrl: uploadResult.secureUrl,
                fileType: file.mimetype,
                imagingType: imagingType || 'xray',
                bodyPart: bodyPart || 'unknown',
                description: description || `Medical imaging - ${imagingType || 'Unknown'}`,
                findings: findings || {},
                radiologistNotes: radiologistNotes || '',
                uploadedAt: new Date(),
                uploadedBy: doctorId
            });
        }
    }

    if (imagingFiles.length === 0) {
        throw new ApiError(500, "Failed to upload imaging files");
    }

    // Add imaging files to medical record
    const updatedRecord = await MedicalRecord.findByIdAndUpdate(
        recordId,
        {
            $push: { imagingFiles: { $each: imagingFiles } },
            $set: { 
                updatedAt: new Date(),
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
    .select('imagingFiles recordNumber');

    console.log('✅ Imaging files added successfully to:', updatedRecord.recordNumber);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    medicalRecord: {
                        recordNumber: updatedRecord.recordNumber,
                        imagingFiles: updatedRecord.imagingFiles
                    }
                },
                "Imaging files added successfully"
            )
        );
});

/**
 * GET MEDICAL RECORD STATISTICS
 * Get statistics for medical records (admin/doctor)
 * 
 * GET /api/v1/medical-records/statistics
 * Requires: verifyJWT middleware
 */
const getMedicalRecordStatistics = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { 
        period = 'month',
        patientId,
        doctorId 
    } = req.query;

    console.log("📊 Fetching medical record statistics for:", userRole, userId);

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

    query.recordedDate = dateRange;

    // Get statistics
    const totalRecords = await MedicalRecord.countDocuments(query);

    const recordTypeStats = await MedicalRecord.aggregate([
        { $match: query },
        { $group: { _id: '$recordType', count: { $sum: 1 } } }
    ]);

    const criticalStats = await MedicalRecord.aggregate([
        { $match: query },
        { $group: { _id: '$isCritical', count: { $sum: 1 } } }
    ]);

    const monthlyTrend = await MedicalRecord.aggregate([
        { $match: query },
        {
            $group: {
                _id: {
                    year: { $year: '$recordedDate' },
                    month: { $month: '$recordedDate' }
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
    ]);

    // Convert statistics to more usable format
    const statistics = {
        period,
        totalRecords,
        byType: recordTypeStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {}),
        criticalRecords: criticalStats.find(stat => stat._id === true)?.count || 0,
        normalRecords: criticalStats.find(stat => stat._id === false)?.count || 0,
        monthlyTrend: monthlyTrend.map(item => ({
            period: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
            count: item.count
        })),
        dateRange: {
            from: dateRange.$gte,
            to: dateRange.$lte
        }
    };

    console.log('✅ Medical record statistics fetched successfully');

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { statistics },
                "Medical record statistics fetched successfully"
            )
        );
});

/**
 * SEARCH MEDICAL RECORDS
 * Search medical records by various criteria
 * 
 * GET /api/v1/medical-records/search
 * Requires: verifyJWT middleware
 */
const searchMedicalRecords = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;
    const {
        query,
        recordType,
        diagnosis,
        tags,
        dateFrom,
        dateTo,
        page = 1,
        limit = 10
    } = req.query;

    console.log("🔍 Searching medical records for:", userRole, userId);

    // Build search query based on user role
    const searchQuery = {};

    // Role-based access control
    if (userRole === 'patient') {
        const patientUser = await User.findById(userId).populate('patientId');
        if (!patientUser?.patientId) {
            throw new ApiError(404, "Patient profile not found");
        }
        searchQuery.patientId = patientUser.patientId._id;
    } else if (userRole === 'doctor') {
        searchQuery.doctorId = userId;
    }

    // Text search across multiple fields
    if (query) {
        searchQuery.$or = [
            { diagnosis: { $regex: query, $options: 'i' } },
            { clinicalNotes: { $regex: query, $options: 'i' } },
            { 'symptoms.name': { $regex: query, $options: 'i' } },
            { 'treatment.procedure': { $regex: query, $options: 'i' } }
        ];
    }

    // Additional filters
    if (recordType) searchQuery.recordType = recordType;
    if (diagnosis) searchQuery.diagnosis = { $regex: diagnosis, $options: 'i' };
    if (tags) searchQuery.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    
    if (dateFrom || dateTo) {
        searchQuery.recordedDate = {};
        if (dateFrom) searchQuery.recordedDate.$gte = new Date(dateFrom);
        if (dateTo) searchQuery.recordedDate.$lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;

    const medicalRecords = await MedicalRecord.find(searchQuery)
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
        .sort({ recordedDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

    const total = await MedicalRecord.countDocuments(searchQuery);

    console.log(`✅ Found ${medicalRecords.length} medical records matching search criteria`);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    medicalRecords,
                    searchSummary: {
                        query,
                        totalMatches: total
                    },
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(total / limit),
                        totalRecords: total,
                        hasNextPage: page * limit < total
                    }
                },
                "Medical records search completed successfully"
            )
        );
});

// Export all medical record controller functions
export {
    createMedicalRecord,
    getMedicalRecordById,
    getPatientMedicalRecords,
    updateMedicalRecord,
    addLabReport,
    addImaging,
    getMedicalRecordStatistics,
    searchMedicalRecords
};

/**
 * Additional medical record controllers that can be added:
 * - deleteMedicalRecord (admin only with audit trail)
 * - shareMedicalRecord (secure sharing with other providers)
 * - exportMedicalRecords (PDF/Excel export)
 * - mergeMedicalRecords (for duplicate patient records)
 * - getRecordTimeline (chronological patient history)
 * - addVitalSigns (separate endpoint for vital tracking)
 * - updateLabResults (structured lab data entry)
 * - getCriticalAlerts (real-time critical record alerts)
 */