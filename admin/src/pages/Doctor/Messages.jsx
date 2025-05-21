// import { useState, useEffect, useRef, useContext } from 'react';
// import { io } from 'socket.io-client';
// import axios from 'axios';
// import { Link, useLocation } from 'react-router-dom';
// import Doctorsidebar from '../../components/ui/Doctorsidebar';
// import Doctornavbar from '../../components/ui/Doctornavbar';
// import { DoctorContext } from '../../context/DoctorContext';

// const Messages = () => {
//   const { dToken } = useContext(DoctorContext);
//   const [patients, setPatients] = useState([]);
//   const [activePatientIndex, setActivePatientIndex] = useState(0);
//   const [message, setMessage] = useState('');
//   const socketRef = useRef(null);

//   // Get doctorId from localStorage or context
//   const doctorId = localStorage.getItem('doctorId') || 'doctor123';
//   const patientId = patients[activePatientIndex]?._id;

//   // Fetch appointments to get patients
// useEffect(() => {
//     const fetchAppointments = async () => {
//       try {
//         const res = await axios.get('http://localhost:4001/api/doctor/appointments', {
//           params: { doctorId },
//           headers: {
//             'dtoken': dToken 
//           }
//         });
        
//         const uniquePatients = {};
//         res.data.forEach(appointment => {
//           if (appointment.patient && appointment.patient._id) {
//             uniquePatients[appointment.patient._id] = {
//               ...appointment.patient,
//               messages: []
//             };
//           }
//         });
//         setPatients(Object.values(uniquePatients));
//       } catch (error) {
//         console.error('Error fetching appointments:', error);
//       }
//     };

//     if (doctorId && dToken) { // Only fetch if we have both doctorId and token
//       fetchAppointments();
//     }
//   }, [doctorId, dToken]);

//   // Socket connection
//   useEffect(() => {
//     if (socketRef.current) {
//       socketRef.current.disconnect();
//     }
//     socketRef.current = io('http://localhost:4001');
    
//     if (doctorId && patientId) {
//       const roomId = `chat-${doctorId}-${patientId}`;
//       socketRef.current.emit('join-chat-room', { roomId });
      
//       // Listen for incoming messages
//       socketRef.current.on('chat-message', ({ message: incomingMsg, doctorId: dId, patientId: pId }) => {
//         if (dId === doctorId && pId === patientId) {
//           setPatients(prevPatients =>
//             prevPatients.map((pt, idx) => {
//               if (idx === activePatientIndex) {
//                 return { ...pt, messages: [...pt.messages, incomingMsg] };
//               }
//               return pt;
//             })
//           );
//         }
//       });
//     }
//     return () => {
//       socketRef.current.disconnect();
//     };
//   }, [doctorId, patientId, activePatientIndex]);


//   const handleSendMessage = () => {
//     if (message.trim() && doctorId && patientId) {
//       const msgObj = {
//         sender: 'doctor',
//         text: message,
//         time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
//       };
//       const roomId = `chat-${doctorId}-${patientId}`;
//       // Emit via socket
//       socketRef.current.emit('chat-message', { roomId, message: msgObj });
//       // Update UI
//       setPatients(prevPatients =>
//         prevPatients.map((pt, idx) => {
//           if (idx === activePatientIndex) {
//             return { ...pt, messages: [...pt.messages, msgObj] };
//           }
//           return pt;
//         })
//       );
//       setMessage('');
//     }
//   };

