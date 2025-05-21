import mongoose from "mongoose";
const { Schema } = mongoose;

const paymentSchema = new Schema({
  appointment_id: {
    type: Schema.Types.ObjectId,
    ref: "Appointment",
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  payment_method: {
    type: String,
    required: true,
  },
  payment_status: {
    type: String,
    enum: ["Pending", "Completed", "Failed"],
    default: "Pending",
    required: true,
  },
  transaction_id: {
    type: String,
  },
  payment_date: {
    type: Date,
    default: Date.now,
  },
});

const Payment =
  mongoose.models.Payment || mongoose.model("Payment", paymentSchema);

export default Payment;