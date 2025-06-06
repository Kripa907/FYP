import React, { useContext } from 'react';
import Login from './pages/Login';
import { AdminContext } from './context/AdminContext';
import { DoctorContext } from './context/DoctorContext';
import { Route, Routes, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DoctorList from './pages/Admin/DoctorList';
import AddDoctors from './pages/Admin/AddDoctors';
import AllAppointments from './pages/Admin/AllAppointment';
import AdminDashboard from './pages/Admin/AdminDashboard';
import DoctorDashboard from './pages/Doctor/DoctorDashboard';
import ProfileView from './pages/Doctor/ProfileView'; 
import AppointmentsView from './pages/Doctor/AppointmentsView';
import ErrorBoundary from './components/ErrorBoundary'; 
import MedicalRecordsDashboard from './pages/Doctor/MedicalRecordsDashboard';
import PatientsList from './pages/Doctor/Patientslist';
import Messages from './pages/Doctor/Messages';
import PatientList from './pages/Admin/PatientList';
import PendingDoctors from './pages/Admin/PendingDoctors';
import { Toaster } from 'react-hot-toast';

// Admin Layout Component
const AdminLayout = ({ children }) => {
  return (
    <div className='flex h-screen'>
      <Sidebar />
      <div className='flex-1 flex flex-col overflow-hidden'>
        <Navbar />
        <main className='flex-1 overflow-y-auto'>
          {children}
        </main>
      </div>
    </div>
  );
};

const App = () => {
  const { aToken } = useContext(AdminContext);
  const { dToken } = useContext(DoctorContext);

  // If no token, show login page
  if (!aToken && !dToken) {
    return (
      <>
        <Login />
        <Toaster />
      </>
    );
  }

  return (
    <div className='bg-[#F8F9FD] h-screen'>
      <Toaster />
      <ErrorBoundary>
        <Routes>
          {/* Admin Routes */}
          {aToken && (
            <>
              <Route path="/" element={
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              } />
              <Route path='/doctors-list' element={
                <AdminLayout>
                  <DoctorList />
                </AdminLayout>
              } />
              <Route path='/pending-doctors' element={
                <AdminLayout>
                  <PendingDoctors />
                </AdminLayout>
              } />
              <Route path='/all-appointments' element={
                <AdminLayout>
                  <AllAppointments />
                </AdminLayout>
              } />
              <Route path='/add-doctors' element={
                <AdminLayout>
                  <AddDoctors />
                </AdminLayout>
              } />
              <Route path='/patients-list' element={
                <AdminLayout>
                  <PatientList />
                </AdminLayout>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}

          {/* Doctor Routes */}
          {dToken && (
            <>
              <Route path="/" element={<Navigate to="/doctor-dashboard" replace />} />
              <Route path='/doctor-dashboard' element={
                <ErrorBoundary>
                  <DoctorDashboard />
                </ErrorBoundary>
              } />
              <Route path='/doctor-profile' element={
                <ErrorBoundary>
                  <ProfileView />
                </ErrorBoundary>
              } />
              <Route path="/doctor-appointments" element={
                <ErrorBoundary>
                  <AppointmentsView />
                </ErrorBoundary>
              } />
              <Route path='/doctor-records' element={
                <ErrorBoundary>
                  <MedicalRecordsDashboard />
                </ErrorBoundary>
              } />
              <Route path='/doctor-patients' element={
                <ErrorBoundary>
                  <PatientsList />
                </ErrorBoundary>
              } />
              <Route path='/doctor-messages' element={
                <ErrorBoundary>
                  <Messages />
                </ErrorBoundary>
              } />
              <Route path="*" element={<Navigate to="/doctor-dashboard" replace />} />
            </>
          )}
        </Routes>
      </ErrorBoundary>
    </div>
  );
};

export default App;