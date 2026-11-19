const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true }, // e.g. "VIEW_CUSTOMER", "ALLOCATE_ROOM", "RECORD_PAYMENT", "UPDATE_BOOKING"
  entityType: {
    type: String,
    enum: ["Customer", "Booking", "Room", "Payment", "Complaint", "Owner", "Visit"],
    required: true,
  },
  entityId: { type: String, required: true },
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Advertisement", default: null },
  performedBy: { type: String, required: true }, // email of owner or user
  userRole: { type: String, default: "owner" },
  ipAddress: { type: String, default: "127.0.0.1" },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("AuditLog", auditLogSchema);

