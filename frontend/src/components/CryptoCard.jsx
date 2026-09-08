function CryptoCard({
  coin,
  price,
  volume,
  marketCap,
  timestamp,
}) {
  const coinNames = {
    bitcoin: "Bitcoin",
    ethereum: "Ethereum",
    solana: "Solana",
  };

  const coinSymbols = {
    bitcoin: "BTC",
    ethereum: "ETH",
    solana: "SOL",
  };

  const coinIcons = {
    bitcoin: "₿",
    ethereum: "Ξ",
    solana: "S",
  };

  const formattedPrice = Number(price || 0).toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );

  const formattedVolume = Number(volume || 0).toLocaleString(
    "en-US",
    {
      maximumFractionDigits: 0,
    }
  );

  const formattedMarketCap = Number(
    marketCap || 0
  ).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString()
    : "--";

  return (
    <div className="crypto-card">

      {/* Top Section */}

      <div className="crypto-card-top">

        <div className="coin-info">

          <div className="coin-icon">
            {coinIcons[coin] || "₿"}
          </div>

          <div>
            <h3>
              {coinNames[coin] ||
                coin?.toUpperCase()}
            </h3>

            <span>
              {coinSymbols[coin] ||
                coin?.toUpperCase()}
            </span>
          </div>

        </div>

        <div className="live-badge">
          <span></span>
          LIVE
        </div>

      </div>

      {/* Price */}

      <div className="crypto-price">

        <span className="currency">
          $
        </span>

        {formattedPrice}

      </div>

      {/* Statistics */}

      <div className="crypto-stats">

        <div className="stat">

          <span className="stat-label">
            24h Volume
          </span>

          <span className="stat-value">
            ${formattedVolume}
          </span>

        </div>

        <div className="stat">

          <span className="stat-label">
            Market Cap
          </span>

          <span className="stat-value">
            ${formattedMarketCap}
          </span>

        </div>

      </div>

      {/* Updated Time */}

      <div className="updated">

        <span>●</span>

        Updated {formattedTime}

      </div>

      <style>
        {`

          .crypto-card {
            position: relative;
            padding: 25px;
            border-radius: 18px;
            background:
              rgba(255, 255, 255, 0.78);
            border:
              1px solid rgba(59, 130, 246, 0.15);
            box-shadow:
              0 10px 30px rgba(30, 64, 175, 0.08);
            backdrop-filter: blur(12px);
            transition:
              transform 0.25s ease,
              box-shadow 0.25s ease;
          }

          .crypto-card:hover {
            transform: translateY(-5px);
            box-shadow:
              0 18px 40px rgba(30, 64, 175, 0.15);
          }

          .crypto-card-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .coin-info {
            display: flex;
            align-items: center;
            gap: 13px;
          }

          .coin-icon {
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 14px;
            background:
              linear-gradient(
                135deg,
                #2563eb,
                #38bdf8
              );
            color: white;
            font-size: 25px;
            font-weight: 700;
            box-shadow:
              0 8px 20px
              rgba(37, 99, 235, 0.25);
          }

          .coin-info h3 {
            margin: 0;
            color: #172554;
            font-size: 18px;
          }

          .coin-info span {
            display: block;
            margin-top: 3px;
            color: #64748b;
            font-size: 12px;
            font-weight: 600;
          }

          .live-badge {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 9px;
            border-radius: 20px;
            background: #dcfce7;
            color: #15803d;
            font-size: 10px;
            font-weight: 700;
          }

          .live-badge span {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #22c55e;
            box-shadow:
              0 0 8px
              rgba(34, 197, 94, 0.7);
          }

          .crypto-price {
            margin-top: 25px;
            color: #0f172a;
            font-size: 31px;
            font-weight: 800;
            letter-spacing: -0.5px;
          }

          .currency {
            margin-right: 3px;
            color: #64748b;
            font-size: 18px;
            font-weight: 600;
          }

          .crypto-stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 22px;
          }

          .stat {
            padding: 12px;
            border-radius: 10px;
            background: #eff6ff;
          }

          .stat-label {
            display: block;
            color: #64748b;
            font-size: 11px;
          }

          .stat-value {
            display: block;
            margin-top: 5px;
            color: #1e3a8a;
            font-size: 12px;
            font-weight: 700;
          }

          .updated {
            margin-top: 17px;
            color: #94a3b8;
            font-size: 11px;
          }

          .updated span {
            margin-right: 5px;
            color: #22c55e;
          }

        `}
      </style>

    </div>
  );
}

export default CryptoCard;