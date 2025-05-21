import React, { useContext } from 'react';
import { AdminContext } from '../context/AdminContext';
import { NavLink } from 'react-router-dom';
import { assets } from '../assets/assets';

const Sidebar = () => {
  const { aToken } = useContext(AdminContext);

  return (
    <div className="min-h-screen w-64 py-10 px-6 bg-white shadow-md border-r border-gray-200">
      {aToken && (
        <ul className="space-y-4 mt-12">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 ${
                isActive
                  ? 'bg-[#F2F3FF] border-l-4 border-primary font-semibold text-blue-600'
                  : 'hover:bg-gray-100 text-gray-700'
              }`
            }
          >
            <img src={assets.dashboard} alt="Dashboard" className="w-5 h-5 object-contain" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/all-appointments"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 ${
                isActive
                  ? 'bg-[#F2F3FF] border-l-4 border-primary font-semibold text-blue-600'
                  : 'hover:bg-gray-100 text-gray-700'
              }`
            }
          >
            <img src={assets.appointment} alt="Appointments" className="w-5 h-5 object-contain" />
            <span>Appointments</span>
          </NavLink>

          <NavLink
            to="/pending-doctors"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 ${
                isActive
                  ? 'bg-[#F2F3FF] border-l-4 border-primary font-semibold text-blue-600'
                  : 'hover:bg-gray-100 text-gray-700'
              }`
            }
          >
            <img src={assets.team} alt="Pending Doctors" className="w-5 h-5 object-contain" />
            <span>Pending Doctors</span>
          </NavLink>

          <NavLink
            to="/add-doctors"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 ${
                isActive
                  ? 'bg-[#F2F3FF] border-l-4 border-primary font-semibold text-blue-600'
                  : 'hover:bg-gray-100 text-gray-700'
              }`
            }
          >
            <img src={assets.add} alt="Add Doctor" className="w-5 h-5 object-contain" />
            <span>Add Doctor</span>
          </NavLink>

          <NavLink
            to="/doctors-list"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 ${
                isActive
                  ? 'bg-[#F2F3FF] border-l-4 border-primary font-semibold text-blue-600'
                  : 'hover:bg-gray-100 text-gray-700'
              }`
            }
          >
            <img src={assets.team} alt="Doctor List" className="w-5 h-5 object-contain" />
            <span>Doctor List</span>
          </NavLink>

          <NavLink
            to="/patients-list"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 ${
                isActive
                  ? 'bg-[#F2F3FF] border-l-4 border-primary font-semibold text-blue-600'
                  : 'hover:bg-gray-100 text-gray-700'
              }`
            }
          >
            <img src={assets.team} alt="Patient List" className="w-5 h-5 object-contain" />
            <span>Patient List</span>
          </NavLink>
        </ul>
      )}
    </div>
  );
};

export default Sidebar