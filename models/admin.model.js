import mongoose from "mongoose";
const { Schema } = mongoose;

const adminSchema = new Schema({
    user: { 
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    role: {
        type: String,
        enum: ["superadmin", "support", "finance"],
        default: "support"
    },
    notifications: [{
        type: Schema.Types.ObjectId,
        ref: "Notification"
    }]
}, { timestamps: true });

const Admin = mongoose.model("Admin", adminSchema);
export default Admin;
