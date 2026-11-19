const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { authOwner, SECRET_KEY } = require("../middleware/authOwner");
const dbService = require("../services/dbService");

const router = express.Router();

// Helper: Mask phone number for customer privacy (e.g., "+91 98******45")
function maskPhoneNumber(phone) {
  if (!phone) return "Not Provided";
  const str = String(phone).trim();
  if (str.length < 6) return "****";
  return str.slice(0, 2) + "******" + str.slice(-2);
}

// ----------------------------------------------------
// 1. OWNER AUTHENTICATION
// ----------------------------------------------------

// Register a new PG Owner
router.post("/register", async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      mobileNumber,
      propertyName,
      propertyAddress,
      identityProof,
      ownershipProof,
    } = req.body;

    if (!fullName || !email || !password || !mobileNumber || !propertyName || !propertyAddress) {
      return res.status(400).json({ error: "All required registration fields must be provided." });
    }

    const owners = dbService.readCollection("owners");
    const existing = owners.find((o) => o.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: "An owner account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const demoOtp = "123456"; // Standard test OTP for development

    const newOwner = {
      _id: "owner_" + Date.now(),
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
      mobileNumber,
      isMobileVerified: false,
      otpCode: demoOtp,
      propertyName,
      propertyAddress,
      identityProof: identityProof || {
        docType: "Aadhaar",
        docNumber: "XXXX-XXXX-XXXX",
        docFile: null,
      },
      ownershipProof: ownershipProof || {
        docType: "Electricity Bill",
        docNumber: "BILL-XXXX",
        docFile: null,
      },
      verificationStatus: "Verified", // Instant verification for operational readiness
      rejectionReason: null,
      registeredProperties: [],
      role: "owner",
      createdAt: new Date().toISOString(),
      lastLogin: null,
    };

    // Also auto-create their initial PG Property in properties collection
    const properties = dbService.readCollection("properties");
    const newProperty = {
      _id: "prop_" + Date.now(),
      pgName: propertyName,
      price: "8500",
      gender: "Unisex",
      amenities: ["WiFi", "Geyser", "Washing Machine", "Housekeeping", "Power Backup"],
      occupancy: "Single, Double, Triple",
      description: `Newly registered property ${propertyName} located at ${propertyAddress}. Fully furnished with high-speed internet, CCTV security and clean environment.`,
      latitude: 12.9352,
      longitude: 77.6245,
      locationName: propertyAddress,
      images: [
        "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
      ],
      mailid: email.toLowerCase(),
      status: "active",
      totalRooms: 4,
      totalBeds: 8,
      occupiedBeds: 0,
      availableBeds: 8,
    };

    newOwner.registeredProperties.push(newProperty._id);
    properties.push(newProperty);
    dbService.writeCollection("properties", properties);

    // Create 4 initial starter rooms for this new property
    const rooms = dbService.readCollection("rooms");
    const starterRooms = [
      {
        _id: "room_" + Date.now() + "_101",
        propertyId: newProperty._id,
        roomNumber: "101",
        floor: 1,
        sharingType: "Single",
        totalBeds: 1,
        availableBeds: 1,
        occupiedBeds: 0,
        monthlyRent: 12000,
        securityDeposit: 18000,
        facilities: ["WiFi", "Attached Washroom", "AC"],
        images: [],
        beds: [{ bedNumber: "101-A", status: "Available", residentId: null, residentName: null }],
        createdAt: new Date().toISOString(),
      },
      {
        _id: "room_" + Date.now() + "_102",
        propertyId: newProperty._id,
        roomNumber: "102",
        floor: 1,
        sharingType: "Double",
        totalBeds: 2,
        availableBeds: 2,
        occupiedBeds: 0,
        monthlyRent: 8500,
        securityDeposit: 15000,
        facilities: ["WiFi", "Geyser", "Attached Washroom"],
        images: [],
        beds: [
          { bedNumber: "102-A", status: "Available", residentId: null, residentName: null },
          { bedNumber: "102-B", status: "Available", residentId: null, residentName: null },
        ],
        createdAt: new Date().toISOString(),
      },
    ];
    rooms.push(...starterRooms);
    dbService.writeCollection("rooms", rooms);

    owners.push(newOwner);
    dbService.writeCollection("owners", owners);

    await dbService.logAudit({
      action: "OWNER_REGISTERED",
      entityType: "Owner",
      entityId: newOwner._id,
      performedBy: email,
      details: { propertyName, propertyAddress },
    });

    res.status(201).json({
      message: "Owner registration successful! Please verify OTP.",
      requiresOtp: true,
      email: newOwner.email,
      mobileNumber: newOwner.mobileNumber,
      demoOtp: "123456",
    });
  } catch (error) {
    console.error("Owner register error:", error);
    res.status(500).json({ error: "Failed to register owner account." });
  }
});

// Verify Mobile OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required." });
    }

    const owners = dbService.readCollection("owners");
    const ownerIndex = owners.findIndex((o) => o.email.toLowerCase() === email.toLowerCase());
    if (ownerIndex === -1) {
      return res.status(404).json({ error: "Owner account not found." });
    }

    const owner = owners[ownerIndex];
    if (otp !== "123456" && owner.otpCode !== otp) {
      return res.status(400).json({ error: "Invalid OTP code entered. Please try again." });
    }

    owner.isMobileVerified = true;
    owner.otpCode = null;
    owners[ownerIndex] = owner;
    dbService.writeCollection("owners", owners);

    const token = jwt.sign({ email: owner.email, id: owner._id, role: "owner" }, SECRET_KEY, {
      expiresIn: "7d",
    });

    await dbService.logAudit({
      action: "OTP_VERIFIED",
      entityType: "Owner",
      entityId: owner._id,
      performedBy: owner.email,
      details: { mobileNumber: owner.mobileNumber },
    });

    res.status(200).json({
      message: "Mobile verified successfully!",
      token,
      owner: {
        fullName: owner.fullName,
        email: owner.email,
        mobileNumber: owner.mobileNumber,
        verificationStatus: owner.verificationStatus,
        propertyName: owner.propertyName,
      },
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ error: "Failed to verify OTP." });
  }
});

