import express from "express";
import appointmentModel from "../models/appointmentModel.js";
import doctorModel from "../models/doctorModel.js";
import authUser from "../middlewares/authUser.js";

const router = express.Router();

// Get unique list of doctors a patient has had appointments with
router.get("/user/doctor-list", authUser, async (req, res) => {
  try {
    const patientId = req.user._id;
    const appointments = await appointmentModel.find({ user: patientId }).populate("doctor");
    // Extract unique doctors
    const doctorMap = {};
    appointments.forEach(app => {
      if (app.doctor && app.doctor._id) {
        doctorMap[app.doctor._id] = app.doctor;
      }
    });
    const doctors = Object.values(doctorMap);
    res.json({ success: true, doctors });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch doctors", error: err.message });
  }
});

export default router;
