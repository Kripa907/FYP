import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Verify = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const backend = import.meta.env.VITE_BACKEND_URL;
  const [statusMessage, setStatusMessage] = useState("Verifying payment...");

  useEffect(() => {
    const verifyPayment = async () => {
      // Log the full URL and search params for debugging
      console.log("Full URL:", window.location.href);
      console.log("Search params:", location.search);
      
      // Get all search parameters
      const searchParams = new URLSearchParams(location.search);
      const pidx = searchParams.get('pidx');
      const txnId = searchParams.get('txnId');
      
      console.log("Payment parameters:", { pidx, txnId });
      
      // Check if we have either pidx or txnId
      if (!pidx && !txnId) {
        console.error("No payment ID found in URL");
        navigate("/unsuccessfull/user");
        return;
      }

      try {
        // Use pidx if available, otherwise use txnId
        const paymentId = pidx || txnId;
        console.log("Using payment ID:", paymentId);

        const response = await fetch(`${backend}/khalti/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ pidx: paymentId }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Payment verification response:", data);

        // Check both possible status fields
        const paymentStatus = data.message?.status || data.message?.payment_status;
        console.log("Payment status:", paymentStatus);

        if (paymentStatus === "Completed" || paymentStatus === "completed") {
          // Get the appointment data from localStorage
          const appointmentData = localStorage.getItem('appointment');
          if (appointmentData) {
            try {
              // Save payment details
              const saveResponse = await fetch(`${backend}/khalti/save-payment-details`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                  ...JSON.parse(appointmentData),
                  payment_status: "Completed",
                  transaction_id: paymentId,
                  payment_date: new Date().toISOString(),
                }),
              });

              if (!saveResponse.ok) {
                console.error("Failed to save payment details");
              }
            } catch (saveError) {
              console.error("Error saving payment details:", saveError);
            }
          }

          // Clear the appointment data from localStorage
          localStorage.removeItem('appointment');
          localStorage.removeItem('paymentMethod');

          // Redirect to success page with all parameters
          navigate(`/successfull/user${location.search}`);
        } else if (paymentStatus === "Pending" || paymentStatus === "pending") {
          setStatusMessage("⏳ Payment is pending. Please wait...");
        } else {
          console.error("Payment verification failed:", data);
          navigate("/unsuccessfull/user");
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        navigate("/unsuccessfull/user");
      }
    };

    verifyPayment();
  }, [navigate, location, backend]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{statusMessage}</h2>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
      </div>
    </div>
  );
};

export default Verify;