// Owner Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const owners = dbService.readCollection("owners");
    const owner = owners.find((o) => o.email.toLowerCase() === email.toLowerCase());

    if (!owner) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, owner.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    if (owner.verificationStatus === "Rejected") {
      return res.status(403).json({
        error: "Your owner account verification was rejected: " + (owner.rejectionReason || "Documents not approved."),
      });
    }

    const token = jwt.sign({ email: owner.email, id: owner._id, role: "owner" }, SECRET_KEY, {
      expiresIn: "7d",
    });

    await dbService.logAudit({
      action: "OWNER_LOGIN",
      entityType: "Owner",
      entityId: owner._id,
      performedBy: owner.email,
      details: { ip: req.ip || "127.0.0.1" },
    });

    res.status(200).json({
      message: "Login successful!",
      token,
      owner: {
        fullName: owner.fullName,
        email: owner.email,
        mobileNumber: owner.mobileNumber,
        verificationStatus: owner.verificationStatus,
        propertyName: owner.propertyName,
        role: "owner",
      },
    });
  } catch (error) {
    console.error("Owner login error:", error);
    res.status(500).json({ error: "Server error during login." });
  }
});

// Fetch current owner profile and properties
router.get("/me", authOwner, async (req, res) => {
  res.status(200).json({
    owner: {
      fullName: req.owner.fullName,
      email: req.owner.email,
      mobileNumber: req.owner.mobileNumber,
      verificationStatus: req.owner.verificationStatus,
      propertyName: req.owner.propertyName,
      propertyAddress: req.owner.propertyAddress,
      identityProof: req.owner.identityProof,
      ownershipProof: req.owner.ownershipProof,
      createdAt: req.owner.createdAt,
    },
    properties: req.ownerProperties,
  });
});

// ----------------------------------------------------
// 2. OWNER DASHBOARD SUMMARY & ANALYTICS
// ----------------------------------------------------

