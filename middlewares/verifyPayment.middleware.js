import crypto from "crypto";
import { asyncHandler, ApiResponse } from "../utils/index.js";
import { Payment } from "../models/index.js";

export const verifyPayment = asyncHandler(async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
  
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing payment fields" });
    }
  
    const hmac = crypto.createHmac("sha256", key_secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest("hex");
  
    if (generated_signature === razorpay_signature) {
      // Attach verification result to request object
      req.paymentVerified = true;
      next();
    } else {
      return res.status(400).json(
        new ApiResponse(
          400, 
          null, 
          "Payment verification failed"
        )
      );
    }
  } catch (error) {
    console.log("Error: ", error.message);  
    return res.status(500).json(
      new ApiResponse(
        500,
        null,
        "Internal server error"
      )
    );
  }
});
