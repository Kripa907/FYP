import { createContext } from "react";
import { useState } from "react";
import axios from 'axios'
import { toast } from "react-toastify";

export const AdminContext = createContext();

const AdminContextProvider = (props) => {
    const [aToken, setAToken] = useState((localStorage.getItem('aToken') ? localStorage.getItem('aToken') : ''))
    const [doctors, setDoctors] = useState([])
    const [appointments, setAppointments] = useState([])
    const [dashData, setDashData] = useState([])
    const [isLoading, setIsLoading] = useState(false)

    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4001";

      const getAllDoctors = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/admin/all-doctors`, {
          headers: {
            Authorization: `Bearer ${aToken}`, 
          },
        });
    
        if (data.success) {
          setDoctors(data.doctors);
          console.log(data.doctors);
        } else {
          toast.error(data.message || "Failed to fetch doctors");
        }
      } catch (error) {
        console.error("Error fetching doctors:", error);
        toast.error("Failed to fetch doctors. Please try again.");
      }
    }

  const getDashData = async () => {
  try {
    const { data } = await axios.get(`${backendUrl}/api/admin/dashboard`, {
      headers: {
        Authorization: `Bearer ${aToken}`,
      },
    });

    if (data.success) {
      setDashData(data.dashData);
      console.log(data.dashData);
    } else {
      toast.error(data.message || "Failed to fetch dashboard data.");
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    toast.error("Failed to fetch dashboard data. Please try again.");
  }
}

const getAllAppointments = async () => {
  // If already loading, don't make another request
  if (isLoading) {
    console.log("Already fetching appointments, skipping request");
    return;
  }
  
  try {
    setIsLoading(true);
    console.log("Fetching appointments with token:", aToken);
    const response = await axios.get(`${backendUrl}/api/admin/appointments`, {
      headers: {
        Authorization: `Bearer ${aToken}`,
      },
    });
    console.log("Appointment response:", response.data);
    if (response.data.success) {
      setAppointments(response.data.appointments || []);
      console.log("Appointments set in state:", response.data.appointments.length, "appointments");
    } else {
      toast.error(response.data.message || "Failed to fetch appointments");
    }
  } catch (error) {
    console.error("Error fetching appointments:", error);
    toast.error("Failed to fetch appointments");
  } finally {
    setIsLoading(false);
  }
}

// Function to delete an appointment
const deleteAppointment = async (id) => {
  try {
    const response = await axios.delete(`${backendUrl}/api/admin/appointments/${id}`, {
      headers: {
        Authorization: `Bearer ${aToken}`,
      },
    });
    if (response.data.success) {
      // Update the appointments list by filtering out the deleted one
      setAppointments(appointments.filter(apt => apt._id !== id));
      return true;
    } else {
      toast.error(response.data.message || "Failed to delete appointment");
      return false;
    }
  } catch (error) {
    console.error("Error deleting appointment:", error);
    toast.error("Failed to delete appointment");
    throw error;
  }
}

    const updateDoctor = async (id, updatedData) => {
      try {
        const response = await axios.put(`${backendUrl}/api/admin/doctors/${id}`, updatedData, {
          headers: {
            Authorization: `Bearer ${aToken}`,
          },
        });
        if (response.data.success) {
          setDoctors(doctors => doctors.map(doc => doc._id === id ? { ...doc, ...updatedData } : doc));
          toast.success(response.data.message || "Doctor updated successfully");
          return true;
        } else {
          toast.error(response.data.message || "Failed to update doctor");
          return false;
        }
      } catch (error) {
        console.error("Error updating doctor:", error);
        toast.error("Failed to update doctor");
        throw error;
      }
    }

    const deleteDoctor = async (id) => {
      try {
        const response = await axios.delete(`${backendUrl}/api/admin/doctors/${id}`, {
          headers: {
            Authorization: `Bearer ${aToken}`,
          },
        });
        if (response.data.success) {
          setDoctors(doctors => doctors.filter(doc => doc._id !== id));
          toast.success(response.data.message || "Doctor deleted successfully");
          return true;
        } else {
          toast.error(response.data.message || "Failed to delete doctor");
          return false;
        }
      } catch (error) {
        console.error("Error deleting doctor:", error);
        toast.error("Failed to delete doctor");
        throw error;
      }
    }

    const value = {
        aToken,setAToken,
        backendUrl,doctors,
        appointments,
        isLoading,
        getAllDoctors, 
        dashData, 
        getDashData, 
        getAllAppointments,
        deleteAppointment,
        updateDoctor,
        deleteDoctor
    }

    return (
        <AdminContext.Provider value={value}>
            {props.children}
        </AdminContext.Provider>
    )
}

export default AdminContextProvider