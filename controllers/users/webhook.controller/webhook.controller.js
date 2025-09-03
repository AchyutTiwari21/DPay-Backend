import crypto from "crypto";
import { asyncHandler } from "../../../utils/index.js";
import { Lesson, Payment, StudentProfile } from "../../../models/index.js";

export const webhookHandler = asyncHandler(async (req, res) => {
  try {
    res.json({ status: "ok" });
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Verify signature
    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    const razorpaySignature = req.headers["x-razorpay-signature"];

    if (digest !== razorpaySignature) {
      console.log("Request Invalid!");
      return;
    }

    const event = req.body.event;

    console.log("Webhook body: ", req.body);

    if (event === "payment.captured") {
      const payment = req.body.payload.payment.entity;

      const paymentData = await Payment.findOneAndUpdate(
        { razorpay_order_id: payment.order_id },
        {
          razorpay_payment_id: payment.id,
          status: "PAID",
          paidAt: new Date(),
          method: payment.method,
        }
      );

      if(!paymentData) {
        console.log("Payment not found");
        return;
      }

      await Lesson.findByIdAndUpdate(
        paymentData.lesson,
        { 
          $set: { 
            status: "CONFIRMED",
            payment: paymentData._id
          } 
        }  
      );

      const studentProfile = await StudentProfile.findOne({ user: paymentData.student });

      if(studentProfile) {
        studentProfile.lessons.push(paymentData.lesson);
        await studentProfile.save({ validateBeforeSave: false });
      } else {
        const newStudentProfile = new StudentProfile({
          user: paymentData.student,
          lessons: [paymentData.lesson]
        });
        await newStudentProfile.save({ validateBeforeSave: false });
      }  

      console.log("Payment successful:", paymentData.id);
      return;

    } 
    
    else if(event === "payment.failed") {
      const payment = req.body.payload.payment.entity;

      await Payment.findOneAndUpdate(
        { razorpay_order_id: payment.order_id },
        {
          razorpay_payment_id: payment.id,
          status: "FAILED",
          method: payment.method,
        }
      );

      console.log("❌ Payment failed:", payment.id);
    }
  } catch (err) {
    console.error("Webhook Error:", err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
});
