// // route to initilize khalti payment gateway
// app.post("/initialize-khali", async (req, res) => {
//   try {
//     //try catch for error handling
//     const { itemId, totalPrice, website_url } = req.body;
//     const itemData = await Item.findOne({
//       _id: itemId,
//       price: Number(totalPrice),
//     });

//     if (!itemData) {
//       return res.status(400).send({
//         success: false,
//         message: "item not found",
//       });
//     }
//     // creating a purchase document to store purchase info
//     const purchasedItemData = await PurchasedItem.create({
//       item: itemId,
//       paymentMethod: "khalti",
//       totalPrice: totalPrice * 100,
//     });

//     const paymentInitate = await initializeKhaltiPayment({
//       amount: totalPrice * 100, // amount should be in paisa (Rs * 100)
//       purchase_order_id: purchasedItemData._id, // purchase_order_id because we need to verify it later
//       purchase_order_name: itemData.name,
//       return_url: `${process.env.BACKEND_URI}/complete-khalti-payment`, // it can be even managed from frontedn
//       website_url,
//     });

//     res.json({
//       success: true, const convertedAmount = Number(amount) * 100;
//       purchasedItemData,
//       payment: paymentInitate,
//     });
//   } catch (error) {
//     res.json({
//       success: false,
//       error,
//     });
//   }
// });


import dotenv from "dotenv";
dotenv.config();
import express from 'express';
import axios from 'axios';
import Appointment from "../models/appointmentModel.js";
import Payment from "../models/paymentModel.js";
import authUser from "../middlewares/authUser.js";

const router = express.Router();

router.post("/complete-khalti-payment", async (req, res) => {
  console.log("complete-khalti-payment called")
  const {product_id, buyer_name, amount, appointment_id} = req.body
  const convertedAmount = Number(amount) * 100; // Convert to paisa
  console.log("product_id", product_id)
  console.log("buyer_name", buyer_name)
  console.log("amount", convertedAmount)
  console.log("appointment_id", appointment_id)
try {
  const response = await fetch(
      "https://a.khalti.com/api/v2/epayment/initiate/",
      {
        method: "POST",
        headers: {
          Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          return_url: `http://localhost:5174/verify`,
          website_url: `http://localhost:5174/verify`,

          amount: convertedAmount,
          purchase_order_id: product_id,
          purchase_order_name: buyer_name,
        }),
      }
    );

    console.log(response);
    if (response.ok) {
      const data = await response.json();
      
      // If appointment_id is provided, send notification about payment
      if (appointment_id) {
        try {
          // Send notification to admin and doctor about the payment
          await axios.post('http://localhost:4001/api/notifications/payment', {
            appointmentId: appointment_id
          });
          console.log('Payment notification sent successfully');

        } catch (notificationError) {
          console.error('Error sending payment notification:', notificationError);
          // Continue with the payment process even if notification fails
        }
      }
      
      return res.status(200).json({
        success: true,
        message: data.payment_url,
      });
    }
  
} catch (error) {
  res.json({
    success: false,
    message: error.message
  });
}
})

router.post("/verify", async (req, res) => {
  const { pidx } = req.body;
  
  if (!pidx) {
    console.error("No payment ID provided in request");
    return res.status(400).json({
      success: false,
      message: { 
        status: "Failed", 
        message: "Payment ID is required" 
      }
    });
  }

  try {
    console.log("Verifying payment with ID:", pidx);
    
    const response = await fetch(
      "https://a.khalti.com/api/v2/epayment/lookup/",
      {
        method: "POST",
        headers: {
          Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pidx }),
      }
    );

    if (!response.ok) {
      console.error("Khalti API error:", response.status);
      throw new Error(`Khalti API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Raw Khalti response:", data);

    // Normalize the payment status
    let paymentStatus = data.status?.toLowerCase() || data.payment_status?.toLowerCase();
    
    if (!paymentStatus) {
      console.error("No payment status in response:", data);
      throw new Error("Invalid payment status received from Khalti");
    }

    // Map Khalti status to our status
    const statusMap = {
      'completed': 'Completed',
      'pending': 'Pending',
      'failed': 'Failed',
      'refunded': 'Refunded'
    };

    const normalizedStatus = statusMap[paymentStatus] || paymentStatus;

    // Update the response with normalized status
    const responseData = {
      ...data,
      status: normalizedStatus,
      payment_status: normalizedStatus
    };

    console.log("Normalized payment status:", normalizedStatus);

    return res.status(200).json({
      success: true,
      message: responseData
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res.status(500).json({
      success: false,
      message: { 
        status: "Failed", 
        message: "Error verifying payment status",
        error: error.message
      }
    });
  }
});

router.post("/save-payment-details", async (req, res) => {
  const { appointment_id,
    user,
    amount,
    payment_method,
    payment_status,
    transaction_id,
    payment_date
  } = req.body;
 

  try {
    // const findTransaction = await Payment.findOne({ transaction_id:transaction_id, user:user, payment_method:payment_method });
    // if (findTransaction) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Transaction already exists",
    //   });
    // }
    const newPayment = new Payment({
      appointment_id,
      user,
      amount,
      payment_method,
      payment_status: payment_status,
      payment_date,
      transaction_id,
      
    });
    await newPayment.save();

    if(!newPayment) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment details",
      });
    }

   
    return res.status(201).json({
      success: true,
      message: "Payment record created",
      payment: newPayment,
    });
  } catch (error) {
    console.error("Error saving payment record:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
})

export default router;