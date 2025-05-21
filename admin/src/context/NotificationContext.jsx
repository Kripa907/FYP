import { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AdminContext } from './AdminContext';
import { DoctorContext } from './DoctorContext';

export const NotificationContext = createContext();

const NotificationContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { aToken, setAToken } = useContext(AdminContext);
  const { dToken } = useContext(DoctorContext);
  
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4001';

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(backendUrl, {
      transports: ['websocket'],
      reconnection: true,
    });
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
    });
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
    setSocket(newSocket);
    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, [backendUrl]);

  // Join rooms based on user type
  useEffect(() => {
    if (!socket) return;
    socket.emit('leave-all-rooms');
    if (aToken) {
      socket.emit('join-admin-room');
      console.log('Admin joined notification room');
    }
    if (dToken) {
      const doctorId = localStorage.getItem('doctorId') || 'unknown';
      socket.emit('join-doctor-room', doctorId);
      console.log('Doctor joined notification room');
    }
  }, [socket, aToken, dToken]);

  // Listen for payment notifications
  useEffect(() => {
    if (!socket) return;
    socket.on('payment-notification', (data) => {
      console.log('Received payment notification:', data);
      const role = aToken ? 'admin' : dToken ? 'doctor' : 'user';
      const newNotification = {
        id: Date.now(),
        title: 'Payment Received',
        message: `Payment received from ${data.patientName} for appointment on ${data.date}`,
        time: new Date().toLocaleString(),
        read: false,
        type: 'payment',
        appointmentId: data.appointmentId,
        recipientType: role,
      };
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      toast.success(`Payment received from ${data.patientName}`);
    });
    return () => {
      socket.off('payment-notification');
    };
  }, [socket, aToken, dToken]);

  // fetchNotifications using the Authorization header.
  const fetchNotifications = async () => {
    try {
      let url = "";
      let headers = {};
      
      if (aToken) {
        url = `${backendUrl}/api/notifications/admin`;
        headers = { Authorization: `Bearer ${aToken}` };
      } else if (dToken) {
        url = `${backendUrl}/api/notifications/doctor`;
        headers = { Authorization: `Bearer ${dToken}` };
      } else {
        const token = localStorage.getItem('token');
        url = `${backendUrl}/api/notifications/user`;
        headers = { Authorization: `Bearer ${token}` };
      }
      
      console.log('aToken:', aToken);
      console.log('Fetching notifications from:', url);
      console.log('Using headers:', headers);
      
      const response = await axios.get(url, { headers });
      console.log('Response:', response.data);
      
      if (response.data.success) {
        // Map notifications to ensure each has an "id" property.
        const mappedNotifications = response.data.notifications.map(notif =>
          notif.id ? notif : { ...notif, id: notif._id }
        );
        setNotifications(mappedNotifications);
        setUnreadCount(mappedNotifications.filter(n => !n.read).length);
      } else {
        toast.error(response.data.message || "Failed to fetch notifications");
        if (response.data.message.includes("Not Authorized")) {
          setAToken('');
          localStorage.removeItem('aToken');
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error("Error fetching notifications");
    }
  };
    
  // Mark all notifications as read both in state and backend.
  const markAllAsRead = async () => {
    try {
      const token = aToken || dToken || localStorage.getItem('token');
      let url = "";
      if (aToken) {
        url = `${backendUrl}/api/notifications/admin/markAllRead`;
      } else if (dToken) {
        url = `${backendUrl}/api/notifications/doctor/markAllRead`;
      } else {
        url = `${backendUrl}/api/notifications/user/markAllRead`;
      }
  
      await axios.put(url, {}, { headers: { Authorization: `Bearer ${token}` } });
  
      // Update state after successful update
      const updatedNotifications = notifications.map(notif => ({ ...notif, read: true }));
      setNotifications(updatedNotifications);
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all as read", error);
      toast.error("Could not mark all notifications as read");
    }
  };

  // Mark a single notification as read.
  const markAsRead = async (id) => {
    try {
      const token = aToken || dToken || localStorage.getItem('token');
      let url = "";
      if (aToken) {
        url = `${backendUrl}/api/notifications/admin/markRead/${id}`;
      } else if (dToken) {
        url = `${backendUrl}/api/notifications/doctor/markRead/${id}`;
      } else {
        url = `${backendUrl}/api/notifications/user/markRead/${id}`;
      }
      
      await axios.put(url, {}, { headers: { Authorization: `Bearer ${token}` } });
      
      // Update local state: mark the notification as read.
      const updatedNotifications = notifications.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      );
      setNotifications(updatedNotifications);
      setUnreadCount(updatedNotifications.filter(n => !n.read).length);
      toast.success("Notification marked as read");
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Could not mark notification as read");
    }
  };

  // Delete notification from both UI and DB.
  const deleteNotification = async (id) => {
    try {
      const token = aToken || dToken || localStorage.getItem('token');
      let url = "";
      if (aToken) {
        url = `${backendUrl}/api/notifications/admin/${id}`;
      } else if (dToken) {
        url = `${backendUrl}/api/notifications/doctor/${id}`;
      } else {
        url = `${backendUrl}/api/notifications/user/${id}`;
      }
  
      await axios.delete(url, { headers: { Authorization: `Bearer ${token}` } });
  
      const newNotifications = notifications.filter(notif => notif.id !== id);
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.read).length);
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Could not delete notification");
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContextProvider;