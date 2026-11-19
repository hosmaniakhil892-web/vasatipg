import React, { useState, useEffect } from "react";
import { useOwner } from "./OwnerLayout";
import { ownerApi } from "./ownerApi";
import "./OwnerTheme.css";
import {
  FiCalendar,
  FiSearch,
  FiFilter,
  FiCheck,
  FiX,
  FiUserCheck,
  FiAlertCircle,
  FiInfo,
} from "react-icons/fi";

function BookingManagement() {
  const { selectedPropertyId } = useOwner();
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [acceptModalBooking, setAcceptModalBooking] = useState(null);
  const [selectedRoomNumber, setSelectedRoomNumber] = useState("");
  const [selectedBedNumber, setSelectedBedNumber] = useState("");

  const [rejectModalBooking, setRejectModalBooking] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const [termsModalBooking, setTermsModalBooking] = useState(null);

  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    loadBookings();
  }, [selectedPropertyId, statusFilter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedPropertyId) params.propertyId = selectedPropertyId;
      if (statusFilter) params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;

      const res = await ownerApi.getBookings(params);
      setBookings(res.data);

      // Also fetch rooms for allocation
      const roomsRes = await ownerApi.getRooms(selectedPropertyId);
      setRooms(roomsRes.data || []);
    } catch (err) {
      console.error("Load bookings error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptSubmit = async (e) => {
    e.preventDefault();
    setActionError("");
    setActionMessage("");

    try {
      await ownerApi.acceptBooking(acceptModalBooking.bookingId, {
        roomNumber: selectedRoomNumber,
        bedNumber: selectedBedNumber,
      });
      setActionMessage(`Booking #${acceptModalBooking.bookingId} confirmed! Bed ${selectedBedNumber} reserved.`);
      setAcceptModalBooking(null);
      loadBookings();
    } catch (err) {
      setActionError(err.response?.data?.error || "Failed to confirm booking.");
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    setActionError("");
    setActionMessage("");

    try {
      await ownerApi.rejectBooking(rejectModalBooking.bookingId, {
        reason: rejectReason || "Requested room capacity unavailable.",
      });
      setActionMessage(`Booking #${rejectModalBooking.bookingId} rejected.`);
      setRejectModalBooking(null);
      setRejectReason("");
      loadBookings();
    } catch (err) {
      setActionError(err.response?.data?.error || "Failed to reject booking.");
    }
  };

  const handleCheckIn = async (booking) => {
    setActionError("");
    setActionMessage("");

    try {
      const res = await ownerApi.checkInBooking(booking.bookingId);
      setActionMessage(`Customer ${booking.customerName} checked in successfully as resident ${res.data.resident?.customerId}!`);
      loadBookings();
    } catch (err) {
      setActionError(err.response?.data?.error || "Check-in failed.");
    }
  };

  return (
    <div>
      <div className="owner-page-header">
        <div className="owner-page-title-group">
          <h2>Booking Management System</h2>
          <p>Review customer reservations, confirm bed allocations, and manage check-ins with collision prevention</p>
        </div>
      </div>

      {actionMessage && (
        <div style={{ backgroundColor: "#ECFDF5", color: "#065F46", padding: "12px 16px", borderRadius: "8px", fontSize: "0.88rem", marginBottom: "20px", border: "1px solid #A7F3D0" }}>
          ✔ {actionMessage}
        </div>
      )}
      {actionError && (
        <div style={{ backgroundColor: "#FEF2F2", color: "#991B1B", padding: "12px 16px", borderRadius: "8px", fontSize: "0.88rem", marginBottom: "20px", border: "1px solid #FECACA" }}>
          ✖ {actionError}
        </div>
      )}

      {/* Filter Bar */}
      <div className="owner-filter-bar">
        <div className="owner-search-input-wrap">
          <FiSearch className="owner-search-icon" />
          <input
            type="text"
            placeholder="Search by customer name, booking ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="owner-search-input"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="owner-filter-select"
        >
          <option value="">All Statuses</option>
          <option value="New Enquiry">New Enquiry</option>
          <option value="Visit Requested">Visit Requested</option>
          <option value="Booking Pending">Booking Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Checked In">Checked In</option>
          <option value="Checked Out">Checked Out</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <button type="button" onClick={loadBookings} className="btn-vasati-secondary" style={{ padding: "9px 16px" }}>
          <FiFilter /> Filter
        </button>
      </div>

      {/* Bookings Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ color: "var(--vasati-rich)", fontWeight: "600" }}>Loading reservations...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="owner-card" style={{ textAlign: "center", padding: "50px 20px" }}>
          <FiCalendar style={{ fontSize: "2.5rem", color: "var(--vasati-text-muted)", marginBottom: "12px" }} />
          <h3 style={{ margin: "0 0 6px 0", color: "var(--vasati-royal)" }}>No Bookings Found</h3>
          <p style={{ margin: 0, color: "var(--vasati-text-secondary)", fontSize: "0.9rem" }}>
            No reservations currently match your selected status filter.
          </p>
        </div>
      ) : (
        <div className="owner-table-wrapper">
          <table className="owner-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Customer</th>
                <th>Property</th>
                <th>Sharing</th>
                <th>Check-in Date</th>
                <th>Allocated Room / Bed</th>
                <th>Monthly Rent</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id}>
                  <td>
                    <strong style={{ color: "var(--vasati-royal)" }}>{b.bookingId}</strong>
                  </td>
                  <td>
                    <div>
                      <span style={{ fontWeight: "600", color: "var(--vasati-text-primary)" }}>{b.customerName}</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--vasati-text-muted)", display: "block" }}>
                        {b.customerPhoneMasked}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: "0.85rem" }}>{b.propertyName}</span>
                  </td>
                  <td>{b.sharingType}</td>
                  <td>{new Date(b.checkInDate).toLocaleDateString("en-IN")}</td>
                  <td>
                    {b.roomNumber ? (
                      <span style={{ fontWeight: "700", color: "var(--vasati-rich)" }}>
                        Room {b.roomNumber} ({b.bedNumber})
                      </span>
                    ) : (
                      <span style={{ color: "var(--vasati-text-muted)", fontStyle: "italic" }}>Not Allocated</span>
                    )}
                  </td>
                  <td>₹{Number(b.monthlyRent).toLocaleString("en-IN")}</td>
                  <td>
                    <span className={`badge-status badge-${b.status.toLowerCase().replace(" ", "-")}`}>
                      {b.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      {["New Enquiry", "Booking Pending", "Visit Requested"].includes(b.status) && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setAcceptModalBooking(b);
                              setSelectedRoomNumber(b.roomNumber || "");
                              setSelectedBedNumber(b.bedNumber || "");
                            }}
                            className="btn-vasati-primary"
                            style={{ padding: "6px 10px", fontSize: "0.78rem" }}
                            title="Accept and allocate room"
                          >
                            <FiCheck /> Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => setRejectModalBooking(b)}
                            className="btn-vasati-secondary"
                            style={{ padding: "6px 10px", fontSize: "0.78rem", borderColor: "var(--vasati-danger)", color: "var(--vasati-danger)" }}
                            title="Reject reservation"
                          >
                            <FiX /> Reject
                          </button>
                        </>
                      )}

                      {b.status === "Confirmed" && (
                        <button
                          type="button"
                          onClick={() => handleCheckIn(b)}
                          className="btn-vasati-orange"
                          style={{ padding: "6px 12px", fontSize: "0.78rem" }}
                        >
                          <FiUserCheck /> Check-In
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setTermsModalBooking(b)}
                        className="btn-vasati-secondary"
                        style={{ padding: "6px 8px", fontSize: "0.78rem" }}
                        title="View Terms & Special Requests"
                      >
                        <FiInfo />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ACCEPT MODAL */}
      {acceptModalBooking && (
        <div className="owner-modal-overlay" onClick={() => setAcceptModalBooking(null)}>
          <div className="owner-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
            <div className="owner-modal-header">
              <h3>Accept & Confirm Booking #{acceptModalBooking.bookingId}</h3>
              <button type="button" onClick={() => setAcceptModalBooking(null)} className="owner-modal-close-btn">
                <FiX />
              </button>
            </div>
            <form onSubmit={handleAcceptSubmit} className="owner-modal-body">
              <div style={{ backgroundColor: "var(--vasati-lavender-card)", padding: "14px", borderRadius: "8px", marginBottom: "18px" }}>
                <strong style={{ color: "var(--vasati-royal)" }}>Customer: {acceptModalBooking.customerName}</strong>
                <div style={{ fontSize: "0.85rem", color: "var(--vasati-text-secondary)", marginTop: "4px" }}>
                  Check-in Date: {new Date(acceptModalBooking.checkInDate).toLocaleDateString()} • Sharing: {acceptModalBooking.sharingType}
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "4px" }}>
                  Assign Room
                </label>
                <select
                  required
                  value={selectedRoomNumber}
                  onChange={(e) => {
                    setSelectedRoomNumber(e.target.value);
                    setSelectedBedNumber("");
                  }}
                  className="owner-filter-select"
                  style={{ width: "100%" }}
                >
                  <option value="">Select Room</option>
                  {rooms.map((rm) => (
                    <option key={rm._id} value={rm.roomNumber}>
                      Room {rm.roomNumber} ({rm.sharingType} - {rm.availableBeds} beds available)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "22px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "4px" }}>
                  Assign Bed (Collision-Guarded)
                </label>
                <select
                  required
                  value={selectedBedNumber}
                  onChange={(e) => setSelectedBedNumber(e.target.value)}
                  className="owner-filter-select"
                  style={{ width: "100%" }}
                  disabled={!selectedRoomNumber}
                >
                  <option value="">Select Bed</option>
                  {rooms
                    .find((rm) => rm.roomNumber === selectedRoomNumber)
                    ?.beds.filter((b) => b.status === "Available")
                    .map((b) => (
                      <option key={b.bedNumber} value={b.bedNumber}>
                        Bed {b.bedNumber} (Available)
                      </option>
                    ))}
                </select>
                <p style={{ fontSize: "0.75rem", color: "var(--vasati-text-muted)", margin: "4px 0 0 0" }}>
                  Only beds with status 'Available' can be selected to prevent double-booking.
                </p>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" onClick={() => setAcceptModalBooking(null)} className="btn-vasati-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-vasati-primary">
                  Confirm Allocation & Accept
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectModalBooking && (
        <div className="owner-modal-overlay" onClick={() => setRejectModalBooking(null)}>
          <div className="owner-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
            <div className="owner-modal-header">
              <h3>Reject Booking #{rejectModalBooking.bookingId}</h3>
              <button type="button" onClick={() => setRejectModalBooking(null)} className="owner-modal-close-btn">
                <FiX />
              </button>
            </div>
            <form onSubmit={handleRejectSubmit} className="owner-modal-body">
              <p style={{ fontSize: "0.88rem", color: "var(--vasati-text-secondary)", marginTop: 0 }}>
                Please specify a reason for rejecting the booking from <strong>{rejectModalBooking.customerName}</strong>:
              </p>
              <textarea
                required
                rows={3}
                placeholder="e.g. Room category fully occupied for requested dates."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="owner-search-input"
                style={{ height: "auto", marginBottom: "18px" }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" onClick={() => setRejectModalBooking(null)} className="btn-vasati-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-vasati-secondary" style={{ borderColor: "var(--vasati-danger)", color: "var(--vasati-danger)" }}>
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TERMS MODAL */}
      {termsModalBooking && (
        <div className="owner-modal-overlay" onClick={() => setTermsModalBooking(null)}>
          <div className="owner-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
            <div className="owner-modal-header">
              <h3>Booking Terms & Details</h3>
              <button type="button" onClick={() => setTermsModalBooking(null)} className="owner-modal-close-btn">
                <FiX />
              </button>
            </div>
            <div className="owner-modal-body">
              <div className="owner-card-lavender" style={{ marginBottom: "14px" }}>
                <strong>Customer Name:</strong> {termsModalBooking.customerName}
                <br />
                <strong>Email:</strong> {termsModalBooking.customerEmail}
                <br />
                <strong>Monthly Rent:</strong> ₹{Number(termsModalBooking.monthlyRent).toLocaleString("en-IN")}
                <br />
                <strong>Security Deposit:</strong> ₹{Number(termsModalBooking.securityDeposit).toLocaleString("en-IN")}
              </div>

              <div className="owner-card-lavender">
                <strong>Special Customer Requests:</strong>
                <p style={{ margin: "6px 0 0 0", fontSize: "0.88rem", color: "var(--vasati-text-primary)" }}>
                  {termsModalBooking.specialRequests || "No special requests specified."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookingManagement;

