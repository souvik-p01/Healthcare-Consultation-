/**
 * Healthcare System - Database Operations Utility
 * 
 * Common database operations and healthcare-specific queries optimized
 * for medical data handling, patient records, and HIPAA compliance.
 * 
 * Features:
 * - Healthcare-optimized pagination
 * - Medical record aggregation pipelines
 * - Patient data queries with privacy controls
 * - Appointment scheduling queries
 * - Medical analytics aggregations
 * - Database transaction helpers
 * - Search functionality for medical records
 */

import mongoose from 'mongoose';

/**
 * Database Configuration for Healthcare Operations
 */
const DB_CONFIG = {
    // Default pagination settings for medical records
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100,
    
    // Search configuration
    SEARCH_SCORE_THRESHOLD: 0.5,
    MAX_SEARCH_RESULTS: 100,
    
    // Aggregation limits for performance
    MAX_AGGREGATION_RESULTS: 1000,
    
    // Healthcare-specific indexes that should exist
    REQUIRED_INDEXES: {
        patients: ['medicalRecordNumber', 'email', 'phoneNumber', 'dateOfBirth'],
        appointments: ['patientId', 'doctorId', 'appointmentDate', 'status'],
        medicalRecords: ['patientId', 'recordType', 'createdAt'],
        prescriptions: ['patientId', 'doctorId', 'prescriptionDate', 'status']
    }
};

/**
 * Generate healthcare-optimized pagination options
 * 
 * @param {number} page - Page number (1-based)
 * @param {number} limit - Number of items per page
 * @param {number} maxLimit - Maximum allowed limit
 * @returns {Object} - Pagination options
 */
export const getPaginationOptions = (page = 1, limit = DB_CONFIG.DEFAULT_PAGE_SIZE, maxLimit = DB_CONFIG.MAX_PAGE_SIZE) => {
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(parseInt(limit), maxLimit);
    const skip = (pageNum - 1) * limitNum;
    
    return {
        skip,
        limit: limitNum,
        page: pageNum,
        
        // Helper function to calculate total pages
        getTotalPages: (totalDocuments) => Math.ceil(totalDocuments / limitNum),
        
        // Helper function to check if there are more pages
        hasNextPage: (totalDocuments) => skip + limitNum < totalDocuments,
        hasPreviousPage: () => pageNum > 1
    };
};

/**
 * Generate unique Medical Record Number (MRN)
 * 
 * @param {Object} Model - Mongoose model to check uniqueness
 * @param {string} prefix - MRN prefix (default: 'MRN')
 * @param {number} length - Number length (default: 6)
 * @returns {string} - Unique MRN
 */
export const generateUniqueMRN = async (Model, prefix = 'MRN', length = 6) => {
    let isUnique = false;
    let mrn;
    let attempts = 0;
    const maxAttempts = 100;
    
    while (!isUnique && attempts < maxAttempts) {
        const number = Math.floor(Math.pow(10, length - 1) + Math.random() * (Math.pow(10, length) - Math.pow(10, length - 1)));
        mrn = `${prefix}${number}`;
        
        const existing = await Model.findOne({ medicalRecordNumber: mrn });
        if (!existing) {
            isUnique = true;
        }
        
        attempts++;
    }
    
    if (!isUnique) {
        throw new Error('Unable to generate unique MRN after maximum attempts');
    }
    
    console.log(`✅ Generated unique MRN: ${mrn} (attempts: ${attempts})`);
    return mrn;
};

/**
 * Healthcare aggregation pipeline for patient reports
 * 
 * @param {string} patientId - Patient ID
 * @param {Date} startDate - Report start date
 * @param {Date} endDate - Report end date
 * @param {Array} recordTypes - Types of records to include
 * @returns {Array} - Aggregation pipeline
 */
