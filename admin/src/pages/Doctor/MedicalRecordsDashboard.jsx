import React, { useState, useEffect, useContext } from 'react';
import Doctornavbar from '../../components/ui/Doctornavbar';
import DoctorSidebar from '../../components/ui/Doctorsidebar';
import axios from 'axios';
import { toast } from 'react-toastify';
import { DoctorContext } from '../../context/DoctorContext';
import EditRecordModal from '../../components/ui/EditRecordModal';
import { useNavigate } from 'react-router-dom';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4001';

// ViewRecordModal component remains the same
const ViewRecordModal = ({ record, onClose, onEdit }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Medical Record Details</h2>
          <p className="text-sm text-gray-600 mt-1">Viewing detailed information for medical record</p>
        </div>
        
        <div className="overflow-y-auto flex-1 p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
              <p className="text-sm text-gray-900">{record.patient}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Record Type</label>
                <p className="text-sm text-gray-900">{record.recordType}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <p className="text-sm text-gray-900">{record.date}</p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                ${record.status === 'Complete' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {record.status}
              </span>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <p className="text-sm text-gray-900 whitespace-pre-line">{record.notes}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attachments</label>
              <p className="text-sm text-gray-900 italic">
                {record.attachmentUrl ? (
                  <a 
                    href={record.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View Attachment
                  </a>
                ) : (
                  'No attachment'
                )}
              </p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Edit Record
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// DeleteConfirmationModal component remains the same
const DeleteConfirmationModal = ({ record, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Delete Medical Record</h2>
          <p className="text-sm text-gray-600 mt-1">Are you sure you want to delete this record?</p>
        </div>
        
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-700">
              You're about to delete the medical record for <span className="font-semibold">{record.patient}</span> ({record.recordType}).
            </p>
            <p className="text-red-600 mt-2">This action cannot be undone.</p>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Delete Record
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MedicalRecordsDashboard = () => {
  const { backendUrl, dToken } = useContext(DoctorContext);
  const [loading, setLoading] = useState(true);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deletingRecord, setDeletingRecord] = useState(null);
  const [allRecords, setAllRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const fetchRecords = async () => {
    try {
      console.log('Fetching medical records...');
      console.log('Using backend URL:', backendUrl);
      console.log('Using token:', dToken ? 'Token exists' : 'No token');
      
      setLoading(true);
      const response = await axios.get(`${backendUrl}/api/medical-records`, {
        headers: { 'Authorization': dToken }
      });
      
      console.log('Received response:', response.data);
      
      if (response.data.success) {
        const formatted = response.data.records.map((rec) => ({
          id: rec._id,
          patient: rec.patient?.name || 'Unknown Patient',
          recordType: rec.recordType,
          type: rec.recordType,
          date: rec.date ? new Date(rec.date).toISOString().split('T')[0] : '',
          formattedDate: rec.date ? new Date(rec.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '',
          appointmentDate: rec.appointment?.slotDate,
          appointmentTime: rec.appointment?.slotTime,
          notes: rec.notes,
          attachmentUrl: rec.attachmentUrl,
          status: rec.status
        }));
        setAllRecords(formatted);
      } else {
        toast.error(response.data.message || 'Failed to fetch medical records');
      }
    } catch (error) {
      console.error('Error fetching medical records:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again');
        navigate('/login');
      } else {
        toast.error(error.response?.data?.message || 'Error fetching medical records');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch all records on mount
  useEffect(() => {
    if (dToken) {
      fetchRecords();
    } else {
      toast.error('Please login to view medical records');
      navigate('/login');
    }
  }, [backendUrl, dToken, navigate]);

  const handleUpdateRecord = async (updatedRecord) => {
    try {
      console.log('Updating record:', updatedRecord);
      const response = await axios.put(`${backendUrl}/api/medical-records/${updatedRecord.id}`, updatedRecord, {
        headers: { 'Authorization': dToken }
      });
      
      if (response.data.success) {
        toast.success('Medical record updated successfully');
        setEditingRecord(null);
        // Refresh the records list
        fetchRecords();
      } else {
        toast.error(response.data.message || 'Failed to update medical record');
      }
    } catch (error) {
      console.error('Error updating medical record:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again');
        navigate('/login');
      } else {
        toast.error(error.response?.data?.message || 'Error updating medical record');
      }
    }
  };

  const handleDeleteRecord = async (recordId) => {
    try {
      console.log('Deleting record:', recordId);
      const response = await axios.delete(`${backendUrl}/api/medical-records/${recordId}`, {
        headers: { 'Authorization': dToken }
      });
      
      if (response.data.success) {
        toast.success('Medical record deleted successfully');
        setDeletingRecord(null);
        // Refresh the records list
        fetchRecords();
      } else {
        toast.error(response.data.message || 'Failed to delete medical record');
      }
    } catch (error) {
      console.error('Error deleting medical record:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again');
        navigate('/login');
      } else {
        toast.error(error.response?.data?.message || 'Error deleting medical record');
      }
    }
  };

  const handleViewRecord = (record) => {
    setViewingRecord(record);
  };

  const handleEditRecord = (record) => {
    setEditingRecord(record);
  };

  const filteredRecords = allRecords.filter(record => 
    record.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.recordType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-100">
      <DoctorSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Doctornavbar />
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Medical Records</h1>
            <p className="text-gray-600 mb-8">View and manage patient medical records</p>

            {/* Stats Card */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-500 text-sm font-medium">Total Records</h3>
                <p className="text-2xl font-bold text-gray-800">{allRecords.length}</p>
                <p className="text-sm text-green-600">{allRecords.filter(record => new Date(record.date) > new Date(new Date().setDate(new Date().getDate() - 30))).length} new this month</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search by patient name or record type..."
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* All Medical Records Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">All Medical Records</h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patients</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRecords.map((record) => (
                      <tr key={record.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{record.patient}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.recordType}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.formattedDate}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${record.status === 'Complete' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button 
                            className="text-blue-600 hover:text-blue-900 mr-3"
                            onClick={() => handleViewRecord(record)}
                          >
                            View
                          </button>
                          <button 
                            className="text-gray-600 hover:text-gray-900 mr-3"
                            onClick={() => handleEditRecord(record)}
                          >
                            Edit
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-900"
                            onClick={() => setDeletingRecord(record)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Record Modal */}
      {viewingRecord && (
        <ViewRecordModal
          record={viewingRecord}
          onClose={() => setViewingRecord(null)}
          onEdit={() => {
            setViewingRecord(null);
            handleEditRecord(viewingRecord);
          }}
        />
      )}

      {/* Edit Record Modal */}
      {editingRecord && (
        <EditRecordModal
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onUpdate={handleUpdateRecord}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingRecord && (
        <DeleteConfirmationModal
          record={deletingRecord}
          onClose={() => setDeletingRecord(null)}
          onConfirm={() => handleDeleteRecord(deletingRecord.id)}
        />
      )}
    </div>
  );
};

export default MedicalRecordsDashboard