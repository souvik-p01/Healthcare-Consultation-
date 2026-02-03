const mongoose = require('mongoose');

const labTestSchema = new mongoose.Schema({
  labCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  patient: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    patientId: {
      type: String,
      required: true
    },
    age: {
      type: Number,
      required: true
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other']
    },
    contact: String
  },
  testType: {
    type: String,
    required: true,
    enum: [
      'Complete Blood Count',
      'Chest X-Ray',
      'MRI Brain Scan',
      'Urine Analysis',
      'Blood Glucose',
      'Lipid Profile',
      'Liver Function Test',
      'Thyroid Test',
      'COVID-19 PCR',
      'CT Scan'
    ]
  },
  specimen: {
    type: String,
    required: true,
    enum: ['Blood', 'Urine', 'X-Ray', 'MRI', 'CT', 'Tissue', 'Saliva', 'Other']
  },
  priority: {
    type: String,
    enum: ['High', 'Normal', 'Low', 'Emergency'],
    default: 'Normal'
  },
  status: {
    type: String,
    enum: ['Pending', 'Scheduled', 'Processing', 'Waiting', 'Completed', 'Cancelled', 'On Hold'],
    default: 'Pending'
  },
  assignedTechnician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Technician'
  },
  assignedEquipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment'
  },
  doctor: {
    name: String,
    doctorId: String,
    department: String
  },
  requestedDate: {
    type: Date,
    default: Date.now
  },
  scheduledDate: Date,
  startTime: Date,
  completionTime: Date,
  dueTime: String,
  turnaroundTime: Number, // in minutes
  testParameters: [{
    name: String,
    value: String,
    unit: String,
    normalRange: String,
    status: {
      type: String,
      enum: ['Normal', 'Abnormal', 'Critical']
    }
  }],
  results: {
    findings: String,
    conclusion: String,
    recommendations: String,
    attachments: [String],
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Technician'
    },
    verifiedAt: Date
  },
  qualityCheck: {
    performedBy: mongoose.Schema.Types.ObjectId,
    performedAt: Date,
    score: Number,
    notes: String,
    status: {
      type: String,
      enum: ['Passed', 'Failed', 'Pending']
    }
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for faster queries
labTestSchema.index({ labCode: 1 });
labTestSchema.index({ status: 1 });
labTestSchema.index({ priority: 1 });
labTestSchema.index({ 'patient.patientId': 1 });
labTestSchema.index({ requestedDate: -1 });

// Calculate turnaround time before saving
labTestSchema.pre('save', function(next) {
  if (this.startTime && this.completionTime) {
    const start = new Date(this.startTime);
    const completion = new Date(this.completionTime);
    this.turnaroundTime = Math.round((completion - start) / (1000 * 60)); // Convert to minutes
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('LabTest', labTestSchema);