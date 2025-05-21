import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    refPath: 'recipientType'
  },
  recipientType: {
    type: String,
    required: true,
    enum: ['user', 'doctor', 'admin']
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'senderType'
  },
  senderType: {
    type: String,
    enum: ['user', 'doctor', 'system']
  },
  type: {
    type: String,
    required: true,
    enum: ['message', 'appointment', 'appointment_approve', 'appointment_reject', 'appointment_cancel', 'appointment_complete', 'system', 'payment']
  },
  content: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  link: {
    type: String
  }
}, {
  timestamps: true
});

export default mongoose.model('Notification', notificationSchema);
