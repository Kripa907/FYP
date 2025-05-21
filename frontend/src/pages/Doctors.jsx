import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const specialities = [
  "General Physician",
  "Cardiologist",
  "Neurologist",
  "Dermatologist",
  "Gastroenterologist",
  "Pediatricians"
];

const Doctors = () => {
  const [selectedSpecialities, setSelectedSpecialities] = useState([]);
  const [filterDoc, setFilterDoc] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('rating'); // 'rating' or 'experience'
  const navigate = useNavigate();
  const { doctors } = useContext(AppContext);

  useEffect(() => {
    let filtered = [...doctors];
    
    // Filter by speciality
    if (selectedSpecialities.length > 0) {
      filtered = filtered.filter(doc => {
        if (!doc.speciality) return false;
        return selectedSpecialities.some(sel => sel.trim().toLowerCase() === doc.speciality.trim().toLowerCase());
      });
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.name.toLowerCase().includes(term) || 
        doc.speciality.toLowerCase().includes(term)
      );
    }

    // Sort doctors
    filtered.sort((a, b) => {
      if (sortBy === 'rating') {
        const ratingA = parseFloat(a.averageRating) || 0;
        const ratingB = parseFloat(b.averageRating) || 0;
        return ratingB - ratingA;
      } else {
        const expA = parseInt(a.experience) || 0;
        const expB = parseInt(b.experience) || 0;
        return expB - expA;
      }
    });
    
    setFilterDoc(filtered);
  }, [doctors, selectedSpecialities, searchTerm, sortBy]);

  const handleCheckboxChange = (speciality) => {
    setSelectedSpecialities(prev =>
      prev.includes(speciality)
        ? prev.filter(item => item !== speciality)
        : [...prev, speciality]
    );
  };

  const clearFilters = () => {
    setSelectedSpecialities([]);
    setSearchTerm('');
  };

  return (
    <div className="mx-4 sm:mx-[10%] my-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Find Your Doctor</h1>
      <p className="text-gray-600 text-sm mb-6">Browse through our specialists to find the right care for you.</p>
      {/* Debug warning if doctors data is not loaded */}
      {(!doctors || doctors.length === 0) && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <strong>Warning:</strong> No doctors data loaded. Please check your backend or AppContext.
        </div>
      )}
      
      {/* Search and Filter Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search doctors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="rating">Sort by Rating</option>
            <option value="experience">Sort by Experience</option>
          </select>
          
          {(selectedSpecialities.length > 0 || searchTerm) && (
            <button 
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row items-start gap-8">
        {/* Filter Sidebar */}
        <div className="w-full lg:w-64 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-4">Filter by Speciality</h3>
          <div className="flex flex-col gap-3">
            {specialities.map(speciality => (
              <label key={speciality} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input 
                  type="checkbox" 
                  checked={selectedSpecialities.includes(speciality)}
                  onChange={() => handleCheckboxChange(speciality)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{speciality}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Doctors Grid */}
        <div className="flex-1 w-full">
          {filterDoc.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
              {filterDoc.map((doctor) => {
                const averageRating = parseFloat(doctor.averageRating) || 0;
                const totalRatings = parseInt(doctor.totalRatings) || 0;
                
                return (
                  <div 
                    key={doctor._id} 
                    onClick={() => navigate(`/appointment/${doctor._id}`)} 
                    className="border border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-all duration-300 group"
                  >
                    <div className="relative h-48 bg-gray-100 overflow-hidden">
                      <img 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        src={doctor.image} 
                        alt={doctor.name} 
                      />
                      <div className="absolute bottom-2 left-2 bg-white/90 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${doctor.available ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {doctor.available ? 'Available' : 'Unavailable'}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">{doctor.name}</h3>
                        {doctor.verified && (
                          <div className="flex items-center" title="Verified Doctor">
                            <svg 
                              className="w-5 h-5 text-blue-500" 
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                            >
                              <path 
                                fillRule="evenodd" 
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                                clipRule="evenodd" 
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{doctor.speciality}</p>
                      <div className="flex items-center text-sm text-gray-500">
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
                        <span className="ml-1">{averageRating.toFixed(1)}</span>
                        <span className="mx-2">•</span>
                        <span>{doctor.experience || '5'} yrs experience</span>
                      </div>
                      {totalRatings > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Based on {totalRatings} {totalRatings === 1 ? 'review' : 'reviews'}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No doctors found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {selectedSpecialities.length > 0 || searchTerm 
                  ? "Try adjusting your filters or search term" 
                  : "No doctors available at the moment"}
              </p>
              {(selectedSpecialities.length > 0 || searchTerm) && (
                <button
                  onClick={clearFilters}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Doctors;