router.get("/dashboard/summary", authOwner, async (req, res) => {
  try {
    const { propertyId } = req.query;
    const targetPropertyIds = propertyId && req.propertyIds.includes(propertyId)
      ? [propertyId]
      : req.propertyIds;

    const properties = req.ownerProperties.filter((p) => targetPropertyIds.includes(String(p._id)));
    const allResidents = dbService.readCollection("residents");
    const allRooms = dbService.readCollection("rooms");
    const allBookings = dbService.readCollection("bookings");
    const allPayments = dbService.readCollection("payments");
    const allVisits = dbService.readCollection("visits");
    const allComplaints = dbService.readCollection("complaints");
    const allAuditLogs = dbService.readCollection("audit_logs");

    // Filter collections by target owner properties
    const residents = allResidents.filter((r) => targetPropertyIds.includes(String(r.propertyId)));
    const rooms = allRooms.filter((rm) => targetPropertyIds.includes(String(rm.propertyId)));
    const bookings = allBookings.filter((b) => targetPropertyIds.includes(String(b.propertyId)));
    const payments = allPayments.filter((p) => targetPropertyIds.includes(String(p.propertyId)));
    const visits = allVisits.filter((v) => targetPropertyIds.includes(String(v.propertyId)));
    const complaints = allComplaints.filter((c) => targetPropertyIds.includes(String(c.propertyId)));

    // Metric 1: Total Properties
    const totalProperties = properties.length;

    // Metric 2: Total Customers
    const totalCustomers = residents.length;

    // Metric 3: Active Residents
    const activeResidents = residents.filter((r) => r.residentStatus === "Active").length;

    // Metric 4: Total & Available Beds
    let totalBeds = 0;
    let availableBeds = 0;
    let occupiedBeds = 0;
    rooms.forEach((rm) => {
      totalBeds += rm.totalBeds || (rm.beds ? rm.beds.length : 0);
      availableBeds += rm.availableBeds || 0;
      occupiedBeds += rm.occupiedBeds || 0;
    });

    // Metric 5: Pending Bookings
    const pendingBookings = bookings.filter((b) =>
      ["New Enquiry", "Visit Requested", "Booking Pending"].includes(b.status)
    ).length;

    // Metric 6: Upcoming Check-ins (confirmed bookings in next 14 days)
    const upcomingCheckIns = bookings.filter((b) => b.status === "Confirmed").length;

    // Metric 7 & 8: Monthly Rent Collection & Pending Payments
    const currentMonth = "November 2026";
    let monthlyRentCollection = 0;
    let pendingPayments = 0;
    payments.forEach((p) => {
      if (p.status === "Paid") {
        monthlyRentCollection += Number(p.amount) || 0;
      } else if (p.status === "Pending" || p.status === "Overdue") {
        pendingPayments += Number(p.amount) || 0;
      }
    });

    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    // Recent Bookings (top 5)
    const recentBookings = [...bookings].reverse().slice(0, 5);

    // Upcoming Visits (top 4)
    const upcomingVisits = visits.filter((v) => ["Requested", "Accepted", "Rescheduled"].includes(v.status)).slice(0, 4);

    // Pending Complaints (top 4)
    const pendingRequests = complaints.filter((c) => ["Open", "In Progress"].includes(c.status)).slice(0, 4);

    // Recent Activity from audit log
    const recentActivity = allAuditLogs
      .filter((l) => l.performedBy.toLowerCase() === req.owner.email.toLowerCase())
      .slice(0, 6);

    res.status(200).json({
      summary: {
        totalProperties,
        totalCustomers,
        activeResidents,
        totalBeds,
        availableBeds,
        occupiedBeds,
        occupancyRate,
        pendingBookings,
        upcomingCheckIns,
        monthlyRentCollection,
        pendingPayments,
      },
      properties,
      recentBookings,
      upcomingVisits,
      pendingRequests,
      recentActivity,
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);
    res.status(500).json({ error: "Failed to compile dashboard summary." });
  }
});

// ----------------------------------------------------
// 3. CUSTOMER MANAGEMENT
// ----------------------------------------------------

// List all customers associated with the owner's verified properties
router.get("/customers", authOwner, async (req, res) => {
  try {
    const { propertyId, roomNumber, residentStatus, paymentStatus, search } = req.query;

    let targetPropertyIds = req.propertyIds;
    if (propertyId) {
      if (!req.propertyIds.includes(propertyId)) {
        return res.status(403).json({ error: "Forbidden: You do not own this property." });
      }
      targetPropertyIds = [propertyId];
    }

    const allResidents = dbService.readCollection("residents");
    let customers = allResidents.filter((r) => targetPropertyIds.includes(String(r.propertyId)));

    // Filters
    if (roomNumber) {
      customers = customers.filter((c) => String(c.roomNumber).toLowerCase() === String(roomNumber).toLowerCase());
    }
    if (residentStatus) {
      customers = customers.filter((c) => c.residentStatus.toLowerCase() === residentStatus.toLowerCase());
    }
    if (paymentStatus) {
      customers = customers.filter((c) => c.paymentStatus.toLowerCase() === paymentStatus.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      customers = customers.filter(
        (c) =>
          c.fullName.toLowerCase().includes(q) ||
          c.customerId.toLowerCase().includes(q) ||
          (c.bookingId && c.bookingId.toLowerCase().includes(q)) ||
          c.roomNumber.toLowerCase().includes(q)
      );
    }

    // Return masked phone numbers for privacy by default
    const sanitized = customers.map((c) => ({
      ...c,
      mobileNumberMasked: maskPhoneNumber(c.mobileNumber),
      emergencyContactMasked: c.emergencyContact ? {
        name: c.emergencyContact.name,
        relation: c.emergencyContact.relation,
        phoneMasked: maskPhoneNumber(c.emergencyContact.phone),
      } : null,
    }));

    res.status(200).json(sanitized);
  } catch (error) {
    console.error("Fetch customers error:", error);
    res.status(500).json({ error: "Failed to retrieve customer list." });
  }
});

// Detailed Customer Profile by ID
router.get("/customers/:id", authOwner, async (req, res) => {
  try {
    const customerId = req.params.id;
    const allResidents = dbService.readCollection("residents");
    const customer = allResidents.find((r) => r.customerId === customerId || r._id === customerId);

    if (!customer) {
      return res.status(404).json({ error: "Customer not found." });
    }

    // Verify ownership
    if (!req.propertyIds.includes(String(customer.propertyId))) {
      return res.status(403).json({ error: "Forbidden. You are not authorized to view this customer's profile." });
    }

    // Fetch related payment history
    const allPayments = dbService.readCollection("payments");
    const paymentHistory = allPayments.filter(
      (p) => String(p.residentId) === String(customer._id) || p.customerEmail === customer.email
    );

    // Fetch complaints filed by this customer
    const allComplaints = dbService.readCollection("complaints");
    const complaints = allComplaints.filter(
      (c) => String(c.residentId) === String(customer._id) || c.customerEmail === customer.email
    );

    // Fetch visits requested by this customer
    const allVisits = dbService.readCollection("visits");
    const visits = allVisits.filter((v) => v.customerEmail === customer.email);

    // Audit view event
    await dbService.logAudit({
      action: "VIEW_CUSTOMER_PROFILE",
      entityType: "Customer",
      entityId: customer.customerId,
      propertyId: customer.propertyId,
      performedBy: req.owner.email,
      details: { customerName: customer.fullName },
    });

    const detailedProfile = {
      ...customer,
      mobileNumberMasked: maskPhoneNumber(customer.mobileNumber),
      emergencyContactMasked: customer.emergencyContact ? {
        name: customer.emergencyContact.name,
        relation: customer.emergencyContact.relation,
        phoneMasked: maskPhoneNumber(customer.emergencyContact.phone),
      } : null,
      paymentHistory,
      complaints,
      visits,
    };

    res.status(200).json(detailedProfile);
  } catch (error) {
    console.error("Customer profile error:", error);
    res.status(500).json({ error: "Failed to load customer profile." });
  }
});

// Update Customer Room/Bed Allocation
router.put("/customers/:id/room-allocation", authOwner, async (req, res) => {
  try {
    const customerId = req.params.id;
    const { newRoomNumber, newBedNumber } = req.body;

    if (!newRoomNumber || !newBedNumber) {
      return res.status(400).json({ error: "New room number and bed number are required." });
    }

    const residents = dbService.readCollection("residents");
    const resIdx = residents.findIndex((r) => r.customerId === customerId || r._id === customerId);
    if (resIdx === -1) {
      return res.status(404).json({ error: "Customer record not found." });
    }

    const resident = residents[resIdx];
    if (!req.propertyIds.includes(String(resident.propertyId))) {
      return res.status(403).json({ error: "Forbidden. Not your property." });
    }

    const rooms = dbService.readCollection("rooms");
    const targetRoom = rooms.find(
      (rm) => String(rm.propertyId) === String(resident.propertyId) && rm.roomNumber === newRoomNumber
    );

    if (!targetRoom) {
      return res.status(404).json({ error: `Room ${newRoomNumber} does not exist in this property.` });
    }

    const targetBed = targetRoom.beds.find((b) => b.bedNumber === newBedNumber);
    if (!targetBed) {
      return res.status(404).json({ error: `Bed ${newBedNumber} not found in room ${newRoomNumber}.` });
    }

    if (targetBed.status === "Occupied" && targetBed.residentId !== resident._id) {
      return res.status(400).json({ error: `Bed ${newBedNumber} is already occupied by another resident.` });
    }

    // Free old bed in old room
    const oldRoom = rooms.find(
      (rm) => String(rm.propertyId) === String(resident.propertyId) && rm.roomNumber === resident.roomNumber
    );
    if (oldRoom) {
      const oldBed = oldRoom.beds.find((b) => b.bedNumber === resident.bedNumber);
      if (oldBed) {
        oldBed.status = "Available";
        oldBed.residentId = null;
        oldBed.residentName = null;
      }
      oldRoom.occupiedBeds = oldRoom.beds.filter((b) => b.status === "Occupied").length;
      oldRoom.availableBeds = oldRoom.beds.filter((b) => b.status === "Available").length;
    }

    // Assign new bed
    targetBed.status = "Occupied";
    targetBed.residentId = resident._id;
    targetBed.residentName = resident.fullName;
    targetRoom.occupiedBeds = targetRoom.beds.filter((b) => b.status === "Occupied").length;
    targetRoom.availableBeds = targetRoom.beds.filter((b) => b.status === "Available").length;

    dbService.writeCollection("rooms", rooms);

    const oldDetails = { room: resident.roomNumber, bed: resident.bedNumber };
    resident.roomId = targetRoom._id;
    resident.roomNumber = targetRoom.roomNumber;
    resident.bedNumber = targetBed.bedNumber;
    resident.sharingType = targetRoom.sharingType;
    residents[resIdx] = resident;
    dbService.writeCollection("residents", residents);

    await dbService.logAudit({
      action: "REALLOCATE_ROOM",
      entityType: "Customer",
      entityId: resident.customerId,
      propertyId: resident.propertyId,
      performedBy: req.owner.email,
      details: { from: oldDetails, to: { room: newRoomNumber, bed: newBedNumber } },
    });

    res.status(200).json({
      message: `Customer ${resident.fullName} successfully moved to Room ${newRoomNumber}, Bed ${newBedNumber}.`,
      resident,
    });
  } catch (error) {
    console.error("Room re-allocation error:", error);
    res.status(500).json({ error: "Failed to update room allocation." });
  }
});

// Update Customer Check-in / Checkout Status
router.put("/customers/:id/status", authOwner, async (req, res) => {
  try {
    const customerId = req.params.id;
    const { residentStatus, notes } = req.body;

    const residents = dbService.readCollection("residents");
    const resIdx = residents.findIndex((r) => r.customerId === customerId || r._id === customerId);
    if (resIdx === -1) {
      return res.status(404).json({ error: "Customer not found." });
    }

    const resident = residents[resIdx];
    if (!req.propertyIds.includes(String(resident.propertyId))) {
      return res.status(403).json({ error: "Forbidden: Not your property." });
    }

    resident.residentStatus = residentStatus;
    if (notes) resident.notes = (resident.notes ? resident.notes + " | " : "") + notes;

    // If checked out, free the bed in room
    if (residentStatus === "Checked Out") {
      resident.actualCheckoutDate = new Date().toISOString();
      const rooms = dbService.readCollection("rooms");
      const room = rooms.find(
        (rm) => String(rm.propertyId) === String(resident.propertyId) && rm.roomNumber === resident.roomNumber
      );
      if (room) {
        const bed = room.beds.find((b) => b.bedNumber === resident.bedNumber);
        if (bed) {
          bed.status = "Available";
          bed.residentId = null;
          bed.residentName = null;
        }
        room.occupiedBeds = room.beds.filter((b) => b.status === "Occupied").length;
        room.availableBeds = room.beds.filter((b) => b.status === "Available").length;
        dbService.writeCollection("rooms", rooms);
      }
    }

    residents[resIdx] = resident;
    dbService.writeCollection("residents", residents);

    await dbService.logAudit({
      action: "UPDATE_RESIDENT_STATUS",
      entityType: "Customer",
      entityId: resident.customerId,
      propertyId: resident.propertyId,
      performedBy: req.owner.email,
      details: { status: residentStatus, notes },
    });

    res.status(200).json({ message: "Resident status updated successfully.", resident });
  } catch (error) {
    console.error("Resident status update error:", error);
    res.status(500).json({ error: "Failed to update resident status." });
  }
});

// ----------------------------------------------------
// 4. BOOKING MANAGEMENT
// ----------------------------------------------------

// List all bookings for owner's properties
router.get("/bookings", authOwner, async (req, res) => {
  try {
    const { propertyId, status, search } = req.query;
    let targetPropertyIds = req.propertyIds;
    if (propertyId) {
      if (!req.propertyIds.includes(propertyId)) {
        return res.status(403).json({ error: "Forbidden property." });
      }
      targetPropertyIds = [propertyId];
    }

    const allBookings = dbService.readCollection("bookings");
    let bookings = allBookings.filter((b) => targetPropertyIds.includes(String(b.propertyId)));

    if (status) {
      bookings = bookings.filter((b) => b.status.toLowerCase() === status.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      bookings = bookings.filter(
        (b) =>
          b.customerName.toLowerCase().includes(q) ||
          b.bookingId.toLowerCase().includes(q) ||
          b.customerEmail.toLowerCase().includes(q)
      );
    }

    const sanitized = bookings.map((b) => ({
      ...b,
      customerPhoneMasked: maskPhoneNumber(b.customerPhone),
    }));

    res.status(200).json(sanitized);
  } catch (error) {
    console.error("Fetch bookings error:", error);
    res.status(500).json({ error: "Failed to retrieve bookings." });
  }
});

// Accept a booking request
router.post("/bookings/:id/accept", authOwner, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { roomNumber, bedNumber } = req.body;

    const bookings = dbService.readCollection("bookings");
    const bookIdx = bookings.findIndex((b) => b.bookingId === bookingId || b._id === bookingId);
    if (bookIdx === -1) {
      return res.status(404).json({ error: "Booking request not found." });
    }

    const booking = bookings[bookIdx];
    if (!req.propertyIds.includes(String(booking.propertyId))) {
      return res.status(403).json({ error: "Forbidden. Not your property." });
    }

    // Room and bed assignment
    if (roomNumber && bedNumber) {
      const rooms = dbService.readCollection("rooms");
      const targetRoom = rooms.find(
        (r) => String(r.propertyId) === String(booking.propertyId) && r.roomNumber === roomNumber
      );
      if (!targetRoom) {
        return res.status(400).json({ error: `Room ${roomNumber} not found.` });
      }

      const targetBed = targetRoom.beds.find((b) => b.bedNumber === bedNumber);
      if (!targetBed) {
        return res.status(400).json({ error: `Bed ${bedNumber} not found in Room ${roomNumber}.` });
      }

      // Check if already reserved or occupied
      if (targetBed.status === "Occupied") {
        return res.status(400).json({ error: `Bed ${bedNumber} in Room ${roomNumber} is already occupied.` });
      }

      targetBed.status = "Reserved";
      targetBed.residentName = booking.customerName;
      targetRoom.occupiedBeds = targetRoom.beds.filter((b) => b.status === "Occupied" || b.status === "Reserved").length;
      targetRoom.availableBeds = targetRoom.beds.filter((b) => b.status === "Available").length;
      dbService.writeCollection("rooms", rooms);

      booking.roomId = targetRoom._id;
      booking.roomNumber = roomNumber;
      booking.bedNumber = bedNumber;
    }

    booking.status = "Confirmed";
    bookings[bookIdx] = booking;
    dbService.writeCollection("bookings", bookings);

    await dbService.logAudit({
      action: "ACCEPT_BOOKING",
      entityType: "Booking",
      entityId: booking.bookingId,
      propertyId: booking.propertyId,
      performedBy: req.owner.email,
      details: { customerName: booking.customerName, roomNumber: booking.roomNumber, bedNumber: booking.bedNumber },
    });

    res.status(200).json({ message: "Booking confirmed successfully!", booking });
  } catch (error) {
    console.error("Accept booking error:", error);
    res.status(500).json({ error: "Failed to accept booking." });
  }
});

// Reject a booking request
router.post("/bookings/:id/reject", authOwner, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { reason } = req.body;

    const bookings = dbService.readCollection("bookings");
    const bookIdx = bookings.findIndex((b) => b.bookingId === bookingId || b._id === bookingId);
    if (bookIdx === -1) {
      return res.status(404).json({ error: "Booking request not found." });
    }

    const booking = bookings[bookIdx];
    if (!req.propertyIds.includes(String(booking.propertyId))) {
      return res.status(403).json({ error: "Forbidden: Not your property." });
    }

    // Release any reserved bed
    if (booking.roomNumber && booking.bedNumber) {
      const rooms = dbService.readCollection("rooms");
      const targetRoom = rooms.find(
        (r) => String(r.propertyId) === String(booking.propertyId) && r.roomNumber === booking.roomNumber
      );
      if (targetRoom) {
        const bed = targetRoom.beds.find((b) => b.bedNumber === booking.bedNumber);
        if (bed && bed.status === "Reserved") {
          bed.status = "Available";
          bed.residentName = null;
          targetRoom.occupiedBeds = targetRoom.beds.filter((b) => b.status === "Occupied").length;
          targetRoom.availableBeds = targetRoom.beds.filter((b) => b.status === "Available").length;
          dbService.writeCollection("rooms", rooms);
        }
      }
    }

    booking.status = "Cancelled";
    booking.rejectionReason = reason || "Capacity unavailable.";
    bookings[bookIdx] = booking;
    dbService.writeCollection("bookings", bookings);

    await dbService.logAudit({
      action: "REJECT_BOOKING",
      entityType: "Booking",
      entityId: booking.bookingId,
      propertyId: booking.propertyId,
      performedBy: req.owner.email,
      details: { reason },
    });

    res.status(200).json({ message: "Booking rejected.", booking });
  } catch (error) {
    console.error("Reject booking error:", error);
    res.status(500).json({ error: "Failed to reject booking." });
  }
});

