const Equipment = require('../models/Equipment');
const Technician = require('../models/Technician');
const LabTest = require('../models/LabTest');
const Notification = require('../models/Notification');

// @desc    Get all equipment
// @route   GET /api/equipment
// @access  Private
exports.getEquipment = async (req, res, next) => {
  try {
    const {
      status,
      type,
      search,
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;
    
    // Build filter
    const filter = {};
    
    if (status) filter.status = status;
    if (type) filter.type = type;
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { equipmentId: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
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
    
    const equipment = await Equipment.find(filter)
      .populate('currentTest', 'labCode patient.name testType')
      .populate('assignedTechnician', 'name role')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Equipment.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      count: equipment.length,
      total,
      pages: Math.ceil(total / limit),
      data: equipment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single equipment
// @route   GET /api/equipment/:id
// @access  Private
exports.getEquipmentById = async (req, res, next) => {
  try {
    const equipment = await Equipment.findById(req.params.id)
      .populate('currentTest', 'labCode patient.name testType status')
      .populate('assignedTechnician', 'name role employeeId')
      .populate('alerts.resolvedBy', 'name');
    
    if (!equipment) {
      return res.status(404).json({
        success: false,
        error: 'Equipment not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: equipment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new equipment
// @route   POST /api/equipment
// @access  Private (Admin/Supervisor)
exports.createEquipment = async (req, res, next) => {
  try {
    // Generate equipment ID
    const count = await Equipment.countDocuments({ type: req.body.type });
    const equipmentId = `${req.body.type.substring(0, 3).toUpperCase()}-${(count + 1).toString().padStart(4, '0')}`;
    
    const equipmentData = {
      ...req.body,
      equipmentId
    };
    
    const equipment = await Equipment.create(equipmentData);
    
    res.status(201).json({
      success: true,
      data: equipment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update equipment
// @route   PUT /api/equipment/:id
// @access  Private
exports.updateEquipment = async (req, res, next) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({
        success: false,
        error: 'Equipment not found'
      });
    }
    
    // Check if technician is assigned to this equipment
    if (req.user.role === 'technician') {
      const technician = await Technician.findOne({ user: req.user.id });
      if (!technician || equipment.assignedTechnician.toString() !== technician._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to update this equipment'
        });
      }
      
      // Technicians can only update specific fields
      const allowedFields = ['status', 'specifications', 'alerts'];
      Object.keys(req.body).forEach(key => {
        if (!allowedFields.includes(key)) {
          delete req.body[key];
        }
      });
    }
    
    const updatedEquipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: updatedEquipment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete equipment
// @route   DELETE /api/equipment/:id
// @access  Private (Admin only)
exports.deleteEquipment = async (req, res, next) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({
        success: false,
        error: 'Equipment not found'
      });
    }
    
    // Check if equipment is in use
    if (equipment.status === 'Running' || equipment.currentTest) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete equipment that is currently in use'
      });
    }
    
    // Remove from technician's assigned equipment
    if (equipment.assignedTechnician) {
      await Technician.findByIdAndUpdate(equipment.assignedTechnician, {
        $pull: { assignedEquipment: equipment._id }
      });
    }
    
    await equipment.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Schedule maintenance
// @route   POST /api/equipment/:id/maintenance
// @access  Private
exports.scheduleMaintenance = async (req, res, next) => {
  try {
    const { type, notes, scheduledDate, estimatedDuration } = req.body;
    
    const equipment = await Equipment.findById(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({
        success: false,
        error: 'Equipment not found'
      });
    }
    
    // Add to maintenance history
    equipment.maintenance.maintenanceHistory.push({
      date: new Date(),
      type,
      performedBy: req.user.id,
      notes,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
      estimatedDuration
    });
    
    // Set next maintenance date
    if (equipment.maintenance.maintenanceInterval) {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + equipment.maintenance.maintenanceInterval);
      equipment.maintenance.nextMaintenance = nextDate;
    }
    
    // Update status
    equipment.status = 'Maintenance';
    
    // Cancel current test if any
    if (equipment.currentTest) {
      await LabTest.findByIdAndUpdate(equipment.currentTest, {
        status: 'On Hold',
        notes: `Equipment under maintenance: ${notes}`
      });
      equipment.currentTest = null;
    }
    
    await equipment.save();
    
    // Create notifications
    if (equipment.assignedTechnician) {
      const technician = await Technician.findById(equipment.assignedTechnician);
      if (technician && technician.user) {
        await Notification.create({
          recipient: technician.user,
          title: 'Maintenance Scheduled',
          message: `Maintenance scheduled for ${equipment.name}: ${notes}`,
          type: 'Maintenance',
          category: 'warning',
          relatedEntity: {
            entityType: 'Equipment',
            entityId: equipment._id
          }
        });
      }
    }
    
    res.status(200).json({
      success: true,
      data: equipment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete maintenance
// @route   POST /api/equipment/:id/maintenance/complete
// @access  Private
exports.completeMaintenance = async (req, res, next) => {
  try {
    const { actualDuration, cost, notes } = req.body;
    
    const equipment = await Equipment.findById(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({
        success: false,
        error: 'Equipment not found'
      });
    }
    
    // Find and update the latest maintenance record
    const latestMaintenance = equipment.maintenance.maintenanceHistory[equipment.maintenance.maintenanceHistory.length - 1];
    if (latestMaintenance) {
      latestMaintenance.completedAt = new Date();
      latestMaintenance.actualDuration = actualDuration;
      latestMaintenance.cost = cost;
      latestMaintenance.completionNotes = notes;
    }
    
    // Update last maintenance date
    equipment.maintenance.lastMaintenance = new Date();
    
    // Set status back to Idle
    equipment.status = 'Idle';
    
    await equipment.save();
    
    res.status(200).json({
      success: true,
      data: equipment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create equipment alert
// @route   POST /api/equipment/:id/alerts
// @access  Private
exports.createAlert = async (req, res, next) => {
  try {
    const { type, message, severity } = req.body;
    
    const equipment = await Equipment.findById(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({
        success: false,
        error: 'Equipment not found'
      });
    }
    
    // Add alert
    equipment.alerts.push({
      type,
      message,
      severity: severity || 'Medium',
      timestamp: new Date()
    });
    
    await equipment.save();
    
    // Create notifications for assigned technician and admins
    const notifications = [];
    
    if (equipment.assignedTechnician) {
      const technician = await Technician.findById(equipment.assignedTechnician);
      if (technician && technician.user) {
        notifications.push({
          recipient: technician.user,
          title: `Equipment Alert: ${type}`,
          message: `${equipment.name}: ${message}`,
          type: 'Alert',
          category: severity === 'Critical' ? 'error' : 'warning',
          relatedEntity: {
            entityType: 'Equipment',
            entityId: equipment._id
          }
        });
      }
    }
    
    // TODO: Add notifications for admins/supervisors
    
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
    
    res.status(201).json({
      success: true,
      data: equipment.alerts[equipment.alerts.length - 1]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resolve equipment alert
// @route   PUT /api/equipment/:id/alerts/:alertId/resolve
// @access  Private
exports.resolveAlert = async (req, res, next) => {
  try {
    const { resolutionNotes } = req.body;
    
    const equipment = await Equipment.findById(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({
        success: false,
        error: 'Equipment not found'
      });
    }
    
    const alert = equipment.alerts.id(req.params.alertId);
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }
    
    alert.resolved = true;
    alert.resolvedAt = new Date();
    alert.resolvedBy = req.user.id;
    alert.resolutionNotes = resolutionNotes;
    
    await equipment.save();
    
    res.status(200).json({
      success: true,
      data: alert
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get equipment statistics
// @route   GET /api/equipment/stats
// @access  Private
exports.getEquipmentStatistics = async (req, res, next) => {
  try {
    const stats = await Equipment.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          byStatus: {
            $push: "$status"
          },
          byType: {
            $push: "$type"
          },
          avgUsage: {
            $avg: "$specifications.usage.current"
          },
          maintenanceDue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$maintenance.nextMaintenance", null] },
                    { $lt: ["$maintenance.nextMaintenance", new Date()] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          total: 1,
          avgUsage: { $round: ["$avgUsage", 2] },
          maintenanceDue: 1,
          statusBreakdown: {
            $arrayToObject: {
              $map: {
                input: { $setUnion: "$byStatus" },
                as: "status",
                in: {
                  k: "$$status",
                  v: {
                    $size: {
                      $filter: {
                        input: "$byStatus",
                        as: "s",
                        cond: { $eq: ["$$s", "$$status"] }
                      }
                    }
                  }
                }
              }
            }
          },
          typeBreakdown: {
            $arrayToObject: {
              $map: {
                input: { $setUnion: "$byType" },
                as: "type",
                in: {
                  k: "$$type",
                  v: {
                    $size: {
                      $filter: {
                        input: "$byType",
                        as: "t",
                        cond: { $eq: ["$$t", "$$type"] }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: stats[0] || {}
    });
  } catch (error) {
    next(error);
  }
};