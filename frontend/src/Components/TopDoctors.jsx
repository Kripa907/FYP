import { useNavigate } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';

const TopDoctors = () => {
    const navigate = useNavigate();
    const { doctors } = useContext(AppContext);
    const [topDoctors, setTopDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (doctors && doctors.length > 0) {
            // Sort doctors by rating
            const sortedDoctors = [...doctors].sort((a, b) => {
                const ratingA = a.averageRating || 0;
                const ratingB = b.averageRating || 0;
                return ratingB - ratingA;
            });

            setTopDoctors(sortedDoctors.slice(0, 8)); // Show top 8 doctors
            setLoading(false);
        } else {
            setLoading(false);
            setError('No doctors available');
        }
    }, [doctors]);

    if (loading) {
        return (
            <div className='flex flex-col items-center gap-5 my-16 text-gray-900 md:mx-10'>
                <h1 className='text-3xl font-medium'>Top Rated Doctors</h1>
                <p className='sm:w-1/3 text-center text-sm'>Loading doctors...</p>
                <div className='w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-5 gap-y-6 px-3 sm:px-0'>
                    {[...Array(4)].map((_, index) => (
                        <div key={index} className='border border-blue-200 rounded-xl overflow-hidden animate-pulse'>
                            <div className='h-48 bg-gray-200'></div>
                            <div className='p-4'>
                                <div className='h-4 bg-gray-200 rounded w-3/4 mb-2'></div>
                                <div className='h-4 bg-gray-200 rounded w-1/2'></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className='flex flex-col items-center gap-5 my-16 text-gray-900 md:mx-10'>
                <h1 className='text-3xl font-medium'>Top Rated Doctors</h1>
                <p className='sm:w-1/3 text-center text-sm text-red-500'>{error}</p>
            </div>
        );
    }

    return (
        <div className='flex flex-col items-center gap-5 my-16 text-gray-900 md:mx-10'>
            <h1 className='text-3xl font-medium'>Top Rated Doctors</h1>
            <p className='sm:w-1/3 text-center text-sm'>Find the best doctors based on patient reviews and ratings.</p>
            <div className='w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-5 gap-y-6 px-3 sm:px-0'>
                {topDoctors.map((doctor) => {
                    const averageRating = doctor.averageRating || 0;
                    const totalRatings = doctor.totalRatings || 0;

                    return (
                        <div 
                            key={doctor._id} 
                            onClick={() => navigate(`/appointment/${doctor._id}`)} 
                            className='border border-blue-200 rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500'
                        >
                            <div className="relative">
                                <img className='w-full h-48 object-cover bg-blue-50' src={doctor.image} alt={doctor.name}/>
                                <div className="absolute bottom-2 left-2 bg-white/90 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                    <span className={`w-2 h-2 rounded-full ${doctor.available ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    {doctor.available ? 'Available' : 'Unavailable'}
                                </div>
                            </div>
                            <div className='p-4'>
                                <p className='text-gray-900 text-lg font-medium'>{doctor.name}</p>
                                <p className='text-gray-600 text-sm mb-2'>{doctor.speciality}</p>
                                <div className="flex items-center gap-2 text-sm">
                                    <div className="flex items-center text-yellow-400">
                                        {[...Array(5)].map((_, i) => (
                                            <svg 
                                                key={i}
                                                className={`w-4 h-4 ${i < Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-200'}`}
                                                fill="currentColor" 
                                                viewBox="0 0 20 20"
                                            >
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                    </div>
                                    <span className="text-gray-600">
                                        {averageRating.toFixed(1)} ({totalRatings} reviews)
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TopDoctors;