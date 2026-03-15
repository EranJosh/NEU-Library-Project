import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./WelcomePage.css";

const REDIRECT_SECONDS = 5;

const CONFETTI = [
  { color: "#f59e0b", left: "8%",  delay: "0s",    size: "9px",  dur: "2.6s" },
  { color: "#3b82f6", left: "18%", delay: "0.25s", size: "7px",  dur: "2.3s" },
  { color: "#22c55e", left: "28%", delay: "0.5s",  size: "11px", dur: "2.9s" },
  { color: "#f59e0b", left: "38%", delay: "0.1s",  size: "8px",  dur: "2.5s" },
  { color: "#ef4444", left: "48%", delay: "0.7s",  size: "9px",  dur: "2.7s" },
  { color: "#a855f7", left: "58%", delay: "0.35s", size: "7px",  dur: "2.2s" },
  { color: "#f59e0b", left: "68%", delay: "0.6s",  size: "10px", dur: "3s"   },
  { color: "#22c55e", left: "78%", delay: "0.2s",  size: "8px",  dur: "2.4s" },
  { color: "#3b82f6", left: "88%", delay: "0.8s",  size: "9px",  dur: "2.8s" },
  { color: "#ef4444", left: "13%", delay: "1.1s",  size: "7px",  dur: "2.6s" },
  { color: "#f59e0b", left: "43%", delay: "0.9s",  size: "11px", dur: "3.1s" },
  { color: "#a855f7", left: "73%", delay: "1.2s",  size: "8px",  dur: "2.5s" },
  { color: "#22c55e", left: "93%", delay: "0.4s",  size: "7px",  dur: "2.3s" },
];

export default function WelcomePage() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const total = REDIRECT_SECONDS * 1000;
    const interval = 50;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      setProgress(Math.min((elapsed / total) * 100, 100));

      if (elapsed >= total) {
        clearInterval(timer);
        navigate("/dashboard");
      }
    }, interval);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="welcome-bg">

      {/* Confetti burst */}
      <div className="confetti-container">
        {CONFETTI.map((c, i) => (
          <span
            key={i}
            className="confetti-piece"
            style={{
              background: c.color,
              left: c.left,
              width: c.size,
              height: c.size,
              animationDelay: c.delay,
              animationDuration: c.dur,
            }}
          />
        ))}
      </div>

      {/* Brand bar */}
      <div className="welcome-topbar">
        <img src="/neu-logo.png" className="welcome-topbar-logo" alt="NEU Logo" />
        <div className="welcome-topbar-text">
          <span className="welcome-topbar-label-top">NEU PORTAL</span>
          <span className="welcome-topbar-label-bot">Library Log</span>
        </div>
      </div>

      {/* Centered success card */}
      <main className="welcome-main">
        <div className="welcome-card">

          {/* Animated checkmark */}
          <div className="welcome-check-circle">
            <svg viewBox="0 0 52 52" width="52" height="52">
              <circle className="check-circle-bg" cx="26" cy="26" r="25" fill="none" />
              <path className="check-tick" fill="none" d="M14 26 l8 8 l16-16" />
            </svg>
          </div>

          <h1 className="welcome-title">Welcome to NEU Library!</h1>
          <p className="welcome-sub">
            Your visit has been successfully recorded.<br />
            Enjoy your stay and happy learning!
          </p>

          {/* Gradient progress bar */}
          <div className="welcome-progress-track">
            <div
              className="welcome-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="welcome-redirect-text">Redirecting in a few seconds…</p>

          <button
            className="welcome-manual-btn"
            onClick={() => navigate("/dashboard")}
          >
            Return to Check-in
          </button>
        </div>
      </main>
    </div>
  );
}
