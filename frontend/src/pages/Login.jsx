import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const wasLoggedOut =
    localStorage.getItem("loggedOut") === "true";

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const data = await loginUser(email, password);

      console.log("Login successful:", data);

      // Store authentication information
      localStorage.setItem(
        "token",
        data.access_token
      );

      localStorage.removeItem("loggedOut");

      // Store user information
      localStorage.setItem(
        "userEmail",
        email
      );

      localStorage.setItem(
        "profileName",
        data.name || "CryptoPulse User"
      );

      localStorage.setItem(
        "role",
        data.role || "user"
      );

      // Go to Dashboard
      navigate("/dashboard");

    } catch (err) {
      console.error("Login error:", err);

      setError(
        err.message ||
          "Invalid email or password."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page} className="login-page">

      {/* Animated Background */}

      <div style={styles.glowOne}></div>
      <div style={styles.glowTwo}></div>
      <div style={styles.glowThree}></div>

      <div style={styles.particleOne}>✦</div>
      <div style={styles.particleTwo}>+</div>
      <div style={styles.particleThree}>•</div>
      <div style={styles.particleFour}>✦</div>
      <div style={styles.particleFive}>•</div>

      {/* Back to Home */}

      <button
        type="button"
        onClick={() => navigate("/")}
        style={styles.backHome}
        className="back-home"
      >
        ← Back to Home
      </button>

      {/* Brand */}

      <div style={styles.brand} className="login-brand">

        <div style={styles.logo}>
          ₿
        </div>

        <div>
          <h1 style={styles.brandName}>
            CryptoPulse
          </h1>

          <p style={styles.brandTagline}>
            Real-Time Crypto Analytics
          </p>
        </div>

      </div>

      {/* Login Card */}

      <div style={styles.card} className="login-card">

        <div style={styles.cardHeader}>

          <h2 style={styles.title}>
            Welcome
          </h2>

          <p style={styles.subtitle}>
            Sign in to your CryptoPulse dashboard
          </p>

        </div>

        <form onSubmit={handleLogin}>

          {/* Email */}

          <div style={styles.field}>

            <label style={styles.label}>
              Email Address
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              style={styles.input}
              className="login-input"
              required
            />

          </div>

          {/* Password */}

          <div style={styles.field}>

            <label style={styles.label}>
              Password
            </label>

            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="Enter your password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              style={styles.passwordInput}
              className="login-input"
              required
            />

            {/* Show Password */}

            <label style={styles.showPassword}>

              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) =>
                  setShowPassword(
                    e.target.checked
                  )
                }
                style={styles.checkbox}
              />

              <span>
                Show password
              </span>

            </label>

          </div>

          {/* Error */}

          {error && (
            <div style={styles.error}>

              <span style={styles.errorIcon}>
                ⚠
              </span>

              <span>
                {error}
              </span>

            </div>
          )}

          {/* Login Button */}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.loginButton,
              opacity: loading ? 0.7 : 1,
              cursor: loading
                ? "not-allowed"
                : "pointer",
            }}
            className="login-button"
          >
            {loading
              ? "Signing in..."
              : "Sign In →"}
          </button>

        </form>

        {/* Register */}

        <div style={styles.register}>

          <span>
            Don't have an account?
          </span>

          <button
            type="button"
            onClick={() =>
              navigate("/register")
            }
            style={styles.registerButton}
            className="register-link"
          >
            Create Account
          </button>

        </div>

      </div>

      {/* Footer */}

      <p style={styles.footer}>
        CryptoPulse • Real-Time Cryptocurrency
        Monitoring & Analytics
      </p>

      {/* Animations */}

      <style>
        {`

          @keyframes floatOne {
            0%, 100% {
              transform: translate(0, 0);
            }

            50% {
              transform: translate(30px, -35px);
            }
          }

          @keyframes floatTwo {
            0%, 100% {
              transform: translate(0, 0);
            }

            50% {
              transform: translate(-35px, 25px);
            }
          }

          @keyframes floatThree {
            0%, 100% {
              transform: translate(0, 0);
            }

            50% {
              transform: translate(20px, 30px);
            }
          }

          @keyframes pulse {
            0%, 100% {
              opacity: .3;
              transform: scale(1);
            }

            50% {
              opacity: .8;
              transform: scale(1.15);
            }
          }

          @keyframes logoPulse {
            0%, 100% {
              box-shadow:
                0 0 20px
                rgba(59,130,246,.25);
            }

            50% {
              box-shadow:
                0 0 35px
                rgba(59,130,246,.55);
            }
          }

          .login-input {
            transition:
              border-color .2s ease,
              box-shadow .2s ease;
          }

          .login-input:focus {
            outline: none;

            border-color:
              #3b82f6 !important;

            box-shadow:
              0 0 0 3px
              rgba(59,130,246,.15);
          }

          .login-button {
            transition:
              transform .25s ease,
              box-shadow .25s ease,
              opacity .25s ease;
          }

          .login-button:hover {
            transform: translateY(-2px);

            box-shadow:
              0 10px 30px
              rgba(37,99,235,.4);
          }

          .register-link {
            transition:
              color .2s ease;
          }

          .register-link:hover {
            color: #93c5fd !important;
          }

          .back-home {
            transition:
              background .2s ease,
              border-color .2s ease,
              color .2s ease,
              transform .2s ease;
          }

          .back-home:hover {
            background: rgba(37,99,235,.15);
            border-color: rgba(96,165,250,.4);
            color: #bfdbfe !important;
            transform: translateY(-1px);
          }

          @media (max-width: 640px) {
            .login-page {
              padding: 95px 16px 40px !important;
              align-items: flex-start !important;
              min-height: 100vh;
            }
            .login-brand {
              top: 20px !important;
              left: 16px !important;
              gap: 8px !important;
            }
            .login-brand h1 {
              font-size: 18px !important;
            }
            .login-brand p {
              display: none !important;
            }
            .back-home {
              top: 20px !important;
              right: 16px !important;
              padding: 6px 12px !important;
              font-size: 12px !important;
            }
            .login-card {
              width: 100% !important;
              max-width: 100% !important;
              padding: 26px 20px !important;
              margin-top: 15px;
            }
          }

        `}
      </style>

    </div>
  );
}

