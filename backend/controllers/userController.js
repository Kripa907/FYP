import userModel from '../models/userModel.js';
import doctorModel from '../models/doctorModel.js';
import appointmentModel from '../models/appointmentModel.js';
import Notification from '../models/notificationModel.js';
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";
import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';

const createUserToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// API for adding user
const addUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.json({ success: false, message: "Missing Details!" });
        }

        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Invalid Email!" });
        }

        if (password.length < 8) {
            return res.json({ success: false, message: "Password must be at least 8 characters!" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userData = {
            name,
            email,
            password: hashedPassword,
            date: Date.now(),
        };

        const newUser = new userModel(userData);
        await newUser.save();

        const token = createUserToken(newUser._id);

        res.json({ success: true, message: "User added successfully!", token });
    } catch (error) {
        console.log("Error adding user:", error);
        res.status(500).json({ success: false, message: "Internal Server Error!" });
    }
};

// API for user login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.json({ success: false, message: "Missing Details!" });
        }

        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Invalid Email!" });
        }

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: "User not found!" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({ success: false, message: "Invalid Credentials!" });
        }

        const token = createUserToken(user._id);

        res.json({ success: true, message: "User logged in successfully!", token });
    } catch (error) {
        console.log("Error logging in user:", error);
        res.status(500).json({ success: false, message: "Internal Server Error!" });
    }
};

// Forgot Password
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found!" });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        user.resetToken = resetToken;
        user.resetTokenExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const resetLink = `http://localhost:5173/reset-password/${resetToken}`;

        await transporter.sendMail({
            from: process.env.EMAIL,
            to: email,
            subject: "Password Reset",
            text: `Click the following link to reset your password:\n${resetLink}`,
        });

        res.status(200).json({ success: true, message: "Password reset email sent!" });
    } catch (error) {
        console.error("Error in forgotPassword:", error);
        res.status(500).json({ success: false, message: "Internal Server Error!" });
    }
};

// Reset Password
const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const user = await userModel.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired token!" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        res.status(200).json({ success: true, message: "Password reset successfully!" });
    } catch (error) {
        console.log("Error in reset password:", error);
        res.status(500).json({ success: false, message: "Internal Server Error!" });
    }
};

// API to get user profile data
const getProfile = async (req, res) => {
    try {
        const userId = req.user._id; // Use ID from auth middleware
        const userData = await userModel.findById(userId).select('-password');
        if (!userData) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.json({ success: true, userData });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// API to book appointment
const bookAppointment = async (req, res) => {
  try {
    const { docId, slotDate, slotTime } = req.body;
    const userId = req.user._id; // From auth middleware

    // Input validation
    if (!docId || !slotDate || !slotTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Find doctor and validate
    const doctor = await doctorModel.findById(docId);
    if (!doctor) {
      return res.status(404).json({
        success: false, 
        message: 'Doctor not found'
      });
    }

    // Check if slot is already booked
    if (doctor.slots_booked?.[slotDate]?.includes(slotTime)) {
      return res.status(400).json({
        success: false,
        message: 'This slot is already booked'
      });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create appointment
    const appointment = new appointmentModel({
      doctor: docId,
      user: userId,
      slotDate,
      slotTime,
      status: 'Pending',
      amount: doctor.fees || 0,
      patientName: user.name,
      userData: {
        name: user.name,
        email: user.email
      },
      docData: {
        name: doctor.name,
        speciality: doctor.speciality,
        degree: doctor.degree,
        address: doctor.address,
        image: doctor.image
      }
    });

    await appointment.save();

    // Update doctor's booked slots
    await doctorModel.findByIdAndUpdate(docId, {
      $push: { [`slots_booked.${slotDate}`]: slotTime }
    });

    // Create notification for doctor
    await Notification.create({
      recipient: docId,
      recipientType: 'doctor',
      type: 'appointment',
      content: `New appointment request from ${user.name} for ${slotDate} at ${slotTime}`,
      sender: userId,
      senderType: 'user',
      link: `/appointments/${appointment._id}` // Add link to the appointment
    });

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      appointment
    });

  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to book appointment',
      error: error.message
    });
  }
};

