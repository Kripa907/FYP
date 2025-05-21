import Payment from "../models/paymentModel.js";
import Appointment from "../models/appointmentModel.js";
import { config } from "dotenv";
import axios from "axios";
config();

export const initiateKhaltiPayment = async (req, res) => {
  try {
    const { appointmentId, amount } = req.body;
    // Validate appointment exists
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }
    // Prepare payload for Khalti API (amount in paisa)
    const payload = {
      return_url: `${process.env.FRONTEND_URL}/appointments`,
      website_url: `${process.env.FRONTEND_URL}`,
      amount: amount * 100,
      purchase_order_id: appointmentId,
      purchase_order_name: "Appointment Payment",
    };

    const response = await axios.post("https://a.khalti.com/api/v2/epayment/initiate/", payload, {
      headers: {
        Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 200) {
      const data = response.data;
      return res.status(200).json({ success: true, payment_url: data.payment_url });
    } else {
      return res.status(response.status).json({ success: false, message: "Khalti initiation failed" });
    }
  } catch (error) {
    console.error("Error initiating Khalti payment:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const completeKhaltiPayment = async (req, res) => {
  try {
    const { appointmentId, transactionId, status } = req.body;
    const payment = await Payment.findOne({ appointment: appointmentId });
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment record not found" });
    }
    payment.payment_status = status === "successful" ? "Completed" : "Failed";
    payment.transaction_id = transactionId;
    await payment.save();
    return res.status(200).json({ success: true, message: "Payment status updated", payment });
  } catch (error) {
    console.error("Error completing Khalti payment:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const savePaymentRecord = async (req, res) => {
  try {
    const { appointmentId, amount, payment_method } = req.body;
    // Assume req.user is set by auth middleware
    const userId = req.user._id;
    const newPayment = new Payment({
      appointment: appointmentId,
      user: userId,
      amount,
      payment_method,
      payment_status: "Pending",
    });
    await newPayment.save();
    return res.status(201).json({ success: true, message: "Payment record created", payment: newPayment });
  } catch (error) {
    console.error("Error saving payment record:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};