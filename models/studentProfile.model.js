import mongoose from "mongoose";
const { Schema } = mongoose;

const studentProfileSchema = new Schema({
  user: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  lessons: [{
    type: Schema.Types.ObjectId,
    ref: "Lesson"
  }],
  review: [{
    type: Schema.Types.ObjectId,
    ref: "Review"
  }]
}, {timestamps: true});

const StudentProfile = mongoose.model("StudentProfile", studentProfileSchema);
export default StudentProfile;