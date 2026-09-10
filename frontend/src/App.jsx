import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Alerts from "./pages/Alerts";
import Admin from "./pages/Admin";

// Components
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";


function App() {
  return (
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
  );
}

export default App;