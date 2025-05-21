// Notification controller for handling real-time notifications
import appointmentModel from '../models/appointmentModel.js';
import doctorModel from '../models/doctorModel.js';
import userModel from '../models/userModel.js';
import notificationModel from '../models/notificationModel.js';
import Notification from '../models/notificationModel.js';

// Send payment notification to admin and doctor
export const sendPaymentNotification = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    
    if (!appointmentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Appointment ID is required' 
      });
    }
    
    // Find the appointment with populated user and doctor data
    const appointment = await appointmentModel.findById(appointmentId)
      .populate('user', 'name email')
      .populate('doctor', 'name email _id');
    
    if (!appointment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Appointment not found' 
      });
    }
    
    // Get the io instance from the app
    const io = req.app.get('io');
    
    if (!io) {
      return res.status(500).json({ 
        success: false, 
        message: 'Socket.io instance not available' 
      });
    }
    
    // Format the date for display
    let formattedDate = appointment.slotDate;
    try {
      const dateObj = new Date(appointment.slotDate);
      if (!isNaN(dateObj.getTime())) {
        formattedDate = dateObj.toLocaleDateString();
      }
    } catch (e) {
      console.log('Date formatting error:', e);
    }
    
    // Create notification data
    const notificationData = {
      appointmentId: appointment._id,
      patientName: appointment.user ? appointment.user.name : 'Patient',
      doctorName: appointment.doctor ? appointment.doctor.name : 'Doctor',
      date: formattedDate,
      time: appointment.slotTime,
      amount: appointment.amount
    };

    // Create admin notification
    const adminNotification = new Notification({
      recipientType: 'admin',
      type: 'payment',
      content: `Payment received from ${notificationData.patientName} for appointment on ${notificationData.date} at ${notificationData.time}`,
      read: false
    });
    await adminNotification.save();

    // Create doctor notification if doctor exists
    if (appointment.doctor && appointment.doctor._id) {
      const doctorNotification = new Notification({
        recipient: appointment.doctor._id,
        recipientType: 'doctor',
        type: 'payment',
        content: `Payment received from ${notificationData.patientName} for appointment on ${notificationData.date} at ${notificationData.time}`,
        read: false
      });
      await doctorNotification.save();
    }
    
    // Send notification to admin room
    io.to('admin-room').emit('payment-notification', notificationData);
    
    // Send notification to specific doctor
    if (appointment.doctor && appointment.doctor._id) {
      io.to(`doctor-${appointment.doctor._id}`).emit('payment-notification', notificationData);
    }
    
    // Update appointment payment status
    appointment.payment = true;
    await appointment.save();
    
    res.status(200).json({
      success: true,
      message: 'Payment notification sent successfully',
      notificationData
    });
    
  } catch (error) {
    console.error('Error sending payment notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send payment notification',
      error: error.message
    });
  }
};

export const getNotifications = async (req, res) => {
  try {
    let recipientType, recipientId;
    if (req.admin) {
      recipientType = 'admin';
      recipientId = null;
    } else if (req.doctor) {
      recipientType = 'doctor';
      recipientId = req.doctor._id;
    } else if (req.user) {
      recipientType = 'user';
      recipientId = req.user._id;
    } else {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Query notifications
    const filter = recipientType === 'admin'
      ? { recipientType: 'admin' }
      : { recipientType, recipientId };

    const notifications = await notificationModel.find(filter).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

export const markAllReadAdmin = async (req, res) => {
  try {
    await notificationModel.updateMany(
      { recipientType: 'admin', read: false },
      { $set: { read: true } }
    );

    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error("Error in markAllReadAdmin:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteNotificationAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await notificationModel.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    console.error("Error in deleteNotificationAdmin:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get notifications for a user
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log('Fetching notifications for user:', userId);
    
    const notifications = await Notification.find({
      recipient: userId,
      recipientType: 'user'
    })
    .sort({ createdAt: -1 })
    .limit(50);

    console.log('Found notifications:', notifications.length);

    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        recipient: userId,
        recipientType: 'user'
      },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      {
        recipient: userId,
        recipientType: 'user',
        read: false
      },
      { read: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
};

// Create a notification
export const createNotification = async (req, res) => {
  try {
    const {
      recipient,
      recipientType,
      sender,
      senderType,
      type,
      content,
      link
    } = req.body;

    const notification = new Notification({
      recipient,
      recipientType,
      sender,
      senderType,
      type,
      content,
      link
    });

    await notification.save();

    // Emit notification to Socket.IO room
    const io = req.app.get('io');
    io.to(`user-${recipient}`).emit('new-notification', { notification });

    res.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification',
      error: error.message
    });
  }
};

export const markNotificationAsReadAdmin = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientType: 'admin' },
      { read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};