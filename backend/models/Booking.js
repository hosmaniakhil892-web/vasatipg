const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Advertisement", required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", default: null },
  roomNumber: { type: String, default: null },
  bedNumber: { type: String, default: null },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, required: true },
  sharingType: { type: String, default: "Single" },
  checkInDate: { type: Date, required: true },
  expectedCheckoutDate: { type: Date, default: null },
  monthlyRent: { type: Number, required: true },
  securityDeposit: { type: Number, default: 0 },
  status: {
    type: String,
    enum: [
      "New Enquiry",
      "Visit Requested",
      "Booking Pending",
      "Confirmed",
      "Checked In",
      "Checked Out",
      "Cancelled",
    ],
    default: "New Enquiry",
  },
  termsAccepted: { type: Boolean, default: true },
  rejectionReason: { type: String, default: null },
  cancellationReason: { type: String, default: null },
  specialRequests: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Booking", bookingSchema);

