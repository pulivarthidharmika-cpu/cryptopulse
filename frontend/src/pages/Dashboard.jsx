import { useEffect, useState } from "react";
import { createPriceWebSocket, createAlertWebSocket } from "../services/websocket";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function Dashboard() {
  const userName =
    localStorage.getItem("profileName") ||
    "CryptoPulse User";

  const userRole =
    localStorage.getItem("role") ||
    "User";

 const [prices, setPrices] = useState([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");
 const [wsStatus, setWsStatus] = useState("connecting");
 const [liveAlerts, setLiveAlerts] = useState([]);
 const [alertWsStatus, setAlertWsStatus] = useState("connecting");

 const [gainersAndLosers, setGainersAndLosers] = useState({
  gainers: [],
  losers: [],
});

 const [heatmapData, setHeatmapData] = useState(null);
 const [heatmapLoading, setHeatmapLoading] = useState(true);
 const [marketIntelligence, setMarketIntelligence] = useState(null);

  const fetchPrices = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${BASE_URL}/prices/latest`);

      if (!response.ok) {
        throw new Error("Failed to fetch prices");
      }

      const result = await response.json();

      console.log("Latest prices:", result);

      setPrices(result.data || []);
    } catch (err) {
      console.error("Price fetch error:", err);
      setError("Unable to load cryptocurrency prices.");
    } finally {
      setLoading(false);
    }
  };

  const fetchGainersAndLosers = async () => {
  try {
    const response = await fetch(`${BASE_URL}/analytics/`);

    if (!response.ok) {
      throw new Error("Failed to fetch market movers");
    }

    const result = await response.json();

    setGainersAndLosers(
      result.gainers_and_losers || {
        gainers: [],
        losers: [],
      }
    );
  } catch (err) {
    console.error("Gainers/Losers fetch error:", err);
  }
};

  const fetchHeatmap = async () => {
    try {
      setHeatmapLoading(true);
      const response = await fetch(`${BASE_URL}/analytics/heatmap`);

      if (!response.ok) {
        throw new Error("Failed to fetch market heatmap");
      }

      const result = await response.json();
      setHeatmapData(result);
    } catch (err) {
      console.error("Heatmap fetch error:", err);
    } finally {
      setHeatmapLoading(false);
    }
  };

  const fetchMarketIntelligence = async () => {
    try {
      const response = await fetch(`${BASE_URL}/analytics/intelligence`);
      if (!response.ok) return;
      const result = await response.json();
      setMarketIntelligence(result);
    } catch (err) {
      console.error("Intelligence fetch error:", err);
    }
  };

  const handleRefresh = () => {
    fetchPrices();
    fetchGainersAndLosers();
    fetchHeatmap();
    fetchMarketIntelligence();
  };

 useEffect(() => {
  fetchPrices();
  fetchGainersAndLosers();
  fetchHeatmap();
  fetchMarketIntelligence();

  const interval = setInterval(() => {
    fetchPrices();
    fetchGainersAndLosers();
    fetchHeatmap();
    fetchMarketIntelligence();
  }, 30000);

  return () => clearInterval(interval);
}, []);

   useEffect(() => {
    const socket = createPriceWebSocket({
      onOpen: () => {
        setWsStatus("connected");
      },

      onMessage: (data) => {
        setPrices((currentPrices) => {
          const exists = currentPrices.some(
            (item) => item.coin === data.coin
          );

          if (!exists) {
            return [...currentPrices, data];
          }

          return currentPrices.map((item) =>
            item.coin === data.coin
              ? { ...item, ...data }
              : item
          );
        });

        // Update Market Heatmap in real time from WebSocket stream
        setHeatmapData((currentHeatmap) => {
          if (!currentHeatmap || !currentHeatmap.data) {
            return currentHeatmap;
          }

          const updatedList = currentHeatmap.data.map((item) => {
            if (item.coin !== data.coin) {
              return item;
            }

            const newPrice = data.price !== undefined ? Number(data.price) : item.price;
            const newChange = data.change_24h !== undefined ? Number(data.change_24h) : item.change_24h;
            const newVolume = data.volume !== undefined ? Number(data.volume) : item.volume_24h;

            let heatColor = item.heat_color;
            if (newChange >= 5.0) heatColor = "#15803d";
            else if (newChange >= 2.0) heatColor = "#22c55e";
            else if (newChange > 0.0) heatColor = "#86efac";
            else if (newChange === 0.0) heatColor = "#94a3b8";
            else if (newChange >= -2.0) heatColor = "#fca5a5";
            else if (newChange >= -5.0) heatColor = "#ef4444";
            else heatColor = "#b91c1c";

            return {
              ...item,
              price: newPrice,
              change_24h: newChange,
              volume_24h: newVolume,
              heat_color: heatColor,
              sentiment: newChange > 0 ? "bullish" : (newChange < 0 ? "bearish" : "neutral"),
              intensity: Math.min(Math.max(Number((Math.abs(newChange) / 5.0).toFixed(2)), 0.1), 1.0),
              lastUpdated: Date.now(),
            };
          });

          const topPerformer =
            [...updatedList].sort((a, b) => b.change_24h - a.change_24h)[0] || null;
          const worstPerformer =
            [...updatedList].sort((a, b) => a.change_24h - b.change_24h)[0] || null;

          return {
            ...currentHeatmap,
            data: updatedList,
            top_performer: topPerformer,
            worst_performer: worstPerformer,
          };
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
      socket.close();
    };
  }, []);

  useEffect(() => {
    const alertSocket = createAlertWebSocket({
      onOpen: () => {
        setAlertWsStatus("connected");
      },
      onMessage: (data) => {
        setLiveAlerts((prev) => [
          {
            ...data,
            id: data.alert_id || `${Date.now()}-${Math.random()}`,
            receivedAt: new Date().toLocaleTimeString(),
          },
          ...prev.slice(0, 9),
        ]);
      },
      onClose: () => {
        setAlertWsStatus("disconnected");
      },
      onError: () => {
        setAlertWsStatus("disconnected");
      },
    });

    return () => {
      alertSocket.close();
    };
  }, []);

  const formatPrice = (price) => {
    return Number(price).toLocaleString("en-US", {
      maximumFractionDigits: 2,
    });
  };

  const formatLargeNumber = (number) => {
    const value = Number(number);

    if (value >= 1e12) {
      return `$${(value / 1e12).toFixed(2)}T`;
    }

    if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(2)}B`;
    }

    if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(2)}M`;
    }

    return `$${value.toLocaleString("en-US")}`;
  };

  const getCoinSymbol = (coin) => {
    const symbols = {
      bitcoin: "₿",
      ethereum: "Ξ",
      solana: "S",
    };

    return symbols[coin] || "₿";
  };

  const getCoinColor = (coin) => {
    const colors = {
      bitcoin: "#f59e0b",
      ethereum: "#6366f1",
      solana: "#14b8a6",
    };

    return colors[coin] || "#2563eb";
  };

  const totalMarketCap = prices.reduce(
    (total, coin) => total + Number(coin.market_cap || 0),
    0
  );

  const totalVolume = prices.reduce(
    (total, coin) => total + Number(coin.volume || 0),
    0
  );

  return (
    <div className="dashboard-page">

      {/* ================= HEADER ================= */}

      <div className="page-header">

        <div>

          <div className="title-row">

            <h1>Dashboard</h1>

            <span className="live-badge">
              <span className="live-dot"></span>
              LIVE
            </span>

          </div>

          <p className="subtitle">
            Real-time cryptocurrency market monitoring
          </p>

        </div>

        <div className="header-right">

          <div className="user-info">

            <div className="user-avatar">
              {userName.charAt(0).toUpperCase()}
            </div>

            <div className="user-details">

              <strong>
                {userName}
              </strong>

              <span className="role-badge">
                {userRole.charAt(0).toUpperCase() +
                  userRole.slice(1)}
              </span>

            </div>

          </div>

          <button
            onClick={handleRefresh}
            className="refresh-button"
          >
            ↻ &nbsp; Refresh Data
          </button>

        </div>

      </div>


      {/* ================= MARKET STATUS ================= */}

      <div className="market-banner">

        <div>

          <p className="banner-small">
            MARKET STATUS
          </p>

          <h2 className="banner-title">
            Cryptocurrency Market Overview
          </h2>

          <p className="banner-text">
            Monitoring Bitcoin, Ethereum and Solana in real time
          </p>

        </div>

        <div className="banner-stats">

          <div className="banner-stat">
            <span>Tracked Assets</span>
            <strong>{prices.length}</strong>
          </div>

          <div className="banner-stat">
            <span>Total Market Cap</span>
            <strong>
              {formatLargeNumber(totalMarketCap)}
            </strong>
          </div>

          <div className="banner-stat">
            <span>Total Volume</span>
            <strong>
              {formatLargeNumber(totalVolume)}
            </strong>
          </div>

        </div>

      </div>


      {/* ================= MARKET INTELLIGENCE BAR ================= */}
      {marketIntelligence && (
        <div className="intelligence-banner">
          <div className="intelligence-item">
            <span className="intel-label">Market Sentiment</span>
            <div className="intel-val-row">
              <span
                className="sentiment-pill"
                style={{
                  backgroundColor: `${marketIntelligence.sentiment.color}20`,
                  color: marketIntelligence.sentiment.color,
                  border: `1px solid ${marketIntelligence.sentiment.color}40`,
                }}
              >
                {marketIntelligence.sentiment.label} ({marketIntelligence.sentiment.score}/100)
              </span>
            </div>
          </div>

          <div className="intelligence-item">
            <span className="intel-label">Asset Dominance</span>
            <div className="dominance-bar-container">
              <div className="dominance-labels">
                <span>BTC: <strong>{marketIntelligence.dominance.bitcoin}%</strong></span>
                <span>ETH: <strong>{marketIntelligence.dominance.ethereum}%</strong></span>
                <span>SOL: <strong>{marketIntelligence.dominance.altcoins}%</strong></span>
              </div>
              <div className="dominance-progress-track">
                <div
                  className="dominance-segment btc"
                  style={{ width: `${marketIntelligence.dominance.bitcoin}%` }}
                ></div>
                <div
                  className="dominance-segment eth"
                  style={{ width: `${marketIntelligence.dominance.ethereum}%` }}
                ></div>
                <div
                  className="dominance-segment sol"
                  style={{ width: `${marketIntelligence.dominance.altcoins}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="intelligence-item">
            <span className="intel-label">Market Breadth</span>
            <div className="breadth-chips">
              <span className="breadth-chip gain">↑ {marketIntelligence.market_breadth.advancing} Up</span>
              <span className="breadth-chip loss">↓ {marketIntelligence.market_breadth.declining} Down</span>
            </div>
          </div>

          <div className="intelligence-item">
            <span className="intel-label">Market Regime</span>
            <div className="regime-badge">
              <span className="regime-dot"></span>
              <strong>{marketIntelligence.volatility_regime}</strong>
            </div>
          </div>
        </div>
      )}


      {/* ================= LOADING ================= */}

      {loading && (
        <div className="message">
          Loading cryptocurrency prices...
        </div>
      )}


      {/* ================= ERROR ================= */}

      {error && (
        <div className="error">
          {error}
        </div>
      )}


      {/* ================= COIN CARDS ================= */}

      {!loading && !error && (
        <>

          <div className="section-header">

            <div>

              <h2 className="section-title">
                Live Market Prices
              </h2>

              <p className="section-subtitle">
                Current prices and market statistics
              </p>

            </div>

          <span className={`updated ws-status ${wsStatus}`}>
            ●{" "}
            {wsStatus === "connected"
            ? "WebSocket Connected"
            : wsStatus === "connecting"
            ? "WebSocket Connecting..."
            : "WebSocket Disconnected"}
          </span>

          </div>


          <div className="cards">

            {prices.map((coin) => {

              const coinColor =
                getCoinColor(coin.coin);

              return (

                <div
                  key={coin.coin}
                  className="coin-card"
                  style={{
                    borderTop:
                      `4px solid ${coinColor}`,
                  }}
                >

                  <div className="card-header">

                    <div className="coin-info">

                      <div
                        className="coin-icon"
                        style={{
                          backgroundColor:
                            `${coinColor}20`,
                          color: coinColor,
                        }}
                      >
                        {getCoinSymbol(coin.coin)}
                      </div>

                      <div>

                        <h3 className="coin-name">
                          {coin.coin.charAt(0).toUpperCase() +
                            coin.coin.slice(1)}
                        </h3>

                        <span className="coin-code">
                          {coin.coin.toUpperCase()} / USD
                        </span>

                      </div>

                    </div>

                    <span className="status">
                      ● Live
                    </span>

                  </div>


                  <div className="price-section">

                    <span className="price-label">
                      Current Price
                    </span>

                    <div className="price">
                      ${formatPrice(coin.price)}
                    </div>

                  </div>


                  <div className="stats">

                    <div className="stat-box">

                      <span className="stat-label">
                        Market Cap
                      </span>

                      <strong className="stat-value">
                        {formatLargeNumber(
                          coin.market_cap
                        )}
                      </strong>

                    </div>


                    <div className="stat-box">

                      <span className="stat-label">
                        24h Volume
                      </span>

                      <strong className="stat-value">
                        {formatLargeNumber(
                          coin.volume
                        )}
                      </strong>

                    </div>

                  </div>


                  <div className="card-footer">

                    <span>
                      Last updated
                    </span>

                    <span>
                      {coin.timestamp
                        ? new Date(
                            coin.timestamp
                          ).toLocaleTimeString()
                        : "N/A"}
                    </span>

                  </div>

                </div>

              );

            })}

          </div>

{/* ================= TOP GAINERS / TOP LOSERS ================= */}

<div className="market-movers">

  {/* TOP GAINERS */}

  <div className="movers-column">

    <div className="movers-header">

      <div>
        <h2 className="movers-title">
          Top Gainers
        </h2>

        <p className="movers-subtitle">
          Assets with the strongest recent price growth
        </p>
      </div>

      <span className="movers-indicator gain">
        ↑ GAINERS
      </span>

    </div>


    <div className="movers-list">

      {gainersAndLosers?.gainers && gainersAndLosers.gainers.length > 0 ? (

        gainersAndLosers.gainers.map((item, index) => (

          <div
            key={`gainer-${item.coin}`}
            className="mover-item"
          >

            <div className="mover-rank">
              #{index + 1}
            </div>


            <div
              className="mover-icon"
              style={{
                backgroundColor:
                  `${getCoinColor(item.coin)}20`,
                color:
                  getCoinColor(item.coin),
              }}
            >
              {getCoinSymbol(item.coin)}
            </div>


            <div className="mover-info">

              <strong>
                {item.coin.charAt(0).toUpperCase() +
                  item.coin.slice(1)}
              </strong>

              <span>
                ${formatPrice(item.price)}
              </span>

            </div>


            <div className={`mover-change ${item.change_percentage >= 0 ? "gain-text" : "loss-text"}`}>
              {item.change_percentage > 0 ? `+${item.change_percentage}` : item.change_percentage}%
            </div>

          </div>

        ))

      ) : (

        <div className="movers-empty">
          No gainers data available.
        </div>

      )}

    </div>

  </div>


  {/* TOP LOSERS */}

  <div className="movers-column">

    <div className="movers-header">

      <div>
        <h2 className="movers-title">
          Top Losers
        </h2>

        <p className="movers-subtitle">
          Assets with the weakest recent price movement
        </p>
      </div>

      <span className="movers-indicator loss">
        ↓ LOSERS
      </span>

    </div>


    <div className="movers-list">

      {gainersAndLosers?.losers && gainersAndLosers.losers.length > 0 ? (

        gainersAndLosers.losers.map((item, index) => (

          <div
            key={`loser-${item.coin}`}
            className="mover-item"
          >

            <div className="mover-rank">
              #{index + 1}
            </div>


            <div
              className="mover-icon"
              style={{
                backgroundColor:
                  `${getCoinColor(item.coin)}20`,
                color:
                  getCoinColor(item.coin),
              }}
            >
              {getCoinSymbol(item.coin)}
            </div>


            <div className="mover-info">

              <strong>
                {item.coin.charAt(0).toUpperCase() +
                  item.coin.slice(1)}
              </strong>

              <span>
                ${formatPrice(item.price)}
              </span>

            </div>


            <div className={`mover-change ${item.change_percentage <= 0 ? "loss-text" : "gain-text"}`}>
              {item.change_percentage > 0 ? `+${item.change_percentage}` : item.change_percentage}%
            </div>

          </div>

        ))

      ) : (

        <div className="movers-empty">
          No losers data available.
        </div>

      )}

    </div>

  </div>

</div>


          {/* ================= MARKET HEATMAP ================= */}

          <div className="market-heatmap-section">

            <div className="heatmap-header">

              <div>
                <h2 className="heatmap-title">
                  Cryptocurrency Market Heatmap
                </h2>

                <p className="heatmap-subtitle">
                  Market cap dominance weighting & 24-hour price performance distribution
                </p>
              </div>

              {heatmapData && (
                <div className="heatmap-metrics-bar">
                  <div className="heatmap-metric-chip">
                    <span>Dominant Asset:</span>
                    <strong>{heatmapData.dominant_coin ? heatmapData.dominant_coin.toUpperCase() : "N/A"}</strong>
                  </div>
                  {heatmapData.top_performer && (
                    <div className="heatmap-metric-chip gain">
                      <span>Top Gainer:</span>
                      <strong>
                        {heatmapData.top_performer.symbol} (+{heatmapData.top_performer.change_24h}%)
                      </strong>
                    </div>
                  )}
                  {heatmapData.worst_performer && (
                    <div className="heatmap-metric-chip loss">
                      <span>Weakest:</span>
                      <strong>
                        {heatmapData.worst_performer.symbol} ({heatmapData.worst_performer.change_24h}%)
                      </strong>
                    </div>
                  )}
                </div>
              )}

            </div>

            {heatmapLoading && !heatmapData ? (
              <div className="heatmap-empty">
                Loading market heatmap...
              </div>
            ) : heatmapData?.data && heatmapData.data.length > 0 ? (
              <div className="heatmap-treemap-grid">
                {heatmapData.data.map((item) => {
                  const share = item.market_cap_share || 33.3;
                  const flexBasis = share > 50 ? "55%" : share > 10 ? "25%" : "15%";

                  return (
                    <div
                      key={`heatmap-${item.coin}`}
                      className="heatmap-tile"
                      style={{
                        flexBasis,
                        flexGrow: Math.max(Math.round(share), 1),
                        borderTop: `4px solid ${item.heat_color}`,
                      }}
                    >
                      <div className="tile-top-row">
                        <div className="tile-symbol-badge">
                          <span
                            className="tile-icon-dot"
                            style={{ backgroundColor: getCoinColor(item.coin) }}
                          ></span>
                          <strong>{item.symbol}</strong>
                          <span className="tile-coin-name">
                            {item.coin.charAt(0).toUpperCase() + item.coin.slice(1)}
                          </span>
                        </div>

                        <span
                          className="tile-change-pill"
                          style={{
                            backgroundColor: `${item.heat_color}25`,
                            color: item.heat_color,
                          }}
                        >
                          {item.change_24h >= 0 ? `+${item.change_24h}` : item.change_24h}%
                        </span>
                      </div>

                      <div className="tile-main-price">
                        ${formatPrice(item.price)}
                      </div>

                      <div className="tile-footer-meta">
                        <div className="tile-meta-item">
                          <span>Market Share</span>
                          <strong>{item.market_cap_share}%</strong>
                        </div>
                        <div className="tile-meta-item">
                          <span>24h Volume</span>
                          <strong>{formatLargeNumber(item.volume_24h)}</strong>
                        </div>
                        <div className="tile-meta-item">
                          <span>Market Cap</span>
                          <strong>{formatLargeNumber(item.market_cap)}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="heatmap-empty">
                No market heatmap data currently available.
              </div>
            )}

          </div>


          {/* ================= MARKET SUMMARY ================= */}

          <div className="summary">

            <div>

              <h2 className="summary-title">
                Market Summary
              </h2>

              <p className="summary-text">
                CryptoPulse is currently tracking{" "}
                <strong>{prices.length}</strong>{" "}
                cryptocurrencies using real-time market data.
              </p>

            </div>


            <div className="summary-right">

              <div>
                <span>Currency</span>
                <strong>USD</strong>
              </div>

              <div>
                <span>Data Source</span>
                <strong>CryptoPulse API</strong>
              </div>

              <div>
                <span>System Status</span>
                <strong className="healthy">
                  ● Healthy
                </strong>
              </div>

            </div>

          </div>

        </>
      )}


      <style>
        {`

          /* ================= PAGE ================= */

          .dashboard-page {
            min-height: calc(100vh - 65px);
            padding: 38px 42px 50px;
            box-sizing: border-box;
            font-family:
              Inter, Arial, Helvetica, sans-serif;

            background: var(--page-bg);
            color: var(--text-primary);

            transition:
              background 0.25s ease,
              color 0.25s ease;
          }


          /* ================= HEADER ================= */

          .page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 32px;
          }

          .title-row {
            display: flex;
            align-items: center;
            gap: 15px;
          }

          .title-row h1 {
            margin: 0;
            font-size: 38px;
            font-weight: 700;
            color: var(--text-primary);
            letter-spacing: -0.8px;
          }

          .live-badge {
            display: flex;
            align-items: center;
            gap: 7px;
            padding: 7px 12px;
            background: var(--live-bg);
            color: #15803d;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 700;
          }

          .live-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #22c55e;
          }

          .subtitle {
            margin: 8px 0 0;
            font-size: 16px;
            color: var(--text-secondary);
          }


          /* ================= USER INFO ================= */

          .header-right {
            display: flex;
            align-items: center;
            gap: 18px;
          }

          .user-info {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .user-avatar {
            width: 38px;
            height: 38px;

            display: flex;
            align-items: center;
            justify-content: center;

            border-radius: 50%;

            background:
              linear-gradient(
                135deg,
                #2563eb,
                #38bdf8
              );

            color: white;

            font-size: 14px;
            font-weight: 800;
          }

          .user-details {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 3px;
          }

          .user-details strong {
            color: var(--text-primary);
            font-size: 13px;
            font-weight: 700;
          }

          .role-badge {
            padding: 2px 7px;

            border-radius: 10px;

            background: var(--live-bg);

            color: #15803d;

            font-size: 9px;
            font-weight: 700;

            text-transform: capitalize;
          }

          .refresh-button {
            padding: 13px 22px;
            background: var(--button-bg);
            color: white;
            border: none;
            border-radius: 9px;
            cursor: pointer;
            font-size: 15px;
            font-weight: 600;
          }


          /* ================= MARKET BANNER ================= */

          .market-banner {
            display: flex;
            justify-content: space-between;
            align-items: center;

            padding: 28px 32px;
            margin-bottom: 36px;

            border-radius: 16px;

            background:
              linear-gradient(
                135deg,
                #111827 0%,
                #1e293b 100%
              );

            color: white;

            box-shadow:
              0 8px 25px
              rgba(15, 23, 42, 0.12);
          }

          .banner-small {
            margin: 0;
            font-size: 12px;
            letter-spacing: 1.5px;
            color: #94a3b8;
            font-weight: 700;
          }

          .banner-title {
            margin: 7px 0;
            font-size: 24px;
            font-weight: 700;
          }

          .banner-text {
            margin: 0;
            color: #cbd5e1;
            font-size: 14px;
          }

          .banner-stats {
            display: flex;
            gap: 45px;
          }

          .banner-stat {
            display: flex;
            flex-direction: column;
            gap: 7px;
            min-width: 120px;
          }


          /* ================= SECTION ================= */

          .section-header {
            display: flex;
            justify-content: space-between;
            align-items: end;
            margin-bottom: 20px;
          }

          .section-title {
            margin: 0;
            font-size: 24px;
            color: var(--text-primary);
          }

          .section-subtitle {
            margin: 6px 0 0;
            color: var(--text-secondary);
            font-size: 14px;
          }

          .updated {
            color: #16a34a;
            font-size: 13px;
            font-weight: 600;
          }

          .ws-status {
            transition: color 0.25s ease;
          }

          .ws-status.connected {
            color: #16a34a;
          }

          .ws-status.connecting {
           color: #ca8a04;
          }

.ws-status.disconnected {
  color: #dc2626;
}


          /* ================= CARDS ================= */

          .cards {
            display: grid;
            grid-template-columns:
              repeat(
                auto-fit,
                minmax(320px, 1fr)
              );
            gap: 25px;
          }

          .coin-card {
            background: var(--card-bg);
            border-radius: 14px;
            padding: 27px;
            box-sizing: border-box;

            box-shadow:
              0 5px 20px
              var(--card-shadow);

            min-height: 300px;

            transition:
              background 0.25s ease,
              box-shadow 0.25s ease;
          }

          .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .coin-info {
            display: flex;
            align-items: center;
            gap: 14px;
          }

          .coin-icon {
            width: 50px;
            height: 50px;
            border-radius: 12px;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 26px;
            font-weight: 700;
          }

          .coin-name {
            margin: 0;
            font-size: 21px;
            font-weight: 700;
            color: var(--text-primary);
          }

          .coin-code {
            display: block;
            margin-top: 4px;
            font-size: 12px;
            color: var(--text-secondary);
            font-weight: 600;
          }

          .status {
            color: #16a34a;
            font-size: 13px;
            font-weight: 600;
          }


          /* ================= PRICE ================= */

          .price-section {
            margin-top: 28px;
          }

          .price-label {
            font-size: 13px;
            color: var(--text-secondary);
          }

          .price {
            margin-top: 5px;
            font-size: 38px;
            font-weight: 750;
            color: var(--text-primary);
            letter-spacing: -1px;
          }


          /* ================= STATS ================= */

          .stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 28px;
          }

          .stat-box {
            padding: 14px;
            background: var(--stat-bg);
            border-radius: 9px;
          }

          .stat-label {
            display: block;
            color: var(--text-secondary);
            font-size: 12px;
            margin-bottom: 6px;
          }

          .stat-value {
            display: block;
            font-size: 16px;
            color: var(--text-primary);
          }


          /* ================= FOOTER ================= */

          .card-footer {
            display: flex;
            justify-content: space-between;
            margin-top: 23px;
            padding-top: 15px;

            border-top:
              1px solid var(--border-color);

            color: var(--text-muted);
            font-size: 12px;
          }


          /* ================= SUMMARY ================= */

          .summary {
            margin-top: 35px;
            padding: 27px 30px;

            background: var(--card-bg);
            border-radius: 14px;

            display: flex;
            justify-content: space-between;
            align-items: center;

            box-shadow:
              0 5px 20px
              var(--card-shadow);
          }

          .summary-title {
            margin: 0;
            font-size: 21px;
            color: var(--text-primary);
          }

          .summary-text {
            margin: 8px 0 0;
            color: var(--text-secondary);
            font-size: 14px;
          }

          .summary-right {
            display: flex;
            gap: 40px;
          }

          .summary-right span {
            display: block;
            color: var(--text-secondary);
            font-size: 12px;
            margin-bottom: 4px;
          }

          .summary-right strong {
            color: var(--text-primary);
          }

          .healthy {
            color: #16a34a !important;
          }


          /* ================= MESSAGES ================= */

          .message {
            padding: 50px;
            text-align: center;
            color: var(--text-secondary);
            font-size: 16px;
          }

          .error {
            padding: 18px;
            background: var(--error-bg);
            color: var(--error-text);
            border-radius: 9px;
            font-size: 15px;
          }


          /* ================= LIGHT THEME ================= */

          :root,
          [data-theme="light"] {

            --page-bg: #f4f7fb;
            --card-bg: #ffffff;
            --stat-bg: #f8fafc;

            --text-primary: #111827;
            --text-secondary: #64748b;
            --text-muted: #94a3b8;

            --border-color: #e5e7eb;

            --button-bg: #111827;

            --card-shadow:
              rgba(15, 23, 42, 0.07);

            --live-bg: #dcfce7;

            --error-bg: #fee2e2;
            --error-text: #b91c1c;
          }


          /* ================= DARK THEME ================= */

          [data-theme="dark"] {

            --page-bg: #020617;
            --card-bg: #0f172a;
            --stat-bg: #1e293b;

            --text-primary: #f8fafc;
            --text-secondary: #94a3b8;
            --text-muted: #64748b;

            --border-color: #334155;

            --button-bg: #2563eb;

            --card-shadow:
              rgba(0, 0, 0, 0.35);

            --live-bg: #052e16;

            --error-bg: #450a0a;
            --error-text: #fca5a5;
          }


          /* ================= SYSTEM THEME ================= */

          @media (prefers-color-scheme: dark) {

            [data-theme="system"] {

              --page-bg: #020617;
              --card-bg: #0f172a;
              --stat-bg: #1e293b;

              --text-primary: #f8fafc;
              --text-secondary: #94a3b8;
              --text-muted: #64748b;

              --border-color: #334155;

              --button-bg: #2563eb;

              --card-shadow:
                rgba(0, 0, 0, 0.35);

              --live-bg: #052e16;

              --error-bg: #450a0a;
              --error-text: #fca5a5;
            }

          }


          @media (prefers-color-scheme: light) {

            [data-theme="system"] {

              --page-bg: #f4f7fb;
              --card-bg: #ffffff;
              --stat-bg: #f8fafc;

              --text-primary: #111827;
              --text-secondary: #64748b;
              --text-muted: #94a3b8;

              --border-color: #e5e7eb;

              --button-bg: #111827;

              --card-shadow:
                rgba(15, 23, 42, 0.07);

              --live-bg: #dcfce7;

              --error-bg: #fee2e2;
              --error-text: #b91c1c;
            }

          }


          /* ================= MARKET MOVERS ================= */

          .market-movers {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
            gap: 22px;
            margin-bottom: 35px;
          }

          .movers-column {
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 18px;
            padding: 24px;
            box-shadow: 0 6px 20px var(--card-shadow);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }

          .movers-column:hover {
            transform: translateY(-2px);
          }

          .movers-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
            padding-bottom: 14px;
            border-bottom: 1px solid var(--border-color);
          }

          .movers-title {
            margin: 0;
            font-size: 20px;
            font-weight: 700;
            color: var(--text-primary);
            letter-spacing: -0.3px;
          }

          .movers-subtitle {
            margin: 4px 0 0;
            font-size: 13px;
            color: var(--text-secondary);
          }

          .movers-indicator {
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }

          .movers-indicator.gain {
            background: rgba(34, 197, 94, 0.15);
            color: #16a34a;
          }

          .movers-indicator.loss {
            background: rgba(239, 68, 68, 0.15);
            color: #dc2626;
          }

          .movers-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .mover-item {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 12px 16px;
            border-radius: 12px;
            background: var(--stat-bg);
            border: 1px solid var(--border-color);
            transition: background 0.15s ease;
          }

          .mover-item:hover {
            filter: brightness(0.97);
          }

          .mover-rank {
            font-size: 13px;
            font-weight: 700;
            color: var(--text-muted);
            width: 24px;
            flex-shrink: 0;
          }

          .mover-icon {
            width: 38px;
            height: 38px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 16px;
            flex-shrink: 0;
          }

          .mover-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
            flex: 1;
            min-width: 0;
          }

          .mover-info strong {
            font-size: 14px;
            font-weight: 700;
            color: var(--text-primary);
          }

          .mover-info span {
            font-size: 13px;
            color: var(--text-secondary);
          }

          .mover-change {
            font-size: 15px;
            font-weight: 800;
            letter-spacing: -0.2px;
            flex-shrink: 0;
          }

          .gain-text {
            color: #16a34a;
          }

          .loss-text {
            color: #dc2626;
          }

          .movers-empty {
            padding: 28px 16px;
            text-align: center;
            font-size: 14px;
            color: var(--text-muted);
            background: var(--stat-bg);
            border-radius: 12px;
            border: 1px dashed var(--border-color);
          }


          /* ================= MARKET HEATMAP ================= */

          .market-heatmap-section {
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 20px;
            padding: 26px 28px;
            margin-bottom: 35px;
            box-shadow: 0 6px 20px var(--card-shadow);
          }

          .heatmap-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 22px;
            padding-bottom: 16px;
            border-bottom: 1px solid var(--border-color);
            flex-wrap: wrap;
            gap: 16px;
          }

          .heatmap-title {
            margin: 0;
            font-size: 22px;
            font-weight: 700;
            color: var(--text-primary);
            letter-spacing: -0.4px;
          }

          .heatmap-subtitle {
            margin: 4px 0 0;
            font-size: 13px;
            color: var(--text-secondary);
          }

          .heatmap-metrics-bar {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
          }

          .heatmap-metric-chip {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            border-radius: 20px;
            background: var(--stat-bg);
            border: 1px solid var(--border-color);
            font-size: 12px;
          }

          .heatmap-metric-chip span {
            color: var(--text-secondary);
          }

          .heatmap-metric-chip strong {
            color: var(--text-primary);
            font-weight: 700;
          }

          .heatmap-metric-chip.gain strong {
            color: #16a34a;
          }

          .heatmap-metric-chip.loss strong {
            color: #dc2626;
          }

          .heatmap-treemap-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 18px;
            min-height: 190px;
          }

          .heatmap-tile {
            background: var(--stat-bg);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-width: 240px;
            min-height: 170px;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            position: relative;
            overflow: hidden;
          }

          .heatmap-tile:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 24px var(--card-shadow);
          }

          .tile-top-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
          }

          .tile-symbol-badge {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .tile-icon-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
          }

          .tile-symbol-badge strong {
            font-size: 16px;
            font-weight: 800;
            color: var(--text-primary);
            letter-spacing: -0.2px;
          }

          .tile-coin-name {
            font-size: 12px;
            color: var(--text-muted);
            font-weight: 500;
          }

          .tile-change-pill {
            padding: 4px 10px;
            border-radius: 14px;
            font-size: 12px;
            font-weight: 700;
          }

          .tile-main-price {
            font-size: 26px;
            font-weight: 800;
            color: var(--text-primary);
            letter-spacing: -0.6px;
            margin: 6px 0 16px;
          }

          .tile-footer-meta {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            padding-top: 12px;
            border-top: 1px dashed var(--border-color);
          }

          .tile-meta-item {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .tile-meta-item span {
            font-size: 11px;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }

          .tile-meta-item strong {
            font-size: 12px;
            color: var(--text-primary);
            font-weight: 600;
          }

          .heatmap-empty {
            padding: 40px 16px;
            text-align: center;
            font-size: 14px;
            color: var(--text-muted);
            background: var(--stat-bg);
            border-radius: 14px;
            border: 1px dashed var(--border-color);
          }


          /* ================= MARKET INTELLIGENCE ================= */

          .intelligence-banner {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 16px;
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 16px 22px;
            margin-bottom: 30px;
            box-shadow: 0 4px 16px var(--card-shadow);
          }

          .intelligence-item {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .intel-label {
            font-size: 11px;
            font-weight: 700;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .intel-val-row {
            display: flex;
            align-items: center;
          }

          .sentiment-pill {
            padding: 4px 12px;
            border-radius: 14px;
            font-size: 13px;
            font-weight: 700;
          }

          .dominance-bar-container {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .dominance-labels {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: var(--text-secondary);
          }

          .dominance-labels strong {
            color: var(--text-primary);
          }

          .dominance-progress-track {
            height: 8px;
            background: var(--stat-bg);
            border-radius: 4px;
            overflow: hidden;
            display: flex;
            border: 1px solid var(--border-color);
          }

          .dominance-segment.btc {
            background: #f59e0b;
          }

          .dominance-segment.eth {
            background: #6366f1;
          }

          .dominance-segment.sol {
            background: #14b8a6;
          }

          .breadth-chips {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .breadth-chip {
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 700;
          }

          .breadth-chip.gain {
            background: rgba(34, 197, 94, 0.15);
            color: #16a34a;
          }

          .breadth-chip.loss {
            background: rgba(239, 68, 68, 0.15);
            color: #dc2626;
          }

          .regime-badge {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
          }

          .regime-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #3b82f6;
          }

          .regime-badge strong {
            color: var(--text-primary);
          }


          /* ================= RESPONSIVE ================= */

          @media (max-width: 800px) {

            .page-header,
            .market-banner,
            .section-header,
            .summary {
              flex-direction: column;
              align-items: flex-start;
              gap: 20px;
            }

            .header-right {
              width: 100%;
              justify-content: space-between;
            }

            .banner-stats {
              width: 100%;
              flex-wrap: wrap;
              gap: 20px;
            }

            .summary-right {
              flex-wrap: wrap;
              gap: 20px;
            }

          }

          @media (max-width: 500px) {

            .user-details {
              display: none;
            }

          }

        `}
      </style>

    </div>
  );
}

export default Dashboard;