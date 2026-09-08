import { useEffect, useState } from "react";

function Settings() {
  // --------------------------------------------------
  // Profile
  // --------------------------------------------------

  const storedEmail =
    localStorage.getItem("userEmail") || "User";

  const storedName =
    localStorage.getItem("profileName") ||
    "CryptoPulse User";

  const [name, setName] = useState(storedName);
  const [email] = useState(storedEmail);

  const [editingProfile, setEditingProfile] =
    useState(false);

  const [editName, setEditName] =
    useState(storedName);

  const [profileMessage, setProfileMessage] =
    useState("");

  // --------------------------------------------------
  // Notifications
  // --------------------------------------------------

  const [notifications, setNotifications] =
    useState(
      localStorage.getItem("notifications") !==
        "false"
    );

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

  // --------------------------------------------------
  // Account Options
  // --------------------------------------------------

  const handleSecurity = () => {
    alert(
      "Security settings will be available in a future update."
    );
  };

  const handlePreferences = () => {
    alert(
      "Application preferences will be available in a future update."
    );
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
          ACCOUNT
      ================================================== */}

      <section className="settings-section">

        <div className="section-heading">

          <div className="section-icon">
            🔐
          </div>

          <div>
            <h2>Account</h2>

            <p>
              Manage your account preferences.
            </p>
          </div>

        </div>


        <div className="account-options">

          {/* Security */}

          <button
            className="account-option"
            onClick={handleSecurity}
          >

            <span>
              🔑
            </span>

            <div>

              <strong>
                Security
              </strong>

              <small>
                Manage account security
              </small>

            </div>

            <b>
              ›
            </b>

          </button>


          {/* Preferences */}

          <button
            className="account-option"
            onClick={handlePreferences}
          >

            <span>
              ⚙️
            </span>

            <div>

              <strong>
                Preferences
              </strong>

              <small>
                Manage application preferences
              </small>

            </div>

            <b>
              ›
            </b>

          </button>

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

          .account-options {
            display: flex;

            flex-direction: column;

            gap: 9px;
          }

          .account-option {
            display: flex;

            align-items: center;

            gap: 13px;

            width: 100%;

            padding: 14px;

            border:
              1px solid #e2e8f0;

            border-radius: 12px;

            background: white;

            text-align: left;

            cursor: pointer;

            transition:
              background 0.2s ease,
              border 0.2s ease,
              transform 0.2s ease;
          }

          .account-option:hover {
            background: #f8fbff;

            border-color: #bfdbfe;

            transform: translateX(2px);
          }

          .account-option > span {
            font-size: 17px;
          }

          .account-option div {
            flex: 1;
          }

          .account-option strong {
            display: block;

            color: #172554;

            font-size: 12px;
          }

          .account-option small {
            display: block;

            margin-top: 3px;

            color: #94a3b8;

            font-size: 9px;
          }

          .account-option b {
            color: #94a3b8;

            font-size: 20px;
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

        `}
      </style>

    </div>
  );
}

export default Settings;