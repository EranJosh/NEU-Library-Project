import { useState, useEffect, useCallback, useMemo } from "react";
import {
  collection, query, where, orderBy, getDocs, Timestamp,
  doc, updateDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase/firebaseConfig";
import { useAuth } from "../context/AuthContext";
import "./AdminDashboard.css";

// ── Helpers ────────────────────────────────────────────────────────────────────

const FILTER_OPTIONS = ["Today", "Weekly", "Monthly", "Custom"];

function getDateRange(filter, customStart, customEnd) {
  const now = new Date();
  if (filter === "Today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { start, end: now };
  }
  if (filter === "Weekly") {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    return { start, end: now };
  }
  if (filter === "Monthly") {
    const start = new Date(now);
    start.setMonth(start.getMonth() - 1);
    start.setHours(0, 0, 0, 0);
    return { start, end: now };
  }
  const start = customStart ? new Date(customStart + "T00:00:00") : new Date(0);
  const end   = customEnd   ? new Date(customEnd   + "T23:59:59") : now;
  return { start, end };
}

function aggregateBy(logs, field) {
  const counts = {};
  for (const log of logs) {
    const key = log[field] || "Unknown";
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function formatDate(timestamp) {
  const d = timestamp?.toDate?.();
  if (!d) return "—";
  return d.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
}

const LogoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

// ── Component ──────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();

  // ── Filter state ──
  const [activeFilter, setActiveFilter] = useState("Today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd,   setCustomEnd]   = useState("");

  // ── Stats state ──
  const [logs,        setLogs]        = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [statsError,  setStatsError]  = useState("");

  // ── All users state ──
  const [allUsers,     setAllUsers]     = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // ── Search state ──
  const [searchQuery, setSearchQuery] = useState("");

  // ── Selected user state ──
  const [selectedUser,     setSelectedUser]     = useState(null);
  const [selectedUserLogs, setSelectedUserLogs] = useState([]);
  const [loadingUserLogs,  setLoadingUserLogs]  = useState(false);
  const [userLogsError,    setUserLogsError]    = useState("");
  const [blocking,         setBlocking]         = useState(false);

  // ── Fetch logs ─────────────────────────────────────────────────────────────
  const fetchLogs = useCallback(async () => {
    if (activeFilter === "Custom" && (!customStart || !customEnd)) return;

    setLoadingLogs(true);
    setStatsError("");
    try {
      const { start, end } = getDateRange(activeFilter, customStart, customEnd);
      const q = query(
        collection(db, "logs"),
        where("timestamp", ">=", Timestamp.fromDate(start)),
        where("timestamp", "<=", Timestamp.fromDate(end)),
        orderBy("timestamp", "desc"),
      );
      const snap = await getDocs(q);
      setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      setStatsError("Could not load stats. Check Firestore indexes.");
    } finally {
      setLoadingLogs(false);
    }
  }, [activeFilter, customStart, customEnd]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // ── Fetch all users on mount ──────────────────────────────────────────────
  useEffect(() => {
    async function fetchAllUsers() {
      try {
        const snap = await getDocs(collection(db, "users"));
        const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        users.sort((a, b) =>
          (a.fullName || a.email || "").localeCompare(b.fullName || b.email || "")
        );
        setAllUsers(users);
      } catch (err) {
        console.error("Could not fetch users:", err);
      } finally {
        setLoadingUsers(false);
      }
    }
    fetchAllUsers();
  }, []);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const collegeBreakdown = aggregateBy(logs, "college_office");
  const reasonBreakdown  = aggregateBy(logs, "reason");
  const topReason        = reasonBreakdown[0]?.[0] ?? "—";
  const maxReasonCount   = reasonBreakdown[0]?.[1] ?? 1;

  const filterLabel = {
    Today:   "Today",
    Weekly:  "This Week",
    Monthly: "This Month",
    Custom:  "Custom Range",
  }[activeFilter];

  // ── Live-filtered users ───────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return allUsers.filter((u) =>
      (u.fullName || "").toLowerCase().includes(q) ||
      (u.email    || "").toLowerCase().includes(q)
    );
  }, [allUsers, searchQuery]);

  // ── Select a user ────────────────────────────────────────────────────────
  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    setLoadingUserLogs(true);
    setUserLogsError("");
    setSelectedUserLogs([]);

    try {
      const logsSnap = await getDocs(
        query(
          collection(db, "logs"),
          where("userEmail", "==", user.email),
          orderBy("timestamp", "desc"),
        )
      );
      setSelectedUserLogs(logsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      try {
        const logsSnap = await getDocs(
          query(collection(db, "logs"), where("userEmail", "==", user.email))
        );
        setSelectedUserLogs(
          logsSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.timestamp?.seconds ?? 0) - (a.timestamp?.seconds ?? 0))
        );
      } catch (err) {
        console.error(err);
        setUserLogsError("Could not load visit history.");
      }
    } finally {
      setLoadingUserLogs(false);
    }
  };

  // ── Block / Unblock ──────────────────────────────────────────────────────
  const handleToggleBlock = async () => {
    if (!selectedUser || blocking) return;
    setBlocking(true);
    try {
      const newBlocked = !selectedUser.isBlocked;
      await updateDoc(doc(db, "users", selectedUser.id), { isBlocked: newBlocked });
      const updated = { ...selectedUser, isBlocked: newBlocked };
      setSelectedUser(updated);
      setAllUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      console.error(err);
    } finally {
      setBlocking(false);
    }
  };

  const handleLogout = async () => { await logout(); navigate("/"); };

  const adminInitial = (userProfile?.fullName?.[0] ?? "A").toUpperCase();

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="admin-layout">

      {/* ── Top Nav ── */}
      <nav className="admin-topnav">
        <div className="topnav-brand">
          <img src="/neu-logo.png" className="topnav-logo" alt="NEU Logo" />
          <div className="topnav-brand-text">
            <span className="topnav-label-top">NEU PORTAL</span>
            <span className="topnav-label-bot">Library Log</span>
          </div>
        </div>

        <div className="topnav-right">
          <div className="topnav-user">
            <div className="topnav-avatar topnav-avatar--admin">{adminInitial}</div>
            <div className="topnav-user-info">
              <span className="topnav-user-name">
                {userProfile?.fullName?.split(" ")[0] ?? "Admin"}
              </span>
              <span className="topnav-admin-badge">Administrator</span>
            </div>
          </div>
          <div className="topnav-divider" />
          <button className="topnav-logout-btn" onClick={handleLogout}>
            <LogoutIcon /> Logout
          </button>
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="admin-main">

        {/* Page Header */}
        <header className="admin-header">
          <div>
            <h1 className="admin-title">Dashboard</h1>
            <p className="admin-subtitle">NEU Library — Visitor Analytics</p>
          </div>
          <span className="admin-badge">Admin</span>
        </header>

        {/* ── Date filter ── */}
        <div className="admin-filter-bar">
          <div className="filter-tabs">
            {FILTER_OPTIONS.map((f) => (
              <button
                key={f}
                className={`filter-tab${activeFilter === f ? " active" : ""}`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          {activeFilter === "Custom" && (
            <div className="custom-range-row">
              <input
                type="date"
                className="date-input"
                value={customStart}
                max={customEnd || undefined}
                onChange={(e) => setCustomStart(e.target.value)}
              />
              <span className="date-sep">to</span>
              <input
                type="date"
                className="date-input"
                value={customEnd}
                min={customStart || undefined}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
              <button className="filter-apply-btn" onClick={fetchLogs}>
                Apply
              </button>
            </div>
          )}
        </div>

        {/* ── Stats cards ── */}
        {statsError ? (
          <p className="admin-error">{statsError}</p>
        ) : loadingLogs ? (
          <div className="admin-loading">
            <span className="loading-spinner" /> Loading stats…
          </div>
        ) : (
          <div className="stats-grid">

            {/* Card 1 — Total visitors */}
            <div className="stat-card stat-card--total">
              <span className="stat-card-icon">👥</span>
              <p className="stat-card-label">Total Visitors</p>
              <p className="stat-period">{filterLabel}</p>
              <p className="stat-big-number">{logs.length}</p>
              <p className="stat-card-meta">check-in entries recorded</p>
            </div>

            {/* Card 2 — Breakdown by College/Office */}
            <div className="stat-card stat-card--college">
              <span className="stat-card-icon">🏫</span>
              <p className="stat-card-label">Visitors by College / Office</p>
              <p className="stat-period">{filterLabel}</p>
              {collegeBreakdown.length === 0 ? (
                <p className="stat-empty">No data for this period.</p>
              ) : (
                <ul className="breakdown-list">
                  {collegeBreakdown.slice(0, 7).map(([college, count]) => (
                    <li key={college} className="breakdown-item">
                      <span className="breakdown-name">{college}</span>
                      <span className="breakdown-pill">{count}</span>
                    </li>
                  ))}
                  {collegeBreakdown.length > 7 && (
                    <li className="breakdown-more">
                      +{collegeBreakdown.length - 7} more colleges
                    </li>
                  )}
                </ul>
              )}
            </div>

            {/* Card 3 — Visit reasons */}
            <div className="stat-card stat-card--reason">
              <span className="stat-card-icon">📊</span>
              <p className="stat-card-label">Visit Reasons</p>
              <p className="stat-period">{filterLabel}</p>
              {reasonBreakdown.length === 0 ? (
                <p className="stat-empty">No data for this period.</p>
              ) : (
                <>
                  <p className="stat-top-reason">{topReason}</p>
                  <p className="stat-top-label">most common</p>
                  <ul className="reason-list">
                    {reasonBreakdown.map(([reason, count]) => (
                      <li key={reason} className="reason-item">
                        <span className="reason-name">{reason}</span>
                        <div className="reason-bar-track">
                          <div
                            className="reason-bar-fill"
                            style={{ width: `${(count / maxReasonCount) * 100}%` }}
                          />
                        </div>
                        <span className="reason-count">{count}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── User search ── */}
        <section className="search-section">
          <h2 className="section-heading">Search User Visit History</h2>

          <input
            type="text"
            className="search-input"
            placeholder="Search by name or email…"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSelectedUser(null); }}
          />

          {searchQuery.trim() && (
            <div className="user-list">
              {loadingUsers ? (
                <p className="user-list-empty">Loading users…</p>
              ) : filteredUsers.length === 0 ? (
                <p className="user-list-empty">No users match "{searchQuery}".</p>
              ) : (
                filteredUsers.map((u) => (
                  <button
                    key={u.id}
                    className={`user-list-item${selectedUser?.id === u.id ? " selected" : ""}`}
                    onClick={() => handleSelectUser(u)}
                  >
                    <div className="user-list-avatar">
                      {(u.fullName?.[0] ?? u.email?.[0] ?? "?").toUpperCase()}
                    </div>
                    <div className="user-list-info">
                      <span className="user-list-name">{u.fullName || "—"}</span>
                      <span className="user-list-email">{u.email}</span>
                    </div>
                    <span className={`status-badge ${u.isBlocked ? "blocked" : "active"}`}>
                      {u.isBlocked ? "Blocked" : "Active"}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Selected user detail */}
          {selectedUser && (
            <div className="search-result-panel">
              <div className="user-profile-card">
                <div className="user-avatar">
                  {(selectedUser.fullName?.[0] ?? selectedUser.email[0]).toUpperCase()}
                </div>
                <div className="user-details">
                  <p className="user-fullname">{selectedUser.fullName || "—"}</p>
                  <p className="user-email">{selectedUser.email}</p>
                </div>
                <div className="user-meta-grid">
                  <div className="user-meta-item">
                    <span className="user-meta-label">Type</span>
                    <span className="user-meta-val" style={{ textTransform: "capitalize" }}>
                      {selectedUser.userType || "—"}
                    </span>
                  </div>
                  <div className="user-meta-item">
                    <span className="user-meta-label">College / Office</span>
                    <span className="user-meta-val">{selectedUser.college_office || "—"}</span>
                  </div>
                  <div className="user-meta-item">
                    <span className="user-meta-label">Total Visits</span>
                    <span className="user-meta-val">{selectedUserLogs.length}</span>
                  </div>
                  <div className="user-meta-item">
                    <span className="user-meta-label">Status</span>
                    <span className={`status-badge ${selectedUser.isBlocked ? "blocked" : "active"}`}>
                      {selectedUser.isBlocked ? "Blocked" : "Active"}
                    </span>
                  </div>
                </div>

                <button
                  className={`block-toggle-btn ${selectedUser.isBlocked ? "unblock" : "block"}`}
                  onClick={handleToggleBlock}
                  disabled={blocking}
                >
                  {blocking
                    ? "Updating…"
                    : selectedUser.isBlocked
                    ? "Unblock User"
                    : "Block User"}
                </button>
              </div>

              <h3 className="history-heading">
                Visit History
                <span className="history-count">{selectedUserLogs.length} entries</span>
              </h3>

              {userLogsError ? (
                <p className="admin-error">{userLogsError}</p>
              ) : loadingUserLogs ? (
                <div className="admin-loading">
                  <span className="loading-spinner" /> Loading history…
                </div>
              ) : selectedUserLogs.length === 0 ? (
                <p className="stat-empty">No visits recorded for this user.</p>
              ) : (
                <div className="table-wrap">
                  <table className="visit-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Date &amp; Time</th>
                        <th>Reason</th>
                        <th>College / Office</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedUserLogs.map((log, i) => (
                        <tr key={log.id}>
                          <td className="td-num">{i + 1}</td>
                          <td>{formatDate(log.timestamp)}</td>
                          <td><span className="reason-tag">{log.reason}</span></td>
                          <td>{log.college_office}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
