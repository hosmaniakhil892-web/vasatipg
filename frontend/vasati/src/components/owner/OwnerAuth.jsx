import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ownerApi } from "./ownerApi";
import "./OwnerTheme.css";
import { FiLock, FiMail, FiUser, FiPhone, FiHome, FiMapPin, FiShield, FiFileText, FiCheckCircle } from "react-icons/fi";

function OwnerAuth({ initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register' | 'otp'
  const [regStep, setRegStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  // Login Form State
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  // Registration Form State
  const [regForm, setRegForm] = useState({
    fullName: "",
    email: "",
    password: "",
    mobileNumber: "",
    propertyName: "",
    propertyAddress: "",
    identityProof: {
      docType: "Aadhaar",
      docNumber: "",
      docFile: "aadhaar_sample.pdf",
    },
    ownershipProof: {
      docType: "Electricity Bill",
      docNumber: "EB-2026-9912",
      docFile: "ebill_sample.pdf",
    },
  });

  // OTP State
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await ownerApi.login(loginForm);
      localStorage.setItem("ownerToken", res.data.token);
      localStorage.setItem("ownerData", JSON.stringify(res.data.owner));
      navigate("/owner/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await ownerApi.login({
        email: "owner@vasatipg.com",
        password: "Password@123",
      });
      localStorage.setItem("ownerToken", res.data.token);
      localStorage.setItem("ownerData", JSON.stringify(res.data.owner));
      navigate("/owner/dashboard");
    } catch (err) {
      setError("Demo login failed: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRegNext = (e) => {
    e.preventDefault();
    setError("");
    if (regStep === 1) {
      if (!regForm.fullName || !regForm.email || !regForm.password || !regForm.mobileNumber) {
        return setError("Please fill in all personal information fields.");
      }
      setRegStep(2);
    } else if (regStep === 2) {
      if (!regForm.propertyName || !regForm.propertyAddress) {
        return setError("Please provide property name and complete address.");
      }
      setRegStep(3);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await ownerApi.register(regForm);
      setSuccess("Registration details submitted! Please enter the verification OTP.");
      setOtpEmail(res.data.email);
      setOtpCode(res.data.demoOtp || "123456"); // Pre-populate demo code for convenience
      setMode("otp");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to register property owner.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await ownerApi.verifyOtp({ email: otpEmail, otp: otpCode });
      localStorage.setItem("ownerToken", res.data.token);
      localStorage.setItem("ownerData", JSON.stringify(res.data.owner));
      navigate("/owner/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid OTP code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="owner-portal-root" style={{ justifyContent: "center", alignItems: "center", padding: "30px 16px", minHeight: "100vh" }}>
      <div style={{ maxWidth: "520px", width: "100%" }}>
        {/* Vasati Logo & Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <div className="owner-sidebar-logo" style={{ width: "44px", height: "44px" }} />
            <h1 style={{ fontSize: "1.85rem", fontWeight: "700", color: "var(--vasati-royal)", margin: 0 }}>
              VASATI
            </h1>
          </div>
          <p style={{ margin: "4px 0 0 0", color: "var(--vasati-text-secondary)", fontSize: "0.95rem" }}>
            PG Owner Dashboard & Customer Management Portal
          </p>
        </div>

        {/* Card Container */}
        <div className="owner-card" style={{ padding: "32px", borderRadius: "var(--vasati-radius-lg)" }}>
          {/* Mode Switcher Tabs */}
          {mode !== "otp" && (
            <div style={{ display: "flex", borderBottom: "1px solid var(--vasati-lavender-border)", marginBottom: "26px" }}>
              <button
                type="button"
                onClick={() => { setMode("login"); setError(""); }}
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "none",
                  background: "none",
                  fontWeight: "600",
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  color: mode === "login" ? "var(--vasati-rich)" : "var(--vasati-text-secondary)",
                  borderBottom: mode === "login" ? "3px solid var(--vasati-rich)" : "3px solid transparent",
                }}
              >
                Owner Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode("register"); setRegStep(1); setError(""); }}
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "none",
                  background: "none",
                  fontWeight: "600",
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  color: mode === "register" ? "var(--vasati-rich)" : "var(--vasati-text-secondary)",
                  borderBottom: mode === "register" ? "3px solid var(--vasati-rich)" : "3px solid transparent",
                }}
              >
                Register as Owner
              </button>
            </div>
          )}

          {error && (
            <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B", padding: "12px 16px", borderRadius: "8px", fontSize: "0.88rem", marginBottom: "20px" }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ backgroundColor: "#ECFDF5", border: "1px solid #A7F3D0", color: "#065F46", padding: "12px 16px", borderRadius: "8px", fontSize: "0.88rem", marginBottom: "20px" }}>
              {success}
            </div>
          )}

          {/* 1. LOGIN MODE */}
          {mode === "login" && (
            <form onSubmit={handleLoginSubmit}>
              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "var(--vasati-text-secondary)", marginBottom: "6px" }}>
                  Registered Email Address
                </label>
                <div style={{ position: "relative" }}>
                  <FiMail style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--vasati-text-muted)" }} />
                  <input
                    type="email"
                    required
                    placeholder="e.g. owner@vasatipg.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    className="owner-search-input"
                    style={{ paddingLeft: "42px" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "var(--vasati-text-secondary)", marginBottom: "6px" }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <FiLock style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--vasati-text-muted)" }} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="owner-search-input"
                    style={{ paddingLeft: "42px" }}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-vasati-primary" style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: "1rem" }}>
                {loading ? "Verifying..." : "Sign In to Owner Portal"}
              </button>

              <div style={{ textAlign: "center", margin: "18px 0 12px 0" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--vasati-text-muted)" }}>— or test with pre-verified account —</span>
              </div>

              <button
                type="button"
                onClick={handleQuickDemoLogin}
                className="btn-vasati-secondary"
                style={{ width: "100%", justifyContent: "center", padding: "11px", borderColor: "var(--vasati-rich)", color: "var(--vasati-rich)" }}
              >
                Quick Demo Login (Rajesh Kulkarni)
              </button>
            </form>
          )}

          {/* 2. REGISTRATION MODE */}
          {mode === "register" && (
            <div>
              {/* Stepper Indicator */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
                {[
                  { step: 1, label: "Personal" },
                  { step: 2, label: "Property" },
                  { step: 3, label: "Documents" },
                ].map((s) => (
                  <div key={s.step} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div
                      style={{
                        width: "26px",
                        height: "26px",
                        borderRadius: "50%",
                        backgroundColor: regStep >= s.step ? "var(--vasati-rich)" : "var(--vasati-lavender-border)",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                      }}
                    >
                      {s.step}
                    </div>
                    <span style={{ fontSize: "0.78rem", fontWeight: "600", color: regStep >= s.step ? "var(--vasati-rich)" : "var(--vasati-text-muted)" }}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Step 1: Personal Info */}
              {regStep === 1 && (
                <form onSubmit={handleRegNext}>
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "var(--vasati-text-secondary)", marginBottom: "4px" }}>
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Chandra"
                      value={regForm.fullName}
                      onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                      className="owner-search-input"
                      style={{ paddingLeft: "14px" }}
                    />
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "var(--vasati-text-secondary)", marginBottom: "4px" }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. ramesh.pg@vasati.in"
                      value={regForm.email}
                      onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                      className="owner-search-input"
                      style={{ paddingLeft: "14px" }}
                    />
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "var(--vasati-text-secondary)", marginBottom: "4px" }}>
                      10-Digit Mobile Number (for OTP verification)
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9845012345"
                      value={regForm.mobileNumber}
                      onChange={(e) => setRegForm({ ...regForm, mobileNumber: e.target.value })}
                      className="owner-search-input"
                      style={{ paddingLeft: "14px" }}
                    />
                  </div>

                  <div style={{ marginBottom: "22px" }}>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "var(--vasati-text-secondary)", marginBottom: "4px" }}>
                      Create Secure Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="At least 6 characters"
                      value={regForm.password}
                      onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                      className="owner-search-input"
                      style={{ paddingLeft: "14px" }}
                    />
                  </div>

                  <button type="submit" className="btn-vasati-primary" style={{ width: "100%", justifyContent: "center" }}>
                    Continue to Property Details &rarr;
                  </button>
                </form>
              )}

              {/* Step 2: Property Info */}
              {regStep === 2 && (
                <form onSubmit={handleRegNext}>
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "var(--vasati-text-secondary)", marginBottom: "4px" }}>
                      Primary PG Property Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vasati Comforts Luxury PG"
                      value={regForm.propertyName}
                      onChange={(e) => setRegForm({ ...regForm, propertyName: e.target.value })}
                      className="owner-search-input"
                      style={{ paddingLeft: "14px" }}
                    />
                  </div>

                  <div style={{ marginBottom: "22px" }}>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "var(--vasati-text-secondary)", marginBottom: "4px" }}>
                      Complete Property Address
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Plot/Building no., street, landmark, area, city, pincode"
                      value={regForm.propertyAddress}
                      onChange={(e) => setRegForm({ ...regForm, propertyAddress: e.target.value })}
                      className="owner-search-input"
                      style={{ padding: "12px", height: "auto" }}
                    />
                  </div>

                  <div style={{ display: "flex", gap: "12px" }}>
                    <button type="button" onClick={() => setRegStep(1)} className="btn-vasati-secondary" style={{ flex: 1, justifyContent: "center" }}>
                      &larr; Back
                    </button>
                    <button type="submit" className="btn-vasati-primary" style={{ flex: 2, justifyContent: "center" }}>
                      Continue to Verification &rarr;
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3: Identity & Ownership Documents */}
              {regStep === 3 && (
                <form onSubmit={handleRegisterSubmit}>
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "var(--vasati-text-secondary)", marginBottom: "4px" }}>
                      Identity Verification Document Type
                    </label>
                    <select
                      value={regForm.identityProof.docType}
                      onChange={(e) => setRegForm({
                        ...regForm,
                        identityProof: { ...regForm.identityProof, docType: e.target.value },
                      })}
                      className="owner-filter-select"
                      style={{ width: "100%" }}
                    >
                      <option value="Aadhaar">Aadhaar Card</option>
                      <option value="PAN">PAN Card</option>
                      <option value="Passport">Passport</option>
                      <option value="Voter ID">Voter ID</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "var(--vasati-text-secondary)", marginBottom: "4px" }}>
                      Document / ID Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 9821 4810 2931"
                      value={regForm.identityProof.docNumber}
                      onChange={(e) => setRegForm({
                        ...regForm,
                        identityProof: { ...regForm.identityProof, docNumber: e.target.value },
                      })}
                      className="owner-search-input"
                      style={{ paddingLeft: "14px" }}
                    />
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "var(--vasati-text-secondary)", marginBottom: "4px" }}>
                      Property Ownership / Authorization Proof Type
                    </label>
                    <select
                      value={regForm.ownershipProof.docType}
                      onChange={(e) => setRegForm({
                        ...regForm,
                        ownershipProof: { ...regForm.ownershipProof, docType: e.target.value },
                      })}
                      className="owner-filter-select"
                      style={{ width: "100%" }}
                    >
                      <option value="Electricity Bill">Recent Electricity Bill</option>
                      <option value="Property Deed">Property Deed / Khata</option>
                      <option value="Rental Agreement">Registered Lease Agreement</option>
                      <option value="Trade License">BBMP / Municipal Trade License</option>
                    </select>
                  </div>

                  <div style={{ backgroundColor: "var(--vasati-lavender-card)", padding: "14px", borderRadius: "8px", border: "1px dashed var(--vasati-lavender-border)", marginBottom: "22px", textAlign: "center" }}>
                    <FiFileText style={{ fontSize: "1.5rem", color: "var(--vasati-rich)", marginBottom: "4px" }} />
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--vasati-text-secondary)" }}>
                      Documents will be verified by Vasati compliance team within 24 hours.
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "12px" }}>
                    <button type="button" onClick={() => setRegStep(2)} className="btn-vasati-secondary" style={{ flex: 1, justifyContent: "center" }}>
                      &larr; Back
                    </button>
                    <button type="submit" disabled={loading} className="btn-vasati-primary" style={{ flex: 2, justifyContent: "center" }}>
                      {loading ? "Submitting..." : "Submit Registration & Send OTP"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* 3. OTP VERIFICATION MODE */}
          {mode === "otp" && (
            <form onSubmit={handleOtpSubmit} style={{ textAlign: "center" }}>
              <FiShield style={{ fontSize: "2.8rem", color: "var(--vasati-rich)", marginBottom: "12px" }} />
              <h3 style={{ margin: "0 0 8px 0", color: "var(--vasati-royal)" }}>Verify Mobile OTP</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--vasati-text-secondary)", marginBottom: "20px" }}>
                A 6-digit verification code was generated for <strong>{otpEmail}</strong>.
              </p>

              <div style={{ marginBottom: "24px" }}>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  style={{
                    fontSize: "1.8rem",
                    letterSpacing: "8px",
                    textAlign: "center",
                    fontWeight: "700",
                    width: "200px",
                    padding: "10px",
                    border: "2px solid var(--vasati-rich)",
                    borderRadius: "10px",
                    color: "var(--vasati-royal)",
                  }}
                />
                <p style={{ fontSize: "0.75rem", color: "var(--vasati-text-muted)", marginTop: "8px" }}>
                  (Testing code: <strong>123456</strong>)
                </p>
              </div>

              <button type="submit" disabled={loading} className="btn-vasati-primary" style={{ width: "100%", justifyContent: "center", padding: "12px" }}>
                {loading ? "Verifying..." : "Verify & Launch Owner Portal"}
              </button>
            </form>
          )}
        </div>

        {/* Back to Customer App Link */}
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <Link to="/" style={{ color: "var(--vasati-rich)", fontSize: "0.9rem", fontWeight: "600", textDecoration: "none" }}>
            &larr; Return to Customer Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OwnerAuth;