export const getPatientReportPipeline = (patientId, startDate, endDate, recordTypes = []) => {
    const pipeline = [
        {
            $match: {
                patientId: new mongoose.Types.ObjectId(patientId),
                createdAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            }
        }
    ];
    
    // Add record type filter if specified
    if (recordTypes.length > 0) {
        pipeline[0].$match.recordType = { $in: recordTypes };
    }
    
    pipeline.push(
        // Join with doctor information
        {
            $lookup: {
                from: 'users',
                localField: 'doctorId',
                foreignField: '_id',
                as: 'doctorInfo',
                pipeline: [
                    {
                        $project: {
                            firstName: 1,
                            lastName: 1,
                            specialization: 1,
                            medicalLicense: 1
                        }
                    }
                ]
            }
        },
        
        // Join with patient information (limited fields for privacy)
        {
            $lookup: {
                from: 'patients',
                localField: 'patientId',
                foreignField: '_id',
                as: 'patientInfo',
                pipeline: [
                    {
                        $project: {
                            firstName: 1,
                            lastName: 1,
                            medicalRecordNumber: 1,
                            dateOfBirth: 1
                        }
                    }
                ]
            }
        },
        
        // Group by record type for summary
        {
            $group: {
                _id: '$recordType',
                count: { $sum: 1 },
                records: { 
                    $push: {
                        _id: '$_id',
                        title: '$title',
                        description: '$description',
                        createdAt: '$createdAt',
                        updatedAt: '$updatedAt',
                        doctorInfo: { $arrayElemAt: ['$doctorInfo', 0] },
                        patientInfo: { $arrayElemAt: ['$patientInfo', 0] },
                        attachments: '$attachments',
                        status: '$status'
                    }
                },
                latestRecord: { $max: '$createdAt' },
                oldestRecord: { $min: '$createdAt' }
            }
        },
        
        // Sort by record type
        {
            $sort: { _id: 1 }
        },
        
        // Limit results for performance
        {
            $limit: DB_CONFIG.MAX_AGGREGATION_RESULTS
        }
    );
    
    return pipeline;
};

/**
 * Appointment analytics aggregation pipeline
 * 
 * @param {Date} startDate - Analysis start date
 * @param {Date} endDate - Analysis end date
 * @param {Object} filters - Additional filters
 * @returns {Array} - Aggregation pipeline
 */
export const getAppointmentAnalyticsPipeline = (startDate, endDate, filters = {}) => {
    const matchStage = {
        appointmentDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        }
    };
    
    // Add additional filters
    if (filters.doctorId) {
        matchStage.doctorId = new mongoose.Types.ObjectId(filters.doctorId);
    }
    
    if (filters.department) {
        matchStage.department = filters.department;
    }
    
    if (filters.status) {
        matchStage.status = { $in: Array.isArray(filters.status) ? filters.status : [filters.status] };
    }
    
    return [
        { $match: matchStage },
        
        // Join with doctor information
        {
            $lookup: {
                from: 'users',
                localField: 'doctorId',
                foreignField: '_id',
                as: 'doctorInfo',
                pipeline: [
                    {
                        $project: {
                            firstName: 1,
                            lastName: 1,
                            specialization: 1,
                            department: 1
                        }
                    }
                ]
            }
        },
        
        // Join with patient information
        {
            $lookup: {
                from: 'patients',
                localField: 'patientId',
                foreignField: '_id',
                as: 'patientInfo',
                pipeline: [
                    {
                        $project: {
                            firstName: 1,
                            lastName: 1,
                            age: {
                                $dateDiff: {
                                    startDate: '$dateOfBirth',
                                    endDate: '$$NOW',
                                    unit: 'year'
                                }
                            }
                        }
                    }
                ]
            }
        },
        
        // Analytics groupings
        {
            $facet: {
                // Appointments by status
                byStatus: [
                    { $group: { _id: '$status', count: { $sum: 1 } } },
                    { $sort: { count: -1 } }
                ],
                
                // Appointments by doctor
                byDoctor: [
                    {
                        $group: {
                            _id: '$doctorId',
                            count: { $sum: 1 },
                            doctorInfo: { $first: { $arrayElemAt: ['$doctorInfo', 0] } }
                        }
                    },
                    { $sort: { count: -1 } },
                    { $limit: 20 }
                ],
                
                // Appointments by department
                byDepartment: [
                    {
                        $group: {
                            _id: { $arrayElemAt: ['$doctorInfo.department', 0] },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { count: -1 } }
                ],
                
                // Daily appointment trends
                dailyTrend: [
                    {
                        $group: {
                            _id: { $dateToString: { format: '%Y-%m-%d', date: '$appointmentDate' } },
                            count: { $sum: 1 },
                            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                            cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
                        }
                    },
                    { $sort: { _id: 1 } }
                ],
                
                // Patient age demographics
                ageGroups: [
                    {
                        $addFields: {
                            ageGroup: {
                                $switch: {
                                    branches: [
                                        { case: { $lt: [{ $arrayElemAt: ['$patientInfo.age', 0] }, 18] }, then: '0-17' },
                                        { case: { $lt: [{ $arrayElemAt: ['$patientInfo.age', 0] }, 30] }, then: '18-29' },
                                        { case: { $lt: [{ $arrayElemAt: ['$patientInfo.age', 0] }, 45] }, then: '30-44' },
                                        { case: { $lt: [{ $arrayElemAt: ['$patientInfo.age', 0] }, 60] }, then: '45-59' },
                                        { case: { $lt: [{ $arrayElemAt: ['$patientInfo.age', 0] }, 75] }, then: '60-74' }
                                    ],
                                    default: '75+'
                                }
                            }
                        }
                    },
                    { $group: { _id: '$ageGroup', count: { $sum: 1 } } },
                    { $sort: { _id: 1 } }
                ]
            }
        }
    ];
};

