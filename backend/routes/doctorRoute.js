import express from 'express';
import doctorModel from '../models/doctorModel.js';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { 
  doctorList, 
  loginDoctor, 
  appointmentsDoctor, 
  appointmentCancel, 
  appointmentComplete, 
  approveAppointment, 
  rejectAppointment,
  getDoctorDashboard,
  updateDoctorProfile,
  getDoctorNotifications,
  deleteNotification,
  markAllNotificationsAsRead,
  applyDoctor
} from '../controllers/doctorController.js'
import { saveMedicalRecord, getAllMedicalRecords, getRecentMedicalRecords } from '../controllers/medicalRecordController.js';
import { authDoctor, verifyDoctor } from '../middlewares/authDoctor.js';
import Appointment from '../models/appointmentModel.js';
import Feedback from '../models/FeedbackModel.js';
import authUser from '../middlewares/authUser.js';
import { submitFeedback, getUserReviews } from '../controllers/feedbackController.js';
import { getConversations, getMessages, sendMessage } from '../controllers/messageController.js';
import userModel from '../models/userModel.js';
import { uploadMultiple } from '../middlewares/multer.js';
import fs from 'fs';

const doctorRouter = express.Router();

// Apply as doctor route with multiple file upload
doctorRouter.post("/apply", uploadMultiple.fields([
  { name: 'certificate', maxCount: 1 },
  { name: 'license', maxCount: 1 }
]), applyDoctor);

doctorRouter.post('/apply-doctor', uploadMultiple.fields([
  { name: 'certificate', maxCount: 1 },
  { name: 'license', maxCount: 1 }
]), applyDoctor);

doctorRouter.get('/me', authDoctor, async (req, res) => {
    try {
        // Use req.doctor._id instead of req.body.docId since authDoctor middleware sets req.doctor
        const doctor = await doctorModel.findById(req.doctor._id);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        res.json({ 
            success: true,
            doctor: {
                _id: doctor._id,
                name: doctor.name,
                email: doctor.email,
                speciality: doctor.speciality,
                photo: doctor.photo
            }
        });
    } catch (error) {
        console.error('Error fetching doctor details:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get doctor reviews route
doctorRouter.get('/feedback/:doctorId', async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ doctor: req.params.doctorId })
      .populate('user', 'name') // Populate user information
      .sort({ createdAt: -1 });

    const totalRatings = feedbacks.length;
    const averageRating = totalRatings > 0
      ? feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / totalRatings
      : 0;

    // Map feedbacks to ensure userName is always available
    const mappedFeedbacks = feedbacks.map(feedback => {
      // Use the userName from the feedback document if available,
      // otherwise use the populated user's name, or 'Anonymous' as fallback
      const userName = feedback.userName || (feedback.user && feedback.user.name) || 'Anonymous';
      
      return {
        ...feedback._doc,
        userName
      };
    });

    res.json({
      success: true,
      feedbacks: mappedFeedbacks,
      totalRatings,
      averageRating: averageRating.toFixed(1)
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ success: false, message: "Failed to fetch reviews" });
  }
})

doctorRouter.patch('/appointment/complete/:appointmentId', authDoctor, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { status: 'Completed' },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      message: 'Appointment marked as completed',
      appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error completing appointment',
      error: error.message
    });
  }
});

