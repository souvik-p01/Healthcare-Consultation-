const mongoose = require('mongoose');

const technicianSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please provide technician name'],
    trim: true
  },
  employeeId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  role: {
    type: String,
    required: true,
    enum: ['Senior Lab Technician', 'Lab Technician', 'Assistant Technician', 'Supervisor']
  },
  experience: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true,
    enum: ['Pathology & Diagnostics', 'Radiology', 'Microbiology', 'Biochemistry', 'Hematology']
  },
  phone: {
    type: String,
    required: true
  },
  qualifications: [{
    type: String,
    trim: true
  }],
  certifications: [{
    name: String,
    issuingAuthority: String,
    issueDate: Date,
    expiryDate: Date
  }],
  shift: {
    type: String,
    required: true,
    enum: ['Morning (8 AM - 4 PM)', 'Evening (4 PM - 12 AM)', 'Night (12 AM - 8 AM)']
  },
  nextBreak: {
    type: String,
    default: '12:00 PM'
  },
  assignedTests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabTest'
  }],
  assignedEquipment: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment'
  }],
  performanceMetrics: {
    testsCompleted: {
      type: Number,
      default: 0
    },
    accuracyRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    efficiencyScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    qualityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  status: {
    type: String,
    enum: ['active', 'on_break', 'off_duty', 'busy'],
    default: 'active'
  },
  lastActive: {
    type: Date,
    default: Date.now
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
technicianSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Technician', technicianSchema);