const styles = {

  page: {
    minHeight: "100vh",
    width: "100%",
    position: "relative",
    overflow: "hidden",

    display: "flex",
    justifyContent: "center",
    alignItems: "center",

    background:
      "linear-gradient(135deg, #020617 0%, #0b1f45 45%, #0f3b78 100%)",

    fontFamily:
      "Inter, Arial, Helvetica, sans-serif",
  },

  glowOne: {
    position: "absolute",
    width: "500px",
    height: "500px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(37,99,235,.28), transparent 70%)",
    top: "-180px",
    left: "-120px",
    animation:
      "floatOne 10s ease-in-out infinite",
  },

  glowTwo: {
    position: "absolute",
    width: "600px",
    height: "600px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(14,165,233,.20), transparent 70%)",
    bottom: "-250px",
    right: "-180px",
    animation:
      "floatTwo 12s ease-in-out infinite",
  },

  glowThree: {
    position: "absolute",
    width: "350px",
    height: "350px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(99,102,241,.20), transparent 70%)",
    top: "35%",
    right: "20%",
    animation:
      "floatThree 9s ease-in-out infinite",
  },

  particleOne: {
    position: "absolute",
    top: "18%",
    left: "14%",
    color: "#60a5fa",
    fontSize: "24px",
    animation:
      "pulse 4s ease-in-out infinite",
  },

  particleTwo: {
    position: "absolute",
    top: "30%",
    right: "15%",
    color: "#38bdf8",
    fontSize: "30px",
    animation:
      "pulse 5s ease-in-out infinite",
  },

  particleThree: {
    position: "absolute",
    bottom: "22%",
    left: "20%",
    color: "#93c5fd",
    fontSize: "22px",
    animation:
      "pulse 3s ease-in-out infinite",
  },

  particleFour: {
    position: "absolute",
    bottom: "17%",
    right: "25%",
    color: "#60a5fa",
    fontSize: "20px",
    animation:
      "pulse 4.5s ease-in-out infinite",
  },

  particleFive: {
    position: "absolute",
    top: "65%",
    left: "8%",
    color: "#38bdf8",
    fontSize: "18px",
    animation:
      "pulse 5.5s ease-in-out infinite",
  },

  backHome: {
    position: "absolute",
    top: "32px",
    right: "50px",
    zIndex: 10,

    padding: "9px 16px",
    borderRadius: "8px",

    border:
      "1px solid rgba(147,197,253,.2)",

    background:
      "rgba(15,23,42,.45)",

    color: "#93c5fd",
    fontSize: "13px",
    fontWeight: "600",

    cursor: "pointer",

    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  },

  brand: {
    position: "absolute",
    top: "38px",
    left: "50px",
    display: "flex",
    alignItems: "center",
    gap: "13px",
    color: "white",
  },

  logo: {
    width: "46px",
    height: "46px",
    borderRadius: "13px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background:
      "linear-gradient(135deg, #2563eb, #38bdf8)",
    fontSize: "25px",
    fontWeight: "700",
    animation:
      "logoPulse 3s ease-in-out infinite",
  },

  brandName: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "800",
  },

  brandTagline: {
    margin: "3px 0 0",
    fontSize: "12px",
    color: "#93c5fd",
  },

  card: {
    position: "relative",
    zIndex: 5,
    width: "440px",
    padding: "42px",
    borderRadius: "20px",
    background:
      "rgba(15,23,42,.68)",
    border:
      "1px solid rgba(147,197,253,.18)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    boxShadow:
      "0 25px 70px rgba(0,0,0,.35)",
    boxSizing: "border-box",
  },

  cardHeader: {
    marginBottom: "30px",
  },

  title: {
    margin: 0,
    color: "white",
    fontSize: "31px",
    fontWeight: "800",
  },

  subtitle: {
    margin: "9px 0 0",
    color: "#94a3b8",
    fontSize: "15px",
    lineHeight: "1.5",
  },

  field: {
    marginBottom: "21px",
  },

  label: {
    display: "block",
    marginBottom: "9px",
    color: "#e2e8f0",
    fontSize: "14px",
    fontWeight: "600",
  },

  input: {
    width: "100%",
    padding: "14px 16px",
    boxSizing: "border-box",
    border:
      "1px solid rgba(148,163,184,.3)",
    borderRadius: "9px",
    background:
      "rgba(15,23,42,.65)",
    color: "white",
    fontSize: "15px",
  },

  passwordInput: {
    width: "100%",
    padding: "14px 16px",
    boxSizing: "border-box",
    border:
      "1px solid rgba(148,163,184,.3)",
    borderRadius: "9px",
    background:
      "rgba(15,23,42,.65)",
    color: "white",
    fontSize: "15px",
  },

  showPassword: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "10px",
    color: "#94a3b8",
    fontSize: "13px",
    cursor: "pointer",
    userSelect: "none",
  },

  checkbox: {
    width: "15px",
    height: "15px",
    accentColor: "#3b82f6",
    cursor: "pointer",
    margin: 0,
  },

  error: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    padding: "12px 14px",
    marginBottom: "18px",
    borderRadius: "8px",
    background:
      "rgba(239,68,68,.12)",
    border:
      "1px solid rgba(248,113,113,.25)",
    color: "#fca5a5",
    fontSize: "13px",
  },

  errorIcon: {
    fontSize: "15px",
  },

  loginButton: {
    width: "100%",
    padding: "15px",
    border: "none",
    borderRadius: "9px",
    background:
      "linear-gradient(135deg, #2563eb, #0ea5e9)",
    color: "white",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    transition:
      "all .25s ease",
  },

  register: {
    marginTop: "27px",
    paddingTop: "23px",
    borderTop:
      "1px solid rgba(148,163,184,.15)",
    display: "flex",
    justifyContent: "center",
    gap: "7px",
    fontSize: "14px",
    color: "#94a3b8",
  },

  registerButton: {
    border: "none",
    background: "transparent",
    color: "#60a5fa",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },

  footer: {
    position: "absolute",
    bottom: "25px",
    color: "#64748b",
    fontSize: "12px",
  },
};

export default Login;