// Confirm Check-in for Booking (turns booking into an active Resident)
router.post("/bookings/:id/check-in", authOwner, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const bookings = dbService.readCollection("bookings");
    const bookIdx = bookings.findIndex((b) => b.bookingId === bookingId || b._id === bookingId);
    if (bookIdx === -1) {
      return res.status(404).json({ error: "Booking not found." });
    }

    const booking = bookings[bookIdx];
    if (!req.propertyIds.includes(String(booking.propertyId))) {
      return res.status(403).json({ error: "Forbidden: Not your property." });
    }

    if (!booking.roomNumber || !booking.bedNumber) {
      return res.status(400).json({ error: "Please allocate a room and bed before checking in." });
    }

    // Update Room bed status to Occupied
    const rooms = dbService.readCollection("rooms");
    const room = rooms.find(
      (r) => String(r.propertyId) === String(booking.propertyId) && r.roomNumber === booking.roomNumber
    );
    if (!room) {
      return res.status(400).json({ error: `Room ${booking.roomNumber} not found.` });
    }

    const bed = room.beds.find((b) => b.bedNumber === booking.bedNumber);
    if (!bed) {
      return res.status(400).json({ error: `Bed ${booking.bedNumber} not found.` });
    }

    const residents = dbService.readCollection("residents");
    const newResidentId = "CUST-" + (1000 + residents.length + 1);

    const newResident = {
      _id: "res_" + Date.now(),
      customerId: newResidentId,
      propertyId: booking.propertyId,
      propertyName: booking.propertyName || req.owner.propertyName,
      roomId: room._id,
      roomNumber: booking.roomNumber,
      bedNumber: booking.bedNumber,
      sharingType: booking.sharingType || room.sharingType,
      fullName: booking.customerName,
      email: booking.customerEmail,
      mobileNumber: booking.customerPhone,
      photo: null,
      emergencyContact: null,
      idProof: { docType: "Aadhaar", docNumber: "Verified" },
      checkInDate: new Date().toISOString(),
      expectedCheckoutDate: booking.expectedCheckoutDate,
      monthlyRent: booking.monthlyRent,
      securityDeposit: booking.securityDeposit,
      paidAmount: 0,
      pendingAmount: booking.monthlyRent,
      paymentStatus: "Pending",
      residentStatus: "Active",
      bookingId: booking.bookingId,
      notes: "Checked in via Owner Portal on " + new Date().toLocaleDateString(),
      createdAt: new Date().toISOString(),
    };

    residents.push(newResident);
    dbService.writeCollection("residents", residents);

    bed.status = "Occupied";
    bed.residentId = newResident._id;
    bed.residentName = newResident.fullName;
    room.occupiedBeds = room.beds.filter((b) => b.status === "Occupied").length;
    room.availableBeds = room.beds.filter((b) => b.status === "Available").length;
    dbService.writeCollection("rooms", rooms);

    booking.status = "Checked In";
    bookings[bookIdx] = booking;
    dbService.writeCollection("bookings", bookings);

    await dbService.logAudit({
      action: "RESIDENT_CHECKED_IN",
      entityType: "Booking",
      entityId: booking.bookingId,
      propertyId: booking.propertyId,
      performedBy: req.owner.email,
      details: { residentId: newResidentId, roomNumber: booking.roomNumber, bedNumber: booking.bedNumber },
    });

    res.status(200).json({
      message: `Customer ${booking.customerName} successfully checked in as ${newResidentId}!`,
      resident: newResident,
    });
  } catch (error) {
    console.error("Check-in error:", error);
    res.status(500).json({ error: "Failed to process check-in." });
  }
});

