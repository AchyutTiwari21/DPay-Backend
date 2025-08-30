import mongoose from "mongoose";
const { Schema } = mongoose;

const subjectSchema = new Schema({
  name: { 
    type: String,
    unique: true, 
    required: true 
  },
  category: { 
    type: String 
  },
}, {timestamps: true});

const Subject = mongoose.model("Subject", subjectSchema);
export default Subject;