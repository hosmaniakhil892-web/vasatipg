const mongoose = require("mongoose");

const bedSchema = new mongoose.Schema({
  bedNumber: { type: String, required: true },
  status: {
    type: String,
    enum: ["Available", "Occupied", "Reserved", "Maintenance"],
    default: "Available",
  },
  residentId: { type: mongoose.Schema.Types.ObjectId, ref: "Resident", default: null },
  residentName: { type: String, default: null },
});

const roomSchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Advertisement", required: true },
  roomNumber: { type: String, required: true },
  floor: { type: Number, default: 1 },
  sharingType: {
    type: String,
    enum: ["Single", "Double", "Triple", "Four Sharing"],
    required: true,
  },
  totalBeds: { type: Number, required: true },
  availableBeds: { type: Number, required: true },
  occupiedBeds: { type: Number, default: 0 },
  monthlyRent: { type: Number, required: true },
  securityDeposit: { type: Number, required: true },
  facilities: [String],
  images: [String],
  beds: [bedSchema],
  createdAt: { type: Date, default: Date.now },
});

// Update bed counts automatically before saving
roomSchema.pre("save", function (next) {
  if (this.beds && this.beds.length > 0) {
    this.totalBeds = this.beds.length;
    this.occupiedBeds = this.beds.filter((b) => b.status === "Occupied" || b.status === "Reserved").length;
    this.availableBeds = this.beds.filter((b) => b.status === "Available").length;
  }
  next();
});

module.exports = mongoose.model("Room", roomSchema);
