const mongoose = require("mongoose");

const ownerSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  mobileNumber: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^[6-9]\d{9}$/.test(v);
      },
      message: (props) => `${props.value} is not a valid 10-digit Indian mobile number!`,
    },
  },
  isMobileVerified: { type: Boolean, default: false },
  otpCode: { type: String, default: null },
  propertyName: { type: String, required: true },
  propertyAddress: { type: String, required: true },
  identityProof: {
    docType: { type: String, enum: ["Aadhaar", "PAN", "Passport", "Voter ID"], required: true },
    docNumber: { type: String, required: true },
    docFile: { type: String, default: null },
  },
  ownershipProof: {
    docType: {
      type: String,
      enum: ["Property Deed", "Rental Agreement", "Electricity Bill", "Trade License"],
      required: true,
    },
    docFile: { type: String, default: null },
  },
  verificationStatus: {
    type: String,
    enum: ["Pending Verification", "Verified", "Rejected"],
    default: "Verified", // default verified for operational convenience or pending with admin approval
  },
  rejectionReason: { type: String, default: null },
  registeredProperties: [{ type: mongoose.Schema.Types.ObjectId, ref: "Advertisement" }],
  role: { type: String, default: "owner" },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: null },
});

module.exports = mongoose.model("Owner", ownerSchema);

