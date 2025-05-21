import { Link, useLocation } from 'react-router-dom';

const Doctorsidebar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/doctor/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/doctor/appointments', label: 'Appointments', icon: '📅' },
    { path: '/doctor/patients', label: 'Patients', icon: '👥' },
    { path: '/doctor/reports', label: 'Reports', icon: '📝' },
    { path: '/doctor/messages', label: 'Messages', icon: '✉️', badge: unreadMessages },
    { path: '/doctor/profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <div className="w-64 bg-white shadow-lg h-screen fixed left-0 top-0">
      <div className="p-4">
        <h2 className="text-2xl font-bold text-medical-primary mb-8">Doctor Portal</h2>
        <nav>
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center p-3 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? 'bg-medical-light text-medical-primary'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
};


export default Doctorsidebar; 

