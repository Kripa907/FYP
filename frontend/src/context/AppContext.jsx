import { createContext, useState } from "react";
import PropTypes from 'prop-types';
import axios from 'axios';
import { useEffect } from "react";
import { toast } from "react-toastify";

export const AppContext = createContext();

const AppContextProvider = (props) => {
  const currencySymbol = ' NPR ';
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [token, setToken] = useState(localStorage.getItem('token') || false);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(false);

  const getDoctorsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!backendUrl) {
        throw new Error('Backend URL is not configured');
      }

      const { data } = await axios.get(`${backendUrl}/api/doctor/list`);

      if (data.success) {
        setDoctors(data.doctors);
      } else {
        setError(data.message);
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfileData = async () => {
    try {
      if (!token) return;

      const { data } = await axios.get(`${backendUrl}/api/user/get-profile`, {
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });

      if (data.success) {
        setUserData(data.userData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      toast.error(error.message);
    }
  };

  const value = {
    doctors,
    loading,
    error,
    getDoctorsData,
    currencySymbol,
    token,
    setToken,
    backendUrl,
    userData,
    setUserData,
    loadUserProfileData
  };

  useEffect(() => {
    getDoctorsData();
  }, []);

  useEffect(() => {
    if (token) {
      loadUserProfileData();
    } else {
      setUserData(false);
    }
  }, [token]);

  return (
    <AppContext.Provider value={value}>
      {props.children}
    </AppContext.Provider>
  );
};

AppContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AppContextProvider




// import { createContext } from "react";
// import { doctors } from "../assets/assets";
// import {toast} from 'react-toastify'

// export const AppContext =createContext()

// const AppContextProvider =(props) =>{
//     const currencySymbol ='$'
//     const backendUrl =import.meta.env.VITE_BACKEND_URL
//     const [token,setToken] = useState(localStorage.getItem('token')?localStorage.getItem('token'):false)

//     const value = {
//         doctors,
//         currencySymbol, 
//         token,setToken, 
//         backendUrl

//     }
//     return(
//         <AppContext.Provider value={value}>
//             {props.children}
//         </AppContext.Provider>
//     )
// }

// export default AppContextProvider