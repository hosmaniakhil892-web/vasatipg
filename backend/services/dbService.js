const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

// Import Mongoose Models
const Owner = require("../models/Owner");
const Advertisement = require("../models/Advertisement");
const Room = require("../models/Room");
const Resident = require("../models/Resident");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Visit = require("../models/Visit");
const Complaint = require("../models/Complaint");
const AuditLog = require("../models/AuditLog");
const Notification = require("../models/Notification");
const User = require("../models/User");

const DATA_DIR = path.join(__dirname, "../data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to read / write local JSON collections
function readCollection(name) {
  const filePath = path.join(DATA_DIR, `${name}.json`);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${name}.json:`, err.message);
    return [];
  }
}

function writeCollection(name, data) {
  const filePath = path.join(DATA_DIR, `${name}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`Error writing ${name}.json:`, err.message);
  }
}

// Is Mongoose currently connected?
function isMongoConnected() {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

// Record an audit log entry
async function logAudit({ action, entityType, entityId, propertyId = null, performedBy, userRole = "owner", details = {} }) {
  const entry = {
    action,
    entityType,
    entityId: String(entityId),
    propertyId: propertyId ? String(propertyId) : null,
    performedBy,
    userRole,
    details,
    timestamp: new Date().toISOString(),
  };

  if (isMongoConnected()) {
    try {
      await AuditLog.create(entry);
    } catch (e) {
      console.warn("MongoDB audit log error, saving to local store:", e.message);
    }
  }

  const logs = readCollection("audit_logs");
  logs.unshift(entry);
  if (logs.length > 500) logs.pop(); // keep last 500
  writeCollection("audit_logs", logs);
}

// Send in-app notification
async function createNotification({ recipientEmail, title, message, category = "general", link = null }) {
  const notif = {
    id: "NOTIF-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
    recipientEmail,
    title,
    message,
    category,
    read: false,
    link,
    createdAt: new Date().toISOString(),
  };

  if (isMongoConnected()) {
    try {
      await Notification.create(notif);
    } catch (e) {
      console.warn("MongoDB notification error:", e.message);
    }
  }

  const notifs = readCollection("notifications");
  notifs.unshift(notif);
  writeCollection("notifications", notifs);
}

module.exports = {
  isMongoConnected,
  readCollection,
  writeCollection,
  logAudit,
  createNotification,
  models: {
    Owner,
    Advertisement,
    Room,
    Resident,
    Booking,
    Payment,
    Visit,
    Complaint,
    AuditLog,
    Notification,
    User,
  },
};
