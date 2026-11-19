import React, { useState, useEffect, createContext, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ownerApi } from "./ownerApi";
import "./OwnerTheme.css";
import {
  FiGrid,
  FiUsers,
  FiCalendar,
  FiLayers,
  FiCreditCard,
  FiMapPin,
  FiAlertCircle,
  FiBarChart2,
  FiMessageSquare,
  FiLogOut,
  FiBell,
  FiCheckCircle,
  FiChevronDown,
  FiMenu,
  FiX,
} from "react-icons/fi";

export const OwnerContext = createContext();

export function useOwner() {
  return useContext(OwnerContext);
}

function OwnerLayout({ children }) {
  const [owner, setOwner] = useState(null);
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("ownerToken");
    if (!token) {
      navigate("/owner/login");
      return;
    }

    const loadOwnerData = async () => {
      try {
        const res = await ownerApi.getMe();
        setOwner(res.data.owner);
        setProperties(res.data.properties || []);
        if (res.data.properties && res.data.properties.length > 0) {
          // Default to all properties or first property
          setSelectedPropertyId("");
        }

        // Fetch notifications
        const notifRes = await ownerApi.getNotifications();
        setNotifications(notifRes.data || []);
      } catch (err) {
        console.error("Owner load error:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem("ownerToken");
          navigate("/owner/login");
        }
      } finally {
        setLoading(false);
      }
    };

    loadOwnerData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("ownerToken");
    localStorage.removeItem("ownerData");
    navigate("/owner/login");
  };

  const navItems = [
    { path: "/owner/dashboard", label: "Dashboard", icon: <FiGrid className="nav-icon" /> },
    { path: "/owner/customers", label: "Customers", icon: <FiUsers className="nav-icon" /> },
    { path: "/owner/bookings", label: "Bookings", icon: <FiCalendar className="nav-icon" /> },
    { path: "/owner/rooms", label: "Rooms & Beds", icon: <FiLayers className="nav-icon" /> },
    { path: "/owner/payments", label: "Rent & Payments", icon: <FiCreditCard className="nav-icon" /> },
    { path: "/owner/visits", label: "Visits", icon: <FiMapPin className="nav-icon" /> },
    { path: "/owner/complaints", label: "Complaints", icon: <FiAlertCircle className="nav-icon" /> },
    { path: "/owner/analytics", label: "Analytics", icon: <FiBarChart2 className="nav-icon" /> },
    { path: "/owner/chat", label: "Messages", icon: <FiMessageSquare className="nav-icon" /> },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="owner-portal-root" style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div className="owner-sidebar-logo" style={{ width: "48px", height: "48px", margin: "0 auto 16px auto" }} />
          <p style={{ color: "var(--vasati-rich)", fontWeight: "600" }}>Loading Owner Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <OwnerContext.Provider
      value={{
        owner,
        properties,
        selectedPropertyId,
        setSelectedPropertyId,
        notifications,
        reloadNotifications: async () => {
          const res = await ownerApi.getNotifications();
          setNotifications(res.data || []);
        },
      }}
    >
      <div className="owner-portal-root">
        <div className="owner-app-container">
          {/* DESKTOP SIDEBAR */}
          <aside className="owner-sidebar">
            <div className="owner-sidebar-brand">
              <div className="owner-sidebar-logo" />
              <div>
                <h1 className="owner-sidebar-brand-name">VASATI</h1>
                <span className="owner-sidebar-portal-tag">Owner Portal</span>
              </div>
            </div>

            <ul className="owner-nav-list">
              {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <li key={item.path}>
                    <Link to={item.path} className={`owner-nav-item ${isActive ? "active" : ""}`}>
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div style={{ padding: "16px", borderTop: "1px solid var(--vasati-lavender-border)" }}>
              <Link
                to="/"
                target="_blank"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "0.82rem",
                  color: "var(--vasati-text-secondary)",
                  textDecoration: "none",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  backgroundColor: "var(--vasati-lavender-card)",
                  marginBottom: "8px",
                }}
              >
                <span>View Customer App &rarr;</span>
              </Link>
              <button
                onClick={handleLogout}
                className="owner-nav-item"
                style={{ color: "var(--vasati-danger)", padding: "10px 14px" }}
              >
                <FiLogOut className="nav-icon" />
                <span>Log Out</span>
              </button>
            </div>
          </aside>

          {/* MAIN WRAPPER */}
          <div className="owner-main-wrapper">
            {/* TOP HEADER */}
            <header className="owner-header">
              <div className="owner-header-left">
                {/* Mobile Hamburger toggle */}
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  style={{
                    display: "none",
                    background: "none",
                    border: "none",
                    fontSize: "1.4rem",
                    color: "var(--vasati-royal)",
                    cursor: "pointer",
                  }}
                  className="mobile-menu-trigger"
                >
                  <FiMenu />
                </button>

                {/* Property Selector */}
                <div className="owner-property-selector">
                  <FiMapPin style={{ color: "var(--vasati-rich)", flexShrink: 0 }} />
                  <select
                    value={selectedPropertyId}
                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                    className="owner-property-select-input"
                  >
                    <option value="">All Verified Properties ({properties.length})</option>
                    {properties.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.pgName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="owner-header-right">
                {/* Notification Bell */}
                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="owner-icon-btn"
                    title="Notifications"
                  >
                    <FiBell />
                    {unreadCount > 0 && <span className="owner-notification-dot" />}
                  </button>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div
                      style={{
                        position: "absolute",
                        right: 0,
                        top: "48px",
                        width: "320px",
                        backgroundColor: "white",
                        border: "1px solid var(--vasati-lavender-border)",
                        borderRadius: "12px",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
                        zIndex: 100,
                        overflow: "hidden",
                      }}
                    >
                      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--vasati-lavender-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: "700", fontSize: "0.9rem", color: "var(--vasati-royal)" }}>Notifications</span>
                        <span style={{ fontSize: "0.75rem", color: "var(--vasati-orange)", fontWeight: "600" }}>{unreadCount} new</span>
                      </div>
                      <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                        {notifications.length === 0 ? (
                          <p style={{ padding: "16px", margin: 0, fontSize: "0.85rem", color: "var(--vasati-text-muted)", textAlign: "center" }}>No notifications.</p>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id || n._id}
                              style={{
                                padding: "12px 16px",
                                borderBottom: "1px solid #FAF8FF",
                                backgroundColor: n.read ? "white" : "var(--vasati-lavender-card)",
                                cursor: "pointer",
                              }}
                              onClick={() => {
                                if (n.link) navigate(n.link);
                                setShowNotifications(false);
                              }}
                            >
                              <div style={{ fontWeight: "600", fontSize: "0.85rem", color: "var(--vasati-text-primary)", marginBottom: "2px" }}>
                                {n.title}
                              </div>
                              <div style={{ fontSize: "0.78rem", color: "var(--vasati-text-secondary)", lineHeight: "1.3" }}>
                                {n.message}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Pill */}
                <div className="owner-profile-pill">
                  <div className="owner-avatar">
                    {owner?.fullName ? owner.fullName.charAt(0) : "O"}
                  </div>
                  <div className="owner-profile-info">
                    <span className="owner-profile-name">{owner?.fullName || "PG Owner"}</span>
                    <span className="owner-profile-status">{owner?.verificationStatus || "Verified"}</span>
                  </div>
                </div>
              </div>
            </header>

            {/* PAGE BODY */}
            <main className="owner-page-content">{children}</main>
          </div>
        </div>

        {/* MOBILE BOTTOM NAVIGATION BAR */}
        <nav className="owner-mobile-bottom-bar">
          <Link
            to="/owner/dashboard"
            className={`owner-mobile-nav-btn ${location.pathname === "/owner/dashboard" ? "active" : ""}`}
          >
            <FiGrid className="icon" />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/owner/customers"
            className={`owner-mobile-nav-btn ${location.pathname.startsWith("/owner/customers") ? "active" : ""}`}
          >
            <FiUsers className="icon" />
            <span>Customers</span>
          </Link>
          <Link
            to="/owner/bookings"
            className={`owner-mobile-nav-btn ${location.pathname.startsWith("/owner/bookings") ? "active" : ""}`}
          >
            <FiCalendar className="icon" />
            <span>Bookings</span>
          </Link>
          <Link
            to="/owner/rooms"
            className={`owner-mobile-nav-btn ${location.pathname.startsWith("/owner/rooms") ? "active" : ""}`}
          >
            <FiLayers className="icon" />
            <span>Rooms</span>
          </Link>
          <Link
            to="/owner/payments"
            className={`owner-mobile-nav-btn ${location.pathname.startsWith("/owner/payments") ? "active" : ""}`}
          >
            <FiCreditCard className="icon" />
            <span>Rent</span>
          </Link>
        </nav>
      </div>
    </OwnerContext.Provider>
  );
}

export default OwnerLayout;
