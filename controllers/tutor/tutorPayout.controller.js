import { asyncHandler, ApiResponse } from "../../utils/index.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import { TutorProfile, Payment } from "../../models/index.js";
import { tutorPayoutAmount } from "../../constants.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const initiateTutorPayout = asyncHandler(async (req, res) => {
    try {
        const userId = req?.user?._id;
        if(!userId) {
            return res.status(401).json(new ApiResponse(401, null, "Unauthorized"));
        }

        const tutorProfile = await TutorProfile.findOne({ user: userId });
        if(!tutorProfile) {
            return res.status(404).json(new ApiResponse(404, null, "Tutor profile not found"));
        }

        if(tutorProfile.paymentStatus === "Paid") {
            return res.status(400).json(new ApiResponse(400, null, "Tutor has already paid tutor payout."));
        }

        const options = {
            amount: tutorPayoutAmount * 100, // Convert to paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            notes: {
                type: "Tutor Payout",
                tutorId: tutorProfile._id.toString()
            }
        };
    
        const order = await razorpay.orders.create(options);

        await Payment.create({
            payer: userId,
            amount: tutorPayoutAmount,
            orderId: order.id,
            type: "Tutor Payout"
        });
        return res.status(200).json(new ApiResponse(200, { orderId: order.id }, "Tutor payout initiated successfully"));
        
    } catch (error) {
        console.error("Tutor Payout Error: ", error);
        return res.status(500).json(new ApiResponse(500, null, "Tutor payout initiation failed!", error.message));
    }
});

export const verifyTutorPayout = asyncHandler(async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
  
    const hmac = crypto.createHmac("sha256", key_secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest("hex");
  
    if (generated_signature === razorpay_signature) {
      return res.status(200).json(
        new ApiResponse(
          200,
          null,
          "Tutor payout verified successfully"
        )
      );
    } else {
      return res.status(400).json(
        new ApiResponse(
          400, 
          null, 
          "Tutor payout verification failed"
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
