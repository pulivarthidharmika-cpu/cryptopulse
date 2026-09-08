import { NavLink } from "react-router-dom";

function Sidebar({ isOpen, onClose }) {

  const menuItems = [
    {
      path: "/dashboard",
      icon: "▣",
      label: "Dashboard",
    },
    {
      path: "/analytics",
      icon: "◫",
      label: "Analytics",
    },
    {
      path: "/alerts",
      icon: "◉",
      label: "Alerts",
    },
    {
      path: "/settings",
      icon: "⚙",
      label: "Settings",
    },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
        />
      )}

      <aside
        className={`sidebar ${
          isOpen ? "sidebar-open" : ""
        }`}
      >

        {/* ================= HEADER ================= */}

        <div className="sidebar-header">

          <div className="sidebar-logo">
            ₿
          </div>

          <div>
            <h2>CryptoPulse</h2>
            <p>Crypto Intelligence</p>
          </div>

          <button
            className="close-sidebar"
            onClick={onClose}
          >
            ×
          </button>

        </div>


        {/* ================= NAVIGATION ================= */}

        <nav className="sidebar-nav">

          <p className="nav-title">
            MAIN MENU
          </p>

          {menuItems.map((item) => (

            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar-link ${
                  isActive ? "active" : ""
                }`
              }
            >

              <span className="sidebar-icon">
                {item.icon}
              </span>

              <span>
                {item.label}
              </span>

            </NavLink>

          ))}

        </nav>


        {/* ================= BOTTOM ================= */}

        <div className="sidebar-bottom">

          <div className="market-status">

            <div className="market-status-top">

              <span className="status-indicator"></span>

              <span>
                Market Status
              </span>

            </div>

            <strong>
              Live & Connected
            </strong>

            <p>
              Real-time crypto data
            </p>

          </div>

          <div className="sidebar-version">
            CryptoPulse v1.0
          </div>

        </div>

      </aside>


      <style>
        {`

          /* ================= SIDEBAR ================= */

          .sidebar {
            position: fixed;

            top: 78px;
            left: 0;
            bottom: 0;

            width: 250px;

            display: flex;
            flex-direction: column;

            padding: 24px 16px;

            background: var(--sidebar-bg);

            color: var(--sidebar-text);

            box-shadow:
              8px 0 30px
              var(--sidebar-shadow);

            border-right:
              1px solid var(--sidebar-border);

            z-index: 900;

            overflow-y: auto;

            transition:
              transform 0.3s ease,
              background 0.3s ease,
              color 0.3s ease,
              border-color 0.3s ease,
              box-shadow 0.3s ease;
          }


          /* ================= HEADER ================= */

          .sidebar-header {
            display: flex;
            align-items: center;

            gap: 11px;

            padding:
              5px 8px 25px;

            border-bottom:
              1px solid var(--sidebar-divider);
          }


          .sidebar-logo {
            width: 42px;
            height: 42px;

            display: flex;
            align-items: center;
            justify-content: center;

            flex-shrink: 0;

            border-radius: 12px;

            background:
              linear-gradient(
                135deg,
                #38bdf8,
                #2563eb
              );

            color: white;

            font-size: 23px;
            font-weight: 800;

            box-shadow:
              0 7px 20px
              rgba(56, 189, 248, 0.25);
          }


          .sidebar-header h2 {
            margin: 0;

            color: var(--sidebar-text);

            font-size: 16px;
            font-weight: 800;
          }


          .sidebar-header p {
            margin: 3px 0 0;

            color: var(--sidebar-muted);

            font-size: 10px;
          }


          .close-sidebar {
            display: none;

            margin-left: auto;

            border: none;

            background: transparent;

            color: var(--sidebar-text);

            font-size: 25px;

            cursor: pointer;
          }


          /* ================= NAV ================= */

          .sidebar-nav {
            flex: 1;

            padding-top: 25px;
          }


          .nav-title {
            margin:
              0 10px 12px;

            color: var(--sidebar-muted);

            font-size: 10px;
            font-weight: 700;

            letter-spacing: 1px;
          }


          .sidebar-link {
            position: relative;

            display: flex;
            align-items: center;

            gap: 14px;

            width: 100%;

            margin-bottom: 7px;

            padding: 13px 14px;

            box-sizing: border-box;

            border-radius: 12px;

            color: var(--sidebar-link);

            text-decoration: none;

            font-size: 14px;
            font-weight: 600;

            transition:
              background 0.2s ease,
              color 0.2s ease,
              transform 0.2s ease;
          }


          .sidebar-link:hover {
            color: var(--sidebar-link-hover);

            background:
              var(--sidebar-hover);

            transform:
              translateX(3px);
          }


          .sidebar-link.active {
            color: var(--sidebar-active-text);

            background:
              var(--sidebar-active-bg);

            box-shadow:
              inset 3px 0 0 #2563eb;
          }


          .sidebar-icon {
            width: 25px;

            display: flex;
            justify-content: center;

            font-size: 17px;
          }


          /* ================= BOTTOM ================= */

          .sidebar-bottom {
            padding-top: 20px;
          }


          .market-status {
            padding: 15px;

            border-radius: 14px;

            background:
              var(--status-bg);

            border:
              1px solid var(--status-border);
          }


          .market-status-top {
            display: flex;
            align-items: center;

            gap: 8px;

            color:
              var(--status-muted);

            font-size: 11px;
            font-weight: 600;
          }


          .status-indicator {
            width: 7px;
            height: 7px;

            border-radius: 50%;

            background: #22c55e;

            box-shadow:
              0 0 9px
              rgba(34, 197, 94, 0.8);
          }


          .market-status strong {
            display: block;

            margin-top: 9px;

            color: var(--sidebar-text);

            font-size: 12px;
          }


          .market-status p {
            margin: 4px 0 0;

            color:
              var(--status-muted);

            font-size: 10px;
          }


          .sidebar-version {
            padding-top: 15px;

            text-align: center;

            color:
              var(--sidebar-version);

            font-size: 9px;
          }


          /* ================= OVERLAY ================= */

          .sidebar-overlay {
            display: none;
          }


          /* ================= LIGHT THEME ================= */

          :root,
          :root[data-theme="light"] {

            --sidebar-bg:
              linear-gradient(
                180deg,
                #ffffff 0%,
                #f8fbff 100%
              );

            --sidebar-text: #172554;

            --sidebar-muted: #64748b;

            --sidebar-link: #475569;

            --sidebar-link-hover: #172554;

            --sidebar-hover: #eff6ff;

            --sidebar-active-text: #1d4ed8;

            --sidebar-active-bg: #dbeafe;

            --sidebar-divider:
              #e2e8f0;

            --sidebar-border:
              #e2e8f0;

            --sidebar-shadow:
              rgba(30, 64, 175, 0.08);

            --status-bg:
              #f1f5f9;

            --status-border:
              #e2e8f0;

            --status-muted:
              #64748b;

            --sidebar-version:
              #94a3b8;
          }


          /* ================= DARK THEME ================= */

          :root[data-theme="dark"] {

            --sidebar-bg:
              linear-gradient(
                180deg,
                #0f2d6b 0%,
                #102b63 55%,
                #0b2250 100%
              );

            --sidebar-text: #ffffff;

            --sidebar-muted:
              rgba(255, 255, 255, 0.55);

            --sidebar-link:
              rgba(255, 255, 255, 0.68);

            --sidebar-link-hover: #ffffff;

            --sidebar-hover:
              rgba(255, 255, 255, 0.08);

            --sidebar-active-text: #ffffff;

            --sidebar-active-bg:
              linear-gradient(
                90deg,
                rgba(56, 189, 248, 0.25),
                rgba(37, 99, 235, 0.18)
              );

            --sidebar-divider:
              rgba(255, 255, 255, 0.1);

            --sidebar-border:
              rgba(255, 255, 255, 0.05);

            --sidebar-shadow:
              rgba(15, 45, 107, 0.16);

            --status-bg:
              rgba(255, 255, 255, 0.07);

            --status-border:
              rgba(255, 255, 255, 0.08);

            --status-muted:
              rgba(255, 255, 255, 0.5);

            --sidebar-version:
              rgba(255, 255, 255, 0.3);
          }


          /* ================= SYSTEM ================= */

          :root[data-theme="system"] {

            --sidebar-bg:
              linear-gradient(
                180deg,
                #ffffff 0%,
                #f8fbff 100%
              );

            --sidebar-text: #172554;

            --sidebar-muted: #64748b;

            --sidebar-link: #475569;

            --sidebar-link-hover: #172554;

            --sidebar-hover: #eff6ff;

            --sidebar-active-text: #1d4ed8;

            --sidebar-active-bg: #dbeafe;

            --sidebar-divider:
              #e2e8f0;

            --sidebar-border:
              #e2e8f0;

            --sidebar-shadow:
              rgba(30, 64, 175, 0.08);

            --status-bg: #f1f5f9;

            --status-border: #e2e8f0;

            --status-muted: #64748b;

            --sidebar-version: #94a3b8;
          }


          /* ================= MOBILE ================= */

          @media (max-width: 768px) {

            .sidebar {
              transform:
                translateX(-100%);

              width: 270px;
            }

            .sidebar.sidebar-open {
              transform:
                translateX(0);
            }

            .close-sidebar {
              display: block;
            }

            .sidebar-overlay {
              display: block;

              position: fixed;

              inset: 78px 0 0;

              background:
                rgba(0, 0, 0, 0.45);

              z-index: 899;
            }

          }

        `}
      </style>

    </>
  );
}

export default Sidebar;