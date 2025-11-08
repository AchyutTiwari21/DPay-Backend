import mongoose from "mongoose";
const { Schema } = mongoose;

const lessonSchema = new Schema({
  student: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  tutor: { 
    type: Schema.Types.ObjectId, 
    ref: "TutorProfile", 
    required: true 
  },
  subject: {
    type: Schema.Types.ObjectId, 
    ref: "Subject",
    required: true
  },
  date: { 
    type: Date, 
    required: true 
  },
  time: { 
    type: String, 
    required: true 
  },
  status: {
    type: String,
    enum: ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "EXPIRED"],
    default: "PENDING",
  },
  meetingLink: {
    type: String
  },
  notes: {
    type: String,
  },
  payment: { 
    type: Schema.Types.ObjectId, 
    ref: "Payment"
  }
}, {timestamps: true});

const Lesson = mongoose.model("Lesson", lessonSchema);
export default Lesson;
