import { useEffect, useState, useMemo, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend as RechartsLegend,
} from "recharts";
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const COIN_PALETTE = [
  "#f59e0b", // Amber / Gold (BTC)
  "#6366f1", // Indigo (ETH)
  "#10b981", // Emerald (SOL)
  "#06b6d4", // Cyan
  "#ec4899", // Pink
  "#8b5cf6", // Purple
  "#3b82f6", // Blue
];

const COIN_FIXED_COLORS = {
  bitcoin: "#f59e0b",
  ethereum: "#6366f1",
  solana: "#10b981",
  cardano: "#0033ad",
  ripple: "#00aae4",
  dogecoin: "#c2a633",
  avalanche: "#e84142",
};

function CoinComparison() {
  // Theme state
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "light"
  );

  useEffect(() => {
    const updateTheme = () => {
      setTheme(localStorage.getItem("theme") || "light");
    };
    window.addEventListener("storage", updateTheme);
    window.addEventListener("themechange", updateTheme);
    return () => {
      window.removeEventListener("storage", updateTheme);
      window.removeEventListener("themechange", updateTheme);
    };
  }, []);

  const isSystemDark =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const isDark = theme === "dark" || (theme === "system" && isSystemDark);

  // Active coins list from API
  const [availableCoins, setAvailableCoins] = useState([]);
  const [selectedCoins, setSelectedCoins] = useState(["bitcoin", "ethereum"]);
  const [timeframeLimit, setTimeframeLimit] = useState(100);

  // Data fetching state
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  // Load available active coins from backend configuration
  useEffect(() => {
    const loadCoins = async () => {
      try {
        const res = await fetch(`${BASE_URL}/prices/coins`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.coins) && data.coins.length > 0) {
            setAvailableCoins(data.coins);
          }
        }
      } catch (err) {
        console.error("Failed to load active coins:", err);
      }
    };
    loadCoins();
  }, []);

  // Fetch comparative data from /analytics/comparison
  const fetchComparison = useCallback(async () => {
    if (selectedCoins.length < 2) {
      setComparisonData(null);
      setError("Please select at least 2 cryptocurrencies to compare.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const coinsParam = encodeURIComponent(selectedCoins.join(","));
      const res = await fetch(
        `${BASE_URL}/analytics/comparison?coins=${coinsParam}&limit=${timeframeLimit}`
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.detail || "Failed to load comparative analytics.");
      }

      setComparisonData(json);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Comparison fetch error:", err);
      setError(err.message || "Failed to load coin comparison data.");
    } finally {
      setLoading(false);
    }
  }, [selectedCoins, timeframeLimit]);

  useEffect(() => {
    const load = async () => {
      await fetchComparison();
    };
    load();
  }, [fetchComparison]);

  // Coin selection handlers
  const handleToggleCoin = (coinId) => {
    if (selectedCoins.includes(coinId)) {
      if (selectedCoins.length <= 2) {
        setError("At least 2 coins are required for comparison.");
        return;
      }
      setSelectedCoins((prev) => prev.filter((c) => c !== coinId));
    } else {
      if (selectedCoins.length >= 5) {
        setError("Maximum 5 coins can be compared simultaneously.");
        return;
      }
      setSelectedCoins((prev) => [...prev, coinId]);
    }
  };

  const getCoinColor = (coinId, index) => {
    return COIN_FIXED_COLORS[coinId.toLowerCase()] || COIN_PALETTE[index % COIN_PALETTE.length];
  };

  // Format currency numbers
  const formatCurrency = (val) => {
    if (val === null || val === undefined || isNaN(val)) return "Unavailable";
    const num = Number(val);
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1) return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `$${num.toFixed(6)}`;
  };

  // Downsample chart series if many points
  const chartSeries = useMemo(() => {
    if (!comparisonData || !Array.isArray(comparisonData.chart_series)) return [];
    const raw = comparisonData.chart_series;
    if (raw.length <= 150) return raw;
    const step = Math.ceil(raw.length / 120);
    const sampled = [];
    for (let i = 0; i < raw.length; i += step) {
      sampled.push(raw[i]);
    }
    if (raw.length > 0 && sampled[sampled.length - 1] !== raw[raw.length - 1]) {
      sampled.push(raw[raw.length - 1]);
    }
    return sampled;
  }, [comparisonData]);

  // Color theme variables
  const colors = {
    bg: isDark ? "#0f172a" : "#f8fafc",
    cardBg: isDark ? "#1e293b" : "#ffffff",
    border: isDark ? "#334155" : "#e2e8f0",
    text: isDark ? "#f1f5f9" : "#1e293b",
    muted: isDark ? "#94a3b8" : "#64748b",
    headerBg: isDark ? "#111827" : "#ffffff",
    cardHeader: isDark ? "#1e293b" : "#f8fafc",
    inputBg: isDark ? "#0f172a" : "#f1f5f9",
    accent: "#3b82f6",
    success: "#10b981",
    danger: "#ef4444",
  };

  return (
    <div
      style={{
        padding: "24px",
        minHeight: "100vh",
        backgroundColor: colors.bg,
        color: colors.text,
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          marginBottom: "24px",
          paddingBottom: "16px",
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.8rem" }}>⚖</span>
            <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: "700" }}>
              Coin Comparison
            </h1>
          </div>
          <p style={{ margin: "4px 0 0 0", color: colors.muted, fontSize: "0.9rem" }}>
            Compare normalized percentage return, trading volume, and market valuation across 2 to 5 cryptocurrencies.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {lastUpdated && (
            <span style={{ fontSize: "0.8rem", color: colors.muted }}>
              Updated: {lastUpdated}
            </span>
          )}

          {/* Timeframe Selector */}
          <div style={{ display: "flex", backgroundColor: colors.cardBg, borderRadius: "8px", border: `1px solid ${colors.border}`, overflow: "hidden" }}>
            {[
              { label: "Short (50 pts)", val: 50 },
              { label: "Medium (100 pts)", val: 100 },
              { label: "Extended (300 pts)", val: 300 },
              { label: "Max (1000 pts)", val: 1000 },
            ].map((tf) => (
              <button
                key={tf.val}
                type="button"
                onClick={() => setTimeframeLimit(tf.val)}
                style={{
                  padding: "6px 12px",
                  fontSize: "0.8rem",
                  fontWeight: timeframeLimit === tf.val ? "600" : "400",
                  backgroundColor: timeframeLimit === tf.val ? colors.accent : "transparent",
                  color: timeframeLimit === tf.val ? "#ffffff" : colors.text,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={fetchComparison}
            disabled={loading}
            style={{
              padding: "8px 16px",
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.border}`,
              color: colors.text,
              borderRadius: "8px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>
      </div>

      {/* Asset Selector Section */}
      <div
        style={{
          backgroundColor: colors.cardBg,
          borderRadius: "12px",
          border: `1px solid ${colors.border}`,
          padding: "16px 20px",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: "600" }}>
              Select Cryptocurrencies ({selectedCoins.length} / 5 selected)
            </h3>
            <span style={{ fontSize: "0.8rem", color: colors.muted }}>
              Click assets to add or remove them from the multi-asset comparison. Minimum 2, maximum 5.
            </span>
          </div>

          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: "600",
              padding: "4px 10px",
              borderRadius: "12px",
              backgroundColor: selectedCoins.length >= 2 && selectedCoins.length <= 5 ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
              color: selectedCoins.length >= 2 && selectedCoins.length <= 5 ? colors.success : colors.danger,
            }}
          >
            {selectedCoins.length < 2
              ? "Select at least 2 coins"
              : selectedCoins.length === 5
              ? "Maximum limit reached (5/5)"
              : `${5 - selectedCoins.length} more available`}
          </span>
        </div>

        {/* Selected Coins Chips */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
          {selectedCoins.map((coinId, idx) => {
            const coinColor = getCoinColor(coinId, idx);
            const coinInfo = availableCoins.find((c) => c.coin.toLowerCase() === coinId.toLowerCase());
            const symbol = coinInfo?.symbol || coinId.toUpperCase();
            const displayName = coinInfo?.name || coinId.charAt(0).toUpperCase() + coinId.slice(1);

            return (
              <div
                key={coinId}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  backgroundColor: `${coinColor}20`,
                  border: `1px solid ${coinColor}50`,
                  color: colors.text,
                  fontWeight: "600",
                  fontSize: "0.85rem",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: coinColor,
                  }}
                />
                <span>{displayName} ({symbol})</span>
                <button
                  type="button"
                  onClick={() => handleToggleCoin(coinId)}
                  disabled={selectedCoins.length <= 2}
                  style={{
                    background: "none",
                    border: "none",
                    color: selectedCoins.length <= 2 ? colors.muted : colors.text,
                    cursor: selectedCoins.length <= 2 ? "not-allowed" : "pointer",
                    padding: "0 2px",
                    fontSize: "0.9rem",
                    lineHeight: "1",
                  }}
                  title={selectedCoins.length <= 2 ? "At least 2 coins required" : "Remove coin"}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>

        {/* Available to Add Chips */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "0.8rem", color: colors.muted, marginRight: "6px" }}>
            Add supported asset:
          </span>
          {availableCoins
            .filter((c) => !selectedCoins.includes(c.coin.toLowerCase()))
            .map((c) => (
              <button
                key={c.coin}
                type="button"
                onClick={() => handleToggleCoin(c.coin.toLowerCase())}
                disabled={selectedCoins.length >= 5}
                style={{
                  padding: "4px 10px",
                  fontSize: "0.8rem",
                  borderRadius: "16px",
                  border: `1px dashed ${colors.border}`,
                  backgroundColor: colors.inputBg,
                  color: selectedCoins.length >= 5 ? colors.muted : colors.text,
                  cursor: selectedCoins.length >= 5 ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>+</span>
                <span>{c.name || c.coin}</span>
                <span style={{ fontSize: "0.7rem", color: colors.muted }}>({c.symbol})</span>
              </button>
            ))}
        </div>
      </div>

      {/* Error or Notice Alert */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: colors.danger,
            marginBottom: "20px",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* Comparison Performance Chart */}
      <div
        style={{
          backgroundColor: colors.cardBg,
          borderRadius: "12px",
          border: `1px solid ${colors.border}`,
          padding: "20px",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "600" }}>
              Normalized Historical Performance (% Return)
            </h3>
            <span style={{ fontSize: "0.8rem", color: colors.muted }}>
              Relative % return indexed from starting point (0.00%) over the selected window. Shows genuine investment performance comparison rather than raw dollar unit bias.
            </span>
          </div>

          <div style={{ fontSize: "0.8rem", color: colors.muted }}>
            Base Currency: <b>USD</b>
          </div>
        </div>

        {loading ? (
          <div style={{ height: "360px", display: "flex", alignItems: "center", justifyContent: "center", color: colors.muted }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>⏳</div>
              <span>Computing normalized comparative metrics...</span>
            </div>
          </div>
        ) : chartSeries.length === 0 ? (
          <div style={{ height: "360px", display: "flex", alignItems: "center", justifyContent: "center", color: colors.muted }}>
            <span>No historical overlap data available for the selected coins and timeframe.</span>
          </div>
        ) : (
          <div style={{ height: "360px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartSeries} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} />
                <XAxis
                  dataKey="time"
                  stroke={colors.muted}
                  fontSize={11}
                  tickMargin={8}
                />
                <YAxis
                  stroke={colors.muted}
                  fontSize={11}
                  tickFormatter={(val) => `${val >= 0 ? "+" : ""}${Number(val).toFixed(1)}%`}
                  domain={["auto", "auto"]}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#1e293b" : "#ffffff",
                    borderColor: colors.border,
                    borderRadius: "8px",
                    color: colors.text,
                    fontSize: "0.85rem",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  formatter={(val, name) => [
                    `${Number(val) >= 0 ? "+" : ""}${Number(val).toFixed(2)}%`,
                    name,
                  ]}
                />
                <RechartsLegend wrapperStyle={{ paddingTop: "10px" }} />
                {selectedCoins.map((coinId, idx) => (
                  <Line
                    key={coinId}
                    type="monotone"
                    dataKey={`${coinId.toLowerCase()}_pct`}
                    name={coinId.toUpperCase()}
                    stroke={getCoinColor(coinId, idx)}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Comparison Metrics Table */}
      <div
        style={{
          backgroundColor: colors.cardBg,
          borderRadius: "12px",
          border: `1px solid ${colors.border}`,
          padding: "20px",
          overflowX: "auto",
        }}
      >
        <div style={{ marginBottom: "16px" }}>
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "600" }}>
            Comparative Financial Metrics
          </h3>
          <span style={{ fontSize: "0.8rem", color: colors.muted }}>
            Direct comparison of live prices, daily changes, market cap, and relative performance from authoritative MongoDB & provider feeds.
          </span>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
              <th style={{ padding: "12px", color: colors.muted, fontWeight: "600" }}>Asset</th>
              <th style={{ padding: "12px", color: colors.muted, fontWeight: "600" }}>Current Price</th>
              <th style={{ padding: "12px", color: colors.muted, fontWeight: "600" }}>24h Change</th>
              <th style={{ padding: "12px", color: colors.muted, fontWeight: "600" }}>24h Volume</th>
              <th style={{ padding: "12px", color: colors.muted, fontWeight: "600" }}>Market Cap</th>
              <th style={{ padding: "12px", color: colors.muted, fontWeight: "600" }}>Period Return (%)</th>
              <th style={{ padding: "12px", color: colors.muted, fontWeight: "600" }}>Data Points</th>
            </tr>
          </thead>
          <tbody>
            {(!comparisonData || !Array.isArray(comparisonData.metrics) || comparisonData.metrics.length === 0) ? (
              <tr>
                <td colSpan={7} style={{ padding: "24px", textAlign: "center", color: colors.muted }}>
                  {loading ? "Loading metrics..." : "No comparative data available."}
                </td>
              </tr>
            ) : (
              comparisonData.metrics.map((m, idx) => {
                const coinColor = getCoinColor(m.coin, idx);
                const change24h = m.change_24h !== null && m.change_24h !== undefined ? Number(m.change_24h) : null;
                const periodReturn = m.period_return_pct !== null && m.period_return_pct !== undefined ? Number(m.period_return_pct) : null;

                return (
                  <tr
                    key={m.coin}
                    style={{
                      borderBottom: `1px solid ${colors.border}`,
                    }}
                  >
                    <td style={{ padding: "14px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            backgroundColor: `${coinColor}25`,
                            color: coinColor,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "700",
                            fontSize: "0.85rem",
                          }}
                        >
                          {m.symbol ? m.symbol.slice(0, 3) : m.coin.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: "600" }}>{m.name || m.coin}</div>
                          <div style={{ fontSize: "0.75rem", color: colors.muted }}>{m.symbol || m.coin.toUpperCase()}</div>
                        </div>
                      </div>
                    </td>

                    {/* Current Price */}
                    <td style={{ padding: "14px 12px", fontWeight: "600" }}>
                      {m.current_price !== null && m.current_price !== undefined
                        ? formatCurrency(m.current_price)
                        : "Unavailable"}
                    </td>

                    {/* 24h Change */}
                    <td style={{ padding: "14px 12px" }}>
                      {change24h !== null ? (
                        <span
                          style={{
                            fontWeight: "600",
                            color: change24h >= 0 ? colors.success : colors.danger,
                          }}
                        >
                          {change24h >= 0 ? "+" : ""}{change24h.toFixed(2)}%
                        </span>
                      ) : (
                        <span style={{ color: colors.muted }}>Unavailable</span>
                      )}
                    </td>

                    {/* 24h Volume */}
                    <td style={{ padding: "14px 12px", color: colors.text }}>
                      {m.volume_24h ? formatCurrency(m.volume_24h) : "Unavailable"}
                    </td>

                    {/* Market Cap */}
                    <td style={{ padding: "14px 12px", color: colors.text }}>
                      {m.market_cap ? formatCurrency(m.market_cap) : "Unavailable"}
                    </td>

                    {/* Period Return % */}
                    <td style={{ padding: "14px 12px" }}>
                      {periodReturn !== null ? (
                        <span
                          style={{
                            fontWeight: "700",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            backgroundColor: periodReturn >= 0 ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                            color: periodReturn >= 0 ? colors.success : colors.danger,
                          }}
                        >
                          {periodReturn >= 0 ? "+" : ""}{periodReturn.toFixed(2)}%
                        </span>
                      ) : (
                        <span style={{ color: colors.muted }}>No data</span>
                      )}
                    </td>

                    {/* History Count */}
                    <td style={{ padding: "14px 12px", color: colors.muted, fontSize: "0.85rem" }}>
                      {m.history_count !== undefined ? `${m.history_count} snapshots` : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CoinComparison;
