import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const Unsuccessful = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/appointments');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          {/* Custom red circle with exclamation icon */}
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-600 text-white text-6xl font-bold">
            !
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-800">
            Your payment failed
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please try again
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Redirecting to appointments page...
          </p>
        </div>
      </div>
    </div>
  );
};

export default Unsuccessful;
