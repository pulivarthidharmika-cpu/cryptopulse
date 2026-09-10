import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">

      {/* ================= NAVBAR ================= */}
      <nav className="home-navbar">
        <div className="home-logo">
          <span>◈</span>
          CryptoPulse
        </div>

        <div className="home-nav-buttons">
          <button
            className="nav-login"
            onClick={() => navigate("/login")}
          >
            Login
          </button>

          <button
            className="nav-register"
            onClick={() => navigate("/register")}
          >
            Get Started
          </button>
        </div>
      </nav>


      {/* ================= HERO ================= */}
      <section className="hero-section">

        <div className="hero-content">

          <div className="hero-badge">
            LIVE CRYPTO MONITORING
          </div>

          <h1>
            Track Crypto.
            <br />
            <span>Understand Markets.</span>
          </h1>

          <p>
            CryptoPulse is a real-time cryptocurrency monitoring and
            analytics platform that helps you track prices, analyze
            market trends, and make data-driven decisions.
          </p>

          <div className="hero-buttons">

            <button
              className="primary-button"
              onClick={() => navigate("/register")}
            >
              Get Started
            </button>

            <button
              className="secondary-button"
              onClick={() => navigate("/login")}
            >
              Login to Dashboard
            </button>

          </div>

        </div>


        {/* ================= CRYPTO PREVIEW ================= */}
        <div className="crypto-preview">

          <div className="preview-header">

            <div>
              <small>MARKET OVERVIEW</small>
              <h3>Live Prices</h3>
            </div>

            <span className="live-status">
              ● LIVE
            </span>

          </div>


          {/* Bitcoin */}
          <div className="crypto-item">

            <div className="coin-info">

              <div className="coin-icon bitcoin">
                ₿
              </div>

              <div>
                <strong>Bitcoin</strong>
                <small>BTC</small>
              </div>

            </div>

            <div className="coin-price">
              <strong>$104,284.32</strong>
              <span>+2.41%</span>
            </div>

          </div>


          {/* Ethereum */}
          <div className="crypto-item">

            <div className="coin-info">

              <div className="coin-icon ethereum">
                Ξ
              </div>

              <div>
                <strong>Ethereum</strong>
                <small>ETH</small>
              </div>

            </div>

            <div className="coin-price">
              <strong>$4,021.74</strong>
              <span>+1.82%</span>
            </div>

          </div>


          {/* Solana */}
          <div className="crypto-item">

            <div className="coin-info">

              <div className="coin-icon solana">
                S
              </div>

              <div>
                <strong>Solana</strong>
                <small>SOL</small>
              </div>

            </div>

            <div className="coin-price">
              <strong>$214.58</strong>
              <span>+3.16%</span>
            </div>

          </div>

        </div>

      </section>


      {/* ================= FEATURES ================= */}
      <section className="features-section">

        <div className="section-heading">

          <span>WHY CRYPTOPULSE</span>

          <h2>
            Everything you need to monitor crypto
          </h2>

        </div>


        <div className="features-grid">

          <div className="feature-card">

            <div className="feature-icon">
              ◉
            </div>

            <h3>Real-Time Prices</h3>

            <p>
              Monitor cryptocurrency prices with continuously
              updated market data.
            </p>

          </div>


          <div className="feature-card">

            <div className="feature-icon">
              ◇
            </div>

            <h3>Market Analytics</h3>

            <p>
              Explore historical data and identify important
              market trends and movements.
            </p>

          </div>


          <div className="feature-card">

            <div className="feature-icon">
              ⚡
            </div>

            <h3>Price Alerts</h3>

            <p>
              Stay informed when cryptocurrencies reach your
              preferred price levels.
            </p>

          </div>


          <div className="feature-card">

            <div className="feature-icon">
              ✓
            </div>

            <h3>Secure Access</h3>

            <p>
              Protected authentication keeps your account and
              application data secure.
            </p>

          </div>

        </div>

      </section>


      {/* ================= TECHNOLOGY ================= */}
      <section className="technology-section">

        <div>

          <span className="section-label">
            BUILT WITH MODERN TECHNOLOGY
          </span>

          <h2>
            Designed for reliable crypto analytics
          </h2>

          <p>
            CryptoPulse combines a FastAPI backend, MongoDB,
            Kafka-based data processing, and a modern React
            frontend to deliver a scalable cryptocurrency
            monitoring experience.
          </p>

        </div>


        <div className="technology-list">

          <div>
            <strong>FastAPI</strong>
            <span>
              High-performance backend APIs
            </span>
          </div>

          <div>
            <strong>MongoDB</strong>
            <span>
              Flexible storage for market data
            </span>
          </div>

          <div>
            <strong>Apache Kafka</strong>
            <span>
              Real-time data streaming
            </span>
          </div>

          <div>
            <strong>React</strong>
            <span>
              Interactive monitoring dashboard
            </span>
          </div>

        </div>

      </section>


      {/* ================= CTA ================= */}
      <section className="cta-section">

        <h2>
          Start monitoring the crypto market
        </h2>

        <p>
          Create your account and explore CryptoPulse.
        </p>

        <button
          className="primary-button"
          onClick={() => navigate("/register")}
        >
          Create Account
        </button>

      </section>


      {/* ================= FOOTER ================= */}
      <footer className="home-footer">

        <div>
          ◈ CryptoPulse
        </div>

        <span>
          Real-Time Cryptocurrency Monitoring & Analytics
        </span>

        <span>
          © 2026 CryptoPulse
        </span>

      </footer>

    </div>
  );
}

export default Home;