import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AppContext } from '../context/AppContext';

const TopFeatureDoctors = () => {
  const navigate = useNavigate();
  const { doctors } = useContext(AppContext);

  // Get featured doctors (doctors with specialities)
  const featuredDoctors = doctors?.filter(doctor => doctor.speciality) || [];

  return (
    <div className='flex flex-col items-center gap-5 my-16 text-gray-900 md:mx-10'>
      <h1 className='text-3xl font-medium'>Featured Specialists</h1>
      <p className='sm:w-1/3 text-center text-sm'>Browse our list of specialized doctors.</p>
      <div className='w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-5 gap-y-6 px-3 sm:px-0'>
        {featuredDoctors.slice(0, 8).map((doctor) => (
          <div 
            key={doctor._id} 
            onClick={() => navigate(`/appointment/${doctor._id}`)} 
            className='border border-blue-200 rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500'
          >
            <div className="relative">
              <img 
                className='w-full h-48 object-cover bg-blue-50' 
                src={doctor.image} 
                alt={doctor.name}
              />
              <div className="absolute bottom-2 left-2 bg-white/90 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${doctor.available ? 'bg-green-500' : 'bg-red-500'}`}></span>
                {doctor.available ? 'Available' : 'Unavailable'}
              </div>
            </div>
            <div className='p-4'>
              <p className='text-gray-900 text-lg font-medium'>{doctor.name}</p>
              <p className='text-gray-600 text-sm'>{doctor.speciality}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopFeatureDoctors;