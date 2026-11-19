import React, { useState, useEffect } from "react";
import { useOwner } from "./OwnerLayout";
import { ownerApi } from "./ownerApi";
import "./OwnerTheme.css";
import {
  FiAlertCircle,
  FiSearch,
  FiFilter,
  FiMessageSquare,
  FiCheckCircle,
  FiClock,
  FiX,
} from "react-icons/fi";

function ComplaintManagement() {
  const { selectedPropertyId } = useOwner();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  // Respond Modal
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [ownerResponse, setOwnerResponse] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [responseStatus, setResponseStatus] = useState("In Progress");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const categories = [
    "Food",
    "Cleanliness",
    "Maintenance",
    "Water",
    "Electricity",
    "Internet",
    "Security",
    "Deposit",
    "Owner-related concerns",
  ];

  useEffect(() => {
    loadComplaints();
  }, [selectedPropertyId, categoryFilter, statusFilter, priorityFilter]);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedPropertyId) params.propertyId = selectedPropertyId;
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const res = await ownerApi.getComplaints(params);
      setComplaints(res.data);
    } catch (err) {
      console.error("Load complaints error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespondSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      await ownerApi.respondComplaint(activeComplaint.complaintId, {
        ownerResponse,
        resolutionNotes,
        status: responseStatus,
      });
      setMessage(`Complaint #${activeComplaint.complaintId} updated successfully.`);
      setActiveComplaint(null);
      loadComplaints();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update complaint.");
    }
  };

  return (
    <div>
      <div className="owner-page-header">
        <div className="owner-page-title-group">
          <h2>Complaint & Maintenance Desk</h2>
          <p>Respond to customer issues across Food, Cleanliness, Maintenance, WiFi, Water and Security</p>
        </div>
      </div>

      {message && (
        <div style={{ backgroundColor: "#ECFDF5", color: "#065F46", padding: "12px 16px", borderRadius: "8px", fontSize: "0.88rem", marginBottom: "20px", border: "1px solid #A7F3D0" }}>
          ✔ {message}
        </div>
      )}
      {error && (
        <div style={{ backgroundColor: "#FEF2F2", color: "#991B1B", padding: "12px 16px", borderRadius: "8px", fontSize: "0.88rem", marginBottom: "20px", border: "1px solid #FECACA" }}>
          ✖ {error}
        </div>
      )}

      {/* Filter Bar */}
      <div className="owner-filter-bar">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="owner-filter-select"
        >
          <option value="">All Categories (Food, WiFi, Water...)</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="owner-filter-select"
        >
          <option value="">All Statuses</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="owner-filter-select"
        >
          <option value="">All Priorities</option>
          <option value="Urgent">Urgent</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <button type="button" onClick={loadComplaints} className="btn-vasati-secondary" style={{ padding: "9px 16px" }}>
          <FiFilter /> Filter
        </button>
      </div>

      {/* Complaints List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ color: "var(--vasati-rich)", fontWeight: "600" }}>Loading complaints...</p>
        </div>
      ) : complaints.length === 0 ? (
        <div className="owner-card" style={{ textAlign: "center", padding: "50px 20px" }}>
          <FiCheckCircle style={{ fontSize: "2.5rem", color: "var(--vasati-success)", marginBottom: "12px" }} />
          <h3 style={{ margin: "0 0 6px 0", color: "var(--vasati-royal)" }}>No Complaints</h3>
          <p style={{ margin: 0, color: "var(--vasati-text-secondary)", fontSize: "0.9rem" }}>
            No tickets match your filter criteria.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {complaints.map((c) => (
            <div key={c._id} className="owner-card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--vasati-rich)", textTransform: "uppercase" }}>
                    #{c.complaintId} • Category: {c.category}
                  </span>
                  <h3 style={{ margin: "4px 0 0 0", fontSize: "1.18rem", color: "var(--vasati-royal)", fontWeight: "700" }}>
                    {c.title}
                  </h3>
                  <span style={{ fontSize: "0.82rem", color: "var(--vasati-text-secondary)" }}>
                    Reported by <strong>{c.customerName}</strong> (Room {c.roomNumber || "N/A"}) • {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      backgroundColor: c.priority === "Urgent" ? "#FEE2E2" : c.priority === "High" ? "#FFEDD5" : "#F3F4F6",
                      color: c.priority === "Urgent" ? "#DC2626" : c.priority === "High" ? "#EA580C" : "#4B5563",
                    }}
                  >
                    Priority: {c.priority}
                  </span>
                  <span className={`badge-status badge-${c.status.toLowerCase().replace(" ", "-")}`}>
                    {c.status}
                  </span>
                </div>
              </div>

              <p style={{ margin: "10px 0 14px 0", fontSize: "0.9rem", color: "var(--vasati-text-primary)", backgroundColor: "var(--vasati-lavender-card)", padding: "12px", borderRadius: "8px" }}>
                "{c.description}"
              </p>

              {c.ownerResponse && (
                <div style={{ backgroundColor: "#F8F5FF", borderLeft: "4px solid var(--vasati-rich)", padding: "12px 16px", borderRadius: "6px", marginBottom: "14px", fontSize: "0.85rem" }}>
                  <strong style={{ color: "var(--vasati-royal)" }}>Owner Response:</strong> {c.ownerResponse}
                  {c.resolutionNotes && (
                    <div style={{ color: "var(--vasati-text-secondary)", marginTop: "4px" }}>
                      <em>Notes: {c.resolutionNotes}</em>
                    </div>
                  )}
                  {c.resolvedAt && (
                    <div style={{ fontSize: "0.75rem", color: "var(--vasati-success)", marginTop: "4px" }}>
                      ✔ Resolved on {new Date(c.resolvedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveComplaint(c);
                    setOwnerResponse(c.ownerResponse || "");
                    setResolutionNotes(c.resolutionNotes || "");
                    setResponseStatus(c.status || "In Progress");
                  }}
                  className="btn-vasati-primary"
                  style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                >
                  <FiMessageSquare /> Respond / Update Status
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RESPOND MODAL */}
      {activeComplaint && (
        <div className="owner-modal-overlay" onClick={() => setActiveComplaint(null)}>
          <div className="owner-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "540px" }}>
            <div className="owner-modal-header">
              <h3>Respond to Complaint #{activeComplaint.complaintId}</h3>
              <button type="button" onClick={() => setActiveComplaint(null)} className="owner-modal-close-btn">
                <FiX />
              </button>
            </div>
            <form onSubmit={handleRespondSubmit} className="owner-modal-body">
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "4px" }}>
                  Resolution Status
                </label>
                <select
                  value={responseStatus}
                  onChange={(e) => setResponseStatus(e.target.value)}
                  className="owner-filter-select"
                  style={{ width: "100%" }}
                >
                  <option value="In Progress">In Progress (Action Underway)</option>
                  <option value="Resolved">Resolved (Completed)</option>
                  <option value="Closed">Closed</option>
                  <option value="Open">Open</option>
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "4px" }}>
                  Customer-Facing Response Message
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Electrician scheduled for 4 PM today to replace the switch."
                  value={ownerResponse}
                  onChange={(e) => setOwnerResponse(e.target.value)}
                  className="owner-search-input"
                  style={{ height: "auto" }}
                />
              </div>

              <div style={{ marginBottom: "22px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "4px" }}>
                  Internal Resolution Notes (Audit Logged)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Invoice #991 attached. Tested heating element."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="owner-search-input"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" onClick={() => setActiveComplaint(null)} className="btn-vasati-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-vasati-primary">
                  Save Response & Notify Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ComplaintManagement;