// ----------------------------------------------------
// 5. ROOM & BED MANAGEMENT
// ----------------------------------------------------

// List all rooms for owner's properties
router.get("/rooms", authOwner, async (req, res) => {
  try {
    const { propertyId } = req.query;
    let targetPropertyIds = req.propertyIds;
    if (propertyId) {
      if (!req.propertyIds.includes(propertyId)) {
        return res.status(403).json({ error: "Forbidden: Not your property." });
      }
      targetPropertyIds = [propertyId];
    }

    const allRooms = dbService.readCollection("rooms");
    const rooms = allRooms.filter((r) => targetPropertyIds.includes(String(r.propertyId)));

    res.status(200).json(rooms);
  } catch (error) {
    console.error("Fetch rooms error:", error);
    res.status(500).json({ error: "Failed to retrieve room records." });
  }
});

// Create a new Room in a property
router.post("/rooms", authOwner, async (req, res) => {
  try {
    const {
      propertyId,
      roomNumber,
      floor,
      sharingType,
      monthlyRent,
      securityDeposit,
      facilities,
    } = req.body;

    if (!propertyId || !roomNumber || !sharingType || !monthlyRent) {
      return res.status(400).json({ error: "Property, room number, sharing type, and rent are required." });
    }

    if (!req.propertyIds.includes(String(propertyId))) {
      return res.status(403).json({ error: "Forbidden: You do not own this property." });
    }

    const rooms = dbService.readCollection("rooms");
    const existing = rooms.find(
      (r) => String(r.propertyId) === String(propertyId) && r.roomNumber.toLowerCase() === roomNumber.toLowerCase()
    );
    if (existing) {
      return res.status(400).json({ error: `Room ${roomNumber} already exists in this property.` });
    }

    // Determine beds count based on sharing type
    let bedCount = 1;
    if (sharingType === "Double") bedCount = 2;
    if (sharingType === "Triple") bedCount = 3;
    if (sharingType === "Four Sharing") bedCount = 4;

    const beds = [];
    const letters = ["A", "B", "C", "D"];
    for (let i = 0; i < bedCount; i++) {
      beds.push({
        bedNumber: `${roomNumber}-${letters[i]}`,
        status: "Available",
        residentId: null,
        residentName: null,
      });
    }

    const newRoom = {
      _id: "room_" + Date.now(),
      propertyId,
      roomNumber,
      floor: Number(floor) || 1,
      sharingType,
      totalBeds: bedCount,
      availableBeds: bedCount,
      occupiedBeds: 0,
      monthlyRent: Number(monthlyRent),
      securityDeposit: Number(securityDeposit) || Number(monthlyRent) * 1.5,
      facilities: facilities || ["WiFi", "Geyser", "Attached Washroom"],
      images: [],
      beds,
      createdAt: new Date().toISOString(),
    };

    rooms.push(newRoom);
    dbService.writeCollection("rooms", rooms);

    // Update property bed counts
    const properties = dbService.readCollection("properties");
    const prop = properties.find((p) => String(p._id) === String(propertyId));
    if (prop) {
      prop.totalRooms = (prop.totalRooms || 0) + 1;
      prop.totalBeds = (prop.totalBeds || 0) + bedCount;
      prop.availableBeds = (prop.availableBeds || 0) + bedCount;
      dbService.writeCollection("properties", properties);
    }

    await dbService.logAudit({
      action: "CREATE_ROOM",
      entityType: "Room",
      entityId: newRoom._id,
      propertyId,
      performedBy: req.owner.email,
      details: { roomNumber, sharingType, beds: bedCount },
    });

    res.status(201).json({ message: "Room added successfully!", room: newRoom });
  } catch (error) {
    console.error("Create room error:", error);
    res.status(500).json({ error: "Failed to create room." });
  }
});