//   return (
//     <div className="flex h-screen bg-gray-50">
//       <Doctorsidebar />
//       <div className="flex-1 flex flex-col">
//         <Doctornavbar />
//         <div className="flex h-screen bg-gray-50">
//           {/* Messages Content */}
//           <div className="flex-1 flex flex-col">
//             <div className="p-6">
//               <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
//               <p className="text-gray-600 mt-1">Communicate with your patients</p>
//               <div className="flex mt-6 h-[calc(100vh-180px)]">
//                 {/* Patients List */}
//                 <div className="w-1/3 pr-4 border-r border-gray-200">
//                   <div className="relative mb-4">
//                     <input
//                       type="text"
//                       placeholder="Search patients..."
//                       className="w-full p-2 pl-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-primary"
//                     />
//                     <svg
//                       className="absolute left-2 top-3 h-4 w-4 text-gray-400"
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                       xmlns="http://www.w3.org/2000/svg"
//                     >
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//                     </svg>
//                   </div>
//                   <div className="space-y-2 overflow-y-auto h-[calc(100%-40px)]">
//                     {patients.length === 0 ? (
//                       <p className="text-gray-500">No patients found.</p>
//                     ) : (
//                       patients.map((patient, idx) => (
//                         <div
//                           key={patient._id}
//                           className={`p-3 rounded-lg cursor-pointer ${activePatientIndex === idx ? 'bg-medical-light' : 'hover:bg-gray-100'}`}
//                           onClick={() => setActivePatientIndex(idx)}
//                         >
//                           <div className="flex flex-col">
//                             <span className="font-medium">{patient.name}</span>
//                             <span className="text-xs text-gray-500">{patient.email}</span>
//                           </div>
//                         </div>
//                       ))
//                     )}
//                   </div>
//                 </div>
//                 {/* Active Conversation */}
//                 <div className="flex-1 pl-4 flex flex-col">
//                   <div className="border-b border-gray-200 pb-2">
//                     <h2 className="text-lg font-medium">{patients[activePatientIndex]?.name || 'Select a patient'}</h2>
//                     <p className="text-sm text-gray-500">{patients[activePatientIndex]?.email}</p>
//                   </div>
//                   <div className="flex-1 overflow-y-auto py-4 space-y-4">
//                     {patients[activePatientIndex]?.messages?.length > 0 ? (
//                       patients[activePatientIndex].messages.map((msg, idx) => (
//                         <div key={idx} className={`flex ${msg.sender === 'doctor' ? 'justify-end' : 'justify-start'}`}>
//                           <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${msg.sender === 'doctor' ? 'bg-medical-primary text-white' : 'bg-gray-200'}`}>
//                             <p>{msg.text}</p>
//                             <p className={`text-xs mt-1 ${msg.sender === 'doctor' ? 'text-white text-opacity-80' : 'text-gray-500'}`}>{msg.time}</p>
//                           </div>
//                         </div>
//                       ))
//                     ) : (
//                       <div className="flex items-center justify-center h-full text-gray-500">
//                         No messages yet
//                       </div>
//                     )}
//                   </div>
//                   <div className="mt-auto pt-4">
//                     <div className="flex items-center border-t border-gray-200 pt-4">
//                       <input
//                         type="text"
//                         value={message}
//                         onChange={(e) => setMessage(e.target.value)}
//                         placeholder="Type your message..."
//                         className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-medical-primary"
//                         onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
//                       />
//                       <button
//                         onClick={handleSendMessage}
//                         className="bg-medical-primary text-white px-4 py-2 rounded-r-lg hover:bg-medical-dark transition-colors"
//                       >
//                         Send
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Messages;

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
    
    if (selectedPatient) {
      const roomId = `chat-${localStorage.getItem('doctorId')}-${selectedPatient._id}`;
      socketRef.current.emit('join-chat-room', { roomId });
    }

    socketRef.current.on('chat-message', (data) => {
      setMessages(prev => [...prev, data.message]);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [selectedPatient]);

  const fetchPatients = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/messages/doctor/chat-list`, {
        headers: { dtoken: dToken }
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
        headers: { dtoken: dToken }
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
          headers: { dtoken: dToken }
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
          <div className="w-1/3 border-r border-gray-200 bg-white">
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
            <div className="overflow-y-auto h-[calc(100vh-200px)]">
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
                      <p className="font-medium">{patient.name}</p>
                      <p className="text-sm text-gray-500">{patient.email}</p>
                      {patient.lastAppointment && (
                        <p className="text-xs text-gray-400">
                          Last visit: {new Date(patient.lastAppointment).toLocaleDateString()}
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
          <div className="flex-1 flex flex-col">
            {selectedPatient ? (
              <>
                <div className="p-4 border-b bg-white">
                  <h3 className="text-lg font-semibold">{selectedPatient.name}</h3>
                  <p className="text-sm text-gray-500">{selectedPatient.email}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length > 0 ? (
                    messages.map((message) => (
                      <div
                        key={message._id || message.timestamp}
                        className={`flex ${
                          message.senderType === 'doctor' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            message.senderType === 'doctor'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100'
                          }`}
                        >
                          <p>{message.content}</p>
                          <p className="text-xs mt-1 opacity-70">
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