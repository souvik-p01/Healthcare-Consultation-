const LabTest = require('../models/LabTest');
const Technician = require('../models/Technician');
const Equipment = require('../models/Equipment');
const Notification = require('../models/Notification');

// @desc    Get all lab tests
// @route   GET /api/tests
// @access  Private (Technician/Admin)
exports.getTests = async (req, res, next) => {
  try {
    const {
      status,
      priority,
      testType,
      technicianId,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
      sortBy = 'requestedDate',
      sortOrder = 'desc'
    } = req.query;
    
    // Build filter
    const filter = {};
    
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (testType) filter.testType = testType;
    if (technicianId) filter.assignedTechnician = technicianId;
    
    // Date range filter
    if (startDate || endDate) {
      filter.requestedDate = {};
      if (startDate) filter.requestedDate.$gte = new Date(startDate);
      if (endDate) filter.requestedDate.$lte = new Date(endDate);
    }
    
    // Search filter
    if (search) {
      filter.$or = [
        { labCode: { $regex: search, $options: 'i' } },
        { 'patient.name': { $regex: search, $options: 'i' } },
        { testType: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Role-based filter
    if (req.user.role === 'technician') {
      const technician = await Technician.findOne({ user: req.user.id });
      if (technician) {
        filter.assignedTechnician = technician._id;
      }
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // If sorting by priority, add custom sort
    if (sortBy === 'priority') {
      const priorityOrder = { 'Emergency': 0, 'High': 1, 'Normal': 2, 'Low': 3 };
      // This would require aggregation pipeline for proper sorting
    }
    
    const tests = await LabTest.find(filter)
      .populate('patient', 'name age gender')
      .populate('doctor', 'name department')
      .populate('assignedTechnician', 'name role')
      .populate('assignedEquipment', 'name status')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await LabTest.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      count: tests.length,
      total,
      pages: Math.ceil(total / limit),
      data: tests
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single test
// @route   GET /api/tests/:id
// @access  Private (Technician/Admin)
exports.getTest = async (req, res, next) => {
  try {
    const test = await LabTest.findById(req.params.id)
      .populate('patient', 'name age gender contact')
      .populate('doctor', 'name department phone')
      .populate('assignedTechnician', 'name role employeeId')
      .populate('assignedEquipment', 'name type status')
      .populate('results.verifiedBy', 'name role');
    
    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Test not found'
      });
    }
    
    // Check authorization
    if (req.user.role === 'technician') {
      const technician = await Technician.findOne({ user: req.user.id });
      if (test.assignedTechnician.toString() !== technician._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to access this test'
        });
      }
    }
    
    res.status(200).json({
      success: true,
      data: test
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new lab test
// @route   POST /api/tests
// @access  Private (Technician/Admin)
exports.createTest = async (req, res, next) => {
  try {
    // Generate lab code
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    const count = await LabTest.countDocuments({
      requestedDate: {
        $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
      }
    });
    
    const labCode = `LAB-${year}${month}${day}-${(count + 1).toString().padStart(3, '0')}`;
    
    const testData = {
      ...req.body,
      labCode,
      requestedDate: date
    };
    
    // Auto-assign technician if not specified
    if (!testData.assignedTechnician && req.user.role === 'technician') {
      const technician = await Technician.findOne({ user: req.user.id });
      if (technician) {
        testData.assignedTechnician = technician._id;
      }
    }
    
    const test = await LabTest.create(testData);
    
    // Update technician's assigned tests if assigned
    if (test.assignedTechnician) {
      await Technician.findByIdAndUpdate(test.assignedTechnician, {
        $push: { assignedTests: test._id }
      });
      
      // Create notification for assigned technician
      const technician = await Technician.findById(test.assignedTechnician);
      if (technician && technician.user) {
        await Notification.create({
          recipient: technician.user,
          title: 'New Test Assigned',
          message: `New test ${labCode} has been assigned to you`,
          type: 'Test',
          category: 'info',
          relatedEntity: {
            entityType: 'LabTest',
            entityId: test._id
          },
          actionUrl: `/tests/${test._id}`
        });
      }
    }
    
    res.status(201).json({
      success: true,
      data: test
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update test
// @route   PUT /api/tests/:id
// @access  Private (Technician/Admin)
exports.updateTest = async (req, res, next) => {
  try {
    let test = await LabTest.findById(req.params.id);
    
    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Test not found'
      });
    }
    
    // Check authorization
    if (req.user.role === 'technician') {
      const technician = await Technician.findOne({ user: req.user.id });
      if (!technician || test.assignedTechnician.toString() !== technician._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to update this test'
        });
      }
      
      // Technicians can only update specific fields
      const allowedFields = ['status', 'testParameters', 'results', 'qualityCheck', 'notes'];
      Object.keys(req.body).forEach(key => {
        if (!allowedFields.includes(key)) {
          delete req.body[key];
        }
      });
    }
    
    // If status is changing to completed, set completion time
    if (req.body.status === 'Completed' && test.status !== 'Completed') {
      req.body.completionTime = new Date();
    }
    
    test = await LabTest.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: test
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete test
// @route   DELETE /api/tests/:id
// @access  Private (Admin only)
exports.deleteTest = async (req, res, next) => {
  try {
    const test = await LabTest.findById(req.params.id);
    
    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Test not found'
      });
    }
    
    // Remove from technician's assigned tests
    if (test.assignedTechnician) {
      await Technician.findByIdAndUpdate(test.assignedTechnician, {
        $pull: { assignedTests: test._id }
      });
    }
    
    // Free equipment if assigned
    if (test.assignedEquipment) {
      await Equipment.findByIdAndUpdate(test.assignedEquipment, {
        currentTest: null,
        status: 'Idle'
      });
    }
    
    await test.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign test to technician
// @route   POST /api/tests/:id/assign
// @access  Private (Admin/Supervisor)
exports.assignTest = async (req, res, next) => {
  try {
    const { technicianId, equipmentId } = req.body;
    
    const test = await LabTest.findById(req.params.id);
    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Test not found'
      });
    }
    
    // Remove from previous technician if any
    if (test.assignedTechnician) {
      await Technician.findByIdAndUpdate(test.assignedTechnician, {
        $pull: { assignedTests: test._id }
      });
    }
    
    // Free previous equipment if any
    if (test.assignedEquipment) {
      await Equipment.findByIdAndUpdate(test.assignedEquipment, {
        currentTest: null,
        status: test.status === 'Processing' ? 'Running' : 'Idle'
      });
    }
    
    // Update test
    test.assignedTechnician = technicianId;
    if (equipmentId) test.assignedEquipment = equipmentId;
    
    // Add to technician's assigned tests
    if (technicianId) {
      await Technician.findByIdAndUpdate(technicianId, {
        $push: { assignedTests: test._id }
      });
      
      // Create notification
      const technician = await Technician.findById(technicianId);
      if (technician && technician.user) {
        await Notification.create({
          recipient: technician.user,
          title: 'Test Assigned',
          message: `Test ${test.labCode} has been assigned to you`,
          type: 'Test',
          category: 'info',
          relatedEntity: {
            entityType: 'LabTest',
            entityId: test._id
          }
        });
      }
    }
    
    // Update equipment
    if (equipmentId) {
      await Equipment.findByIdAndUpdate(equipmentId, {
        assignedTechnician: technicianId,
        currentTest: test._id,
        status: test.status === 'Processing' ? 'Running' : 'Idle'
      });
      
      // Add to technician's assigned equipment
      if (technicianId) {
        await Technician.findByIdAndUpdate(technicianId, {
          $addToSet: { assignedEquipment: equipmentId }
        });
      }
    }
    
    await test.save();
    
    res.status(200).json({
      success: true,
      data: test
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get test statistics
// @route   GET /api/tests/stats
// @access  Private (Technician/Admin)
exports.getTestStatistics = async (req, res, next) => {
  try {
    const { period = 'day' } = req.query;
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    
    const filter = {
      requestedDate: { $gte: startDate }
    };
    
    // Role-based filter
    if (req.user.role === 'technician') {
      const technician = await Technician.findOne({ user: req.user.id });
      if (technician) {
        filter.assignedTechnician = technician._id;
      }
    }
    
    const tests = await LabTest.find(filter);
    
    // Calculate statistics
    const stats = {
      total: tests.length,
      byStatus: {},
      byPriority: {},
      byTestType: {},
      completionRate: 0,
      averageTurnaroundTime: 0
    };
    
    tests.forEach(test => {
      // Count by status
      stats.byStatus[test.status] = (stats.byStatus[test.status] || 0) + 1;
      
      // Count by priority
      stats.byPriority[test.priority] = (stats.byPriority[test.priority] || 0) + 1;
      
      // Count by test type
      stats.byTestType[test.testType] = (stats.byTestType[test.testType] || 0) + 1;
    });
    
    // Calculate completion rate
    const completedTests = tests.filter(t => t.status === 'Completed').length;
    stats.completionRate = tests.length > 0 ? (completedTests / tests.length) * 100 : 0;
    
    // Calculate average turnaround time
    const completedWithTime = tests.filter(t => t.status === 'Completed' && t.turnaroundTime);
    stats.averageTurnaroundTime = completedWithTime.length > 0
      ? completedWithTime.reduce((sum, t) => sum + t.turnaroundTime, 0) / completedWithTime.length
      : 0;
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};