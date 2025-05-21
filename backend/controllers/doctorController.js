import doctorModel from "../models/doctorModel.js"
import appointmentModel from "../models/appointmentModel.js"
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import userModel from '../models/userModel.js';
import Feedback from '../models/FeedbackModel.js';
import Notification from '../models/notificationModel.js';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';
import streamifier from 'streamifier';




const changeAvailabilty = async (req, res) => {
    try {
        
        const {docId} = req.body

        const docData = await doctorModel.findById(docId)
        await doctorModel.findByIdAndUpdate(docId, {available : !docData.available})
        res.json({success:true, message:'Availabilty Changed'})

        
    } catch (error) {
        
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

const doctorList = async (req, res) => {
    try {
        const doctors = await doctorModel.find({ approved: true })
            .select(['-password', '-email', '-certification'])
            .lean();

        // Get ratings for each doctor
        const doctorsWithRatings = await Promise.all(doctors.map(async (doctor) => {
            const feedbacks = await Feedback.find({ doctor: doctor._id });
            const totalRatings = feedbacks.length;
            const averageRating = totalRatings > 0
                ? feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / totalRatings
                : 0;

            // Set verified status based on having completed appointments and positive ratings
            const completedAppointments = await appointmentModel.countDocuments({
                doctor: doctor._id,
                status: 'Completed'
            });

            const isVerified = completedAppointments > 0 && averageRating >= 4.0;

            // Update doctor's verified status if it has changed
            if (doctor.verified !== isVerified) {
                await doctorModel.findByIdAndUpdate(doctor._id, { verified: isVerified });
            }

            return {
                ...doctor,
                verified: isVerified,
                averageRating: parseFloat(averageRating.toFixed(1)),
                totalRatings
            };
        }));

        res.status(200).json({
            success: true,
            doctors: doctorsWithRatings
        });
    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch doctors'
        });
    }
};

// API for the docotr Login

