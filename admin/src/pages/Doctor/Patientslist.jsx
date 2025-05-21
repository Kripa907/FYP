import React, { useEffect, useState, useContext } from "react";
import Doctornavbar from '../../components/ui/Doctornavbar';
import DoctorSidebar from '../../components/ui/Doctorsidebar';
import axios from 'axios';
import { DoctorContext } from '../../context/DoctorContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const PatientsList = () => {
  const { backendUrl, dToken } = useContext(DoctorContext);
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPatients = async () => {
      if (!dToken) {
        toast.error('Please login to view patients');
        navigate('/login');
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${backendUrl}/api/doctor/patient-list`, {
          headers: { 'Authorization': dToken }
        });

        if (response.data.success) {
          setPatients(response.data.patients);
        } else {
          throw new Error(response.data.message || 'Failed to fetch patients');
        }
      } catch (err) {
        console.error('Error fetching patients:', err);
        if (err.response?.status === 401) {
          toast.error('Session expired. Please login again');
          navigate('/login');
        } else {
          setError(err.response?.data?.message || 'Failed to fetch patients');
          toast.error(err.response?.data?.message || 'Failed to fetch patients');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [backendUrl, dToken, navigate]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
      case "canceled":
        return "bg-gray-100 text-gray-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <DoctorSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Doctornavbar />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="animate-pulse">
              <div className="h-8 w-64 bg-gray-200 rounded mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white p-4 rounded-lg shadow">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <DoctorSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Doctornavbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Patients</h1>
                <p className="text-gray-600">Manage your patient records</p>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-gray-500 text-sm font-medium">Total Patients</h2>
                <p className="text-2xl font-bold mt-2">{patients.length}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-gray-500 text-sm font-medium">Active Patients</h2>
                <p className="text-2xl font-bold mt-2">
                  {patients.filter(p => p.appointmentHistory?.some(a => a.status === 'Confirmed')).length}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-gray-500 text-sm font-medium">New This Month</h2>
                <p className="text-2xl font-bold mt-2">
                  {patients.filter(p => {
                    const lastMonth = new Date();
                    lastMonth.setMonth(lastMonth.getMonth() - 1);
                    return new Date(p.lastAppointment) >= lastMonth;
                  }).length}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-gray-500 text-sm font-medium">Completed Appointments</h2>
                <p className="text-2xl font-bold mt-2">
                  {patients.reduce((sum, p) => 
                    sum + (p.appointmentHistory?.filter(a => a.status === 'Completed').length || 0), 0
                  )}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">Patient List</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Visit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Visits
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPatients.map((patient) => (
                      <tr key={patient._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{patient.email}</div>
                          <div className="text-sm text-gray-500">{patient.phone || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(patient.lastAppointment).toString() === 'Invalid Date'
                              ? new Date().toLocaleDateString()
                              : new Date(patient.lastAppointment).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{patient.totalAppointments}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(patient.appointmentHistory?.[0]?.status)}`}>
                            {patient.appointmentHistory?.[0]?.status || 'No recent visits'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => navigate(`/doctor/messages?patient=${patient._id}`)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Message
                          </button>
                          <button
                            onClick={() => navigate(`/doctor/medical-records?patient=${patient._id}`)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Records
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredPatients.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {error ? error : 'No patients found'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PatientsList;