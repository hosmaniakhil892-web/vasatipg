import React, { useState, useEffect } from "react";
import { useOwner } from "./OwnerLayout";
import { ownerApi } from "./ownerApi";
import "./OwnerTheme.css";
import {
  FiMapPin,
  FiCalendar,
  FiClock,
  FiCheck,
  FiX,
  FiEdit,
  FiCheckCircle,
} from "react-icons/fi";

function VisitManagement() {
  const { selectedPropertyId } = useOwner();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  // Reschedule / Action modal
  const [activeVisit, setActiveVisit] = useState(null);
  const [actionStatus, setActionStatus] = useState("Accepted");
  const [altDate, setAltDate] = useState("");
  const [altTime, setAltTime] = useState("");
  const [ownerNotes, setOwnerNotes] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadVisits();
  }, [selectedPropertyId, statusFilter]);

  const loadVisits = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedPropertyId) params.propertyId = selectedPropertyId;
      if (statusFilter) params.status = statusFilter;

      const res = await ownerApi.getVisits(params);
      setVisits(res.data);
    } catch (err) {
      console.error("Load visits error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      await ownerApi.updateVisit(activeVisit.visitId, {
        status: actionStatus,
        alternativeDate: altDate || null,
        alternativeTime: altTime || null,
        ownerNotes,
      });
      setMessage(`Visit #${activeVisit.visitId} updated to ${actionStatus}!`);
      setActiveVisit(null);
      loadVisits();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update visit.");
    }
  };

  return (
    <div>
      <div className="owner-page-header">
        <div className="owner-page-title-group">
          <h2>Property Visit Management</h2>
          <p>Schedule, accept, reschedule, and track customer in-person PG inspection visits</p>
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
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="owner-filter-select"
        >
          <option value="">All Visit Statuses</option>
          <option value="Requested">Requested (Action Needed)</option>
          <option value="Accepted">Accepted & Scheduled</option>
          <option value="Rescheduled">Rescheduled</option>
          <option value="Completed">Completed</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Visits List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ color: "var(--vasati-rich)", fontWeight: "600" }}>Loading visit schedules...</p>
        </div>
      ) : visits.length === 0 ? (
        <div className="owner-card" style={{ textAlign: "center", padding: "50px 20px" }}>
          <FiMapPin style={{ fontSize: "2.5rem", color: "var(--vasati-text-muted)", marginBottom: "12px" }} />
          <h3 style={{ margin: "0 0 6px 0", color: "var(--vasati-royal)" }}>No Scheduled Visits</h3>
          <p style={{ margin: 0, color: "var(--vasati-text-secondary)", fontSize: "0.9rem" }}>
            No visit appointments currently match the selected filter.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "20px" }}>
          {visits.map((v) => (
            <div key={v._id} className="owner-card" style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <div>
                  <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--vasati-rich)", textTransform: "uppercase" }}>
                    Visit ID: {v.visitId}
                  </span>
                  <h3 style={{ margin: "2px 0 0 0", fontSize: "1.15rem", color: "var(--vasati-royal)", fontWeight: "700" }}>
                    {v.customerName}
                  </h3>
                  <span style={{ fontSize: "0.8rem", color: "var(--vasati-text-secondary)" }}>
                    Contact: {v.customerPhoneMasked}
                  </span>
                </div>
                <span className={`badge-status badge-${v.status.toLowerCase()}`}>{v.status}</span>
              </div>

              <div className="owner-card-lavender" style={{ padding: "12px", margin: "10px 0 14px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.88rem", fontWeight: "600", color: "var(--vasati-royal)" }}>
                  <FiCalendar /> Requested: {new Date(v.requestedDate).toLocaleDateString()} at {v.requestedTime}
                </div>
                {v.alternativeDate && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "var(--vasati-orange)", marginTop: "4px" }}>
                    <FiClock /> Rescheduled to: {new Date(v.alternativeDate).toLocaleDateString()} at {v.alternativeTime}
                  </div>
                )}
                {v.notes && (
                  <p style={{ margin: "6px 0 0 0", fontSize: "0.8rem", color: "var(--vasati-text-secondary)" }}>
                    Customer note: "{v.notes}"
                  </p>
                )}
                {v.ownerNotes && (
                  <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem", color: "var(--vasati-rich)", fontWeight: "500" }}>
                    Owner note: "{v.ownerNotes}"
                  </p>
                )}
              </div>

              <div style={{ marginTop: "auto", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                {v.status === "Requested" && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveVisit(v);
                        setActionStatus("Accepted");
                        setOwnerNotes("");
                      }}
                      className="btn-vasati-primary"
                      style={{ padding: "6px 12px", fontSize: "0.78rem" }}
                    >
                      <FiCheck /> Accept Visit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveVisit(v);
                        setActionStatus("Rescheduled");
                      }}
                      className="btn-vasati-secondary"
                      style={{ padding: "6px 12px", fontSize: "0.78rem" }}
                    >
                      <FiEdit /> Suggest Alt Time
                    </button>
                  </>
                )}

                {v.status === "Accepted" && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveVisit(v);
                      setActionStatus("Completed");
                    }}
                    className="btn-vasati-orange"
                    style={{ padding: "6px 14px", fontSize: "0.78rem" }}
                  >
                    <FiCheckCircle /> Mark Completed
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* UPDATE VISIT MODAL */}
      {activeVisit && (
        <div className="owner-modal-overlay" onClick={() => setActiveVisit(null)}>
          <div className="owner-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <div className="owner-modal-header">
              <h3>Update Visit #{activeVisit.visitId}</h3>
              <button type="button" onClick={() => setActiveVisit(null)} className="owner-modal-close-btn">
                <FiX />
              </button>
            </div>
            <form onSubmit={handleUpdateSubmit} className="owner-modal-body">
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "4px" }}>
                  Visit Status
                </label>
                <select
                  value={actionStatus}
                  onChange={(e) => setActionStatus(e.target.value)}
                  className="owner-filter-select"
                  style={{ width: "100%" }}
                >
                  <option value="Accepted">Accept Visit</option>
                  <option value="Rescheduled">Reschedule to Alternative Date/Time</option>
                  <option value="Completed">Mark Completed (Visited)</option>
                  <option value="Rejected">Reject Request</option>
                </select>
              </div>

              {actionStatus === "Rescheduled" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", marginBottom: "4px" }}>
                      Alternative Date
                    </label>
                    <input
                      type="date"
                      required
                      value={altDate}
                      onChange={(e) => setAltDate(e.target.value)}
                      className="owner-search-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", marginBottom: "4px" }}>
                      Alternative Time
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 11:30 AM"
                      required
                      value={altTime}
                      onChange={(e) => setAltTime(e.target.value)}
                      className="owner-search-input"
                    />
                  </div>
                </div>
              )}

              <div style={{ marginBottom: "22px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "4px" }}>
                  Owner Notes / Instructions for Customer
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Please meet manager Mr. Ramesh at the reception desk."
                  value={ownerNotes}
                  onChange={(e) => setOwnerNotes(e.target.value)}
                  className="owner-search-input"
                  style={{ height: "auto" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" onClick={() => setActiveVisit(null)} className="btn-vasati-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-vasati-primary">
                  Save Visit Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default VisitManagement;

