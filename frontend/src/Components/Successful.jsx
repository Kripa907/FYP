import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';

const Successful = () => {
  const navigate = useNavigate();
  const [paymentDetails, setPaymentDetails] = useState(null);

  useEffect(() => {
    // Get payment details from localStorage
    const storedPayment = localStorage.getItem('appointment');
    const pidx = window.location.href.split("&")[12]
    const paymentMethod = localStorage.getItem('paymentMethod');
    if (storedPayment && paymentMethod) {
    
      const payment = JSON.parse(storedPayment);
      const transactionId = pidx.split("=")[1];
      console.log("pidx", transactionId);
      
      const paymentData  = {
        appointment_id: payment._id,
        user: payment.user,
        amount:payment.amount,
        payment_method:String(paymentMethod),
        payment_status: "Completed",
        transaction_id: transactionId,
        payment_date: new Date().toISOString(),
      }
      setPaymentDetails(paymentData);
    const savePayment = async () => {
      try {
        const resonse = fetch(`http://localhost:4001/khalti/save-payment-details`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(paymentData),
        });
        const data = await resonse.json();
        if (data.success) {
          console.log("Payment details saved successfully:", data);
        } else {
          console.error("Error saving payment details:", data.message);
        }
      } catch (error) {
        console.error('Error parsing payment details:', error);
      }
    }

    savePayment();

    localStorage.removeItem('appointment');
    localStorage.removeItem('paymentMethod');


      // setPaymentDetails(JSON.parse(storedPayment));
      console.log('Payment details:', JSON.parse(storedPayment));
      // Clear the stored payment after displaying
      // localStorage.removeItem('lastPayment');
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <FaCheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Payment Successful!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your payment has been completed successfully.
          </p>
          
          {paymentDetails && (
            <div className="mt-6 bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
              <div className="space-y-2 text-left">
                <p><span className="font-medium">Amount:</span> NPR {paymentDetails.amount}</p>
                <p><span className="font-medium">Payment Method:</span> {paymentDetails.payment_method}</p>
                {/* <p><span className="font-medium">Transaction ID:</span> {paymentDetails.transaction_id}</p> */}
                <p><span className="font-medium">Date:</span> {new Date(paymentDetails.payment_date).toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
        <div className="mt-8">
          <button
            onClick={() => navigate('/appointments')}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Back to Appointments
          </button>
        </div>
      </div>
    </div>
  );
};

export default Successful;
