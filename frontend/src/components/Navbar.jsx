import { useNavigate } from "react-router-dom";

function Navbar({ onMenuClick }) {
  const navigate = useNavigate();

  return (
    <header className="navbar">

      <div className="navbar-left">

        <button
          className="menu-button"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          ☰
        </button>

        <div
          className="navbar-brand"
          onClick={() => navigate("/dashboard")}
        >
          <div className="brand-logo">
            ₿
          </div>

          <div className="brand-text">
            <h2>CryptoPulse</h2>
            <span>Live Crypto Intelligence</span>
          </div>
        </div>

      </div>

      <div className="navbar-right">

        <div className="connection-status">
          <span className="status-dot"></span>
          <span>Live</span>
        </div>

        <button
          className="notification-button"
          onClick={() => navigate("/alerts")}
          aria-label="Alerts"
        >
          🔔
        </button>

        <button
          className="profile-button"
          onClick={() => navigate("/settings")}
          aria-label="Profile"
        >
          <span className="profile-icon">
            👤
          </span>
        </button>

      </div>

      <style>
        {`

          /* ================= NAVBAR ================= */

          .navbar {
            position: sticky;
            top: 0;
            z-index: 1000;

            height: 78px;

            display: flex;
            align-items: center;
            justify-content: space-between;

            padding: 0 30px;

            background: var(--navbar-bg);

            border-bottom:
              1px solid var(--navbar-border);

            backdrop-filter: blur(18px);

            box-shadow:
              0 4px 20px var(--navbar-shadow);

            transition:
              background 0.3s ease,
              border-color 0.3s ease,
              box-shadow 0.3s ease;
          }


          /* ================= LEFT ================= */

          .navbar-left {
            display: flex;
            align-items: center;
            gap: 18px;
          }


          .menu-button {
            display: none;

            border: none;
            background: transparent;

            color: var(--navbar-text);

            font-size: 25px;
            cursor: pointer;
          }


          .navbar-brand {
            display: flex;
            align-items: center;
            gap: 12px;

            cursor: pointer;
          }


          .brand-logo {
            width: 44px;
            height: 44px;

            display: flex;
            align-items: center;
            justify-content: center;

            border-radius: 13px;

            background:
              linear-gradient(
                135deg,
                #2563eb,
                #38bdf8
              );

            color: white;

            font-size: 25px;
            font-weight: 800;

            box-shadow:
              0 7px 18px
              rgba(37, 99, 235, 0.25);
          }


          .brand-text h2 {
            margin: 0;

            color: var(--navbar-text);

            font-size: 21px;
            font-weight: 800;
          }


          .brand-text span {
            display: block;

            margin-top: 2px;

            color: var(--navbar-muted);

            font-size: 10px;
            font-weight: 600;
          }


          /* ================= RIGHT ================= */

          .navbar-right {
            display: flex;
            align-items: center;
            gap: 15px;
          }


          .connection-status {
            display: flex;
            align-items: center;
            gap: 7px;

            padding: 7px 12px;

            border-radius: 20px;

            background: var(--connection-bg);

            color: #16a34a;

            font-size: 12px;
            font-weight: 700;
          }


          .status-dot {
            width: 7px;
            height: 7px;

            border-radius: 50%;

            background: #22c55e;

            box-shadow:
              0 0 9px
              rgba(34, 197, 94, 0.7);
          }


          .notification-button,
          .profile-button {
            width: 40px;
            height: 40px;

            display: flex;
            align-items: center;
            justify-content: center;

            border: 1px solid var(--button-border);

            border-radius: 12px;

            background: var(--button-bg);

            cursor: pointer;

            transition:
              transform 0.2s ease,
              background 0.2s ease,
              border-color 0.2s ease;
          }


          .notification-button:hover,
          .profile-button:hover {
            transform: translateY(-2px);

            background: var(--button-hover);
          }


          .notification-button {
            font-size: 17px;
          }


          .profile-icon {
            font-size: 17px;
          }


          /* ================= LIGHT THEME ================= */

          :root,
          :root[data-theme="light"] {

            --navbar-bg: rgba(255, 255, 255, 0.95);

            --navbar-border: rgba(59, 130, 246, 0.12);

            --navbar-shadow:
              rgba(30, 64, 175, 0.06);

            --navbar-text: #172554;

            --navbar-muted: #64748b;

            --connection-bg: #ecfdf5;

            --button-bg: #f8fafc;

            --button-border:
              rgba(59, 130, 246, 0.12);

            --button-hover: #eff6ff;
          }


          /* ================= DARK THEME ================= */

          :root[data-theme="dark"] {

            --navbar-bg: rgba(15, 23, 42, 0.96);

            --navbar-border:
              rgba(148, 163, 184, 0.15);

            --navbar-shadow:
              rgba(0, 0, 0, 0.25);

            --navbar-text: #f8fafc;

            --navbar-muted: #94a3b8;

            --connection-bg: rgba(34, 197, 94, 0.12);

            --button-bg: #1e293b;

            --button-border:
              rgba(148, 163, 184, 0.18);

            --button-hover: #334155;
          }


          /* ================= SYSTEM THEME ================= */

          :root[data-theme="system"] {

            --navbar-bg: rgba(255, 255, 255, 0.95);

            --navbar-border: rgba(59, 130, 246, 0.12);

            --navbar-shadow:
              rgba(30, 64, 175, 0.06);

            --navbar-text: #172554;

            --navbar-muted: #64748b;

            --connection-bg: #ecfdf5;

            --button-bg: #f8fafc;

            --button-border:
              rgba(59, 130, 246, 0.12);

            --button-hover: #eff6ff;
          }


          /* ================= MOBILE ================= */

          @media (max-width: 768px) {

            .navbar {
              padding: 0 18px;
            }

            .menu-button {
              display: block;
            }

            .brand-text span {
              display: none;
            }

            .brand-text h2 {
              font-size: 18px;
            }

            .connection-status {
              display: none;
            }

          }

        `}
      </style>

    </header>
  );
}

export default Navbar;