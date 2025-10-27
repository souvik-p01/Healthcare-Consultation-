/**
 * Healthcare System - Lab Result Controller
 * 
 * Handles laboratory test results management for healthcare system.
 * 
 * Features:
 * - Lab test result upload and management
 * - Test result interpretation and analysis
 * - Critical result alerting
 * - Lab report file management
 * - Test reference ranges
 * - Multi-role access control (doctors, patients, lab technicians)
 */

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { LabResult } from "../models/labResult.model.js";
import { User } from "../models/user.model.js";
import { Patient } from "../models/patient.model.js";
import { Doctor } from "../models/doctor.model.js";
import { Appointment } from "../models/appointment.model.js";
import { MedicalRecord } from "../models/medicalRecord.model.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { 
    sendLabResultReady,
    sendCriticalResultAlert,
    sendLabResultToDoctor
} from "../utils/emailUtils.js";

/**
 * CREATE LAB RESULT
 * Create a new lab test result for a patient
 * 
 * POST /api/v1/lab-results
 * Requires: verifyJWT middleware (lab_tech, doctor, or admin role)
 */
const createLabResult = asyncHandler(async (req, res) => {
    const {
        patientId,
        appointmentId,
        testType,
        testName,
        labTestCode,
        results,
        referenceRange,
        units,
        status = 'pending',
        isCritical = false,
        notes,
        orderedBy,
        collectedDate,
        receivedDate,
        verifiedBy
    } = req.body;

    const createdBy = req.user._id;
    const userRole = req.user.role;

    console.log("🧪 Creating lab result for patient:", patientId);

    // 1. Validation - Check required fields
    const requiredFields = ['patientId', 'testType', 'testName', 'results'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
        throw new ApiError(
            400, 
            `Missing required fields: ${missingFields.join(', ')}`
        );
    }

    // 2. Validate test type
    const validTestTypes = [
        'blood_test',
        'urine_test',
        'imaging',
        'biopsy',
        'culture',
        'genetic_test',
        'hormone_test',
        'allergy_test',
        'cancer_screening',
        'infectious_disease',
        'metabolic_panel',
        'cardiac_marker'
    ];

    if (!validTestTypes.includes(testType)) {
        throw new ApiError(400, `Invalid test type. Must be one of: ${validTestTypes.join(', ')}`);
    }

    // 3. Validate status
    const validStatuses = ['pending', 'collected', 'in_progress', 'completed', 'verified', 'cancelled'];
    if (!validStatuses.includes(status)) {
        throw new ApiError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // 4. Verify patient exists
    const patient = await Patient.findById(patientId).populate('userId');
    if (!patient) {
        throw new ApiError(404, "Patient not found");
    }

    // 5. Verify ordering doctor if provided
    if (orderedBy) {
        const orderingDoctor = await User.findOne({ 
            _id: orderedBy, 
            role: 'doctor' 
        });
        if (!orderingDoctor) {
            throw new ApiError(404, "Ordering doctor not found");
        }
    }

    // 6. Verify appointment if provided
    if (appointmentId) {
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            throw new ApiError(404, "Appointment not found");
        }
    }

    // 7. Handle lab report file upload
    let labReportFiles = [];
    if (req.files && req.files.length > 0) {
        for (const file of req.files) {
            const uploadResult = await uploadOnCloudinary(file.path, {
                category: 'lab_reports',
                uploadedBy: createdBy,
                documentType: 'lab_report',
                patientId: patientId
            });
            
            if (uploadResult && uploadResult.secureUrl) {
                labReportFiles.push({
                    fileName: file.originalname,
                    fileUrl: uploadResult.secureUrl,
                    fileType: file.mimetype,
                    uploadedAt: new Date(),
                    description: `Lab report for ${testName}`
                });
            }
        }
    }

    // 8. Analyze results and determine if abnormal or critical
    const analyzedResults = analyzeLabResults(results, referenceRange);
    const hasAbnormalValues = analyzedResults.some(result => result.isAbnormal);
    const hasCriticalValues = analyzedResults.some(result => result.isCritical);

    // 9. Generate lab result number
    const resultCount = await LabResult.countDocuments();
    const labResultNumber = `LAB-${String(resultCount + 1).padStart(6, '0')}`;

    // 10. Create lab result
    const labResultData = {
        labResultNumber,
        patientId,
        appointmentId: appointmentId || null,
        testType,
        testName,
        labTestCode: labTestCode || generateLabTestCode(testType),
        results: analyzedResults,
        referenceRange: referenceRange || {},
        units: units || {},
        status: status,
        isCritical: isCritical || hasCriticalValues,
        hasAbnormalValues: hasAbnormalValues,
        notes: notes || '',
        orderedBy: orderedBy || null,
        collectedDate: collectedDate ? new Date(collectedDate) : null,
        receivedDate: receivedDate ? new Date(receivedDate) : new Date(),
        reportedDate: new Date(),
        verifiedBy: verifiedBy || null,
        labReportFiles: labReportFiles,
        createdBy: createdBy
    };

    const labResult = await LabResult.create(labResultData);

    // 11. Populate lab result for response
    const createdLabResult = await LabResult.findById(labResult._id)
        .populate({
            path: 'patientId',
            populate: {
                path: 'userId',
                select: 'firstName lastName dateOfBirth gender phoneNumber email'
            }
        })
        .populate({
            path: 'appointmentId',
            select: 'appointmentDate appointmentTime type'
        })
        .populate({
            path: 'orderedBy',
            select: 'firstName lastName specialization department'
        })
        .populate({
            path: 'verifiedBy',
            select: 'firstName lastName'
        })
        .lean();

    // 12. Create medical record entry if test is completed
    if (status === 'completed' || status === 'verified') {
        await MedicalRecord.create({
            patientId,
            doctorId: orderedBy || createdBy,
            appointmentId: appointmentId || null,
            recordType: 'lab_test',
            diagnosis: `Laboratory Test: ${testName}`,
            treatment: [],
            medications: [],
            clinicalNotes: `Lab test results: ${testName}. Status: ${status}. ${hasCriticalValues ? 'CRITICAL VALUES FOUND' : ''}`,
            labResultId: labResult._id
        });
    }

    // 13. Send notifications based on result status and criticality
    try {
        if (status === 'completed' || status === 'verified') {
            // Notify patient
            await sendLabResultReady(patient.userId.email, {
                patientName: `${patient.userId.firstName} ${patient.userId.lastName}`,
                testName: testName,
                labResultNumber: labResultNumber,
                reportedDate: new Date().toDateString(),
                hasAbnormalValues: hasAbnormalValues,
                isCritical: hasCriticalValues
            });

            // Notify ordering doctor if critical results
            if (hasCriticalValues && orderedBy) {
                const doctor = await User.findById(orderedBy);
                if (doctor) {
                    await sendCriticalResultAlert(doctor.email, {
                        doctorName: `${doctor.firstName} ${doctor.lastName}`,
                        patientName: `${patient.userId.firstName} ${patient.userId.lastName}`,
                        testName: testName,
                        labResultNumber: labResultNumber,
                        criticalValues: analyzedResults.filter(r => r.isCritical).map(r => r.testItem)
                    });
                }
            }
        }
    } catch (emailError) {
        console.error('⚠️ Lab result email sending failed:', emailError);
    }

    console.log('✅ Lab result created successfully:', labResultNumber);

    return res.status(201).json(
        new ApiResponse(
            201, 
            {
                labResult: createdLabResult,
                analysis: {
                    hasAbnormalValues: hasAbnormalValues,
                    hasCriticalValues: hasCriticalValues,
                    abnormalTests: analyzedResults.filter(r => r.isAbnormal).map(r => r.testItem)
                }
            }, 
            "Lab result created successfully"
        )
    );
});

