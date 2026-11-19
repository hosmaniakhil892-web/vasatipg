const mongoose = require("mongoose");

const visitSchema = new mongoose.Schema({
  visitId: { type: String, required: true, unique: true },
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Advertisement", required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, required: true },
  requestedDate: { type: Date, required: true },
  requestedTime: { type: String, required: true },
  alternativeDate: { type: Date, default: null },
  alternativeTime: { type: String, default: null },
  status: {
    type: String,
    enum: ["Requested", "Accepted", "Rescheduled", "Completed", "Rejected"],
    default: "Requested",
  },
  notes: { type: String, default: "" },
  ownerNotes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Visit", visitSchema);

