import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase/firebaseConfig";
import { useAuth } from "../context/AuthContext";
import "./OnboardingPage.css";

const USER_TYPES = [
  { id: "student",  label: "Student",  icon: "🎓" },
  { id: "faculty",  label: "Faculty",  icon: "👨‍🏫" },
  { id: "employee", label: "Employee", icon: "👤" },
];

const COLLEGES_OFFICES = [
  "College of Law",
  "College of Medicine",
  "School of Graduate Studies",
  "School of International Relations",
  "College of Nursing",
  "College of Medical Technology",
  "College of Physical Therapy",
  "College of Respiratory Therapy",
  "College of Midwifery",
  "College of Engineering and Architecture",
  "College of Informatics and Computing Studies",
  "College of Accountancy",
  "College of Business Administration",
  "College of Criminology",
  "College of Education",
  "College of Arts and Sciences",
  "College of Communication",
  "College of Music",
  "College of Agriculture",
];

export default function OnboardingPage() {
  const { currentUser, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [selectedType, setSelectedType] = useState("");
  const [selectedCollege, setSelectedCollege] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!selectedType) { setError("Please select your user type."); return; }
    if (!selectedCollege) { setError("Please select your College or Office."); return; }

    setSaving(true);
    setError("");
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        userType: selectedType,
        college_office: selectedCollege,
        isSetupComplete: true,
      });
      await refreshProfile();
      navigate("/checkin");
    } catch (err) {
      console.error(err);
      setError("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const step1Done   = !!selectedType;
  const step2Active = step1Done && !selectedCollege;
  const step2Done   = !!selectedCollege;

  return (
    <div className="onboard-bg">
      <div className="onboard-card">

        {/* ── Progress indicator ── */}
        <div className="onboard-progress">
          <div className="onboard-progress-step">
            <div className={`onboard-progress-dot ${step1Done ? "done" : "active"}`}>
              {step1Done ? "✓" : "1"}
            </div>
            <span className={`onboard-progress-label ${step1Done ? "done" : "active"}`}>
              User Type
            </span>
          </div>

          <div className={`onboard-progress-line ${step1Done ? "done" : ""}`} />

          <div className="onboard-progress-step">
            <div className={`onboard-progress-dot ${step2Done ? "done" : step2Active ? "active" : ""}`}>
              {step2Done ? "✓" : "2"}
            </div>
            <span className={`onboard-progress-label ${step2Done ? "done" : step2Active ? "active" : ""}`}>
              Department
            </span>
          </div>
        </div>

        {/* ── Header ── */}
        <div className="onboard-header">
          <img src="/neu-logo.png" className="onboard-header-icon" alt="NEU Logo" />
          <div>
            <h2 className="onboard-title">Complete Your Profile</h2>
            <p className="onboard-sub">First-time visitor? Tell us more about you.</p>
          </div>
        </div>

        {/* ── User type selector ── */}
        <p className="onboard-label">You are a:</p>
        <div className="onboard-type-grid">
          {USER_TYPES.map((t) => (
            <button
              key={t.id}
              className={`onboard-type-btn${selectedType === t.id ? " selected" : ""}`}
              onClick={() => setSelectedType(t.id)}
            >
              <span className="onboard-type-icon">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── College / Office dropdown ── */}
        <label className="onboard-label" htmlFor="college-select">
          College or Office
        </label>
        <div className="onboard-select-wrapper">
          <select
            id="college-select"
            className="onboard-select"
            value={selectedCollege}
            onChange={(e) => setSelectedCollege(e.target.value)}
          >
            <option value="">Select your department…</option>
            {COLLEGES_OFFICES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {error && <p className="onboard-error">{error}</p>}

        <button
          className="onboard-confirm-btn"
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? "Saving…" : "Confirm and Proceed"}
        </button>
      </div>
    </div>
  );
}