const loginDoctor = async (req, res) => {
    try {
        const { email, password } = req.body;
        const doctor = await doctorModel.findOne({ email });

        if (!doctor) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, doctor.password);
        if (isMatch) {
            const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET);
            
            // Return doctor data along with token
            res.json({
                success: true,
                token,
                doctor: {
                    _id: doctor._id,
                    name: doctor.name,
                    email: doctor.email,
                    speciality: doctor.speciality,
                    image: doctor.image
                }
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

//  // API to get dashboard data for doctor panel

//  const appointmentsDoctor = async (req, res) => {
//     try {
//         const docId = req.body.docId; // Get doctor ID from auth middleware

//         // Fetch appointments for the doctor
//         const appointments = await appointmentModel.find({ docId })
//             .populate('userId', 'name email')
//             .sort({ date: -1 });

//         if (!appointments) {
//             return res.json({ success: false, message: 'No appointments found' });
//         }

//         // Format appointments for response
//         const formattedAppointments = appointments.map(appointment => ({
//             id: appointment._id,
//             date: appointment.slotDate,
//             time: appointment.slotTime,
//             patient: appointment.userData.name,
//             status: appointment.status,
//             reason: appointment.reason
//         }));

//         res.json(formattedAppointments);
//     } catch (error) {
//         console.log(error);
//         res.json({ success: false, message: error.message });
//     }
// };


const appointmentsDoctor = async (req, res) => {
  try {
    const doctorId = req.doctor._id; // From auth middleware

    const appointments = await appointmentModel.find({ 
      doctor: doctorId 
    })
    .populate('user', 'name email _id') // Added _id to populated fields
    .sort({ slotDate: -1, slotTime: -1 });

    const formattedAppointments = appointments.map(appointment => ({
      _id: appointment._id,
      user: {
        _id: appointment.user._id, // Include user ID in response
        name: appointment.user.name,
        email: appointment.user.email
      },
      slotDate: appointment.slotDate,
      slotTime: appointment.slotTime,
      status: appointment.status,
      reason: appointment.reason || 'General Consultation'
    }));

    res.status(200).json(formattedAppointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Failed to fetch appointments' });
  }
}

//Api to mark appointment completeted for docotr panel

// Approve appointment endpoint
const approveAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const doctorId = req.doctor._id; // Get doctor ID from auth middleware

    // First find the appointment to check ownership
    const appointment = await appointmentModel.findById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Check if the appointment belongs to this doctor
    if (appointment.doctor.toString() !== doctorId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to approve this appointment' });
    }

    // Update the appointment status
    const updatedAppointment = await appointmentModel.findByIdAndUpdate(
      appointmentId,
      { status: 'Confirmed' },
      { new: true }
    );

    try {
      // --- Notification logic ---
      const Notification = (await import('../models/notificationModel.js')).default;
      // Fetch appointment details for notification
      const fullAppointment = await appointmentModel.findById(appointmentId)
        .populate('user')
        .populate('doctor');

      // Notify admin
      await Notification.create({
        recipientType: 'admin',
        recipientId: 'admin',
        type: 'appointment_approve',
        message: `Appointment approved for ${fullAppointment.user?.name || 'user'} with Dr. ${fullAppointment.doctor?.name || ''} on ${fullAppointment.slotDate} at ${fullAppointment.slotTime}`,
        relatedAppointment: appointmentId
      });

      // Notify user
      if (fullAppointment.user?._id) {
        await Notification.create({
          recipient: fullAppointment.user._id,
          recipientType: 'user',
          sender: fullAppointment.doctor._id,
          senderType: 'doctor',
          type: 'appointment_approve',
          content: `Your appointment with Dr. ${fullAppointment.doctor?.name || ''} on ${fullAppointment.slotDate} at ${fullAppointment.slotTime} has been approved`,
          link: `/appointments/${appointmentId}`
        });
      }
    } catch (notificationError) {
      // Log the notification error but don't fail the request
      console.error('Error creating notifications:', notificationError);
    }

    res.status(200).json({ success: true, appointment: updatedAppointment });
  } catch (error) {
    console.error('Error approving appointment:', error);
    res.status(500).json({ success: false, message: 'Failed to approve appointment' });
  }
}

// Reject appointment endpoint
const rejectAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const doctorId = req.doctor._id; // Get doctor ID from auth middleware

    // First find the appointment to check ownership
    const appointment = await appointmentModel.findById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Check if the appointment belongs to this doctor
    if (appointment.doctor.toString() !== doctorId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to reject this appointment' });
    }

    // Update the appointment status
    const updatedAppointment = await appointmentModel.findByIdAndUpdate(
      appointmentId,
      { status: 'Rejected' },
      { new: true }
    );

    // --- Notification logic ---
    const Notification = (await import('../models/notificationModel.js')).default;
    // Fetch appointment details for notification
    const fullAppointment = await appointmentModel.findById(appointmentId)
      .populate('user')
      .populate('doctor');

    // Notify admin
    await Notification.create({
      recipient: 'admin',
      recipientType: 'admin',
      sender: fullAppointment.doctor._id,
      senderType: 'doctor',
      type: 'appointment_reject',
      content: `Appointment rejected for ${fullAppointment.user?.name || 'user'} with Dr. ${fullAppointment.doctor?.name || ''} on ${fullAppointment.slotDate} at ${fullAppointment.slotTime}`,
      link: `/admin/appointments/${appointmentId}`
    });

    // Notify user
    await Notification.create({
      recipient: fullAppointment.user?._id,
      recipientType: 'user',
      sender: fullAppointment.doctor._id,
      senderType: 'doctor',
      type: 'appointment_reject',
      content: `Your appointment with Dr. ${fullAppointment.doctor?.name || ''} on ${fullAppointment.slotDate} at ${fullAppointment.slotTime} has been rejected`,
      link: `/appointments/${appointmentId}`
    });

    res.status(200).json({ success: true, appointment: updatedAppointment });
  } catch (error) {
    console.error('Error rejecting appointment:', error);
    res.status(500).json({ success: false, message: 'Failed to reject appointment' });
  }
}