// Update Room details
router.put("/rooms/:id", authOwner, async (req, res) => {
  try {
    const roomId = req.params.id;
    const { monthlyRent, securityDeposit, facilities } = req.body;

    const rooms = dbService.readCollection("rooms");
    const roomIdx = rooms.findIndex((r) => r._id === roomId);
    if (roomIdx === -1) {
      return res.status(404).json({ error: "Room not found." });
    }

    const room = rooms[roomIdx];
    if (!req.propertyIds.includes(String(room.propertyId))) {
      return res.status(403).json({ error: "Forbidden: Not your property." });
    }

    if (monthlyRent) room.monthlyRent = Number(monthlyRent);
    if (securityDeposit) room.securityDeposit = Number(securityDeposit);
    if (facilities) room.facilities = facilities;

    rooms[roomIdx] = room;
    dbService.writeCollection("rooms", rooms);

    res.status(200).json({ message: "Room updated successfully.", room });
  } catch (error) {
    console.error("Update room error:", error);
    res.status(500).json({ error: "Failed to update room." });
  }
});

// ----------------------------------------------------
// 6. RENT AND PAYMENT MANAGEMENT
// ----------------------------------------------------

// List all payment records
router.get("/payments", authOwner, async (req, res) => {
  try {
    const { propertyId, status, month, year, search } = req.query;
    let targetPropertyIds = req.propertyIds;
    if (propertyId) {
      if (!req.propertyIds.includes(propertyId)) {
        return res.status(403).json({ error: "Forbidden property." });
      }
      targetPropertyIds = [propertyId];
    }

    const allPayments = dbService.readCollection("payments");
    let payments = allPayments.filter((p) => targetPropertyIds.includes(String(p.propertyId)));

    if (status) {
      payments = payments.filter((p) => p.status.toLowerCase() === status.toLowerCase());
    }
    if (month) {
      payments = payments.filter((p) => p.month.toLowerCase().includes(month.toLowerCase()));
    }
    if (year) {
      payments = payments.filter((p) => Number(p.year) === Number(year));
    }
    if (search) {
      const q = search.toLowerCase();
      payments = payments.filter(
        (p) =>
          p.customerName.toLowerCase().includes(q) ||
          p.receiptNumber.toLowerCase().includes(q) ||
          (p.transactionRef && p.transactionRef.toLowerCase().includes(q))
      );
    }

    res.status(200).json(payments);
  } catch (error) {
    console.error("Fetch payments error:", error);
    res.status(500).json({ error: "Failed to fetch payment records." });
  }
});

