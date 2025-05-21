import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { FiSearch, FiChevronLeft, FiMoreVertical, FiSend } from 'react-icons/fi';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Messages = () => {
    const [activeConversation, setActiveConversation] = useState(null);
    const [message, setMessage] = useState('');
    const [doctors, setDoctors] = useState([]);
    const [messages, setMessages] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const socketRef = useRef(null);
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        // Fetch list of doctors
        const fetchDoctors = async () => {
            try {
                const response = await axios.get('http://localhost:4001/api/messages/user/chat-list', {
                    headers: {
                        'token': token
                    }
                });
                if (response.data.success) {
                    setDoctors(response.data.doctors);
                } else {
                    console.error('Failed to fetch doctors:', response.data.message);
                }
            } catch (error) {
                console.error('Error fetching doctors:', error);
            }
        };

        fetchDoctors();
    }, [token, navigate]);

    useEffect(() => {
        socketRef.current = io('http://localhost:4001');
        
        if (activeConversation) {
            const roomId = `chat-${activeConversation._id}-${localStorage.getItem('userId')}`;
            socketRef.current.emit('join-chat-room', { roomId });
        }

        socketRef.current.on('chat-message', (data) => {
            if (data.message) {
                setMessages(prev => {
                    // Check if message already exists to avoid duplicates
                    const messageExists = prev.some(msg => msg._id === data.message._id);
                    if (!messageExists) {
                        return [...prev, data.message];
                    }
                    return prev;
                });
            }
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.off('chat-message');
                socketRef.current.disconnect();
            }
        };
    }, [activeConversation]);

    // Add a new useEffect for periodic message fetching
    useEffect(() => {
        let intervalId;
        
        if (activeConversation) {
            // Initial fetch
            fetchMessages();
            
            // Set up periodic fetching every 5 seconds
            intervalId = setInterval(fetchMessages, 5000);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [activeConversation]);

    // Extract fetchMessages into a separate function
    const fetchMessages = async () => {
        if (!activeConversation) return;
        
        try {
            const response = await axios.get(`http://localhost:4001/api/messages/user/messages/${activeConversation._id}`, {
                headers: {
                    'token': token
                }
            });
            if (response.data.success) {
                setMessages(response.data.messages);
            } else {
                console.error('Failed to fetch messages:', response.data.message);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleSendMessage = async () => {
        if (message.trim() && activeConversation) {
            try {
                const response = await axios.post('http://localhost:4001/api/messages/user/messages', {
                    doctorId: activeConversation._id,
                    content: message.trim()
                }, {
                    headers: {
                        'token': token
                    }
                });

                if (response.data.success) {
                    const newMessage = {
                        _id: response.data.message._id,
                        content: message.trim(),
                        timestamp: new Date(),
                        senderType: 'user',
                        recipientType: 'doctor'
                    };
                    setMessages(prev => [...prev, newMessage]);
                    setMessage('');
                } else {
                    console.error('Failed to send message:', response.data.message);
                    // If not authorized, redirect to login
                    if (response.data.message === "Not Authorized Login Again") {
                        navigate('/login');
                    }
                }
            } catch (error) {
                console.error('Error sending message:', error);
                if (error.response?.data?.message === "Not Authorized Login Again") {
                    navigate('/login');
                }
            }
        }
    };

    const filteredDoctors = doctors.filter(doctor =>
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.speciality.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className={`w-full md:w-1/3 lg:w-1/4 bg-white border-r border-gray-200 ${activeConversation ? 'hidden md:block' : 'block'}`}>
                <div className="p-4 border-b border-gray-200">
                    <h1 className="text-xl font-bold text-gray-800">Messages</h1>
                    <p className="text-sm text-gray-500">Communicate with your healthcare team</p>
                </div>

                <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-3 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search doctors..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                        />
                    </div>
                </div>

                <div className="overflow-y-auto h-[calc(100%-150px)]">
                    {filteredDoctors.map((doctor) => (
                        <div
                            key={doctor._id}
                            className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${activeConversation?._id === doctor._id ? 'bg-blue-50' : ''}`}
                            onClick={() => setActiveConversation(doctor)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <img 
                                        src={doctor.image || 'https://via.placeholder.com/40'} 
                                        alt={doctor.name}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                    <div>
                                        <h3 className="font-medium text-gray-800">{doctor.name}</h3>
                                        <p className="text-xs text-gray-500">{doctor.speciality}</p>
                                    </div>
                                </div>
                                {doctor.lastAppointment && (
                                    <span className="text-xs text-gray-400">
                                        Last visit: {new Date(doctor.lastAppointment).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            {activeConversation ? (
                <div className="flex-1 flex flex-col">
                    {/* Chat Header */}
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
                        <div className="flex items-center">
                            <button 
                                className="md:hidden mr-2 text-gray-500"
                                onClick={() => setActiveConversation(null)}
                            >
                                <FiChevronLeft size={20} />
                            </button>
                            <div className="flex items-center space-x-3">
                                <img 
                                    src={activeConversation.image || 'https://via.placeholder.com/40'} 
                                    alt={activeConversation.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                                <div>
                                    <h2 className="font-medium text-gray-800">{activeConversation.name}</h2>
                                    <p className="text-xs text-gray-500">{activeConversation.speciality}</p>
                                </div>
                            </div>
                        </div>
                        <button className="text-gray-500">
                            <FiMoreVertical size={20} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`mb-4 ${msg.senderType === "user" ? 'text-right' : 'text-left'}`}
                            >
                                <div
                                    className={`inline-block p-3 rounded-lg max-w-xs md:max-w-md ${msg.senderType === "user" ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200'}`}
                                >
                                    <p>{msg.content}</p>
                                    <p className={`text-xs mt-1 ${msg.senderType === "user" ? 'text-blue-100' : 'text-gray-400'}`}>
                                        {new Date(msg.timestamp).toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t border-gray-200 bg-white">
                        <div className="flex items-center">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type your message..."
                                className="flex-1 py-2 px-4 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            />
                            <button
                                onClick={handleSendMessage}
                                className="ml-2 p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                <FiSend size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <h2 className="text-xl font-medium text-gray-600">Select a doctor to start messaging</h2>
                        <p className="text-gray-400 mt-2">Your messages with healthcare providers will appear here</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Messages;