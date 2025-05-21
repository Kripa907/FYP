import express from 'express';
import { addUser, forgotPassword, loginUser, resetPassword, bookAppointment, listAppointment, listRequestedAppointments, cancelAppointment, cancelRequestedAppointment, getProfile, updateProfile, uploadProfileImage } from '../controllers/userController.js';
import authUser from '../middlewares/authUser.js';
import upload from '../middlewares/uploadMiddleware.js';

const userRouter = express.Router();

userRouter.post('/addUser', addUser);
userRouter.post('/login', loginUser);
userRouter.get('/get-profile', authUser, getProfile);
userRouter.put('/update-profile', authUser, updateProfile);
userRouter.post('/upload-profile-image', authUser, upload.single('image'), uploadProfileImage);
userRouter.post('/book-appointment', authUser, bookAppointment);
userRouter.post('/forgot-password', forgotPassword);
userRouter.post('/reset-password/:token', resetPassword);
userRouter.get('/appointments', authUser, listAppointment);
userRouter.get('/requested-appointments', authUser, listRequestedAppointments);
userRouter.post('/cancel-appointment', authUser, cancelAppointment);
userRouter.post('/cancel-requested-appointment', authUser, cancelRequestedAppointment);

export default userRouter;