/**
 * Advanced patient search pipeline with text search and filters
 * 
 * @param {string} searchQuery - Search query
 * @param {Object} filters - Search filters
 * @param {Object} pagination - Pagination options
 * @returns {Array} - Aggregation pipeline
 */
export const getPatientSearchPipeline = (searchQuery, filters = {}, pagination = {}) => {
    const pipeline = [];
    
    // Text search stage
    if (searchQuery) {
        pipeline.push({
            $match: {
                $or: [
                    { $text: { $search: searchQuery } },
                    { firstName: { $regex: searchQuery, $options: 'i' } },
                    { lastName: { $regex: searchQuery, $options: 'i' } },
                    { medicalRecordNumber: { $regex: searchQuery, $options: 'i' } },
                    { email: { $regex: searchQuery, $options: 'i' } }
                ]
            }
        });
    }
    
    // Apply filters
    const matchFilters = {};
    
    if (filters.ageMin || filters.ageMax) {
        const now = new Date();
        if (filters.ageMax) {
            matchFilters.dateOfBirth = { 
                $gte: new Date(now.getFullYear() - filters.ageMax - 1, now.getMonth(), now.getDate()) 
            };
        }
        if (filters.ageMin) {
            matchFilters.dateOfBirth = { 
                ...matchFilters.dateOfBirth,
                $lte: new Date(now.getFullYear() - filters.ageMin, now.getMonth(), now.getDate()) 
            };
        }
    }
    
    if (filters.gender) {
        matchFilters.gender = filters.gender;
    }
    
    if (filters.insuranceProvider) {
        matchFilters['insurance.providerName'] = { $regex: filters.insuranceProvider, $options: 'i' };
    }
    
    if (Object.keys(matchFilters).length > 0) {
        pipeline.push({ $match: matchFilters });
    }
    
    // Add calculated fields
    pipeline.push({
        $addFields: {
            age: {
                $dateDiff: {
                    startDate: '$dateOfBirth',
                    endDate: '$NOW',
                    unit: 'year'
                }
            },
            fullName: { $concat: ['$firstName', ' ', '$lastName'] },
            searchScore: searchQuery ? { $meta: 'textScore' } : 1
        }
    });
    
    // Join with recent appointments
    pipeline.push({
        $lookup: {
            from: 'appointments',
            localField: '_id',
            foreignField: 'patientId',
            as: 'recentAppointments',
            pipeline: [
                { $sort: { appointmentDate: -1 } },
                { $limit: 3 },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'doctorId',
                        foreignField: '_id',
                        as: 'doctor',
                        pipeline: [{ $project: { firstName: 1, lastName: 1, specialization: 1 } }]
                    }
                },
                {
                    $project: {
                        appointmentDate: 1,
                        status: 1,
                        type: 1,
                        doctor: { $arrayElemAt: ['$doctor', 0] }
                    }
                }
            ]
        }
    });
    
    // Project final fields (HIPAA compliance - limit exposed data)
    pipeline.push({
        $project: {
            medicalRecordNumber: 1,
            firstName: 1,
            lastName: 1,
            fullName: 1,
            email: 1,
            phoneNumber: 1,
            dateOfBirth: 1,
            age: 1,
            gender: 1,
            address: {
                street: '$address.street',
                city: '$address.city',
                state: '$address.state',
                zipCode: '$address.zipCode'
            },
            insurance: {
                providerName: '$insurance.providerName',
                policyNumber: { $substr: ['$insurance.policyNumber', -4, 4] } // Last 4 digits only
            },
            recentAppointments: 1,
            searchScore: 1,
            createdAt: 1,
            updatedAt: 1
        }
    });
    
    // Sort by relevance
    if (searchQuery) {
        pipeline.push({ $sort: { searchScore: { $meta: 'textScore' }, updatedAt: -1 } });
    } else {
        pipeline.push({ $sort: { updatedAt: -1 } });
    }
    
    // Apply pagination
    if (pagination.skip) {
        pipeline.push({ $skip: pagination.skip });
    }
    
    if (pagination.limit) {
        pipeline.push({ $limit: pagination.limit });
    }
    
    return pipeline;
};

