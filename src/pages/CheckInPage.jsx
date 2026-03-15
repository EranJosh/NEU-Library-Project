import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase/firebaseConfig";
import { useAuth } from "../context/AuthContext";
import "./CheckInPage.css";

const REASONS = [
  { icon: "📖", label: "Reading" },
  { icon: "🔬", label: "Research" },
  { icon: "💻", label: "Use of Computer" },
  { icon: "📚", label: "Studying" },
  { icon: "📦", label: "Borrowing/Returning Books" },
  { icon: "❓", label: "Other" },
];

const LogoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

export default function CheckInPage() {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [selectedReason, setSelectedReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleCheckIn = async () => {
    if (!selectedReason) { setError("Please select a reason for your visit."); return; }

    setSubmitting(true);
    setError("");
    try {
      await addDoc(collection(db, "logs"), {
        uid: currentUser.uid,
        userEmail: currentUser.email,
        college_office: userProfile.college_office,
        reason: selectedReason,
        timestamp: serverTimestamp(),
      });
      navigate("/welcome");
    } catch (err) {
      console.error(err);
      setError("Failed to record check-in. Please try again.");
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const firstName = userProfile?.fullName?.split(" ")[0] || currentUser?.email;
  const initial = (userProfile?.fullName?.[0] ?? currentUser?.email?.[0] ?? "?").toUpperCase();

  // ── Blocked user ──────────────────────────────────────────────────────────────
  if (userProfile?.isBlocked) {
    return (
      <div className="checkin-layout">
        <nav className="checkin-topnav">
          <div className="topnav-brand">
            <img src="/neu-logo.png" className="topnav-logo" alt="NEU Logo" />
            <div className="topnav-brand-text">
              <span className="topnav-label-top">NEU PORTAL</span>
              <span className="topnav-label-bot">Library Log</span>
            </div>
          </div>
          <button className="topnav-logout-btn" onClick={handleLogout}>
            <LogoutIcon /> Logout
          </button>
        </nav>
        <main className="checkin-main">
          <div className="access-denied-card">
            <div className="access-denied-icon">🚫</div>
            <h2 className="access-denied-title">Access Denied</h2>
            <p className="access-denied-msg">
              Your account has been restricted.<br />
              Please contact the Library Admin.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="checkin-layout">

      {/* ── Top Nav ── */}
      <nav className="checkin-topnav">
        <div className="topnav-brand">
          <img src="/neu-logo.png" className="topnav-logo" alt="NEU Logo" />
          <div className="topnav-brand-text">
            <span className="topnav-label-top">NEU PORTAL</span>
            <span className="topnav-label-bot">Library Log</span>
          </div>
        </div>

        <div className="topnav-right">
          <div className="topnav-user">
            <div className="topnav-avatar">{initial}</div>
            <div className="topnav-user-info">
              <span className="topnav-user-name">{firstName}</span>
              <span className="topnav-user-role" style={{ textTransform: "capitalize" }}>
                {userProfile?.userType || "user"}
              </span>
            </div>
          </div>
          <div className="topnav-divider" />
          <button className="topnav-logout-btn" onClick={handleLogout}>
            <LogoutIcon /> Logout
          </button>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="checkin-main">

        {/* Hero Banner */}
        <div className="checkin-hero">
          <div className="checkin-hero-orb checkin-hero-orb--1" />
          <div className="checkin-hero-orb checkin-hero-orb--2" />
          <div className="checkin-hero-content">
            <div className="checkin-hero-badge" style={{ textTransform: "capitalize" }}>
              {userProfile?.userType || "user"}
            </div>
            <h1 className="checkin-hero-name">Welcome back, {firstName}!</h1>
            <p className="checkin-hero-dept">{userProfile?.college_office}</p>
          </div>
          <div className="checkin-hero-logo-wrap">
            <img src="/neu-logo.png" alt="NEU" className="checkin-hero-logo" />
          </div>
        </div>

        {/* Reason Selector */}
        <div className="checkin-box">
          <div className="checkin-box-header">
            <h2 className="checkin-question">Purpose of Visit</h2>
            <p className="checkin-question-sub">Select your reason for visiting the library today</p>
          </div>

          <div className="checkin-reasons-grid">
            {REASONS.map((r) => (
              <button
                key={r.label}
                className={`checkin-reason-btn${selectedReason === r.label ? " selected" : ""}`}
                onClick={() => { setSelectedReason(r.label); setError(""); }}
              >
                <span className="reason-icon">{r.icon}</span>
                {r.label}
              </button>
            ))}
          </div>

          {error && <p className="checkin-error">{error}</p>}

          <button
            className="checkin-submit-btn"
            onClick={handleCheckIn}
            disabled={submitting}
          >
            {submitting ? "Recording…" : "Check-In to Library"}
          </button>
        </div>
      </main>
    </div>
  );
}
