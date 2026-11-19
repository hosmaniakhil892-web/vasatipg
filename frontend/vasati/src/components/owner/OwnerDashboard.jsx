import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useOwner } from "./OwnerLayout";
import { ownerApi } from "./ownerApi";
import "./OwnerTheme.css";
import {
  FiHome,
  FiUsers,
  FiUserCheck,
  FiLayers,
  FiCalendar,
  FiClock,
  FiDollarSign,
  FiAlertTriangle,
  FiArrowUpRight,
  FiCheckCircle,
  FiActivity,
  FiMapPin,
} from "react-icons/fi";

function OwnerDashboard() {
  const { selectedPropertyId } = useOwner();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, [selectedPropertyId]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await ownerApi.getDashboardSummary(selectedPropertyId);
      setData(res.data);
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <p style={{ color: "var(--vasati-rich)", fontWeight: "600" }}>Loading dashboard insights...</p>
      </div>
    );
  }

  const { summary, recentBookings, upcomingVisits, pendingRequests, recentActivity } = data || {};

  return (
    <div>
      {/* Page Header */}
      <div className="owner-page-header">
        <div className="owner-page-title-group">
          <h2>Property Management Overview</h2>
          <p>Real-time metrics, bookings queue, and customer operations across your properties</p>
        </div>
        <div className="owner-page-actions">
          <Link to="/owner/bookings" className="btn-vasati-orange">
            Manage Bookings ({summary?.pendingBookings || 0})
          </Link>
          <Link to="/owner/rooms" className="btn-vasati-primary">
            + Manage Rooms
          </Link>
        </div>
      </div>

      {/* 8 Summary Cards Grid */}
      <div className="owner-summary-grid">
        {/* 1. Total Properties */}
        <div className="owner-stat-card">
          <div className="owner-stat-info">
            <span className="owner-stat-label">Total Properties</span>
            <span className="owner-stat-value">{summary?.totalProperties || 0}</span>
            <span className="owner-stat-subtext">Verified Locations</span>
          </div>
          <div className="owner-stat-icon-wrap">
            <FiHome />
          </div>
        </div>

        {/* 2. Total Customers */}
        <div className="owner-stat-card">
          <div className="owner-stat-info">
            <span className="owner-stat-label">Total Customers</span>
            <span className="owner-stat-value">{summary?.totalCustomers || 0}</span>
            <span className="owner-stat-subtext">Registered Profiles</span>
          </div>
          <div className="owner-stat-icon-wrap">
            <FiUsers />
          </div>
        </div>

        {/* 3. Active Residents */}
        <div className="owner-stat-card stat-green">
          <div className="owner-stat-info">
            <span className="owner-stat-label">Active Residents</span>
            <span className="owner-stat-value">{summary?.activeResidents || 0}</span>
            <span className="owner-stat-subtext">{summary?.occupancyRate || 0}% Occupancy</span>
          </div>
          <div className="owner-stat-icon-wrap">
            <FiUserCheck />
          </div>
        </div>

        {/* 4. Available Beds */}
        <div className="owner-stat-card">
          <div className="owner-stat-info">
            <span className="owner-stat-label">Available Beds</span>
            <span className="owner-stat-value" style={{ color: "var(--vasati-rich)" }}>
              {summary?.availableBeds || 0}
            </span>
            <span className="owner-stat-subtext">of {summary?.totalBeds || 0} Total Beds</span>
          </div>
          <div className="owner-stat-icon-wrap">
            <FiLayers />
          </div>
        </div>

        {/* 5. Pending Bookings */}
        <div className="owner-stat-card stat-orange">
          <div className="owner-stat-info">
            <span className="owner-stat-label">Pending Bookings</span>
            <span className="owner-stat-value" style={{ color: "var(--vasati-orange)" }}>
              {summary?.pendingBookings || 0}
            </span>
            <span className="owner-stat-subtext">Require Action</span>
          </div>
          <div className="owner-stat-icon-wrap">
            <FiCalendar />
          </div>
        </div>

        {/* 6. Upcoming Check-ins */}
        <div className="owner-stat-card">
          <div className="owner-stat-info">
            <span className="owner-stat-label">Upcoming Check-ins</span>
            <span className="owner-stat-value">{summary?.upcomingCheckIns || 0}</span>
            <span className="owner-stat-subtext">Confirmed Arrivals</span>
          </div>
          <div className="owner-stat-icon-wrap">
            <FiClock />
          </div>
        </div>

        {/* 7. Monthly Rent Collection */}
        <div className="owner-stat-card stat-green">
          <div className="owner-stat-info">
            <span className="owner-stat-label">Monthly Rent Collected</span>
            <span className="owner-stat-value" style={{ color: "var(--vasati-success)", fontSize: "1.65rem" }}>
              ₹{Number(summary?.monthlyRentCollection || 0).toLocaleString("en-IN")}
            </span>
            <span className="owner-stat-subtext">November 2026</span>
          </div>
          <div className="owner-stat-icon-wrap">
            <FiDollarSign />
          </div>
        </div>

        {/* 8. Pending Payments */}
        <div className="owner-stat-card stat-orange">
          <div className="owner-stat-info">
            <span className="owner-stat-label">Pending / Overdue</span>
            <span className="owner-stat-value" style={{ color: "var(--vasati-danger)", fontSize: "1.65rem" }}>
              ₹{Number(summary?.pendingPayments || 0).toLocaleString("en-IN")}
            </span>
            <span className="owner-stat-subtext">Pending Collection</span>
          </div>
          <div className="owner-stat-icon-wrap">
            <FiAlertTriangle />
          </div>
        </div>
      </div>

      {/* Two Column Dashboard Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "24px", marginBottom: "28px" }}>
        {/* Recent Bookings Queue */}
        <div className="owner-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "var(--vasati-royal)" }}>
              Recent Booking Requests
            </h3>
            <Link to="/owner/bookings" style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--vasati-rich)", textDecoration: "none" }}>
              View All &rarr;
            </Link>
          </div>

          {recentBookings?.length === 0 ? (
            <p style={{ color: "var(--vasati-text-muted)", fontSize: "0.9rem" }}>No recent booking requests.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {recentBookings.map((b) => (
                <div
                  key={b._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    backgroundColor: "var(--vasati-lavender-card)",
                    border: "1px solid var(--vasati-lavender-border)",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "600", fontSize: "0.9rem", color: "var(--vasati-text-primary)" }}>
                      {b.customerName}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--vasati-text-secondary)" }}>
                      {b.sharingType} Sharing • Check-in: {new Date(b.checkInDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span className={`badge-status badge-${b.status.toLowerCase().replace(" ", "-")}`}>
                      {b.status}
                    </span>
                    <Link to="/owner/bookings" className="btn-vasati-secondary" style={{ padding: "6px 10px", fontSize: "0.78rem" }}>
                      Review
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Property Visits */}
        <div className="owner-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "var(--vasati-royal)" }}>
              Upcoming Visits
            </h3>
            <Link to="/owner/visits" style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--vasati-rich)", textDecoration: "none" }}>
              View All &rarr;
            </Link>
          </div>

          {upcomingVisits?.length === 0 ? (
            <p style={{ color: "var(--vasati-text-muted)", fontSize: "0.9rem" }}>No scheduled visits.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {upcomingVisits.map((v) => (
                <div
                  key={v._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    backgroundColor: "var(--vasati-lavender-card)",
                    border: "1px solid var(--vasati-lavender-border)",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "600", fontSize: "0.9rem", color: "var(--vasati-text-primary)" }}>
                      {v.customerName}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--vasati-text-secondary)" }}>
                      📅 {new Date(v.requestedDate).toLocaleDateString()} at {v.requestedTime}
                    </div>
                  </div>
                  <span className={`badge-status badge-${v.status.toLowerCase()}`}>{v.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Pending Complaints & Audit Activity */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "24px" }}>
        {/* Pending Customer Complaints */}
        <div className="owner-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "var(--vasati-royal)" }}>
              Pending Customer Requests & Complaints
            </h3>
            <Link to="/owner/complaints" style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--vasati-rich)", textDecoration: "none" }}>
              Complaints Desk &rarr;
            </Link>
          </div>

          {pendingRequests?.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px", color: "var(--vasati-success)" }}>
              <FiCheckCircle style={{ fontSize: "2rem", marginBottom: "6px" }} />
              <p style={{ margin: 0, fontWeight: "600" }}>All customer complaints are resolved!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {pendingRequests.map((c) => (
                <div
                  key={c._id}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "8px",
                    backgroundColor: "var(--vasati-lavender-card)",
                    border: "1px solid var(--vasati-lavender-border)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                    <span style={{ fontWeight: "600", fontSize: "0.88rem", color: "var(--vasati-royal)" }}>
                      [{c.category}] {c.title}
                    </span>
                    <span className={`badge-status badge-${c.status.toLowerCase().replace(" ", "-")}`}>
                      {c.status}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--vasati-text-secondary)" }}>
                    Resident: {c.customerName} (Room {c.roomNumber})
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Audit Trail */}
        <div className="owner-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "var(--vasati-royal)" }}>
              Security & Audit Activity
            </h3>
            <span style={{ fontSize: "0.78rem", color: "var(--vasati-text-muted)" }}>Server-side Audited</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {recentActivity?.map((log, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: "6px",
                  backgroundColor: "var(--vasati-bg)",
                  fontSize: "0.82rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <FiActivity style={{ color: "var(--vasati-rich)" }} />
                  <div>
                    <strong style={{ color: "var(--vasati-text-primary)" }}>{log.action}</strong>
                    <span style={{ color: "var(--vasati-text-secondary)", marginLeft: "6px" }}>
                      on {log.entityType} ({log.entityId})
                    </span>
                  </div>
                </div>
                <span style={{ color: "var(--vasati-text-muted)", fontSize: "0.75rem" }}>
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OwnerDashboard;

