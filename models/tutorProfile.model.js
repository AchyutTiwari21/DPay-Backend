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
  mode: [{
    type: String,
    enum: ["Online", "Offline"]
  }],
  experience: {
    type: String
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
    enum: ["Paid", "Pending", "Failed"]
  },
  rating: { 
    type: Number, 
    default: 5,
    min: 1,
    max: 5
  },
  verified: {
    type: Boolean,
    default: false
  },
  availability: [{
    type: Schema.Types.ObjectId,
    ref: "Availability"
  }],
  reviews: [{
    type: Schema.Types.ObjectId,
    ref: "Review"
  }],
}, {timestamps: true});

const TutorProfile = mongoose.model("TutorProfile", tutorProfileSchema);
export default TutorProfile;