/**
 * Medical records aggregation for patient timeline
 * 
 * @param {string} patientId - Patient ID
 * @param {Object} options - Timeline options
 * @returns {Array} - Aggregation pipeline
 */
export const getPatientTimelinePipeline = (patientId, options = {}) => {
    const pipeline = [
        {
            $match: {
                patientId: new mongoose.Types.ObjectId(patientId)
            }
        }
    ];
    
    // Date range filter
    if (options.startDate || options.endDate) {
        const dateMatch = {};
        if (options.startDate) dateMatch.$gte = new Date(options.startDate);
        if (options.endDate) dateMatch.$lte = new Date(options.endDate);
        pipeline[0].$match.createdAt = dateMatch;
    }
    
    // Record type filter
    if (options.recordTypes && options.recordTypes.length > 0) {
        pipeline[0].$match.recordType = { $in: options.recordTypes };
    }
    
    pipeline.push(
        // Join with doctor information
        {
            $lookup: {
                from: 'users',
                localField: 'doctorId',
                foreignField: '_id',
                as: 'doctor',
                pipeline: [
                    {
                        $project: {
                            firstName: 1,
                            lastName: 1,
                            specialization: 1,
                            department: 1
                        }
                    }
                ]
            }
        },
        
        // Join with related prescriptions
        {
            $lookup: {
                from: 'prescriptions',
                localField: '_id',
                foreignField: 'medicalRecordId',
                as: 'prescriptions',
                pipeline: [
                    {
                        $project: {
                            medicationName: 1,
                            dosage: 1,
                            frequency: 1,
                            status: 1,
                            prescriptionDate: 1
                        }
                    }
                ]
            }
        },
        
        // Join with related lab results
        {
            $lookup: {
                from: 'labresults',
                localField: '_id',
                foreignField: 'medicalRecordId',
                as: 'labResults',
                pipeline: [
                    {
                        $project: {
                            testName: 1,
                            result: 1,
                            normalRange: 1,
                            unit: 1,
                            status: 1,
                            resultDate: 1
                        }
                    }
                ]
            }
        },
        
        // Group by date for timeline view
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                records: {
                    $push: {
                        _id: '$_id',
                        recordType: '$recordType',
                        title: '$title',
                        description: '$description',
                        diagnosis: '$diagnosis',
                        treatment: '$treatment',
                        createdAt: '$createdAt',
                        doctor: { $arrayElemAt: ['$doctor', 0] },
                        prescriptions: '$prescriptions',
                        labResults: '$labResults',
                        attachments: '$attachments',
                        status: '$status',
                        priority: '$priority'
                    }
                },
                recordCount: { $sum: 1 }
            }
        },
        
        // Sort by date (most recent first)
        {
            $sort: { _id: -1 }
        },
        
        // Limit for performance
        {
            $limit: options.limit || 100
        }
    );
    
    return pipeline;
};

/**
 * Doctor availability aggregation pipeline
 * 
 * @param {Date} startDate - Start date for availability check
 * @param {Date} endDate - End date for availability check
 * @param {Object} filters - Additional filters
 * @returns {Array} - Aggregation pipeline
 */
export const getDoctorAvailabilityPipeline = (startDate, endDate, filters = {}) => {
    const matchStage = {
        role: 'doctor',
        isActive: true
    };
    
    // Add department filter if specified
    if (filters.department) {
        matchStage.department = filters.department;
    }
    
    // Add specialization filter if specified
    if (filters.specialization) {
        matchStage.specialization = filters.specialization;
    }
    
    return [
        { $match: matchStage },
        
        // Join with appointments in the date range
        {
            $lookup: {
                from: 'appointments',
                let: { doctorId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$doctorId', '$doctorId'] },
                            appointmentDate: {
                                $gte: new Date(startDate),
                                $lte: new Date(endDate)
                            },
                            status: { $in: ['scheduled', 'confirmed'] }
                        }
                    },
                    {
                        $project: {
                            appointmentDate: 1,
                            duration: 1,
                            status: 1
                        }
                    }
                ],
                as: 'appointments'
            }
        },
        
        // Join with doctor schedule/working hours
        {
            $lookup: {
                from: 'doctorschedules',
                localField: '_id',
                foreignField: 'doctorId',
                as: 'schedule'
            }
        },
        
        // Calculate availability
        {
            $addFields: {
                totalAppointments: { $size: '$appointments' },
                workingHours: { $arrayElemAt: ['$schedule.workingHours', 0] },
                availableSlots: {
                    $subtract: [
                        { $arrayElemAt: ['$schedule.maxAppointmentsPerDay', 0] },
                        { $size: '$appointments' }
                    ]
                }
            }
        },
        
        // Project final fields
        {
            $project: {
                firstName: 1,
                lastName: 1,
                specialization: 1,
                department: 1,
                email: 1,
                phoneNumber: 1,
                medicalLicense: 1,
                totalAppointments: 1,
                availableSlots: 1,
                workingHours: 1,
                appointments: 1,
                isAvailable: { $gt: ['$availableSlots', 0] }
            }
        },
        
        // Sort by availability
        {
            $sort: { availableSlots: -1, lastName: 1 }
        }
    ];
};

