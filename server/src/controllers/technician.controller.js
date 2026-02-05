const Technician = require('../models/Technician');
const LabTest = require('../models/LabTest');
const Equipment = require('../models/Equipment');
const Notification = require('../models/Notification');

// @desc    Get technician dashboard data
// @route   GET /api/technicians/dashboard
// @access  Private (Technician)
exports.getDashboard = async (req, res, next) => {
  try {
    const technicianId = req.user.id;
    
    // Get technician profile
    const technician = await Technician.findOne({ user: technicianId });
    
    if (!technician) {
      return res.status(404).json({
        success: false,
        error: 'Technician not found'
      });
    }
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get today's tests assigned to technician
    const todaysTests = await LabTest.find({
      assignedTechnician: technician._id,
      requestedDate: {
        $gte: today,
        $lt: tomorrow
      }
    }).countDocuments();
    
    // Get completed tests today
    const completedTests = await LabTest.find({
      assignedTechnician: technician._id,
      status: 'Completed',
      completionTime: {
        $gte: today,
        $lt: tomorrow
      }
    }).countDocuments();
    
    // Get active equipment assigned to technician
    const activeEquipment = await Equipment.find({
      assignedTechnician: technician._id,
      status: { $in: ['Running', 'Idle'] }
    }).countDocuments();
    
    // Get quality score (average from last 30 tests)
    const last30Tests = await LabTest.find({
      assignedTechnician: technician._id,
      'qualityCheck.status': 'Passed'
    })
    .sort({ completionTime: -1 })
    .limit(30);
    
    const qualityScore = last30Tests.length > 0 
      ? Math.round((last30Tests.filter(t => t.qualityCheck.status === 'Passed').length / last30Tests.length) * 100)
      : 0;
    
    // Get pending tests with high priority
    const pendingTests = await LabTest.find({
      assignedTechnician: technician._id,
      status: { $in: ['Pending', 'Scheduled', 'Processing', 'Waiting'] }
    })
    .populate('patient', 'name age')
    .populate('doctor', 'name')
    .sort({ priority: -1, requestedDate: 1 })
    .limit(10);
    
    // Get active equipment with details
    const equipmentList = await Equipment.find({
      assignedTechnician: technician._id,
      status: { $in: ['Running', 'Idle', 'Maintenance'] }
    })
    .select('name status specifications.temperature.current specifications.usage.current maintenance.lastMaintenance')
    .limit(5);
    
    res.status(200).json({
      success: true,
      data: {
        todayStats: {
          testsToday: todaysTests,
          reportsReady: completedTests,
          equipmentActive: activeEquipment,
          qualityScore: `${qualityScore}%`
        },
        pendingTests,
        activeEquipment: equipmentList,
        technician: {
          name: technician.name,
          role: technician.role,
          experience: technician.experience,
          department: technician.department,
          shift: technician.shift,
          nextBreak: technician.nextBreak,
          status: technician.status
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all lab tests assigned to technician
// @route   GET /api/technicians/tests
// @access  Private (Technician)
exports.getTechnicianTests = async (req, res, next) => {
  try {
    const technician = await Technician.findOne({ user: req.user.id });
    
    const { 
      status, 
      priority, 
      testType, 
      startDate, 
      endDate,
      page = 1,
      limit = 10
    } = req.query;
    
    // Build filter
    const filter = { assignedTechnician: technician._id };
    
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (testType) filter.testType = testType;
    if (startDate || endDate) {
      filter.requestedDate = {};
      if (startDate) filter.requestedDate.$gte = new Date(startDate);
      if (endDate) filter.requestedDate.$lte = new Date(endDate);
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const tests = await LabTest.find(filter)
      .populate('patient', 'name age gender')
      .populate('doctor', 'name department')
      .populate('assignedEquipment', 'name')
      .sort({ priority: -1, requestedDate: 1 })
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

// @desc    Start a lab test
// @route   POST /api/technicians/tests/:id/start
// @access  Private (Technician)
exports.startTest = async (req, res, next) => {
  try {
    const testId = req.params.id;
    const technician = await Technician.findOne({ user: req.user.id });
    
    const test = await LabTest.findOne({
      _id: testId,
      assignedTechnician: technician._id
    });
    
    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Test not found or not assigned to you'
      });
    }
    
    if (test.status === 'Completed') {
      return res.status(400).json({
        success: false,
        error: 'Test already completed'
      });
    }
    
    // Update test status
    test.status = 'Processing';
    test.startTime = new Date();
    
    // If equipment is assigned, update its status
    if (test.assignedEquipment) {
      await Equipment.findByIdAndUpdate(test.assignedEquipment, {
        status: 'Running',
        currentTest: test._id
      });
    }
    
    // Update technician status
    technician.status = 'busy';
    await technician.save();
    
    await test.save();
    
    // Create notification
    await Notification.create({
      recipient: req.user.id,
      title: 'Test Started',
      message: `You have started test ${test.labCode}`,
      type: 'Test',
      category: 'info',
      relatedEntity: {
        entityType: 'LabTest',
        entityId: test._id
      }
    });
    
    res.status(200).json({
      success: true,
      data: test
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete a lab test
// @route   POST /api/technicians/tests/:id/complete
// @access  Private (Technician)
exports.completeTest = async (req, res, next) => {
  try {
    const testId = req.params.id;
    const { results, qualityCheck } = req.body;
    const technician = await Technician.findOne({ user: req.user.id });
    
    const test = await LabTest.findOne({
      _id: testId,
      assignedTechnician: technician._id
    });
    
    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Test not found or not assigned to you'
      });
    }
    
    // Update test
    test.status = 'Completed';
    test.completionTime = new Date();
    test.results = results || test.results;
    test.qualityCheck = {
      ...test.qualityCheck,
      ...qualityCheck,
      performedBy: technician._id,
      performedAt: new Date()
    };
    
    // Free up equipment
    if (test.assignedEquipment) {
      await Equipment.findByIdAndUpdate(test.assignedEquipment, {
        status: 'Idle',
        currentTest: null,
        $inc: { 'operationalHours.total': test.turnaroundTime || 0 }
      });
    }
    
    // Update technician metrics
    technician.status = 'active';
    technician.performanceMetrics.testsCompleted += 1;
    
    if (test.qualityCheck.score) {
      const totalScore = (technician.performanceMetrics.qualityScore * 
                         (technician.performanceMetrics.testsCompleted - 1) + 
                         test.qualityCheck.score) / 
                         technician.performanceMetrics.testsCompleted;
      technician.performanceMetrics.qualityScore = Math.round(totalScore);
    }
    
    await technician.save();
    await test.save();
    
    // Create notification
    await Notification.create({
      recipient: req.user.id,
      title: 'Test Completed',
      message: `Test ${test.labCode} has been completed successfully`,
      type: 'Test',
      category: 'success',
      relatedEntity: {
        entityType: 'LabTest',
        entityId: test._id
      }
    });
    
    // TODO: Notify doctor about completed test
    
    res.status(200).json({
      success: true,
      data: test
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get technician's assigned equipment
// @route   GET /api/technicians/equipment
// @access  Private (Technician)
exports.getTechnicianEquipment = async (req, res, next) => {
  try {
    const technician = await Technician.findOne({ user: req.user.id });
    
    const equipment = await Equipment.find({
      assignedTechnician: technician._id
    })
    .populate('currentTest', 'labCode patient.name testType')
    .sort({ status: -1, name: 1 });
    
    res.status(200).json({
      success: true,
      count: equipment.length,
      data: equipment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Control equipment (start/stop)
// @route   POST /api/technicians/equipment/:id/control
// @access  Private (Technician)
exports.controlEquipment = async (req, res, next) => {
  try {
    const { action, temperature, settings } = req.body;
    const equipmentId = req.params.id;
    const technician = await Technician.findOne({ user: req.user.id });
    
    const equipment = await Equipment.findOne({
      _id: equipmentId,
      assignedTechnician: technician._id
    });
    
    if (!equipment) {
      return res.status(404).json({
        success: false,
        error: 'Equipment not found or not assigned to you'
      });
    }
    
    let newStatus = equipment.status;
    let message = '';
    
    switch (action) {
      case 'start':
        if (equipment.status === 'Maintenance' || equipment.status === 'Broken') {
          return res.status(400).json({
            success: false,
            error: `Cannot start equipment in ${equipment.status} status`
          });
        }
        newStatus = 'Running';
        message = 'Equipment started successfully';
        break;
        
      case 'stop':
        newStatus = 'Idle';
        message = 'Equipment stopped successfully';
        break;
        
      case 'maintenance':
        newStatus = 'Maintenance';
        message = 'Equipment put in maintenance mode';
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action'
        });
    }
    
    // Update equipment
    equipment.status = newStatus;
    
    if (temperature !== undefined && equipment.specifications.temperature) {
      equipment.specifications.temperature.current = temperature;
    }
    
    if (settings) {
      Object.keys(settings).forEach(key => {
        if (equipment.specifications[key]) {
          equipment.specifications[key] = {
            ...equipment.specifications[key],
            ...settings[key]
          };
        }
      });
    }
    
    await equipment.save();
    
    // Create alert if needed
    if (equipment.specifications.temperature && 
        equipment.specifications.temperature.current > equipment.specifications.temperature.max) {
      await equipment.alerts.push({
        type: 'Temperature',
        message: `High temperature detected: ${equipment.specifications.temperature.current}°C`,
        severity: 'High',
        timestamp: new Date()
      });
      await equipment.save();
    }
    
    res.status(200).json({
      success: true,
      message,
      data: equipment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update technician profile
// @route   PUT /api/technicians/profile
// @access  Private (Technician)
exports.updateProfile = async (req, res, next) => {
  try {
    const technician = await Technician.findOneAndUpdate(
      { user: req.user.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    if (!technician) {
      return res.status(404).json({
        success: false,
        error: 'Technician not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: technician
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get technician performance metrics
// @route   GET /api/technicians/performance
// @access  Private (Technician)
exports.getPerformanceMetrics = async (req, res, next) => {
  try {
    const technician = await Technician.findOne({ user: req.user.id });
    
    // Get last 30 days data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const testsLast30Days = await LabTest.find({
      assignedTechnician: technician._id,
      completionTime: { $gte: thirtyDaysAgo }
    });
    
    // Calculate metrics
    const dailyTests = {};
    testsLast30Days.forEach(test => {
      const date = test.completionTime.toISOString().split('T')[0];
      if (!dailyTests[date]) dailyTests[date] = 0;
      dailyTests[date]++;
    });
    
    const averageTurnaroundTime = testsLast30Days.length > 0
      ? testsLast30Days.reduce((sum, test) => sum + (test.turnaroundTime || 0), 0) / testsLast30Days.length
      : 0;
    
    const successRate = testsLast30Days.length > 0
      ? (testsLast30Days.filter(t => t.qualityCheck.status === 'Passed').length / testsLast30Days.length) * 100
      : 0;
    
    res.status(200).json({
      success: true,
      data: {
        overallMetrics: technician.performanceMetrics,
        last30Days: {
          totalTests: testsLast30Days.length,
          dailyTests: Object.entries(dailyTests).map(([date, count]) => ({ date, count })),
          averageTurnaroundTime: Math.round(averageTurnaroundTime),
          successRate: Math.round(successRate * 100) / 100
        },
        recentTests: testsLast30Days.slice(0, 10).map(test => ({
          labCode: test.labCode,
          testType: test.testType,
          completionTime: test.completionTime,
          qualityScore: test.qualityCheck.score,
          status: test.qualityCheck.status
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};