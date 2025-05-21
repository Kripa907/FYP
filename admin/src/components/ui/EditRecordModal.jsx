// src/components/ui/EditRecordModal.jsx
import React from 'react';

const EditRecordModal = ({ record, onClose, onUpdate }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[95vh]" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800">Edit Medical Record</h2>
          <p className="text-sm text-gray-600 mt-1">Update the medical record information for {record.patient}</p>
        </div>
        
        <form onSubmit={(e) => {
          e.preventDefault();
          onUpdate(record);
        }} className="flex flex-col flex-grow">
          <div className="p-4 overflow-y-auto flex-grow h-0">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                <div className="bg-gray-100 p-3 rounded text-sm text-gray-900">{record.patient}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Record Type</label>
                  <select 
                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    defaultValue={record.type}
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
                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    defaultValue={record.date}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea 
                  className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm h-32"
                  defaultValue={record.notes}
                />
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