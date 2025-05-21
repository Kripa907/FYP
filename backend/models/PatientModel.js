import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  name: String,
  email: String,
  registeredDate: { type: Date, default: Date.now },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }
});

export default mongoose.model('patient', patientSchema);
