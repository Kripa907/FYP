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
    console.log('Received request body:', req.body);
    console.log('Received files:', req.files);

    // Add this check to see if the image file exists and its size after multer
    if (req.files && req.files.image && req.files.image[0]) {
      console.log('Multer processed image file details:', {
        fieldname: req.files.image[0].fieldname,
        originalname: req.files.image[0].originalname,
        encoding: req.files.image[0].encoding,
        mimetype: req.files.image[0].mimetype,
        size: req.files.image[0].size,
        destination: req.files.image[0].destination,
        filename: req.files.image[0].filename,
        path: req.files.image[0].path
      });

      if (req.files.image[0].size === 0) {
        console.error('Multer processed file is empty!');
        // Consider returning an error here directly if the file is empty
        // return res.status(400).json({
        //   success: false,
        //   message: 'Error: Uploaded image file is empty.'
        // });
      }
    } else {
      console.log('No image file received by multer or file is missing.');
    }

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

    // Log all received fields
    console.log('Parsed fields:', {
      name, email, speciality, degree, experience, about, fees, address, licenseNumber
    });

    // Validate required fields
    const requiredFields = ['name', 'email', 'password', 'speciality', 'degree', 'experience', 'about', 'fees', 'licenseNumber'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields);
      return res.status(400).json({ 
        success: false, 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate fees is a positive number
    const feesNumber = Number(fees);
    if (isNaN(feesNumber) || feesNumber <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Fees must be a positive number'
      });
    }

    let imageUrl = '';
    // Upload image to Cloudinary if provided
    if (req.files && req.files.image && req.files.image[0]) {
      try {
        console.log('Starting image upload to Cloudinary');
        const image = req.files.image[0];
        console.log('Image details:', {
          originalname: image.originalname,
          mimetype: image.mimetype,
          size: image.size
        });

        // Use the buffer from memory storage for Cloudinary upload
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream({
            folder: 'doctor_photos',
            resource_type: 'auto'
          }, (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(error);
            } else {
              console.log('Cloudinary upload successful:', result);
              resolve(result);
            }
          });
          uploadStream.end(image.buffer); // Use image.buffer here
        });
        imageUrl = uploadResult.secure_url;
      } catch (error) {
        console.error('Error uploading image to Cloudinary:', error);
        return res.status(500).json({ 
          success: false, 
          message: "Error uploading image: " + error.message 
        });
      }
    } else {
      console.log('No image file provided');
    }

    // Parse address if it's a string, otherwise use as is
    let parsedAddress = {};
    try {
      if (typeof address === 'string') {
        console.log('Parsing address string:', address);
        parsedAddress = JSON.parse(address);
      } else if (typeof address === 'object' && address !== null) {
        console.log('Using address object:', address);
        parsedAddress = address;
      } else {
        console.log('No valid address provided, using empty address');
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

    console.log('Creating new doctor with data:', {
      name,
      email,
      speciality,
      degree,
      experience,
      about,
      fees: feesNumber,
      address: parsedAddress,
      image: imageUrl,
      licenseNumber
    });

    // Create new doctor with Cloudinary URL
    const newDoctor = new doctorModel({
      name,
      email,
      password,
      speciality,
      degree,
      experience,
      about,
      fees: feesNumber,
      address: parsedAddress,
      image: imageUrl,
      date: new Date().toISOString(),
      certification: imageUrl, // Using the same image as certification for admin-added doctors
      approved: true, // Auto-approve doctors added by admin
      licenseNumber
    });

    await newDoctor.save();
    console.log('Doctor saved successfully');
    
    res.status(201).json({ 
      success: true, 
      message: "Doctor added successfully!" 
    });
  } catch (error) {
    console.error("Error adding doctor:", error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists"
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: validationErrors
      });
    }

    res.status(500).json({ 
      success: false, 
      message: error.message || "Internal Server Error!",
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
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