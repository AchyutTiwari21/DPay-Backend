import mongoose from "mongoose";
const { Schema } = mongoose;

const PaymentSchema = new Schema({
    payer: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    paymentId: {
        type: String,
        sparse: true
    },
    type: {
        type: String,
        enum: ["Demo Class Payment", "Registration Payment", "Tutor Payout", "Subscription Payment"],
        required: true,
    },
    status: {
        type: String,
        enum: ["PAID", "PENDING", "FAILED", "REFUNDED", "EXPIRED"],
        default: "PENDING"
    },
    method: {
        type: String,
        enum: ["Net Banking", "Card", "Wallet", "UPI"]
    },
    date: {
        type: Date,
        required: true,
        default: Date.now()
    },
    lesson: {
        type: Schema.Types.ObjectId,
        ref: "Lesson"
    }
}, { timestamps: true });

const Payment = mongoose.model("Payment", PaymentSchema);
export default Payment;