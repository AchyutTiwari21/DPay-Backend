import { asyncHandler, ApiResponse } from "../../../utils/index.js";
import { Lesson, TutorProfile, Payment, Subject } from "../../../models/index.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import { sessionAmount } from "../../../constants.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createOrder = asyncHandler(async (req, res) => {
  const { tutorId, date, time, subject } = req.body;

  try {
    const tutor = await TutorProfile.findById(tutorId);
    if (!tutor) {
      return res.status(404).json(new ApiResponse(404, null, "Tutor not found"));
    } 

    const subjectData = await Subject.findOne({ name: subject });
    if(!subjectData) {
      return res.status(404).json(new ApiResponse(404, null, "Subject not found"));
    }

    const lesson = await Lesson.create({
      student: req.user._id,
      tutor: tutor._id,
      subject: subjectData._id,
      date: new Date(date),
      time: time,
      status: "PENDING",
    });
    if(!lesson) {
      return res.status(500).json(new ApiResponse(500, null, "Failed to create lesson"));
    }

    const options = {
      amount: sessionAmount * 100, // Convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        type: "Demo Class Payment",
        lessonId: lesson._id.toString()
      }
    };

    const order = await razorpay.orders.create(options);

    await Payment.create({
      payer: req.user._id,
      amount: sessionAmount,
      orderId: order.id,
      type: "Demo Class Payment",
      lesson: lesson._id
    });

    return res.status(200).json(new ApiResponse(200, { orderId: order.id }, "Order created successfully"));

  } catch (error) {
    console.error("Payment Error: ", error);
    return res.status(500).json(new ApiResponse(500, null, "Order creation failed!", error.message));
  }
});

export const verifyOrder = asyncHandler(async (req, res) => {
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
          "Payment successful"
        )
      );
    } else {
      return res.status(400).json(
        new ApiResponse(
          400, 
          null, 
          "Payment failed"
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
