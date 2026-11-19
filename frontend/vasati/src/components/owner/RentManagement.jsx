import React, { useState, useEffect } from "react";
import { useOwner } from "./OwnerLayout";
import { ownerApi } from "./ownerApi";
import "./OwnerTheme.css";
import {
  FiCreditCard,
  FiDollarSign,
  FiSearch,
  FiFilter,
  FiPlus,
  FiPrinter,
  FiCheckCircle,
  FiAlertTriangle,
  FiClock,
  FiX,
  FiFileText,
} from "react-icons/fi";

function RentManagement() {
  const { selectedPropertyId, properties } = useOwner();
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Record Payment Modal
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [recordForm, setRecordForm] = useState({
    customerId: "",
    propertyId: "",
    amount: "",
    month: "November 2026",
    paymentMethod: "UPI",
    transactionRef: "",
    notes: "",
  });

  // Receipt Modal
  const [viewReceipt, setViewReceipt] = useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadPayments();
    loadCustomers();
  }, [selectedPropertyId, statusFilter, monthFilter]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedPropertyId) params.propertyId = selectedPropertyId;
      if (statusFilter) params.status = statusFilter;
      if (monthFilter) params.month = monthFilter;
      if (searchQuery) params.search = searchQuery;

      const res = await ownerApi.getPayments(params);
      setPayments(res.data);
    } catch (err) {
      console.error("Load payments error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await ownerApi.getCustomers(selectedPropertyId ? { propertyId: selectedPropertyId } : {});
      setCustomers(res.data);
    } catch (err) {
      console.error("Load customers error:", err);
    }
  };

  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const targetCustomer = customers.find((c) => c.customerId === recordForm.customerId);
    if (!targetCustomer) {
      return setError("Please select a valid resident.");
    }

    try {
      const res = await ownerApi.recordPayment({
        ...recordForm,
        propertyId: targetCustomer.propertyId,
      });
      setMessage(`Payment recorded! Generated Receipt #${res.data.payment.receiptNumber}.`);
      setShowRecordModal(false);
      setRecordForm({
        customerId: "",
        propertyId: "",
        amount: "",
        month: "November 2026",
        paymentMethod: "UPI",
        transactionRef: "",
        notes: "",
      });
      loadPayments();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to record payment.");
    }
  };

  // Metrics summary
  let totalPaid = 0;
  let totalPending = 0;
  let totalOverdue = 0;
  payments.forEach((p) => {
    const amt = Number(p.amount) || 0;
    if (p.status === "Paid") totalPaid += amt;
    else if (p.status === "Pending") totalPending += amt;
    else if (p.status === "Overdue") totalOverdue += amt;
  });

  return (
    <div>
      {/* Page Header */}
      <div className="owner-page-header">
        <div className="owner-page-title-group">
          <h2>Rent & Payment Management</h2>
          <p>Track monthly collections, overdue rent, deposit ledgers, and verified payment receipts</p>
        </div>
        <div className="owner-page-actions">
          <button type="button" onClick={() => setShowRecordModal(true)} className="btn-vasati-primary">
            <FiPlus /> Record Verified Payment
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

      {/* Mini Metrics Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "18px", marginBottom: "24px" }}>
        <div className="owner-card-lavender" style={{ borderLeft: "4px solid var(--vasati-success)" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--vasati-text-muted)", textTransform: "uppercase" }}>
            Total Collected
          </span>
          <div style={{ fontSize: "1.7rem", fontWeight: "700", color: "var(--vasati-success)", marginTop: "4px" }}>
            ₹{totalPaid.toLocaleString("en-IN")}
          </div>
        </div>

        <div className="owner-card-lavender" style={{ borderLeft: "4px solid var(--vasati-warning)" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--vasati-text-muted)", textTransform: "uppercase" }}>
            Pending Rent
          </span>
          <div style={{ fontSize: "1.7rem", fontWeight: "700", color: "var(--vasati-warning)", marginTop: "4px" }}>
            ₹{totalPending.toLocaleString("en-IN")}
          </div>
        </div>

        <div className="owner-card-lavender" style={{ borderLeft: "4px solid var(--vasati-danger)" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--vasati-text-muted)", textTransform: "uppercase" }}>
            Overdue Rent
          </span>
          <div style={{ fontSize: "1.7rem", fontWeight: "700", color: "var(--vasati-danger)", marginTop: "4px" }}>
            ₹{totalOverdue.toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="owner-filter-bar">
        <div className="owner-search-input-wrap">
          <FiSearch className="owner-search-icon" />
          <input
            type="text"
            placeholder="Search by customer name, receipt #, or transaction UTR..."
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
          <option value="">All Payment Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
          <option value="Overdue">Overdue</option>
        </select>

        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="owner-filter-select"
        >
          <option value="">All Months</option>
          <option value="November 2026">November 2026</option>
          <option value="October 2026">October 2026</option>
          <option value="September 2026">September 2026</option>
        </select>

        <button type="button" onClick={loadPayments} className="btn-vasati-secondary" style={{ padding: "9px 16px" }}>
          <FiFilter /> Filter
        </button>
      </div>

      {/* Payments Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ color: "var(--vasati-rich)", fontWeight: "600" }}>Loading payment ledger...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="owner-card" style={{ textAlign: "center", padding: "50px 20px" }}>
          <FiCreditCard style={{ fontSize: "2.5rem", color: "var(--vasati-text-muted)", marginBottom: "12px" }} />
          <h3 style={{ margin: "0 0 6px 0", color: "var(--vasati-royal)" }}>No Payment Records</h3>
          <p style={{ margin: 0, color: "var(--vasati-text-secondary)", fontSize: "0.9rem" }}>
            No transaction records match the current filter.
          </p>
        </div>
      ) : (
        <div className="owner-table-wrapper">
          <table className="owner-table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Customer</th>
                <th>Month</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Status</th>
                <th>Payment Mode</th>
                <th>Transaction UTR / Ref</th>
                <th>Paid Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id}>
                  <td>
                    <strong style={{ color: "var(--vasati-royal)" }}>{p.receiptNumber}</strong>
                  </td>
                  <td>
                    <div>
                      <strong style={{ color: "var(--vasati-text-primary)" }}>{p.customerName}</strong>
                      <span style={{ fontSize: "0.75rem", color: "var(--vasati-text-muted)", display: "block" }}>
                        {p.propertyName}
                      </span>
                    </div>
                  </td>
                  <td>{p.month}</td>
                  <td>
                    <strong style={{ fontSize: "0.95rem" }}>₹{Number(p.amount).toLocaleString("en-IN")}</strong>
                  </td>
                  <td>{p.type}</td>
                  <td>
                    <span className={`badge-status badge-${p.status.toLowerCase()}`}>
                      {p.status}
                    </span>
                  </td>
                  <td>{p.paymentMethod || "—"}</td>
                  <td>
                    <code style={{ fontSize: "0.78rem" }}>{p.transactionRef || "—"}</code>
                  </td>
                  <td>{p.paidDate ? new Date(p.paidDate).toLocaleDateString("en-IN") : "Pending"}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => setViewReceipt(p)}
                      className="btn-vasati-secondary"
                      style={{ padding: "6px 12px", fontSize: "0.78rem" }}
                    >
                      <FiFileText /> Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {showRecordModal && (
        <div className="owner-modal-overlay" onClick={() => setShowRecordModal(false)}>
          <div className="owner-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
            <div className="owner-modal-header">
              <h3>Record Verified Rent Payment</h3>
              <button type="button" onClick={() => setShowRecordModal(false)} className="owner-modal-close-btn">
                <FiX />
              </button>
            </div>
            <form onSubmit={handleRecordSubmit} className="owner-modal-body">
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "4px" }}>
                  Select Resident / Customer
                </label>
                <select
                  required
                  value={recordForm.customerId}
                  onChange={(e) => {
                    const cust = customers.find((c) => c.customerId === e.target.value);
                    setRecordForm({
                      ...recordForm,
                      customerId: e.target.value,
                      amount: cust ? cust.pendingAmount || cust.monthlyRent : "",
                    });
                  }}
                  className="owner-filter-select"
                  style={{ width: "100%" }}
                >
                  <option value="">Select Resident</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c.customerId}>
                      {c.fullName} (Room {c.roomNumber} - {c.propertyName})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "4px" }}>
                    Verified Amount (₹)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 9500"
                    value={recordForm.amount}
                    onChange={(e) => setRecordForm({ ...recordForm, amount: e.target.value })}
                    className="owner-search-input"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "4px" }}>
                    Billing Month
                  </label>
                  <input
                    type="text"
                    required
                    value={recordForm.month}
                    onChange={(e) => setRecordForm({ ...recordForm, month: e.target.value })}
                    className="owner-search-input"
                  />
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "4px" }}>
                  Payment Method
                </label>
                <select
                  value={recordForm.paymentMethod}
                  onChange={(e) => setRecordForm({ ...recordForm, paymentMethod: e.target.value })}
                  className="owner-filter-select"
                  style={{ width: "100%" }}
                >
                  <option value="UPI">UPI (Google Pay, PhonePe, Paytm, BHIM)</option>
                  <option value="Netbanking">Netbanking / IMPS / NEFT</option>
                  <option value="Cash">Cash at Counter</option>
                  <option value="Card">Debit / Credit Card</option>
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "4px" }}>
                  Verified UTR / Reference ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UPI/330918239012/HDFC or Cash Voucher #108"
                  value={recordForm.transactionRef}
                  onChange={(e) => setRecordForm({ ...recordForm, transactionRef: e.target.value })}
                  className="owner-search-input"
                />
              </div>

              <div style={{ marginBottom: "22px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "4px" }}>
                  Notes / Verification Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid in full on 5th Nov via GPay QR"
                  value={recordForm.notes}
                  onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                  className="owner-search-input"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" onClick={() => setShowRecordModal(false)} className="btn-vasati-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-vasati-primary">
                  Verify & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE RECEIPT MODAL */}
      {viewReceipt && (
        <div className="owner-modal-overlay" onClick={() => setViewReceipt(null)}>
          <div className="owner-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "560px", padding: "28px" }}>
            <div style={{ borderBottom: "2px solid var(--vasati-rich)", paddingBottom: "16px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, color: "var(--vasati-royal)", fontSize: "1.5rem" }}>VASATI RENT RECEIPT</h2>
                <span style={{ fontSize: "0.8rem", color: "var(--vasati-text-secondary)" }}>Official Verified Transaction</span>
              </div>
              <button type="button" onClick={() => setViewReceipt(null)} className="owner-modal-close-btn">
                <FiX />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", fontSize: "0.88rem", marginBottom: "20px" }}>
              <div>
                <strong>Receipt No:</strong> {viewReceipt.receiptNumber}
                <br />
                <strong>Date:</strong> {new Date(viewReceipt.paidDate || viewReceipt.createdAt).toLocaleDateString()}
                <br />
                <strong>Billing Month:</strong> {viewReceipt.month}
              </div>
              <div>
                <strong>Customer:</strong> {viewReceipt.customerName}
                <br />
                <strong>Property:</strong> {viewReceipt.propertyName}
                <br />
                <strong>Mode:</strong> {viewReceipt.paymentMethod}
              </div>
            </div>

            <div className="owner-card-lavender" style={{ padding: "16px", textAlign: "center", marginBottom: "20px" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--vasati-text-muted)", textTransform: "uppercase", fontWeight: "600" }}>Total Amount Received</span>
              <div style={{ fontSize: "2rem", fontWeight: "800", color: "var(--vasati-royal)", marginTop: "4px" }}>
                ₹{Number(viewReceipt.amount).toLocaleString("en-IN")}
              </div>
              <span style={{ fontSize: "0.78rem", color: "var(--vasati-text-secondary)" }}>
                Transaction Ref: {viewReceipt.transactionRef}
              </span>
            </div>

            <div style={{ fontSize: "0.78rem", color: "var(--vasati-text-muted)", borderTop: "1px dashed var(--vasati-lavender-border)", paddingTop: "12px", marginBottom: "20px" }}>
              Verified by Owner: {viewReceipt.verifiedBy || "Owner Portal"} • This is a computer-generated tax receipt generated by VASATI PG Rental Platform.
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button type="button" onClick={() => window.print()} className="btn-vasati-secondary">
                <FiPrinter /> Print Receipt
              </button>
              <button type="button" onClick={() => setViewReceipt(null)} className="btn-vasati-primary">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RentManagement;

