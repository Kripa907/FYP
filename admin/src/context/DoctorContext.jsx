import { createContext, useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export const DoctorContext = createContext();

export const DoctorProvider = ({ children }) => {
    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dToken, setDToken] = useState(() => {
        const token = localStorage.getItem('dToken');
        return token || null;
    });
    const [doctorName, setDoctorName] = useState('');
    const backendUrl = 'http://localhost:4001';
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDoctorDetails = async () => {
            try {
                if (!dToken) {
                    setLoading(false);
                    return;
                }

                const response = await axios.get(`${backendUrl}/api/doctor/me`, {
                    headers: {
                        'Authorization': dToken
                    }
                });

                if (response.data.success) {
                    setDoctor(response.data.doctor);
                    setDoctorName(response.data.doctor.name);
                }
            } catch (error) {
                console.error('Failed to fetch doctor details:', error);
                if (error.response?.status === 401) {
                    // Token expired or invalid
                    handleLogout();
                    toast.error('Session expired. Please login again.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchDoctorDetails();
    }, [dToken, backendUrl]);

    const handleLogout = () => {
        setDToken(null);
        setDoctor(null);
        setDoctorName('');
        localStorage.removeItem('dToken');
        navigate('/login');
    };

    const isAuthenticated = () => {
        return !!dToken && !!doctor;
    };

    const loginDoctor = async (credentials) => {
        try {
            const response = await axios.post(`${backendUrl}/api/doctor/login`, credentials);
            const { token, doctor: doctorData } = response.data;
            
            if (token && doctorData) {
                const bearerToken = `Bearer ${token}`;
                setDToken(bearerToken);
                setDoctor(doctorData);
                setDoctorName(doctorData.name);
                localStorage.setItem('dToken', bearerToken);
                toast.success('Login successful!');
                navigate('/doctor-dashboard');
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            console.error('Login failed:', error);
            toast.error(error.response?.data?.message || 'Login failed. Please try again.');
            throw error;
        }
    };

    const logoutDoctor = () => {
        handleLogout();
        toast.success('Logged out successfully');
    };

    const value = {
        doctor,
        setDoctor,
        loading,
        dToken,
        setDToken,
        backendUrl,
        isAuthenticated,
        doctorName,
        setDoctorName,
        loginDoctor,
        logoutDoctor
    };

    return (
        <DoctorContext.Provider value={value}>
            {children}
        </DoctorContext.Provider>
    );
};

export default DoctorProvider;