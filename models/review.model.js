import mongoose from "mongoose";
const { Schema } = mongoose;

const reviewSchema = new Schema({
  lesson: { 
    type: Schema.Types.ObjectId, 
    ref: "Lesson", 
    required: true 
  },
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
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  comment: { 
    type: String 
  },
}, {timestamps: true});

const Review = mongoose.model("Review", reviewSchema);
export default Review;
