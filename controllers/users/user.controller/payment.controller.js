import { asyncHandler, ApiResponse } from "../../../utils/index.js";
import { TutorProfile, Payment } from "../../../models/index.js";
import Razorpay from "razorpay";
import { sessionAmount } from "../../../constants.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createOrder = asyncHandler(async (req, res) => {
  const { tutorId } = req.body;

  try {
    const tutor = await TutorProfile.findById(tutorId);
    if (!tutor) {
      return res.status(404).json(new ApiResponse(404, null, "Tutor not found"));
    } 

    const options = {
      amount: sessionAmount * 100, // Convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    console.log("Order created: ", order);

    await Payment.create({
      student: req.user.id,
      tutor: tutor._id,
      razorpay_order_id: order.id,
      amount: sessionAmount,
      currency: "INR",
      receipt: options.receipt,
      status: "PENDING",
    });

    return res.status(200).json(new ApiResponse(200, { orderId: order.id}, "Order created successfully"));

  } catch (error) {
    console.error("Payment Error: ", error);
    return res.status(500).json(new ApiResponse(500, null, "Order creation failed!", error.message));
  }
});

export const markPaymentFailed = asyncHandler(async (req, res) => {
  const { orderId, paymentId, } = req.body;

  try {
    // Find and update the payment record
    const payment = await Payment.findOneAndUpdate(
      { razorpay_order_id: orderId },
      {
        status: "FAILED",
        razorpay_payment_id: paymentId
      },
      { new: true }
    );
  
    if (!payment) {
      return res.status(404).json(new ApiResponse(404, null, "Payment record not found"));
    }
  
    return res.status(200).json(new ApiResponse(200, payment, "Payment marked as FAILED"));
  } catch (error) {
    console.error("Error marking payment as failed: ", error);
    res.status(500).json(new ApiResponse(500, null, "Internal Server Error"));
  }
});
