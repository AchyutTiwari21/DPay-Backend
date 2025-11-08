import mongoose from "mongoose";
const { Schema } = mongoose;

const tutorProfileSchema = new Schema({
  user: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  address: {
    type: String
  },
  phone: {
    type: String
  },
  about: { 
    type: String 
  },
  education: [{
    type: String
  }],
  title: {
    type: String
  },
  mode: {
    enum: ["online", "offline", "hybrid"],
  },
  experience: {
    type: Number
  },
  classesTaken: { 
    type: Number, 
    default: 0 
  },
  skills: [{ 
    type: String 
  }],
  languages: [{ 
    type: String 
  }],
  title: {
    type: String
  },
  subjects: [{
    type: Schema.Types.ObjectId,
    ref: "Subject"
  }],
  pricePerHour: { 
    type: Number,
    min: 1
  },
  availableLocations: [{ 
    type: String 
  }],
  demoLessons: [{
    type: Schema.Types.ObjectId,
    ref: "Lesson"
  }],
  tutions: [{
    type: Schema.Types.ObjectId,
    ref: "Tution"
  }],
  paymentStatus: {
    type: String,
    enum: ["Paid", "Pending", "Failed"],
    default: "Pending"
  },
  paymentHistory: [{
    type: Schema.Types.ObjectId,
    ref: "Payment"
  }],
  registrationDate: {
    type: Date,
    default: Date.now
  },
  registrationFees: {
    type: Number,
    default: 5000,
    min: 0
  },
  rating: { 
    type: Number, 
    default: 5,
    min: 1,
    max: 5
  },
  status: {
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active"
  },
  verified: {
    type: Boolean,
    default: false
  },
  students: [{
    type: Schema.Types.ObjectId,
    ref: "StudentProfile"
  }],
  availability: [{
    type: Schema.Types.ObjectId,
    ref: "Availability"
  }],
  reviews: [{
    type: Schema.Types.ObjectId,
    ref: "Review"
  }],
  notifications: [{
    type: Schema.Types.ObjectId,
    ref: "Notification"
  }]
}, {timestamps: true});

const TutorProfile = mongoose.model("TutorProfile", tutorProfileSchema);
export default TutorProfile;