const appointmentComplete = async (req, res) =>{

    try{

        const {docId, appointmentId } = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)

        if(appointmentData && appointmentData.docId === docId) {

            const paid = await appointmentModel.findByIdAndUpdate(
              appointmentId,
              { status: 'Paid' },
              { new: true }
            );
            return res.json({ success:true, appointment: paid, message: 'Appointment marked as Paid' });

        } else{
            return res.json({success:false,message:'Marked failed'})
        }
    }catch (error){
        console.log(error)
        return res.json({success:false,message:error.message})
    }
}


//Api to cancel appointment  for docotr panel


const appointmentCancel = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const docId = req.doctor._id; // Get doctor ID from auth middleware
        const appointmentData = await appointmentModel.findById(appointmentId);

        if (!appointmentData) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        if (appointmentData.doctor.toString() !== docId.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized to cancel this appointment' });
        }

        const updated = await appointmentModel.findByIdAndUpdate(
            appointmentId,
            { 
                status: 'Canceled',
                cancelled: true 
            },
            { new: true }
        );

        // --- Notification logic ---
        const Notification = (await import('../models/notificationModel.js')).default;
        // Fetch appointment details for notification
        const fullAppointment = await appointmentModel.findById(appointmentId)
            .populate('user')
            .populate('doctor');
        
        // Notify user
        if (fullAppointment.user?._id) {
            await Notification.create({
                recipient: fullAppointment.user._id,
                recipientType: 'user',
                sender: docId,
                senderType: 'doctor',
                type: 'appointment',
                content: `Your appointment with Dr. ${fullAppointment.doctor?.name || ''} on ${fullAppointment.slotDate} at ${fullAppointment.slotTime} has been cancelled`,
                link: `/appointments/${appointmentId}`
            });
        }

        // Notify admin
        await Notification.create({
            recipient: 'admin',
            recipientType: 'admin',
            sender: docId,
            senderType: 'doctor',
            type: 'appointment',
            content: `Appointment cancelled for ${fullAppointment.user?.name || 'user'} with Dr. ${fullAppointment.doctor?.name || ''} on ${fullAppointment.slotDate} at ${fullAppointment.slotTime}`,
            link: `/admin/appointments/${appointmentId}`
        });
        // --- End notification logic ---

        res.json({ 
            success: true, 
            message: 'Appointment Cancelled',
            appointment: updated
        });
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// API to get appointments for doctor panel

// const getDoctorDashboard = async (req, res) => {
//   try {
//     const doctorId = req.doctor._id;

//     const today = new Date();
//     const tomorrow = new Date(today);
//     tomorrow.setDate(tomorrow.getDate() + 1);

//     const todayAppointments = await appointmentModel.find({
//       docId: doctorId,
//       slotDate: today.toISOString().split('T')[0]
//     });

//     const urgentCasesCount = todayAppointments.filter(app => app.isUrgent).length;

//     const upcomingAppointments = await appointmentModel.find({
//       docId: doctorId,
//       slotDate: { $gte: today.toISOString().split('T')[0] }
//     }).limit(5);

//     const totalPatients = await userModel.countDocuments({ doctor: doctorId });

//     const thisMonth = new Date();
//     thisMonth.setDate(1);
//     const newPatientsThisMonth = await userModel.countDocuments({
//       doctor: doctorId,
//       createdAt: { $gte: thisMonth }
//     });

//     const pendingReports = await Report.find({
//       doctor: doctorId,
//       isSubmitted: false
//     });

//     const feedbacks = await Feedback.find({ doctor: doctorId });

//     const avgRating = feedbacks.length
//       ? feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / feedbacks.length
//       : 0;

//     res.json({
//       doctorName: req.doctor.name,
//       todayAppointmentsCount: todayAppointments.length,
//       urgentCasesCount,
//       totalPatients,
//       newPatientsThisMonth,
//       pendingReports: pendingReports.length,
//       upcomingAppointments,
//       averageRating: avgRating.toFixed(1),
//       recentFeedbacks: feedbacks.slice(-3).reverse() // last 3 feedbacks
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server Error" });
//   }
// }

