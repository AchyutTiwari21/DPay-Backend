import mongoose from "mongoose";
import { Schema } from "mongoose";

const applyTeacherRequestSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    address: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["PENDING", "ACCEPTED", "REJECTED"],
        default: "PENDING"
    },
    demoVideo: {
        type: String
    },
    subjects: [{
        type: Schema.Types.ObjectId,
        ref: "Subject",
        required: true
    }],
    qualifications: [{
        type: String,
        required: true
    }],
    experience: {
        type: Number,
        required: true
    },
    resume: {
        type: String,
        required: true
    },
}, {timestamps: true});

const ApplyTeacherRequest = mongoose.model("ApplyTeacherRequest", applyTeacherRequestSchema);
export default ApplyTeacherRequest;