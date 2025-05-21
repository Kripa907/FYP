import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { assets } from '../assets/assets';
import axios from 'axios';
import DoctorStats from '../Components/DoctorStats';

const DoctorProfile = () => {
  const { backendUrl, token, currencySymbol } = useContext(AppContext);
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await axios.get(`${backendUrl}/api/doctor/profile`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data.success) {
          setProfileData(response.data.doctor);
        } else {
          setError(response.data.message || 'Failed to fetch profile');
        }
      } catch (err) {
        console.error('Error fetching doctor profile:', err);
        setError(err.response?.data?.message || 'Error fetching profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, backendUrl, navigate]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
          {error}
        </div>
      </div>
    );
  }

  if (!profileData) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="w-full sm:w-48 flex-shrink-0">
              <img 
                className="w-full h-48 object-cover rounded-lg" 
                src={profileData.image || assets.profile}
                alt={profileData.name}
              />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{profileData.name}</h1>
                {profileData.verified && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Verified
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-gray-600">
                  {profileData.degree} - {profileData.speciality?.name || profileData.speciality}
                </p>
                <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                  {profileData.experience} years experience
                </span>
              </div>

              <div className="mt-4">
                <h3 className="flex items-center gap-1 text-sm font-medium text-gray-900">
                  About
                </h3>
                <p className="mt-2 text-gray-600">{profileData.about}</p>
              </div>

              <div className="mt-4">
                <p className="text-gray-500 font-bold">
                  Consultation fee: <span className="text-green-600">{currencySymbol}{profileData.fees}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics and Reviews */}
      <DoctorStats />
    </div>
  );
};

export default DoctorProfile; 