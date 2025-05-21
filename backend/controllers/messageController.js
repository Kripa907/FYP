import Message from '../models/messageModel.js';
import userModel from "../models/messageModel.js";
import appointmentModel from '../models/appointmentModel.js';

// Chat logic
export const handleChat = (req, res) => {
  const userMessage = req.body.message.toLowerCase();
  let response = response.default.response;

  // Check each category for matching keywords
  for (const category in responses) {
    if (category !== "default") {
      const matchedKeyword = responses[category].keywords?.some((keyword) =>
        userMessage.includes(keyword)
      );

      if (matchedKeyword) {
        response = responses[category].response;
        break;
      }
    }
  }

  res.json({ response });
};

// Get all chats for admin
export const getAllChats = async (req, res) => {
  try {
    const chats = await Chat.find()
      .sort({ lastMessage: -1 })
      .select("userId userEmail lastMessage isRead");
    res.status(200).json({ success: true, chats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get chat messages for a specific user/doctor
export const getChatMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const doctorId = req.params.doctorId;

    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: doctorId },
        { sender: doctorId, recipient: userId }
      ]
    }).sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      {
        sender: doctorId,
        recipient: userId,
        read: false
      },
      { read: true }
    );

    res.json({ success: true, messages });
  } catch (error) {
    console.error('Error in getChatMessages:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const doctorId = req.doctor?._id;
    const userId = req.user?._id;
    const isDoctor = !!req.doctor;

    if (!content || (!doctorId && !userId)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Create and save the message
    const message = new Message({
      sender: isDoctor ? doctorId : userId,
      senderType: isDoctor ? 'doctor' : 'user',
      recipient: isDoctor ? req.body.userId : req.body.doctorId,
      recipientType: isDoctor ? 'user' : 'doctor',
      content,
      timestamp: new Date()
    });

    await message.save();

    // Emit message to Socket.IO room if io is available
    const io = req.app.get('io');
    if (io) {
      // Construct roomId consistently by sorting participant IDs
      const participant1Id = isDoctor ? doctorId : userId;
      const participant2Id = isDoctor ? req.body.userId : req.body.doctorId;
      const sortedIds = [participant1Id, participant2Id].sort();
      const roomId = `chat-${sortedIds[0]}-${sortedIds[1]}`;
      io.to(roomId).emit('chat-message', { message });
    }

    res.json({ success: true, message });
  } catch (error) {
    console.error('Error in sendMessage:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getConversations = async (req, res) => {
  try {
//     const doctorId = req.doctor._id;
    
//     // Get unique users who have messages with this doctor
//     const conversations = await Message.aggregate([
//       {
//         $match: {
//           $or: [
//             { sender: doctorId, senderType: 'doctor' },
//             { recipient: doctorId, recipientType: 'doctor' }
//           ]
//         }
//       },
//       {
//         $group: {
//           _id: {
//             $cond: [
//               { $eq: ['$senderType', 'doctor'] },
//               '$recipient',
//               '$sender'
//             ]
//           },
//           lastMessage: { $last: '$content' },
//           lastMessageDate: { $last: '$createdAt' },
//           unreadCount: {
//             $sum: {
//               $cond: [
//                 { 
//                   $and: [
//                     { $eq: ['$read', false] },
//                     { $ne: ['$senderType', 'doctor'] }
//                   ]
//                 },
//                 1,
//                 0
//               ]
//             }
//           }
//         }
//       },
//       {
//         $lookup: {
//           from: 'users',
//           localField: '_id',
//           foreignField: '_id',
//           as: 'userDetails'
//         }
//       },
//       { $sort: { lastMessageDate: -1 } }
//     ]);

//     res.json({ success: true, conversations });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

 const doctorId = req.doctor._id;
    const conversations = await Message.aggregate([
      // ...existing aggregation code...
    ]);
    res.json({ success: true, conversations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const doctorId = req.doctor._id;

    const messages = await Message.find({
      $or: [
        { sender: doctorId, recipient: userId },
        { sender: userId, recipient: doctorId }
      ]
    }).sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      {
        sender: userId,
        recipient: doctorId,
        read: false
      },
      { read: true }
    );

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get list of doctors for a user to chat with
export const getUserChatList = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get all appointments for the user
    const appointments = await appointmentModel.find({ user: userId })
      .populate('doctor', 'name email speciality image')
      .sort({ createdAt: -1 });

    // Create a map to store unique doctors
    const doctorMap = new Map();

    // Process appointments to get unique doctors
    appointments.forEach(appointment => {
      if (appointment.doctor) {
        const doctorId = appointment.doctor._id.toString();
        if (!doctorMap.has(doctorId)) {
          doctorMap.set(doctorId, {
            _id: appointment.doctor._id,
            name: appointment.doctor.name,
            email: appointment.doctor.email,
            speciality: appointment.doctor.speciality,
            image: appointment.doctor.image,
            lastAppointment: appointment.slotDate
          });
        }
      }
    });

    // Convert map to array
    const doctors = Array.from(doctorMap.values());

    res.json({
      success: true,
      doctors
    });
  } catch (error) {
    console.error('Error fetching user chat list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat list',
      error: error.message
    });
  }
};

// Get list of patients for a doctor to chat with
export const getDoctorChatList = async (req, res) => {
  try {
    const doctorId = req.doctor._id;

    // Find all unique patients who have had appointments with this doctor
    const appointments = await appointmentModel.find({ doctor: doctorId }).populate('user');

    const patientsMap = new Map();

    appointments.forEach(appointment => {
      if (appointment.user) {
        patientsMap.set(appointment.user._id.toString(), appointment.user);
      }
    });

    const patients = Array.from(patientsMap.values());

    // Get the online users map from the io instance
    const io = req.app.get('io');
    const onlineUsers = io.onlineUsers || {};

    // Add online status to each patient
    const patientsWithStatus = patients.map(patient => ({
      ...patient.toObject(), // Convert Mongoose document to plain object
      isOnline: !!onlineUsers[patient._id.toString()]
    }));

    res.json({ success: true, patients: patientsWithStatus });

  } catch (error) {
    console.error('Error fetching doctor chat list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat list',
      error: error.message
    });
  }
};

// Get messages between a doctor and a patient
export const getDoctorPatientMessages = async (req, res) => {
  try {
    const doctorId = req.doctor._id;
    const patientId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: doctorId, recipient: patientId },
        { sender: patientId, recipient: doctorId }
      ]
    }).sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      {
        sender: patientId,
        recipient: doctorId,
        read: false
      },
      { read: true }
    );

    res.json({ success: true, messages });
  } catch (error) {
    console.error('Error in getDoctorPatientMessages:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};