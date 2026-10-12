import { useEffect, lazy, Suspense } from "react";
import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Eager public pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Lazy-loaded app pages for instant route transitions & code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Analytics = lazy(() => import("./pages/Analytics"));
const CoinComparison = lazy(() => import("./pages/CoinComparison"));
const Settings = lazy(() => import("./pages/Settings"));
const Alerts = lazy(() => import("./pages/Alerts"));
const Admin = lazy(() => import("./pages/Admin"));

// Components
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

const PageLoader = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", color: "#64748b" }}>
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          width: "36px",
          height: "36px",
          border: "3px solid #3b82f6",
          borderTopColor: "transparent",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto 12px auto",
        }}
      />
      <span style={{ fontSize: "0.9rem" }}>Loading page...</span>
    </div>
  </div>
);

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);

    const handleStorage = () => {
      const current = localStorage.getItem("theme") || "light";
      document.documentElement.setAttribute("data-theme", current);
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>

        {/* ========================================= */}
        {/* PUBLIC PAGES */}
        {/* ========================================= */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />


        {/* ========================================= */}
        {/* PROTECTED APPLICATION */}
        {/* ========================================= */}

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/analytics"
            element={<Analytics />}
          />

          <Route
            path="/comparison"
            element={<CoinComparison />}
          />

          <Route
            path="/alerts"
            element={<Alerts />}
          />

          <Route
            path="/settings"
            element={<Settings />}
          />

        </Route>


        {/* ========================================= */}
        {/* ADMIN PAGE */}
        {/* ========================================= */}

        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <Admin />
            </ProtectedRoute>
          }
        />


      {/* ========================================= */}
      {/* UNKNOWN ROUTES */}
      {/* ========================================= */}

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />

      </Routes>
    </Suspense>
  );
}

export default App;