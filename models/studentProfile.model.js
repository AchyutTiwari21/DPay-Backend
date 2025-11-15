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
  marks: [{
    type: Schema.Types.ObjectId,
    ref: "Marks"
  }],
  schoolBoard: {
    type: String
  },
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
      type: String
    },
    bankName: {
      type: String
    },
    ifscCode: {
      type: String
    }
  },
  documents: [{
    type: String
  }],
  paymentHistory: [{
    type: Schema.Types.ObjectId,
    ref: "Payment"
  }],
  coins: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active"
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  notifications: [{
    type: Schema.Types.ObjectId,
    ref: "Notification"
  }]
}, {timestamps: true});

const StudentProfile = mongoose.model("StudentProfile", studentProfileSchema);
export default StudentProfile;