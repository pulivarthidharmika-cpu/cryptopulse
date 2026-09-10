import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, adminOnly = false }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // No login token
  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // Admin-only route
  if (adminOnly && role !== "admin") {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;