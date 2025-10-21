import crypto from "crypto";
import { asyncHandler } from "../../../utils/index.js";
import { Lesson, Payment, StudentProfile, User, Availability } from "../../../models/index.js";

export const webhookHandler = asyncHandler(async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Verify signature first
    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    const razorpaySignature = req.headers["x-razorpay-signature"];
    if (digest !== razorpaySignature) {
      console.log("❌ Invalid signature");
      return res.status(400).json({ status: "failure", message: "Invalid signature" });
    }

    // ✅ Immediately acknowledge webhook
    res.json({ status: "ok" });

    // Continue processing in background (don’t block response)
    const event = req.body.event;

    if (event === "payment.captured") {
      const payment = req.body.payload.payment.entity;

      const paymentData = await Payment.findOneAndUpdate(
        { razorpay_order_id: payment.order_id },
        {
          razorpay_payment_id: payment.id,
          status: "PAID",
          paidAt: new Date(),
          method: payment.method,
        },
        { new: true }
      );

      if (!paymentData) {
        console.error("⚠️ Payment record not found for order:", payment.order_id);
        return;
      }

      const lessonData = await Lesson.findByIdAndUpdate(paymentData.lesson, {
        $set: { status: "CONFIRMED", payment: paymentData._id }
      });

      const bookingDate = lessonData.date;
      const dayName = bookingDate.toLocaleDateString("en-US", { weekday: "short" });

      await Availability.findOneAndUpdate(
        {
          tutor: lessonData.tutor,
          day: dayName,
        },
        {
          $pull: { timeslots: lessonData.time }
        }
      );

      const studentProfile = await StudentProfile.findOne({ user: paymentData.student });

      if (studentProfile) {
        studentProfile.demoLessons.push(paymentData.lesson);
        studentProfile.paymentHistory.push(paymentData._id);
        await studentProfile.save({ validateBeforeSave: false });
      } else {
        await StudentProfile.create({
          user: paymentData.student,
          demoLessons: [paymentData.lesson],
          paymentHistory: [paymentData._id]
        });
        await User.findByIdAndUpdate(
          paymentData.student,
          { $set: { role: "STUDENT" } }
        );
      }

      console.log("✅ Payment successful:", paymentData.razorpay_payment_id);
    }

    else if (event === "payment.failed") {
      const payment = req.body.payload.payment.entity;

      const paymentData = await Payment.findOneAndUpdate(
        { razorpay_order_id: payment.order_id },
        {
          razorpay_payment_id: payment.id,
          status: "FAILED",
          method: payment.method,
        }
      );

      const studentProfile = await StudentProfile.findOne({ user: paymentData.student });

      if (studentProfile) {
        studentProfile.paymentHistory.push(paymentData._id);
        await studentProfile.save({ validateBeforeSave: false });
      } else {
        await StudentProfile.create({
          user: paymentData.student,
          paymentHistory: [paymentData._id]
        });
        await User.findByIdAndUpdate(
          paymentData.student,
          { $set: { role: "STUDENT" } }
        );
      }

      console.log("❌ Payment failed:", payment.id);
    }

  } catch (err) {
    console.error("Webhook Error:", err.message);
    // Don’t send a second res.json here since we already acknowledged
  }
});