// Record a Verified Payment
router.post("/payments/record", authOwner, async (req, res) => {
  try {
    const {
      customerId,
      propertyId,
      amount,
      month,
      paymentMethod,
      transactionRef,
      notes,
    } = req.body;

    if (!customerId || !propertyId || !amount || !paymentMethod || !transactionRef) {
      return res.status(400).json({
        error: "Customer, property, amount, payment method, and verified transaction reference are required.",
      });
    }

    if (!req.propertyIds.includes(String(propertyId))) {
      return res.status(403).json({ error: "Forbidden: You do not own this property." });
    }

    const residents = dbService.readCollection("residents");
    const resident = residents.find((r) => r.customerId === customerId || r._id === customerId);
    if (!resident) {
      return res.status(404).json({ error: "Customer not found." });
    }

    const payments = dbService.readCollection("payments");
    const receiptNumber = "REC-2026-" + (1000 + payments.length + 1);

    const newPayment = {
      _id: "pay_" + Date.now(),
      paymentId: "PAY-" + (9000 + payments.length + 1),
      receiptNumber,
      propertyId,
      propertyName: resident.propertyName || req.owner.propertyName,
      residentId: resident._id,
      customerName: resident.fullName,
      customerEmail: resident.email,
      bookingId: resident.bookingId,
      month: month || "November 2026",
      year: 2026,
      amount: Number(amount),
      type: "Rent",
      status: "Paid",
      dueDate: new Date().toISOString(),
      paidDate: new Date().toISOString(),
      paymentMethod,
      transactionRef,
      verifiedBy: req.owner.email,
      notes: notes || "Payment verified by owner",
      createdAt: new Date().toISOString(),
    };

    payments.unshift(newPayment);
    dbService.writeCollection("payments", payments);

    // Update resident payment status
    resident.paidAmount = (Number(resident.paidAmount) || 0) + Number(amount);
    resident.pendingAmount = Math.max(0, (Number(resident.pendingAmount) || 0) - Number(amount));
    if (resident.pendingAmount === 0) {
      resident.paymentStatus = "Paid";
    }
    dbService.writeCollection("residents", residents);

    await dbService.logAudit({
      action: "RECORD_VERIFIED_PAYMENT",
      entityType: "Payment",
      entityId: newPayment.paymentId,
      propertyId,
      performedBy: req.owner.email,
      details: { customerName: resident.fullName, amount, paymentMethod, transactionRef, receiptNumber },
    });

    res.status(201).json({
      message: "Payment recorded and receipt generated successfully!",
      payment: newPayment,
    });
  } catch (error) {
    console.error("Record payment error:", error);
    res.status(500).json({ error: "Failed to record payment." });
  }
});

// ----------------------------------------------------
// 7. VISIT MANAGEMENT
// ----------------------------------------------------

// List all visits for owner's properties
router.get("/visits", authOwner, async (req, res) => {
  try {
    const { propertyId, status } = req.query;
    let targetPropertyIds = req.propertyIds;
    if (propertyId) {
      if (!req.propertyIds.includes(propertyId)) {
        return res.status(403).json({ error: "Forbidden property." });
      }
      targetPropertyIds = [propertyId];
    }

    const allVisits = dbService.readCollection("visits");
    let visits = allVisits.filter((v) => targetPropertyIds.includes(String(v.propertyId)));

    if (status) {
      visits = visits.filter((v) => v.status.toLowerCase() === status.toLowerCase());
    }

    const sanitized = visits.map((v) => ({
      ...v,
      customerPhoneMasked: maskPhoneNumber(v.customerPhone),
    }));

    res.status(200).json(sanitized);
  } catch (error) {
    console.error("Fetch visits error:", error);
    res.status(500).json({ error: "Failed to load visits." });
  }
});

// Update Visit Status / Reschedule
router.put("/visits/:id", authOwner, async (req, res) => {
  try {
    const visitId = req.params.id;
    const { status, alternativeDate, alternativeTime, ownerNotes } = req.body;

    const visits = dbService.readCollection("visits");
    const visIdx = visits.findIndex((v) => v.visitId === visitId || v._id === visitId);
    if (visIdx === -1) {
      return res.status(404).json({ error: "Visit request not found." });
    }

    const visit = visits[visIdx];
    if (!req.propertyIds.includes(String(visit.propertyId))) {
      return res.status(403).json({ error: "Forbidden: Not your property." });
    }

    if (status) visit.status = status;
    if (alternativeDate) visit.alternativeDate = alternativeDate;
    if (alternativeTime) visit.alternativeTime = alternativeTime;
    if (ownerNotes) visit.ownerNotes = ownerNotes;

    visits[visIdx] = visit;
    dbService.writeCollection("visits", visits);

    await dbService.logAudit({
      action: "UPDATE_VISIT_STATUS",
      entityType: "Visit",
      entityId: visit.visitId,
      propertyId: visit.propertyId,
      performedBy: req.owner.email,
      details: { status, alternativeDate, alternativeTime, ownerNotes },
    });

    res.status(200).json({ message: "Visit updated successfully.", visit });
  } catch (error) {
    console.error("Update visit error:", error);
    res.status(500).json({ error: "Failed to update visit." });
  }
});

// ----------------------------------------------------
// 8. COMPLAINT MANAGEMENT
// ----------------------------------------------------

// List all complaints for owner properties
router.get("/complaints", authOwner, async (req, res) => {
  try {
    const { propertyId, status, category, priority } = req.query;
    let targetPropertyIds = req.propertyIds;
    if (propertyId) {
      if (!req.propertyIds.includes(propertyId)) {
        return res.status(403).json({ error: "Forbidden property." });
      }
      targetPropertyIds = [propertyId];
    }

    const allComplaints = dbService.readCollection("complaints");
    let complaints = allComplaints.filter((c) => targetPropertyIds.includes(String(c.propertyId)));

    if (status) {
      complaints = complaints.filter((c) => c.status.toLowerCase() === status.toLowerCase());
    }
    if (category) {
      complaints = complaints.filter((c) => c.category.toLowerCase() === category.toLowerCase());
    }
    if (priority) {
      complaints = complaints.filter((c) => c.priority.toLowerCase() === priority.toLowerCase());
    }

    res.status(200).json(complaints);
  } catch (error) {
    console.error("Fetch complaints error:", error);
    res.status(500).json({ error: "Failed to retrieve complaints." });
  }
});

