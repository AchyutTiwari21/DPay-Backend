import mongoose from "mongoose";
const { Schema } = mongoose;

const lessonSchema = new Schema({
  student: { 
    type: Schema.Types.ObjectId, 
    ref: "StudentProfile", 
    required: true 
  },
  tutor: { 
    type: Schema.Types.ObjectId, 
    ref: "TutorProfile", 
    required: true 
  },
  subject: [{ 
    type: Schema.Types.ObjectId, 
    ref: "Subject", 
    required: true 
  }],
  date: { 
    type: Date, 
    required: true 
  },
  startTime: { 
    type: String, 
    required: true 
  },
  endTime: { 
    type: String, 
    required: true 
  },
  status: {
    type: String,
    enum: ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"],
    default: "PENDING",
  },
  price: { 
    type: Number, 
    required: true 
  },
  payment: { 
    type: Schema.Types.ObjectId, 
    ref: "Payment",
    required: true 
  },
  review: [{ 
    type: Schema.Types.ObjectId, 
    ref: "Review" 
  }],
}, {timestamps: true});

const Lesson = mongoose.model("Lesson", lessonSchema);
export default Lesson;