/**
 * Database transaction helper for healthcare operations
 * 
 * @param {Function} operations - Function containing database operations
 * @param {Object} options - Transaction options
 * @returns {Promise} - Transaction result
 */
export const executeTransaction = async (operations, options = {}) => {
    const session = await mongoose.startSession();
    
    try {
        session.startTransaction({
            readConcern: { level: 'majority' },
            writeConcern: { w: 'majority', j: true },
            ...options
        });
        
        console.log('🔄 Starting healthcare database transaction');
        
        const result = await operations(session);
        
        await session.commitTransaction();
        console.log('✅ Healthcare database transaction committed successfully');
        
        return result;
        
    } catch (error) {
        await session.abortTransaction();
        console.error('❌ Healthcare database transaction aborted:', error);
        throw error;
        
    } finally {
        session.endSession();
    }
};

/**
 * Batch insert with validation for healthcare records
 * 
 * @param {Object} Model - Mongoose model
 * @param {Array} documents - Documents to insert
 * @param {Object} options - Insert options
 * @returns {Object} - Insert results
 */
export const batchInsertHealthcareRecords = async (Model, documents, options = {}) => {
    if (!Array.isArray(documents) || documents.length === 0) {
        throw new Error('Documents must be a non-empty array');
    }
    
    const batchSize = options.batchSize || 100;
    const results = {
        successful: [],
        failed: [],
        totalProcessed: 0
    };
    
    console.log(`📊 Starting batch insert of ${documents.length} healthcare records`);
    
    for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        
        try {
            const insertedDocs = await Model.insertMany(batch, {
                ordered: false, // Continue on individual document errors
                ...options
            });
            
            results.successful.push(...insertedDocs);
            results.totalProcessed += batch.length;
            
            console.log(`✅ Batch ${Math.floor(i / batchSize) + 1}: ${insertedDocs.length} records inserted`);
            
        } catch (error) {
            console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} error:`, error);
            
            if (error.writeErrors) {
                results.failed.push(...error.writeErrors.map(err => ({
                    index: err.index,
                    error: err.errmsg,
                    document: batch[err.index]
                })));
                
                // Add successful documents from this batch
                if (error.result && error.result.insertedIds) {
                    const successfulInBatch = Object.keys(error.result.insertedIds).map(index => 
                        batch[parseInt(index)]
                    );
                    results.successful.push(...successfulInBatch);
                }
            } else {
                // Entire batch failed
                results.failed.push(...batch.map((doc, index) => ({
                    index: i + index,
                    error: error.message,
                    document: doc
                })));
            }
            
            results.totalProcessed += batch.length;
        }
    }
    
    console.log(`📊 Batch insert completed: ${results.successful.length} successful, ${results.failed.length} failed`);
    
    return results;
};

/**
 * Create healthcare database indexes for optimal performance
 * 
 * @param {Object} models - Object containing all mongoose models
 * @returns {Promise} - Index creation results
 */
export const createHealthcareIndexes = async (models) => {
    const indexResults = {};
    
    console.log('🔧 Creating healthcare database indexes...');
    
    try {
        // Patient model indexes
        if (models.Patient) {
            await models.Patient.createIndexes([
                { key: { medicalRecordNumber: 1 }, unique: true },
                { key: { email: 1 }, unique: true },
                { key: { phoneNumber: 1 } },
                { key: { dateOfBirth: 1 } },
                { key: { firstName: 'text', lastName: 'text', medicalRecordNumber: 'text' } },
                { key: { 'insurance.providerName': 1 } },
                { key: { createdAt: -1 } }
            ]);
            indexResults.Patient = 'Created';
        }
        
        // Appointment model indexes
        if (models.Appointment) {
            await models.Appointment.createIndexes([
                { key: { patientId: 1, appointmentDate: 1 } },
                { key: { doctorId: 1, appointmentDate: 1 } },
                { key: { appointmentDate: 1, status: 1 } },
                { key: { status: 1 } },
                { key: { department: 1, appointmentDate: 1 } }
            ]);
            indexResults.Appointment = 'Created';
        }
        
        // Medical Record model indexes
        if (models.MedicalRecord) {
            await models.MedicalRecord.createIndexes([
                { key: { patientId: 1, createdAt: -1 } },
                { key: { doctorId: 1, createdAt: -1 } },
                { key: { recordType: 1, createdAt: -1 } },
                { key: { diagnosis: 'text', treatment: 'text', description: 'text' } },
                { key: { status: 1 } },
                { key: { priority: 1, createdAt: -1 } }
            ]);
            indexResults.MedicalRecord = 'Created';
        }
        
        // Prescription model indexes
        if (models.Prescription) {
            await models.Prescription.createIndexes([
                { key: { patientId: 1, prescriptionDate: -1 } },
                { key: { doctorId: 1, prescriptionDate: -1 } },
                { key: { status: 1, prescriptionDate: -1 } },
                { key: { medicationName: 'text' } },
                { key: { expiryDate: 1 } }
            ]);
            indexResults.Prescription = 'Created';
        }
        
        // User model indexes (for doctors, patients, staff)
        if (models.User) {
            await models.User.createIndexes([
                { key: { email: 1 }, unique: true },
                { key: { role: 1, isActive: 1 } },
                { key: { department: 1, specialization: 1 } },
                { key: { medicalLicense: 1 }, sparse: true },
                { key: { firstName: 'text', lastName: 'text' } }
            ]);
            indexResults.User = 'Created';
        }
        
        console.log('✅ Healthcare database indexes created successfully');
        return indexResults;
        
    } catch (error) {
        console.error('❌ Error creating healthcare indexes:', error);
        throw error;
    }
};

/**
 * Database health check for healthcare system
 * 
 * @returns {Object} - Database health status
 */
export const checkDatabaseHealth = async () => {
    const health = {
        status: 'unknown',
        connection: 'unknown',
        collections: {},
        performance: {},
        timestamp: new Date().toISOString()
    };
    
    try {
        // Check connection
        const connectionState = mongoose.connection.readyState;
        health.connection = connectionState === 1 ? 'connected' : 'disconnected';
        
        if (connectionState !== 1) {
            health.status = 'unhealthy';
            return health;
        }
        
        // Check collections and document counts
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        
        for (const collection of collections) {
            const collectionName = collection.name;
            const count = await db.collection(collectionName).countDocuments();
            health.collections[collectionName] = { documentCount: count };
        }
        
        // Performance check - simple query timing
        const startTime = Date.now();
        await db.collection('patients').findOne({});
        const queryTime = Date.now() - startTime;
        
        health.performance.sampleQueryTime = `${queryTime}ms`;
        health.performance.status = queryTime < 100 ? 'good' : queryTime < 500 ? 'fair' : 'slow';
        
        health.status = 'healthy';
        
    } catch (error) {
        health.status = 'unhealthy';
        health.error = error.message;
    }
    
    return health;
};

// Export database configuration for use in other modules
export { DB_CONFIG };

/**
 * Usage Examples:
 * 
 * // Get paginated patient list
 * const pagination = getPaginationOptions(1, 20);
 * const patients = await Patient.find({}).skip(pagination.skip).limit(pagination.limit);
 * 
 * // Generate unique MRN
 * const mrn = await generateUniqueMRN(Patient, 'HC', 8);
 * 
 * // Get patient report
 * const pipeline = getPatientReportPipeline(patientId, startDate, endDate, ['diagnosis', 'prescription']);
 * const report = await MedicalRecord.aggregate(pipeline);
 * 
 * // Execute transaction
 * const result = await executeTransaction(async (session) => {
 *     const appointment = await Appointment.create([appointmentData], { session });
 *     const notification = await Notification.create([notificationData], { session });
 *     return { appointment, notification };
 * });
 * 
 * // Create indexes
 * await createHealthcareIndexes({ Patient, Appointment, MedicalRecord, Prescription, User });
 */