// API to cancel the appointment
const cancelAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const userId = req.user._id; // Get user ID from auth middleware

        const appointmentData = await appointmentModel.findById(appointmentId);

        if (!appointmentData) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        if (appointmentData.user.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized action' });
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { 
            status: 'Cancelled',
            cancelled: true 
        });

        const { doctor: docId, slotDate, slotTime } = appointmentData;
        const doctorData = await doctorModel.findById(docId);
        const userData = await userModel.findById(userId);

        if (doctorData && doctorData.slots_booked && doctorData.slots_booked[slotDate]) {
            let slots_booked = doctorData.slots_booked;
            slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime);

            await doctorModel.findByIdAndUpdate(docId, { slots_booked });
        }

        // --- Notification logic ---
        const Notification = (await import('../models/notificationModel.js')).default;
        // Notify doctor
        await Notification.create({
          recipient: docId,
          recipientType: 'doctor',
          sender: userId,
          senderType: 'user',
          type: 'appointment_cancel',
          content: `Appointment canceled by ${userData?.name || 'user'} for ${slotDate} at ${slotTime}`,
          link: `/doctor/appointments/${appointmentId}`
        });

        // Notify user
        await Notification.create({
          recipient: userId,
          recipientType: 'user',
          sender: docId,
          senderType: 'doctor',
          type: 'appointment_cancel',
          content: `Your appointment for ${slotDate} at ${slotTime} has been cancelled.`,
          link: `/appointments/${appointmentId}`
        });
        // --- End notification logic ---

        res.json({ success: true, message: 'Appointment Cancelled' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const listAppointment = async (req, res) => {
    try {
        const userId = req.user._id; // From auth middleware

        const appointments = await appointmentModel.find({
            user: userId,
            status: { $in: ['Confirmed', 'Paid'] }
        }).populate('doctor', 'name speciality');

        res.status(200).json({ success: true, appointments });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

const listRequestedAppointments = async (req, res) => {
    try {
        const userId = req.user._id; // From auth middleware

        const appointments = await appointmentModel.find({
            user: userId,
            status: 'Pending'
        }).populate('doctor', 'name speciality');

        res.status(200).json({ success: true, requestedAppointments: appointments });
    } catch (error) {
        console.error('Error fetching requested appointments:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}


const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const {
            name,
            address,
            image,
            gender,
            dob,
            phone
        } = req.body;

        const update = {};
        if (name !== undefined) update.name = name;
        if (address !== undefined) update.address = address;
        if (image !== undefined) update.image = image;
        if (gender !== undefined) update.gender = gender;
        if (dob !== undefined) update.dob = dob;
        if (phone !== undefined) update.phone = phone;

        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { $set: update },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ success: true, message: "Profile updated successfully", user: updatedUser });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// Upload profile image
const uploadProfileImage = async (req, res) => {
  try {
    console.log("uploadProfileImage: req.file:", req.file);
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: "No image file (or buffer) provided." });
    }

    const userId = req.user._id;

    // Convert buffer to stream
    const stream = Readable.from(req.file.buffer);

    // Upload to Cloudinary
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        {
          folder: 'profile_images',
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      stream.pipe(uploadStream);
    });

    const result = await uploadPromise;

    // Update user's profile image in database
    const user = await userModel.findByIdAndUpdate(
      userId,
      { image: result.secure_url },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      imageUrl: result.secure_url
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({ success: false, message: 'Error uploading profile image' });
  }
};

// API to cancel a requested appointment
const cancelRequestedAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const userId = req.user._id;

        const appointmentData = await appointmentModel.findById(appointmentId);

        if (!appointmentData) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        if (appointmentData.user.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized action' });
        }

        if (appointmentData.status !== 'Pending') {
            return res.status(400).json({ success: false, message: 'Can only cancel pending appointments' });
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { 
            status: 'Cancelled',
            cancelled: true 
        });

        const { doctor: docId, slotDate, slotTime } = appointmentData;
        const doctorData = await doctorModel.findById(docId);
        const userData = await userModel.findById(userId);

        if (doctorData && doctorData.slots_booked && doctorData.slots_booked[slotDate]) {
            let slots_booked = doctorData.slots_booked;
            slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime);

            await doctorModel.findByIdAndUpdate(docId, { slots_booked });
        }

        // Create notifications
        await Notification.create({
            recipient: docId,
            recipientType: 'doctor',
            sender: userId,
            senderType: 'user',
            type: 'appointment_cancel',
            content: `Appointment request canceled by ${userData?.name || 'user'} for ${slotDate} at ${slotTime}`,
            link: `/doctor/appointments/${appointmentId}`
        });

        await Notification.create({
            recipient: userId,
            recipientType: 'user',
            sender: docId,
            senderType: 'doctor',
            type: 'appointment_cancel',
            content: `Your appointment request for ${slotDate} at ${slotTime} has been cancelled.`,
            link: `/appointments/${appointmentId}`
        });

        res.json({ success: true, message: 'Appointment request cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling appointment request:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export {
  addUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  bookAppointment,
  cancelAppointment,
  cancelRequestedAppointment,
  listAppointment,
  listRequestedAppointments,
  uploadProfileImage
};