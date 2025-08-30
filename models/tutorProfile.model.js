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
  modeOfClass: {
    type: String,
    enum: ["online", "offline", "hybrid"],
    default: "offline"
  },
  experience: {
    type: String
  },
  totalClasses: { 
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
  hourlyRate: { 
    type: Number
  },
  ratingAvg: { 
    type: Number, 
    default: 0 
  },
}, {timestamps: true});

const TutorProfile = mongoose.model("TutorProfile", tutorProfileSchema);
export default TutorProfile;
