import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createAlertWebSocket } from "../services/websocket";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const COIN_COLORS = {
  bitcoin: "#f59e0b",
  ethereum: "#6366f1",
  solana: "#14b8a6",
};

function Alerts() {
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [wsStatus, setWsStatus] = useState("disconnected");
  const [bannerAlert, setBannerAlert] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [newCoin, setNewCoin] = useState("bitcoin");
  const [newCondition, setNewCondition] = useState("above");
  const [newTargetPrice, setNewTargetPrice] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const token = localStorage.getItem("token");

  // Fetch Existing Alerts from MongoDB
  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${BASE_URL}/alerts/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load alerts");
      }

      const result = await response.json();
      setAlerts(result.data || []);
    } catch (err) {
      console.error("Alerts fetch error:", err);
      setError("Unable to load alerts. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  // Real-Time Alert WebSocket Listener
  useEffect(() => {
    const alertSocket = createAlertWebSocket({
      onOpen: () => {
        setWsStatus("connected");
      },
      onMessage: (data) => {
        console.log("WebSocket alert message received:", data);

        setBannerAlert({
          ...data,
          receivedAt: new Date().toLocaleTimeString(),
        });

        setAlerts((prev) => {
          const alertId = data.alert_id || data._id;
          const exists = prev.some((a) => a._id === alertId);

          if (exists) {
            return prev.map((a) =>
              a._id === alertId
                ? {
                    ...a,
                    status: "triggered",
                    current_price: data.current_price,
                    triggered_at: data.triggered_at || new Date().toISOString(),
                    message: data.message || a.message,
                  }
                : a
            );
          } else {
            return [
              {
                _id: alertId || `${Date.now()}`,
                coin: data.coin,
                target_price: data.target_price,
                condition: data.condition,
                current_price: data.current_price,
                status: "triggered",
                triggered_at: data.triggered_at || new Date().toISOString(),
                message: data.message,
              },
              ...prev,
            ];
          }
        });
      },
      onClose: () => {
        setWsStatus("disconnected");
      },
      onError: () => {
        setWsStatus("disconnected");
      },
    });

    return () => {
      alertSocket.close();
    };
  }, []);

  // Create New Alert Handler
  const handleCreateAlert = async (e) => {
    e.preventDefault();

    if (!newTargetPrice || isNaN(Number(newTargetPrice)) || Number(newTargetPrice) <= 0) {
      setCreateError("Please enter a valid target price greater than 0");
      return;
    }

    setCreating(true);
    setCreateError("");

    try {
      const payload = {
        coin: newCoin.toLowerCase(),
        target_price: Number(newTargetPrice),
        condition: newCondition,
        status: "active",
        message:
          newMessage.trim() ||
          `Price Alert: ${newCoin.toUpperCase()} ${newCondition} $${Number(newTargetPrice).toLocaleString()}`,
      };

      const response = await fetch(`${BASE_URL}/alerts/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Alert creation failed");
      }

      if (result.data) {
        setAlerts((prev) => [result.data, ...prev]);
      } else {
        await fetchAlerts();
      }

      setNewTargetPrice("");
      setNewMessage("");
      setShowModal(false);
    } catch (err) {
      console.error("Alert creation error:", err);
      setCreateError(err.message || "Failed to create alert");
    } finally {
      setCreating(false);
    }
  };

  // Delete Alert Handler
  const handleDeleteAlert = async (alertId) => {
    if (!window.confirm("Are you sure you want to delete this alert?")) {
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/alerts/${alertId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete alert");
      }

      setAlerts((prev) => prev.filter((a) => a._id !== alertId));
    } catch (err) {
      console.error("Alert deletion error:", err);
      alert("Failed to delete alert. Please try again.");
    }
  };

  const formatPrice = (val) => {
    if (val === null || val === undefined || isNaN(val)) return "N/A";
    return Number(val).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatTimestamp = (ts) => {
    if (!ts) return "Just now";
    try {
      const date = new Date(ts);
      if (isNaN(date.getTime())) return ts;
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return ts;
    }
  };

  const activeCount = alerts.filter((a) => a.status === "active").length;
  const triggeredCount = alerts.filter((a) => a.status === "triggered").length;

  return (
    <div className="alerts-page">

      {/* Page Header */}
      <div className="alerts-header">
        <div>
          <div className="title-row">
            <div className="title-icon">🔔</div>
            <div>
              <h1>Price Alerts</h1>
              <p>Monitor real-time market notifications, active price targets, and triggered events.</p>
            </div>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="create-alert-btn"
            onClick={() => {
              setCreateError("");
              setShowModal(true);
            }}
          >
            + Create Alert
          </button>

          <button
            className="dashboard-button"
            onClick={() => navigate("/dashboard")}
          >
            ← Dashboard
          </button>
        </div>
      </div>

      {/* Live Trigger Banner */}
      {bannerAlert && (
        <div className="live-trigger-banner">
          <div className="banner-icon-pulse">🚨</div>
          <div className="banner-content">
            <div className="banner-header">
              <span className="banner-title">Real-Time Alert Triggered!</span>
              <span className="banner-time">{bannerAlert.receivedAt}</span>
            </div>
            <p className="banner-text">
              <strong>{(bannerAlert.coin || "").toUpperCase()}</strong> triggered at{" "}
              <strong>${formatPrice(bannerAlert.current_price)}</strong> (Condition: {bannerAlert.condition} ${formatPrice(bannerAlert.target_price)}).
              {bannerAlert.message ? ` — "${bannerAlert.message}"` : ""}
            </p>
          </div>
          <button
            className="banner-close-btn"
            onClick={() => setBannerAlert(null)}
            title="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      {/* Alert Summary Stats */}
      <div className="alerts-summary-grid">
        <div className="summary-card">
          <div className="summary-card-icon blue">📋</div>
          <div>
            <div className="summary-label">Total Configured</div>
            <div className="summary-value">{alerts.length}</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-icon green">⚡</div>
          <div>
            <div className="summary-label">Active Monitoring</div>
            <div className="summary-value">{activeCount}</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-icon amber">🔔</div>
          <div>
            <div className="summary-label">Triggered Alerts</div>
            <div className="summary-value">{triggeredCount}</div>
          </div>
        </div>

        <div className="summary-card">
          <div className={`summary-card-icon ${wsStatus === "connected" ? "connected" : "disconnected"}`}>
            <span className={`status-dot ${wsStatus === "connected" ? "live" : ""}`}></span>
          </div>
          <div>
            <div className="summary-label">Live Alert Feed</div>
            <div className="summary-value live-status-text">
              {wsStatus === "connected" ? "Real-Time WebSocket" : "Connecting..."}
            </div>
          </div>
        </div>
      </div>

      {/* Configured Alerts Section */}
      <div className="section-title">
        <h2>Active & Recent Alerts</h2>
        <span className="count-badge">
          {alerts.length} {alerts.length === 1 ? "alert" : "alerts"}
        </span>
      </div>

      {loading ? (
        <div className="empty-alerts">
          <div className="loading-spinner"></div>
          <p>Loading your market alerts...</p>
        </div>
      ) : error ? (
        <div className="empty-alerts error">
          <div className="empty-icon">⚠️</div>
          <h3>Failed to load alerts</h3>
          <p>{error}</p>
          <button className="create-alert-btn" onClick={fetchAlerts} style={{ marginTop: "12px" }}>
            Retry
          </button>
        </div>
      ) : alerts.length === 0 ? (
        <div className="empty-alerts">
          <div className="empty-icon">🔔</div>
          <h3>No Alerts Configured</h3>
          <p>
            You do not have any price alerts yet. Click "+ Create Alert" above to set your first target!
          </p>
          <button
            className="create-alert-btn"
            onClick={() => setShowModal(true)}
            style={{ marginTop: "16px" }}
          >
            + Create First Alert
          </button>
        </div>
      ) : (
        <div className="alerts-grid">
          {alerts.map((alert) => {
            const coinLower = (alert.coin || "").toLowerCase();
            const coinUpper = (alert.coin || "CRYPTO").toUpperCase();
            const isTriggered = alert.status === "triggered";
            const coinColor = COIN_COLORS[coinLower] || "#6366f1";

            return (
              <div
                key={alert._id || `${alert.coin}-${alert.target_price}-${Math.random()}`}
                className={`alert-card ${isTriggered ? "card-triggered" : "card-active"}`}
              >
                <div className="alert-card-header">
                  <div
                    className="coin-badge"
                    style={{
                      backgroundColor: `${coinColor}18`,
                      color: coinColor,
                      borderColor: `${coinColor}35`,
                    }}
                  >
                    <span className="coin-dot" style={{ backgroundColor: coinColor }}></span>
                    <span className="coin-name">{coinUpper}</span>
                  </div>

                  <div className="card-header-right">
                    <span className={`status-pill ${isTriggered ? "pill-triggered" : "pill-active"}`}>
                      {isTriggered ? "● TRIGGERED" : "● ACTIVE"}
                    </span>
                    <button
                      className="delete-alert-btn"
                      onClick={() => handleDeleteAlert(alert._id)}
                      title="Delete alert"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="alert-condition-banner">
                  <span className="condition-tag">
                    {alert.condition === "above" || alert.condition === "gt"
                      ? "Price Rises Above (≥)"
                      : "Price Drops Below (≤)"}
                  </span>
                  <span className="condition-target">
                    ${formatPrice(alert.target_price)}
                  </span>
                </div>

                <div className="alert-metrics-grid">
                  <div className="metric-box">
                    <span className="metric-label">Target Price</span>
                    <span className="metric-val">${formatPrice(alert.target_price)}</span>
                  </div>

                  <div className="metric-box">
                    <span className="metric-label">
                      {isTriggered ? "Trigger Price" : "Current Price"}
                    </span>
                    <span className={`metric-val ${isTriggered ? "trigger-val" : ""}`}>
                      ${formatPrice(alert.current_price ?? alert.trigger_price)}
                    </span>
                  </div>

                  <div className="metric-box">
                    <span className="metric-label">Status</span>
                    <span className={`metric-val ${isTriggered ? "text-amber" : "text-green"}`}>
                      {alert.status ? alert.status.toUpperCase() : "ACTIVE"}
                    </span>
                  </div>

                  <div className="metric-box">
                    <span className="metric-label">
                      {isTriggered ? "Triggered At" : "Created At"}
                    </span>
                    <span className="metric-val timestamp">
                      {formatTimestamp(alert.triggered_at || alert.created_at)}
                    </span>
                  </div>
                </div>

                {alert.message && (
                  <div className="alert-message-box">
                    💬 <span>{alert.message}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Information */}
      <div className="info-card">
        <div className="info-icon">ℹ</div>
        <div>
          <h3>About CryptoPulse Real-Time Alerts</h3>
          <p>
            Alerts evaluate live market price streams across Bitcoin, Ethereum, and Solana. When a coin
            crosses your target condition, the event is immediately recorded in MongoDB, published to the
            Kafka <code>market-alerts</code> topic, and broadcast via WebSockets to your browser.
          </p>
        </div>
      </div>

      {/* Create Alert Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Price Alert</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="modal-error-banner">
                ⚠️ {createError}
              </div>
            )}

            <form onSubmit={handleCreateAlert} className="modal-form">
              <div className="form-group">
                <label>Cryptocurrency</label>
                <select
                  value={newCoin}
                  onChange={(e) => setNewCoin(e.target.value)}
                  className="modal-select"
                >
                  <option value="bitcoin">Bitcoin (BTC)</option>
                  <option value="ethereum">Ethereum (ETH)</option>
                  <option value="solana">Solana (SOL)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Trigger Condition</label>
                <select
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  className="modal-select"
                >
                  <option value="above">Price Rises Above or Equals (≥)</option>
                  <option value="below">Price Drops Below or Equals (≤)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Target Price (USD)</label>
                <input
                  type="number"
                  step="any"
                  min="0.0001"
                  required
                  placeholder="e.g. 68000"
                  value={newTargetPrice}
                  onChange={(e) => setNewTargetPrice(e.target.value)}
                  className="modal-input"
                />
              </div>

              <div className="form-group">
                <label>Notification Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Target hit — take profit"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="modal-input"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-submit-btn"
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Save Alert"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>
        {`
          .alerts-page {
            width: 100%;
            max-width: 1100px;
            margin: 0 auto;
            padding-bottom: 40px;
          }

          /* Header */
          .alerts-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 24px;
          }

          .title-row {
            display: flex;
            align-items: center;
            gap: 15px;
          }

          .title-icon {
            width: 52px;
            height: 52px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 15px;
            background: linear-gradient(135deg, #2563eb, #38bdf8);
            color: white;
            font-size: 22px;
            box-shadow: 0 8px 22px rgba(37, 99, 235, 0.25);
            flex-shrink: 0;
          }

          .alerts-header h1 {
            font-size: 24px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 4px;
          }

          .alerts-header p {
            font-size: 14px;
            color: #64748b;
            margin: 0;
          }

          .header-actions {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .create-alert-btn {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: #ffffff;
            border: none;
            padding: 10px 18px;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
            transition: all 0.2s ease;
          }

          .create-alert-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
          }

          .dashboard-button {
            background: #ffffff;
            border: 1px solid #cbd5e1;
            color: #2563eb;
            font-size: 14px;
            font-weight: 600;
            padding: 10px 18px;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .dashboard-button:hover {
            background: #f8fafc;
            border-color: #94a3b8;
          }

          /* Live Trigger Banner */
          .live-trigger-banner {
            display: flex;
            align-items: center;
            gap: 14px;
            background: linear-gradient(135deg, #fef2f2, #fff1f2);
            border: 1px solid #fecaca;
            border-left: 5px solid #ef4444;
            border-radius: 12px;
            padding: 14px 18px;
            margin-bottom: 24px;
            box-shadow: 0 4px 14px rgba(239, 68, 68, 0.12);
            animation: slideDown 0.3s ease-out;
          }

          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .banner-icon-pulse {
            font-size: 24px;
            animation: pulse 1.5s infinite;
          }

          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.15); }
          }

          .banner-content {
            flex: 1;
          }

          .banner-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 2px;
          }

          .banner-title {
            font-size: 14px;
            font-weight: 700;
            color: #b91c1c;
          }

          .banner-time {
            font-size: 12px;
            color: #991b1b;
            background: #fee2e2;
            padding: 2px 6px;
            border-radius: 4px;
          }

          .banner-text {
            font-size: 13px;
            color: #374151;
            margin: 0;
          }

          .banner-close-btn {
            background: none;
            border: none;
            font-size: 16px;
            color: #9ca3af;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 6px;
          }

          .banner-close-btn:hover {
            color: #4b5563;
            background: rgba(0, 0, 0, 0.05);
          }

          /* Summary Grid */
          .alerts-summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 28px;
          }

          .summary-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 16px;
            display: flex;
            align-items: center;
            gap: 14px;
            box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
          }

          .summary-card-icon {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
          }

          .summary-card-icon.blue { background: #eff6ff; color: #2563eb; }
          .summary-card-icon.green { background: #ecfdf5; color: #059669; }
          .summary-card-icon.amber { background: #fffbeb; color: #d97706; }
          .summary-card-icon.connected { background: #ecfdf5; }
          .summary-card-icon.disconnected { background: #fef2f2; }

          .status-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #ef4444;
          }

          .status-dot.live {
            background: #10b981;
            box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);
            animation: pulse-dot 2s infinite;
          }

          @keyframes pulse-dot {
            0%, 100% { box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2); }
            50% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0.1); }
          }

          .summary-label {
            font-size: 12px;
            color: #64748b;
            font-weight: 500;
            margin-bottom: 2px;
          }

          .summary-value {
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
          }

          .live-status-text {
            font-size: 13px !important;
            color: #059669;
          }

          /* Section Title */
          .section-title {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
          }

          .section-title h2 {
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
          }

          .count-badge {
            font-size: 12px;
            background: #e2e8f0;
            color: #475569;
            padding: 3px 10px;
            border-radius: 20px;
            font-weight: 600;
          }

          /* Empty State */
          .empty-alerts {
            background: #ffffff;
            border: 1px dashed #cbd5e1;
            border-radius: 14px;
            padding: 48px 24px;
            text-align: center;
            margin-bottom: 28px;
          }

          .empty-alerts.error {
            border-color: #fca5a5;
            background: #fef2f2;
          }

          .empty-icon {
            font-size: 36px;
            margin-bottom: 12px;
          }

          .empty-alerts h3 {
            font-size: 16px;
            font-weight: 600;
            color: #0f172a;
            margin-bottom: 6px;
          }

          .empty-alerts p {
            font-size: 14px;
            color: #64748b;
            max-width: 440px;
            margin: 0 auto;
          }

          .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid #e2e8f0;
            border-top: 3px solid #2563eb;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 12px;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          /* Alerts Grid */
          .alerts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 18px;
            margin-bottom: 28px;
          }

          .alert-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 18px;
            box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
            display: flex;
            flex-direction: column;
            gap: 12px;
            transition: transform 0.15s ease, box-shadow 0.15s ease;
          }

          .alert-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
          }

          .alert-card.card-triggered {
            border-left: 4px solid #f59e0b;
            background: #fafaf9;
          }

          .alert-card.card-active {
            border-left: 4px solid #10b981;
          }

          .alert-card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .coin-badge {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 4px 10px;
            border-radius: 8px;
            border: 1px solid;
            font-size: 13px;
            font-weight: 700;
          }

          .coin-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
          }

          .card-header-right {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .status-pill {
            font-size: 11px;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 20px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .pill-active {
            background: #ecfdf5;
            color: #059669;
          }

          .pill-triggered {
            background: #fffbeb;
            color: #d97706;
          }

          .delete-alert-btn {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 15px;
            opacity: 0.6;
            padding: 4px;
            border-radius: 6px;
            transition: opacity 0.2s, background 0.2s;
          }

          .delete-alert-btn:hover {
            opacity: 1;
            background: #fee2e2;
          }

          .alert-condition-banner {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #f8fafc;
            border: 1px solid #f1f5f9;
            border-radius: 8px;
            padding: 8px 12px;
          }

          .condition-tag {
            font-size: 12px;
            font-weight: 600;
            color: #475569;
          }

          .condition-target {
            font-size: 14px;
            font-weight: 700;
            color: #2563eb;
          }

          .alert-metrics-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px 12px;
            border-top: 1px solid #f1f5f9;
            padding-top: 10px;
          }

          .metric-box {
            display: flex;
            flex-direction: column;
          }

          .metric-label {
            font-size: 11px;
            color: #94a3b8;
            font-weight: 500;
            margin-bottom: 2px;
          }

          .metric-val {
            font-size: 13px;
            font-weight: 600;
            color: #0f172a;
          }

          .metric-val.trigger-val {
            color: #d97706;
          }

          .metric-val.text-green { color: #059669; }
          .metric-val.text-amber { color: #d97706; }
          .metric-val.timestamp {
            font-size: 12px;
            color: #64748b;
          }

          .alert-message-box {
            font-size: 12px;
            color: #475569;
            background: #f8fafc;
            border-radius: 6px;
            padding: 6px 10px;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          /* Info Card */
          .info-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 18px 20px;
            display: flex;
            align-items: flex-start;
            gap: 14px;
          }

          .info-icon {
            font-size: 20px;
            color: #2563eb;
            background: #eff6ff;
            width: 36px;
            height: 36px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .info-card h3 {
            font-size: 15px;
            font-weight: 600;
            color: #0f172a;
            margin-bottom: 4px;
          }

          .info-card p {
            font-size: 13px;
            color: #64748b;
            line-height: 1.5;
            margin: 0;
          }

          .info-card code {
            background: #f1f5f9;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
            color: #2563eb;
          }

          /* Modal */
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.6);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999;
            padding: 16px;
          }

          .modal-content {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            width: 100%;
            max-width: 480px;
            padding: 24px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
            animation: modalPop 0.2s ease-out;
          }

          @keyframes modalPop {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }

          .modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 18px;
          }

          .modal-header h3 {
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
            margin: 0;
          }

          .modal-close-btn {
            background: none;
            border: none;
            font-size: 18px;
            color: #94a3b8;
            cursor: pointer;
            padding: 4px;
            border-radius: 6px;
          }

          .modal-close-btn:hover {
            color: #0f172a;
          }

          .modal-error-banner {
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #b91c1c;
            padding: 10px 14px;
            border-radius: 8px;
            font-size: 13px;
            margin-bottom: 16px;
          }

          .modal-form {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .form-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .form-group label {
            font-size: 13px;
            font-weight: 600;
            color: #334155;
          }

          .modal-select,
          .modal-input {
            width: 100%;
            padding: 10px 14px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            font-size: 14px;
            color: #0f172a;
            background: #ffffff;
            box-sizing: border-box;
            outline: none;
            transition: border-color 0.2s;
          }

          .modal-select:focus,
          .modal-input:focus {
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
          }

          .modal-actions {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 12px;
            margin-top: 8px;
          }

          .modal-cancel-btn {
            padding: 10px 18px;
            border: 1px solid #cbd5e1;
            background: #ffffff;
            color: #475569;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
          }

          .modal-cancel-btn:hover {
            background: #f1f5f9;
          }

          .modal-submit-btn {
            padding: 10px 20px;
            border: none;
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: #ffffff;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
          }

          .modal-submit-btn:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
          }

          .modal-submit-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          /* Dark Mode Overrides */
          html[data-theme="dark"] .alerts-header h1 { color: #f8fafc; }
          html[data-theme="dark"] .alerts-header p { color: #94a3b8; }
          html[data-theme="dark"] .dashboard-button {
            background: #1e293b;
            border-color: #334155;
            color: #60a5fa;
          }
          html[data-theme="dark"] .dashboard-button:hover {
            background: #243248;
          }

          html[data-theme="dark"] .live-trigger-banner {
            background: linear-gradient(135deg, rgba(127, 29, 29, 0.3), rgba(153, 27, 27, 0.2));
            border-color: rgba(239, 68, 68, 0.4);
            border-left: 5px solid #ef4444;
          }
          html[data-theme="dark"] .banner-title { color: #fca5a5; }
          html[data-theme="dark"] .banner-time {
            background: rgba(127, 29, 29, 0.6);
            color: #fca5a5;
          }
          html[data-theme="dark"] .banner-text { color: #e2e8f0; }

          html[data-theme="dark"] .summary-card {
            background: #1e293b;
            border-color: #334155;
          }
          html[data-theme="dark"] .summary-card-icon.blue { background: rgba(37, 99, 235, 0.15); color: #60a5fa; }
          html[data-theme="dark"] .summary-card-icon.green { background: rgba(5, 150, 105, 0.15); color: #34d399; }
          html[data-theme="dark"] .summary-card-icon.amber { background: rgba(217, 119, 6, 0.15); color: #fbbf24; }
          html[data-theme="dark"] .summary-card-icon.connected { background: rgba(5, 150, 105, 0.15); }
          html[data-theme="dark"] .summary-card-icon.disconnected { background: rgba(239, 68, 68, 0.15); }
          html[data-theme="dark"] .summary-label { color: #94a3b8; }
          html[data-theme="dark"] .summary-value { color: #f8fafc; }
          html[data-theme="dark"] .live-status-text { color: #34d399; }

          html[data-theme="dark"] .section-title h2 { color: #f8fafc; }
          html[data-theme="dark"] .count-badge {
            background: #334155;
            color: #cbd5e1;
          }

          html[data-theme="dark"] .empty-alerts {
            background: #1e293b;
            border-color: #334155;
          }
          html[data-theme="dark"] .empty-alerts h3 { color: #f8fafc; }
          html[data-theme="dark"] .empty-alerts p { color: #94a3b8; }

          html[data-theme="dark"] .alert-card {
            background: #1e293b;
            border-color: #334155;
          }
          html[data-theme="dark"] .alert-card.card-triggered {
            background: #1e2433;
            border-left-color: #f59e0b;
          }
          html[data-theme="dark"] .alert-card.card-active {
            border-left-color: #10b981;
          }
          html[data-theme="dark"] .pill-active {
            background: rgba(16, 185, 129, 0.15);
            color: #34d399;
          }
          html[data-theme="dark"] .pill-triggered {
            background: rgba(245, 158, 11, 0.15);
            color: #fbbf24;
          }
          html[data-theme="dark"] .delete-alert-btn:hover {
            background: rgba(239, 68, 68, 0.2);
          }
          html[data-theme="dark"] .alert-condition-banner {
            background: #0f172a;
            border-color: #1e293b;
          }
          html[data-theme="dark"] .condition-tag { color: #cbd5e1; }
          html[data-theme="dark"] .condition-target { color: #60a5fa; }
          html[data-theme="dark"] .alert-metrics-grid {
            border-color: #334155;
          }
          html[data-theme="dark"] .metric-label { color: #64748b; }
          html[data-theme="dark"] .metric-val { color: #f8fafc; }
          html[data-theme="dark"] .metric-val.trigger-val { color: #fbbf24; }
          html[data-theme="dark"] .metric-val.text-green { color: #34d399; }
          html[data-theme="dark"] .metric-val.text-amber { color: #fbbf24; }
          html[data-theme="dark"] .metric-val.timestamp { color: #94a3b8; }
          html[data-theme="dark"] .alert-message-box {
            background: #0f172a;
            color: #cbd5e1;
          }

          html[data-theme="dark"] .info-card {
            background: #1e293b;
            border-color: #334155;
          }
          html[data-theme="dark"] .info-icon {
            background: rgba(37, 99, 235, 0.15);
            color: #60a5fa;
          }
          html[data-theme="dark"] .info-card h3 { color: #f8fafc; }
          html[data-theme="dark"] .info-card p { color: #94a3b8; }
          html[data-theme="dark"] .info-card code {
            background: #0f172a;
            color: #60a5fa;
          }

          html[data-theme="dark"] .modal-content {
            background: #1e293b;
            border-color: #334155;
          }
          html[data-theme="dark"] .modal-header h3 { color: #f8fafc; }
          html[data-theme="dark"] .modal-close-btn { color: #94a3b8; }
          html[data-theme="dark"] .modal-close-btn:hover { color: #f8fafc; }
          html[data-theme="dark"] .form-group label { color: #cbd5e1; }
          html[data-theme="dark"] .modal-select,
          html[data-theme="dark"] .modal-input {
            background: #0f172a;
            border-color: #334155;
            color: #f8fafc;
          }
          html[data-theme="dark"] .modal-select:focus,
          html[data-theme="dark"] .modal-input:focus {
            border-color: #60a5fa;
          }
          html[data-theme="dark"] .modal-cancel-btn {
            background: #0f172a;
            border-color: #334155;
            color: #cbd5e1;
          }
          html[data-theme="dark"] .modal-cancel-btn:hover {
            background: #1e293b;
          }

          /* Responsive */
          @media (max-width: 900px) {
            .alerts-summary-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          @media (max-width: 600px) {
            .alerts-header {
              align-items: flex-start;
              flex-direction: column;
            }
            .header-actions {
              width: 100%;
              flex-direction: column;
            }
            .create-alert-btn,
            .dashboard-button {
              width: 100%;
              text-align: center;
            }
            .alerts-summary-grid {
              grid-template-columns: 1fr;
            }
            .alerts-grid {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>

    </div>
  );
}


export default Alerts;