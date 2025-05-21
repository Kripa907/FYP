import express from 'express';
import { checkAppointment, createAppointment, updateAppointmentStatus, editAppointment } from '../controllers/appointmentController.js';
import authUser from '../middlewares/authUser.js';
import { authDoctor } from '../middlewares/authDoctor.js';

const appointmentRouter = express.Router();

// Check if user has had an appointment with a doctor
appointmentRouter.get('/check/:doctorId', authUser, checkAppointment);

// Create new appointment
appointmentRouter.post('/', authUser, createAppointment);

// Update appointment status (doctor only)
appointmentRouter.patch('/:appointmentId/status', authDoctor, updateAppointmentStatus);

// Edit appointment (user only)
appointmentRouter.patch('/:appointmentId', authUser, editAppointment);

export default appointmentRouter; 