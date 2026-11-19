import React, { useState, useEffect } from "react";
import { ownerApi } from "./ownerApi";
import "./OwnerTheme.css";
import {
  FiX,
  FiUser,
  FiPhone,
  FiMail,
  FiHome,
  FiCalendar,
  FiCreditCard,
  FiAlertCircle,
  FiMessageSquare,
  FiShield,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiArrowRight,
} from "react-icons/fi";

function CustomerProfileModal({ customerId, onClose, onRefresh }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("personal"); // 'personal' | 'accommodation' | 'payments' | 'activity' | 'actions'
  const [showUnmaskPhone, setShowUnmaskPhone] = useState(false);
  const [unmaskReason, setUnmaskReason] = useState("");
  const [isUnmasked, setIsUnmasked] = useState(false);

  // Re-allocation form state
  const [availableRooms, setAvailableRooms] = useState([]);
  const [reallocateRoom, setReallocateRoom] = useState("");
  const [reallocateBed, setReallocateBed] = useState("");

  // Record payment form state
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [paymentTxnRef, setPaymentTxnRef] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  // Action status message
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    loadCustomer();
  }, [customerId]);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      const res = await ownerApi.getCustomerProfile(customerId);
      setCustomer(res.data);
      setPaymentAmount(res.data.pendingAmount > 0 ? res.data.pendingAmount : res.data.monthlyRent);

      // Also load rooms for this property to facilitate reallocation
      if (res.data.propertyId) {
        const roomsRes = await ownerApi.getRooms(res.data.propertyId);
        setAvailableRooms(roomsRes.data || []);
      }
    } catch (err) {
      console.error("Load customer error:", err);
      setActionError("Failed to fetch customer profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnmaskSubmit = (e) => {
    e.preventDefault();
    if (!unmaskReason.trim()) {
      alert("Please provide a legitimate administrative reason to view unmasked contact details.");
      return;
    }
    setIsUnmasked(true);
    setShowUnmaskPhone(false);
  };

  const handleReallocateSubmit = async (e) => {
    e.preventDefault();
    setActionError("");
    setActionMessage("");

    if (!reallocateRoom || !reallocateBed) {
      return setActionError("Please select both a room and a bed.");
    }

    try {
      await ownerApi.updateRoomAllocation(customer.customerId, {
        newRoomNumber: reallocateRoom,
        newBedNumber: reallocateBed,
      });
      setActionMessage(`Room updated! Customer moved to Room ${reallocateRoom}, Bed ${reallocateBed}.`);
      loadCustomer();
      if (onRefresh) onRefresh();
    } catch (err) {
      setActionError(err.response?.data?.error || "Failed to update room allocation.");
    }
  };

  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    setActionError("");
    setActionMessage("");

    if (!paymentAmount || !paymentTxnRef) {
      return setActionError("Amount and verified transaction reference are required.");
    }

    try {
      const res = await ownerApi.recordPayment({
        customerId: customer.customerId,
        propertyId: customer.propertyId,
        amount: Number(paymentAmount),
        month: "November 2026",
        paymentMethod,
        transactionRef: paymentTxnRef,
        notes: paymentNotes || "Verified by PG Owner",
      });
      setActionMessage(`Payment recorded! Generated Receipt #${res.data.payment.receiptNumber}.`);
      setPaymentTxnRef("");
      setPaymentNotes("");
      loadCustomer();
      if (onRefresh) onRefresh();
    } catch (err) {
      setActionError(err.response?.data?.error || "Failed to record payment.");
    }
  };

  const handleStatusChange = async (newStatus) => {
    setActionError("");
    setActionMessage("");

    try {
      await ownerApi.updateCustomerStatus(customer.customerId, {
        residentStatus: newStatus,
        notes: `Status changed to ${newStatus} by owner`,
      });
      setActionMessage(`Customer status changed to ${newStatus}.`);
      loadCustomer();
      if (onRefresh) onRefresh();
    } catch (err) {
      setActionError(err.response?.data?.error || "Failed to update status.");
    }
  };

  if (!customer && loading) {
    return (
      <div className="owner-modal-overlay">
        <div className="owner-modal-container" style={{ padding: "40px", textAlign: "center" }}>
          <p style={{ color: "var(--vasati-rich)", fontWeight: "600" }}>Loading customer profile...</p>
        </div>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="owner-modal-overlay" onClick={onClose}>
      <div className="owner-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "800px" }}>
        {/* Header */}
        <div className="owner-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <img
              src={customer.photo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"}
              alt={customer.fullName}
              style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--vasati-lavender-border)" }}
            />
            <div>
              <h3 style={{ margin: 0, fontSize: "1.25rem" }}>{customer.fullName}</h3>
              <div style={{ fontSize: "0.8rem", color: "var(--vasati-text-secondary)", marginTop: "2px" }}>
                <span>ID: <strong>{customer.customerId}</strong></span> •{" "}
                <span>Booking: <strong>{customer.bookingId || "Direct"}</strong></span> •{" "}
                <span className={`badge-status badge-${customer.residentStatus.toLowerCase().replace(" ", "-")}`}>
                  {customer.residentStatus}
                </span>
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="owner-modal-close-btn">
            <FiX />
          </button>
        </div>

        {/* Modal Body */}
        <div className="owner-modal-body">
          {/* Action Messages */}
          {actionMessage && (
            <div style={{ backgroundColor: "#ECFDF5", color: "#065F46", padding: "10px 14px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "16px", border: "1px solid #A7F3D0" }}>
              ✔ {actionMessage}
            </div>
          )}
          {actionError && (
            <div style={{ backgroundColor: "#FEF2F2", color: "#991B1B", padding: "10px 14px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "16px", border: "1px solid #FECACA" }}>
              ✖ {actionError}
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="owner-modal-tabs">
            {[
              { id: "personal", label: "1. Personal Info" },
              { id: "accommodation", label: "2. Accommodation" },
              { id: "payments", label: "3. Payment Ledger" },
              { id: "activity", label: "4. Customer Activity" },
              { id: "actions", label: "5. Owner Actions" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`owner-modal-tab-btn ${activeTab === tab.id ? "active" : ""}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: PERSONAL INFORMATION */}
          {activeTab === "personal" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <div className="owner-card-lavender">
                  <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--vasati-text-muted)", textTransform: "uppercase" }}>
                    Verified Contact
                  </span>
                  <div style={{ marginTop: "6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: "600", fontSize: "0.95rem" }}>
                      {isUnmasked ? customer.mobileNumber : customer.mobileNumberMasked}
                    </span>
                    {!isUnmasked && (
                      <button
                        type="button"
                        onClick={() => setShowUnmaskPhone(true)}
                        className="btn-vasati-secondary"
                        style={{ padding: "4px 8px", fontSize: "0.72rem" }}
                      >
                        <FiShield /> Unmask
                      </button>
                    )}
                  </div>
                </div>

                <div className="owner-card-lavender">
                  <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--vasati-text-muted)", textTransform: "uppercase" }}>
                    Email Address
                  </span>
                  <div style={{ marginTop: "6px", fontWeight: "600", fontSize: "0.95rem" }}>
                    {customer.email || "Not Provided"}
                  </div>
                </div>

                <div className="owner-card-lavender">
                  <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--vasati-text-muted)", textTransform: "uppercase" }}>
                    Identity Proof
                  </span>
                  <div style={{ marginTop: "6px", fontWeight: "600", fontSize: "0.95rem" }}>
                    {customer.idProof?.docType}: {customer.idProof?.docNumber || "Verified at Check-in"}
                  </div>
                </div>

                <div className="owner-card-lavender">
                  <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--vasati-text-muted)", textTransform: "uppercase" }}>
                    Emergency Contact
                  </span>
                  <div style={{ marginTop: "6px", fontSize: "0.9rem" }}>
                    {customer.emergencyContact ? (
                      <>
                        <strong>{customer.emergencyContact.name}</strong> ({customer.emergencyContact.relation})
                        <br />
                        <span style={{ color: "var(--vasati-text-secondary)" }}>
                          {isUnmasked ? customer.emergencyContact.phone : customer.emergencyContactMasked?.phoneMasked}
                        </span>
                      </>
                    ) : (
                      <span style={{ color: "var(--vasati-text-muted)" }}>Voluntarily withheld</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Unmask audit reason dialog */}
              {showUnmaskPhone && (
                <div style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A", padding: "16px", borderRadius: "10px", marginBottom: "16px" }}>
                  <div style={{ fontWeight: "700", color: "#92400E", marginBottom: "6px" }}>
                    Security Notice: Phone Number Audit Logging
                  </div>
                  <p style={{ fontSize: "0.82rem", color: "#78350F", margin: "0 0 10px 0" }}>
                    In accordance with Section 14 Privacy Requirements, accessing raw phone numbers is strictly logged in the permanent audit trail.
                  </p>
                  <input
                    type="text"
                    placeholder="Enter reason (e.g. Police verification, emergency medical call)"
                    value={unmaskReason}
                    onChange={(e) => setUnmaskReason(e.target.value)}
                    className="owner-search-input"
                    style={{ marginBottom: "10px" }}
                  />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button type="button" onClick={handleUnmaskSubmit} className="btn-vasati-orange" style={{ padding: "6px 14px", fontSize: "0.82rem" }}>
                      Confirm & Unmask
                    </button>
                    <button type="button" onClick={() => setShowUnmaskPhone(false)} className="btn-vasati-secondary" style={{ padding: "6px 14px", fontSize: "0.82rem" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ACCOMMODATION INFORMATION */}
          {activeTab === "accommodation" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <div className="owner-card-lavender">
                  <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--vasati-text-muted)", textTransform: "uppercase" }}>
                    Assigned Property
                  </span>
                  <div style={{ marginTop: "6px", fontWeight: "600", color: "var(--vasati-royal)" }}>
                    {customer.propertyName}
                  </div>
                </div>

                <div className="owner-card-lavender">
                  <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--vasati-text-muted)", textTransform: "uppercase" }}>
                    Room & Bed Allocation
                  </span>
                  <div style={{ marginTop: "6px", fontWeight: "700", fontSize: "1.05rem", color: "var(--vasati-rich)" }}>
                    Room {customer.roomNumber} • Bed {customer.bedNumber} ({customer.sharingType} Sharing)
                  </div>
                </div>

                <div className="owner-card-lavender">
                  <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--vasati-text-muted)", textTransform: "uppercase" }}>
                    Check-in Date
                  </span>
                  <div style={{ marginTop: "6px", fontWeight: "600" }}>
                    {new Date(customer.checkInDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                </div>

                <div className="owner-card-lavender">
                  <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--vasati-text-muted)", textTransform: "uppercase" }}>
                    Expected Checkout
                  </span>
                  <div style={{ marginTop: "6px", fontWeight: "600" }}>
                    {customer.expectedCheckoutDate
                      ? new Date(customer.expectedCheckoutDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
                      : "Ongoing / Open Lease"}
                  </div>
                </div>
              </div>

              {customer.notes && (
                <div className="owner-card-lavender" style={{ marginTop: "12px" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--vasati-text-muted)", textTransform: "uppercase" }}>
                    Resident Notes
                  </span>
                  <p style={{ margin: "6px 0 0 0", fontSize: "0.88rem", color: "var(--vasati-text-primary)" }}>
                    {customer.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PAYMENT LEDGER */}
          {activeTab === "payments" && (
            <div>
              {/* Payment Summary */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "20px" }}>
                <div className="owner-card-lavender" style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "0.78rem", color: "var(--vasati-text-muted)", textTransform: "uppercase", fontWeight: "600" }}>Monthly Rent</span>
                  <div style={{ fontSize: "1.4rem", fontWeight: "700", color: "var(--vasati-royal)", marginTop: "4px" }}>
                    ₹{Number(customer.monthlyRent).toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="owner-card-lavender" style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "0.78rem", color: "var(--vasati-text-muted)", textTransform: "uppercase", fontWeight: "600" }}>Security Deposit</span>
                  <div style={{ fontSize: "1.4rem", fontWeight: "700", color: "var(--vasati-text-primary)", marginTop: "4px" }}>
                    ₹{Number(customer.securityDeposit).toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="owner-card-lavender" style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "0.78rem", color: "var(--vasati-text-muted)", textTransform: "uppercase", fontWeight: "600" }}>Pending Amount</span>
                  <div style={{ fontSize: "1.4rem", fontWeight: "700", color: customer.pendingAmount > 0 ? "var(--vasati-danger)" : "var(--vasati-success)", marginTop: "4px" }}>
                    ₹{Number(customer.pendingAmount).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              <h4 style={{ margin: "16px 0 10px 0", color: "var(--vasati-royal)", fontSize: "0.95rem" }}>Payment History & Receipts</h4>
              {customer.paymentHistory?.length === 0 ? (
                <p style={{ color: "var(--vasati-text-muted)", fontSize: "0.85rem" }}>No payments recorded yet.</p>
              ) : (
                <div className="owner-table-wrapper" style={{ boxShadow: "none" }}>
                  <table className="owner-table">
                    <thead>
                      <tr>
                        <th>Receipt #</th>
                        <th>Month</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Method</th>
                        <th>Transaction Ref</th>
                        <th>Paid Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customer.paymentHistory.map((p) => (
                        <tr key={p._id}>
                          <td><strong>{p.receiptNumber}</strong></td>
                          <td>{p.month}</td>
                          <td>₹{Number(p.amount).toLocaleString("en-IN")}</td>
                          <td><span className={`badge-status badge-${p.status.toLowerCase()}`}>{p.status}</span></td>
                          <td>{p.paymentMethod || "—"}</td>
                          <td><code style={{ fontSize: "0.78rem" }}>{p.transactionRef || "—"}</code></td>
                          <td>{p.paidDate ? new Date(p.paidDate).toLocaleDateString() : "Pending"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CUSTOMER ACTIVITY & COMPLAINTS */}
          {activeTab === "activity" && (
            <div>
              <h4 style={{ margin: "0 0 12px 0", color: "var(--vasati-royal)", fontSize: "0.95rem" }}>Customer Complaints & Maintenance Requests</h4>
              {customer.complaints?.length === 0 ? (
                <p style={{ color: "var(--vasati-text-muted)", fontSize: "0.85rem" }}>No complaints lodged by this customer.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                  {customer.complaints.map((c) => (
                    <div key={c._id} className="owner-card-lavender" style={{ padding: "14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: "700", color: "var(--vasati-royal)" }}>[{c.category}] {c.title}</span>
                        <span className={`badge-status badge-${c.status.toLowerCase().replace(" ", "-")}`}>{c.status}</span>
                      </div>
                      <p style={{ margin: "6px 0", fontSize: "0.85rem", color: "var(--vasati-text-secondary)" }}>{c.description}</p>
                      {c.ownerResponse && (
                        <div style={{ fontSize: "0.8rem", backgroundColor: "white", padding: "8px 12px", borderRadius: "6px", borderLeft: "3px solid var(--vasati-rich)" }}>
                          <strong>Owner Response:</strong> {c.ownerResponse}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <h4 style={{ margin: "16px 0 12px 0", color: "var(--vasati-royal)", fontSize: "0.95rem" }}>Visit History</h4>
              {customer.visits?.length === 0 ? (
                <p style={{ color: "var(--vasati-text-muted)", fontSize: "0.85rem" }}>No visit requests recorded.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {customer.visits.map((v) => (
                    <div key={v._id} className="owner-card-lavender" style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <strong>Visit ID: {v.visitId}</strong>
                        <div style={{ fontSize: "0.8rem", color: "var(--vasati-text-secondary)" }}>
                          📅 {new Date(v.requestedDate).toLocaleDateString()} at {v.requestedTime}
                        </div>
                      </div>
                      <span className={`badge-status badge-${v.status.toLowerCase()}`}>{v.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: OWNER ACTIONS */}
          {activeTab === "actions" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
              {/* Action 1: Re-allocate Room & Bed */}
              <div className="owner-card-lavender">
                <h4 style={{ margin: "0 0 10px 0", color: "var(--vasati-royal)", fontSize: "0.95rem" }}>
                  Update Room & Bed Allocation
                </h4>
                <p style={{ fontSize: "0.82rem", color: "var(--vasati-text-secondary)", margin: "0 0 14px 0" }}>
                  Move resident to another room in the same property. Available beds in target room will automatically be updated.
                </p>
                <form onSubmit={handleReallocateSubmit} style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <select
                    value={reallocateRoom}
                    onChange={(e) => {
                      setReallocateRoom(e.target.value);
                      setReallocateBed("");
                    }}
                    className="owner-filter-select"
                    style={{ flex: 1, minWidth: "150px" }}
                  >
                    <option value="">Select Target Room</option>
                    {availableRooms.map((rm) => (
                      <option key={rm._id} value={rm.roomNumber}>
                        Room {rm.roomNumber} ({rm.sharingType} - {rm.availableBeds} beds available)
                      </option>
                    ))}
                  </select>

                  <select
                    value={reallocateBed}
                    onChange={(e) => setReallocateBed(e.target.value)}
                    className="owner-filter-select"
                    style={{ flex: 1, minWidth: "150px" }}
                    disabled={!reallocateRoom}
                  >
                    <option value="">Select Bed</option>
                    {availableRooms
                      .find((rm) => rm.roomNumber === reallocateRoom)
                      ?.beds.filter((b) => b.status === "Available" || b.bedNumber === customer.bedNumber)
                      .map((b) => (
                        <option key={b.bedNumber} value={b.bedNumber}>
                          Bed {b.bedNumber} ({b.status})
                        </option>
                      ))}
                  </select>

                  <button type="submit" className="btn-vasati-primary" style={{ padding: "8px 16px" }}>
                    Confirm Move
                  </button>
                </form>
              </div>

              {/* Action 2: Record Verified Rent Payment */}
              <div className="owner-card-lavender">
                <h4 style={{ margin: "0 0 10px 0", color: "var(--vasati-royal)", fontSize: "0.95rem" }}>
                  Record Verified Rent Payment
                </h4>
                <p style={{ fontSize: "0.82rem", color: "var(--vasati-text-secondary)", margin: "0 0 14px 0" }}>
                  Record a confirmed payment received via UPI, Netbanking, or Cash. Generates an auditable receipt.
                </p>
                <form onSubmit={handleRecordPaymentSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", marginBottom: "4px" }}>Amount (₹)</label>
                    <input
                      type="number"
                      required
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="owner-search-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", marginBottom: "4px" }}>Payment Mode</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="owner-filter-select"
                      style={{ width: "100%" }}
                    >
                      <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                      <option value="Netbanking">Netbanking / IMPS</option>
                      <option value="Cash">Cash Receipt</option>
                      <option value="Card">Debit / Credit Card</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", marginBottom: "4px" }}>
                      Transaction UTR / Reference ID
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. UPI/330918239012/HDFC or Cash Voucher #104"
                      value={paymentTxnRef}
                      onChange={(e) => setPaymentTxnRef(e.target.value)}
                      className="owner-search-input"
                    />
                  </div>
                  <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end" }}>
                    <button type="submit" className="btn-vasati-primary">
                      Record Payment & Generate Receipt
                    </button>
                  </div>
                </form>
              </div>

              {/* Action 3: Checkout / Check-in Status */}
              <div className="owner-card-lavender" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h4 style={{ margin: "0 0 4px 0", color: "var(--vasati-royal)", fontSize: "0.95rem" }}>Resident Status Controls</h4>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--vasati-text-secondary)" }}>
                    Currently <strong>{customer.residentStatus}</strong>. Checking out frees up Bed {customer.bedNumber} immediately.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {customer.residentStatus === "Active" ? (
                    <button
                      type="button"
                      onClick={() => handleStatusChange("Checked Out")}
                      className="btn-vasati-secondary"
                      style={{ borderColor: "var(--vasati-danger)", color: "var(--vasati-danger)" }}
                    >
                      Process Checkout
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStatusChange("Active")}
                      className="btn-vasati-primary"
                    >
                      Re-activate Resident
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CustomerProfileModal;
