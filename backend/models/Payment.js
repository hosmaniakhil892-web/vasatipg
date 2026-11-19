const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, required: true, unique: true },
  receiptNumber: { type: String, required: true, unique: true },
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Advertisement", required: true },
  residentId: { type: mongoose.Schema.Types.ObjectId, ref: "Resident", default: null },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  bookingId: { type: String, default: null },
  month: { type: String, required: true }, // e.g., "November 2026"
  year: { type: Number, default: new Date().getFullYear() },
  amount: { type: Number, required: true },
  type: {
    type: String,
    enum: ["Rent", "Deposit", "Maintenance", "Refund"],
    default: "Rent",
  },
  status: {
    type: String,
    enum: ["Paid", "Pending", "Overdue"],
    default: "Pending",
  },
  dueDate: { type: Date, required: true },
  paidDate: { type: Date, default: null },
  paymentMethod: {
    type: String,
    enum: ["UPI", "Netbanking", "Cash", "Card", "Bank Transfer", null],
    default: null,
  },
  transactionRef: { type: String, default: null },
  verifiedBy: { type: String, default: null },
  notes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Payment", paymentSchema);

