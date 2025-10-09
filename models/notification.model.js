const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  }, // recipient
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ["booking", "payment", "message", "system", "support"], 
    default: "system" 
  },
  isRead: { 
    type: Boolean, 
    default: false 
  },
  link: { 
    type: String 
  }, // optional, e.g. "/support/4567"
}, {timestamps: true});

module.exports = mongoose.model("Notification", notificationSchema);
