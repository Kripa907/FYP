import express from "express";
import {
  addDoctor,
  allDoctors,
  loginAdmin,
  getPendingDoctors,
  applyDoctor,
  approveDoctor,
  rejectDoctor,
  getDoctorCount,
  getPatientCount,
  getAppointments,
  getAllPatients,
  deletePatient
} from "../controllers/adminController.js";
import upload from "../middlewares/multer.js";
import authAdmin from "../middlewares/authAdmin.js";
import appointmentModel from "../models/appointmentModel.js";
import doctorModel from "../models/doctorModel.js";
import { getNotifications } from "../controllers/notificationController.js";
import cloudinary from '../config/cloudinary.js';

const adminRouter = express.Router();

// Admin login
adminRouter.post("/login", loginAdmin);

// Add doctor (Protected Route)
adminRouter.post("/add-doctor", authAdmin, upload.fields([{ name: "image", maxCount: 1 }]), async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      speciality, 
      degree, 
      experience, 
      about, 
      fees, 
      address,
      licenseNumber 
    } = req.body;
    let imageUrl = '';

    // Validate required fields
    if (!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !licenseNumber) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields are required including license number" 
      });
    }

    // Upload image to Cloudinary if provided
    if (req.files && req.files.image) {
      try {
        const image = req.files.image[0];
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream({
            folder: 'doctor_photos',
            resource_type: 'auto'
          }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          });
          uploadStream.end(image.buffer);
        });
        imageUrl = uploadResult.secure_url;
      } catch (error) {
        console.error('Error uploading image:', error);
        return res.status(500).json({ 
          success: false, 
          message: "Error uploading image" 
        });
      }
    }

    // Parse address if it's a string, otherwise use as is
    let parsedAddress = {};
    try {
      if (typeof address === 'string') {
        parsedAddress = JSON.parse(address);
      } else if (typeof address === 'object' && address !== null) {
        parsedAddress = address;
      } else {
        parsedAddress = { addressLine1: '', addressLine2: '' };
      }
    } catch (error) {
      console.error('Error parsing address:', error);
      parsedAddress = { addressLine1: '', addressLine2: '' };
    }

    // Ensure address has required fields
    if (!parsedAddress.addressLine1) {
      parsedAddress.addressLine1 = '';
    }
    if (!parsedAddress.addressLine2) {
      parsedAddress.addressLine2 = '';
    }

    // Create new doctor with Cloudinary URL
    const newDoctor = new doctorModel({
      name,
      email,
      password,
      speciality,
      degree,
      experience,
      about,
      fees: Number(fees),
      address: parsedAddress,
      image: imageUrl,
      date: new Date().toISOString(),
      certification: imageUrl, // Using the same image as certification for admin-added doctors
      approved: true, // Auto-approve doctors added by admin
      licenseNumber // Add the license number
    });

    await newDoctor.save();
    res.status(201).json({ 
      success: true, 
      message: "Doctor added successfully!" 
    });
  } catch (error) {
    console.error("Error adding doctor:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Internal Server Error!" 
    });
  }
});

adminRouter.get("/all-doctors", authAdmin, allDoctors);
adminRouter.get("/pending-doctors", authAdmin, getPendingDoctors);
adminRouter.post("/apply-doctor", upload.fields([{ name: "certification", maxCount: 1 }]), applyDoctor);
adminRouter.put("/approve-doctor/:id", authAdmin, approveDoctor);
adminRouter.put("/reject-doctor/:id", authAdmin, rejectDoctor);

// Route to get doctor count
adminRouter.get("/doctor-count", authAdmin, getDoctorCount);

// Route to get patient count
adminRouter.get("/patient-count", authAdmin, getPatientCount);

// Appointment routes
adminRouter.get("/appointments", authAdmin, getAppointments);

