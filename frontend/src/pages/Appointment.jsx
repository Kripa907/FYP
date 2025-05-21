import { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { assets } from '../assets/assets';
import { toast } from 'react-toastify';
import axios from 'axios';
import DoctorReviews from '../Components/Reviews';

const Appointment = () => {
  const { docId } = useParams();
  const { doctors, currencySymbol, backendUrl, token } = useContext(AppContext);
  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const navigate = useNavigate();

  // State to store the full doctor profile data from the backend
  const [profileData, setProfileData] = useState(null);
  const [docSlots, setDocslots] = useState([]);
  const [slotIndex, setSlotIndex] = useState(0);
  const [slotTime, setSlotTime] = useState('');

  console.log('Appointment Component - docId from URL:', docId);
  console.log('Appointment Component - doctors from AppContext (for list view data):', doctors);

  // Function to fetch full doctor profile from backend
  const fetchDoctorProfile = async () => {
    if (!token || !docId) return; // Ensure token and docId exist

    try {
      console.log('Fetching full doctor profile for docId:', docId);
      const response = await axios.get(`${backendUrl}/api/doctor/${docId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        console.log('Full doctor profile fetched successfully:', response.data.doctor);
        setProfileData(response.data.doctor);
      } else {
        toast.error(response.data.message || 'Failed to fetch doctor profile');
        setProfileData(null); // Set to null on failure
      }
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch doctor profile. Please try again.');
      setProfileData(null); // Set to null on error
    }
  };

  // Fetch profile data when component mounts or token/docId changes
  useEffect(() => {
    fetchDoctorProfile();
  }, [token, docId]); // Depend on token and docId

  const getAvailableSlots = async () => {
    setDocslots([]);
    let today = new Date();
    for (let i = 0; i < 7; i++) {
      let currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);

      let endTime = new Date(currentDate);
      endTime.setHours(21, 0, 0, 0);

      if (today.getDate() === currentDate.getDate()) {
        currentDate.setHours(currentDate.getHours() > 10 ? currentDate.getHours() + 1 : 10);
        currentDate.setMinutes(currentDate.getMinutes() > 30 ? 30 : 0);
      } else {
        currentDate.setHours(10);
        currentDate.setMinutes(0);
      }

      let timeSlots = [];
      // Use profileData for slots_booked if available, fallback to list data docInfo if needed (though profileData should be preferred here)
      const slotsBookedData = profileData?.slots_booked || doctors?.find(doc => doc._id === docId)?.slots_booked;

      while (currentDate < endTime) {
        let formattedTime = currentDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        let day = currentDate.getDate();
        let month = currentDate.getMonth() + 1;
        let year = currentDate.getFullYear();

        const slotDate = `${day}_${month}_${year}`;
        const slotTime = formattedTime;

        const isSlotAvailable =
          !slotsBookedData?.[slotDate] || !slotsBookedData[slotDate].includes(slotTime);

        if (isSlotAvailable) {
          timeSlots.push({
            datetime: new Date(currentDate),
            time: formattedTime,
          });
        }

        currentDate.setMinutes(currentDate.getMinutes() + 60);
      }

      setDocslots((prev) => [...prev, timeSlots]);
    }
  };

  const bookAppointment = async () => {
    try {
      if (!token) {
        toast.warn('Please login to book an appointment');
        return navigate('/login');
      }

      if (!slotTime || !docSlots[slotIndex]) {
        return toast.error('Please select a valid time slot');
      }

      const date = docSlots[slotIndex][0].datetime;
      const formattedDate = `${date.getDate()}_${date.getMonth() + 1}_${date.getFullYear()}`;

      const requestData = {
        docId,
        slotDate: formattedDate,
        slotTime,
        reason: 'General Consultation'
      };

      const response = await axios.post(
        `${backendUrl}/api/user/book-appointment`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success('Appointment requested successfully');
        navigate('/appointments');
      } else {
        toast.error(response.data.message || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error.response?.data?.message || 'Failed to book appointment. Please try again.');
    }
  };

  // Keep the getAvailableSlots effect, but it should depend on profileData now
  useEffect(() => {
    // Only fetch slots if profileData is available
    if (profileData) {
      getAvailableSlots();
    }
  }, [profileData]); // Depend on profileData

  // Render using profileData
  return profileData && (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column - Doctor Details */}
        <div className="w-full lg:w-2/3">
          {/* Doctor Profile Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="w-full sm:w-48 flex-shrink-0">
                  <img 
                    className="w-full h-48 object-cover rounded-lg" 
                    src={profileData.image} // Use profileData
                    alt={profileData.name} // Use profileData
                  />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-900">{profileData.name}</h1> {/* Use profileData */}
                    <img className="w-5" src={assets.verified_icon} alt="Verified" />
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-gray-600">
                      {profileData.degree} - {profileData.speciality?.name || profileData.speciality} {/* Use profileData, handle speciality population*/}
                    </p>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                      {profileData.experience} years experience {/* Use profileData */}
                    </span>
                  </div>

                  {/* Display Rating */} {/* Added block */}
                  {profileData.statistics && (
                    <div className="mt-2 flex items-center gap-2">
                      <img className="w-4" src={assets.star_icon} alt="Rating" />
                      <p className="text-sm text-gray-700 font-medium">{profileData.statistics.averageRating?.toFixed(1) || 'N/A'} ({profileData.statistics.totalRatings || 0} reviews)</p>
                    </div>
                  )}
                  

                  <div className="mt-4">
                    <h3 className="flex items-center gap-1 text-sm font-medium text-gray-900">
                      About <img src={assets.info_icon} alt="" />
                    </h3>
                    <p className="mt-2 text-gray-600">{profileData.about}</p> {/* Use profileData */}
                  </div>

                  <div className="mt-4">
                    <p className="text-gray-500 font-bold">
                      Appointment fee: <span className="text-green-600">{currencySymbol}{profileData.fees}</span> {/* Use profileData */}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Patient Reviews</h2>
            {/* DoctorReviews component likely fetches reviews based on doctorId, so no change needed here */}
            <DoctorReviews 
              doctorId={docId} 
              backendUrl={backendUrl}
            />
          </div>
        </div>

        {/* Right Column - Booking Slots */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 sticky top-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Book Appointment</h2>
            
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Select Date</p>
              <div className="flex gap-3 items-center w-full overflow-x-auto pb-2">
                {docSlots.length > 0 && docSlots.map((item, index) => (
                  <div
                    onClick={() => setSlotIndex(index)}
                    className={`text-center py-4 min-w-16 rounded-lg cursor-pointer transition-colors ${
                      slotIndex === index 
                        ? "bg-primary text-white" 
                        : "border border-gray-200 hover:bg-gray-50"
                    }`}
                    key={index}
                  >
                    <p className="text-xs font-medium">{item[0] && daysOfWeek[item[0].datetime.getDay()]}</p>
                    <p className="text-sm font-semibold">{item[0] && item[0].datetime.getDate()}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Available Time Slots</p>
              <div className="grid grid-cols-3 gap-3">
                {docSlots[slotIndex]?.map((item, index) => (
                  <button
                    onClick={() => setSlotTime(item.time)}
                    className={`py-2 px-3 rounded-md text-sm transition-colors ${
                      item.time === slotTime 
                        ? "bg-primary text-white" 
                        : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                    key={index}
                  >
                    {item.time.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={bookAppointment}
              disabled={!slotTime}
              className={`w-full py-3 rounded-md text-white font-medium transition-colors ${
                slotTime ? "bg-primary hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              Book Appointment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Appointment;