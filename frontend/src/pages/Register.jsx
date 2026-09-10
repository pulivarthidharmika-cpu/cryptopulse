import { useState } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${BASE_URL}/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Registration failed"
        );
      }

      alert(
        "Registration successful! Your account is waiting for role assignment."
      );

      navigate("/login");

    } catch (err) {
      console.error(
        "Registration error:",
        err
      );

      setError(
        err.message ||
          "Something went wrong."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page} className="register-page">

      <div style={styles.glowOne}></div>
      <div style={styles.glowTwo}></div>

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

      <div style={styles.brand} className="register-brand">

        <div style={styles.logo}>
          ₿
        </div>

        <div>
          <h1 style={styles.brandName}>
            CryptoPulse
          </h1>

          <p style={styles.brandSub}>
            Real-Time Crypto Analytics
          </p>
        </div>

      </div>

      {/* Register Card */}

      <div style={styles.card} className="register-card">

        <h2 style={styles.title}>
          Create Account
        </h2>

        <p style={styles.subtitle}>
          Join CryptoPulse and monitor the crypto market
        </p>

        <form onSubmit={handleRegister}>

          {/* Name */}

          <label style={styles.label}>
            Name
          </label>

          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            style={styles.input}
            className="register-input"
            required
          />

          {/* Email */}

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
            className="register-input"
            required
          />

          {/* Password */}

          <label style={styles.label}>
            Password
          </label>

          <div style={styles.passwordWrapper}>

            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="Create a password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              style={styles.passwordInput}
              className="register-input"
              required
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(
                  !showPassword
                )
              }
              style={styles.eyeButton}
            >
              {showPassword
                ? "🙈"
                : "👁"}
            </button>

          </div>

          {/* Error */}

          {error && (
            <div style={styles.error}>
              ⚠ {error}
            </div>
          )}

          {/* Create Account */}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading
                ? "not-allowed"
                : "pointer",
            }}
            className="register-submit"
          >
            {loading
              ? "Creating Account..."
              : "Create Account →"}
          </button>

        </form>

        {/* Login */}

        <div style={styles.loginText}>

          <span>
            Already have an account?
          </span>

          <button
            type="button"
            onClick={() =>
              navigate("/login")
            }
            style={styles.loginButton}
            className="login-link"
          >
            Sign In
          </button>

        </div>

      </div>

      {/* Animations */}

      <style>
        {`

          @keyframes float {
            0%,100% {
              transform: translate(0,0);
            }

            50% {
              transform: translate(30px,-25px);
            }
          }

          .register-input {
            transition:
              border-color .2s ease,
              box-shadow .2s ease;
          }

          .register-input:focus {
            outline: none;

            border-color:
              #3b82f6 !important;

            box-shadow:
              0 0 0 3px
              rgba(59,130,246,0.15);
          }

          .register-submit {
            transition:
              transform .25s ease,
              box-shadow .25s ease,
              opacity .25s ease;
          }

          .register-submit:hover {
            transform: translateY(-2px);

            box-shadow:
              0 10px 30px
              rgba(37,99,235,.4);
          }

          .login-link {
            transition:
              color .2s ease;
          }

          .login-link:hover {
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
            .register-page {
              padding: 95px 16px 40px !important;
              align-items: flex-start !important;
              min-height: 100vh;
            }
            .register-brand {
              top: 20px !important;
              left: 16px !important;
              gap: 8px !important;
            }
            .register-brand h1 {
              font-size: 18px !important;
            }
            .register-brand p {
              display: none !important;
            }
            .back-home {
              top: 20px !important;
              right: 16px !important;
              padding: 6px 12px !important;
              font-size: 12px !important;
            }
            .register-card {
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
      "linear-gradient(135deg,#020617,#0b1f45,#0f3b78)",

    fontFamily:
      "Inter,Arial,sans-serif",
  },

  glowOne: {
    position: "absolute",
    width: "550px",
    height: "550px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle,rgba(37,99,235,.3),transparent 70%)",
    top: "-200px",
    left: "-150px",
    animation:
      "float 10s ease-in-out infinite",
  },

  glowTwo: {
    position: "absolute",
    width: "500px",
    height: "500px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle,rgba(14,165,233,.2),transparent 70%)",
    bottom: "-180px",
    right: "-120px",
    animation:
      "float 12s ease-in-out infinite reverse",
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
    top: "35px",
    left: "45px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: "white",
  },

  logo: {
    width: "46px",
    height: "46px",
    borderRadius: "12px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background:
      "linear-gradient(135deg,#2563eb,#38bdf8)",
    fontSize: "25px",
    fontWeight: "700",
  },

  brandName: {
    margin: 0,
    fontSize: "23px",
    fontWeight: "800",
  },

  brandSub: {
    margin: "3px 0 0",
    color: "#93c5fd",
    fontSize: "12px",
  },

  card: {
    position: "relative",
    zIndex: 2,
    width: "440px",
    padding: "42px",
    borderRadius: "20px",
    background:
      "rgba(15,23,42,.72)",
    border:
      "1px solid rgba(147,197,253,.18)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    boxShadow:
      "0 25px 70px rgba(0,0,0,.35)",
    boxSizing: "border-box",
  },

  title: {
    margin: 0,
    color: "white",
    fontSize: "30px",
    fontWeight: "800",
  },

  subtitle: {
    color: "#94a3b8",
    fontSize: "14px",
    lineHeight: "1.5",
    marginBottom: "28px",
  },

  label: {
    display: "block",
    marginBottom: "8px",
    marginTop: "17px",
    color: "#e2e8f0",
    fontSize: "14px",
    fontWeight: "600",
  },

  input: {
    width: "100%",
    padding: "14px",
    boxSizing: "border-box",
    border:
      "1px solid rgba(148,163,184,.3)",
    borderRadius: "9px",
    background:
      "rgba(15,23,42,.65)",
    color: "white",
    fontSize: "15px",
  },

  passwordWrapper: {
    position: "relative",
  },

  passwordInput: {
    width: "100%",
    padding: "14px 50px 14px 14px",
    boxSizing: "border-box",
    border:
      "1px solid rgba(148,163,184,.3)",
    borderRadius: "9px",
    background:
      "rgba(15,23,42,.65)",
    color: "white",
    fontSize: "15px",
  },

  eyeButton: {
    position: "absolute",
    right: "8px",
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "18px",
  },

  error: {
    marginTop: "18px",
    padding: "12px",
    borderRadius: "8px",
    background:
      "rgba(239,68,68,.12)",
    border:
      "1px solid rgba(248,113,113,.25)",
    color: "#fca5a5",
    fontSize: "13px",
  },

  button: {
    width: "100%",
    marginTop: "25px",
    padding: "15px",
    border: "none",
    borderRadius: "9px",
    background:
      "linear-gradient(135deg,#2563eb,#0ea5e9)",
    color: "white",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
  },

  loginText: {
    marginTop: "25px",
    paddingTop: "20px",
    borderTop:
      "1px solid rgba(148,163,184,.15)",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "14px",
  },

  loginButton: {
    marginLeft: "7px",
    border: "none",
    background: "transparent",
    color: "#60a5fa",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default Register;