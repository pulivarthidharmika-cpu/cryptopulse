import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";

function Layout() {
  const navigate = useNavigate();

  const [showLogoutModal, setShowLogoutModal] =
    useState(false);

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  // Get logged-in user's role
  const role = localStorage.getItem("role");

  // --------------------------------------------------
  // Logout
  // --------------------------------------------------

  const handleLogout = () => {
    localStorage.setItem(
      "loggedOut",
      "true"
    );

    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("profileName");

    setShowLogoutModal(false);

    navigate("/login");
  };

  return (
    <div style={styles.container}>

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="layout-sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ================================================== */}
      {/* SIDEBAR */}
      {/* ================================================== */}

      <aside
        style={styles.sidebar}
        className={`layout-sidebar ${
          sidebarOpen ? "open" : ""
        }`}
      >

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

            <button
              className="layout-sidebar-close"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              ✕
            </button>

          </div>


          {/* Divider */}

          <div style={styles.divider}></div>


          {/* Navigation */}

          <nav style={styles.nav}>

            {/* Dashboard */}

            <NavLink
              to="/dashboard"
              onClick={() => setSidebarOpen(false)}
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


            {/* Analytics */}

            <NavLink
              to="/analytics"
              onClick={() => setSidebarOpen(false)}
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


            {/* Alerts */}

            <NavLink
              to="/alerts"
              onClick={() => setSidebarOpen(false)}
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


            {/* Settings */}

            <NavLink
              to="/settings"
              onClick={() => setSidebarOpen(false)}
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


            {/* ================================================== */}
            {/* ADMIN PANEL */}
            {/* Only visible to admin */}
            {/* ================================================== */}

            {role === "admin" && (

              <NavLink
                to="/admin"
                onClick={() => setSidebarOpen(false)}
                style={({ isActive }) => ({
                  ...styles.link,
                  ...(isActive
                    ? styles.activeLink
                    : {}),
                })}
              >
                <span>♛</span>
                Admin Panel
              </NavLink>

            )}

          </nav>

        </div>


        {/* ================================================== */}
        {/* SIDEBAR BOTTOM */}
        {/* ================================================== */}

        <div>

          {/* System Status */}

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


          {/* Logout */}

          <button
            onClick={() =>
              setShowLogoutModal(true)
            }
            style={styles.logout}
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </aside>


      {/* ================================================== */}
      {/* MAIN AREA */}
      {/* ================================================== */}

      <div
        style={styles.main}
        className="layout-main"
      >

        {/* Header */}

        <header
          style={styles.header}
          className="layout-header"
        >

          <div className="layout-header-left">

            <button
              className="layout-menu-button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              ☰
            </button>

            <div>

              <span
                style={styles.headerTitle}
                className="layout-header-title"
              >
                CryptoPulse Monitoring System
              </span>

              <span
                style={styles.headerSubtext}
                className="layout-header-subtext"
              >
                Real-time cryptocurrency intelligence
              </span>

            </div>

          </div>


          {/* Live Status */}

          <div
            style={styles.headerStatus}
            className="layout-header-status"
          >

            <span style={styles.statusDot}></span>

            Live

          </div>

        </header>


        {/* Page Content */}

        <main
          style={styles.content}
          className="layout-content"
        >
          <Outlet />
        </main>

      </div>


      {/* ================================================== */}
      {/* LOGOUT CONFIRMATION MODAL */}
      {/* ================================================== */}

      {showLogoutModal && (

        <div style={styles.modalOverlay}>

          <div style={styles.modal}>

            {/* Modal Icon */}

            <div style={styles.modalIcon}>
              ↪
            </div>


            {/* Title */}

            <h2 style={styles.modalTitle}>
              Confirm Logout
            </h2>


            {/* Message */}

            <p style={styles.modalText}>
              Are you sure you want to logout
              from CryptoPulse?
            </p>


            {/* Buttons */}

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


      {/* ================================================== */}
      {/* RESPONSIVE STYLES */}
      {/* ================================================== */}

      <style>
        {`
          .layout-menu-button {
            display: none;
            background: transparent;
            border: none;
            font-size: 24px;
            color: #172554;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 6px;
            margin-right: 12px;
          }

          .layout-sidebar-close {
            display: none;
            background: transparent;
            border: none;
            font-size: 20px;
            color: #93c5fd;
            cursor: pointer;
            padding: 4px 8px;
            margin-left: auto;
          }

          .layout-sidebar-backdrop {
            display: none;
          }

          .layout-header-left {
            display: flex;
            align-items: center;
          }

          @media (max-width: 768px) {

            .layout-menu-button {
              display: inline-flex;
              align-items: center;
              justify-content: center;
            }

            .layout-sidebar-close {
              display: block;
            }

            .layout-sidebar-backdrop {
              display: block;
              position: fixed;
              inset: 0;
              background: rgba(2, 6, 23, 0.6);
              backdrop-filter: blur(4px);
              z-index: 998;
            }

            .layout-sidebar {
              position: fixed !important;
              top: 0 !important;
              bottom: 0 !important;
              left: 0 !important;
              z-index: 999 !important;
              transform: translateX(-100%);
              transition:
                transform 0.3s
                cubic-bezier(0.4, 0, 0.2, 1);
              box-shadow:
                10px 0 40px
                rgba(0, 0, 0, 0.4) !important;
            }

            .layout-sidebar.open {
              transform: translateX(0) !important;
            }

            .layout-header {
              padding: 0 16px !important;
              height: 65px !important;
            }

            .layout-header-title {
              font-size: 15px !important;
            }

            .layout-header-subtext {
              display: none !important;
            }

            .layout-content {
              min-height:
                calc(100vh - 65px) !important;
            }
          }
        `}
      </style>

    </div>
  );
}


/* ================================================== */
/* STYLES */
/* ================================================== */

const styles = {

  /* -------------------------------------------------- */
  /* Main Container */
  /* -------------------------------------------------- */

  container: {
    minHeight: "100vh",

    display: "flex",

    background:
      "linear-gradient(135deg, #eff6ff, #dbeafe)",

    fontFamily:
      "Inter, Arial, Helvetica, sans-serif",
  },


  /* -------------------------------------------------- */
  /* Sidebar */
  /* -------------------------------------------------- */

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


  /* -------------------------------------------------- */
  /* Logo */
  /* -------------------------------------------------- */

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


  /* -------------------------------------------------- */
  /* Divider */
  /* -------------------------------------------------- */

  divider: {
    height: "1px",

    background:
      "rgba(255,255,255,0.1)",

    margin:
      "30px 8px 22px",
  },


  /* -------------------------------------------------- */
  /* Navigation */
  /* -------------------------------------------------- */

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


  /* -------------------------------------------------- */
  /* System Status */
  /* -------------------------------------------------- */

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


  /* -------------------------------------------------- */
  /* Logout */
  /* -------------------------------------------------- */

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


  /* -------------------------------------------------- */
  /* Main */
  /* -------------------------------------------------- */

  main: {
    flex: 1,

    minWidth: 0,
  },


  /* -------------------------------------------------- */
  /* Header */
  /* -------------------------------------------------- */

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

    backdropFilter:
      "blur(12px)",
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


  /* -------------------------------------------------- */
  /* Content */
  /* -------------------------------------------------- */

  content: {
    minHeight:
      "calc(100vh - 75px)",
  },


  /* ================================================== */
  /* Logout Modal */
  /* ================================================== */

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