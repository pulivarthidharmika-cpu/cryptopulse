import { useEffect, useState } from "react";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend as RechartsLegend,
} from "recharts";

import {
  Chart as ChartJS,
  TimeScale,
  LinearScale,
  Tooltip as ChartJSTooltip,
  Legend,
} from "chart.js";

import {
  CandlestickController,
  CandlestickElement,
  OhlcController,
  OhlcElement,
} from "chartjs-chart-financial";

import "chartjs-adapter-luxon";

import { Chart } from "react-chartjs-2";


/* ============================================================
   CHART.JS REGISTRATION
============================================================ */

ChartJS.register(
  TimeScale,
  LinearScale,
  ChartJSTooltip,
  Legend,
  CandlestickController,
  CandlestickElement,
  OhlcController,
  OhlcElement
);


/* ============================================================
   API BASE URL
============================================================ */

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";


/* ============================================================
   ANALYTICS COMPONENT
============================================================ */

function Analytics() {
  const [history, setHistory] = useState([]);
  const [ohlc, setOhlc] = useState([]);
  const [ohlcInterval, setOhlcInterval] = useState("1m");
  const [ohlcSummary, setOhlcSummary] = useState(null);
  const [volumeData, setVolumeData] = useState(null);
  const [comparativeData, setComparativeData] = useState(null);
  const [chartMode, setChartMode] = useState("single");
  const [timeframeLimit, setTimeframeLimit] = useState(60);

  const [selectedCoin, setSelectedCoin] = useState("bitcoin");
  const [isStreaming, setIsStreaming] = useState(true);
  const [pollInterval, setPollInterval] = useState(5000);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ----------------------------------------------------------
     THEME
  ---------------------------------------------------------- */

  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "light"
  );


  /* ============================================================
     LISTEN FOR THEME CHANGES
  ============================================================ */

  useEffect(() => {
    const updateTheme = () => {
      setTheme(localStorage.getItem("theme") || "light");
    };

    window.addEventListener("storage", updateTheme);

    const interval = setInterval(updateTheme, 500);

    return () => {
      window.removeEventListener("storage", updateTheme);
      clearInterval(interval);
    };
  }, []);


  const isDark = theme === "dark";


  /* ============================================================
     FETCH HISTORICAL PRICE DATA
  ============================================================ */

  const fetchHistory = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      setError("");

      const response = await fetch(
        `${BASE_URL}/prices/history`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch historical prices"
        );
      }

      const result = await response.json();

      console.log("History data:", result);

      setHistory(result.data || []);
    } catch (err) {
      console.error("History fetch error:", err);

      setError(
        "Unable to load historical price data."
      );
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };


  /* ============================================================
     FETCH OHLC / CANDLESTICK DATA
  ============================================================ */

  const fetchOHLC = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/analytics/ohlc/${selectedCoin}?interval=${ohlcInterval}`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch OHLC data"
        );
      }

      const result = await response.json();

      setOhlc(result.data || []);
      setOhlcSummary(result.summary || null);
    } catch (err) {
      console.error("OHLC fetch error:", err);

      /*
       * Do not replace the main page error here.
       * The historical line chart can still work
       * even if OHLC temporarily fails.
       */
    }
  };


  /* ============================================================
     FETCH TRADING VOLUME ANALYTICS
  ============================================================ */

  const fetchVolume = async () => {
    try {
      const response = await fetch(`${BASE_URL}/analytics/volume`);
      if (response.ok) {
        const result = await response.json();
        setVolumeData(result);
      }
    } catch (err) {
      console.error("Volume fetch error:", err);
    }
  };


  /* ============================================================
     FETCH COMPARATIVE PERFORMANCE
  ============================================================ */

  const fetchComparative = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/analytics/comparative?limit=${timeframeLimit}`
      );
      if (response.ok) {
        const result = await response.json();
        setComparativeData(result);
      }
    } catch (err) {
      console.error("Comparative fetch error:", err);
    }
  };


  /* ============================================================
     REFRESH ALL ANALYTICS
  ============================================================ */

  const refreshAll = async (showLoading = false) => {
    setIsRefreshing(true);
    await Promise.allSettled([
      fetchHistory(showLoading),
      fetchOHLC(),
      fetchVolume(),
      fetchComparative(),
    ]);
    setLastUpdated(new Date().toLocaleTimeString());
    setIsRefreshing(false);
  };


  /* ============================================================
     INITIAL LOAD
  ============================================================ */

  useEffect(() => {
    refreshAll(true);
  }, []);


  /* ============================================================
     REFETCH COMPARATIVE WHEN TIMEFRAME CHANGES
  ============================================================ */

  useEffect(() => {
    fetchComparative();
  }, [timeframeLimit]);


  /* ============================================================
     OHLC FETCH WHEN COIN OR INTERVAL CHANGES
  ============================================================ */

  useEffect(() => {
    fetchOHLC();
  }, [selectedCoin, ohlcInterval]);


  /* ============================================================
     LIVE POLLING INTERVAL (CONFIGURABLE & PAUSABLE)
  ============================================================ */

  useEffect(() => {
    if (!isStreaming) return;

    const refreshInterval = setInterval(() => {
      refreshAll(false);
    }, pollInterval);

    return () => {
      clearInterval(refreshInterval);
    };
  }, [selectedCoin, timeframeLimit, ohlcInterval, isStreaming, pollInterval]);


  /* ============================================================
     FILTER SELECTED COIN
  ============================================================ */

  const coinHistory = history
    .filter(
      (item) => item.coin === selectedCoin
    )
    .sort(
      (a, b) =>
        new Date(a.timestamp) -
        new Date(b.timestamp)
    );


  /* ============================================================
     LINE CHART DATA
  ============================================================ */

  const chartData = coinHistory.map((item) => ({
    time: new Date(
      item.timestamp
    ).toLocaleTimeString(),

    price: Number(item.price),
  }));


  /* ============================================================
     STATISTICS
  ============================================================ */

  const prices = coinHistory.map((item) =>
    Number(item.price)
  );


  const latestPrice =
    prices.length > 0
      ? prices[prices.length - 1]
      : null;


  const highestPrice =
    prices.length > 0
      ? Math.max(...prices)
      : null;


  const lowestPrice =
    prices.length > 0
      ? Math.min(...prices)
      : null;


  /* ============================================================
     PRICE FORMATTER
  ============================================================ */

  const formatPrice = (price) => {
    if (
      price === null ||
      price === undefined
    ) {
      return "N/A";
    }

    return Number(price).toLocaleString(
      "en-US",
      {
        maximumFractionDigits: 2,
      }
    );
  };


  /* ============================================================
     COIN NAME
  ============================================================ */

  const coinName =
    selectedCoin.charAt(0).toUpperCase() +
    selectedCoin.slice(1);


  /* ============================================================
     VOLUME DATA & FORMATTING
  ============================================================ */

  const formatVolume = (val) => {
    if (val === null || val === undefined || isNaN(val)) return "N/A";
    const num = Number(val);
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  };

  const volumeChartData = (volumeData?.coins || []).map((item) => ({
    name: item.coin.charAt(0).toUpperCase() + item.coin.slice(1),
    coin: item.coin,
    volume: item.latest_volume || 0,
    share: item.volume_share || 0,
    spike: item.volume_spike,
    liquidity: item.liquidity_rating,
  }));

  const coinColors = {
    bitcoin: "#f59e0b",
    ethereum: "#6366f1",
    solana: "#14b8a6",
  };

  const selectedCoinVolume = volumeData?.coins?.find(
    (c) => c.coin === selectedCoin
  );

  const spikeCoins = (volumeData?.coins || []).filter((c) => c.volume_spike);
  const hasVolumeSpike = spikeCoins.length > 0;
  const spikeCoinNames = spikeCoins.map(
    (c) => c.coin.charAt(0).toUpperCase() + c.coin.slice(1)
  );


  /* ============================================================
     CANDLESTICK DATA
  ============================================================ */

  const candlestickData = ohlc
    .filter(
      (item) =>
        item &&
        item.timestamp &&
        item.open !== undefined &&
        item.high !== undefined &&
        item.low !== undefined &&
        item.close !== undefined
    )
    .map((item) => ({
      x: Number(item.timestamp),
      o: Number(item.open),
      h: Number(item.high),
      l: Number(item.low),
      c: Number(item.close),
    }));


  /* ============================================================
     CANDLESTICK CHART DATASET
  ============================================================ */

  const candleChartData = {
    datasets: [
      {
        label: `${coinName} ${ohlcInterval.toUpperCase()} Candles`,

        data: candlestickData,

        /*
         * Candlestick chart colors.
         * These are standard financial chart colors.
         */

        color: {
          up: "#16a34a",
          down: "#dc2626",
          unchanged: "#64748b",
        },

        borderColor: {
          up: "#16a34a",
          down: "#dc2626",
          unchanged: "#64748b",
        },

        backgroundColor: {
          up: "#16a34a",
          down: "#dc2626",
          unchanged: "#64748b",
        },

        borderWidth: 1,
      },
    ],
  };


  /* ============================================================
     CANDLESTICK CHART OPTIONS
  ============================================================ */

  const candleChartOptions = {
    responsive: true,

    maintainAspectRatio: false,

    animation: false,

    parsing: false,

    plugins: {
      legend: {
        display: true,

        labels: {
          color: colorsForChart(isDark).text,
        },
      },

      tooltip: {
        mode: "index",
        intersect: false,

        callbacks: {
          label: function (context) {
            const candle =
              context.raw;

            if (!candle) {
              return "";
            }

            return [
              `Open: $${formatPrice(candle.o)}`,
              `High: $${formatPrice(candle.h)}`,
              `Low: $${formatPrice(candle.l)}`,
              `Close: $${formatPrice(candle.c)}`,
            ];
          },
        },
      },
    },

    scales: {
      x: {
        type: "time",

        time: {
          unit: "hour",

          displayFormats: {
            hour: "HH:mm",
          },
        },

        ticks: {
          color: colorsForChart(isDark).muted,

          maxTicksLimit: 12,
        },

        grid: {
          color: colorsForChart(isDark).grid,
        },
      },

      y: {
        beginAtZero: false,

        ticks: {
          color: colorsForChart(isDark).muted,

          callback: function (value) {
            return `$${Number(value).toLocaleString()}`;
          },
        },

        grid: {
          color: colorsForChart(isDark).grid,
        },
      },
    },
  };


  /* ============================================================
     THEME COLORS
  ============================================================ */

  const colors = isDark
    ? {
        background: "#0f172a",
        card: "#1e293b",
        cardSecondary: "#172033",
        title: "#f8fafc",
        text: "#cbd5e1",
        muted: "#94a3b8",
        border: "#334155",
        input: "#0f172a",
        shadow:
          "0 5px 20px rgba(0,0,0,0.25)",
        tableHover: "#263449",
      }
    : {
        background: "#f5f7fa",
        card: "white",
        cardSecondary: "#f8fafc",
        title: "#111827",
        text: "#374151",
        muted: "#6b7280",
        border: "#e5e7eb",
        input: "white",
        shadow:
          "0 2px 10px rgba(0,0,0,0.06)",
        tableHover: "#f8fafc",
      };


  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div
      className="analytics-container"
      style={{
        ...styles.container,
        backgroundColor:
          colors.background,
      }}
    >

      {/* ========================================================
          HEADER
      ======================================================== */}

      <div
        style={styles.header}
        className="analytics-header"
      >

        <div>

          <h1
            style={{
              ...styles.title,
              color: colors.title,
            }}
          >
            Analytics
          </h1>

          <p
            style={{
              ...styles.subtitle,
              color: colors.muted,
            }}
          >
            Historical cryptocurrency
            price analysis
          </p>

        </div>


        <button
          onClick={() => refreshAll(true)}
          disabled={isRefreshing}
          style={{
            ...styles.refreshButton,
            opacity: isRefreshing ? 0.7 : 1,
            cursor: isRefreshing ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ display: "inline-block", transform: isRefreshing ? "rotate(180deg)" : "none", transition: "transform 0.5s ease" }}>
            ↻
          </span>
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>

      </div>


      {/* ========================================================
          LIVE STREAMING & POLLING CONTROLS TOOLBAR
      ======================================================== */}

      <div
        style={{
          ...styles.liveToolbar,
          backgroundColor: colors.card,
          border: `1px solid ${colors.border}`,
          boxShadow: colors.shadow,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {/* Status badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                ...styles.liveDot,
                backgroundColor: isStreaming ? "#22c55e" : "#f59e0b",
                boxShadow: isStreaming ? "0 0 8px rgba(34, 197, 94, 0.6)" : "none",
              }}
            ></span>
            <span style={{ fontSize: "13px", fontWeight: "600", color: isStreaming ? colors.title : "#f59e0b" }}>
              {isStreaming ? "Live Polling Active" : "Polling Paused"}
            </span>
          </div>

          {/* Pause / Resume Button */}
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            style={{
              padding: "5px 12px",
              borderRadius: "6px",
              border: `1px solid ${isStreaming ? (isDark ? "#ef4444" : "#fca5a5") : (isDark ? "#22c55e" : "#86efac")}`,
              backgroundColor: isStreaming
                ? (isDark ? "rgba(239, 68, 68, 0.15)" : "#fee2e2")
                : (isDark ? "rgba(34, 197, 94, 0.15)" : "#dcfce7"),
              color: isStreaming ? (isDark ? "#fca5a5" : "#b91c1c") : (isDark ? "#4ade80" : "#15803d"),
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            {isStreaming ? "⏸ Pause Polling" : "▶ Resume Polling"}
          </button>

          {/* Polling Interval Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: colors.muted }}>
              Interval:
            </span>
            {[
              { label: "3s", value: 3000 },
              { label: "5s", value: 5000 },
              { label: "15s", value: 15000 },
              { label: "30s", value: 30000 },
            ].map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setPollInterval(value)}
                style={styles.timeframeButton(pollInterval === value, isDark)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Last synced timestamp */}
        <div style={{ fontSize: "12px", color: colors.muted, display: "flex", alignItems: "center", gap: "6px" }}>
          <span>⏱ Last Synced:</span>
          <strong style={{ color: colors.title }}>{lastUpdated}</strong>
        </div>
      </div>


      {/* ========================================================
          COIN SELECTOR
      ======================================================== */}

      <div
        className="analytics-controls"
        style={{
          ...styles.controls,
          backgroundColor: colors.card,
          border:
            `1px solid ${colors.border}`,
          boxShadow: colors.shadow,
        }}
      >

        <label
          style={{
            ...styles.label,
            color: colors.muted,
          }}
        >
          Select Cryptocurrency
        </label>


        <select
          className="analytics-select"
          value={selectedCoin}
          onChange={(e) =>
            setSelectedCoin(
              e.target.value
            )
          }
          style={{
            ...styles.select,
            backgroundColor:
              colors.input,
            color: colors.title,
            borderColor:
              colors.border,
          }}
        >

          <option value="bitcoin">
            Bitcoin
          </option>

          <option value="ethereum">
            Ethereum
          </option>

          <option value="solana">
            Solana
          </option>

        </select>

      </div>


      {/* ========================================================
          LOADING
      ======================================================== */}

      {loading && (
        <div
          style={{
            ...styles.message,
            color: colors.muted,
          }}
        >
          Loading historical data...
        </div>
      )}


      {/* ========================================================
          ERROR
      ======================================================== */}

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}


      {/* ========================================================
          ANALYTICS
      ======================================================== */}

      {!loading && !error && (
        <>

          {/* ======================================================
              STATISTICS
          ====================================================== */}

          <div style={styles.statsGrid}>

            <div
              style={{
                ...styles.statCard,
                backgroundColor:
                  colors.card,
                border:
                  `1px solid ${colors.border}`,
                boxShadow:
                  colors.shadow,
              }}
            >

              <span
                style={{
                  ...styles.statLabel,
                  color: colors.muted,
                }}
              >
                Current Price
              </span>

              <strong
                style={{
                  ...styles.statValue,
                  color: colors.title,
                }}
              >
                {latestPrice !== null
                  ? `$${formatPrice(
                      latestPrice
                    )}`
                  : "N/A"}
              </strong>

            </div>


            <div
              style={{
                ...styles.statCard,
                backgroundColor:
                  colors.card,
                border:
                  `1px solid ${colors.border}`,
                boxShadow:
                  colors.shadow,
              }}
            >

              <span
                style={{
                  ...styles.statLabel,
                  color: colors.muted,
                }}
              >
                Highest Price
              </span>

              <strong
                style={{
                  ...styles.statValue,
                  color: colors.title,
                }}
              >
                {highestPrice !== null
                  ? `$${formatPrice(
                      highestPrice
                    )}`
                  : "N/A"}
              </strong>

            </div>


            <div
              style={{
                ...styles.statCard,
                backgroundColor:
                  colors.card,
                border:
                  `1px solid ${colors.border}`,
                boxShadow:
                  colors.shadow,
              }}
            >

              <span
                style={{
                  ...styles.statLabel,
                  color: colors.muted,
                }}
              >
                Lowest Price
              </span>

              <strong
                style={{
                  ...styles.statValue,
                  color: colors.title,
                }}
              >
                {lowestPrice !== null
                  ? `$${formatPrice(
                      lowestPrice
                    )}`
                  : "N/A"}
              </strong>

            </div>


            <div
              style={{
                ...styles.statCard,
                backgroundColor:
                  colors.card,
                border:
                  `1px solid ${colors.border}`,
                boxShadow:
                  colors.shadow,
              }}
            >

              <span
                style={{
                  ...styles.statLabel,
                  color: colors.muted,
                }}
              >
                Data Points
              </span>

              <strong
                style={{
                  ...styles.statValue,
                  color: colors.title,
                }}
              >
                {coinHistory.length}
              </strong>

            </div>

          </div>


          {/* ======================================================
              CANDLESTICK CHART
          ====================================================== */}

          <div
            style={{
              ...styles.chartContainer,
              backgroundColor:
                colors.card,
              border:
                `1px solid ${colors.border}`,
              boxShadow:
                colors.shadow,
            }}
          >

            <div
              style={{
                ...styles.chartHeader,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >

              <div>

                <h2
                  style={{
                    ...styles.sectionTitle,
                    color: colors.title,
                  }}
                >
                  {coinName} Candlestick Chart
                </h2>

                <p
                  style={{
                    ...styles.chartSubtitle,
                    color: colors.muted,
                  }}
                >
                  {ohlcInterval.toUpperCase()} OHLC Candles · Real-time aggregation & technical indicators
                </p>

              </div>

              {/* Timeframe Interval Selector */}
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: colors.muted, marginRight: "4px" }}>
                  Interval:
                </span>
                {["1m", "5m", "15m", "1h"].map((intvl) => (
                  <button
                    key={intvl}
                    onClick={() => setOhlcInterval(intvl)}
                    style={styles.timeframeButton(ohlcInterval === intvl, isDark)}
                  >
                    {intvl.toUpperCase()}
                  </button>
                ))}
              </div>

            </div>

            {/* OHLC Technical Indicators Summary Ribbon */}
            {ohlcSummary && (
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                  alignItems: "center",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  backgroundColor: colors.cardSecondary,
                  border: `1px solid ${colors.border}`,
                  marginBottom: "18px",
                  fontSize: "12px",
                }}
              >
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <span style={{ color: colors.muted }}>Candle Sentiment:</span>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: "4px",
                      backgroundColor: isDark ? "rgba(34, 197, 94, 0.2)" : "#dcfce7",
                      color: "#16a34a",
                      fontWeight: "700",
                    }}
                  >
                    ▲ {ohlcSummary.bullish_candles} Bullish
                  </span>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: "4px",
                      backgroundColor: isDark ? "rgba(239, 68, 68, 0.2)" : "#fee2e2",
                      color: "#dc2626",
                      fontWeight: "700",
                    }}
                  >
                    ▼ {ohlcSummary.bearish_candles} Bearish
                  </span>
                </div>

                <div style={{ width: "1px", height: "14px", backgroundColor: colors.border }}></div>

                <span style={{ color: colors.muted }}>
                  Range: <strong style={{ color: colors.title }}>${formatPrice(ohlcSummary.period_low)}</strong> – <strong style={{ color: colors.title }}>${formatPrice(ohlcSummary.period_high)}</strong>
                </span>

                <div style={{ width: "1px", height: "14px", backgroundColor: colors.border }}></div>

                <span style={{ color: colors.muted }}>
                  Avg Body: <strong style={{ color: colors.title }}>${formatPrice(ohlcSummary.avg_body_size)}</strong>
                </span>
              </div>
            )}


            {candlestickData.length === 0 ? (

              <p
                style={{
                  ...styles.message,
                  color: colors.muted,
                }}
              >
                No candlestick data available
                for {coinName}.
              </p>

            ) : (

              <div
                style={styles.chart}
              >

                <Chart
                  type="candlestick"
                  data={candleChartData}
                  options={candleChartOptions}
                />

              </div>

            )}

          </div>


          {/* ======================================================
              TRADING VOLUME DISTRIBUTION & LIQUIDITY
          ====================================================== */}

          <div
            style={{
              ...styles.chartContainer,
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
              boxShadow: colors.shadow,
            }}
          >
            <div style={styles.chartHeader}>
              <div>
                <h2
                  style={{
                    ...styles.sectionTitle,
                    color: colors.title,
                  }}
                >
                  Cross-Asset Trading Volume & Liquidity
                </h2>
                <p
                  style={{
                    ...styles.chartSubtitle,
                    color: colors.muted,
                  }}
                >
                  24-hour volume distribution, volume-to-market-cap ratio, and spike detection
                </p>
              </div>
            </div>

            {/* Volume Spike Alert Banner if active */}
            {hasVolumeSpike && (
              <div
                style={{
                  backgroundColor: isDark ? "rgba(239, 68, 68, 0.15)" : "#fee2e2",
                  border: `1px solid ${isDark ? "#ef4444" : "#fca5a5"}`,
                  borderRadius: "8px",
                  padding: "10px 16px",
                  marginBottom: "18px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  color: isDark ? "#fca5a5" : "#b91c1c",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                <span>⚡ Volume Surge Alert:</span>
                <span>
                  Unusual trading volume detected on {spikeCoinNames.join(", ")} (&gt;150% of recent average).
                </span>
              </div>
            )}

            {/* Selected coin volume metrics */}
            <div style={styles.volumeGrid}>
              <div
                style={{
                  ...styles.volumeCard,
                  backgroundColor: colors.cardSecondary,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <span style={{ ...styles.statLabel, color: colors.muted }}>
                  {coinName} 24h Volume
                </span>
                <strong style={{ ...styles.statValue, color: colors.title }}>
                  {formatVolume(selectedCoinVolume?.latest_volume)}
                </strong>
                <span style={{ fontSize: "12px", color: colors.muted, marginTop: "4px" }}>
                  Share: {selectedCoinVolume?.volume_share || 0}%
                </span>
              </div>

              <div
                style={{
                  ...styles.volumeCard,
                  backgroundColor: colors.cardSecondary,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <span style={{ ...styles.statLabel, color: colors.muted }}>
                  Vol / MCap Ratio
                </span>
                <strong style={{ ...styles.statValue, color: colors.title }}>
                  {selectedCoinVolume?.volume_to_market_cap_pct !== undefined
                    ? `${selectedCoinVolume.volume_to_market_cap_pct}%`
                    : "N/A"}
                </strong>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    marginTop: "4px",
                    color:
                      selectedCoinVolume?.liquidity_rating === "High Liquidity"
                        ? "#16a34a"
                        : selectedCoinVolume?.liquidity_rating === "Moderate Liquidity"
                        ? "#f59e0b"
                        : "#dc2626",
                  }}
                >
                  {selectedCoinVolume?.liquidity_rating || "N/A"}
                </span>
              </div>

              <div
                style={{
                  ...styles.volumeCard,
                  backgroundColor: colors.cardSecondary,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <span style={{ ...styles.statLabel, color: colors.muted }}>
                  Market Volume Leader
                </span>
                <strong
                  style={{
                    ...styles.statValue,
                    color: "#f59e0b",
                    textTransform: "capitalize",
                  }}
                >
                  {volumeData?.volume_leader || "N/A"}
                </strong>
                <span style={{ fontSize: "12px", color: colors.muted, marginTop: "4px" }}>
                  Total Market: {formatVolume(volumeData?.total_volume)}
                </span>
              </div>

              <div
                style={{
                  ...styles.volumeCard,
                  backgroundColor: colors.cardSecondary,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <span style={{ ...styles.statLabel, color: colors.muted }}>
                  {coinName} Spike Status
                </span>
                <strong
                  style={{
                    ...styles.statValue,
                    color: selectedCoinVolume?.volume_spike ? "#ef4444" : "#16a34a",
                  }}
                >
                  {selectedCoinVolume?.volume_spike ? "Surge Detected" : "Normal"}
                </strong>
                <span style={{ fontSize: "12px", color: colors.muted, marginTop: "4px" }}>
                  Avg: {formatVolume(selectedCoinVolume?.average_volume)}
                </span>
              </div>
            </div>

            {/* Comparative Bar Chart */}
            <div style={{ ...styles.chart, height: "300px", marginTop: "20px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeChartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDark ? "#334155" : "#e5e7eb"}
                  />
                  <XAxis
                    dataKey="name"
                    stroke={isDark ? "#94a3b8" : "#6b7280"}
                  />
                  <YAxis
                    stroke={isDark ? "#94a3b8" : "#6b7280"}
                    tickFormatter={(val) => formatVolume(val)}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: colors.card,
                      border: `1px solid ${colors.border}`,
                      color: colors.title,
                      borderRadius: "8px",
                    }}
                    formatter={(value, name, props) => [
                      `${formatVolume(value)} (${props?.payload?.share || 0}% share)`,
                      "Volume",
                    ]}
                  />
                  <Bar dataKey="volume" radius={[6, 6, 0, 0]}>
                    {volumeChartData.map((entry) => (
                      <Cell
                        key={entry.coin}
                        fill={coinColors[entry.coin] || "#3b82f6"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>


          {/* ======================================================
              HISTORICAL PRICE & COMPARATIVE TREND CHART
          ====================================================== */}

          <div
            style={{
              ...styles.chartContainer,
              backgroundColor:
                colors.card,
              border:
                `1px solid ${colors.border}`,
              boxShadow:
                colors.shadow,
            }}
          >

            <div
              style={{
                ...styles.chartHeader,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >

              <div>
                <h2
                  style={{
                    ...styles.sectionTitle,
                    color: colors.title,
                  }}
                >
                  {chartMode === "comparative"
                    ? "Comparative Asset Trend Analysis"
                    : `${coinName} Price History`}
                </h2>

                <p
                  style={{
                    ...styles.chartSubtitle,
                    color: colors.muted,
                  }}
                >
                  {chartMode === "comparative"
                    ? "Normalized % performance comparison across tracked assets"
                    : "Historical price movement · Live updates enabled"}
                </p>
              </div>

              {/* View mode and Timeframe Controls */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={() => setChartMode("single")}
                    style={styles.viewModeButton(chartMode === "single", isDark)}
                  >
                    Single Asset ($)
                  </button>
                  <button
                    onClick={() => setChartMode("comparative")}
                    style={styles.viewModeButton(chartMode === "comparative", isDark)}
                  >
                    Comparative Trend (%)
                  </button>
                </div>

                {chartMode === "comparative" && (
                  <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: colors.muted, marginRight: "4px" }}>
                      Points:
                    </span>
                    {[15, 30, 60, 120].map((pts) => (
                      <button
                        key={pts}
                        onClick={() => setTimeframeLimit(pts)}
                        style={styles.timeframeButton(timeframeLimit === pts, isDark)}
                      >
                        {pts}
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Comparative Summary Cards */}
            {chartMode === "comparative" && comparativeData?.performance && (
              <div style={{ ...styles.volumeGrid, marginBottom: "20px" }}>
                {Object.entries(comparativeData.performance).map(([coinKey, perf]) => {
                  const isPositive = (perf.period_return_pct || 0) >= 0;
                  const isBest = comparativeData.best_performer === coinKey;
                  return (
                    <div
                      key={coinKey}
                      style={{
                        ...styles.volumeCard,
                        backgroundColor: colors.cardSecondary,
                        border: isBest
                          ? "2px solid #10b981"
                          : `1px solid ${colors.border}`,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span
                          style={{
                            ...styles.statLabel,
                            color: coinColors[coinKey] || colors.title,
                            fontWeight: "700",
                            textTransform: "capitalize",
                            fontSize: "14px",
                            margin: 0,
                          }}
                        >
                          {coinKey}
                        </span>
                        {isBest && (
                          <span
                            style={{
                              fontSize: "11px",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              backgroundColor: isDark ? "rgba(16, 185, 129, 0.2)" : "#d1fae5",
                              color: isDark ? "#34d399" : "#047857",
                              fontWeight: "600",
                            }}
                          >
                            Top Performer
                          </span>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "6px" }}>
                        <strong style={{ ...styles.statValue, color: colors.title }}>
                          ${formatPrice(perf.latest_price)}
                        </strong>
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: "700",
                            color: isPositive ? "#16a34a" : "#dc2626",
                          }}
                        >
                          {isPositive ? "+" : ""}
                          {perf.period_return_pct}%
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "11px",
                          color: colors.muted,
                          marginTop: "8px",
                          borderTop: `1px solid ${colors.border}`,
                          paddingTop: "6px",
                        }}
                      >
                        <span>H: ${formatPrice(perf.highest_price)}</span>
                        <span>L: ${formatPrice(perf.lowest_price)}</span>
                        <span>Vol: {perf.volatility}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Single Coin Line Chart */}
            {chartMode === "single" && (
              chartData.length === 0 ? (
                <p
                  style={{
                    ...styles.message,
                    color: colors.muted,
                  }}
                >
                  No historical data available for {coinName}.
                </p>
              ) : (
                <div style={styles.chart}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={isDark ? "#334155" : "#e5e7eb"}
                      />
                      <XAxis
                        dataKey="time"
                        stroke={isDark ? "#94a3b8" : "#6b7280"}
                      />
                      <YAxis
                        stroke={isDark ? "#94a3b8" : "#6b7280"}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: colors.card,
                          border: `1px solid ${colors.border}`,
                          color: colors.title,
                          borderRadius: "8px",
                        }}
                        formatter={(value) => `$${formatPrice(value)}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="price"
                        name={coinName}
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )
            )}

            {/* Comparative Multi-Coin % Chart */}
            {chartMode === "comparative" && (
              (!comparativeData?.normalized_series || comparativeData.normalized_series.length === 0) ? (
                <p
                  style={{
                    ...styles.message,
                    color: colors.muted,
                  }}
                >
                  Loading comparative trend series...
                </p>
              ) : (
                <div style={styles.chart}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={comparativeData.normalized_series}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={isDark ? "#334155" : "#e5e7eb"}
                      />
                      <XAxis
                        dataKey="time"
                        stroke={isDark ? "#94a3b8" : "#6b7280"}
                      />
                      <YAxis
                        stroke={isDark ? "#94a3b8" : "#6b7280"}
                        tickFormatter={(val) => `${val > 0 ? "+" : ""}${val}%`}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: colors.card,
                          border: `1px solid ${colors.border}`,
                          color: colors.title,
                          borderRadius: "8px",
                        }}
                        formatter={(value, name, props) => {
                          const coinKey = String(name).toLowerCase();
                          const price = props?.payload?.[`${coinKey}_price`];
                          const sign = value > 0 ? "+" : "";
                          const priceStr = price ? ` ($${formatPrice(price)})` : "";
                          return [`${sign}${value}%${priceStr}`, String(name).toUpperCase()];
                        }}
                      />
                      <RechartsLegend
                        verticalAlign="top"
                        height={36}
                        formatter={(value) => (
                          <span style={{ color: colors.title, textTransform: "capitalize", fontWeight: "600" }}>
                            {value}
                          </span>
                        )}
                      />
                      <Line
                        type="monotone"
                        dataKey="bitcoin"
                        name="Bitcoin"
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        dot={false}
                        isAnimationActive={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="ethereum"
                        name="Ethereum"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        dot={false}
                        isAnimationActive={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="solana"
                        name="Solana"
                        stroke="#14b8a6"
                        strokeWidth={2.5}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )
            )}

          </div>


          {/* ======================================================
              HISTORICAL TABLE
          ====================================================== */}

          <div
            style={{
              ...styles.tableContainer,
              backgroundColor:
                colors.card,
              border:
                `1px solid ${colors.border}`,
              boxShadow:
                colors.shadow,
            }}
          >

            <h2
              style={{
                ...styles.sectionTitle,
                color: colors.title,
              }}
            >
              Historical Prices
            </h2>


            {coinHistory.length === 0 ? (

              <p
                style={{
                  ...styles.message,
                  color: colors.muted,
                }}
              >
                No historical records found.
              </p>

            ) : (

              <table
                style={styles.table}
              >

                <thead>

                  <tr>

                    <th
                      style={{
                        ...styles.th,
                        color: colors.title,
                        borderBottom:
                          `2px solid ${colors.border}`,
                      }}
                    >
                      Coin
                    </th>


                    <th
                      style={{
                        ...styles.th,
                        color: colors.title,
                        borderBottom:
                          `2px solid ${colors.border}`,
                      }}
                    >
                      Price
                    </th>


                    <th
                      style={{
                        ...styles.th,
                        color: colors.title,
                        borderBottom:
                          `2px solid ${colors.border}`,
                      }}
                    >
                      Currency
                    </th>


                    <th
                      style={{
                        ...styles.th,
                        color: colors.title,
                        borderBottom:
                          `2px solid ${colors.border}`,
                      }}
                    >
                      Timestamp
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {coinHistory.map(
                    (item, index) => (

                      <tr key={index}>

                        <td
                          style={{
                            ...styles.td,
                            color: colors.text,
                            borderBottom:
                              `1px solid ${colors.border}`,
                          }}
                        >
                          {item.coin}
                        </td>


                        <td
                          style={{
                            ...styles.td,
                            color: colors.text,
                            borderBottom:
                              `1px solid ${colors.border}`,
                          }}
                        >
                          $
                          {formatPrice(
                            item.price
                          )}
                        </td>


                        <td
                          style={{
                            ...styles.td,
                            color: colors.text,
                            borderBottom:
                              `1px solid ${colors.border}`,
                          }}
                        >
                          {item.currency
                            ? item.currency.toUpperCase()
                            : "USD"}
                        </td>


                        <td
                          style={{
                            ...styles.td,
                            color: colors.text,
                            borderBottom:
                              `1px solid ${colors.border}`,
                          }}
                        >
                          {new Date(
                            item.timestamp
                          ).toLocaleString()}
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            )}

          </div>

        </>
      )}

      <style>
        {`
          @media (max-width: 800px) {
            .analytics-container {
              padding: 20px 16px 36px !important;
            }

            .analytics-header {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 12px !important;
            }

            .analytics-header h1 {
              font-size: 24px !important;
            }

            .analytics-select {
              width: 100% !important;
            }
          }

          @media (max-width: 500px) {
            .analytics-container {
              padding: 14px 10px 28px !important;
            }
          }
        `}
      </style>

    </div>
  );
}


/* ============================================================
   CHART THEME HELPER
============================================================ */

function colorsForChart(isDark) {
  return isDark
    ? {
        text: "#f8fafc",
        muted: "#94a3b8",
        grid: "#334155",
      }
    : {
        text: "#111827",
        muted: "#6b7280",
        grid: "#e5e7eb",
      };
}


/* ============================================================
   STYLES
============================================================ */

const styles = {

  container: {
    padding: "30px",
    minHeight:
      "calc(100vh - 65px)",
    boxSizing: "border-box",
    fontFamily:
      "Arial, sans-serif",
    transition:
      "background-color 0.25s ease",
  },


  header: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: "15px",
    gap: "15px",
  },


  title: {
    margin: 0,
    fontSize: "30px",
  },


  subtitle: {
    marginTop: "8px",
  },


  refreshButton: {
    padding: "10px 18px",
    backgroundColor: "#111827",
    color: "white",
    border: "none",
    borderRadius: "7px",
    cursor: "pointer",
  },


  liveStatus: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    width: "fit-content",
    padding: "8px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    marginBottom: "20px",
  },


  liveToolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "14px",
    padding: "12px 18px",
    borderRadius: "10px",
    marginBottom: "20px",
    transition: "background-color 0.25s ease",
  },


  liveDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "#22c55e",
    display: "inline-block",
  },


  controls: {
    padding: "18px",
    borderRadius: "10px",
    marginBottom: "25px",
    transition:
      "background-color 0.25s ease",
  },


  label: {
    display: "block",
    fontSize: "13px",
    marginBottom: "8px",
  },


  select: {
    padding: "10px",
    width: "220px",
    borderRadius: "6px",
    fontSize: "14px",
  },


  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "18px",
    marginBottom: "25px",
  },


  statCard: {
    padding: "20px",
    borderRadius: "10px",
    transition:
      "background-color 0.25s ease",
  },


  statLabel: {
    display: "block",
    fontSize: "13px",
    marginBottom: "8px",
  },


  statValue: {
    fontSize: "22px",
  },


  volumeGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
    marginBottom: "15px",
  },


  volumeCard: {
    padding: "16px",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    transition: "background-color 0.25s ease",
  },


  chartContainer: {
    padding: "25px",
    borderRadius: "10px",
    marginBottom: "25px",
    transition:
      "background-color 0.25s ease",
  },


  chartHeader: {
    marginBottom: "20px",
  },


  sectionTitle: {
    margin: 0,
  },


  chartSubtitle: {
    fontSize: "13px",
    marginTop: "6px",
  },


  chart: {
    width: "100%",
    height: "400px",
  },


  tableContainer: {
    padding: "25px",
    borderRadius: "10px",
    overflowX: "auto",
    transition:
      "background-color 0.25s ease",
  },


  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "20px",
  },


  th: {
    textAlign: "left",
    padding: "12px",
    fontSize: "13px",
  },


  td: {
    padding: "12px",
    fontSize: "14px",
  },


  message: {
    padding: "25px",
    textAlign: "center",
  },


  error: {
    padding: "15px",
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    borderRadius: "8px",
  },


  viewModeButton: (active, isDark) => ({
    padding: "6px 12px",
    borderRadius: "6px",
    border: "1px solid",
    borderColor: active ? "#2563eb" : isDark ? "#334155" : "#d1d5db",
    backgroundColor: active ? "#2563eb" : "transparent",
    color: active ? "white" : isDark ? "#cbd5e1" : "#4b5563",
    fontSize: "13px",
    fontWeight: active ? "600" : "400",
    cursor: "pointer",
    transition: "all 0.2s ease",
  }),


  timeframeButton: (active, isDark) => ({
    padding: "4px 10px",
    borderRadius: "5px",
    border: "1px solid",
    borderColor: active ? "#10b981" : isDark ? "#334155" : "#e5e7eb",
    backgroundColor: active
      ? isDark
        ? "rgba(16, 185, 129, 0.2)"
        : "#d1fae5"
      : "transparent",
    color: active
      ? isDark
        ? "#34d399"
        : "#047857"
      : isDark
      ? "#94a3b8"
      : "#6b7280",
    fontSize: "12px",
    fontWeight: active ? "600" : "400",
    cursor: "pointer",
  }),
};


export default Analytics;