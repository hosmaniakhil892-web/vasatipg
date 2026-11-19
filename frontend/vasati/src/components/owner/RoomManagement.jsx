import React, { useState, useEffect } from "react";
import { useOwner } from "./OwnerLayout";
import { ownerApi } from "./ownerApi";
import "./OwnerTheme.css";
import {
  FiLayers,
  FiPlus,
  FiEdit2,
  FiCheckCircle,
  FiXCircle,
  FiHome,
  FiX,
  FiTag,
} from "react-icons/fi";

function RoomManagement() {
  const { selectedPropertyId, properties } = useOwner();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Room Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRoomForm, setNewRoomForm] = useState({
    propertyId: "",
    roomNumber: "",
    floor: 1,
    sharingType: "Double",
    monthlyRent: "",
    securityDeposit: "",
    facilities: ["WiFi", "Geyser", "Attached Washroom"],
  });

  // Edit Room Modal State
  const [editRoom, setEditRoom] = useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadRooms();
  }, [selectedPropertyId]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const res = await ownerApi.getRooms(selectedPropertyId);
      setRooms(res.data);
    } catch (err) {
      console.error("Load rooms error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoomSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const targetPropId = newRoomForm.propertyId || selectedPropertyId || (properties[0] ? properties[0]._id : null);
    if (!targetPropId) {
      return setError("Please select a target property.");
    }

    try {
      await ownerApi.addRoom({
        ...newRoomForm,
        propertyId: targetPropId,
      });
      setMessage(`Room ${newRoomForm.roomNumber} created successfully!`);
      setShowAddModal(false);
      setNewRoomForm({
        propertyId: "",
        roomNumber: "",
        floor: 1,
        sharingType: "Double",
        monthlyRent: "",
        securityDeposit: "",
        facilities: ["WiFi", "Geyser", "Attached Washroom"],
      });
      loadRooms();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create room.");
    }
  };

  const handleEditRoomSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      await ownerApi.updateRoom(editRoom._id, {
        monthlyRent: editRoom.monthlyRent,
        securityDeposit: editRoom.securityDeposit,
        facilities: editRoom.facilities,
      });
      setMessage(`Room ${editRoom.roomNumber} updated successfully!`);
      setEditRoom(null);
      loadRooms();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update room.");
    }
  };

  const availableFacilities = ["AC", "WiFi", "Geyser", "Attached Washroom", "Balcony", "TV", "Cupboards", "Study Table"];

  const toggleFacility = (facility) => {
    setNewRoomForm((prev) => {
      const exists = prev.facilities.includes(facility);
      return {
        ...prev,
        facilities: exists ? prev.facilities.filter((f) => f !== facility) : [...prev.facilities, facility],
      };
    });
  };

  return (
    <div>
      {/* Page Header */}
      <div className="owner-page-header">
        <div className="owner-page-title-group">
          <h2>Room & Bed Availability Management</h2>
          <p>Configure room numbers, sharing capacities, real-time bed occupancy, rent, and amenities</p>
        </div>
        <div className="owner-page-actions">
          <button type="button" onClick={() => setShowAddModal(true)} className="btn-vasati-primary">
            <FiPlus /> Add New Room
          </button>
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

      {/* Rooms Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ color: "var(--vasati-rich)", fontWeight: "600" }}>Loading room layouts...</p>
        </div>
      ) : rooms.length === 0 ? (
        <div className="owner-card" style={{ textAlign: "center", padding: "50px 20px" }}>
          <FiLayers style={{ fontSize: "2.5rem", color: "var(--vasati-text-muted)", marginBottom: "12px" }} />
          <h3 style={{ margin: "0 0 6px 0", color: "var(--vasati-royal)" }}>No Rooms Configured</h3>
          <p style={{ margin: "0 0 16px 0", color: "var(--vasati-text-secondary)", fontSize: "0.9rem" }}>
            Click 'Add New Room' to configure your first room and beds.
          </p>
          <button type="button" onClick={() => setShowAddModal(true)} className="btn-vasati-primary">
            <FiPlus /> Add Room
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "22px" }}>
          {rooms.map((rm) => (
            <div key={rm._id} className="owner-card" style={{ display: "flex", flexDirection: "column" }}>
              {/* Room Card Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.3rem", color: "var(--vasati-royal)", fontWeight: "700" }}>
                    Room {rm.roomNumber}
                  </h3>
                  <span style={{ fontSize: "0.8rem", color: "var(--vasati-text-secondary)" }}>
                    Floor {rm.floor || 1} • {rm.sharingType} Sharing
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "1.15rem", fontWeight: "700", color: "var(--vasati-rich)" }}>
                    ₹{Number(rm.monthlyRent).toLocaleString("en-IN")}
                    <span style={{ fontSize: "0.75rem", fontWeight: "normal", color: "var(--vasati-text-muted)" }}>/mo</span>
                  </div>
                  <span style={{ fontSize: "0.72rem", color: "var(--vasati-text-muted)" }}>
                    Deposit: ₹{Number(rm.securityDeposit).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Real-time Bed Status Badges */}
              <div style={{ margin: "10px 0 16px 0" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--vasati-text-muted)", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                  Bed Allocation ({rm.availableBeds} available of {rm.totalBeds})
                </span>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {rm.beds?.map((b) => (
                    <div
                      key={b.bedNumber}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "8px",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        backgroundColor:
                          b.status === "Available"
                            ? "#ECFDF5"
                            : b.status === "Occupied"
                            ? "#F3ECFF"
                            : "#FFFBEB",
                        color:
                          b.status === "Available"
                            ? "#065F46"
                            : b.status === "Occupied"
                            ? "var(--vasati-rich)"
                            : "#92400E",
                        border: `1px solid ${
                          b.status === "Available" ? "#A7F3D0" : "var(--vasati-lavender-border)"
                        }`,
                      }}
                    >
                      {b.status === "Available" ? (
                        <FiCheckCircle style={{ color: "#10B981" }} />
                      ) : (
                        <FiXCircle style={{ color: "var(--vasati-rich)" }} />
                      )}
                      <span>{b.bedNumber}: {b.status === "Occupied" ? (b.residentName ? b.residentName.split(" ")[0] : "Occupied") : b.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amenities Tags */}
              <div style={{ marginTop: "auto", paddingTop: "12px", borderTop: "1px solid var(--vasati-lavender-border)" }}>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
                  {rm.facilities?.map((f, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: "0.72rem",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        backgroundColor: "var(--vasati-lavender-card)",
                        color: "var(--vasati-royal)",
                        fontWeight: "500",
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => setEditRoom({ ...rm })}
                    className="btn-vasati-secondary"
                    style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                  >
                    <FiEdit2 /> Edit Pricing / Amenities
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD ROOM MODAL */}
      {showAddModal && (
        <div className="owner-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="owner-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "540px" }}>
            <div className="owner-modal-header">
              <h3>Add New Room & Bed Capacity</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="owner-modal-close-btn">
                <FiX />
              </button>
            </div>
            <form onSubmit={handleAddRoomSubmit} className="owner-modal-body">
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "4px" }}>
                  Target Property
                </label>
                <select
                  value={newRoomForm.propertyId || selectedPropertyId}
                  onChange={(e) => setNewRoomForm({ ...newRoomForm, propertyId: e.target.value })}
                  className="owner-filter-select"
                  style={{ width: "100%" }}
                  required
                >
                  <option value="">Select Property</option>
                  {properties.map((p) => (
                    <option key={p._id} value={p._id}>{p.pgName}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "4px" }}>
                    Room Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 204"
                    value={newRoomForm.roomNumber}
                    onChange={(e) => setNewRoomForm({ ...newRoomForm, roomNumber: e.target.value })}
                    className="owner-search-input"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "4px" }}>
                    Floor Level
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={newRoomForm.floor}
                    onChange={(e) => setNewRoomForm({ ...newRoomForm, floor: e.target.value })}
                    className="owner-search-input"
                  />
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "4px" }}>
                  Sharing Type
                </label>
                <select
                  value={newRoomForm.sharingType}
                  onChange={(e) => setNewRoomForm({ ...newRoomForm, sharingType: e.target.value })}
                  className="owner-filter-select"
                  style={{ width: "100%" }}
                >
                  <option value="Single">Single Sharing (1 Bed)</option>
                  <option value="Double">Double Sharing (2 Beds)</option>
                  <option value="Triple">Triple Sharing (3 Beds)</option>
                  <option value="Four Sharing">Four Sharing (4 Beds)</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "18px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "4px" }}>
                    Monthly Rent (₹)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 9500"
                    value={newRoomForm.monthlyRent}
                    onChange={(e) => setNewRoomForm({ ...newRoomForm, monthlyRent: e.target.value })}
                    className="owner-search-input"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "4px" }}>
                    Security Deposit (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 15000"
                    value={newRoomForm.securityDeposit}
                    onChange={(e) => setNewRoomForm({ ...newRoomForm, securityDeposit: e.target.value })}
                    className="owner-search-input"
                  />
                </div>
              </div>

              <div style={{ marginBottom: "22px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px" }}>
                  Room Facilities & Amenities
                </label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {availableFacilities.map((f) => {
                    const active = newRoomForm.facilities.includes(f);
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => toggleFacility(f)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "20px",
                          fontSize: "0.78rem",
                          fontWeight: "500",
                          border: active ? "1px solid var(--vasati-rich)" : "1px solid var(--vasati-lavender-border)",
                          backgroundColor: active ? "var(--vasati-rich)" : "white",
                          color: active ? "white" : "var(--vasati-text-secondary)",
                          cursor: "pointer",
                        }}
                      >
                        {f}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-vasati-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-vasati-primary">
                  Save Room & Initialize Beds
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ROOM MODAL */}
      {editRoom && (
        <div className="owner-modal-overlay" onClick={() => setEditRoom(null)}>
          <div className="owner-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
            <div className="owner-modal-header">
              <h3>Edit Room {editRoom.roomNumber}</h3>
              <button type="button" onClick={() => setEditRoom(null)} className="owner-modal-close-btn">
                <FiX />
              </button>
            </div>
            <form onSubmit={handleEditRoomSubmit} className="owner-modal-body">
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "4px" }}>
                  Monthly Rent (₹)
                </label>
                <input
                  type="number"
                  required
                  value={editRoom.monthlyRent}
                  onChange={(e) => setEditRoom({ ...editRoom, monthlyRent: e.target.value })}
                  className="owner-search-input"
                />
              </div>

              <div style={{ marginBottom: "22px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "4px" }}>
                  Security Deposit (₹)
                </label>
                <input
                  type="number"
                  required
                  value={editRoom.securityDeposit}
                  onChange={(e) => setEditRoom({ ...editRoom, securityDeposit: e.target.value })}
                  className="owner-search-input"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" onClick={() => setEditRoom(null)} className="btn-vasati-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-vasati-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoomManagement;
