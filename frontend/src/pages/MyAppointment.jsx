import { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import Swal from 'sweetalert2'
import KhaltiCheckout from 'khalti-checkout-web';

const MyAppointments = () => {
    const { backendUrl, token } = useContext(AppContext);
    const [appointments, setAppointments] = useState([]);
    const [requestedAppointments, setRequestedAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [selectedPaymentId, setSelectedPaymentId] = useState(null);

    const months = [" ", "Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];

    const slotDateFormat = (slotDate) => {
        const dateArray = slotDate.split('_');
        return dateArray[0] + " " + months[Number(dateArray[1])] + " " + dateArray[2];
    };

    // Helper function to check if a date is in the past
    const isDateInPast = (dateStr, timeStr) => {
        try {
            // Parse the date string (format: DD_MM_YYYY)
            const [day, month, year] = dateStr.split('_').map(Number);
            const appointmentDate = new Date(year, month - 1, day);
            
            // If the date is today, check the time
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (appointmentDate.getTime() === today.getTime()) {
                // Parse the time string (format: HH:MM AM/PM)
                const [timeValue, period] = timeStr.split(' ');
                const [hours, minutes] = timeValue.split(':').map(Number);
                
                // Convert to 24-hour format
                let hour24 = hours;
                if (period === 'PM' && hours < 12) hour24 += 12;
                if (period === 'AM' && hours === 12) hour24 = 0;
                
                const now = new Date();
                if (hour24 < now.getHours() || (hour24 === now.getHours() && minutes < now.getMinutes())) {
                    return true; // Time has passed today
                }
                return false; // Time is still in future today
            }
            
            // Compare dates
            return appointmentDate < today;
        } catch (error) {
            console.error('Error parsing date:', error);
            return false; // If there's an error, don't filter out the appointment
        }
    };
    
    const getUserAppointments = async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/user/appointments`, { 
                headers: { 
                    'Authorization': `Bearer ${token}`
                } 
            });
            if (data.success) {
                // Filter out past appointments
                const filteredAppointments = data.appointments.filter(apt => 
                    !isDateInPast(apt.slotDate, apt.slotTime)
                );
                setAppointments(filteredAppointments.reverse());
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to fetch appointments');
        } finally {
            setLoading(false);
        }
    };

    const getRequestedAppointments = async () => {
        try {
            // Check if token exists
            if (!token) {
                toast.error('Please login to view appointments');
                return;
            }

            const response = await axios.get(`${backendUrl}/api/user/requested-appointments`, {
                headers: { 
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                // Get appointments from the correct property in the response
                const appointments = response.data.requestedAppointments || [];
                
                // Filter out past appointment requests
                const filteredRequests = appointments.filter(apt => 
                    apt && apt.slotDate && apt.slotTime && !isDateInPast(apt.slotDate, apt.slotTime)
                );
                
                setRequestedAppointments(filteredRequests);
            } else {
                toast.error(response.data.message || 'Failed to fetch appointment requests');
            }
        } catch (error) {
            console.error('Error fetching requested appointments:', error);
            toast.error(
                error.response?.data?.message || 
                'Failed to fetch appointments. Please try again.'
            );
        } finally {
            setLoadingRequests(false);
        }
    };

    useEffect(() => {
        if (token) {
            getUserAppointments();
            getRequestedAppointments();
        }
    }, [token]);

    const cancelAppointment = async (appointmentId) => {
        try {
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: 'Do you want to cancel this appointment?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, cancel it!'
            });

            if (result.isConfirmed) {
                const { data } = await axios.post(
                    `${backendUrl}/api/user/cancel-appointment`,
                    { appointmentId },
                    { 
                        headers: { 
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        } 
                    }
                );

                if (data.success) {
                    setAppointments(prev => prev.filter(apt => apt._id !== appointmentId));
                    toast.success('Appointment cancelled successfully');
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to cancel appointment');
        }
    }

    const cancelRequestedAppointment = async (appointmentId) => {
        try {
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: 'Do you want to cancel this appointment request?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, cancel it!'
            });

            if (result.isConfirmed) {
                const { data } = await axios.post(
                    `${backendUrl}/api/user/cancel-requested-appointment`,
                    { appointmentId },
                    { 
                        headers: { 
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        } 
                    }
                );

                if (data.success) {
                    // Remove the cancelled appointment from the list
                    setRequestedAppointments(prev => prev.filter(apt => apt._id !== appointmentId));
                    toast.success('Appointment request cancelled successfully');
                    
                    // Refresh both appointment lists
                    getUserAppointments();
                    getRequestedAppointments();
                } else {
                    toast.error(data.message || 'Failed to cancel appointment request');
                }
            }
        } catch (error) {
            console.error('Error cancelling appointment request:', error);
            toast.error(error.response?.data?.message || 'Failed to cancel appointment request');
        }
    };

    const khaltiConfig = {
    publicKey: "84d65d807f78402fb84a03a411fd849f",
    productIdentity: "1234567890",
    productName: "Doctor appointment system",
    productUrl: "http://localhost:3000/",
    eventHandler: {
        onSuccess: (payload) => {
            console.log("Payment Successful", payload);
            if (selectedPaymentId) {
                // Capture the paid appointment BEFORE updating the state
                const paidAppointment = appointments.find(apt => apt._id === selectedPaymentId) || {};
                // Update the appointment's status to 'Paid'
                setAppointments(prevAppointments =>
                    prevAppointments.map(apt =>
                        apt._id === selectedPaymentId ? { ...apt, status: 'Paid' } : apt
                    )
                );
                // Show the receipt popup – using payload.token if appropriate
                Swal.fire({
                    title: 'Payment Receipt',
                    html: `
                        <p><strong>Payment Successful!</strong></p>
                        <p><strong>Amount:</strong> ${paidAppointment.amount || 0} NPR</p>
                        <p><strong>Transaction ID:</strong> ${payload.token || 'N/A'}</p>
                        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                    `,
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
            }
            setSelectedPaymentId(null);
        },
        onError(error) {
            console.log("Payment Error", error);
            alert("Khalti Payment failed. Try again.");
        },
        onClose() {
            console.log("Payment closed.");
        },
    },
    paymentPreference: ["KHALTI"],
};

    const khaltiCheckout = new KhaltiCheckout(khaltiConfig);

    const handleKhaltiPayment = () => {
        khaltiCheckout.show({ amount: 1000 }); // Amount in Paisa (Rs.10)
    };

    const handleEsewaPayment = () => {
        const amount = 10;
        const url = `https://esewa.com.np/epay/main?amt=${amount}&psc=0&pdc=0&txAmt=0&tAmt=${amount}&pid=1234567890&scd=your_esewa_merchant_id&su=http://localhost:3000/payment-success&fu=http://localhost:3000/payment-failed`;
        window.location.href = url;
    };

    const handlePayment = (appointmentId, method) => {
        if (method === "Khalti") {
            handleKhaltiPayment();
        } else if (method === "eSewa") {
            handleEsewaPayment();
        }
        setSelectedPaymentId(null);
    };

    const payWithKhalti = async (appointment) => {
        if (!appointment) {
            console.error("No appointment provided");
            return;
        }
        localStorage.setItem('selectedAppointment', JSON.stringify(selectedPaymentId));
        try {
            const response = await fetch(`http://localhost:4001/khalti/complete-khalti-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    product_id: appointment._id,
                    buyer_name: appointment?.userData?.name || 'Patient',
                    amount: appointment?.amount,
                    appointment_id: appointment._id
                })
            });
            console.log('Paying with Khalti...');
            localStorage.setItem('appointment', JSON.stringify(appointment));
            localStorage.setItem('paymentMethod', 'Khalti');
            console.log(
                `Payload: {
                    product_id: ${appointment._id},
                    buyer_name: ${appointment?.userData?.name || 'Patient'},
                    amount: ${appointment?.amount},
                    appointment_id: ${appointment._id}
                }`
            );

            const data = await response.json();
            console.log('Payment initiation response:', data);

            if (response.status === 200 && data.success) {
                window.location.href = data.message;
            } else {
                toast.error(data.message || "Failed to initiate payment");
            }
        } catch (error) {
            console.error("Payment initiation error:", error);
            toast.error("Failed to initiate payment");
        }
    }

    const renderAppointmentItem = (item, index, isRequested = false) => (
        <div key={item._id || index} className="border rounded-lg p-4 bg-white mb-4">
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <div className="flex flex-col">
                        <h3 className="font-medium">{item.doctor?.name || item.docData?.name || 'Doctor'}</h3>
                        <p className="text-sm text-gray-600">{item.doctor?.speciality || item.docData?.speciality || 'Specialist'}</p>
                        <p className="text-sm text-gray-500 mt-2">
                            {item.slotDate} at {item.slotTime}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                            Fee: {item.amount || 0} NPR
                        </p>
                        <div className="mt-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                item.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                item.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                                item.status === 'Paid'    ? 'bg-blue-100 text-blue-800' :
                                item.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                item.cancelled             ? 'bg-gray-100 text-gray-800' :
                                                                ''
                            }`}>
                                {item.status === 'Pending'   ? 'Requested' :
                                 item.status === 'Confirmed' ? 'Your appointment has been approved' :
                                 item.status === 'Paid'      ? 'Paid' :
                                 item.status === 'Rejected'  ? 'Rejected' :
                                 item.cancelled              ? 'Cancelled' :
                                                             'Requested'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-2 justify-end">
                    {!item.cancelled && !isRequested && (
                        <div className="flex gap-2">
                            {item.status !== 'Paid' && (
                            <button
                                onClick={() => setSelectedPaymentId(item._id)}
                                className='text-sm text-stone-500 text-center sm:min-w-48 py-2 border rounded hover:bg-primary hover:text-white transition-all duration-300 flex-1'
                            >
                                Pay Online
                            </button>
                            )}
                            <button
                                onClick={() => cancelAppointment(item._id)}
                                className='text-sm text-stone-500 text-center sm:min-w-48 py-2 border rounded hover:bg-red-600 hover:text-white transition-all duration-300 flex-1'
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                    {isRequested && item.status !== 'Cancelled' && (
                        <button
                            onClick={() => cancelRequestedAppointment(item._id)}
                            className='text-sm text-stone-500 text-center sm:min-w-48 py-2 border rounded hover:bg-red-600 hover:text-white transition-all duration-300 w-full'
                        >
                            Cancel Request
                        </button>
                    )}
                    {(item.cancelled || (isRequested && item.status === 'Cancelled')) && (
                        <button className='sm:min-w-48 py-2 border border-red-500 rounded text-red-500 w-full'>
                            {isRequested ? 'Request Cancelled' : 'Appointment Cancelled'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    if (loading || loadingRequests) return <div>Loading...</div>;

    return (
        <div className="space-y-8">
            {/* Requested Appointments Section */}
            <div>
                <p className='pb-3 mt-12 font-medium text-zinc-700 border-b'>Requested Appointments</p>
                {loadingRequests ? (
                    <div className="text-center py-4">Loading...</div>
                ) : requestedAppointments.length === 0 ? (
                    <p className='text-zinc-600 py-4'>No pending appointment requests</p>
                ) : (
                    <div className="space-y-4">
                        {requestedAppointments.map((appointment) => (
                            <div key={appointment._id} className="border rounded-lg p-4 bg-white">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-medium">{appointment.doctor?.name || 'Doctor'}</h3>
                                        <p className="text-sm text-gray-600">{appointment.doctor?.speciality || 'Specialist'}</p>
                                        <p className="text-sm text-gray-500 mt-2">
                                            {appointment.slotDate} at {appointment.slotTime}
                                        </p>
                                        <div className="mt-2">
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                                                Your appointment has been requested
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => cancelRequestedAppointment(appointment._id)}
                                        className="text-red-500 hover:text-red-700 text-sm"
                                    >
                                        Cancel Request
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Confirmed Appointments Section */}
            <div>
                <p className='pb-3 mt-12 font-medium text-zinc-700 border-b'>My Appointments</p>
                {appointments.length === 0 ? (
                    <p className='text-zinc-600'>No appointments found.</p>
                ) : (
                appointments.map((item, index) => renderAppointmentItem(item, index))
            )}
            {/* Modal or inline trigger for Khalti payment */}
            {selectedPaymentId && (
                <div className="mt-4">
                    <button
                        onClick={handleKhaltiPayment}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        Proceed with Khalti Payment
                    </button>
                </div>
            )}
        </div>

            {/* Modal Popup for Payment Method Selection */}
            {selectedPaymentId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-xl shadow-lg w-80 relative">
                        <button
                            onClick={() => setSelectedPaymentId(null)}
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                        <p className="text-lg font-medium mb-4">Choose Payment Method</p>
                        <div className="flex flex-col gap-4">
                            <button
                                onClick={() => payWithKhalti(appointments.find(apt => apt._id === selectedPaymentId))}
                                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                            >
                                Pay with Khalti
                            </button>
                            <button
                                onClick={() => handlePayment(selectedPaymentId, "eSewa")}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                Pay with eSewa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyAppointments;
