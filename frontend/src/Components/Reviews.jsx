import { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { FaStar } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { AppContext } from '../context/AppContext';

const DoctorReviews = ({ doctorId }) => {
  const { backendUrl, token } = useContext(AppContext);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAppointment, setHasAppointment] = useState(false);

  useEffect(() => {
    fetchReviews();
    if (token && doctorId) {
      console.log('Reviews component mounted with:', {
        doctorId,
        hasToken: !!token,
        tokenLength: token.length
      });
      checkAppointment();
    } else {
      console.log('Reviews component mounted but missing:', {
        hasToken: !!token,
        hasDoctorId: !!doctorId
      });
    }
  }, [doctorId, token, backendUrl]);

  const checkAppointment = async () => {
    if (!token) {
      console.log('No token found, skipping appointment check');
      return;
    }
    
    try {
      console.log('Checking appointment for doctor:', doctorId);
      const response = await axios.get(
        `${backendUrl}/api/appointments/check/${doctorId}`,
        { 
          headers: { 
            token,
            'Content-Type': 'application/json'
          } 
        }
      );
      console.log('Appointment check response:', {
        hasAppointment: response.data.hasAppointment,
        appointmentDetails: response.data.appointmentDetails,
        success: response.data.success
      });
      setHasAppointment(response.data.hasAppointment);
    } catch (error) {
      console.error('Error checking appointment:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      setHasAppointment(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/doctor/feedback/${doctorId}`);
      if (response.data.success) {
        setReviews(response.data.feedbacks);
        setAverageRating(parseFloat(response.data.averageRating) || 0);
        setTotalRatings(response.data.totalRatings);
      } else {
        toast.error('Failed to load reviews');
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Unable to load reviews. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!token) {
      console.log('Review submission blocked: No token');
      toast.error('Please login to submit a review');
      return;
    }

    if (!hasAppointment) {
      console.log('Review submission blocked: No appointment found');
      toast.error('You can only review doctors you have had appointments with');
      return;
    }

    if (!rating) {
      console.log('Review submission blocked: No rating selected');
      toast.error('Please select a rating');
      return;
    }

    if (comment && comment.length < 10) {
      console.log('Review submission blocked: Comment too short');
      toast.error('Review comment should be at least 10 characters long');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Submitting review with data:', { 
        doctorId, 
        rating, 
        comment,
        hasAppointment,
        hasToken: !!token
      });
      const response = await axios.post(
        `${backendUrl}/api/doctor/feedback`,
        {
          doctorId,
          rating,
          comment
        },
        {
          headers: { 
            token,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Review submission response:', response.data);
      if (response.data.success) {
        toast.success('Review submitted successfully');
        setComment('');
        setRating(0);
        setHover(null);
        await fetchReviews(); // Refresh reviews
      } else {
        toast.error(response.data.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      toast.error(error.response?.data?.message || 'Error submitting review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="mt-8 max-w-2xl mx-auto">
      {/* Rating Summary */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-white rounded-lg shadow">
        <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
        <div>
          <div className="flex text-yellow-400 mb-1">
            {[...Array(5)].map((_, i) => (
              <FaStar
                key={i}
                className={i < Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-200'}
              />
            ))}
          </div>
          <div className="text-sm text-gray-600">Based on {totalRatings} reviews</div>
        </div>
      </div>

      {/* Review Form */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
        <form onSubmit={handleSubmitReview} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
            <div className="flex gap-1">
              {[...Array(5)].map((_, index) => {
                const ratingValue = index + 1;
                return (
                  <label key={index} className="cursor-pointer">
                    <input
                      type="radio"
                      name="rating"
                      className="hidden"
                      value={ratingValue}
                      onClick={() => setRating(ratingValue)}
                    />
                    <FaStar
                      className="w-8 h-8 transition-colors"
                      color={ratingValue <= (hover || rating) ? "#ffc107" : "#e4e5e9"}
                      onMouseEnter={() => setHover(ratingValue)}
                      onMouseLeave={() => setHover(null)}
                    />
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this doctor..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              minLength={10}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !token || !hasAppointment}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${
              !token 
                ? 'bg-gray-400 cursor-not-allowed' 
                : !hasAppointment
                ? 'bg-gray-400 cursor-not-allowed'
                : isSubmitting 
                ? 'bg-blue-400 cursor-wait' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {!token 
              ? 'Please Login to Review' 
              : !hasAppointment
              ? 'Book an Appointment First'
              : isSubmitting 
              ? 'Submitting...' 
              : 'Submit Review'
            }
          </button>
        </form>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No reviews yet. Be the first to review!</p>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium text-gray-900">{review.userName || 'Anonymous'}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
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
          ))
        )}
      </div>
    </div>
  );
};

DoctorReviews.propTypes = {
  doctorId: PropTypes.string.isRequired
};

export default DoctorReviews;