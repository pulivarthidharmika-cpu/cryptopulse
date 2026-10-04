import { useEffect, useState } from "react";
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function Settings() {
  // --------------------------------------------------
  // Profile & Account
  // --------------------------------------------------

  const storedEmail =
    localStorage.getItem("userEmail") || "User";

  const storedName =
    localStorage.getItem("profileName") ||
    "CryptoPulse User";

  const [name, setName] = useState(storedName);
  const [email] = useState(storedEmail);

  const [accountData, setAccountData] = useState({
    name: storedName,
    email: storedEmail,
    role: localStorage.getItem("role") || "user",
    status: "Active",
    account_type: localStorage.getItem("role") === "admin" ? "System Administrator" : "Standard Trader",
    session_active: true,
  });

  const [editingProfile, setEditingProfile] =
    useState(false);

  const [editName, setEditName] =
    useState(storedName);

  const [profileMessage, setProfileMessage] =
    useState("");

  useEffect(() => {
    const fetchAccount = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await fetch(`${BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAccountData(data);
          if (data.name && !localStorage.getItem("profileName")) {
            setName(data.name);
            setEditName(data.name);
          }
        }
      } catch (err) {
        console.error("Failed to fetch user account details:", err);
      }
    };

    fetchAccount();
  }, []);

  // --------------------------------------------------
  // Notifications
  // --------------------------------------------------

  const [notifications, setNotifications] =
    useState(
      localStorage.getItem("notifications") !==
        "false"
    );

  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "light"
  );

  useEffect(() => {
    const handleStorage = () => {
      setTheme(localStorage.getItem("theme") || "light");
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    window.dispatchEvent(new Event("storage"));
  };

  // --------------------------------------------------
  // Load saved profile
  // --------------------------------------------------

  useEffect(() => {
    const savedName =
      localStorage.getItem("profileName");

    if (savedName) {
      setName(savedName);
      setEditName(savedName);
    }
  }, []);

  // --------------------------------------------------
  // Notifications
  // --------------------------------------------------

  useEffect(() => {
    localStorage.setItem(
      "notifications",
      notifications
    );
  }, [notifications]);

  // --------------------------------------------------
  // Edit Profile
  // --------------------------------------------------

  const handleEditProfile = () => {
    setEditName(name);
    setProfileMessage("");
    setEditingProfile(true);
  };

  const handleCancelProfile = () => {
    setEditName(name);
    setProfileMessage("");
    setEditingProfile(false);
  };

  const handleSaveProfile = () => {
    const trimmedName =
      editName.trim();

    if (!trimmedName) {
      setProfileMessage(
        "Please enter your name."
      );
      return;
    }

    localStorage.setItem(
      "profileName",
      trimmedName
    );

    setName(trimmedName);
    setEditName(trimmedName);

    setProfileMessage(
      "Profile updated successfully."
    );

    setTimeout(() => {
      setEditingProfile(false);
      setProfileMessage("");
    }, 1200);
  };



  return (
    <div className="settings-page">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="settings-heading">

        <div>
          <h1>Settings</h1>

          <p>
            Manage your CryptoPulse preferences
            and account.
          </p>
        </div>

      </div>


      {/* ==================================================
          PROFILE
      ================================================== */}

      <section className="settings-section">

        <div className="section-heading">

          <div className="section-icon">
            👤
          </div>

          <div>
            <h2>My Profile</h2>

            <p>
              Manage your personal information.
            </p>
          </div>

        </div>


        {!editingProfile ? (

          /* ================= PROFILE VIEW ================= */

          <div className="profile-card">

            <div className="avatar">
              {name.charAt(0).toUpperCase()}
            </div>

            <div className="profile-info">

              <h3>
                {name}
              </h3>

              <p>
                {email}
              </p>

            </div>

            <button
              className="secondary-button"
              onClick={handleEditProfile}
            >
              Edit Profile
            </button>

          </div>

        ) : (

          /* ================= PROFILE EDIT ================= */

          <div className="edit-profile-card">

            <div className="edit-profile-header">

              <div>
                <h3>
                  Edit Profile
                </h3>

                <p>
                  Update your profile information.
                </p>
              </div>

            </div>


            <div className="edit-field">

              <label>
                Display Name
              </label>

              <input
                type="text"
                value={editName}
                onChange={(e) =>
                  setEditName(e.target.value)
                }
                placeholder="Enter your name"
                autoFocus
              />

            </div>


            <div className="edit-field">

              <label>
                Email Address
              </label>

              <input
                type="email"
                value={email}
                disabled
              />

              <small>
                Email is managed by your account.
              </small>

            </div>


            {profileMessage && (
              <div
                className={
                  profileMessage.includes(
                    "successfully"
                  )
                    ? "success-message"
                    : "profile-error"
                }
              >
                {profileMessage}
              </div>
            )}


            <div className="edit-actions">

              <button
                className="cancel-button"
                onClick={
                  handleCancelProfile
                }
              >
                Cancel
              </button>

              <button
                className="save-button"
                onClick={
                  handleSaveProfile
                }
              >
                ✓ Save Changes
              </button>

            </div>

          </div>

        )}

      </section>


      {/* ==================================================
          NOTIFICATIONS
      ================================================== */}

      <section className="settings-section">

        <div className="section-heading">

          <div className="section-icon">
            🔔
          </div>

          <div>
            <h2>Notifications</h2>

            <p>
              Control CryptoPulse notifications.
            </p>
          </div>

        </div>


        <div className="setting-row">

          <div>

            <strong>
              Enable notifications
            </strong>

            <p>
              Receive alerts about crypto activity
              and system updates.
            </p>

          </div>


          <button
            className={`toggle ${
              notifications
                ? "toggle-on"
                : ""
            }`}
            onClick={() =>
              setNotifications(
                !notifications
              )
            }
            aria-label="Toggle notifications"
          >

            <span></span>

          </button>

        </div>

      </section>


      {/* ==================================================
          APPEARANCE & THEME
      ================================================== */}

      <section className="settings-section">

        <div className="section-heading">

          <div className="section-icon">
            🎨
          </div>

          <div>
            <h2>Appearance & Theme</h2>

            <p>
              Customize the visual appearance of CryptoPulse.
            </p>
          </div>

        </div>

        <div className="theme-options-grid">

          <div
            className={`theme-card ${theme === "light" ? "active" : ""}`}
            onClick={() => handleThemeChange("light")}
          >
            <div className="theme-card-icon">☀️</div>
            <div className="theme-info">
              <strong>Light Theme</strong>
              <p>Crisp daylight interface with clean contrast</p>
            </div>
            {theme === "light" && <span className="theme-active-badge">✓ Active</span>}
          </div>

          <div
            className={`theme-card ${theme === "dark" ? "active" : ""}`}
            onClick={() => handleThemeChange("dark")}
          >
            <div className="theme-card-icon">🌙</div>
            <div className="theme-info">
              <strong>Dark Theme</strong>
              <p>High-contrast deep slate for low-light monitoring</p>
            </div>
            {theme === "dark" && <span className="theme-active-badge">✓ Active</span>}
          </div>

          <div
            className={`theme-card ${theme === "system" ? "active" : ""}`}
            onClick={() => handleThemeChange("system")}
          >
            <div className="theme-card-icon">💻</div>
            <div className="theme-info">
              <strong>System Default</strong>
              <p>Automatically syncs with your operating system</p>
            </div>
            {theme === "system" && <span className="theme-active-badge">✓ Active</span>}
          </div>

        </div>

      </section>


      {/* ==================================================
          ACCOUNT
      ================================================== */}

      <section className="settings-section">

        <div className="section-heading">

          <div className="section-icon">
            🔐
          </div>

          <div>
            <h2>Account Details</h2>

            <p>
              Your authenticated CryptoPulse account information.
            </p>
          </div>

        </div>

        <div className="account-details-grid">

          <div className="account-detail-card">
            <span className="account-detail-label">Display Name</span>
            <strong className="account-detail-val">{name || accountData.name}</strong>
          </div>

          <div className="account-detail-card">
            <span className="account-detail-label">Email Address</span>
            <strong className="account-detail-val">{email || accountData.email}</strong>
          </div>

          <div className="account-detail-card">
            <span className="account-detail-label">Account Role</span>
            <div className="account-role-badge-wrap">
              <span className={`role-badge role-${(accountData.role || "user").toLowerCase()}`}>
                {(accountData.role || "user").toUpperCase()}
              </span>
              <small className="account-type-text">{accountData.account_type || "Standard Trader"}</small>
            </div>
          </div>

          <div className="account-detail-card">
            <span className="account-detail-label">Account Status</span>
            <div className="account-status-wrap">
              <span className="account-status-dot"></span>
              <strong className="account-status-text">{accountData.status || "Active"}</strong>
            </div>
          </div>

          <div className="account-detail-card full-width">
            <span className="account-detail-label">Security & Access Privileges</span>
            <p className="account-privilege-desc">
              {accountData.role === "admin"
                ? "Full administrative privileges: User role management, cryptocurrency catalog management, real-time alert monitoring, and system metrics."
                : (accountData.role === "analyst"
                  ? "Market analyst access: Live streaming ingestion, candlestick OHLC generation, cross-asset liquidity metrics, and price alert rules."
                  : "Standard trader access: Live market tracking, personal price alerts, and cryptocurrency portfolio analytics.")}
            </p>
          </div>

        </div>

      </section>


      {/* ==================================================
          STYLES
      ================================================== */}

      <style>
        {`

          /* ================= PAGE ================= */

          .settings-page {
            width: 100%;
            max-width: 1000px;
            margin: 0 auto;
            padding-bottom: 40px;
          }


          /* ================= HEADER ================= */

          .settings-heading {
            margin-bottom: 28px;
          }

          .settings-heading h1 {
            margin: 0;
            color: #172554;
            font-size: 32px;
            font-weight: 800;
          }

          .settings-heading p {
            margin: 7px 0 0;
            color: #64748b;
            font-size: 14px;
          }


          /* ================= SECTION ================= */

          .settings-section {
            margin-bottom: 20px;
            padding: 24px;
            border: 1px solid #dbeafe;
            border-radius: 18px;
            background: rgba(255,255,255,0.88);
            box-shadow:
              0 8px 25px
              rgba(30,64,175,0.06);
          }


          /* ================= SECTION HEADER ================= */

          .section-heading {
            display: flex;
            align-items: center;
            gap: 13px;
            margin-bottom: 20px;
          }

          .section-icon {
            width: 42px;
            height: 42px;

            display: flex;
            align-items: center;
            justify-content: center;

            border-radius: 12px;

            background: #eff6ff;

            font-size: 18px;
          }

          .section-heading h2 {
            margin: 0;
            color: #172554;
            font-size: 17px;
          }

          .section-heading p {
            margin: 3px 0 0;
            color: #94a3b8;
            font-size: 11px;
          }


          /* ================= PROFILE ================= */

          .profile-card {
            display: flex;
            align-items: center;
            gap: 15px;

            padding: 17px;

            border-radius: 14px;

            background: #f8fbff;

            border:
              1px solid #e0edff;
          }

          .avatar {
            width: 52px;
            height: 52px;

            display: flex;
            align-items: center;
            justify-content: center;

            flex-shrink: 0;

            border-radius: 50%;

            background:
              linear-gradient(
                135deg,
                #2563eb,
                #38bdf8
              );

            color: white;

            font-size: 19px;
            font-weight: 800;
          }

          .profile-info {
            flex: 1;
            min-width: 0;
          }

          .profile-info h3 {
            margin: 0;

            color: #172554;

            font-size: 14px;
            font-weight: 700;
          }

          .profile-info p {
            margin: 4px 0 0;

            color: #64748b;

            font-size: 11px;
          }


          /* ================= EDIT BUTTON ================= */

          .secondary-button {
            padding: 9px 13px;

            border:
              1px solid #bfdbfe;

            border-radius: 9px;

            background: white;

            color: #2563eb;

            font-size: 11px;
            font-weight: 700;

            cursor: pointer;

            transition:
              background 0.2s ease,
              transform 0.2s ease;
          }

          .secondary-button:hover {
            background: #eff6ff;
            transform: translateY(-1px);
          }


          /* ================= EDIT PROFILE ================= */

          .edit-profile-card {
            padding: 20px;

            border-radius: 14px;

            background: #f8fbff;

            border:
              1px solid #dbeafe;
          }

          .edit-profile-header {
            margin-bottom: 18px;
          }

          .edit-profile-header h3 {
            margin: 0;

            color: #172554;

            font-size: 15px;
          }

          .edit-profile-header p {
            margin: 4px 0 0;

            color: #64748b;

            font-size: 11px;
          }

          .edit-field {
            margin-bottom: 16px;
          }

          .edit-field label {
            display: block;

            margin-bottom: 7px;

            color: #334155;

            font-size: 12px;
            font-weight: 700;
          }

          .edit-field input {
            width: 100%;

            box-sizing: border-box;

            padding: 11px 13px;

            border:
              1px solid #cbd5e1;

            border-radius: 9px;

            background: white;

            color: #172554;

            font-size: 13px;

            outline: none;

            transition:
              border 0.2s ease,
              box-shadow 0.2s ease;
          }

          .edit-field input:focus {
            border-color: #60a5fa;

            box-shadow:
              0 0 0 3px
              rgba(59,130,246,0.12);
          }

          .edit-field input:disabled {
            background: #f1f5f9;

            color: #64748b;

            cursor: not-allowed;
          }

          .edit-field small {
            display: block;

            margin-top: 5px;

            color: #94a3b8;

            font-size: 9px;
          }


          /* ================= EDIT ACTIONS ================= */

          .edit-actions {
            display: flex;

            justify-content: flex-end;

            gap: 9px;

            margin-top: 20px;
          }

          .cancel-button,
          .save-button {
            padding: 10px 15px;

            border-radius: 9px;

            font-size: 11px;
            font-weight: 700;

            cursor: pointer;

            transition:
              transform 0.2s ease,
              box-shadow 0.2s ease;
          }

          .cancel-button {
            border:
              1px solid #cbd5e1;

            background: white;

            color: #475569;
          }

          .save-button {
            border: none;

            background:
              linear-gradient(
                135deg,
                #2563eb,
                #0ea5e9
              );

            color: white;

            box-shadow:
              0 5px 15px
              rgba(37,99,235,0.18);
          }

          .cancel-button:hover,
          .save-button:hover {
            transform: translateY(-1px);
          }


          /* ================= MESSAGES ================= */

          .success-message {
            padding: 10px 12px;

            margin-top: 5px;

            border-radius: 8px;

            background: #dcfce7;

            border:
              1px solid #bbf7d0;

            color: #15803d;

            font-size: 11px;
          }

          .profile-error {
            padding: 10px 12px;

            margin-top: 5px;

            border-radius: 8px;

            background: #fee2e2;

            border:
              1px solid #fecaca;

            color: #b91c1c;

            font-size: 11px;
          }


          /* ================= NOTIFICATIONS ================= */

          .setting-row {
            display: flex;

            align-items: center;

            justify-content: space-between;

            gap: 20px;

            padding: 16px;

            border-radius: 13px;

            background: #f8fbff;
          }

          .setting-row strong {
            display: block;

            color: #172554;

            font-size: 13px;
          }

          .setting-row p {
            margin: 4px 0 0;

            color: #64748b;

            font-size: 10px;
          }


          /* ================= TOGGLE ================= */

          .toggle {
            width: 46px;
            height: 25px;

            padding: 3px;

            border: none;

            border-radius: 20px;

            background: #cbd5e1;

            cursor: pointer;

            transition:
              background 0.2s ease;
          }

          .toggle span {
            display: block;

            width: 19px;
            height: 19px;

            border-radius: 50%;

            background: white;

            transition:
              transform 0.2s ease;
          }

          .toggle-on {
            background: #2563eb;
          }

          .toggle-on span {
            transform:
              translateX(21px);
          }


          /* ================= ACCOUNT ================= */

          /* ================= ACCOUNT DETAILS ================= */

          .account-details-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 16px;
          }

          .account-detail-card {
            padding: 16px;
            border-radius: 12px;
            background: #f8fbff;
            border: 1px solid #e0edff;
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .account-detail-card.full-width {
            grid-column: 1 / -1;
          }

          .account-detail-label {
            font-size: 11px;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .account-detail-val {
            font-size: 15px;
            color: #172554;
            font-weight: 700;
            word-break: break-all;
          }

          .account-role-badge-wrap {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
          }

          .role-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.5px;
          }

          .role-admin {
            background: rgba(37, 99, 235, 0.15);
            color: #2563eb;
            border: 1px solid rgba(37, 99, 235, 0.3);
          }

          .role-analyst {
            background: rgba(16, 185, 129, 0.15);
            color: #059669;
            border: 1px solid rgba(16, 185, 129, 0.3);
          }

          .role-user {
            background: rgba(100, 116, 139, 0.15);
            color: #475569;
            border: 1px solid rgba(100, 116, 139, 0.3);
          }

          .account-type-text {
            color: #64748b;
            font-size: 12px;
            font-weight: 600;
          }

          .account-status-wrap {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .account-status-dot {
            width: 9px;
            height: 9px;
            border-radius: 50%;
            background: #22c55e;
            box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
          }

          .account-status-text {
            color: #16a34a;
            font-size: 14px;
            font-weight: 700;
          }

          .account-privilege-desc {
            margin: 0;
            color: #475569;
            font-size: 13px;
            line-height: 1.6;
          }

          [data-theme="dark"] .account-detail-card {
            background: #1e293b;
            border-color: #334155;
          }

          [data-theme="dark"] .account-detail-label {
            color: #94a3b8;
          }

          [data-theme="dark"] .account-detail-val {
            color: #f8fafc;
          }

          [data-theme="dark"] .account-type-text {
            color: #cbd5e1;
          }

          [data-theme="dark"] .account-privilege-desc {
            color: #94a3b8;
          }


          /* ================= THEME OPTIONS ================= */

          .theme-options-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 14px;
            margin-top: 15px;
          }

          .theme-card {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 16px;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            background: white;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
          }

          .theme-card:hover {
            border-color: #93c5fd;
            transform: translateY(-2px);
          }

          .theme-card.active {
            border-color: #2563eb;
            background: rgba(37, 99, 235, 0.04);
            box-shadow: 0 4px 14px rgba(37, 99, 235, 0.12);
          }

          .theme-card-icon {
            font-size: 26px;
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f1f5f9;
            border-radius: 10px;
          }

          .theme-info {
            flex: 1;
          }

          .theme-info strong {
            display: block;
            color: #172554;
            font-size: 14px;
            font-weight: 700;
          }

          .theme-info p {
            margin: 4px 0 0;
            font-size: 11px;
            color: #64748b;
          }

          .theme-active-badge {
            font-size: 11px;
            font-weight: 700;
            color: #2563eb;
            background: #dbeafe;
            padding: 3px 8px;
            border-radius: 6px;
          }


          /* ================= MOBILE ================= */

          @media (max-width: 700px) {

            .settings-page {
              padding: 0 5px 30px;
            }

            .profile-card {
              align-items: flex-start;

              flex-wrap: wrap;
            }

            .secondary-button {
              margin-left: 67px;
            }

            .edit-actions {
              justify-content: stretch;
            }

            .cancel-button,
            .save-button {
              flex: 1;
            }

          }


          /* ================= DARK THEME OVERRIDES ================= */

          [data-theme="dark"] .settings-heading h1,
          [data-theme="dark"] .section-heading h2,
          [data-theme="dark"] .profile-card h3,
          [data-theme="dark"] .security-item strong,
          [data-theme="dark"] .preference-item strong,
          [data-theme="dark"] .info-item label,
          [data-theme="dark"] .theme-info strong {
            color: #f8fafc;
          }

          [data-theme="dark"] .settings-section {
            background: #0f172a;
            border-color: #334155;
            box-shadow: 0 4px 18px rgba(0, 0, 0, 0.4);
          }

          [data-theme="dark"] .settings-heading p,
          [data-theme="dark"] .section-heading p,
          [data-theme="dark"] .profile-card p,
          [data-theme="dark"] .security-item p,
          [data-theme="dark"] .preference-item p,
          [data-theme="dark"] .theme-info p {
            color: #94a3b8;
          }

          [data-theme="dark"] .theme-card {
            background: #1e293b;
            border-color: #334155;
          }

          [data-theme="dark"] .theme-card:hover {
            border-color: #60a5fa;
          }

          [data-theme="dark"] .theme-card.active {
            background: rgba(37, 99, 235, 0.18);
            border-color: #3b82f6;
          }

          [data-theme="dark"] .theme-card-icon {
            background: #0f172a;
          }

          [data-theme="dark"] .profile-card,
          [data-theme="dark"] .security-item,
          [data-theme="dark"] .preference-item,
          [data-theme="dark"] .quick-action-btn,
          [data-theme="dark"] .account-option {
            background: #1e293b;
            border-color: #334155;
            color: #f8fafc;
          }

          [data-theme="dark"] .account-option strong {
            color: #f8fafc;
          }

          [data-theme="dark"] .account-option:hover {
            background: #27354a;
            border-color: #475569;
          }

          [data-theme="dark"] .info-item span {
            color: #e2e8f0;
          }

          [data-theme="dark"] .edit-field input {
            background: #0f172a;
            border-color: #334155;
            color: #f8fafc;
          }

          @media (prefers-color-scheme: dark) {
            [data-theme="system"] .settings-heading h1,
            [data-theme="system"] .section-heading h2,
            [data-theme="system"] .profile-card h3,
            [data-theme="system"] .security-item strong,
            [data-theme="system"] .preference-item strong,
            [data-theme="system"] .info-item label,
            [data-theme="system"] .theme-info strong {
              color: #f8fafc;
            }

            [data-theme="system"] .settings-section {
              background: #0f172a;
              border-color: #334155;
              box-shadow: 0 4px 18px rgba(0, 0, 0, 0.4);
            }

            [data-theme="system"] .settings-heading p,
            [data-theme="system"] .section-heading p,
            [data-theme="system"] .profile-card p,
            [data-theme="system"] .security-item p,
            [data-theme="system"] .preference-item p,
            [data-theme="system"] .theme-info p {
              color: #94a3b8;
            }

            [data-theme="system"] .theme-card {
              background: #1e293b;
              border-color: #334155;
            }

            [data-theme="system"] .theme-card.active {
              background: rgba(37, 99, 235, 0.18);
              border-color: #3b82f6;
            }

            [data-theme="system"] .theme-card-icon {
              background: #0f172a;
            }

            [data-theme="system"] .profile-card,
            [data-theme="system"] .security-item,
            [data-theme="system"] .preference-item,
            [data-theme="system"] .quick-action-btn,
            [data-theme="system"] .account-option {
              background: #1e293b;
              border-color: #334155;
              color: #f8fafc;
            }

            [data-theme="system"] .account-option strong {
              color: #f8fafc;
            }

            [data-theme="system"] .account-option:hover {
              background: #27354a;
              border-color: #475569;
            }

            [data-theme="system"] .info-item span {
              color: #e2e8f0;
            }

            [data-theme="system"] .edit-field input {
              background: #0f172a;
              border-color: #334155;
              color: #f8fafc;
            }
          }

        `}
      </style>

    </div>
  );
}

export default Settings;