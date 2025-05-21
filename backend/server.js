import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import connectDB from './config/mongodb.js'
import cloudinary from './config/cloudinary.js'
import adminRouter from './routes/adminRoute.js'
import userRouter from './routes/userRoute.js'
import doctorRouter from './routes/doctorRoute.js'
import notificationRouter from './routes/notificationRoute.js'
import khalti from "../backend/routes/khalti.js"
import messageRouter from './routes/messageRoute.js';
import medicalRecordRouter from './routes/medicalRecordRoute.js';
import appointmentRouter from './routes/appointmentRoute.js';
import mongoose from 'mongoose'

// Log all Cloudinary environment variables loaded
console.log('Process ENV Cloudinary Variables:', Object.keys(process.env).filter(key => key.startsWith('CLOUDINARY')).reduce((obj, key) => { obj[key] = process.env[key]; return obj; }, {}));

// Log environment variables from config file (remove in production)
console.log('Cloudinary Config:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

//app config
const app = express()
const port = process.env.PORT || 4001
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
    methods: ["GET", "POST"]
  }
})

connectDB()
// Cloudinary is now initialized in the config file

// Import all Mongoose models to ensure they are registered
import './models/userModel.js';
import './models/doctorModel.js';
import './models/PatientModel.js';
import './models/appointmentModel.js';
import './models/MedicalRecordModel.js';
import './models/notificationModel.js';
import './models/messageModel.js';
import './models/FeedbackModel.js';
import './models/paymentModel.js';

// Log to check if the appointment model is registered
console.log('Is appointmentModel registered after imports?', mongoose.modelNames().includes('appointment'));

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Join chat room for a conversation (doctor-patient pair)
  socket.on('join-chat-room', ({ roomId }) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined chat room: ${roomId}`);
  });

  // Listen for chat messages
  socket.on('chat-message', async ({ roomId, message }) => {
    // Broadcast to all users in the room
    io.to(roomId).emit('chat-message', message);
  });

  // Existing notification rooms remain
  socket.on('join-admin-room', () => {
    socket.join('admin-room');
    console.log(`Admin joined: ${socket.id}`);
  });
  socket.on('join-doctor-room', (doctorId) => {
    socket.join(`doctor-${doctorId}`);
    console.log(`Doctor ${doctorId} joined: ${socket.id}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible throughout the application
app.set('io', io)

//middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
  credentials: true
}))

//api endpoints
app.use('/api/admin', adminRouter)
// localhost:4001/api/admin/add-doctor
app.use('/api/user', userRouter)
app.use('/api/doctor', doctorRouter)
app.use('/api/notifications', notificationRouter)
app.use("/khalti", khalti);
app.use('/api/messages', messageRouter);
app.use('/api/medical-records', medicalRecordRouter);
app.use('/api/appointments', appointmentRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});


//localhost:4000/api/user/adduser)
app.use('/uploads', express.static('uploads'));


app.get('/', (req, res) => {
  res.send('API WORKING ')
})

httpServer.listen(port, () => console.log("Server Started", port))