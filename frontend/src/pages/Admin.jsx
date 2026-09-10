import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/admin.css";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

function Admin() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingEmail, setUpdatingEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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