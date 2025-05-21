import express from 'express';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createNotification,
  sendPaymentNotification,
  getNotifications,
  markAllReadAdmin,
  deleteNotificationAdmin
} from '../controllers/notificationController.js';
import authUser from '../middlewares/authUser.js';
import authAdmin from '../middlewares/authAdmin.js';
import { verifyDoctor } from '../middlewares/authDoctor.js';

const notificationRouter = express.Router();

// User routes
notificationRouter.get('/user', authUser, getUserNotifications);
notificationRouter.patch('/:id/read', authUser, markNotificationAsRead);
notificationRouter.patch('/read-all', authUser, markAllNotificationsAsRead);
notificationRouter.delete('/:id', authUser, deleteNotificationAdmin);

// Admin routes
notificationRouter.get('/admin', authAdmin, getNotifications);
notificationRouter.put('/admin/markAllRead', authAdmin, markAllReadAdmin);
notificationRouter.delete('/admin/:id', authAdmin, deleteNotificationAdmin);

// Doctor routes
notificationRouter.get('/doctor', verifyDoctor, getNotifications);

// Payment notification route
notificationRouter.post('/payment', sendPaymentNotification);

// Create notification (can be called by any authenticated user)
notificationRouter.post('/', createNotification);

export default notificationRouter;
