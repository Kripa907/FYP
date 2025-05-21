import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Initialize Socket.IO connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    const userId = localStorage.getItem('userId');

    if (token && userType) {
      const newSocket = io(backendUrl, {
        auth: { token }
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
        // Join appropriate room based on user type
        if (userType === 'admin') {
          newSocket.emit('join-admin-room');
        } else if (userType === 'doctor') {
          newSocket.emit('join-doctor-room', userId);
        } else if (userType === 'user') {
          newSocket.emit('join-user-room', userId);
        }
      });

      // Listen for appointment notifications
      newSocket.on('new-appointment', (data) => {
        console.log('New appointment notification:', data);
        fetchNotifications(); // Refresh notifications
      });

      newSocket.on('appointment-approved', (data) => {
        console.log('Appointment approved notification:', data);
        fetchNotifications(); // Refresh notifications
      });

      newSocket.on('appointment-updated', (data) => {
        console.log('Appointment updated notification:', data);
        fetchNotifications(); // Refresh notifications
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, []);

  const handleAuthError = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    navigate('/login');
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        setNotifications([]);
        setUnreadCount(0);
        console.log('No token found. Not fetching notifications.');
        return;
      }

      // Get user type from token
      const userType = localStorage.getItem('userType') || 'user';
      console.log('User type from localStorage:', userType);
      const endpoint = userType === 'doctor' ? 'doctor' : 'user';
      const apiUrl = `${backendUrl}/api/notifications/${endpoint}`;

      console.log(`Fetching notifications for ${userType} from: ${apiUrl}`);

      const response = await axios.get(apiUrl, {
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Notification API response:', response);

      if (response.data.success && Array.isArray(response.data.notifications)) {
        console.log('Notifications fetched successfully:', response.data.notifications);
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.notifications.filter(n => !n.read).length);
      } else {
        console.error('Invalid response format:', response.data);
        setError('Failed to load notifications: Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      if (error.response?.data?.message === 'Not Authorized Login Again') {
        handleAuthError();
      }
      setError(error.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await axios.patch(`${backendUrl}/api/notifications/${notificationId}/read`, {}, {
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      setNotifications(notifications.map(n => 
        n._id === notificationId ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      if (error.response?.data?.message === 'Not Authorized Login Again') {
        handleAuthError();
      }
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await axios.patch(`${backendUrl}/api/notifications/read-all`, {}, {
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      if (error.response?.data?.message === 'Not Authorized Login Again') {
        handleAuthError();
      }
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await axios.delete(`${backendUrl}/api/notifications/${notificationId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      setNotifications(notifications.filter(n => n._id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error deleting notification:', error);
      if (error.response?.data?.message === 'Not Authorized Login Again') {
        handleAuthError();
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Set up polling every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      error,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      socket
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationProvider;