import mongoose from "mongoose";
const { Schema } = mongoose;

const tutorProfileSchema = new Schema({
  user: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  about: { 
    type: String 
  },
  qualifications: [{
    type: String
  }],
  mode: {
    type: String,
    enum: ["online", "offline", "hybrid"],
    default: "offline"
  },
  experience: {
    type: String
  },
  lessonsCount: { 
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
  rating: { 
    type: Number, 
    default: 5,
    min: 1,
    max: 5
  },
  verified: {
    type: Boolean,
    default: true
  },
  availability: [{
    type: Schema.Types.ObjectId,
    ref: "Availability"
  }],
  reviews: [{
    type: Schema.Types.ObjectId,
    ref: "Review"
  }]
}, {timestamps: true});

const TutorProfile = mongoose.model("TutorProfile", tutorProfileSchema);
export default TutorProfile;
