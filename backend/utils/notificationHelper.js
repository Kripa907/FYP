/* Stub notification helper (notificationHelper.js) */

import Notification from '../models/notificationModel.js';

export const sendAppointmentNotifications = async ({ appointment, io, action }) => {
  try {
    let content = '';
    let type = 'appointment';

    // Create notification for the user
    switch (action) {
      case 'book':
        content = `Your appointment request with Dr. ${appointment.doctorData?.name || 'the doctor'} has been submitted.`;
        type = 'appointment';
        break;
      case 'approve':
        content = `Your appointment with Dr. ${appointment.doctorData?.name || 'the doctor'} has been confirmed.`;
        type = 'appointment_approve';
        break;
      case 'reject':
        content = `Your appointment request with Dr. ${appointment.doctorData?.name || 'the doctor'} has been rejected.`;
        type = 'appointment_reject';
        break;
      case 'cancel':
        content = `Your appointment with Dr. ${appointment.doctorData?.name || 'the doctor'} has been cancelled.`;
        type = 'appointment_cancel';
        break;
      case 'complete':
        content = `Your appointment with Dr. ${appointment.doctorData?.name || 'the doctor'} has been completed.`;
        type = 'appointment_complete';
        break;
      case 'update':
        content = `Your appointment with Dr. ${appointment.doctorData?.name || 'the doctor'} has been updated.`;
        type = 'appointment';
        break;
      default:
        content = `Update regarding your appointment with Dr. ${appointment.doctorData?.name || 'the doctor'}.`;
        type = 'appointment';
    }

    // Create notification for the user
    const userNotification = new Notification({
      recipient: appointment.user,
      recipientType: 'user',
      sender: appointment.doctor,
      senderType: 'doctor',
      type,
      content,
      link: `/appointments/${appointment._id}`
    });

    await userNotification.save();

    // Create notification for the doctor
    const doctorNotification = new Notification({
      recipient: appointment.doctor,
      recipientType: 'doctor',
      sender: appointment.user,
      senderType: 'user',
      type,
      content: content.replace('Your', 'A patient\'s'),
      link: `/doctor/appointments/${appointment._id}`
    });

    await doctorNotification.save();

    // Emit notifications via Socket.IO
    if (io) {
      io.to(`user-${appointment.user}`).emit('new-notification', { notification: userNotification });
      io.to(`doctor-${appointment.doctor}`).emit('new-notification', { notification: doctorNotification });
    }

    return { userNotification, doctorNotification };
  } catch (error) {
    console.error('Error sending appointment notifications:', error);
    throw error;
  }
}; 