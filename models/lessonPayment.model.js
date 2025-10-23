import mongoose from "mongoose";
const { Schema } = mongoose;

const LessonPaymentSchema = new Schema({
  lesson: {
    type: Schema.Types.ObjectId,
    ref: "Lesson"
  },

  student: { 
    type: Schema.Types.ObjectId, 
    ref: "User"
  },
  tutor: {
    type: Schema.Types.ObjectId,
    ref: "TutorProfile"
  },

  razorpay_order_id: { 
    type: String, 
    unique: true,
    required: true 
  },
  razorpay_payment_id: { 
    type: String 
  },

  amount: { 
    type: Number, 
    required: true 
  },
  currency: { 
    type: String, 
    default: "INR" 
  },
  method: {
    type: String,
    enum: ["netbanking", "card", "wallet", "upi"]
  },
  receipt: { 
    type: String 
  },

  status: {
    type: String,
    enum: ["PENDING", "PAID", "FAILED", "EXPIRED"],
    default: "PENDING",
  },
  paidAt: { type: Date },
}, { timestamps: true });

const LessonPayment = mongoose.model("LessonPayment", LessonPaymentSchema);
export default LessonPayment;
