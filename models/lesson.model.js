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
  payment: { 
    type: Schema.Types.ObjectId, 
    ref: "Payment"
  },
  successful: {
    type: Boolean
  }
}, {timestamps: true});

const Lesson = mongoose.model("Lesson", lessonSchema);
export default Lesson;
