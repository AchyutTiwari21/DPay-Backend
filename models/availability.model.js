import mongoose from "mongoose";
const { Schema } = mongoose;

const availabilitySchema = new Schema({
  tutor: { 
    type: Schema.Types.ObjectId, 
    ref: "TutorProfile", 
    required: true 
  },
  day: { 
    type: String, 
    required: true 
  },
  timeslots: [{ 
    type: String // "HH:mm"
  }],
}, {timestamps: true});

const Availability = mongoose.model("Availability", availabilitySchema);
export default Availability;
