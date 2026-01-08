import { asyncHandler, ApiResponse } from "../../utils/index.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import { StudentProfile, Payment, User } from "../../models/index.js";

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

        let studentProfile = await StudentProfile.findOne({ user: userId });
        if(!studentProfile) {
            studentProfile = await StudentProfile.create({ user: userId });
            await User.findByIdAndUpdate(userId, { role: "STUDENT" });
        }
        if(studentProfile.isSubscribed) {
            return res.status(400).json(new ApiResponse(400, null, "Student is already subscribed."));
        }
        const subscriptionAmount = 1500; // Example subscription amount

        const options = {
            amount: subscriptionAmount * 100, // Convert to paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            notes: {
                type: "Student Subscription Payment",
                studentId: studentProfile._id.toString()
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