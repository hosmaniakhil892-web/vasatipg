const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({
  complaintId: { type: String, required: true, unique: true },
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Advertisement", required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", default: null },
  roomNumber: { type: String, default: "" },
  residentId: { type: mongoose.Schema.Types.ObjectId, ref: "Resident", default: null },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  category: {
    type: String,
    enum: [
      "Food",
      "Cleanliness",
      "Maintenance",
      "Water",
      "Electricity",
      "Internet",
      "Security",
      "Deposit",
      "Owner-related concerns",
    ],
    required: true,
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High", "Urgent"],
    default: "Medium",
  },
  status: {
    type: String,
    enum: ["Open", "In Progress", "Resolved", "Closed"],
    default: "Open",
  },
  ownerResponse: { type: String, default: "" },
  resolutionNotes: { type: String, default: "" },
  resolvedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Complaint", complaintSchema);