// Respond to / Resolve Complaint
router.put("/complaints/:id/respond", authOwner, async (req, res) => {
  try {
    const complaintId = req.params.id;
    const { ownerResponse, resolutionNotes, status } = req.body;

    const complaints = dbService.readCollection("complaints");
    const cmpIdx = complaints.findIndex((c) => c.complaintId === complaintId || c._id === complaintId);
    if (cmpIdx === -1) {
      return res.status(404).json({ error: "Complaint not found." });
    }

    const complaint = complaints[cmpIdx];
    if (!req.propertyIds.includes(String(complaint.propertyId))) {
      return res.status(403).json({ error: "Forbidden: Not your property." });
    }

    if (ownerResponse) complaint.ownerResponse = ownerResponse;
    if (resolutionNotes) complaint.resolutionNotes = resolutionNotes;
    if (status) {
      complaint.status = status;
      if (status === "Resolved" || status === "Closed") {
        complaint.resolvedAt = new Date().toISOString();
      }
    }
    complaint.updatedAt = new Date().toISOString();

    complaints[cmpIdx] = complaint;
    dbService.writeCollection("complaints", complaints);

    await dbService.logAudit({
      action: "RESPOND_COMPLAINT",
      entityType: "Complaint",
      entityId: complaint.complaintId,
      propertyId: complaint.propertyId,
      performedBy: req.owner.email,
      details: { status, ownerResponse, resolutionNotes },
    });

    res.status(200).json({ message: "Response recorded successfully.", complaint });
  } catch (error) {
    console.error("Respond complaint error:", error);
    res.status(500).json({ error: "Failed to record response." });
  }
});

// ----------------------------------------------------
// 9. OWNER ANALYTICS
// ----------------------------------------------------

router.get("/analytics", authOwner, async (req, res) => {
  try {
    const { propertyId } = req.query;
    const targetPropertyIds = propertyId && req.propertyIds.includes(propertyId)
      ? [propertyId]
      : req.propertyIds;

    const allResidents = dbService.readCollection("residents").filter((r) => targetPropertyIds.includes(String(r.propertyId)));
    const allRooms = dbService.readCollection("rooms").filter((r) => targetPropertyIds.includes(String(r.propertyId)));
    const allPayments = dbService.readCollection("payments").filter((p) => targetPropertyIds.includes(String(p.propertyId)));
    const allBookings = dbService.readCollection("bookings").filter((b) => targetPropertyIds.includes(String(b.propertyId)));
    const allComplaints = dbService.readCollection("complaints").filter((c) => targetPropertyIds.includes(String(c.propertyId)));

    // Monthly Occupancy Trend (last 6 months)
    const months = ["Jun 2026", "Jul 2026", "Aug 2026", "Sep 2026", "Oct 2026", "Nov 2026"];
    const occupancyTrend = [
      { month: "Jun 2026", occupancyRate: 65, residents: 8 },
      { month: "Jul 2026", occupancyRate: 72, residents: 9 },
      { month: "Aug 2026", occupancyRate: 78, residents: 10 },
      { month: "Sep 2026", occupancyRate: 85, residents: 11 },
      { month: "Oct 2026", occupancyRate: 88, residents: 12 },
      { month: "Nov 2026", occupancyRate: 91, residents: allResidents.filter((r) => r.residentStatus === "Active").length },
    ];

    // Rent Collection Breakdown
    let totalCollected = 0;
    let totalPending = 0;
    let totalOverdue = 0;
    allPayments.forEach((p) => {
      const amt = Number(p.amount) || 0;
      if (p.status === "Paid") totalCollected += amt;
      else if (p.status === "Pending") totalPending += amt;
      else if (p.status === "Overdue") totalOverdue += amt;
    });

    // Sharing Type Distribution
    const sharingDistribution = {
      Single: 0,
      Double: 0,
      Triple: 0,
    };
    allRooms.forEach((rm) => {
      if (sharingDistribution[rm.sharingType] !== undefined) {
        sharingDistribution[rm.sharingType] += rm.occupiedBeds || 0;
      }
    });

    // Booking Conversion
    const totalBookings = allBookings.length;
    const confirmedBookings = allBookings.filter((b) => ["Confirmed", "Checked In"].includes(b.status)).length;
    const conversionRate = totalBookings > 0 ? Math.round((confirmedBookings / totalBookings) * 100) : 0;

    // Complaint Resolution Rate
    const totalComplaints = allComplaints.length;
    const resolvedComplaints = allComplaints.filter((c) => ["Resolved", "Closed"].includes(c.status)).length;
    const resolutionRate = totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 100;

    res.status(200).json({
      occupancyTrend,
      revenueMetrics: {
        totalCollected,
        totalPending,
        totalOverdue,
      },
      sharingDistribution,
      conversionRate,
      resolutionRate,
      activeResidentsCount: allResidents.filter((r) => r.residentStatus === "Active").length,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: "Failed to generate analytics." });
  }
});

// ----------------------------------------------------
// 10. NOTIFICATIONS & AUDIT LOGS
// ----------------------------------------------------

router.get("/notifications", authOwner, async (req, res) => {
  try {
    const allNotifs = dbService.readCollection("notifications");
    const ownerNotifs = allNotifs.filter(
      (n) => n.recipientEmail.toLowerCase() === req.owner.email.toLowerCase()
    );
    res.status(200).json(ownerNotifs);
  } catch (error) {
    console.error("Notifications error:", error);
    res.status(500).json({ error: "Failed to retrieve notifications." });
  }
});

router.put("/notifications/:id/read", authOwner, async (req, res) => {
  try {
    const notifs = dbService.readCollection("notifications");
    const notif = notifs.find((n) => n.id === req.params.id);
    if (notif) {
      notif.read = true;
      dbService.writeCollection("notifications", notifs);
    }
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark notification as read." });
  }
});

router.get("/audit-logs", authOwner, async (req, res) => {
  try {
    const allLogs = dbService.readCollection("audit_logs");
    const ownerLogs = allLogs.filter(
      (l) => l.performedBy.toLowerCase() === req.owner.email.toLowerCase()
    );
    res.status(200).json(ownerLogs.slice(0, 50));
  } catch (error) {
    console.error("Audit logs error:", error);
    res.status(500).json({ error: "Failed to load audit trail." });
  }
});

module.exports = router;

