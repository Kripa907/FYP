import React, { useContext, useEffect, useState, useRef } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';
import { toast } from 'react-toastify';
import Doctorsidebar from '../../components/ui/Doctorsidebar';
import Doctornavbar from '../../components/ui/Doctornavbar';

const AllAppointment = () => {
  const { aToken, appointments, getAllAppointments, deleteAppointment, isLoading } = useContext(AdminContext);
  const { calculateAge, slotDateFormat, currency, slotTimeFormat } = useContext(AppContext);
  const [dateRange, setDateRange] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [localAppointments, setLocalAppointments] = useState([]);
  const dataFetchedRef = useRef(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [appointmentToDeleteId, setAppointmentToDeleteId] = useState(null);

  // Fetch appointments only once when component mounts
  useEffect(() => {
    // Only fetch if we haven't already and we have a token
    if (!dataFetchedRef.current && aToken) {
      const fetchData = async () => {
        setLoading(true);
        try {
          await getAllAppointments();
          // Mark that we've fetched data
          dataFetchedRef.current = true;
        } catch (error) {
          console.error("Error fetching appointments:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [aToken]); // Only depend on aToken, not on getAllAppointments
  
  // Update local state when appointments change
  useEffect(() => {
    if (appointments) {
      console.log("Appointments updated in component:", appointments);
      setLocalAppointments(appointments);
    }
  }, [appointments]);

  // Status color utility (like AdminDashboard)
  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  // Simplified filter logic with better debugging
  const filterAppointments = () => {
    if (!localAppointments || !Array.isArray(localAppointments)) {
      console.log("No appointments to filter");
      return [];
    }
    
    // Log all appointments with their status for debugging
    console.log("All appointments with status:", localAppointments.map(apt => ({
      id: apt._id,
      status: apt.status,
      date: apt.slotDate,
      patientName: apt.userData?.name
    })));
    
    let filtered = [...localAppointments];
    
    // Filter by status - simplified
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => {
        // Handle various status formats and fallbacks
        const aptStatus = apt.status || 
                         (apt.cancelled ? 'cancelled' : 
                         (apt.isCompleted ? 'completed' : 'pending'));
        
        return aptStatus.toLowerCase().includes(statusFilter.toLowerCase());
      });
    }
    
    // Enhanced date range filtering: 'week' = last 7 days, 'month' = last 30 days
    if (dateRange !== 'all') {
      const today = new Date();
      let cutoffDate;
      if (dateRange === 'week') {
        cutoffDate = new Date(today);
        cutoffDate.setDate(today.getDate() - 7);
      } else if (dateRange === 'month') {
        cutoffDate = new Date(today);
        cutoffDate.setDate(today.getDate() - 30);
      } else if (dateRange === 'year') {
        cutoffDate = new Date(today);
        cutoffDate.setFullYear(today.getFullYear() - 1);
      } else {
        cutoffDate = null;
      }
      if (cutoffDate) {
        filtered = filtered.filter(apt => {
          if (!apt.slotDate) return false;
          let aptDate;
          try {
            aptDate = new Date(apt.slotDate);
            if (isNaN(aptDate.getTime())) {
              // Try DD-MM-YYYY
              const parts = apt.slotDate.split('-');
              if (parts.length === 3) {
                aptDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
              }
            }
            // Only include appointments on/after cutoff
            return aptDate >= cutoffDate;
          } catch (e) {
            console.error(`Error parsing date: ${apt.slotDate}`, e);
            return false;
          }
        });
      }
    }
    
    // Log filtered results
    console.log(`After filtering (status: ${statusFilter}, date range: ${dateRange}):`, 
      filtered.map(apt => ({
        id: apt._id,
        status: apt.status,
        date: apt.slotDate,
        patientName: apt.userData?.name
      })));
    
    // Sort by date (newest first)
    return filtered.sort((a, b) => {
      // Safely parse dates
      const dateA = new Date(a.slotDate || 0);
      const dateB = new Date(b.slotDate || 0);
      return dateB - dateA;
    });
  };

  // Handle delete click to open modal
  const handleDeleteClick = (id) => {
    setAppointmentToDeleteId(id);
    setDeleteModalOpen(true);
  };

  // Confirm and delete appointment
  const handleConfirmDelete = async () => {
    if (!appointmentToDeleteId) return;
    setDeleteModalOpen(false); // Close modal immediately
    setLoading(true);
    try {
      const success = await deleteAppointment(appointmentToDeleteId);
      if (success) {
        toast.success('Appointment deleted');
        // Update local state immediately to improve UI responsiveness
        // This prevents the need to refetch all appointments
        setLocalAppointments(prev => prev.filter(apt => apt._id !== appointmentToDeleteId));
      } else {
        toast.error('Failed to delete appointment');
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error('Failed to delete appointment');
    } finally {
      setLoading(false);
      setAppointmentToDeleteId(null); // Clear the ID
    }
  };

  // Cancel delete action
  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setAppointmentToDeleteId(null);
  };

  // Debug information
  console.log("Render state - loading:", loading, "appointments count:", 
    localAppointments ? localAppointments.length : 0);

  return (
    <div className="w-full max-w-6xl m-5">
      <div className="flex flex-wrap gap-4 items-center mb-4">
        <p className="text-lg font-medium">All Appointments</p>
        {/* <select
          className="border rounded px-3 py-1 text-sm"
          value={dateRange}
          onChange={e => setDateRange(e.target.value)}
        >
          <option value="all">All Time</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last Month</option>
          <option value="year">Last Year</option>
        </select> */}
        <select
          className="border rounded px-3 py-1 text-sm"
          value={statusFilter}
          onChange={e => {
            console.log("Setting status filter to:", e.target.value);
            setStatusFilter(e.target.value);
          }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">#</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Patient</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Doctor</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Fee</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Payment</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading || isLoading ? (
              <tr><td colSpan="10" className="text-center py-8 text-gray-400">Processing...</td></tr>
            ) : filterAppointments().length === 0 ? (
              <tr><td colSpan="10" className="text-center py-8 text-gray-400">No appointments found for the selected filters</td></tr>
            ) : (
              filterAppointments().map((apt, idx) => {
                // Extract user and doctor data safely
                const userData = apt.userData || apt.user || {};
                const docData = apt.docData || apt.doctor || {};
                const userName = userData.name || 'Unknown';
                const doctorName = docData.name || 'Unknown';
                const userImage = userData.image || assets.user_icon;
                const doctorImage = docData.image || assets.user_icon;
                const appointmentId = apt._id || `temp-${idx}`;
                const appointmentStatus = apt.status || 'Unknown';
                const appointmentDate = apt.slotDate || 'No date';
                const appointmentTime = apt.slotTime || 'No time';
                const appointmentAmount = apt.amount || 0;
                
                return (
                  <tr key={appointmentId}>
                    <td className="px-4 py-3">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img className="w-9 h-9 rounded-full object-cover" src={userImage} alt=" " />
                        <span className="font-medium">{userName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img className="w-9 h-9 rounded-full object-cover" src={doctorImage} alt=" " />
                        <span className="font-medium">{doctorName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">{slotDateFormat(appointmentDate)}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{slotTimeFormat(appointmentTime)}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{currency}{appointmentAmount}</td>
                    <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${apt.payment ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {apt.payment ? 'Paid' : 'Unpaid'}
                        </span>
                    </td>
                    <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointmentStatus)}`}>
                            {appointmentStatus}
                        </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                        <button 
                            onClick={() => handleDeleteClick(appointmentId)}
                            className="text-red-600 hover:text-red-900"
                        >
                            Delete
                        </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Confirm Deletion</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this appointment? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AllAppointment