/**
 * GET LAB RESULT BY ID
 * Get detailed lab result by ID with access control
 * 
 * GET /api/v1/lab-results/:resultId
 * Requires: verifyJWT middleware
 */
const getLabResultById = asyncHandler(async (req, res) => {
    const { resultId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    console.log("🔍 Fetching lab result:", resultId);

    if (!resultId) {
        throw new ApiError(400, "Lab result ID is required");
    }

    // Find lab result
    const labResult = await LabResult.findById(resultId)
        .populate({
            path: 'patientId',
            populate: {
                path: 'userId',
                select: 'firstName lastName dateOfBirth gender bloodGroup phoneNumber email'
            }
        })
        .populate({
            path: 'appointmentId',
            select: 'appointmentDate appointmentTime type'
        })
        .populate({
            path: 'orderedBy',
            select: 'firstName lastName specialization department'
        })
        .populate({
            path: 'verifiedBy',
            select: 'firstName lastName'
        })
        .populate({
            path: 'createdBy',
            select: 'firstName lastName'
        })
        .lean();

    if (!labResult) {
        throw new ApiError(404, "Lab result not found");
    }

    // Access control based on user role
    if (userRole === 'patient') {
        const patientUser = await User.findById(userId).populate('patientId');
        if (!patientUser?.patientId || 
            labResult.patientId._id.toString() !== patientUser.patientId._id.toString()) {
            throw new ApiError(403, "Access denied. You can only view your own lab results.");
        }
    } else if (userRole === 'doctor') {
        // Check if doctor ordered this result or has relationship with patient
        const isOrderingDoctor = labResult.orderedBy && 
            labResult.orderedBy._id.toString() === userId.toString();
        
        if (!isOrderingDoctor) {
            const hasRelationship = await Appointment.findOne({
                doctorId: userId,
                patientId: labResult.patientId._id
            });

            if (!hasRelationship) {
                throw new ApiError(403, "Access denied. No patient relationship found.");
            }
        }
    } else if (userRole === 'lab_tech') {
        // Lab tech can only view results they created or are assigned to
        if (labResult.createdBy._id.toString() !== userId.toString()) {
            throw new ApiError(403, "Access denied. You can only view lab results you created.");
        }
    }

    console.log('✅ Lab result fetched successfully:', labResult.labResultNumber);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { labResult },
                "Lab result fetched successfully"
            )
        );
});

