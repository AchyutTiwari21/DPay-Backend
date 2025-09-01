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
    required: true,
    enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] // restrict valid days
  },
  timeslots: [{
    type: String,
    validate: {
      validator: function (value) {
        // 1) Check format HH:mm
        const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!regex.test(value)) return false;

        // 2) Ensure no duplicates in the same document
        const slots = this.timeslots || [];
        const duplicates = slots.filter(s => s === value);
        if (duplicates.length > 1) return false;

        return true;
      },
      message: props => `${props.value} is not a valid time slot (must be HH:mm, unique, and within 24h)`
    }
  }]
}, { timestamps: true });

const Availability = mongoose.model("Availability", availabilitySchema);
export default Availability;