// Add new routes for appointment management
adminRouter.patch("/appointments/:id/approve", authAdmin, async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const appointment = await appointmentModel.findByIdAndUpdate(
      appointmentId,
      { status: 'Confirmed' },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Notification logic
    const Notification = (await import('../models/notificationModel.js')).default;
    const fullAppointment = await appointmentModel.findById(appointmentId)
      .populate('user')
      .populate('doctor');

    // Notify user
    await Notification.create({
      recipientType: 'user',
      recipientId: fullAppointment.user?._id,
      type: 'appointment_approve',
      message: `Your appointment with Dr. ${fullAppointment.doctor?.name || ''} on ${fullAppointment.slotDate} at ${fullAppointment.slotTime} has been approved`,
      relatedAppointment: appointmentId
    });

    res.status(200).json({ success: true, appointment });
  } catch (error) {
    console.error('Error approving appointment:', error);
    res.status(500).json({ success: false, message: 'Failed to approve appointment' });
  }
});

adminRouter.patch("/appointments/:id/reject", authAdmin, async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const appointment = await appointmentModel.findByIdAndUpdate(
      appointmentId,
      { status: 'Rejected' },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Notification logic
    const Notification = (await import('../models/notificationModel.js')).default;
    const fullAppointment = await appointmentModel.findById(appointmentId)
      .populate('user')
      .populate('doctor');

    // Notify user
    await Notification.create({
      recipientType: 'user',
      recipientId: fullAppointment.user?._id,
      type: 'appointment_reject',
      message: `Your appointment with Dr. ${fullAppointment.doctor?.name || ''} on ${fullAppointment.slotDate} at ${fullAppointment.slotTime} has been rejected`,
      relatedAppointment: appointmentId
    });

    res.status(200).json({ success: true, appointment });
  } catch (error) {
    console.error('Error rejecting appointment:', error);
    res.status(500).json({ success: false, message: 'Failed to reject appointment' });
  }
});

adminRouter.delete("/appointments/:id", authAdmin, async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const appointment = await appointmentModel.findById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }
    
    await appointmentModel.findByIdAndDelete(appointmentId);
    
    res.status(200).json({ success: true, message: "Appointment deleted successfully" });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    res.status(500).json({ success: false, message: "Failed to delete appointment" });
  }
});

// Admin notifications
adminRouter.get("/notifications", authAdmin, (req, res, next) => {
  req.admin = true;
  next();
}, getNotifications);

// Update doctor
adminRouter.put("/doctors/:id", authAdmin, async (req, res) => {
  try {
    const doctorId = req.params.id;
    let update = req.body;
    // If address is present, ensure it's set as an object with addressLine1 and addressLine2
    if (update.address && (update.address.addressLine1 !== undefined || update.address.addressLine2 !== undefined)) {
      update = {
        ...update,
        address: {
          addressLine1: update.address.addressLine1 || '',
          addressLine2: update.address.addressLine2 || ''
        }
      }
    }
    // Handle both specialty and speciality fields
    if (update.specialty) {
      update.speciality = update.specialty;
    }
    await doctorModel.findByIdAndUpdate(doctorId, update);
    // Fetch the updated doctor from DB to ensure latest data is returned
    const updatedDoctor = await doctorModel.findById(doctorId);
    if (!updatedDoctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    res.status(200).json({ success: true, message: "Doctor updated successfully", doctor: updatedDoctor });
  } catch (error) {
    console.error("Error updating doctor:", error);
    res.status(500).json({ success: false, message: "Failed to update doctor" });
  }
});

// Delete doctor
adminRouter.delete("/doctors/:id", authAdmin, async (req, res) => {
  try {
    const doctorId = req.params.id;
    const deletedDoctor = await doctorModel.findByIdAndDelete(doctorId);
    if (!deletedDoctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    res.status(200).json({ success: true, message: "Doctor deleted successfully" });
  } catch (error) {
    console.error("Error deleting doctor:", error);
    res.status(500).json({ success: false, message: "Failed to delete doctor" });
  }
});

// Patients List
adminRouter.get("/patients", authAdmin, getAllPatients);

// Delete patient
adminRouter.delete("/patients/:id", authAdmin, deletePatient);

export default adminRouter