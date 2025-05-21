import React, { useContext, useState, useEffect } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { DoctorContext } from '../../context/DoctorContext'
import { useNavigate } from 'react-router-dom'
import { FiUser } from 'react-icons/fi'
import { Settings } from 'lucide-react'
import { toast } from "sonner";
import axios from 'axios'
import NotificationDropdown from './NotificationDropdown'

const Doctornavbar = () => {
    const { dToken, setDToken, doctorName, setDoctorName, backendUrl } = useContext(DoctorContext);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDoctorInfo = async () => {
            try {
                const response = await axios.get(`${backendUrl}/api/doctor/dashboard`, {
                    headers: {
                        'Authorization': dToken
                    }
                });
                if (response.data.success) {
                    setDoctorName(response.data.doctorName);
                }
            } catch (error) {
                console.error('Error fetching doctor info:', error);
                if (error.response?.status === 401) {
                    // Token expired or invalid
                    setDToken(null);
                    localStorage.removeItem('dToken');
                    navigate('/login');
                    toast.error('Session expired. Please login again.');
                } else {
                    toast.error('Failed to fetch doctor information');
                }
            }
        };

        if (dToken) {
            fetchDoctorInfo();
        }
    }, [dToken, backendUrl, navigate, setDToken]);

    const logout = () => {
        setDToken('');
        localStorage.removeItem('dToken');
        navigate('/');
        toast.success("Logged out successfully");
    };

    return (
        <div className="flex justify-between items-center px-6 sm:px-10 py-4 border-b bg-white">
            {/* Right Section */}
            <div className="flex items-center gap-4 ml-auto">
                {/* Notifications */}
                <NotificationDropdown />

                {/* Profile Info */}
                <div className="flex items-center gap-2 text-xs">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        <FiUser />
                    </div>
                    {/* Display the doctor's name */}
                    <span className="text-sm font-medium text-gray-700">
                        Dr. {doctorName || "Loading..."}
                    </span>
                </div>

                {/* Logout Button */}
                <button
                    onClick={logout}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-1.5 rounded-full hidden sm:block transition-colors"
                >
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Doctornavbar