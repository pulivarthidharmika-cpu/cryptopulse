import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Backend error:", data);

        const errorMessage =
          data.detail ||
          data.message ||
          "Registration failed";

        throw new Error(errorMessage);
      }

      console.log("Signup success:", data);

      alert("Registration successful! Please login.");

      navigate("/login");
    } catch (error) {
      console.error("Login failed:", error);
      alert(error.message);
  }
    finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>CryptoPulse Register</h2>

      <form onSubmit={handleRegister} style={styles.form}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          required
        />

        <button
          type="submit"
          style={styles.button}
          disabled={loading}
        >
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>

      <p style={styles.loginText}>
        Already have an account?{" "}
        <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Arial",
    backgroundColor: "#f5f5f5",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    width: "280px",
    gap: "12px",
    padding: "20px",
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },

  input: {
    padding: "10px",
    fontSize: "14px",
    border: "1px solid #ccc",
    borderRadius: "5px",
  },

  button: {
    padding: "10px",
    backgroundColor: "black",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },

  loginText: {
    marginTop: "10px",
  },
};

export default Register;