const getDoctorDashboard = async (req, res) => {
  try {
    const doctorId = req.doctor._id;
    
    // Fetch complete doctor information
    const doctorInfo = await doctorModel.findById(doctorId).select('-password');

    // Get today's date in DD_MM_YYYY format
    const today = new Date();
    const formattedToday = `${String(today.getDate()).padStart(2, '0')}_${String(today.getMonth() + 1).padStart(2, '0')}_${today.getFullYear()}`;

    // Get today's appointments
    const todayAppointments = await appointmentModel.find({
      doctor: doctorId,
      slotDate: formattedToday,
      status: { $in: ['Confirmed', 'Completed'] }
    });

    // Get total appointments count
    const totalAppointments = await appointmentModel.countDocuments({
      doctor: doctorId,
      status: { $in: ['Confirmed', 'Completed'] }
    });

    // Get unique patients count
    const appointments = await appointmentModel.find({ 
      doctor: doctorId,
      status: { $in: ['Confirmed', 'Completed'] }
    });
    
    const uniquePatients = new Set(appointments.map(app => app.user.toString()));
    const totalPatients = uniquePatients.size;

    // Get new patients this month
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const newPatientsThisMonth = await appointmentModel.distinct('user', {
      doctor: doctorId,
      createdAt: { $gte: firstDayOfMonth, $lte: lastDayOfMonth },
      status: { $in: ['Confirmed', 'Completed'] }
    }).length;

    // Get average rating
    const feedbacks = await Feedback.find({ doctor: doctorId });
    const avgRating = feedbacks.length
      ? (feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / feedbacks.length).toFixed(1)
      : '0';

    // Get pending appointments count
    const pendingAppointments = await appointmentModel.countDocuments({
      doctor: doctorId,
      status: 'Pending'
    });

    res.json({
      success: true,
      todayAppointmentsCount: todayAppointments.length,
      totalAppointments,
      totalPatients,
      newPatientsThisMonth,
      pendingAppointments,
      averageRating: avgRating,
      doctorName: doctorInfo.name,
      doctorInfo: {
        name: doctorInfo.name,
        specialization: doctorInfo.speciality,
        email: doctorInfo.email
      }
    });
  } catch (err) {
    console.error('Error in getDoctorDashboard:', err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch dashboard data",
      error: err.message 
    });
  }
};

const updateDoctorProfile = async (req, res) => {
  try {
    const doctorId = req.doctor._id;
    const { email, address, currentPassword, newPassword } = req.body;

    // Find the doctor
    const doctor = await doctorModel.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    // If changing password, verify current password
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, doctor.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      doctor.password = await bcrypt.hash(newPassword, salt);
    }

    // Update email if provided
    if (email) {
      // Check if email is already taken by another doctor
      const existingDoctor = await doctorModel.findOne({ email, _id: { $ne: doctorId } });
      if (existingDoctor) {
        return res.status(400).json({ success: false, message: 'Email is already taken' });
      }
      doctor.email = email;
    }

    // Update address if provided
    if (address) {
      doctor.address = {
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2
      };
    }

    // Save the updated doctor
    await doctor.save();

    // Return updated doctor data (excluding password)
    const updatedDoctor = await doctorModel.findById(doctorId).select('-password');
    res.json({ success: true, doctor: updatedDoctor });
  } catch (error) {
    console.error('Error updating doctor profile:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

const getDoctorNotifications = async (req, res) => {
  try {
    const doctorId = req.doctor._id;

    const notifications = await Notification.find({
      recipient: doctorId,
      recipientType: 'doctor'
    })
    .sort({ createdAt: -1 })
    .limit(10);

    // Removed: Mark unread notifications as read here
    // This should only happen when the mark-all-read endpoint is called

    res.status(200).json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications'
    });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const doctorId = req.doctor._id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: doctorId,
      recipientType: 'doctor'
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notification'
    });
  }
};

const markAllNotificationsAsRead = async (req, res) => {
  try {
    const doctorId = req.doctor._id;

    await Notification.updateMany(
      {
        recipient: doctorId,
        recipientType: 'doctor',
        read: false
      },
      {
        $set: { read: true }
      }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notifications as read'
    });
  }
};

