import mongoose from "mongoose";
const { Schema } = mongoose;

const reviewSchema = new Schema({
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
  comment: { 
    type: String 
  },
}, {timestamps: true});

const Review = mongoose.model("Review", reviewSchema);
export default Review;
