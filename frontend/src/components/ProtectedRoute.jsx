import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  import { isLoggedIn } from "../utils/auth";

if (!isLoggedIn()) {
  return <Navigate to="/" replace />;
}
  if (!token) {
    // not logged in → send to login
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;