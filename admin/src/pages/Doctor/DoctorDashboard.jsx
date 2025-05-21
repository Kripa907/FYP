import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Doctorsidebar from '../../components/ui/Doctorsidebar';
import Doctornavbar from '../../components/ui/Doctornavbar';
import { DoctorContext } from '../../context/DoctorContext';

const DoctorDashboard = () => {
  const { backendUrl, dToken } = useContext(DoctorContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  const fetchData = async () => {
    if (!dToken) {
      toast.error("Please login to access the dashboard");
      return;
    }

    try {
      setLoading(true);
      // Fetch dashboard data
      const { data } = await axios.get(`${backendUrl}/api/doctor/dashboard`, {
        headers: {
          'Authorization': dToken
        }
      });

      if (data.success) {
        setDashboardData(data);
      } else {
        toast.error(data.message || "Failed to fetch dashboard data");
      }

      // Fetch appointments for the logged-in doctor
      const { data: appointmentsData } = await axios.get(`${backendUrl}/api/doctor/appointments`, {
        headers: {
          'Authorization': dToken
        }
      });
      setAppointments(appointmentsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('dToken');
        window.location.href = '/login';
        toast.error("Session expired. Please login again.");
      } else {
        toast.error(error.response?.data?.message || "Failed to fetch data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [backendUrl, dToken]);

  const handleApprove = async (appointmentId) => {
    try {
      setActionLoading(prev => ({ ...prev, [appointmentId]: true }));
      if (!dToken) {
        toast.error("Please login again");
        return;
      }
      const response = await axios.patch(
        `${backendUrl}/api/doctor/appointments/${appointmentId}/approve`,
        {},
        { headers: { 'Authorization': dToken } }
      );
      if (response.data.success) {
        toast.success('Appointment approved successfully');
        fetchData(); // Refresh the appointments list
      }
    } catch (error) {
      console.error('Error approving appointment:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('dToken');
        window.location.href = '/login';
      } else {
        toast.error(error.response?.data?.message || 'Failed to approve appointment');
      }
    } finally {
      setActionLoading(prev => ({ ...prev, [appointmentId]: false }));
    }
  };

  const handleReject = async (appointmentId) => {
    try {
      setActionLoading(prev => ({ ...prev, [appointmentId]: true }));
      if (!dToken) {
        toast.error("Please login again");
        return;
      }
      const response = await axios.patch(
        `${backendUrl}/api/doctor/appointments/${appointmentId}/reject`,
        {},
        { headers: { 'Authorization': dToken } }
      );
      if (response.data.success) {
        toast.success('Appointment rejected successfully');
        fetchData(); // Refresh the appointments list
      }
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('dToken');
        window.location.href = '/login';
      } else {
        toast.error(error.response?.data?.message || 'Failed to reject appointment');
      }
    } finally {
      setActionLoading(prev => ({ ...prev, [appointmentId]: false }));
    }
  };

  const handleComplete = async (appointmentId) => {
    try {
      setActionLoading(prev => ({ ...prev, [appointmentId]: true }));
      if (!dToken) {
        toast.error("Please login again");
        return;
      }
      const response = await axios.patch(
        `${backendUrl}/api/doctor/appointments/${appointmentId}/complete`,
        {},
        { headers: { 'Authorization': dToken } }
      );
      if (response.data.success) {
        toast.success('Appointment marked as completed');
        fetchData(); // Refresh the appointments list
      }
    } catch (error) {
      console.error('Error completing appointment:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('dToken');
        window.location.href = '/login';
      } else {
        toast.error(error.response?.data?.message || 'Failed to complete appointment');
      }
    } finally {
      setActionLoading(prev => ({ ...prev, [appointmentId]: false }));
    }
  };

  const handleCancel = async (appointmentId) => {
    try {
      setActionLoading(prev => ({ ...prev, [appointmentId]: true }));
      if (!dToken) {
        toast.error("Please login again");
        return;
      }
      const response = await axios.patch(
        `${backendUrl}/api/doctor/appointments/${appointmentId}/cancel`,
        {},
        { headers: { 'Authorization': dToken } }
      );
      if (response.data.success) {
        toast.success('Appointment cancelled successfully');
        fetchData(); // Refresh the appointments list
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('dToken');
        window.location.href = '/login';
      } else {
        toast.error(error.response?.data?.message || 'Failed to cancel appointment');
      }
    } finally {
      setActionLoading(prev => ({ ...prev, [appointmentId]: false }));
    }
  };

  const pendingAppointments = appointments.filter(apt => apt.status === 'Pending');

  return (
    <div className="flex h-screen bg-gray-50">
      <Doctorsidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Doctornavbar />
        <main className="flex-1 overflow-y-auto p-6">
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold text-medical-primary mb-2">Total Patients</h2>
              <div className="text-3xl font-bold">{dashboardData?.totalPatients || 0}</div>
              <p className="text-gray-500 text-sm">{dashboardData?.newPatientsThisMonth || 0} new this month</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold text-medical-primary mb-2">Total Appointments</h2>
              <div className="text-3xl font-bold">{dashboardData?.totalAppointments || 0}</div>
              <p className="text-gray-500 text-sm">All time appointments</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold text-medical-primary mb-2">Rating</h2>
              <div className="text-3xl font-bold">{dashboardData?.averageRating || '0'}</div>
              <p className="text-gray-500 text-sm">Based on patient feedback</p>
            </div>
          </div>

          {/* Pending Requests Section */}
          {pendingAppointments.length > 0 && (
            <div className="mb-6 bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-medical-primary">Pending Requests</h2>
                <p className="text-sm text-gray-500">You have {pendingAppointments.length} pending appointment requests</p>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  {pendingAppointments.map((appointment) => (
                    <div 
                      key={appointment._id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-lg">
                            {appointment.user?.name || 'Patient'}
                          </h3>
                          <p className="text-gray-600">
                            {appointment.slotDate} at {appointment.slotTime}
                          </p>
                          <div className="mt-2 space-y-1 text-sm text-gray-500">
                            <p>Email: {appointment.user?.email}</p>
                            <p>Reason: {appointment.reason || 'General Consultation'}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(appointment._id)}
                            disabled={actionLoading[appointment._id]}
                            className={`px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors ${
                              actionLoading[appointment._id] ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            {actionLoading[appointment._id] ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(appointment._id)}
                            disabled={actionLoading[appointment._id]}
                            className={`px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors ${
                              actionLoading[appointment._id] ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            {actionLoading[appointment._id] ? 'Processing...' : 'Reject'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Recent Appointments */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold text-medical-primary mb-4">Recent Appointments</h2>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-4">Loading appointments...</div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No appointments found</div>
              ) : (
                <div className="space-y-4">
                  {appointments
                    .sort((a, b) => {
                      // Convert DD_MM_YYYY to YYYY-MM-DD for proper comparison
                      const [dayA, monthA, yearA] = a.slotDate.split('_');
                      const [dayB, monthB, yearB] = b.slotDate.split('_');
                      
                      const dateA = new Date(`${yearA}-${monthA}-${dayA}`);
                      const dateB = new Date(`${yearB}-${monthB}-${dayB}`);
                      
                      if (dateA.getTime() !== dateB.getTime()) {
                        return dateB.getTime() - dateA.getTime(); // Sort newest first
                      }
                      // If dates are same, sort by time
                      return a.slotTime.localeCompare(b.slotTime);
                    })
                    .slice(0, 5)
                    .map((appointment) => (
                      <div 
                        key={appointment._id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-lg">
                              {appointment.user?.name || 'Patient'}
                            </h3>
                            <p className="text-gray-600">
                              {appointment.slotDate} at {appointment.slotTime}
                            </p>
                            <div className="mt-2 space-y-1 text-sm text-gray-500">
                              <p>Email: {appointment.user?.email}</p>
                              <p>Reason: {appointment.reason || 'General Consultation'}</p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            appointment.status === 'Confirmed' 
                              ? 'bg-green-100 text-green-800'
                              : appointment.status === 'Rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {appointment.status}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DoctorDashboard;