/**
 * GET PATIENT LAB RESULTS
 * Get all lab results for a patient with filtering
 * 
 * GET /api/v1/lab-results/patient/:patientId
 * Requires: verifyJWT middleware
 */
const getPatientLabResults = asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;
    const {
        testType,
        status,
        dateFrom,
        dateTo,
        isCritical,
        hasAbnormalValues,
        page = 1,
        limit = 10,
        sortBy = 'reportedDate',
        sortOrder = 'desc'
    } = req.query;

    console.log("📋 Fetching lab results for patient:", patientId);

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
            throw new ApiError(403, "Access denied. You can only view your own lab results.");
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
    
    if (testType) query.testType = testType;
    if (status) query.status = status;
    if (isCritical !== undefined) query.isCritical = isCritical === 'true';
    if (hasAbnormalValues !== undefined) query.hasAbnormalValues = hasAbnormalValues === 'true';
    
    // Date range filter
    if (dateFrom || dateTo) {
        query.reportedDate = {};
        if (dateFrom) query.reportedDate.$gte = new Date(dateFrom);
        if (dateTo) query.reportedDate.$lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const labResults = await LabResult.find(query)
        .populate({
            path: 'orderedBy',
            select: 'firstName lastName specialization'
        })
        .populate({
            path: 'verifiedBy',
            select: 'firstName lastName'
        })
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

    const total = await LabResult.countDocuments(query);

    // Get lab result statistics
    const testTypeStats = await LabResult.aggregate([
        { $match: query },
        { $group: { _id: '$testType', count: { $sum: 1 } } }
    ]);

    const statusStats = await LabResult.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const statistics = {
        byTestType: testTypeStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {}),
        byStatus: statusStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {}),
        totalResults: total,
        criticalResults: await LabResult.countDocuments({ ...query, isCritical: true }),
        abnormalResults: await LabResult.countDocuments({ ...query, hasAbnormalValues: true })
    };

    console.log(`✅ Found ${labResults.length} lab results for patient`);

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
                    labResults,
                    statistics,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(total / limit),
                        totalResults: total,
                        hasNextPage: page * limit < total
                    }
                },
                "Patient lab results fetched successfully"
            )
        );
});

/**
 * UPDATE LAB RESULT STATUS
 * Update lab result status and verification
 * 
 * PATCH /api/v1/lab-results/:resultId/status
 * Requires: verifyJWT middleware (lab_tech, doctor, or admin role)
 */
const updateLabResultStatus = asyncHandler(async (req, res) => {
    const { resultId } = req.params;
    const { status, verifiedBy, verificationNotes, results } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    console.log("🔄 Updating lab result status:", resultId, "to:", status);

    if (!resultId || !status) {
        throw new ApiError(400, "Lab result ID and status are required");
    }

    // Validate status
    const validStatuses = ['pending', 'collected', 'in_progress', 'completed', 'verified', 'cancelled'];
    if (!validStatuses.includes(status)) {
        throw new ApiError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Find lab result
    const labResult = await LabResult.findById(resultId)
        .populate({
            path: 'patientId',
            populate: {
                path: 'userId',
                select: 'firstName lastName email phoneNumber'
            }
        })
        .populate({
            path: 'orderedBy',
            select: 'firstName lastName email'
        });

    if (!labResult) {
        throw new ApiError(404, "Lab result not found");
    }

    // Check permissions - only lab tech, doctor who ordered, or admin can update
    const isOrderingDoctor = labResult.orderedBy && 
        labResult.orderedBy._id.toString() === userId.toString();
    const isCreator = labResult.createdBy.toString() === userId.toString();

    if (!isOrderingDoctor && !isCreator && userRole !== 'admin' && userRole !== 'lab_tech') {
        throw new ApiError(403, "Access denied. You don't have permission to update this lab result.");
    }

    // Status transition validation
    const currentStatus = labResult.status;
    const allowedTransitions = {
        'pending': ['collected', 'cancelled'],
        'collected': ['in_progress', 'cancelled'],
        'in_progress': ['completed', 'cancelled'],
        'completed': ['verified', 'cancelled'],
        'verified': [],
        'cancelled': []
    };

    if (!allowedTransitions[currentStatus]?.includes(status)) {
        throw new ApiError(400, `Cannot change status from ${currentStatus} to ${status}`);
    }

    // Update lab result
    const updateData = { 
        status,
        updatedBy: userId,
        updatedAt: new Date()
    };

    if (status === 'verified') {
        updateData.verifiedBy = verifiedBy || userId;
        updateData.verificationNotes = verificationNotes || '';
        updateData.verifiedDate = new Date();
    }

    if (status === 'completed' || status === 'verified') {
        updateData.reportedDate = new Date();
    }

    // Re-analyze results if provided
    if (results && labResult.referenceRange) {
        const analyzedResults = analyzeLabResults(results, labResult.referenceRange);
        updateData.results = analyzedResults;
        updateData.hasAbnormalValues = analyzedResults.some(result => result.isAbnormal);
        updateData.isCritical = analyzedResults.some(result => result.isCritical);
    }

    const updatedLabResult = await LabResult.findByIdAndUpdate(
        resultId,
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
        path: 'orderedBy',
        select: 'firstName lastName specialization'
    })
    .populate({
        path: 'verifiedBy',
        select: 'firstName lastName'
    });

    // Send notifications for status changes
    try {
        if (status === 'completed' || status === 'verified') {
            await sendLabResultReady(
                labResult.patientId.userId.email,
                {
                    patientName: `${labResult.patientId.userId.firstName} ${labResult.patientId.userId.lastName}`,
                    testName: labResult.testName,
                    labResultNumber: labResult.labResultNumber,
                    reportedDate: new Date().toDateString()
                }
            );

            if (labResult.orderedBy) {
                await sendLabResultToDoctor(
                    labResult.orderedBy.email,
                    {
                        doctorName: `${labResult.orderedBy.firstName} ${labResult.orderedBy.lastName}`,
                        patientName: `${labResult.patientId.userId.firstName} ${labResult.patientId.userId.lastName}`,
                        testName: labResult.testName,
                        labResultNumber: labResult.labResultNumber,
                        hasAbnormalValues: updatedLabResult.hasAbnormalValues,
                        isCritical: updatedLabResult.isCritical
                    }
                );
            }
        }
    } catch (notificationError) {
        console.error('⚠️ Lab result notification failed:', notificationError);
    }

    console.log('✅ Lab result status updated:', labResult.labResultNumber, '->', status);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { labResult: updatedLabResult },
                `Lab result ${status} successfully`
            )
        );
});

/**
 * ADD LAB REPORT FILE
 * Add additional lab report files to existing lab result
 * 
 * POST /api/v1/lab-results/:resultId/files
 * Requires: verifyJWT middleware (lab_tech, doctor, or admin role)
 */
const addLabReportFile = asyncHandler(async (req, res) => {
    const { resultId } = req.params;
    const userId = req.user._id;
    const { description } = req.body;

    console.log("📎 Adding lab report file to result:", resultId);

    if (!resultId) {
        throw new ApiError(400, "Lab result ID is required");
    }

    if (!req.files || req.files.length === 0) {
        throw new ApiError(400, "Lab report file is required");
    }

    // Find lab result and verify access
    const labResult = await LabResult.findById(resultId);
    if (!labResult) {
        throw new ApiError(404, "Lab result not found");
    }

    // Check permissions
    const isCreator = labResult.createdBy.toString() === userId.toString();
    if (!isCreator && req.user.role !== 'admin' && req.user.role !== 'lab_tech') {
        throw new ApiError(403, "Access denied. You don't have permission to add files to this lab result.");
    }

    // Upload lab report files
    const labReportFiles = [];
    for (const file of req.files) {
        const uploadResult = await uploadOnCloudinary(file.path, {
            category: 'lab_reports',
            uploadedBy: userId,
            documentType: 'lab_report',
            patientId: labResult.patientId.toString()
        });
        
        if (uploadResult && uploadResult.secureUrl) {
            labReportFiles.push({
                fileName: file.originalname,
                fileUrl: uploadResult.secureUrl,
                fileType: file.mimetype,
                description: description || `Additional lab report for ${labResult.testName}`,
                uploadedAt: new Date(),
                uploadedBy: userId
            });
        }
    }

    if (labReportFiles.length === 0) {
        throw new ApiError(500, "Failed to upload lab report files");
    }

    // Add lab report files to lab result
    const updatedLabResult = await LabResult.findByIdAndUpdate(
        resultId,
        {
            $push: { labReportFiles: { $each: labReportFiles } },
            $set: { 
                updatedAt: new Date(),
                updatedBy: userId
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
    .select('labReportFiles labResultNumber testName');

    console.log('✅ Lab report files added successfully to:', updatedLabResult.labResultNumber);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    labResult: {
                        labResultNumber: updatedLabResult.labResultNumber,
                        testName: updatedLabResult.testName,
                        labReportFiles: updatedLabResult.labReportFiles
                    }
                },
                "Lab report files added successfully"
            )
        );
});

/**
 * GET CRITICAL LAB RESULTS
 * Get all critical lab results that need attention
 * 
 * GET /api/v1/lab-results/critical
 * Requires: verifyJWT middleware (doctor, lab_tech, or admin role)
 */
