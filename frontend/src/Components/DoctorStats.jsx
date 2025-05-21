import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { FaStar, FaUsers, FaMoneyBillWave } from 'react-icons/fa';
import { format } from 'date-fns';

const DoctorStats = () => {
  const { backendUrl, token, currencySymbol } = useContext(AppContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) return;

      try {
        const response = await axios.get(`${backendUrl}/api/doctor/statistics`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data.success) {
          setStats(response.data.statistics);
        } else {
          setError(response.data.message || 'Failed to fetch statistics');
        }
      } catch (err) {
        console.error('Error fetching doctor statistics:', err);
        setError(err.response?.data?.message || 'Error fetching statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token, backendUrl]);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Stats Cards Loading State */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
        {/* Reviews Loading State */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
        {error}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Ratings Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <FaStar className="text-yellow-400" />
            <h3 className="font-medium">Average Rating</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{stats.averageRating}</span>
            <span className="text-sm text-gray-500">/ 5.0</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Based on {stats.totalRatings} {stats.totalRatings === 1 ? 'review' : 'reviews'}
          </p>
        </div>

        {/* Total Patients Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <FaUsers className="text-blue-400" />
            <h3 className="font-medium">Total Patients</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{stats.totalPatients}</span>
            <span className="text-sm text-gray-500">patients</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Unique patients from completed appointments
          </p>
        </div>

        {/* Total Payments Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <FaMoneyBillWave className="text-green-400" />
            <h3 className="font-medium">Total Payments</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{currencySymbol}{stats.totalPayments}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Total earnings from completed appointments
          </p>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Reviews</h2>
        {stats.reviews.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {stats.reviews.map((review) => (
              <div key={review._id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{review.userName}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(review.createdAt), 'MMMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        className={i < review.rating ? 'text-yellow-400' : 'text-gray-200'}
                      />
                    ))}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-gray-700 mt-2">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorStats; 