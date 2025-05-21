import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctorCount, setDoctorCount] = useState(0);
  const [patientCount, setPatientCount] = useState(0);
  const [dateRange, setDateRange] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchPendingDoctors();
    fetchDoctorCount();
    fetchPatientCount();
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await axios.get("http://localhost:4001/api/admin/appointments", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("aToken")}`,
        },
      });

      if (response.data.success) {
        console.log("Raw appointment data:", response.data.appointments[0]);

        const formattedAppointments = response.data.appointments.map((apt) => {
          // Extract patient name from userData or patientName field
          const patientName = 
            (apt.userData && apt.userData.name) || 
            apt.patientName || 
            "Unknown Patient";
            
          return {
            id: apt._id,
            patientName: patientName,
            patientEmail: (apt.userData && apt.userData.email) || apt.user?.email,
            doctorName: (apt.docData && apt.docData.name) || "Unknown Doctor",
            doctorSpeciality: (apt.docData && apt.docData.speciality) || "",
            date: apt.slotDate,
            time: apt.slotTime,
            status: apt.status,
            amount: apt.amount,
          };
        });
        
        console.log("Formatted appointments:", formattedAppointments);
        setAppointments(formattedAppointments);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to fetch appointments");
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const filterAppointments = () => {
    let filtered = [...appointments];

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (apt) => apt.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    const today = new Date();
    switch (dateRange) {
      case "week":
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((apt) => new Date(apt.date) > weekAgo);
        break;
      case "month":
        const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1);
        filtered = filtered.filter((apt) => new Date(apt.date) > monthAgo);
        break;
      case "year":
        const yearAgo = new Date(today.getFullYear() - 1, today.getMonth());
        filtered = filtered.filter((apt) => new Date(apt.date) > yearAgo);
        break;
      default:
        break;
    }

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const fetchPatientCount = async () => {
    try {
      const response = await axios.get("http://localhost:4001/api/admin/patient-count", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("aToken")}`,
        },
      });
      setPatientCount(response.data.count || 0);
    } catch (error) {
      console.error("Error fetching patient count:", error);
      toast.error("Failed to fetch patient count.");
    }
  };

  const fetchPendingDoctors = async () => {
    const token = localStorage.getItem("aToken");

    if (!token) {
      toast.error("Unauthorized: No token found. Please login again.");
      return;
    }

    try {
      const response = await axios.get("http://localhost:4001/api/admin/pending-doctors", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        const formattedDoctors = response.data.doctors.map((doc) => ({
          id: doc._id,
          name: doc.name,
          email: doc.email,
          specialty: doc.specialty || "General",
          image: doc.image || "https://via.placeholder.com/150", // Add default image
        }));
        setDoctors(formattedDoctors);
      } else {
        toast.error(response.data.message || "Failed to fetch pending doctors.");
        setDoctors([]);
      }
    } catch (error) {
      console.error("Error fetching pending doctors:", error.response);
      toast.error("Authorization failed. Please login again.");
    }
  };

  const fetchDoctorCount = async () => {
    try {
      const response = await axios.get("http://localhost:4001/api/admin/doctor-count", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("aToken")}`,
        },
      });
      setDoctorCount(response.data.count || 0);
    } catch (error) {
      console.error("Error fetching doctor count:", error);
      toast.error("Failed to fetch doctor count.");
    }
  };

  const handleApproveDoctor = async (id) => {
    try {
      const response = await axios.put(`http://localhost:4001/api/admin/approve-doctor/${id}`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("aToken")}`,
        },
      });
      if (response.data.success) {
        setDoctors(doctors.filter((doc) => doc.id !== id));
        toast.success("Doctor approved successfully");
      }
    } catch (error) {
      console.error("Error approving doctor:", error);
      toast.error("Failed to approve doctor");
    }
  };

  const handleRejectDoctor = async (id) => {
    try {
      const response = await axios.put(`http://localhost:4001/api/admin/reject-doctor/${id}`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("aToken")}`,
        },
      });
      if (response.data.success) {
        setDoctors(doctors.filter((doc) => doc.id !== id));
        toast.success("Doctor rejected successfully");
      }
    } catch (error) {
      console.error("Error rejecting doctor:", error);
      toast.error("Failed to reject doctor");
    }
  };

  const handleApprove = async (appointmentId) => {
    try {
      setActionLoading(prev => ({ ...prev, [appointmentId]: true }));
      const response = await axios.patch(
        `${backendUrl}/api/admin/appointments/${appointmentId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("aToken")}` } }
      );
      if (response.data.success) {
        toast.success('Appointment approved successfully');
        fetchAppointments(); // Refresh the appointments list
      }
    } catch (error) {
      console.error('Error approving appointment:', error);
      toast.error(error.response?.data?.message || 'Failed to approve appointment');
    } finally {
      setActionLoading(prev => ({ ...prev, [appointmentId]: false }));
    }
  };

  const handleReject = async (appointmentId) => {
    try {
      setActionLoading(prev => ({ ...prev, [appointmentId]: true }));
      const response = await axios.patch(
        `${backendUrl}/api/admin/appointments/${appointmentId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("aToken")}` } }
      );
      if (response.data.success) {
        toast.success('Appointment rejected successfully');
        fetchAppointments(); // Refresh the appointments list
      }
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      toast.error(error.response?.data?.message || 'Failed to reject appointment');
    } finally {
      setActionLoading(prev => ({ ...prev, [appointmentId]: false }));
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Total Doctors</h3>
          <p className="text-3xl font-bold text-primary">{doctorCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Total Patients</h3>
          <p className="text-3xl font-bold text-primary">{patientCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Total Appointments</h3>
          <p className="text-3xl font-bold text-primary">{appointments.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Pending Doctors</h3>
          <p className="text-3xl font-bold text-primary">{doctors.length}</p>
        </div>
      </div>

      {/* History of Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-lg shadow-sm mt-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-semibold">History of Appointments</h2>
              <div className="flex flex-wrap gap-3">
                <select
                  className="px-3 py-2 border rounded-md text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filterAppointments().map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{appointment.patientName}</div>
                      <div className="text-sm text-gray-500">{appointment.patientEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{appointment.doctorName}</div>
                      <div className="text-sm text-gray-500">{appointment.doctorSpeciality}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{appointment.date}</div>
                      <div className="text-sm text-gray-500">{appointment.time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {appointment.status === 'Pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprove(appointment.id)}
                            disabled={actionLoading[appointment.id]}
                            className={`px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm ${
                              actionLoading[appointment.id] ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            {actionLoading[appointment.id] ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(appointment.id)}
                            disabled={actionLoading[appointment.id]}
                            className={`px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm ${
                              actionLoading[appointment.id] ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            {actionLoading[appointment.id] ? 'Processing...' : 'Reject'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filterAppointments().length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No appointments found for the selected filters
              </div>
            )}
          </div>
        </div>

        {/* Pending Doctor Applications */}
        <div className="bg-white rounded-lg shadow-sm mt-8">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-xl font-semibold">Pending Doctor Applications</h2>
            <button
              onClick={() => navigate('/pending-doctors')}
              className="text-primary hover:text-primary-dark font-medium"
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">NAME</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">EMAIL</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">SPECIALTY</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {doctors.length > 0 ? (
                  doctors.slice(0, 5).map((doctor) => (
                    <tr key={doctor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={doctor.image}
                            alt={doctor.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                          <span className="font-medium">{doctor.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{doctor.email}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                          <span>{doctor.specialty}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => navigate(`/pending-doctors?doctor=${doctor.id}`)}
                          className="text-primary hover:text-primary-dark font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                      No pending doctor applications
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard