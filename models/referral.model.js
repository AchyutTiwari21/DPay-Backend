import mongoose from "mongoose";
const { Schema } = mongoose;

const ReferralSchema = new Schema({
    referrer: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    studentName: {
        type: String,
        required: true,
    },
    subjectToTeach: {
        type: String,
        required: true,
    },
    studentEmail: {
        type: String,
        required: true,
    },
    studentPhone: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["PENDING", "ACCEPTED", "REJECTED"],
        default: "PENDING"
    }
});

const Referral = mongoose.model("Referral", ReferralSchema);
export default Referral;    
