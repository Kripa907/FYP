import express from "express";
import { initiateKhaltiPayment, completeKhaltiPayment, savePaymentRecord } from "../controllers/paymentController.js";
import authUser from "../middlewares/authUser.js";

const router = express.Router();


router.post("/initiate", authUser, initiateKhaltiPayment);
router.post("/complete", authUser, completeKhaltiPayment);
router.post("/save", authUser, savePaymentRecord);

export default router;