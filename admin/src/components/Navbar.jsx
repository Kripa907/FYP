import React, { useContext, useState, useEffect } from 'react'
import { AdminContext } from '../context/AdminContext'
import { DoctorContext } from '../context/DoctorContext'
import { useNavigate } from 'react-router-dom'
import { FiBell, FiCheck, FiTrash2, FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { NotificationContext } from '../context/NotificationContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "./ui/dialog";
import ChangePassword from './ChangePassword';

const Navbar = () => {
    const { aToken, setAToken } = useContext(AdminContext)
    const { dToken, setDToken } = useContext(DoctorContext)
    const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, deleteNotification } = useContext(NotificationContext);
    const [showNotifications, setShowNotifications] = useState(false);
    const [adminNotifs, setAdminNotifs] = useState([]);
    const navigate = useNavigate();

    const logout = () => {
        navigate('/');
        if (aToken) {
            setAToken('');
            localStorage.removeItem('aToken');
        }
        if (dToken) {
            setDToken('');
            localStorage.removeItem('dToken');
        }
    };

    // Filter notifications for admin
    useEffect(() => {
      const filtered = notifications.filter(
        (n) => n.recipientType && n.recipientType.toLowerCase() === "admin"
      );
      setAdminNotifs(filtered);
    }, [notifications]);

    // Compute unread notifications count
    const unreadAdminNotifs = adminNotifs.filter(notif => !notif.read);

    const handleNotifClick = () => {
      fetchNotifications();
      setShowNotifications(!showNotifications);
    };

    return (
        <>
            <div className="flex justify-between items-center px-6 sm:px-10 py-6 border-b bg-white">
                <div>
                    <h1 className="text-lg font-bold text-gray-800">Admin Dashboard</h1>
                    <p className="text-xs text-gray-500">Welcome back, Admin</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Notification Icon */}
                    <div className="relative">
                        <button 
                          onClick={handleNotifClick}
                          className="p-2 rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none"
                          aria-label="Notifications"
                        >
                            <FiBell className="h-6 w-6" />
                            {unreadAdminNotifs.length > 0 && (
                                <span className="absolute top-0 right-0 inline-block w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                    {unreadAdminNotifs.length}
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
                                {adminNotifs.length === 0 ? (
                                  <p className="text-sm text-gray-500 p-4 text-center">No notifications</p>
                                ) : (
                                  adminNotifs.map(notification => (
                                    <div 
                                      key={notification._id}
                                      className={`px-4 py-3 border-b hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}
                                    >
                                      <div className="flex justify-between">
                                        <p className="text-sm font-medium text-gray-900 capitalize">{notification.type?.replace(/_/g, ' ') || 'Notification'}</p>
                                        <div className="flex space-x-2">
                                          {!notification.read && (
                                            <button 
                                              onClick={() => markAsRead(notification._id)}
                                              className="text-gray-400 hover:text-blue-500"
                                              title="Mark as read"
                                            >
                                              <FiCheck className="h-4 w-4" />
                                            </button>
                                          )}
                                          <button 
                                            onClick={() => deleteNotification(notification._id)}
                                            className="text-gray-400 hover:text-red-500"
                                            title="Delete"
                                          >
                                            <FiTrash2 className="h-4 w-4" />
                                          </button>
                                        </div>
                                      </div>
                                      <p className="text-sm text-gray-600 mt-1">{notification.content || 'No content'}</p>
                                      <p className="text-xs text-gray-400 mt-1">{notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ''}</p>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                    </div>

                    {/* Settings and Profile */}
                    {/* Removed Settings Dialog */}
                    {/* <Dialog open={showSettings} onOpenChange={setShowSettings}>
                        <DialogTrigger asChild>
                            <button className="p-2 rounded-full hover:bg-gray-100">
                                <Settings className="h-5 w-5 text-gray-600" />
                            </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md" aria-describedby="password-description">
                            <DialogHeader>
                                <DialogTitle>Change Password</DialogTitle>
                                <DialogDescription id="password-description">
                                    Update your account password here. Please make sure to use a strong password.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="py-4">
                                <ChangePassword />
                            </div>
                        </DialogContent>
                    </Dialog> */}

                    <div className="flex items-center gap-2 text-xs">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                            <FiUser className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{aToken ? 'Admin' : 'Doctor'}</span>
                    </div>

                    <button onClick={logout} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-1.5 rounded-full hidden sm:block transition-colors">
                        Logout
                    </button>
                </div>
            </div>
        </>
    );
};

export default Navbar;