const getCriticalLabResults = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;
    const {
        dateFrom,
        dateTo,
        acknowledged = false,
        page = 1,
        limit = 10
    } = req.query;

    console.log("🚨 Fetching critical lab results for:", userRole, userId);

    // Build query for critical results
    const query = { 
        isCritical: true,
        status: { $in: ['completed', 'verified'] }
    };

    if (acknowledged !== undefined) {
        query.isAcknowledged = acknowledged === 'true';
    }

    // Date range filter
    if (dateFrom || dateTo) {
        query.reportedDate = {};
        if (dateFrom) query.reportedDate.$gte = new Date(dateFrom);
        if (dateTo) query.reportedDate.$lte = new Date(dateTo);
    }

    // For doctors, only show their patients' results
    if (userRole === 'doctor') {
        const doctorAppointments = await Appointment.find({ doctorId: userId }).select('patientId');
        const patientIds = [...new Set(doctorAppointments.map(apt => apt.patientId.toString()))];
        query.patientId = { $in: patientIds };
    }

    const skip = (page - 1) * limit;

    const criticalResults = await LabResult.find(query)
        .populate({
            path: 'patientId',
            populate: {
                path: 'userId',
                select: 'firstName lastName dateOfBirth gender phoneNumber'
            }
        })
        .populate({
            path: 'orderedBy',
            select: 'firstName lastName specialization department'
        })
        .populate({
            path: 'verifiedBy',
            select: 'firstName lastName'
        })
        .sort({ reportedDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

    const total = await LabResult.countDocuments(query);

    console.log(`✅ Found ${criticalResults.length} critical lab results`);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    criticalResults,
                    summary: {
                        totalCritical: total,
                        acknowledged: await LabResult.countDocuments({ ...query, isAcknowledged: true }),
                        unacknowledged: await LabResult.countDocuments({ ...query, isAcknowledged: false })
                    },
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(total / limit),
                        totalResults: total,
                        hasNextPage: page * limit < total
                    }
                },
                "Critical lab results fetched successfully"
            )
        );
});

/**
 * ACKNOWLEDGE CRITICAL RESULT
 * Mark a critical lab result as acknowledged by doctor
 * 
 * PATCH /api/v1/lab-results/:resultId/acknowledge
 * Requires: verifyJWT middleware, doctor role
 */
const acknowledgeCriticalResult = asyncHandler(async (req, res) => {
    const { resultId } = req.params;
    const doctorId = req.user._id;
    const { acknowledgmentNotes, actionTaken } = req.body;

    console.log("✅ Acknowledging critical lab result:", resultId);

    if (!resultId) {
        throw new ApiError(400, "Lab result ID is required");
    }

    // Find lab result
    const labResult = await LabResult.findById(resultId)
        .populate({
            path: 'patientId',
            populate: {
                path: 'userId',
                select: 'firstName lastName'
            }
        });

    if (!labResult) {
        throw new ApiError(404, "Lab result not found");
    }

    if (!labResult.isCritical) {
        throw new ApiError(400, "This lab result is not marked as critical");
    }

    // Verify doctor has relationship with patient
    const hasRelationship = await Appointment.findOne({
        doctorId: doctorId,
        patientId: labResult.patientId._id
    });

    if (!hasRelationship) {
        throw new ApiError(403, "Access denied. No patient relationship found.");
    }

    // Update acknowledgment
    const updatedLabResult = await LabResult.findByIdAndUpdate(
        resultId,
        {
            $set: {
                isAcknowledged: true,
                acknowledgedBy: doctorId,
                acknowledgedAt: new Date(),
                acknowledgmentNotes: acknowledgmentNotes || '',
                actionTaken: actionTaken || '',
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
    .populate({
        path: 'acknowledgedBy',
        select: 'firstName lastName specialization'
    });

    console.log('✅ Critical lab result acknowledged:', labResult.labResultNumber);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { labResult: updatedLabResult },
                "Critical lab result acknowledged successfully"
            )
        );
});

/**
 * GET LAB RESULT STATISTICS
 * Get lab result statistics for dashboard
 * 
 * GET /api/v1/lab-results/statistics
 * Requires: verifyJWT middleware
 */
const getLabResultStatistics = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { period = 'month', patientId, testType } = req.query;

    console.log("📊 Fetching lab result statistics for:", userRole, userId);

    // Build query based on user role
    const query = {};
    
    if (userRole === 'doctor') {
        const doctorAppointments = await Appointment.find({ doctorId: userId }).select('patientId');
        const patientIds = [...new Set(doctorAppointments.map(apt => apt.patientId.toString()))];
        query.patientId = { $in: patientIds };
    } else if (userRole === 'patient') {
        const patientUser = await User.findById(userId).populate('patientId');
        if (!patientUser?.patientId) {
            throw new ApiError(404, "Patient profile not found");
        }
        query.patientId = patientUser.patientId._id;
    }

    // Additional filters
    if (patientId) query.patientId = patientId;
    if (testType) query.testType = testType;

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

    query.reportedDate = dateRange;

    // Get statistics
    const totalResults = await LabResult.countDocuments(query);

    const testTypeStats = await LabResult.aggregate([
        { $match: query },
        { $group: { _id: '$testType', count: { $sum: 1 } } }
    ]);

    const statusStats = await LabResult.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const criticalStats = await LabResult.aggregate([
        { $match: query },
        { $group: { _id: '$isCritical', count: { $sum: 1 } } }
    ]);

    const monthlyTrend = await LabResult.aggregate([
        { $match: query },
        {
            $group: {
                _id: {
                    year: { $year: '$reportedDate' },
                    month: { $month: '$reportedDate' }
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
    ]);

    const statistics = {
        period,
        totalResults,
        byTestType: testTypeStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {}),
        byStatus: statusStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {}),
        criticalResults: criticalStats.find(stat => stat._id === true)?.count || 0,
        normalResults: criticalStats.find(stat => stat._id === false)?.count || 0,
        monthlyTrend: monthlyTrend.map(item => ({
            period: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
            count: item.count
        })),
        dateRange: {
            from: dateRange.$gte,
            to: dateRange.$lte
        }
    };

    console.log('✅ Lab result statistics fetched successfully');

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { statistics },
                "Lab result statistics fetched successfully"
            )
        );
});

