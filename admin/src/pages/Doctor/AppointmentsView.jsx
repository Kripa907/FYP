import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Doctorsidebar from '../../components/ui/Doctorsidebar';
import Doctornavbar from '../../components/ui/Doctornavbar';
import { DoctorContext } from '../../context/DoctorContext';

const AppointmentsView = () => {
  // State declarations
  const navigate = useNavigate();
  const { backendUrl, dToken, doctor } = useContext(DoctorContext);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [recordData, setRecordData] = useState({
    patientName: '',
    recordType: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    attachments: null
  });
  const [filePreview, setFilePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch appointments on component mount
  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    if (!dToken) {
      toast.error('Authentication token is missing');
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      // Fetch appointments
      const appointmentsResponse = await axios.get(`${backendUrl}/api/doctor/appointments`, {
        headers: { 'Authorization': dToken }
      });

      const fetchedAppointments = Array.isArray(appointmentsResponse.data) ? appointmentsResponse.data : [];
      // Fetch medical records
      const recordsResponse = await axios.get(`${backendUrl}/api/medical-records`, {
        headers: { 'Authorization': dToken }
      });

      const fetchedRecords = Array.isArray(recordsResponse.data.records) ? recordsResponse.data.records : [];

      // Merge records into appointments
      const appointmentsWithRecords = fetchedAppointments.map(appointment => {
        const relatedRecords = fetchedRecords.filter(record => record.appointment === appointment._id);
        return {
          ...appointment,
          records: relatedRecords,
        };
      });

      setAppointments(appointmentsWithRecords);
    } catch (error) {
      handleError(error, 'Failed to fetch appointments or records');
    } finally {
      setLoading(false);
    }
  };

  // Handle appointment status changes
  const handleStatusChange = async (appointmentId, action) => {
    try {
      let endpoint;
      let method;
      let data = {};

      switch (action) {
        case 'approve':
          endpoint = `${backendUrl}/api/doctor/appointments/${appointmentId}/approve`;
          method = 'patch';
          break;
        case 'reject':
          endpoint = `${backendUrl}/api/doctor/appointments/${appointmentId}/reject`;
          method = 'patch';
          break;
        case 'cancel':
          endpoint = `${backendUrl}/api/doctor/cancel-appointment`;
          method = 'post';
          data = { appointmentId };
          break;
        case 'complete':
          endpoint = `${backendUrl}/api/doctor/appointment/complete/${appointmentId}`;
          method = 'patch';
          break;
        default:
          throw new Error('Invalid action');
      }

      const { data: response } = await axios[method](
        endpoint,
        data,
        { headers: { 'Authorization': dToken } }
      );

      if (response.success) {
        // Update local state immediately for better UX
        setAppointments(prev =>
          prev.map(apt =>
            apt._id === appointmentId
              ? {
                  ...apt,
                  status: action === 'approve' ? 'Confirmed' :
                         action === 'reject' ? 'Rejected' :
                         action === 'cancel' ? 'Canceled' :
                         action === 'complete' ? 'Completed' : apt.status,
                  cancelled: action === 'cancel' ? true : apt.cancelled
                }
              : apt
          )
        );
        
        toast.success(`Appointment ${action}ed successfully`);
        
        // Fetch fresh data in the background
        fetchAppointments().catch(error => {
          console.error('Error refreshing appointments:', error);
          toast.error('Failed to refresh appointments list');
        });
      } else {
        throw new Error(response.message || `Failed to ${action} appointment`);
      }
    } catch (error) {
      console.error(`Error ${action}ing appointment:`, error);
      toast.error(error.response?.data?.message || error.message || `Failed to ${action} appointment`);
    }
  };

  // Handle medical record creation
  const handleCreateRecord = async () => {
    console.log('Create button clicked');
    console.log('Current appointment:', currentAppointment);
    
    // Validate form
    console.log('Starting form validation...');
    if (!recordData.recordType || !recordData.date || !recordData.notes || !recordData.attachments) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Get patient ID from the appointment
    const patientId = currentAppointment?.user?._id;
    console.log('Patient ID found:', patientId);
    
    if (!patientId) {
      console.error('Missing patient information:', {
        user: currentAppointment?.user,
        userData: currentAppointment?.userData
      });
      toast.error('Missing patient information');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('patient', patientId);
      formData.append('appointment', currentAppointment._id);
      formData.append('doctor', doctor._id);
      formData.append('recordType', recordData.recordType);
      formData.append('date', recordData.date);
      formData.append('notes', recordData.notes);
      formData.append('record', recordData.attachments);

      console.log('Form data prepared:', {
        patient: patientId,
        appointment: currentAppointment._id,
        doctor: doctor._id,
        recordType: recordData.recordType,
        date: recordData.date,
        notes: recordData.notes,
        file: recordData.attachments
      });

      const response = await axios.post(
        `${backendUrl}/api/medical-records`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': dToken
          }
        }
      );

      console.log('API Response:', response.data);
      handleSuccessfulRecordCreation(response.data);
    } catch (error) {
      console.error('Error creating medical record:', error);
      toast.error(error.response?.data?.message || 'Failed to create medical record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateRecordData = () => {
    console.log('Validating record data:', recordData);
    if (!recordData.recordType) {
      console.log('Missing record type');
      toast.error('Please select a record type');
      return false;
    }
    if (!recordData.date) {
      console.log('Missing date');
      toast.error('Please select a date');
      return false;
    }
    if (!recordData.notes.trim()) {
      console.log('Missing notes');
      toast.error('Please enter notes');
      return false;
    }
    if (!recordData.attachments) {
      console.log('Missing attachments');
      toast.error('Please attach a file');
      return false;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(recordData.attachments.type)) {
      console.log('Invalid file type:', recordData.attachments.type);
      toast.error('Invalid file type. Only JPEG, PNG, PDF, and DOC files are allowed.');
      return false;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (recordData.attachments.size > maxSize) {
      console.log('File too large:', recordData.attachments.size);
      toast.error('File size too large. Maximum size is 10MB.');
      return false;
    }

    console.log('Validation passed');
    return true;
  };

  const handleSuccessfulRecordCreation = (data) => {
    updateAppointmentWithRecord(data.record);
    resetRecordForm();
    setShowRecordModal(false);
    toast.success('Medical record created successfully');
  };

  const updateAppointmentWithRecord = (record) => {
    setAppointments(prev =>
      prev.map(apt =>
        apt._id === currentAppointment._id
          ? {
              ...apt,
              records: [...(apt.records || []), record],
              status: 'Completed'
            }
          : apt
      )
    );
  };

  const resetRecordForm = () => {
    setRecordData({
      patientName: '',
      recordType: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      attachments: null
    });
    setFilePreview(null);
  };

  const handleError = (error, defaultMessage) => {
    console.error('Error:', error);
    if (error.response?.status === 401) {
      toast.error('Session expired. Please log in again');
      navigate('/login');
    } else {
      toast.error(error.response?.data?.message || defaultMessage);
    }
  };

  // File handling
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG, PNG, PDF, and DOC files are allowed.');
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size too large. Maximum size is 10MB.');
      return;
    }

    setRecordData(prev => ({ ...prev, attachments: file }));
    createFilePreview(file);
  };

  const createFilePreview = (file) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Confirmed':
        return 'bg-green-100 text-green-800';
      case 'Completed':
        return 'bg-blue-100 text-blue-800';
      case 'Canceled':
        return 'bg-red-100 text-red-800';
      case 'Rejected':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filtering appointments
  const filteredAppointments = appointments.filter(appointment =>
    statusFilter === 'All' ||
    appointment.status === statusFilter
  ).filter(appointment =>
    appointment.user?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApprove = (appointmentId) => handleStatusChange(appointmentId, 'approve');
  const handleReject = (appointmentId) => handleStatusChange(appointmentId, 'reject');
  const handleCancel = (appointmentId) => handleStatusChange(appointmentId, 'cancel');
  const handleComplete = (appointmentId) => handleStatusChange(appointmentId, 'complete');

  const handleNewRecord = (appointment) => {
    console.log('New Record button clicked for appointment:', appointment);
    setCurrentAppointment(appointment);
    setRecordData(prev => ({
      ...prev,
      patientName: appointment.user?.name || 'Unknown'
    }));
    console.log('Setting record data:', {
      patientName: appointment.user?.name || 'Unknown',
      currentAppointment: appointment
    });
    setShowRecordModal(true);
  };

  const handleRecordInputChange = (e) => {
    const { name, value } = e.target;
    setRecordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Doctorsidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Doctornavbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <header className="mb-8">
              <h1 className="text-3xl font-semibold text-gray-900">Appointments</h1>
              <div className="mt-4 flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Search by patient name..."
                  className="flex-1 p-2 border rounded-md"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                  className="p-2 border rounded-md"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Completed">Completed</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Canceled">Canceled</option>
                </select>
              </div>
            </header>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="border-b border-gray-200">
                  <h3 className="px-6 py-3 text-lg font-medium text-gray-800">History of Appointments</h3>
                </div>
                <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Patient Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Appointment Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Records
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAppointments.map((appointment) => (
                        <tr key={appointment._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {appointment.user?.name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {appointment.user?.email}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {appointment.slotDate}
                            </div>
                            <div className="text-sm text-gray-500">
                              {appointment.slotTime}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(appointment.status)}`}>
                              {appointment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {appointment.records && appointment.records.length > 0 ? (
                              <span className="text-sm text-green-600 font-medium">Record Present</span>
                            ) : (
                              <button
                                onClick={() => handleNewRecord(appointment)}
                                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors text-sm"
                              >
                                New Record
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {appointment.status === 'Pending' && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleApprove(appointment._id)}
                                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors text-sm"
                                >
                                  Approve
                                </button>
                                <button 
                                  onClick={() => handleReject(appointment._id)} 
                                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors text-sm"
                                >
                                  Reject
                                </button>
                                <button 
                                  onClick={() => handleCancel(appointment._id)} 
                                  className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition-colors text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                            {appointment.status === 'Confirmed' && (
                              <div className="flex space-x-2">
                                <button 
                                  onClick={() => handleComplete(appointment._id)} 
                                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors text-sm"
                                >
                                  Complete
                                </button>
                                <button 
                                  onClick={() => handleCancel(appointment._id)} 
                                  className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition-colors text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                            {appointment.status === 'Completed' && (
                              <span className="text-green-600 font-medium">Completed</span>
                            )}
                            {appointment.status === 'Canceled' && (
                              <span className="text-gray-600 font-medium">Cancelled</span>
                            )}
                            {appointment.status === 'Rejected' && (
                              <span className="text-red-600 font-medium">Rejected</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredAppointments.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No appointments found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* New Record Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Create New Medical Record</h3>
              <p className="text-sm text-gray-500">Add a new medical record for a patient</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  value={recordData.patientName}
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Record Type</label>
                <select
                  name="recordType"
                  className="w-full p-2 border rounded-md"
                  value={recordData.recordType}
                  onChange={handleRecordInputChange}
                  required
                >
                  <option value="">Select record type</option>
                  <option value="Consultation">Consultation</option>
                  <option value="Lab Report">Lab Report</option>
                  <option value="Prescription">Prescription</option>
                  <option value="Diagnostic">Diagnostic</option>
                  <option value="Progress Note">Progress Note</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  className="w-full p-2 border rounded-md"
                  value={recordData.date}
                  onChange={handleRecordInputChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  className="w-full p-2 border rounded-md"
                  rows="3"
                  placeholder="Enter any relevant notes or observations"
                  value={recordData.notes}
                  onChange={handleRecordInputChange}
                ></textarea>
                <p className="text-xs text-gray-500 mt-1">
                  Include any symptoms, observations, or follow-up recommendations
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attachments</label>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
                  <input
                    type="file"
                    id="record-attachment"
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  <label
                    htmlFor="record-attachment"
                    className="cursor-pointer"
                  >
                    {filePreview ? (
                      <div className="mt-2">
                        <img src={filePreview} alt="Preview" className="max-h-40 mx-auto" />
                        <p className="mt-2 text-sm text-gray-600">
                          {recordData.attachments.name}
                        </p>
                      </div>
                    ) : (
                      <>
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                          aria-hidden="true"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <p className="mt-1 text-sm text-gray-600">
                          <span className="font-medium text-blue-600 hover:text-blue-500">
                            Upload a file
                          </span>{' '}
                          or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PDF, DOC, or images (max: 10MB)
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowRecordModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRecord}
                disabled={isSubmitting}
                className={`px-4 py-2 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-700 ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? 'Creating...' : 'Create Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsView