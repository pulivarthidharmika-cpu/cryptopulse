import { useEffect, useState } from "react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

  useEffect(() => {
    fetchPrices();

    const interval = setInterval(() => {
      fetchPrices();
    }, 30000);

    return () => clearInterval(interval);
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
            onClick={fetchPrices}
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

            <span className="updated">
              ● Updates every 30 seconds
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