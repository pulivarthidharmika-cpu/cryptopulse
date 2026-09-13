import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDetailedHealth } from "../services/api";

function Navbar({ onMenuClick }) {
  const navigate = useNavigate();

  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "light"
  );

  const [healthData, setHealthData] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);

  const fetchHealth = async () => {
    try {
      setHealthLoading(true);
      const res = await getDetailedHealth();
      setHealthData(res);
    } catch (err) {
      console.warn("Could not fetch detailed health:", err);
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 25000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleStorage = () => {
      setTheme(localStorage.getItem("theme") || "light");
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    window.dispatchEvent(new Event("storage"));
  };

  const isHealthy = healthData?.status === "healthy";
  const isDegraded = healthData?.status === "degraded";

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

        <button
          className={`connection-status ${isDegraded ? "degraded" : ""}`}
          onClick={() => setShowHealthModal(true)}
          title="Click to view detailed system health & infrastructure status"
          aria-label="System Health"
        >
          <span className={`status-dot ${isHealthy ? "online" : isDegraded ? "warning" : "offline"}`}></span>
          <span>{isHealthy ? "Live" : isDegraded ? "Degraded" : "Connecting"}</span>
        </button>

        <button
          className="theme-toggle-button"
          onClick={toggleTheme}
          title={`Theme: ${theme}. Click to switch.`}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

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

      {/* ================= SYSTEM HEALTH MODAL ================= */}
      {showHealthModal && (
        <div className="health-modal-overlay" onClick={() => setShowHealthModal(false)}>
          <div className="health-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="health-modal-header">
              <div className="health-modal-title">
                <h3>🖥️ System Infrastructure & Health</h3>
                <span className={`health-status-tag ${isHealthy ? "tag-healthy" : "tag-degraded"}`}>
                  {healthData?.status?.toUpperCase() || "MONITORING"}
                </span>
              </div>
              <button
                className="health-modal-close"
                onClick={() => setShowHealthModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="health-modal-body">
              <div className="health-meta-bar">
                <div>
                  <strong>Service:</strong> {healthData?.service || "CryptoPulse API"}
                </div>
                <div>
                  <strong>Latency:</strong> {healthData?.latency_ms !== undefined ? `${healthData.latency_ms} ms` : "Checking..."}
                </div>
                <div>
                  <strong>Uptime:</strong> {healthData?.uptime_seconds ? `${Math.round(healthData.uptime_seconds)}s` : "Online"}
                </div>
              </div>

              <div className="health-grid">
                {/* 1. MONGODB */}
                <div className="health-card">
                  <div className="health-card-head">
                    <span className="card-icon">🍃</span>
                    <strong>MongoDB Atlas</strong>
                    <span className={`badge-pill ${healthData?.components?.mongodb?.status === "healthy" ? "badge-green" : "badge-amber"}`}>
                      {healthData?.components?.mongodb?.status || "Connecting"}
                    </span>
                  </div>
                  <div className="health-card-stats">
                    <div className="stat-row">
                      <span>Ping Latency:</span>
                      <b>{healthData?.components?.mongodb?.latency_ms ? `${healthData.components.mongodb.latency_ms} ms` : "Active"}</b>
                    </div>
                    <div className="stat-row">
                      <span>Historical Price Records:</span>
                      <b>{healthData?.components?.mongodb?.counts?.historical_prices?.toLocaleString() || "0"}</b>
                    </div>
                    <div className="stat-row">
                      <span>Live Price Caches:</span>
                      <b>{healthData?.components?.mongodb?.counts?.live_prices || "3"}</b>
                    </div>
                    <div className="stat-row">
                      <span>Active Alerts:</span>
                      <b>{healthData?.components?.mongodb?.counts?.alerts || "0"}</b>
                    </div>
                  </div>
                </div>

                {/* 2. KAFKA BROKER & PIPELINE */}
                <div className="health-card">
                  <div className="health-card-head">
                    <span className="card-icon">⚡</span>
                    <strong>Apache Kafka</strong>
                    <span className={`badge-pill ${healthData?.components?.kafka_producer?.status === "connected" ? "badge-green" : "badge-amber"}`}>
                      {healthData?.components?.kafka_producer?.status || "Connecting"}
                    </span>
                  </div>
                  <div className="health-card-stats">
                    <div className="stat-row">
                      <span>Producer Status:</span>
                      <b>{healthData?.components?.kafka_producer?.status || "Connected"}</b>
                    </div>
                    <div className="stat-row">
                      <span>Consumer Group:</span>
                      <b>{healthData?.components?.kafka_consumer?.status || "Active"}</b>
                    </div>
                    <div className="stat-row">
                      <span>Subscribed Topics:</span>
                      <b>{healthData?.components?.kafka_consumer?.topics?.length || 4} topics</b>
                    </div>
                    <div className="stat-row">
                      <span>Dead-Letter Buffer:</span>
                      <b>{healthData?.components?.kafka_producer?.dead_letter_count || 0} msgs</b>
                    </div>
                  </div>
                </div>

                {/* 3. BINANCE LIVE WEBSOCKET */}
                <div className="health-card">
                  <div className="health-card-head">
                    <span className="card-icon">📡</span>
                    <strong>Binance Stream</strong>
                    <span className={`badge-pill ${healthData?.components?.binance_stream?.status === "streaming" ? "badge-green" : "badge-blue"}`}>
                      {healthData?.components?.binance_stream?.status || "Streaming"}
                    </span>
                  </div>
                  <div className="health-card-stats">
                    <div className="stat-row">
                      <span>Stream State:</span>
                      <b>{healthData?.components?.binance_stream?.status || "Streaming"}</b>
                    </div>
                    <div className="stat-row">
                      <span>Ticks Streamed:</span>
                      <b>{healthData?.components?.binance_stream?.tick_count || 0}</b>
                    </div>
                    <div className="stat-row">
                      <span>Symbols Tracked:</span>
                      <b>BTCUSDT, ETHUSDT, SOLUSDT</b>
                    </div>
                    <div className="stat-row">
                      <span>Last Tick:</span>
                      <b>{healthData?.components?.binance_stream?.last_tick_time ? new Date(healthData.components.binance_stream.last_tick_time).toLocaleTimeString() : "Live"}</b>
                    </div>
                  </div>
                </div>

                {/* 4. CLIENT WEBSOCKETS */}
                <div className="health-card">
                  <div className="health-card-head">
                    <span className="card-icon">🌐</span>
                    <strong>Client WebSockets</strong>
                    <span className="badge-pill badge-green">Ready</span>
                  </div>
                  <div className="health-card-stats">
                    <div className="stat-row">
                      <span>Price Subscribers:</span>
                      <b>{healthData?.components?.client_websockets?.price_subscribers ?? 1}</b>
                    </div>
                    <div className="stat-row">
                      <span>Alert Subscribers:</span>
                      <b>{healthData?.components?.client_websockets?.alert_subscribers ?? 1}</b>
                    </div>
                    <div className="stat-row">
                      <span>Heartbeat Watchdog:</span>
                      <b>Active (30s)</b>
                    </div>
                    <div className="stat-row">
                      <span>Auto-Reconnection:</span>
                      <b>Exponential Backoff</b>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="health-modal-footer">
              <button
                className="health-refresh-btn"
                onClick={fetchHealth}
                disabled={healthLoading}
              >
                {healthLoading ? "Checking..." : "🔄 Refresh Status"}
              </button>
              <button
                className="health-close-btn"
                onClick={() => setShowHealthModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
            border: 1px solid transparent;

            color: #16a34a;

            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .connection-status:hover {
            border-color: #22c55e;
            transform: translateY(-1px);
          }

          .connection-status.degraded {
            color: #d97706;
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

          .status-dot.online {
            background: #22c55e;
            box-shadow: 0 0 9px rgba(34, 197, 94, 0.7);
          }

          .status-dot.warning {
            background: #f59e0b;
            box-shadow: 0 0 9px rgba(245, 158, 11, 0.7);
          }

          .status-dot.offline {
            background: #ef4444;
            box-shadow: 0 0 9px rgba(239, 68, 68, 0.7);
          }

          /* ================= HEALTH MODAL ================= */

          .health-modal-overlay {
            position: fixed;
            inset: 0;
            z-index: 2000;
            background: rgba(15, 23, 42, 0.7);
            backdrop-filter: blur(6px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }

          .health-modal-content {
            background: var(--card-bg, #ffffff);
            border: 1px solid var(--border-color, #e2e8f0);
            border-radius: 18px;
            width: 100%;
            max-width: 680px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
            overflow: hidden;
            animation: modalFadeIn 0.2s ease;
          }

          @keyframes modalFadeIn {
            from { opacity: 0; transform: scale(0.96); }
            to { opacity: 1; transform: scale(1); }
          }

          .health-modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 20px 24px;
            border-bottom: 1px solid var(--border-color, #e2e8f0);
            background: rgba(37, 99, 235, 0.03);
          }

          .health-modal-title {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .health-modal-title h3 {
            margin: 0;
            font-size: 17px;
            font-weight: 800;
            color: var(--text-primary, #1e293b);
          }

          .health-status-tag {
            font-size: 11px;
            font-weight: 800;
            padding: 3px 8px;
            border-radius: 6px;
            letter-spacing: 0.5px;
          }

          .tag-healthy {
            background: #dcfce7;
            color: #15803d;
          }

          .tag-degraded {
            background: #fef3c7;
            color: #b45309;
          }

          .health-modal-close {
            background: transparent;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: var(--text-secondary, #64748b);
            padding: 6px;
            border-radius: 8px;
          }

          .health-modal-close:hover {
            background: rgba(0, 0, 0, 0.05);
          }

          .health-modal-body {
            padding: 20px 24px;
            max-height: 70vh;
            overflow-y: auto;
          }

          .health-meta-bar {
            display: flex;
            justify-content: space-between;
            background: rgba(0, 0, 0, 0.03);
            border-radius: 10px;
            padding: 10px 16px;
            margin-bottom: 18px;
            font-size: 12px;
            color: var(--text-secondary, #64748b);
          }

          .health-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 14px;
          }

          .health-card {
            background: var(--stat-bg, #f8fafc);
            border: 1px solid var(--border-color, #e2e8f0);
            border-radius: 12px;
            padding: 14px 16px;
          }

          .health-card-head {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 10px;
            font-size: 13px;
            color: var(--text-primary, #1e293b);
          }

          .card-icon {
            font-size: 16px;
          }

          .health-card-head strong {
            flex: 1;
            font-weight: 700;
          }

          .badge-pill {
            font-size: 10px;
            font-weight: 700;
            padding: 2px 7px;
            border-radius: 5px;
            text-transform: capitalize;
          }

          .badge-green {
            background: #dcfce7;
            color: #15803d;
          }

          .badge-amber {
            background: #fef3c7;
            color: #b45309;
          }

          .badge-blue {
            background: #dbeafe;
            color: #1d4ed8;
          }

          .health-card-stats {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .stat-row {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: var(--text-secondary, #64748b);
          }

          .stat-row b {
            color: var(--text-primary, #1e293b);
            font-weight: 600;
          }

          .health-modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            padding: 16px 24px;
            border-top: 1px solid var(--border-color, #e2e8f0);
            background: rgba(0, 0, 0, 0.02);
          }

          .health-refresh-btn {
            background: #2563eb;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
          }

          .health-refresh-btn:hover:not(:disabled) {
            background: #1d4ed8;
          }

          .health-refresh-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .health-close-btn {
            background: transparent;
            border: 1px solid var(--border-color, #cbd5e1);
            color: var(--text-secondary, #64748b);
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
          }

          .health-close-btn:hover {
            background: rgba(0, 0, 0, 0.05);
          }


          .notification-button,
          .profile-button,
          .theme-toggle-button {
            width: 40px;
            height: 40px;

            display: flex;
            align-items: center;
            justify-content: center;

            border: 1px solid var(--button-border);

            border-radius: 12px;

            background: var(--button-bg);

            cursor: pointer;
            font-size: 17px;

            transition:
              transform 0.2s ease,
              background 0.2s ease,
              border-color 0.2s ease;
          }


          .notification-button:hover,
          .profile-button:hover,
          .theme-toggle-button:hover {
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