// Get appointments for logged in doctor
doctorRouter.get('/my-appointments', authDoctor, async (req, res) => {
    try {
        const appointments = await appointmentModel.find({ docId: req.body.docId })
            .populate('userId', 'name')
            .sort({ date: -1 });

        if (!appointments) {
            return res.status(404).json({ success: false, message: 'No appointments found' });
        }

        res.status(200).json({ success: true, appointments });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

doctorRouter.put('/appointment/:id', authDoctor, async (req, res) => {
    try {
        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );
        res.status(200).json(appointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add to existing routes
doctorRouter.get('/patient-list', authDoctor, async (req, res) => {
  try {
    // Get all appointments for the logged-in doctor
    const appointments = await Appointment
      .find({ doctor: req.doctor._id })
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    // Create a map to store unique patients with their appointment history
    const patientsMap = new Map();

    // Process appointments to get unique patients with their appointment history
    appointments.forEach(appointment => {
      if (appointment.user) {
        const patientId = appointment.user._id.toString();
        if (!patientsMap.has(patientId)) {
          patientsMap.set(patientId, {
            _id: appointment.user._id,
            name: appointment.user.name,
            email: appointment.user.email,
            phone: appointment.user.phone,
            lastAppointment: appointment.slotDate,
            totalAppointments: 1,
            appointmentHistory: [{
              date: appointment.slotDate,
              status: appointment.status,
              type: appointment.type || 'Regular'
            }]
          });
        } else {
          const patient = patientsMap.get(patientId);
          patient.totalAppointments += 1;
          patient.appointmentHistory.push({
            date: appointment.slotDate,
            status: appointment.status,
            type: appointment.type || 'Regular'
          });
          // Update last appointment if this one is more recent
          if (new Date(appointment.slotDate) > new Date(patient.lastAppointment)) {
            patient.lastAppointment = appointment.slotDate;
          }
        }
      }
    });

    // Convert map to array and sort by last appointment date
    const patients = Array.from(patientsMap.values())
      .sort((a, b) => new Date(b.lastAppointment) - new Date(a.lastAppointment));

    res.json({
      success: true,
      patients,
      totalPatients: patients.length
    });

  } catch (error) {
    console.error('Error fetching patient list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient list',
      error: error.message
    });
  }
});

doctorRouter.get('/list',doctorList )
doctorRouter.post('/login', loginDoctor)
doctorRouter.get('/appointments', authDoctor, appointmentsDoctor)

// doctorRouter.put('/appointments/:id/approve', verifyDoctor, approveAppointment);
// doctorRouter.delete('/appointments/:id/reject', verifyDoctor, rejectAppointment);

doctorRouter.patch('/appointments/:id/approve', authDoctor, approveAppointment);
doctorRouter.patch('/appointments/:id/reject', authDoctor, rejectAppointment);

// Feedback submission route - handled by the controller
doctorRouter.post('/feedback', authUser, submitFeedback);
doctorRouter.get('/my-reviews', authUser, getUserReviews);

doctorRouter.post('/complete-appointment', authDoctor, appointmentComplete)
doctorRouter.post('/cancel-appointment', verifyDoctor, appointmentCancel)
doctorRouter.get('/dashboard', authDoctor, getDoctorDashboard);
doctorRouter.post('/feedback', authUser, submitFeedback);
doctorRouter.get('/medical-records', authDoctor, getAllMedicalRecords);
doctorRouter.get('/medical-records/new', authDoctor, getRecentMedicalRecords);
doctorRouter.post('/medical-records', authDoctor, uploadMultiple.single('record'), saveMedicalRecord);

doctorRouter.get('/conversations', authDoctor, getConversations);
doctorRouter.get('/messages/:userId', authDoctor, getMessages);
doctorRouter.post('/messages', authDoctor, sendMessage);

// Update doctor profile
doctorRouter.put('/update-profile', authDoctor, updateDoctorProfile);

// Get doctor notifications
doctorRouter.get('/notifications', authDoctor, getDoctorNotifications);
doctorRouter.delete('/notifications/:notificationId', authDoctor, deleteNotification);
doctorRouter.post('/notifications/mark-all-read', authDoctor, markAllNotificationsAsRead);

// Get doctor feedback statistics
doctorRouter.get('/feedback/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    // Get all feedback for this doctor
    const feedback = await Feedback.find({ doctor: doctorId });
    
    // Calculate average rating and total ratings
    const totalRatings = feedback.length;
    const averageRating = totalRatings > 0 
      ? feedback.reduce((acc, curr) => acc + curr.rating, 0) / totalRatings 
      : 0;
    
    res.json({
      success: true,
      averageRating,
      totalRatings
    });
  } catch (error) {
    console.error('Error fetching doctor feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching doctor feedback',
      error: error.message
    });
  }
});

// Update doctor profile route
doctorRouter.get('/profile', authDoctor, async (req, res) => {
  try {
    const doctor = await doctorModel.findById(req.doctor._id)
      .select('-password')
      .populate('speciality', 'name');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Get additional statistics
    console.log('appointmentModel in /profile route:', mongoose.model('appointment'));
    const totalAppointments = await mongoose.model('appointment').countDocuments({ doctor: req.doctor._id });
    const totalPatients = await mongoose.model('appointment').distinct('user', { doctor: req.doctor._id }).length;
    const averageRating = await Feedback.aggregate([
      { $match: { doctor: req.doctor._id } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);

    res.json({
      success: true,
      doctor: {
        ...doctor.toObject(),
        statistics: {
          totalAppointments,
          totalPatients,
          averageRating: averageRating[0]?.avgRating || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching doctor profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor profile',
      error: error.message
    });
  }
});

// Get doctor profile by ID for public view
doctorRouter.get('/:docId', async (req, res) => {
  try {
    const doctor = await doctorModel.findById(req.params.docId).select('-password');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      doctor
    });
  } catch (error) {
    console.error('Error fetching doctor profile by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor profile',
      error: error.message
    });
  }
});

export default doctorRouter;