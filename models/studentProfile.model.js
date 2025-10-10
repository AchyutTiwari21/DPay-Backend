import mongoose from "mongoose";
const { Schema } = mongoose;

const studentProfileSchema = new Schema({
  user: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  demoLessons: [{
    type: Schema.Types.ObjectId,
    ref: "Lesson"
  }],
  tutions: [{
    type: Schema.Types.ObjectId,
    ref: "Tution"
  }],
  walletBalance: {
    type: Number,
    default: 0,
    required: true
  },
  address: {
    type: String
  },
  phone: {
    type: String
  },
  bankDetails: {
    accountNumber: {
      type: String,
      required: true
    },
    bankName: {
      type: String,
      required: true
    },
    ifscCode: {
      type: String,
      required: true
    }
  },
  documents: [{
    type: String
  }],
  paymentHistory: [{
    type: Schema.Types.ObjectId,
    ref: "Payment"
  }],
  status: {
    type: String,
    enum: ["Active", "Inactive", "Pending"],
    default: "Pending"
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  }
}, {timestamps: true});

const StudentProfile = mongoose.model("StudentProfile", studentProfileSchema);
export default StudentProfile;