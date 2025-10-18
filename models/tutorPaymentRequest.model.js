import mongoose from "mongoose";
const { Schema } = mongoose;

const tutorPaymentRequestSchema = new Schema({
    tutor: {
        type: Schema.Types.ObjectId,
        ref: "TutorProfile",
        required: true
    },
    amount: {
        type: Number,
        default: 5000,
        required: true
    },
}, { timestamps: true });

const TutorPaymentRequest = mongoose.model("TutorPaymentRequest", tutorPaymentRequestSchema);
export default TutorPaymentRequest;
