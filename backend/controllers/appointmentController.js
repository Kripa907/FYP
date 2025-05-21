import appointmentModel from '../models/appointmentModel.js';
import { sendAppointmentNotifications } from '../utils/notificationHelper.js';

// Add this function to check if user has had an appointment with a doctor
const checkAppointment = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const userId = req.user._id;

    console.log('Checking appointment for:', {
      doctorId,
      userId,
      userEmail: req.user.email
    });

    // Validate ObjectIds
    if (!doctorId || !userId) {
      console.error('Invalid IDs:', { doctorId, userId });
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor or user ID'
      });
    }

    // Check for any past appointment with completed or paid status
    const appointment = await appointmentModel.findOne({
      doctor: doctorId,
      user: userId,
      status: { $in: ['Completed', 'Paid', 'Confirmed'] } // Allow reviews for completed, paid, or confirmed appointments
    });

    console.log('Found appointment:', appointment ? {
      id: appointment._id,
      status: appointment.status,
      date: appointment.slotDate,
      time: appointment.slotTime
    } : 'No appointment found');

    res.status(200).json({
      success: true,
      hasAppointment: !!appointment,
      appointmentDetails: appointment ? {
        status: appointment.status,
        date: appointment.slotDate,
        time: appointment.slotTime
      } : null
    });
  } catch (error) {
    console.error('Error checking appointment:', {
      error: error.message,
      stack: error.stack,
      params: req.params,
      user: req.user ? {
        id: req.user._id,
        email: req.user.email
      } : 'No user in request'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to check appointment status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create new appointment
const createAppointment = async (req, res) => {
  try {
    const appointmentData = {
      ...req.body,
      user: req.user._id,
      userData: {
        name: req.user.name,
        email: req.user.email
      }
    };

    const appointment = await appointmentModel.create(appointmentData);

    // Send notifications for new appointment
    await sendAppointmentNotifications({
      appointment,
      io: req.app.get('io'),
      action: 'book'
    });

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      appointment
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create appointment',
      error: error.message
    });
  }
};

// Update appointment status
const updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status } = req.body;

    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    appointment.status = status;
    await appointment.save();

    // Send notifications for appointment approval
    if (status === 'Confirmed') {
      await sendAppointmentNotifications({
        appointment,
        io: req.app.get('io'),
        action: 'approve'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Appointment status updated successfully',
      appointment
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment status',
      error: error.message
    });
  }
};

// Edit appointment
const editAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const updateData = req.body;

    // Find the appointment
    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if the user is authorized to edit this appointment
    if (req.user._id.toString() !== appointment.user.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this appointment'
      });
    }

    // Only allow editing of certain fields
    const allowedUpdates = ['slotDate', 'slotTime', 'reason', 'isUrgent'];
    const updates = {};
    
    Object.keys(updateData).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = updateData[key];
      }
    });

    // Update the appointment
    const updatedAppointment = await appointmentModel.findByIdAndUpdate(
      appointmentId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    // Send notification about the update
    await sendAppointmentNotifications({
      appointment: updatedAppointment,
      io: req.app.get('io'),
      action: 'update'
    });

    res.status(200).json({
      success: true,
      message: 'Appointment updated successfully',
      appointment: updatedAppointment
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment',
      error: error.message
    });
  }
};

export {
  checkAppointment,
  createAppointment,
  updateAppointmentStatus,
  editAppointment
}; 