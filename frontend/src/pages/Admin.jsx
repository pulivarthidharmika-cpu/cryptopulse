import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/admin.css";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function Admin() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingEmail, setUpdatingEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==================================================
  // COIN MANAGEMENT STATE
  // ==================================================

  const [coins, setCoins] = useState([]);
  const [loadingCoins, setLoadingCoins] = useState(true);
  const [showAddCoin, setShowAddCoin] = useState(false);
  const [newCoinName, setNewCoinName] = useState("");
  const [newCoinSymbol, setNewCoinSymbol] = useState("");
  const [submittingCoin, setSubmittingCoin] = useState(false);
  const [deletingCoin, setDeletingCoin] = useState("");
  const [coinError, setCoinError] = useState("");
  const [coinSuccess, setCoinSuccess] = useState("");

  // ==================================================
  // FETCH COINS
  // ==================================================

  const fetchCoins = async () => {
    try {
      setLoadingCoins(true);
      setCoinError("");

      const token = localStorage.getItem("token");

      const response = await fetch(`${BASE_URL}/admin/coins`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to fetch coins");
      }

      setCoins(data.coins || []);
    } catch (err) {
      console.error("Fetch coins error:", err);
      setCoinError(err.message || "Unable to load coins.");
    } finally {
      setLoadingCoins(false);
    }
  };

  // ==================================================
  // ADD COIN
  // ==================================================

  const handleAddCoin = async (e) => {
    e.preventDefault();

    const name = newCoinName.trim();
    const symbol = newCoinSymbol.trim().toUpperCase();

    if (!name || !symbol) {
      setCoinError("Both Coin Name and Symbol are required.");
      return;
    }

    try {
      setSubmittingCoin(true);
      setCoinError("");
      setCoinSuccess("");

      const token = localStorage.getItem("token");

      const response = await fetch(`${BASE_URL}/admin/coins`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          symbol,
          coin: name.toLowerCase().replace(/\s+/g, "-"),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to add coin");
      }

      setCoinSuccess(`Cryptocurrency '${name}' (${symbol}) added successfully.`);
      setNewCoinName("");
      setNewCoinSymbol("");

      // Refresh coins list
      await fetchCoins();
    } catch (err) {
      console.error("Add coin error:", err);
      setCoinError(err.message || "Unable to add coin.");
    } finally {
      setSubmittingCoin(false);
    }
  };

  // ==================================================
  // DELETE COIN
  // ==================================================

  const handleDeleteCoin = async (coinKey) => {
    try {
      setDeletingCoin(coinKey);
      setCoinError("");
      setCoinSuccess("");

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${BASE_URL}/admin/coins/${encodeURIComponent(coinKey)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to delete coin");
      }

      setCoinSuccess(data.message || `Cryptocurrency '${coinKey}' removed.`);
      await fetchCoins();
    } catch (err) {
      console.error("Delete coin error:", err);
      setCoinError(err.message || "Unable to delete coin.");
    } finally {
      setDeletingCoin("");
    }
  };

  // ==================================================
  // FETCH USERS
  // ==================================================

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${BASE_URL}/admin/users`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to fetch users"
        );
      }

      setUsers(data.users || []);

    } catch (err) {
      console.error("Fetch users error:", err);

      setError(
        err.message || "Unable to load users."
      );

    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // LOAD USERS
  // ==================================================

  useEffect(() => {
    fetchUsers();
    fetchCoins();
  }, []);

  // ==================================================
  // UPDATE ROLE
  // ==================================================

  const handleRoleChange = async (email, newRole) => {
    try {
      setUpdatingEmail(email);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${BASE_URL}/admin/users/${encodeURIComponent(email)}/role`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            role: newRole,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to update role"
        );
      }

      // Update the table immediately
      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.email === email
            ? {
                ...user,
                role: newRole,
              }
            : user
        )
      );

      setSuccess(
        `${email} role updated to ${newRole}.`
      );

    } catch (err) {
      console.error("Role update error:", err);

      setError(
        err.message || "Unable to update role."
      );

    } finally {
      setUpdatingEmail("");
    }
  };

  // ==================================================
  // LOGOUT
  // ==================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("profileName");

    localStorage.setItem("loggedOut", "true");

    navigate("/login");
  };

  // ==================================================
  // PAGE
  // ==================================================

  return (
    <div className="admin-page">

      {/* ============================================= */}
      {/* HEADER */}
      {/* ============================================= */}

      <header className="admin-header">

        <div className="admin-brand">

          <div className="admin-logo">
            ₿
          </div>

          <div>
            <h1>CryptoPulse</h1>

            <p>
              Administration Panel
            </p>
          </div>

        </div>

        <div className="admin-header-actions">

          <button
            className="back-button"
            onClick={() => navigate("/dashboard")}
          >
            ← Dashboard
          </button>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </header>


      {/* ============================================= */}
      {/* MAIN CONTENT */}
      {/* ============================================= */}

      <main className="admin-container">

        {/* PAGE HEADING */}

        <div className="admin-heading">

          <div>

            <span className="admin-label">
              ADMINISTRATION
            </span>

            <h2>
              User Management
            </h2>

            <p>
              View registered users and manage
              their access roles.
            </p>

          </div>


          <div className="user-count-card">

            <span>
              Registered Users
            </span>

            <strong>
              {users.length}
            </strong>

          </div>

        </div>


        {/* =========================================== */}
        {/* MESSAGES */}
        {/* =========================================== */}

        {error && (
          <div className="admin-message error-message">
            ⚠ {error}
          </div>
        )}

        {success && (
          <div className="admin-message success-message">
            ✓ {success}
          </div>
        )}


        {/* =========================================== */}
        {/* USERS CARD */}
        {/* =========================================== */}

        <section className="users-card">

          <div className="users-card-header">

            <div>

              <h3>
                Registered Users
              </h3>

              <p>
                Assign roles to control user
                access within CryptoPulse.
              </p>

            </div>


            <button
              className="refresh-button"
              onClick={fetchUsers}
              disabled={loading}
            >
              ↻ Refresh
            </button>

          </div>


          {/* ========================================= */}
          {/* LOADING */}
          {/* ========================================= */}

          {loading ? (

            <div className="admin-loading">

              <div className="loader"></div>

              <p>
                Loading users...
              </p>

            </div>

          ) : users.length === 0 ? (

            /* ======================================= */
            /* EMPTY */
            /* ======================================= */

            <div className="empty-state">

              <div className="empty-icon">
                👥
              </div>

              <h3>
                No registered users
              </h3>

              <p>
                New users will appear here
                after registration.
              </p>

            </div>

          ) : (

            /* ======================================= */
            /* TABLE */
            /* ======================================= */

            <div className="users-table-wrapper">

              <table className="users-table">

                <thead>

                  <tr>
                    <th>#</th>
                    <th>Email Address</th>
                    <th>Current Role</th>
                    <th>Change Role</th>
                    <th>Status</th>
                  </tr>

                </thead>


                <tbody>

                  {users.map((user, index) => (

                    <tr key={user.email}>

                      {/* NUMBER */}

                      <td className="user-number">
                        {index + 1}
                      </td>


                      {/* EMAIL */}

                      <td>

                        <div className="email-cell">

                          <div className="user-avatar">

                            {user.email
                              ?.charAt(0)
                              ?.toUpperCase()}

                          </div>

                          <span>
                            {user.email}
                          </span>

                        </div>

                      </td>


                      {/* CURRENT ROLE */}

                      <td>

                        <span
                          className={`role-badge ${
                            user.role || "pending"
                          }`}
                        >
                          {user.role || "pending"}
                        </span>

                      </td>


                      {/* CHANGE ROLE */}

                      <td>

                        <select
                          className="role-select"

                          value={
                            user.role || "pending"
                          }

                          disabled={
                            updatingEmail ===
                            user.email
                          }

                          onChange={(event) =>
                            handleRoleChange(
                              user.email,
                              event.target.value
                            )
                          }
                        >

                          <option value="pending">
                            Pending
                          </option>

                          <option value="user">
                            User
                          </option>

                          <option value="analyst">
                            Analyst
                          </option>

                          <option value="admin">
                            Admin
                          </option>

                        </select>

                      </td>


                      {/* STATUS */}

                      <td>

                        {updatingEmail ===
                        user.email ? (

                          <span className="updating">
                            Updating...
                          </span>

                        ) : (

                          <span className="active-status">
                            ● Active
                          </span>

                        )}

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>


        {/* =========================================== */}
        {/* COIN MANAGEMENT CARD */}
        {/* =========================================== */}

        <section className="coins-card users-card" style={{ marginTop: "32px" }}>

          <div className="users-card-header">

            <div>

              <h3>
                Coin Management
              </h3>

              <p>
                Configure cryptocurrencies supported by CryptoPulse.
              </p>

            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>

              <button
                className="refresh-button"
                onClick={fetchCoins}
                disabled={loadingCoins}
              >
                ↻ Refresh
              </button>

              <button
                className="add-coin-toggle-btn"
                onClick={() => {
                  setShowAddCoin((prev) => !prev);
                  setCoinError("");
                  setCoinSuccess("");
                }}
              >
                {showAddCoin ? "✕ Close" : "+ Add Coin"}
              </button>

            </div>

          </div>

          {/* ADD COIN DRAWER / FORM */}
          {showAddCoin && (
            <div className="add-coin-container">

              <form onSubmit={handleAddCoin} className="add-coin-form">

                <div className="add-coin-field">
                  <label htmlFor="admin-coin-name">Coin Name</label>
                  <input
                    id="admin-coin-name"
                    type="text"
                    placeholder="e.g. Cardano"
                    value={newCoinName}
                    onChange={(e) => setNewCoinName(e.target.value)}
                    className="add-coin-input"
                    required
                  />
                </div>

                <div className="add-coin-field">
                  <label htmlFor="admin-coin-symbol">Symbol</label>
                  <input
                    id="admin-coin-symbol"
                    type="text"
                    placeholder="e.g. ADA"
                    value={newCoinSymbol}
                    onChange={(e) => setNewCoinSymbol(e.target.value.toUpperCase())}
                    className="add-coin-input"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="add-coin-submit-btn"
                  disabled={submittingCoin}
                >
                  {submittingCoin ? "Adding..." : "Add Coin"}
                </button>

              </form>

              {coinError && (
                <div className="admin-message error-message" style={{ margin: "14px 0 0" }}>
                  ⚠ {coinError}
                </div>
              )}

              {coinSuccess && (
                <div className="admin-message success-message" style={{ margin: "14px 0 0" }}>
                  ✓ {coinSuccess}
                </div>
              )}

            </div>
          )}

          {/* COINS TABLE */}
          {loadingCoins ? (
            <div className="admin-loading">
              <div className="loader"></div>
              <p>Loading cryptocurrencies...</p>
            </div>
          ) : coins.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🪙</div>
              <h3>No coins configured</h3>
              <p>Add cryptocurrencies using the button above.</p>
            </div>
          ) : (
            <div className="users-table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Cryptocurrency</th>
                    <th>Symbol</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coins.map((c, index) => {
                    const isCore = ["bitcoin", "ethereum", "solana"].includes(c.coin.toLowerCase());
                    return (
                      <tr key={c.coin}>
                        <td className="user-number">{index + 1}</td>
                        <td>
                          <div className="email-cell">
                            <div className="coin-avatar">
                              {c.symbol ? c.symbol.slice(0, 3) : c.coin.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: "600" }}>
                              {c.name || c.coin.charAt(0).toUpperCase() + c.coin.slice(1)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="coin-symbol-badge">
                            {c.symbol || c.coin.slice(0, 4).toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span className="active-status">● {c.status || "Active"}</span>
                        </td>
                        <td>
                          {isCore ? (
                            <span className="core-badge" title="Core supported cryptocurrency">
                              System Core
                            </span>
                          ) : (
                            <button
                              className="delete-coin-btn"
                              onClick={() => handleDeleteCoin(c.coin)}
                              disabled={deletingCoin === c.coin}
                            >
                              {deletingCoin === c.coin ? "Removing..." : "Remove"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </section>


        {/* =========================================== */}
        {/* ROLE INFORMATION */}
        {/* =========================================== */}

        <section className="role-info">

          <div className="role-info-heading">

            <span className="admin-label">
              ACCESS CONTROL
            </span>

            <h3>
              Role Permissions
            </h3>

          </div>


          <div className="role-grid">

            {/* USER */}

            <div className="role-info-card">

              <div className="role-info-icon user-icon">
                U
              </div>

              <div>

                <h4>
                  User
                </h4>

                <p>
                  Access the main CryptoPulse
                  dashboard and cryptocurrency
                  monitoring features.
                </p>

              </div>

            </div>


            {/* ANALYST */}

            <div className="role-info-card">

              <div className="role-info-icon analyst-icon">
                A
              </div>

              <div>

                <h4>
                  Analyst
                </h4>

                <p>
                  Access dashboard data and
                  analytical features for
                  cryptocurrency analysis.
                </p>

              </div>

            </div>


            {/* ADMIN */}

            <div className="role-info-card">

              <div className="role-info-icon admin-icon">
                A
              </div>

              <div>

                <h4>
                  Admin
                </h4>

                <p>
                  Full access including user,
                  role and cryptocurrency
                  management.
                </p>

              </div>

            </div>

          </div>

        </section>

      </main>


      {/* ============================================= */}
      {/* FOOTER */}
      {/* ============================================= */}

      <footer className="admin-footer">

        CryptoPulse • Administration Panel

      </footer>

    </div>
  );
}

export default Admin;