import mongoose from "mongoose";
const { Schema } = mongoose;

const tutionSchema = new Schema({
  tutor: { 
    type: Schema.Types.ObjectId, 
    ref: "TutorProfile", 
    required: true 
  },
  student: { 
    type: Schema.Types.ObjectId, 
    ref: "StudentProfile", 
    required: true 
  },
  title: {
    type: String,
    required: true
  },
  startDate: { 
    type: Date
  },
  endDate: {
    type: Date
  },
  schedule: [{
    day: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    },
    time: {
      type: String
    }
  }],
  status: {
    type: String,
    enum: ["PENDING", "CONFIRMED", "ONGOING", "COMPLETED", "CANCELLED"],
    default: "PENDING",
  },
  fees: {
    type: Number
  },
  subjects: [{
    type: Schema.Types.ObjectId,
    ref: "Subject",
    required: true
  }]
}, {timestamps: true});

const Tution = mongoose.model("Tution", tutionSchema);
export default Tution;
