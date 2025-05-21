import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { DoctorContext } from '../../context/DoctorContext';
import Doctorsidebar from '../../components/ui/Doctorsidebar';
import Doctornavbar from '../../components/ui/Doctornavbar';
import { toast } from 'react-hot-toast';
import { FiSearch, FiSend } from 'react-icons/fi';

const Messages = () => {
  const { backendUrl, dToken } = useContext(DoctorContext);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      fetchMessages(selectedPatient._id);
    }
  }, [selectedPatient]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    socketRef.current = io('http://localhost:4001');
    console.log('Socket initialized in Doctor Messages');

    socketRef.current.on('connect', () => {
      console.log('Socket connected in Doctor Messages', socketRef.current.id);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('Socket disconnected in Doctor Messages', reason);
    });

    socketRef.current.on('error', (error) => {
      console.error('Socket error in Doctor Messages', error);
    });

    if (selectedPatient) {
      // Construct roomId consistently by sorting participant IDs
      const doctorId = localStorage.getItem('doctorId'); // Assuming doctorId is stored here
      const patientId = selectedPatient._id;
      const sortedIds = [doctorId, patientId].sort();
      const roomId = `chat-${sortedIds[0]}-${sortedIds[1]}`;
      socketRef.current.emit('join-chat-room', { roomId });
    }

    socketRef.current.on('chat-message', (data) => {
      console.log('Received chat-message:', data);
      const receivedMessage = data.message;
      const doctorId = localStorage.getItem('doctorId'); // Assuming doctorId is stored here

      console.log('Checking message for selected patient:', selectedPatient, 'and doctorId:', doctorId);
      console.log('Received message details:', { sender: receivedMessage.sender, recipient: receivedMessage.recipient, _id: receivedMessage._id });

      // Check if the received message belongs to the currently selected conversation
      if (selectedPatient && (
          (receivedMessage.sender === selectedPatient._id && receivedMessage.recipient === doctorId) ||
          (receivedMessage.sender === doctorId && receivedMessage.recipient === selectedPatient._id)
      )) {
          console.log('Message belongs to selected conversation, updating state.');
          setMessages(prev => {
              // Prevent duplicate messages
              if (!prev.some(msg => msg._id === receivedMessage._id)) {
                console.log('Adding new message to state:', receivedMessage);
                  return [...prev, receivedMessage];
              } else {
                console.log('Message already exists in state, not adding.');
              }
              return prev;
          });
      } else {
        console.log('Message does not belong to selected conversation.');
      }
    });

    // Listen for user status changes
    socketRef.current.on('user-status-change', ({ userId, isOnline }) => {
      setPatients(prevPatients =>
        prevPatients.map(patient =>
          patient._id === userId ? { ...patient, isOnline } : patient
        )
      );
    });

    // Emit user-connected event for the doctor when the component mounts
    // Assuming the doctor's user ID is available (e.g., from context or local storage)
    const doctorUserId = localStorage.getItem('doctorId'); // Replace with actual doctor user ID source
    if (doctorUserId) {
      socketRef.current.emit('user-connected', doctorUserId);
    }

    return () => {
      socketRef.current.disconnect();
    };
  }, [selectedPatient]);

  const fetchPatients = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/messages/doctor/chat-list`, {
        headers: { 'Authorization': dToken }
      });
      if (data.success) {
        setPatients(data.patients);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to fetch patients');
    }
  };

  const fetchMessages = async (patientId) => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/messages/doctor/messages/${patientId}`, {
        headers: { 'Authorization': dToken }
      });
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to fetch messages');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedPatient) return;

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/messages/doctor/messages`,
        {
          userId: selectedPatient._id,
          content: newMessage.trim()
        },
        {
          headers: { 'Authorization': dToken }
        }
      );
      if (data.success) {
        const newMsg = {
          _id: data.message._id,
          sender: 'doctor',
          content: newMessage.trim(),
          timestamp: data.message.timestamp || new Date(),
          senderType: 'doctor',
          recipientType: 'user'
        };
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
        toast.success('Message sent');
      } else {
        toast.error(data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.response?.data?.message || 'Failed to send message');
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <Doctorsidebar />
      <div className="flex-1 flex flex-col">
        <Doctornavbar />
        <div className="flex-1 flex">
          {/* Patients List */}
          <div className="w-2/5 border-r border-gray-200 bg-white">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Messages</h2>
              <p className="text-sm text-gray-500">Communicate with your patients</p>
            </div>
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <FiSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search patients..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredPatients.map((patient) => (
                <div
                  key={patient._id}
                  onClick={() => setSelectedPatient(patient)}
                  className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                    selectedPatient?._id === patient._id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{patient.name}
                        {/* Online status indicator */}
                        <span className={`ml-2 w-2 h-2 rounded-full inline-block ${patient.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                      </p>
                      <p className="text-sm text-gray-500">{patient.email}</p>
                      {patient.lastAppointment && (
                        <p className="text-xs text-gray-400">
                          Last visit: {new Date(patient.lastAppointment).toString() === 'Invalid Date'
                              ? new Date().toLocaleDateString()
                              : new Date(patient.lastAppointment).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filteredPatients.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  No patients found
                </div>
              )}
            </div>
          </div>

          {/* Chat area */}
          <div className="w-3/5 flex flex-col">
            {selectedPatient ? (
              <>
                <div className="p-4 border-b bg-white">
                  <h3 className="text-lg font-semibold">{selectedPatient.name}</h3>
                  <p className="text-sm text-gray-500">{selectedPatient.email}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                  {messages.length > 0 ? (
                    messages.map((message) => (
                      <div
                        key={message._id || message.timestamp}
                        className={`flex ${message.senderType === 'doctor' ? 'justify-end' : 'justify-start'} mb-1`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-2 py-1 ${
                            message.senderType === 'doctor'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 border border-gray-300'
                          }`}
                        >
                          <p className="text-xs">{message.content}</p>
                          <p className="text-xs mt-0.5 opacity-70">
                            {new Date(message.timestamp || message.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      No messages yet
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <form onSubmit={sendMessage} className="p-4 border-t bg-white">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                      disabled={!newMessage.trim()}
                    >
                      <FiSend size={20} />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a patient to start messaging
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages