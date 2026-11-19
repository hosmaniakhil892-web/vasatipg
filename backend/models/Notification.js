const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipientEmail: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  category: {
    type: String,
    enum: ["booking", "payment", "complaint", "visit", "system", "general"],
    default: "general",
  },
  read: { type: Boolean, default: false },
  link: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Notification", notificationSchema);

