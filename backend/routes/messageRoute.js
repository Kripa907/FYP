import express from "express";

import {
  getAllChats,
  getChatMessages,
  handleChat,
  sendMessage,
  getUserChatList,
  getDoctorChatList,
  getDoctorPatientMessages
} from "../controllers/messageController.js";
import authUser from "../middlewares/authUser.js";
import { authDoctor } from "../middlewares/authDoctor.js";

const messageRouter = express.Router();

// Define the chat route
messageRouter.post("/", handleChat);

// User routes
messageRouter.get("/user/chat-list", authUser, getUserChatList);
messageRouter.get("/user/messages/:doctorId", authUser, getChatMessages);
messageRouter.post("/user/messages", authUser, sendMessage);

// Doctor routes
messageRouter.get("/doctor/chat-list", authDoctor, getDoctorChatList);
messageRouter.get("/doctor/messages/:userId", authDoctor, getDoctorPatientMessages);
messageRouter.post("/doctor/messages", authDoctor, sendMessage);

// Get unique list of doctors a patient has had appointments with
messageRouter.get("/user/doctor-list", authUser, async (req, res) => {
  try {
    const patientId = req.user._id;
    const appointments = await appointments.find({ user: patientId }).populate("doctor");
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

export default messageRouter;