const applyDoctor = async (req, res) => {
  try {
    console.log('Received doctor application request');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);

    const {
      name,
      email,
      password,
      speciality,
      degree,
      experience,
      about,
      fees,
      addressLine1,
      addressLine2,
      licenseNumber,
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !licenseNumber) {
      console.log('Missing required fields');
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if doctor already exists
    const existingDoctor = await doctorModel.findOne({ email });
    if (existingDoctor) {
      console.log('Doctor with email already exists:', email);
      return res.status(400).json({ message: 'Doctor with this email already exists' });
    }

    // Validate required files
    if (!req.files || !req.files.certificate || !req.files.license) {
      console.log('Missing required files');
      return res.status(400).json({ message: 'Both certificate and license files are required' });
    }

    // Upload certificate to Cloudinary
    let certificateUrl = '';
    try {
      console.log('Uploading certificate to Cloudinary');
      console.log('Cloudinary config before certificate upload:', cloudinary.config());
      const cert = req.files.certificate[0];
      console.log('Certificate file details:', { fieldname: cert.fieldname, originalname: cert.originalname, size: cert.size, path: cert.path });
      const certResult = await cloudinary.uploader.upload(cert.path, {
        folder: 'doctor_certificates',
        resource_type: 'auto'
      });
      certificateUrl = certResult.secure_url;
      // Delete temporary file
      fs.unlinkSync(cert.path);
      console.log('Certificate uploaded successfully:', certificateUrl);
    } catch (error) {
      console.error('Error uploading certificate:', error);
      // Clean up temporary file if it exists
      if (req.files?.certificate?.[0]?.path && fs.existsSync(req.files.certificate[0].path)) {
        fs.unlinkSync(req.files.certificate[0].path);
      }
      return res.status(500).json({ message: 'Error uploading certificate: ' + error.message });
    }

    // Upload license to Cloudinary
    let licenseUrl = '';
    try {
      console.log('Uploading license to Cloudinary');
      console.log('Cloudinary config before license upload:', cloudinary.config());
      const license = req.files.license[0];
      console.log('License file details:', { fieldname: license.fieldname, originalname: license.originalname, size: license.size, path: license.path });
       const licenseResult = await cloudinary.uploader.upload(license.path, {
        folder: 'doctor_licenses',
        resource_type: 'auto'
      });
      licenseUrl = licenseResult.secure_url;
      // Delete temporary file
      fs.unlinkSync(license.path);
      console.log('License uploaded successfully:', licenseUrl);
    } catch (error) {
      console.error('Error uploading license:', error);
       // Clean up temporary file if it exists
      if (req.files?.license?.[0]?.path && fs.existsSync(req.files.license[0].path)) {
        fs.unlinkSync(req.files.license[0].path);
      }
      return res.status(500).json({ message: 'Error uploading license: ' + error.message });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save doctor to the database
    console.log('Saving doctor to database');
    const newDoctor = new doctorModel({
      name,
      email,
      password: hashedPassword,
      speciality,
      degree,
      experience,
      about,
      fees,
      address: { addressLine1, addressLine2 },
      licenseNumber,
      certification: certificateUrl,
      license: licenseUrl,
      date: new Date().toISOString(),
    });

    await newDoctor.save();
    console.log('Doctor saved successfully');
    res.status(201).json({ message: 'Application submitted! Pending approval.' });
  } catch (error) {
    console.error('Error saving doctor application:', error);
    // Clean up any uploaded files if there was an error
    if (req.files) {
      if (req.files.certificate) {
        req.files.certificate.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
      if (req.files.license) {
        req.files.license.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
    }
    res.status(500).json({ message: 'Internal Server Error: ' + error.message });
  }
};

export {
  changeAvailabilty,
  doctorList,
  loginDoctor,
  appointmentsDoctor,
  appointmentCancel,
  appointmentComplete,
  getDoctorDashboard,
  approveAppointment,
  rejectAppointment,
  updateDoctorProfile,
  getDoctorNotifications,
  deleteNotification,
  markAllNotificationsAsRead,
  applyDoctor
};
export { saveMedicalRecord } from './medicalRecordController.js';