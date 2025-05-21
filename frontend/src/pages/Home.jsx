import { useContext } from "react";
import Header from "../Components/Header"
import SpecialityMenu from "../Components/SpecialityMenu"
import TopDoctors from "../Components/TopDoctors"
import TopFeatureDoctors from "../Components/TopFeatureDoctors"
import { AppContext } from "../context/AppContext"

const Home = () => {
  const { loading, error } = useContext(AppContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
        <Header/>
        <SpecialityMenu/>
        <TopDoctors/>
        <TopFeatureDoctors/>
    </div>
  )
}

export default Home