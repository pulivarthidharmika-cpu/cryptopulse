import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";

function Layout() {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    localStorage.setItem("loggedOut", "true");

    localStorage.removeItem("token");
    localStorage.removeItem("role");

    setShowLogoutModal(false);

    navigate("/login");
  };

  return (
    <div style={styles.container}>

      {/* Sidebar */}

      <aside style={styles.sidebar}>

        <div>

          {/* Logo */}

          <div style={styles.logoArea}>

            <div style={styles.logo}>
              ₿
            </div>

            <div>
              <h2 style={styles.logoText}>
                CryptoPulse
              </h2>

              <span style={styles.logoSubtext}>
                Crypto Analytics
              </span>
            </div>

          </div>

          <div style={styles.divider}></div>

          {/* Navigation */}

          <nav style={styles.nav}>

            <NavLink
              to="/dashboard"
              style={({ isActive }) => ({
                ...styles.link,
                ...(isActive
                  ? styles.activeLink
                  : {}),
              })}
            >
              <span>▣</span>
              Dashboard
            </NavLink>

            <NavLink
              to="/analytics"
              style={({ isActive }) => ({
                ...styles.link,
                ...(isActive
                  ? styles.activeLink
                  : {}),
              })}
            >
              <span>◫</span>
              Analytics
            </NavLink>

            <NavLink
              to="/alerts"
              style={({ isActive }) => ({
                ...styles.link,
                ...(isActive
                  ? styles.activeLink
                  : {}),
              })}
            >
              <span>◉</span>
              Alerts
            </NavLink>

            <NavLink
              to="/settings"
              style={({ isActive }) => ({
                ...styles.link,
                ...(isActive
                  ? styles.activeLink
                  : {}),
              })}
            >
              <span>⚙</span>
              Settings
            </NavLink>

          </nav>

        </div>

        {/* Sidebar Bottom */}

        <div>

          <div style={styles.systemStatus}>

            <span style={styles.statusDot}></span>

            <div>
              <strong style={styles.statusTitle}>
                System Online
              </strong>

              <span style={styles.statusText}>
                API Connected
              </span>
            </div>

          </div>

          <button
            onClick={() => setShowLogoutModal(true)}
            style={styles.logout}
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </aside>

      {/* Main */}

      <div style={styles.main}>

        <header style={styles.header}>

          <div>

            <span style={styles.headerTitle}>
              CryptoPulse Monitoring System
            </span>

            <span style={styles.headerSubtext}>
              Real-time cryptocurrency intelligence
            </span>

          </div>

          <div style={styles.headerStatus}>

            <span style={styles.statusDot}></span>

            Live

          </div>

        </header>

        <main style={styles.content}>
          <Outlet />
        </main>

      </div>

      {/* Logout Confirmation */}

      {showLogoutModal && (

        <div style={styles.modalOverlay}>

          <div style={styles.modal}>

            <div style={styles.modalIcon}>
              ↪
            </div>

            <h2 style={styles.modalTitle}>
              Confirm Logout
            </h2>

            <p style={styles.modalText}>
              Are you sure you want to logout
              from CryptoPulse?
            </p>

            <div style={styles.modalButtons}>

              <button
                onClick={() =>
                  setShowLogoutModal(false)
                }
                style={styles.cancelButton}
              >
                Cancel
              </button>

              <button
                onClick={handleLogout}
                style={styles.confirmButton}
              >
                Yes, Logout
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

const styles = {

  container: {
    minHeight: "100vh",

    display: "flex",

    background:
      "linear-gradient(135deg, #eff6ff, #dbeafe)",

    fontFamily:
      "Inter, Arial, Helvetica, sans-serif",
  },

  sidebar: {
    width: "260px",

    minHeight: "100vh",

    boxSizing: "border-box",

    padding: "28px 18px",

    display: "flex",

    flexDirection: "column",

    justifyContent: "space-between",

    background:
      "linear-gradient(180deg, #071a3d, #0b2d63)",

    color: "white",

    boxShadow:
      "8px 0 30px rgba(15, 23, 42, 0.15)",
  },

  logoArea: {
    display: "flex",

    alignItems: "center",

    gap: "13px",

    padding: "0 8px",
  },

  logo: {
    width: "48px",
    height: "48px",

    borderRadius: "13px",

    display: "flex",

    justifyContent: "center",

    alignItems: "center",

    fontSize: "27px",

    fontWeight: "700",

    background:
      "linear-gradient(135deg, #2563eb, #38bdf8)",

    boxShadow:
      "0 8px 25px rgba(37,99,235,0.35)",
  },

  logoText: {
    margin: 0,

    fontSize: "22px",
  },

  logoSubtext: {
    display: "block",

    marginTop: "3px",

    color: "#93c5fd",

    fontSize: "12px",
  },

  divider: {
    height: "1px",

    background:
      "rgba(255,255,255,0.1)",

    margin: "30px 8px 22px",
  },

  nav: {
    display: "flex",

    flexDirection: "column",

    gap: "9px",
  },

  link: {
    display: "flex",

    alignItems: "center",

    gap: "13px",

    padding: "14px 15px",

    borderRadius: "10px",

    color: "#bfdbfe",

    textDecoration: "none",

    fontSize: "15px",

    fontWeight: "500",

    transition:
      "all 0.2s ease",
  },

  activeLink: {
    background:
      "linear-gradient(90deg, #2563eb, #1d4ed8)",

    color: "white",

    fontWeight: "700",

    boxShadow:
      "0 6px 20px rgba(37,99,235,0.3)",
  },

  systemStatus: {
    display: "flex",

    alignItems: "center",

    gap: "10px",

    padding: "14px",

    marginBottom: "15px",

    background:
      "rgba(255,255,255,0.06)",

    border:
      "1px solid rgba(255,255,255,0.08)",

    borderRadius: "10px",
  },

  statusDot: {
    width: "9px",

    height: "9px",

    borderRadius: "50%",

    backgroundColor: "#22c55e",

    boxShadow:
      "0 0 10px rgba(34,197,94,0.7)",

    display: "inline-block",
  },

  statusTitle: {
    display: "block",

    fontSize: "12px",
  },

  statusText: {
    display: "block",

    marginTop: "2px",

    fontSize: "11px",

    color: "#93c5fd",
  },

  logout: {
    width: "100%",

    padding: "13px",

    display: "flex",

    justifyContent: "center",

    alignItems: "center",

    gap: "9px",

    border:
      "1px solid rgba(255,255,255,0.12)",

    borderRadius: "9px",

    background:
      "rgba(255,255,255,0.07)",

    color: "#dbeafe",

    cursor: "pointer",

    fontSize: "14px",

    transition:
      "all 0.2s ease",
  },

  main: {
    flex: 1,

    minWidth: 0,
  },

  header: {
    height: "75px",

    boxSizing: "border-box",

    padding: "0 35px",

    display: "flex",

    justifyContent: "space-between",

    alignItems: "center",

    background:
      "rgba(255,255,255,0.75)",

    borderBottom:
      "1px solid rgba(59,130,246,0.12)",

    backdropFilter: "blur(12px)",
  },

  headerTitle: {
    display: "block",

    fontSize: "16px",

    fontWeight: "700",

    color: "#172554",
  },

  headerSubtext: {
    display: "block",

    marginTop: "3px",

    fontSize: "12px",

    color: "#64748b",
  },

  headerStatus: {
    display: "flex",

    alignItems: "center",

    gap: "8px",

    color: "#15803d",

    fontWeight: "600",

    fontSize: "13px",
  },

  content: {
    minHeight:
      "calc(100vh - 75px)",
  },

  /* Modal */

  modalOverlay: {
    position: "fixed",

    inset: 0,

    zIndex: 9999,

    display: "flex",

    justifyContent: "center",

    alignItems: "center",

    background:
      "rgba(2, 6, 23, 0.65)",

    backdropFilter:
      "blur(6px)",
  },

  modal: {
    width: "390px",

    maxWidth: "90%",

    padding: "32px",

    boxSizing: "border-box",

    borderRadius: "18px",

    background:
      "linear-gradient(145deg, #0f2d6b, #0b2250)",

    border:
      "1px solid rgba(147,197,253,0.2)",

    boxShadow:
      "0 25px 80px rgba(0,0,0,0.45)",

    textAlign: "center",

    color: "white",
  },

  modalIcon: {
    width: "55px",

    height: "55px",

    margin:
      "0 auto 18px",

    display: "flex",

    justifyContent: "center",

    alignItems: "center",

    borderRadius: "50%",

    background:
      "rgba(59,130,246,0.18)",

    color: "#60a5fa",

    fontSize: "25px",
  },

  modalTitle: {
    margin: 0,

    fontSize: "23px",
  },

  modalText: {
    margin:
      "10px 0 25px",

    color: "#bfdbfe",

    fontSize: "14px",

    lineHeight: "1.5",
  },

  modalButtons: {
    display: "flex",

    gap: "12px",

    justifyContent: "center",
  },

  cancelButton: {
    flex: 1,

    padding: "12px",

    border:
      "1px solid rgba(255,255,255,0.15)",

    borderRadius: "9px",

    background:
      "rgba(255,255,255,0.08)",

    color: "#dbeafe",

    cursor: "pointer",

    fontSize: "14px",

    fontWeight: "600",
  },

  confirmButton: {
    flex: 1,

    padding: "12px",

    border: "none",

    borderRadius: "9px",

    background:
      "linear-gradient(135deg, #2563eb, #0ea5e9)",

    color: "white",

    cursor: "pointer",

    fontSize: "14px",

    fontWeight: "700",

    boxShadow:
      "0 6px 20px rgba(37,99,235,0.3)",
  },
};

export default Layout;