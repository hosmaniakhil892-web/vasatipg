const jwt = require("jsonwebtoken");
const dbService = require("../services/dbService");

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

async function authOwner(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Access denied. Authentication token is missing." });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token. Please log in again." });
    }

    if (decoded.role !== "owner") {
      return res.status(403).json({ error: "Forbidden. Owner access required." });
    }

    // Load owner details
    let owner;
    if (dbService.isMongoConnected()) {
      owner = await dbService.models.Owner.findOne({ email: decoded.email });
    }
    if (!owner) {
      const owners = dbService.readCollection("owners");
      owner = owners.find((o) => o.email.toLowerCase() === decoded.email.toLowerCase());
    }

    if (!owner) {
      return res.status(404).json({ error: "Owner account not found." });
    }

    // Enforce verified status
    if (owner.verificationStatus !== "Verified") {
      return res.status(403).json({
        error: "Access restricted. Your account is currently " + owner.verificationStatus + ". Only verified owners can manage properties.",
        verificationStatus: owner.verificationStatus,
        rejectionReason: owner.rejectionReason,
      });
    }

    // Fetch properties belonging to this owner
    let properties = [];
    if (dbService.isMongoConnected()) {
      properties = await dbService.models.Advertisement.find({ mailid: owner.email });
    }
    if (!properties || properties.length === 0) {
      const props = dbService.readCollection("properties");
      properties = props.filter((p) => p.mailid.toLowerCase() === owner.email.toLowerCase());
    }

    req.owner = owner;
    req.ownerProperties = properties;
    req.propertyIds = properties.map((p) => String(p._id));

    next();
  } catch (error) {
    console.error("Owner Auth Middleware Error:", error);
    res.status(500).json({ error: "Internal server error during authorization." });
  }
}

module.exports = { authOwner, SECRET_KEY };
