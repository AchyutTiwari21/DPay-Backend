import { asyncHandler, ApiResponse } from "../../utils/index.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import { TutorProfile, Payment } from "../../models/index.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const buySubscription = asyncHandler(async (req, res) => {
    try {
        const userId = req?.user?._id;
        if(!userId) {
            return res.status(401).json(new ApiResponse(401, null, "Unauthorized"));
        }

        const tutorProfile = await TutorProfile.findOne({ user: userId });
        if(!tutorProfile) {
            return res.status(404).json(new ApiResponse(404, null, "Tutor profile not found"));
        }
        if(tutorProfile.isSubscribed) {
            return res.status(400).json(new ApiResponse(400, null, "Tutor is already subscribed."));
        }
        const subscriptionAmount = 1000; // Example subscription amount

        const options = {
            amount: subscriptionAmount * 100, // Convert to paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            notes: {
                type: "Tutor Subscription Payment",
                tutorId: tutorProfile._id.toString()
            }
        };
        const order = await razorpay.orders.create(options);

        await Payment.create({
            payer: req.user._id,
            amount: subscriptionAmount,
            orderId: order.id,
            type: "Subscription Payment",
            status: "PENDING"
        });

        return res.status(200).json(new ApiResponse(200, { orderId: order.id }, "Order created successfully"));
    } catch (error) {
        console.error("Buy Subscription Error: ", error);
        return res.status(500).json(new ApiResponse(500, null, "Subscription purchase failed!", error.message));
    }
});

export const verifySubscriptionPayment = asyncHandler(async (req, res) => {
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
                    "Subscription payment successful"
                )
            );
        } else {
            return res.status(400).json(
                new ApiResponse(
                    400, 
                    null, 
                    "Subscription payment failed"
                )
            );
        }
    } catch (error) {
        console.error("Verify Subscription Payment Error: ", error);
        return res.status(500).json(new ApiResponse(500, null, "Subscription payment verification failed!", error.message));
    }
});
