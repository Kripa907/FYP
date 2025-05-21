import { useContext, useState } from 'react';
import { DoctorContext } from '../../context/DoctorContext';
import { NotificationContext } from '../../context/NotificationContext';
import { FiBell, FiCheck, FiTrash2 } from 'react-icons/fi';
import React from 'react';

const Doctornavbar = () => {
  const { doctorData } = useContext(DoctorContext);
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, deleteNotification } = useContext(NotificationContext);
  const [showNotifications, setShowNotifications] = useState(false);

  // Only show notifications for doctors
  const doctorNotifs = notifications.filter((n) => n.recipientType && n.recipientType.toLowerCase() === 'doctor');

  const handleNotifClick = () => {
    fetchNotifications();
    setShowNotifications(!showNotifications);
  };

  return (
    <div className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">Doctor Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <button 
                  onClick={handleNotifClick}
                  className="p-2 rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none"
                  aria-label="Notifications"
                >
                  <FiBell className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-block w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50">
                    <div className="py-2">
                      <div className="px-4 py-2 border-b flex justify-between items-center">
                        <h3 className="text-sm font-semibold">Notifications</h3>
                        <button 
                          onClick={markAllAsRead}
                          className="text-xs text-blue-500 hover:text-blue-700"
                        >
                          Mark all as read
                        </button>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {doctorNotifs.length === 0 ? (
                          <p className="text-sm text-gray-500 p-4 text-center">No notifications</p>
                        ) : (
                          doctorNotifs.map(notification => (
                            <div 
                              key={notification.id}
                              className={`px-4 py-3 border-b hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}
                            >
                              <div className="flex justify-between">
                                <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                                <div className="flex space-x-2">
                                  {!notification.read && (
                                    <button 
                                      onClick={() => markAsRead(notification.id)}
                                      className="text-gray-400 hover:text-blue-500"
                                      title="Mark as read"
                                    >
                                      <FiCheck className="h-4 w-4" />
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => deleteNotification(notification.id)}
                                    className="text-gray-400 hover:text-red-500"
                                    title="Delete"
                                  >
                                    <FiTrash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center">
                <div className="ml-3 relative">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700 mr-3">
                      Dr. {doctorData?.name || 'User'}
                    </span>
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-600 text-sm">
                        {doctorData?.name?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Doctornavbar;