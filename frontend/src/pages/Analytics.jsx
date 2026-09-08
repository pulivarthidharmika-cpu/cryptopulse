import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

function Analytics() {
  const [history, setHistory] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState("bitcoin");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Read theme from Settings
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "light"
  );

  // Listen for theme changes
  useEffect(() => {
    const updateTheme = () => {
      setTheme(localStorage.getItem("theme") || "light");
    };

    window.addEventListener("storage", updateTheme);

    // Also check when page becomes active
    const interval = setInterval(updateTheme, 500);

    return () => {
      window.removeEventListener("storage", updateTheme);
      clearInterval(interval);
    };
  }, []);

  const isDark = theme === "dark";

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${BASE_URL}/prices/history`);

      if (!response.ok) {
        throw new Error("Failed to fetch historical prices");
      }

      const result = await response.json();

      console.log("History data:", result);

      setHistory(result.data || []);
    } catch (err) {
      console.error("History fetch error:", err);
      setError("Unable to load historical price data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const coinHistory = history
    .filter((item) => item.coin === selectedCoin)
    .sort(
      (a, b) =>
        new Date(a.timestamp) - new Date(b.timestamp)
    );

  const chartData = coinHistory.map((item) => ({
    time: new Date(item.timestamp).toLocaleTimeString(),
    price: Number(item.price),
  }));

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

  const formatPrice = (price) => {
    if (price === null || price === undefined) {
      return "N/A";
    }

    return Number(price).toLocaleString("en-US", {
      maximumFractionDigits: 2,
    });
  };

  const coinName =
    selectedCoin.charAt(0).toUpperCase() +
    selectedCoin.slice(1);

  // ================= THEME COLORS =================

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

  return (
    <div
      style={{
        ...styles.container,
        backgroundColor: colors.background,
      }}
    >

      {/* ================= HEADER ================= */}

      <div style={styles.header}>

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
            Historical cryptocurrency price analysis
          </p>
        </div>

        <button
          onClick={fetchHistory}
          style={styles.refreshButton}
        >
          ↻ Refresh
        </button>

      </div>


      {/* ================= COIN SELECTOR ================= */}

      <div
        style={{
          ...styles.controls,
          backgroundColor: colors.card,
          border: `1px solid ${colors.border}`,
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
          value={selectedCoin}
          onChange={(e) =>
            setSelectedCoin(e.target.value)
          }
          style={{
            ...styles.select,
            backgroundColor: colors.input,
            color: colors.title,
            borderColor: colors.border,
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


      {/* ================= LOADING ================= */}

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


      {/* ================= ERROR ================= */}

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}


      {/* ================= ANALYTICS ================= */}

      {!loading && !error && (
        <>

          {/* ================= STATISTICS ================= */}

          <div style={styles.statsGrid}>

            <div
              style={{
                ...styles.statCard,
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
                boxShadow: colors.shadow,
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
                  ? `$${formatPrice(latestPrice)}`
                  : "N/A"}
              </strong>

            </div>


            <div
              style={{
                ...styles.statCard,
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
                boxShadow: colors.shadow,
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
                  ? `$${formatPrice(highestPrice)}`
                  : "N/A"}
              </strong>

            </div>


            <div
              style={{
                ...styles.statCard,
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
                boxShadow: colors.shadow,
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
                  ? `$${formatPrice(lowestPrice)}`
                  : "N/A"}
              </strong>

            </div>


            <div
              style={{
                ...styles.statCard,
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
                boxShadow: colors.shadow,
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


          {/* ================= CHART ================= */}

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
                  {coinName} Price History
                </h2>

                <p
                  style={{
                    ...styles.chartSubtitle,
                    color: colors.muted,
                  }}
                >
                  Historical price movement
                </p>

              </div>

            </div>


            {chartData.length === 0 ? (

              <p
                style={{
                  ...styles.message,
                  color: colors.muted,
                }}
              >
                No historical data available for{" "}
                {coinName}.
              </p>

            ) : (

              <div style={styles.chart}>

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <LineChart data={chartData}>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={
                        isDark
                          ? "#334155"
                          : "#e5e7eb"
                      }
                    />

                    <XAxis
                      dataKey="time"
                      stroke={
                        isDark
                          ? "#94a3b8"
                          : "#6b7280"
                      }
                    />

                    <YAxis
                      stroke={
                        isDark
                          ? "#94a3b8"
                          : "#6b7280"
                      }
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor:
                          colors.card,
                        border:
                          `1px solid ${colors.border}`,
                        color: colors.title,
                        borderRadius: "8px",
                      }}
                      formatter={(value) =>
                        `$${formatPrice(value)}`
                      }
                    />

                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={false}
                    />

                  </LineChart>

                </ResponsiveContainer>

              </div>

            )}

          </div>


          {/* ================= HISTORICAL TABLE ================= */}

          <div
            style={{
              ...styles.tableContainer,
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
              boxShadow: colors.shadow,
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

              <table style={styles.table}>

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

    </div>
  );
}


const styles = {

  container: {
    padding: "30px",
    minHeight: "calc(100vh - 65px)",
    boxSizing: "border-box",
    fontFamily: "Arial, sans-serif",
    transition:
      "background-color 0.25s ease",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
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

};

export default Analytics;