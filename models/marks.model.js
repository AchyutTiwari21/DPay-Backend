import mongoose from "mongoose";
const { Schema } = mongoose;

const marksSchema = new Schema({
    student: { 
        type: Schema.Types.ObjectId,
        ref: "StudentProfile",
        required: true 
    },
    tution: {
        type: Schema.Types.ObjectId,
        ref: "Tution",
        required: true
    },
    subject: {
        type: Schema.Types.ObjectId,
        ref: "Subject",
        required: true
    },
    totalMarks: {
        type: Number,
        required: true
    },
    obtainedMarks: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    remarks: {
        type: String
    }
}, {timestamps: true}
);

const Marks = mongoose.model("Marks", marksSchema);
export default Marks;