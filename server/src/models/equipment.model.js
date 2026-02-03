const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  equipmentId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'Centrifuge',
      'Microscope',
      'Blood Analyzer',
      'PCR Machine',
      'X-Ray Machine',
      'MRI Scanner',
      'CT Scanner',
      'Ultrasound',
      'Incubator',
      'Autoclave',
      'Spectrophotometer',
      'Other'
    ]
  },
  manufacturer: String,
  model: String,
  serialNumber: String,
  purchaseDate: Date,
  warrantyExpiry: Date,
  status: {
    type: String,
    enum: ['Running', 'Idle', 'Maintenance', 'Broken', 'Calibration'],
    default: 'Idle'
  },
  location: {
    lab: String,
    room: String,
    rack: String
  },
  specifications: {
    temperature: {
      current: Number,
      unit: String,
      min: Number,
      max: Number
    },
    usage: {
      current: Number,
      max: Number,
      unit: String
    },
    powerConsumption: Number,
    dimensions: String,
    weight: Number
  },
  currentTest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabTest'
  },
  assignedTechnician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Technician'
  },
  maintenance: {
    lastMaintenance: Date,
    nextMaintenance: Date,
    maintenanceInterval: Number, // in days
    maintenanceHistory: [{
      date: Date,
      type: String,
      performedBy: String,
      notes: String,
      cost: Number
    }]
  },
  calibration: {
    lastCalibration: Date,
    nextCalibration: Date,
    calibrationInterval: Number, // in days
    calibrationHistory: [{
      date: Date,
      performedBy: String,
      notes: String,
      certificate: String
    }]
  },
  alerts: [{
    type: {
      type: String,
      enum: ['Temperature', 'Usage', 'Maintenance', 'Error', 'Warning']
    },
    message: String,
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    resolved: {
      type: Boolean,
      default: false
    },
    resolvedAt: Date,
    resolvedBy: mongoose.Schema.Types.ObjectId
  }],
  operationalHours: {
    total: Number,
    lastReset: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamps
equipmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster queries
equipmentSchema.index({ status: 1 });
equipmentSchema.index({ type: 1 });
equipmentSchema.index({ 'specifications.temperature.current': 1 });

module.exports = mongoose.model('Equipment', equipmentSchema);