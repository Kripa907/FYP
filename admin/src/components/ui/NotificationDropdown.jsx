import React, { useState, useEffect, useContext } from 'react';
import { Bell, Trash2, Check } from 'lucide-react';
import { DoctorContext } from '../../context/DoctorContext';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { backendUrl, dToken } = useContext(DoctorContext);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/doctor/notifications`, {
        headers: {
          'Authorization': dToken
        }
      });

      if (response.data.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.notifications.filter(n => !n.read).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      if (error.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('dToken');
        window.location.href = '/login';
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Set up polling every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [backendUrl, dToken]);

  const handleDeleteNotification = async (notificationId) => {
    try {
      const response = await axios.delete(`${backendUrl}/api/doctor/notifications/${notificationId}`, {
        headers: {
          'Authorization': dToken
        }
      });

      if (response.data.success) {
        setNotifications(notifications.filter(n => n._id !== notificationId));
        toast.success('Notification deleted');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('dToken');
        window.location.href = '/login';
      } else {
        toast.error('Failed to delete notification');
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await axios.post(`${backendUrl}/api/doctor/notifications/mark-all-read`, {}, {
        headers: {
          'Authorization': dToken
        }
      });

      if (response.data.success) {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('dToken');
        window.location.href = '/login';
      } else {
        toast.error('Failed to mark notifications as read');
      }
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'appointment':
        return '📅';
      case 'appointment_approve':
        return '✅';
      case 'appointment_reject':
        return '❌';
      case 'appointment_cancel':
        return '🚫';
      case 'appointment_complete':
        return '🎉';
      case 'message':
        return '💬';
      case 'payment':
        return '💰';
      default:
        return '📢';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg overflow-hidden z-50">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <Check className="h-4 w-4" />
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 border-b hover:bg-gray-50 ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">{notification.content}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteNotification(notification._id)}
                      className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          {notifications.length > 0 && unreadCount > 0 && (
            <div className="p-3 border-t bg-gray-50">
              <button
                onClick={handleMarkAllAsRead}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Check className="h-4 w-4" />
                Mark All as Read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown; 