import mongoose from 'mongoose';

const medicalRecordSchema = new mongoose.Schema({
  patient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'user',
    required: true 
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'appointment',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'doctor',
    required: true
  },
  recordType: { 
    type: String, 
    required: true,
    enum: ['Consultation', 'Lab Report', 'Prescription', 'Diagnostic', 'Progress Note']
  },
  date: { 
    type: Date, 
    required: true 
  },
  notes: { 
    type: String,
    required: true 
  },
  attachmentUrl: { 
    type: String,
    required: true 
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

// Update the updatedAt timestamp before saving
medicalRecordSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const MedicalRecord = mongoose.models.MedicalRecord || mongoose.model('MedicalRecord', medicalRecordSchema);

export default MedicalRecord;