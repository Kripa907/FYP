import React, { useState, useEffect, useContext } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { toast } from 'react-toastify';
import { useSearchParams } from 'react-router-dom';

const PendingDoctors = () => {
  const { backendUrl, aToken } = useContext(AdminContext);
  const [searchParams] = useSearchParams();
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPendingDoctors = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/pending-doctors`, {
        headers: {
          Authorization: `Bearer ${aToken}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setPendingDoctors(data.doctors);
        // If there's a doctor ID in the URL, open that doctor's details
        const doctorId = searchParams.get('doctor');
        if (doctorId) {
          const doctor = data.doctors.find(doc => doc._id === doctorId);
          if (doctor) {
            setSelectedDoctor(doctor);
            setIsModalOpen(true);
          }
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to fetch pending doctors');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (aToken) {
      fetchPendingDoctors();
    }
  }, [aToken, searchParams]);

  const handleViewDetails = (doctor) => {
    setSelectedDoctor(doctor);
    setIsModalOpen(true);
  };

  const handleApprove = async (doctorId) => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/approve-doctor/${doctorId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${aToken}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Doctor approved successfully');
        setIsModalOpen(false);
        fetchPendingDoctors(); // Refresh the list
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to approve doctor');
      console.error(error);
    }
  };

  const handleReject = async (doctorId) => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/reject-doctor/${doctorId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${aToken}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Doctor rejected successfully');
        setIsModalOpen(false);
        fetchPendingDoctors(); // Refresh the list
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to reject doctor');
      console.error(error);
    }
  };

  if (loading) {
    return <div className="m-5">Loading...</div>;
  }

  return (
    <div className="m-5">
      <h1 className="text-lg font-medium mb-4">Pending Doctors</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pendingDoctors.map((doctor) => (
          <div
            key={doctor._id}
            className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleViewDetails(doctor)}
          >
            <div className="flex items-center space-x-4">
              <img
                src={doctor.image || "https://via.placeholder.com/150"}
                alt={doctor.name}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div>
                <h3 className="font-medium text-gray-900">{doctor.name}</h3>
                <p className="text-sm text-gray-500">{doctor.speciality}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed View Modal */}
      {isModalOpen && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header with Actions */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Doctor Details</h2>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleReject(selectedDoctor._id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(selectedDoctor._id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="ml-4 text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Section */}
              <div className="flex items-center space-x-6">
                <img
                  src={selectedDoctor.image || "https://via.placeholder.com/150"}
                  alt={selectedDoctor.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-100"
                />
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedDoctor.name}</h3>
                  <p className="text-gray-500">{selectedDoctor.email}</p>
                  <p className="mt-2 text-gray-600">{selectedDoctor.speciality}</p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Experience</p>
                    <p className="text-gray-900">{selectedDoctor.experience}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Degree</p>
                    <p className="text-gray-900">{selectedDoctor.degree}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">License Number</p>
                    <p className="text-gray-900">{selectedDoctor.licenseNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Fees</p>
                    <p className="text-gray-900">Rs. {selectedDoctor.fees}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Address</p>
                    <p className="text-gray-900">
                      {selectedDoctor.address?.addressLine1}
                      {selectedDoctor.address?.addressLine2 && (
                        <>, {selectedDoctor.address.addressLine2}</>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">About</p>
                    <p className="text-gray-900">{selectedDoctor.about}</p>
                  </div>
                </div>
              </div>

              {/* Certification Section */}
              {selectedDoctor.certification && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Certification</p>
                  <img
                    src={selectedDoctor.certification}
                    alt="Certification"
                    className="max-w-full h-auto rounded-lg shadow-md"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingDoctors; 