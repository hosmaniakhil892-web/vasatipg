const mongoose = require("mongoose");

const residentSchema = new mongoose.Schema({
  customerId: { type: String, required: true, unique: true },
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Advertisement", required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
  roomNumber: { type: String, required: true },
  bedNumber: { type: String, required: true },
  sharingType: { type: String, default: "Single" },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  photo: { type: String, default: null },
  emergencyContact: {
    name: { type: String, default: null },
    phone: { type: String, default: null },
    relation: { type: String, default: null },
  },
  idProof: {
    docType: { type: String, default: "Aadhaar" },
    docNumber: { type: String, default: "" },
  },
  checkInDate: { type: Date, required: true },
  expectedCheckoutDate: { type: Date, default: null },
  actualCheckoutDate: { type: Date, default: null },
  monthlyRent: { type: Number, required: true },
  securityDeposit: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  pendingAmount: { type: Number, default: 0 },
  paymentStatus: {
    type: String,
    enum: ["Paid", "Pending", "Overdue"],
    default: "Pending",
  },
  residentStatus: {
    type: String,
    enum: ["Active", "Checked Out", "Suspended"],
    default: "Active",
  },
  bookingId: { type: String, default: null },
  notes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

// Helper method to mask phone number for privacy
residentSchema.methods.getMaskedPhone = function () {
  if (!this.mobileNumber || this.mobileNumber.length < 10) return "****";
  const num = this.mobileNumber.toString();
  return num.slice(0, 2) + "******" + num.slice(-2);
};

module.exports = mongoose.model("Resident", residentSchema);
