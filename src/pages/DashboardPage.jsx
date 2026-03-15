import { useState, useEffect, useMemo } from "react";
import {
  collection, query, where, orderBy, getDocs,
  doc, getDoc, updateDoc, Timestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase/firebaseConfig";
import { useAuth } from "../context/AuthContext";
import "./CheckInPage.css";   // shared topnav-* classes
import "./DashboardPage.css";

// ── Icons ─────────────────────────────────────────────────────────────────────
const LogoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const CheckInIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12l7 7 7-7" />
  </svg>
);

// ── Library Catalog ────────────────────────────────────────────────────────────
const CATALOG = [
  { id: "book-1",  title: "Calculus: Early Transcendentals",           author: "James Stewart" },
  { id: "book-2",  title: "Principles of Economics",                   author: "N. Gregory Mankiw" },
  { id: "book-3",  title: "Campbell Biology",                          author: "Lisa Urry, Michael Cain, Steven Wasserman, Peter Minorsky & Jane Reece" },
  { id: "book-4",  title: "Introduction to Algorithms",                author: "Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest & Clifford Stein" },
  { id: "book-5",  title: "The Norton Anthology of English Literature",author: "Stephen Greenblatt (Editor)" },
  { id: "book-6",  title: "Organic Chemistry",                         author: "David Klein" },
  { id: "book-7",  title: "Psychology",                                author: "David G. Myers & C. Nathan DeWall" },
  { id: "book-8",  title: "A History of Western Art",                  author: "Laurie Schneider Adams" },
  { id: "book-9",  title: "Molecular Biology of the Cell",             author: "Bruce Alberts, et al." },
  { id: "book-10", title: "The Sociological Imagination",              author: "C. Wright Mills" },
];

// Seed data — used only on first load when user has no borrowedBooks
function makeSeed() {
  const ago = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return Timestamp.fromDate(d); };
  const fromNow = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return Timestamp.fromDate(d); };
  return [
    { id: "book-1",  status: "borrowed", dateBorrowed: ago(5),  dueDate: fromNow(9),  returnedAt: null },
    { id: "book-2",  status: "borrowed", dateBorrowed: ago(3),  dueDate: fromNow(11), returnedAt: null },
    { id: "book-3",  status: "overdue",  dateBorrowed: ago(28), dueDate: ago(14),     returnedAt: null },
    { id: "book-4",  status: "borrowed", dateBorrowed: ago(10), dueDate: fromNow(4),  returnedAt: null },
    { id: "book-5",  status: "overdue",  dateBorrowed: ago(22), dueDate: ago(8),      returnedAt: null },
    { id: "book-8",  status: "returned", dateBorrowed: ago(60), dueDate: ago(46),     returnedAt: ago(47) },
    { id: "book-9",  status: "returned", dateBorrowed: ago(45), dueDate: ago(31),     returnedAt: ago(32) },
    { id: "book-10", status: "returned", dateBorrowed: ago(50), dueDate: ago(36),     returnedAt: ago(37) },
  ];
}

// ── Static content ─────────────────────────────────────────────────────────────
const ANNOUNCEMENTS = [
  {
    title: "Extended Hours: Finals Week",
    date: "Mar 10 – Mar 21",
    desc: "Library open until 9:00 PM during Finals Week. Plan your study sessions early.",
    tag: "Hours",
    color: "#1e3a8a",
  },
  {
    title: "New E-Resources Available",
    date: "Effective March 2026",
    desc: "Expanded collection of e-journals including JSTOR, Scopus, and ProQuest — now accessible via NEU Portal.",
    tag: "Resources",
    color: "#16a34a",
  },
  {
    title: "Book Return Reminder",
    date: "Ongoing",
    desc: "Return borrowed books by their due date. Renewals available at the circulation desk.",
    tag: "Reminder",
    color: "#dc2626",
  },
];

