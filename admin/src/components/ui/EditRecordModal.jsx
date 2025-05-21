// src/components/ui/EditRecordModal.jsx
import React, { useState } from 'react';

const EditRecordModal = ({ record, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    recordType: record.type,
    date: record.date,
    notes: record.notes,
    status: record.status
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({
      ...record,
      ...formData
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800">Edit Medical Record</h2>
          <p className="text-sm text-gray-600 mt-1">Update the medical record information for {record.patient}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
          <div className="p-6 flex-grow">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                <div className="bg-gray-100 p-3 rounded text-sm text-gray-900">{record.patient}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Record Type</label>
                  <select 
                    name="recordType"
                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    value={formData.recordType}
                    onChange={handleInputChange}
                  >
                    <option value="Lab Results">Lab Results</option>
                    <option value="Prescription">Prescription</option>
                    <option value="Progress Notes">Progress Notes</option>
                    <option value="Diagnosis">Diagnosis</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input 
                    type="date" 
                    name="date"
                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    value={formData.date}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea 
                  name="notes"
                  className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm h-32"
                  value={formData.notes}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="Complete">Complete</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attachments</label>
                <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center mb-2">
                  <input type="file" className="hidden" id="file-upload" />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-gray-600 text-sm">Choose Files</span>
                      <span className="text-xs text-gray-500 mt-1">No file chosen</span>
                    </div>
                  </label>
                </div>
                {record.attachmentUrl && (
                  <p className="text-sm text-gray-500 italic">
                    Existing Attachment: 
                    <a 
                      href={record.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline ml-1"
                    >
                      View Attachment
                    </a>
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">Upload new attachments or replace existing ones</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 border-t border-gray-200 flex justify-end space-x-3 flex-shrink-0">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Update Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRecordModal;