import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const MedicalRecords = () => {
  const { token, backendUrl } = useContext(AppContext);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchRecords = async () => {
      if (!token) {
        toast.error('Please login to view your medical records');
        return;
      }

      try {
        const response = await axios.get(`${backendUrl}/api/medical-records/user`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data.success) {
          setRecords(response.data.records);
        } else {
          toast.error(response.data.message || 'Failed to fetch medical records');
        }
      } catch (error) {
        console.error('Error fetching medical records:', error);
        toast.error(error.response?.data?.message || 'Failed to fetch medical records');
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [token, backendUrl]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleViewRecord = (record) => {
    setSelectedRecord(record);
    setShowModal(true);
  };

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'medical-record';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download record');
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8 bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Medical Records</h1>
        <p className="text-gray-500 text-lg">View and download your medical records</p>
      </div>

      <hr className="my-8 border-gray-200" />

      {/* Records Grid */}
      {records.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {records.map((record) => (
            <div 
              key={record._id}
              className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {record.recordType}
                  </h3>
                  <p className="text-gray-500 text-sm mb-1">
                    Doctor: {record.doctor?.name || 'Unknown'}
                  </p>
                  <p className="text-gray-500 text-sm mb-1">
                    Date: {formatDate(record.date)}
                  </p>
                  {record.appointment && (
                    <p className="text-gray-500 text-sm">
                      Appointment: {formatDate(record.appointment.slotDate)} at {record.appointment.slotTime}
                    </p>
                  )}
                </div>
                {record.attachmentUrl && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewRecord(record)}
                      className="inline-block px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-medium hover:bg-blue-100 transition-colors"
                    >
                      View Record
                    </button>
                    <button
                      onClick={() => handleDownload(record.attachmentUrl, `${record.recordType}-${formatDate(record.date)}`)}
                      className="inline-block px-4 py-2 bg-green-50 text-green-600 rounded-full text-sm font-medium hover:bg-green-100 transition-colors"
                    >
                      Download
                    </button>
                  </div>
                )}
              </div>
              
              {record.notes && (
                <p className="text-gray-600 text-sm mt-4">
                  {record.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg 
            className="mx-auto h-12 w-12 text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No medical records found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Your medical records will appear here after your appointments.
          </p>
        </div>
      )}

      {/* Modal for viewing records */}
      {showModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">
                {selectedRecord.recordType} - {formatDate(selectedRecord.date)}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-8rem)]">
              {selectedRecord.attachmentUrl && (
                <div className="flex flex-col items-center">
                  {selectedRecord.attachmentUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    <img
                      src={selectedRecord.attachmentUrl}
                      alt="Medical Record"
                      className="max-w-full h-auto rounded-lg shadow-lg"
                    />
                  ) : (
                    <div className="w-full aspect-[4/3] bg-gray-100 rounded-lg flex items-center justify-center">
                      <iframe
                        src={selectedRecord.attachmentUrl}
                        className="w-full h-full rounded-lg"
                        title="Medical Record"
                      />
                    </div>
                  )}
                  <div className="mt-4 flex gap-4">
                    <button
                      onClick={() => handleDownload(selectedRecord.attachmentUrl, `${selectedRecord.recordType}-${formatDate(selectedRecord.date)}`)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </button>
                    <a
                      href={selectedRecord.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open in New Tab
                    </a>
                  </div>
                </div>
              )}
              {selectedRecord.notes && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Notes:</h4>
                  <p className="text-gray-600">{selectedRecord.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalRecords;