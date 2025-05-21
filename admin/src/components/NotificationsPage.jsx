import React, { useState, useEffect, useContext } from 'react';
import { Bell, Check, X, Search } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { NotificationContext } from '../context/NotificationContext';
import axios from 'axios';

const NotificationsPage = () => {
    console.log('NotificationsPage component rendering');
    const { notifications, fetchNotifications, markAsRead, markAllAsRead, deleteNotification } = useContext(NotificationContext);

    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Filter notifications based on search query and filter type
    const filteredNotifications = notifications.filter(notif => {
        const matchesSearch = notif.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            notif.type?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'all' || (notif.type && notif.type.toLowerCase() === filter.toLowerCase());
        return matchesSearch && matchesFilter;
    });

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) {
            return 'just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
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
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Notifications</h1>
                <Button onClick={markAllAsRead} variant="outline">
                    Mark all as read
                </Button>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search notifications..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">All Types</option>
                    <option value="appointment">Appointments</option>
                    <option value="payment">Payments</option>
                    <option value="message">Messages</option>
                    <option value="system">System</option>
                </select>
            </div>

            <div className="space-y-4">
                {filteredNotifications.length > 0 ? (
                    filteredNotifications.map((notification) => {
                        console.log('Rendering notification:', notification);
                        return (
                            <div
                                key={notification._id}
                                className={`p-4 border rounded-lg ${!notification.read ? 'bg-blue-50' : ''}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-blue-100 rounded-full">
                                            <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                                        </div>
                                        <div>
                                            <h3 className="font-medium capitalize">{notification.type?.replace(/_/g, ' ') || 'No Type'}</h3>
                                            <p className="text-sm text-gray-600 mt-1">{notification.content || 'No content'}</p>
                                            <span className="text-xs text-gray-500 mt-1 block">
                                                {notification.createdAt ? formatTime(notification.createdAt) : 'Invalid Date'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!notification.read && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => markAsRead(notification._id)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => deleteNotification(notification._id)}
                                            className="text-gray-400 hover:text-red-600"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No notifications found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage; 