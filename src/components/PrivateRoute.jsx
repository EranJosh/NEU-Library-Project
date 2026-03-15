import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Wraps a route and enforces:
 *  1. User must be signed in
 *  2. If adminOnly=true, user must have role === "admin"
 *  Blocked users are handled per-page (CheckInPage shows Access Denied).
 */
export default function PrivateRoute({ children, adminOnly = false }) {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#0d1b4b", fontSize: "1rem" }}>Loading…</span>
      </div>
    );
  }

  if (!currentUser) return <Navigate to="/" replace />;

  if (adminOnly && userProfile?.role !== "admin") {
    return <Navigate to="/checkin" replace />;
  }

  return children;
}
