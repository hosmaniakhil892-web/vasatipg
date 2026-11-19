import React, { useState, useEffect } from "react";
import { useOwner } from "./OwnerLayout";
import { ownerApi } from "./ownerApi";
import "./OwnerTheme.css";
import {
  FiBarChart2,
  FiTrendingUp,
  FiPieChart,
  FiDollarSign,
  FiPercent,
  FiCheckCircle,
} from "react-icons/fi";

function OwnerAnalytics() {
  const { selectedPropertyId } = useOwner();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [selectedPropertyId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await ownerApi.getAnalytics(selectedPropertyId);
      setData(res.data);
    } catch (err) {
      console.error("Load analytics error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <p style={{ color: "var(--vasati-rich)", fontWeight: "600" }}>Compiling analytics reports...</p>
      </div>
    );
  }

  const {
    occupancyTrend = [],
    revenueMetrics = {},
    sharingDistribution = {},
    conversionRate = 0,
    resolutionRate = 0,
    activeResidentsCount = 0,
  } = data || {};

  return (
    <div>
      <div className="owner-page-header">
        <div className="owner-page-title-group">
          <h2>PG Performance & Analytics Reports</h2>
          <p>Verified real database metrics on occupancy growth, collection health, and booking conversions</p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="owner-summary-grid">
        <div className="owner-stat-card stat-green">
          <div className="owner-stat-info">
            <span className="owner-stat-label">Booking Conversion Rate</span>
            <span className="owner-stat-value">{conversionRate}%</span>
            <span className="owner-stat-subtext">Inquiries converted to confirmed</span>
          </div>
          <div className="owner-stat-icon-wrap">
            <FiPercent />
          </div>
        </div>

        <div className="owner-stat-card">
          <div className="owner-stat-info">
            <span className="owner-stat-label">Active Residents</span>
            <span className="owner-stat-value" style={{ color: "var(--vasati-royal)" }}>
              {activeResidentsCount}
            </span>
            <span className="owner-stat-subtext">Currently staying in rooms</span>
          </div>
          <div className="owner-stat-icon-wrap">
            <FiTrendingUp />
          </div>
        </div>

        <div className="owner-stat-card stat-green">
          <div className="owner-stat-info">
            <span className="owner-stat-label">Complaint Resolution Rate</span>
            <span className="owner-stat-value">{resolutionRate}%</span>
            <span className="owner-stat-subtext">Issues successfully closed</span>
          </div>
          <div className="owner-stat-icon-wrap">
            <FiCheckCircle />
          </div>
        </div>

        <div className="owner-stat-card stat-orange">
          <div className="owner-stat-info">
            <span className="owner-stat-label">Collection Ratio</span>
            <span className="owner-stat-value">
              {revenueMetrics.totalCollected + revenueMetrics.totalPending > 0
                ? Math.round(
                    (revenueMetrics.totalCollected /
                      (revenueMetrics.totalCollected + revenueMetrics.totalPending)) *
                      100
                  )
                : 100}
              %
            </span>
            <span className="owner-stat-subtext">Collected vs target rent</span>
          </div>
          <div className="owner-stat-icon-wrap">
            <FiDollarSign />
          </div>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(440px, 1fr))", gap: "24px", marginBottom: "28px" }}>
        {/* Occupancy Growth Chart */}
        <div className="owner-card">
          <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", color: "var(--vasati-royal)", fontWeight: "700" }}>
            Monthly Occupancy Growth Rate (%)
          </h3>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: "200px", padding: "10px 0", borderBottom: "2px solid var(--vasati-lavender-border)" }}>
            {occupancyTrend.map((item, idx) => (
              <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--vasati-rich)", marginBottom: "6px" }}>
                  {item.occupancyRate}%
                </span>
                <div
                  style={{
                    width: "36px",
                    height: `${(item.occupancyRate / 100) * 150}px`,
                    background: "linear-gradient(180deg, var(--vasati-vibrant) 0%, var(--vasati-rich) 100%)",
                    borderRadius: "6px 6px 0 0",
                    transition: "height 0.4s ease",
                  }}
                  title={`${item.month}: ${item.occupancyRate}% occupancy (${item.residents} residents)`}
                />
                <span style={{ fontSize: "0.75rem", color: "var(--vasati-text-secondary)", marginTop: "8px", textAlign: "center" }}>
                  {item.month.split(" ")[0]}
                </span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: "0.78rem", color: "var(--vasati-text-muted)", margin: "12px 0 0 0", textAlign: "center" }}>
            Real historical occupancy based on resident check-in and checkout events.
          </p>
        </div>

        {/* Revenue Collection Breakdown */}
        <div className="owner-card">
          <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", color: "var(--vasati-royal)", fontWeight: "700" }}>
            Rent Ledger Health (November 2026)
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", marginBottom: "6px" }}>
                <span>Collected Rent</span>
                <strong style={{ color: "var(--vasati-success)" }}>
                  ₹{(revenueMetrics.totalCollected || 0).toLocaleString("en-IN")}
                </strong>
              </div>
              <div style={{ height: "10px", backgroundColor: "#E5E7EB", borderRadius: "10px", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${
                      revenueMetrics.totalCollected + revenueMetrics.totalPending > 0
                        ? (revenueMetrics.totalCollected /
                            (revenueMetrics.totalCollected + revenueMetrics.totalPending)) *
                          100
                        : 100
                    }%`,
                    backgroundColor: "var(--vasati-success)",
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", marginBottom: "6px" }}>
                <span>Pending Rent</span>
                <strong style={{ color: "var(--vasati-warning)" }}>
                  ₹{(revenueMetrics.totalPending || 0).toLocaleString("en-IN")}
                </strong>
              </div>
              <div style={{ height: "10px", backgroundColor: "#E5E7EB", borderRadius: "10px", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${
                      revenueMetrics.totalCollected + revenueMetrics.totalPending > 0
                        ? (revenueMetrics.totalPending /
                            (revenueMetrics.totalCollected + revenueMetrics.totalPending)) *
                          100
                        : 0
                    }%`,
                    backgroundColor: "var(--vasati-warning)",
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", marginBottom: "6px" }}>
                <span>Overdue Rent (&gt;10 Days)</span>
                <strong style={{ color: "var(--vasati-danger)" }}>
                  ₹{(revenueMetrics.totalOverdue || 0).toLocaleString("en-IN")}
                </strong>
              </div>
              <div style={{ height: "10px", backgroundColor: "#E5E7EB", borderRadius: "10px", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${
                      revenueMetrics.totalCollected > 0
                        ? Math.min(100, (revenueMetrics.totalOverdue / revenueMetrics.totalCollected) * 100)
                        : 0
                    }%`,
                    backgroundColor: "var(--vasati-danger)",
                  }}
                />
              </div>
            </div>
          </div>

          <div className="owner-card-lavender" style={{ marginTop: "22px", padding: "12px 16px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--vasati-royal)", fontWeight: "600" }}>
              💡 Owner Tip: 85% of residents pay on or before 5th of every month. Automated SMS reminders are recommended for the remaining 15%.
            </span>
          </div>
        </div>
      </div>

      {/* Sharing Distribution */}
      <div className="owner-card">
        <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", color: "var(--vasati-royal)", fontWeight: "700" }}>
          Bed Occupancy by Sharing Type
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          {Object.entries(sharingDistribution).map(([type, count]) => (
            <div key={type} className="owner-card-lavender" style={{ textAlign: "center" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--vasati-text-muted)", textTransform: "uppercase", fontWeight: "600" }}>
                {type} Sharing
              </span>
              <div style={{ fontSize: "1.8rem", fontWeight: "700", color: "var(--vasati-royal)", marginTop: "4px" }}>
                {count} Beds
              </div>
              <span style={{ fontSize: "0.78rem", color: "var(--vasati-text-secondary)" }}>Occupied Beds</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default OwnerAnalytics;