// Helper functions

/**
 * Analyze lab results against reference ranges
 */
const analyzeLabResults = (results, referenceRange) => {
    return results.map(result => {
        const { testItem, value, unit } = result;
        const range = referenceRange[testItem];
        
        let isAbnormal = false;
        let isCritical = false;
        let interpretation = 'normal';
        
        if (range) {
            const [min, max] = range.split('-').map(Number);
            
            if (value < min) {
                isAbnormal = true;
                interpretation = 'low';
                // Check if critically low (more than 20% below minimum)
                isCritical = value < (min * 0.8);
            } else if (value > max) {
                isAbnormal = true;
                interpretation = 'high';
                // Check if critically high (more than 20% above maximum)
                isCritical = value > (max * 1.2);
            }
        }
        
        return {
            ...result,
            isAbnormal,
            isCritical,
            interpretation,
            referenceRange: range
        };
    });
};

/**
 * Generate lab test code based on test type
 */
const generateLabTestCode = (testType) => {
    const prefixes = {
        'blood_test': 'BLD',
        'urine_test': 'URN',
        'imaging': 'IMG',
        'biopsy': 'BIO',
        'culture': 'CUL',
        'genetic_test': 'GEN',
        'hormone_test': 'HORM',
        'allergy_test': 'ALG',
        'cancer_screening': 'CAN',
        'infectious_disease': 'INF',
        'metabolic_panel': 'MET',
        'cardiac_marker': 'CARD'
    };
    
    const prefix = prefixes[testType] || 'LAB';
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${random}`;
};

// Export all lab result controller functions
export {
    createLabResult,
    getLabResultById,
    getPatientLabResults,
    updateLabResultStatus,
    addLabReportFile,
    getCriticalLabResults,
    acknowledgeCriticalResult,
    getLabResultStatistics
};

/**
 * Additional lab result controllers that can be added:
 * - deleteLabResult (admin only with audit trail)
 * - searchLabResults (advanced search across all fields)
 * - exportLabResults (PDF/Excel export)
 * - getLabResultTrends (historical data analysis)
 * - bulkUploadLabResults (for lab systems integration)
 * - validateLabResult (quality control)
 * - getPendingLabResults (for lab technicians)
 * - reassignLabResult (to different technician)
 */