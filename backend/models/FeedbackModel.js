// import mongoose from 'mongoose';

// const feedbackSchema = new mongoose.Schema({
//   doctor: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Doctor',
//     required: true
//   },
//   patientName: {
//     type: String,
//     required: true
//   },
//   rating: {
//     type: Number,
//     required: true,
//     min: 1,
//     max: 5
//   },
//   comment: {
//     type: String,
//     required: true
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   }
// });
import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'doctor',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user', // changed from 'User' to 'user' to match model registration
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Feedback', feedbackSchema);