const TIPS = [
  { icon: "🤫", text: "Please maintain silence in the reading and reference sections." },
  { icon: "📱", text: "Mobile phones on silent mode. Take calls outside the library." },
  { icon: "🍽️", text: "No food or drinks allowed inside the library premises." },
  { icon: "💡", text: "Use subject catalog terminals to locate books quickly." },
  { icon: "🔒", text: "The library is not responsible for lost personal items." },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

function getDaysUntilDue(ts) {
  if (!ts) return null;
  const due = ts.toDate ? ts.toDate() : new Date(ts);
  return Math.ceil((due - new Date()) / (1000 * 60 * 60 * 24));
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [logs, setLogs] = useState([]);
  const [borrowedRecords, setBorrowedRecords] = useState([]); // stored on user doc
  const [loading, setLoading] = useState(true);
  const [showCatalog, setShowCatalog] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    async function loadData() {
      try {
        // Load visit logs
        const logsSnap = await getDocs(
          query(
            collection(db, "logs"),
            where("uid", "==", currentUser.uid),
            orderBy("timestamp", "desc"),
          )
        );
        setLogs(logsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // Load borrowedBooks from user document (no subcollection — avoids rules issues)
        const userSnap = await getDoc(doc(db, "users", currentUser.uid));
        let records = userSnap.data()?.borrowedBooks ?? [];

        // Seed on first load
        if (records.length === 0) {
          records = makeSeed();
          await updateDoc(doc(db, "users", currentUser.uid), { borrowedBooks: records });
        }

        setBorrowedRecords(records);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currentUser]);

  // Merge catalog info into borrowed records for display
  const borrowedBooks = useMemo(() => {
    const statusOrder = { overdue: 0, borrowed: 1, returned: 2 };
    return borrowedRecords
      .map(rec => {
        const cat = CATALOG.find(c => c.id === rec.id) ?? {};
        return { ...rec, ...cat };
      })
      .sort((a, b) => (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3));
  }, [borrowedRecords]);

  // Books available to borrow (not currently borrowed/overdue)
  const activeBorrowedIds = useMemo(
    () => new Set(borrowedRecords.filter(r => r.status !== "returned").map(r => r.id)),
    [borrowedRecords]
  );
  const availableCatalog = CATALOG.filter(c => !activeBorrowedIds.has(c.id));

  // Computed stats
  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisMonth = logs.filter(l => {
      const ts = l.timestamp?.toDate?.() ?? new Date(l.timestamp);
      return ts >= monthStart;
    }).length;

    const tally = {};
    logs.forEach(l => { tally[l.reason] = (tally[l.reason] || 0) + 1; });
    const topReason = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

    const visitDays = new Set(logs.map(l => {
      const d = l.timestamp?.toDate?.() ?? new Date(l.timestamp);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }));
    let streak = 0;
    const cursor = new Date(now);
    while (true) {
      const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
      if (visitDays.has(key)) { streak++; cursor.setDate(cursor.getDate() - 1); }
      else break;
    }

    return { thisMonth, topReason, streak, total: logs.length };
  }, [logs]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleLogout = async () => { await logout(); navigate("/"); };

  const handleBorrowBook = async (catalogId) => {
    const fromNow14 = new Date(); fromNow14.setDate(fromNow14.getDate() + 14);
    const newRecord = {
      id: catalogId,
      status: "borrowed",
      dateBorrowed: Timestamp.now(),
      dueDate: Timestamp.fromDate(fromNow14),
      returnedAt: null,
    };
    const updated = [...borrowedRecords, newRecord];
    try {
      await updateDoc(doc(db, "users", currentUser.uid), { borrowedBooks: updated });
      setBorrowedRecords(updated);
    } catch (err) {
      console.error("Borrow failed:", err);
    }
  };

  const handleReturnBook = async (catalogId) => {
    const now = Timestamp.now();
    const updated = borrowedRecords.map(b =>
      b.id === catalogId ? { ...b, status: "returned", returnedAt: now } : b
    );
    try {
      await updateDoc(doc(db, "users", currentUser.uid), { borrowedBooks: updated });
      setBorrowedRecords(updated);
    } catch (err) {
      console.error("Return failed:", err);
    }
  };

  // ── Derived display values ─────────────────────────────────────────────────
  const firstName = userProfile?.fullName?.split(" ")[0] || currentUser?.email;
  const initial = (userProfile?.fullName?.[0] ?? currentUser?.email?.[0] ?? "?").toUpperCase();
  const memberSince = userProfile?.createdAt
    ? (userProfile.createdAt.toDate?.() ?? new Date(userProfile.createdAt))
        .toLocaleDateString("en-PH", { month: "long", year: "numeric" })
    : "—";
  const activeBooks = borrowedBooks.filter(b => b.status !== "returned").length;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="dash-layout">
        <nav className="checkin-topnav">
          <div className="topnav-brand">
            <img src="/neu-logo.png" className="topnav-logo" alt="NEU Logo" />
            <div className="topnav-brand-text">
              <span className="topnav-label-top">NEU PORTAL</span>
              <span className="topnav-label-bot">Library Log</span>
            </div>
          </div>
        </nav>
        <div className="dash-loading">
          <span className="loading-spinner" />
          Loading your dashboard…
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="dash-layout">

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
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="Profile"
                className="topnav-avatar-photo" referrerPolicy="no-referrer" />
            ) : (
              <div className="topnav-avatar">{initial}</div>
            )}
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

      {/* ── Main ── */}
      <main className="dash-main">

        {/* Hero */}
        <div className="dash-hero">
          <div className="dash-hero-orb dash-hero-orb--1" />
          <div className="dash-hero-orb dash-hero-orb--2" />
          <div className="dash-hero-orb dash-hero-orb--3" />
          <div className="dash-hero-left">
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="Profile"
                className="dash-hero-avatar-img" referrerPolicy="no-referrer" />
            ) : (
              <div className="dash-hero-avatar">{initial}</div>
            )}
            <div className="dash-hero-info">
              <div className="dash-hero-type-badge">{userProfile?.userType || "user"}</div>
              <h1 className="dash-hero-name">{userProfile?.fullName || firstName}</h1>
              <p className="dash-hero-meta">
                {userProfile?.college_office}
                <span className="dash-hero-meta-dot">·</span>
                Member since {memberSince}
              </p>
            </div>
          </div>
          <div className="dash-hero-right">
            <div className="dash-hero-email">{currentUser?.email}</div>
            <button className="dash-checkin-btn" onClick={() => navigate("/checkin")}>
              <CheckInIcon /> New Check-In
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="dash-stats-row">
          <div className="dash-stat-card">
            <div className="dash-stat-icon-wrap dash-stat-icon-wrap--blue">📅</div>
            <div className="dash-stat-body">
              <span className="dash-stat-value">{stats.thisMonth}</span>
              <span className="dash-stat-label">Visits This Month</span>
            </div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-icon-wrap dash-stat-icon-wrap--gold">🏆</div>
            <div className="dash-stat-body">
              <span className="dash-stat-value dash-stat-value--sm">{stats.topReason}</span>
              <span className="dash-stat-label">Top Visit Reason</span>
            </div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-icon-wrap dash-stat-icon-wrap--red">🔥</div>
            <div className="dash-stat-body">
              <span className="dash-stat-value">{stats.streak}</span>
              <span className="dash-stat-label">Day Visit Streak</span>
            </div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-icon-wrap dash-stat-icon-wrap--purple">📊</div>
            <div className="dash-stat-body">
              <span className="dash-stat-value">{stats.total}</span>
              <span className="dash-stat-label">Total Visits</span>
            </div>
          </div>
        </div>

        {/* Two-column grid */}
        <div className="dash-grid">

          {/* LEFT */}
          <div className="dash-col-main">

            {/* Books Borrowed */}
            <section className="dash-card">
              <div className="dash-card-header">
                <div className="dash-card-title-group">
                  <h2 className="dash-card-title">Books Borrowed</h2>
                  <p className="dash-card-subtitle">Your borrowed items from the library</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span className="dash-card-badge">{activeBooks} active</span>
                  <button className="dash-borrow-trigger" onClick={() => setShowCatalog(v => !v)}>
                    {showCatalog ? "Hide Catalog" : "+ Borrow a Book"}
                  </button>
                </div>
              </div>

              {/* Borrow catalog — toggled inline */}
              {showCatalog && (
                <div className="dash-catalog">
                  <p className="dash-catalog-label">Library Catalog — select a book to borrow (14-day loan)</p>
                  {availableCatalog.length === 0 ? (
                    <p className="dash-empty" style={{ padding: "0.75rem 0" }}>
                      You have all available books borrowed!
                    </p>
                  ) : (
                    <ul className="dash-catalog-list">
                      {availableCatalog.map(book => (
                        <li key={book.id} className="dash-catalog-item">
                          <div className="dash-catalog-info">
                            <span className="dash-catalog-title">📖 {book.title}</span>
                            <span className="dash-catalog-author">by {book.author}</span>
                          </div>
                          <button
                            className="dash-borrow-btn"
                            onClick={() => { handleBorrowBook(book.id); setShowCatalog(false); }}
                          >
                            Borrow
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {borrowedBooks.length === 0 ? (
                <p className="dash-empty">No borrowed books yet. Click "+ Borrow a Book" to get started.</p>
              ) : (
                <div className="dash-books-list">
                  {borrowedBooks.map(book => {
                    const daysLeft = book.status === "borrowed" ? getDaysUntilDue(book.dueDate) : null;
                    return (
                      <div key={book.id} className={`dash-book-item dash-book-item--${book.status}`}>
                        <div className="dash-book-spine" />
                        <div className="dash-book-icon-wrap">📖</div>
                        <div className="dash-book-info">
                          <span className="dash-book-title">{book.title}</span>
                          <span className="dash-book-author">by {book.author}</span>
                          <div className="dash-book-dates">
                            <span>Borrowed: {fmtDate(book.dateBorrowed)}</span>
                            <span className={book.status === "overdue" ? "dash-book-due--overdue" : ""}>
                              {book.status === "returned"
                                ? `Returned: ${fmtDate(book.returnedAt)}`
                                : `Due: ${fmtDate(book.dueDate)}`}
                            </span>
                          </div>
                        </div>
                        <div className="dash-book-status-wrap">
                          {book.status === "overdue" && (
                            <>
                              <span className="dash-status-pill dash-status-pill--overdue">⚠ Overdue</span>
                              <button className="dash-return-btn" onClick={() => handleReturnBook(book.id)}>
                                Mark Returned
                              </button>
                            </>
                          )}
                          {book.status === "borrowed" && (
                            <>
                              <span className="dash-status-pill dash-status-pill--borrowed">
                                Due in {daysLeft}d
                              </span>
                              <button className="dash-return-btn" onClick={() => handleReturnBook(book.id)}>
                                Mark Returned
                              </button>
                            </>
                          )}
                          {book.status === "returned" && (
                            <span className="dash-status-pill dash-status-pill--returned">✓ Returned</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Visit History */}
            <section className="dash-card">
              <div className="dash-card-header">
                <div className="dash-card-title-group">
                  <h2 className="dash-card-title">Visit History</h2>
                  <p className="dash-card-subtitle">Your recent library check-ins</p>
                </div>
                <span className="dash-card-badge">{logs.length} total</span>
              </div>

              {logs.length === 0 ? (
                <p className="dash-empty">No visits recorded yet. Check in to get started!</p>
              ) : (
                <div className="dash-visits-list">
                  {logs.slice(0, 8).map((log, i) => {
                    const ts = log.timestamp?.toDate?.() ?? new Date(log.timestamp);
                    const reasonColors = {
                      "Reading": "#3b82f6", "Research": "#8b5cf6",
                      "Use of Computer": "#06b6d4", "Studying": "#f59e0b",
                      "Borrowing/Returning Books": "#22c55e", "Other": "#64748b",
                    };
                    return (
                      <div key={log.id} className="dash-visit-row">
                        <div className="dash-visit-line-wrap">
                          <div className="dash-visit-dot"
                            style={{ background: reasonColors[log.reason] ?? "#94a3b8" }} />
                          {i < Math.min(logs.length, 8) - 1 && <div className="dash-visit-connector" />}
                        </div>
                        <div className="dash-visit-body">
                          <span className="dash-visit-reason">{log.reason}</span>
                          <span className="dash-visit-time">
                            {ts.toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                            {" · "}
                            {ts.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {logs.length > 8 && (
                    <p className="dash-visits-more">
                      + {logs.length - 8} earlier visit{logs.length - 8 > 1 ? "s" : ""} not shown
                    </p>
                  )}
                </div>
              )}
            </section>

          </div>

          {/* RIGHT */}
          <div className="dash-col-side">

            <section className="dash-card">
              <div className="dash-card-header">
                <div className="dash-card-title-group">
                  <h2 className="dash-card-title">Announcements</h2>
                  <p className="dash-card-subtitle">From the Library Administration</p>
                </div>
              </div>
              <div className="dash-ann-list">
                {ANNOUNCEMENTS.map((ann, i) => (
                  <div key={i} className="dash-ann-item">
                    <div className="dash-ann-header">
                      <span className="dash-ann-tag" style={{
                        background: ann.color + "18", color: ann.color,
                        border: `1px solid ${ann.color}30`,
                      }}>{ann.tag}</span>
                      <span className="dash-ann-date">{ann.date}</span>
                    </div>
                    <p className="dash-ann-title">{ann.title}</p>
                    <p className="dash-ann-desc">{ann.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="dash-card dash-card--tips">
              <div className="dash-card-header">
                <div className="dash-card-title-group">
                  <h2 className="dash-card-title">Library Tips</h2>
                  <p className="dash-card-subtitle">Good habits for every visitor</p>
                </div>
              </div>
              <ul className="dash-tips-list">
                {TIPS.map((tip, i) => (
                  <li key={i} className="dash-tip-item">
                    <span className="dash-tip-icon">{tip.icon}</span>
                    <span className="dash-tip-text">{tip.text}</span>
                  </li>
                ))}
              </ul>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}
