import mongoose from "mongoose";
const { Schema } = mongoose;

const paymentSchema = new Schema({
  student: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  tutor: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  razorpay_order_id: { 
    type: String, 
    required: true 
  },
  razorpay_payment_id: { 
    type: String 
  },
  razorpay_signature: { 
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
  receipt: { 
    type: String 
  },

  status: {
    type: String,
    enum: ["PENDING", "PAID", "FAILED"],
    default: "PENDING",
  },
  paidAt: { type: Date },
}, { timestamps: true });



const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
