import mongoose from "mongoose";
const { Schema } = mongoose;

const tutionSchema = new Schema({
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
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: {
    type: Date,
    required: true
  },
  schedule: [{
    day: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      required: true
    },
    time: {
      type: String,
      required: true
    }
  }],
  status: {
    type: String,
    enum: ["PENDING", "CONFIRMED", "ONGOING", "COMPLETED", "CANCELLED"],
    default: "PENDING",
  },
  fees: {
    type: Number,
    required: true
  },
  subjects: [{
    type: Schema.Types.ObjectId,
    ref: "Subject",
    required: true
  }],
  demoLesson: {
    type: Schema.Types.ObjectId,
    ref: "Lesson"
  }
}, {timestamps: true});

const Tution = mongoose.model("Tution", tutionSchema);
export default Tution;
