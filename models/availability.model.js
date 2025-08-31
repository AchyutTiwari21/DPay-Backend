import mongoose from "mongoose";
const { Schema } = mongoose;

const availabilitySchema = new Schema({
  tutor: { 
    type: Schema.Types.ObjectId, 
    ref: "TutorProfile", 
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  timeslots: [{ 
    type: String // "HH:mm"
  }],
  isRecurring: { 
    type: Boolean, 
    default: false 
  }
}, {timestamps: true});

const Availability = mongoose.model("Availability", availabilitySchema);
export default Availability;
