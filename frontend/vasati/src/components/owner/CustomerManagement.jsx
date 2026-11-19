import React, { useState, useEffect } from "react";
import { useOwner } from "./OwnerLayout";
import { ownerApi } from "./ownerApi";
import CustomerProfileModal from "./CustomerProfileModal";
import "./OwnerTheme.css";
import {
  FiUsers,
  FiSearch,
  FiFilter,
  FiEye,
  FiPhone,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
} from "react-icons/fi";

function CustomerManagement() {
  const { selectedPropertyId, properties } = useOwner();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // 'Active' | 'Checked Out' | ''
  const [paymentFilter, setPaymentFilter] = useState(""); // 'Paid' | 'Pending' | 'Overdue' | ''
  const [roomFilter, setRoomFilter] = useState("");

  // Selected customer for modal
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  useEffect(() => {
    loadCustomers();
  }, [selectedPropertyId, statusFilter, paymentFilter, roomFilter]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedPropertyId) params.propertyId = selectedPropertyId;
      if (statusFilter) params.residentStatus = statusFilter;
      if (paymentFilter) params.paymentStatus = paymentFilter;
      if (roomFilter) params.roomNumber = roomFilter;
      if (searchQuery) params.search = searchQuery;

      const res = await ownerApi.getCustomers(params);
      setCustomers(res.data);
    } catch (err) {
      console.error("Load customers error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadCustomers();
  };

  return (
    <div>
      {/* Page Header */}
      <div className="owner-page-header">
        <div className="owner-page-title-group">
          <h2>Customer Management</h2>
          <p>
            Manage active residents, room allocations, payment statuses, and checkout dates across verified properties
          </p>
        </div>
      </div>

      {/* Filter and Search Controls Bar */}
      <div className="owner-filter-bar">
        <form onSubmit={handleSearchSubmit} className="owner-search-input-wrap">
          <FiSearch className="owner-search-icon" />
          <input
            type="text"
            placeholder="Search by customer name, booking ID, or room number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="owner-search-input"
          />
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="owner-filter-select"
        >
          <option value="">All Resident Statuses</option>
          <option value="Active">Active Residents</option>
          <option value="Checked Out">Checked Out</option>
        </select>

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="owner-filter-select"
        >
          <option value="">All Payment Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
          <option value="Overdue">Overdue</option>
        </select>

        <input
          type="text"
          placeholder="Filter by Room #"
          value={roomFilter}
          onChange={(e) => setRoomFilter(e.target.value)}
          className="owner-search-input"
          style={{ width: "140px", flex: "none" }}
        />

        <button type="button" onClick={loadCustomers} className="btn-vasati-secondary" style={{ padding: "9px 16px" }}>
          <FiFilter /> Apply
        </button>
      </div>

      {/* Customers Data Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ color: "var(--vasati-rich)", fontWeight: "600" }}>Loading customer records...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="owner-card" style={{ textAlign: "center", padding: "50px 20px" }}>
          <FiUsers style={{ fontSize: "2.5rem", color: "var(--vasati-text-muted)", marginBottom: "12px" }} />
          <h3 style={{ margin: "0 0 6px 0", color: "var(--vasati-royal)" }}>No Customers Found</h3>
          <p style={{ margin: 0, color: "var(--vasati-text-secondary)", fontSize: "0.9rem" }}>
            No customer profiles match your current search and filter criteria.
          </p>
        </div>
      ) : (
        <div className="owner-table-wrapper">
          <table className="owner-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Customer ID</th>
                <th>Booking ID</th>
                <th>Assigned Property</th>
                <th>Room / Bed</th>
                <th>Check-in Date</th>
                <th>Expected Checkout</th>
                <th>Monthly Rent</th>
                <th>Payment Status</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c._id}>
                  {/* Photo & Name */}
                  <td>
                    <div className="table-customer-cell">
                      <img
                        src={c.photo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"}
                        alt={c.fullName}
                        className="table-customer-avatar"
                      />
                      <div>
                        <div style={{ fontWeight: "600", color: "var(--vasati-text-primary)" }}>{c.fullName}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--vasati-text-muted)" }}>
                          {c.mobileNumberMasked}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Customer ID */}
                  <td>
                    <strong style={{ color: "var(--vasati-royal)" }}>{c.customerId}</strong>
                  </td>

                  {/* Booking ID */}
                  <td>
                    <span style={{ fontSize: "0.82rem", color: "var(--vasati-text-secondary)" }}>
                      {c.bookingId || "Direct"}
                    </span>
                  </td>

                  {/* Assigned Property */}
                  <td>
                    <div style={{ fontSize: "0.85rem", fontWeight: "500", maxWidth: "160px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={c.propertyName}>
                      {c.propertyName}
                    </div>
                  </td>

                  {/* Room & Bed */}
                  <td>
                    <span style={{ fontWeight: "700", color: "var(--vasati-rich)" }}>
                      Room {c.roomNumber}
                    </span>
                    <span style={{ fontSize: "0.78rem", color: "var(--vasati-text-secondary)", display: "block" }}>
                      Bed {c.bedNumber} ({c.sharingType})
                    </span>
                  </td>

                  {/* Check-in Date */}
                  <td>{new Date(c.checkInDate).toLocaleDateString("en-IN")}</td>

                  {/* Expected Checkout */}
                  <td>
                    {c.expectedCheckoutDate
                      ? new Date(c.expectedCheckoutDate).toLocaleDateString("en-IN")
                      : "Ongoing"}
                  </td>

                  {/* Monthly Rent */}
                  <td>
                    <strong>₹{Number(c.monthlyRent).toLocaleString("en-IN")}</strong>
                  </td>

                  {/* Payment Status */}
                  <td>
                    <span className={`badge-status badge-${c.paymentStatus.toLowerCase()}`}>
                      {c.paymentStatus}
                    </span>
                  </td>

                  {/* Booking Status */}
                  <td>
                    <span className={`badge-status badge-${c.residentStatus.toLowerCase().replace(" ", "-")}`}>
                      {c.residentStatus}
                    </span>
                  </td>

                  {/* Action */}
                  <td>
                    <button
                      type="button"
                      onClick={() => setSelectedCustomerId(c.customerId)}
                      className="btn-vasati-secondary"
                      style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                    >
                      <FiEye /> View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Customer Profile Detailed Modal */}
      {selectedCustomerId && (
        <CustomerProfileModal
          customerId={selectedCustomerId}
          onClose={() => setSelectedCustomerId(null)}
          onRefresh={loadCustomers}
        />
      )}
    </div>
  );
}

export default CustomerManagement;
