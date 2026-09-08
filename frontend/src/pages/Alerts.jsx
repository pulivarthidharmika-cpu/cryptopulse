import { useNavigate } from "react-router-dom";

function Alerts() {
  const navigate = useNavigate();

  return (
    <div className="alerts-page">

      {/* Page Header */}

      <div className="alerts-header">

        <div>
          <div className="title-row">
            <div className="title-icon">
              🔔
            </div>

            <div>
              <h1>Alerts</h1>

              <p>
                Monitor important CryptoPulse notifications
                and market events.
              </p>
            </div>
          </div>
        </div>

        <button
          className="dashboard-button"
          onClick={() => navigate("/dashboard")}
        >
          ← Dashboard
        </button>

      </div>


      {/* Alert Summary */}

      <div className="alert-summary">

        <div className="summary-icon">
          🔔
        </div>

        <div>
          <h2>No New Alerts</h2>

          <p>
            You're all caught up. New cryptocurrency
            alerts will appear here.
          </p>
        </div>

      </div>


      {/* Alert Cards */}

      <div className="section-title">
        <h2>Recent Alerts</h2>

        <span>
          0 notifications
        </span>
      </div>


      <div className="empty-alerts">

        <div className="empty-icon">
          ✓
        </div>

        <h3>Everything looks good</h3>

        <p>
          There are currently no alerts requiring
          your attention.
        </p>

      </div>


      {/* Information */}

      <div className="info-card">

        <div className="info-icon">
          ℹ
        </div>

        <div>
          <h3>About CryptoPulse Alerts</h3>

          <p>
            Alerts can be used to keep track of important
            cryptocurrency market activity, price movements,
            and system notifications.
          </p>
        </div>

      </div>


      <style>
        {`

          .alerts-page {
            width: 100%;
            max-width: 1100px;
            margin: 0 auto;
            padding-bottom: 40px;
          }


          /* Header */

          .alerts-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;

            margin-bottom: 28px;
          }

          .title-row {
            display: flex;
            align-items: center;
            gap: 15px;
          }

          .title-icon {
            width: 52px;
            height: 52px;

            display: flex;
            align-items: center;
            justify-content: center;

            border-radius: 15px;

            background:
              linear-gradient(
                135deg,
                #2563eb,
                #38bdf8
              );

            color: white;

            font-size: 22px;

            box-shadow:
              0 8px 22px
              rgba(37, 99, 235, 0.25);
          }

          .alerts-header h1 {
            margin: 0;

            color: #172554;

            font-size: 30px;
            font-weight: 800;
          }

          .alerts-header p {
            margin: 5px 0 0;

            color: #64748b;

            font-size: 13px;
          }


          /* Dashboard Button */

          .dashboard-button {
            padding: 11px 17px;

            border: 1px solid #bfdbfe;

            border-radius: 10px;

            background: white;

            color: #2563eb;

            font-size: 12px;
            font-weight: 700;

            cursor: pointer;

            transition:
              transform 0.2s ease,
              background 0.2s ease;
          }

          .dashboard-button:hover {
            transform: translateY(-2px);

            background: #eff6ff;
          }


          /* Summary */

          .alert-summary {
            display: flex;
            align-items: center;

            gap: 16px;

            padding: 23px;

            margin-bottom: 28px;

            border-radius: 18px;

            background:
              linear-gradient(
                135deg,
                #eff6ff,
                #e0f2fe
              );

            border:
              1px solid #bfdbfe;

            box-shadow:
              0 8px 25px
              rgba(37, 99, 235, 0.07);
          }

          .summary-icon {
            width: 48px;
            height: 48px;

            display: flex;
            align-items: center;
            justify-content: center;

            flex-shrink: 0;

            border-radius: 13px;

            background: white;

            font-size: 20px;

            box-shadow:
              0 4px 12px
              rgba(37, 99, 235, 0.1);
          }

          .alert-summary h2 {
            margin: 0;

            color: #172554;

            font-size: 17px;
          }

          .alert-summary p {
            margin: 5px 0 0;

            color: #64748b;

            font-size: 11px;
          }


          /* Section */

          .section-title {
            display: flex;
            align-items: center;
            justify-content: space-between;

            margin-bottom: 14px;
          }

          .section-title h2 {
            margin: 0;

            color: #172554;

            font-size: 18px;
          }

          .section-title span {
            padding: 5px 9px;

            border-radius: 15px;

            background: #eff6ff;

            color: #2563eb;

            font-size: 9px;
            font-weight: 700;
          }


          /* Empty State */

          .empty-alerts {
            display: flex;
            align-items: center;
            flex-direction: column;

            justify-content: center;

            min-height: 260px;

            padding: 30px;

            border-radius: 18px;

            background:
              rgba(255, 255, 255, 0.85);

            border:
              1px solid #dbeafe;

            box-shadow:
              0 8px 25px
              rgba(30, 64, 175, 0.05);

            text-align: center;
          }

          .empty-icon {
            width: 58px;
            height: 58px;

            display: flex;
            align-items: center;
            justify-content: center;

            border-radius: 50%;

            background: #dcfce7;

            color: #16a34a;

            font-size: 25px;
            font-weight: 800;
          }

          .empty-alerts h3 {
            margin: 16px 0 5px;

            color: #172554;

            font-size: 16px;
          }

          .empty-alerts p {
            margin: 0;

            max-width: 400px;

            color: #94a3b8;

            font-size: 11px;

            line-height: 1.6;
          }


          /* Information */

          .info-card {
            display: flex;
            align-items: flex-start;

            gap: 13px;

            margin-top: 20px;

            padding: 18px;

            border-radius: 15px;

            background: #f8fbff;

            border:
              1px solid #dbeafe;
          }

          .info-icon {
            width: 32px;
            height: 32px;

            display: flex;
            align-items: center;
            justify-content: center;

            flex-shrink: 0;

            border-radius: 9px;

            background: #dbeafe;

            color: #2563eb;

            font-weight: 800;
          }

          .info-card h3 {
            margin: 0;

            color: #172554;

            font-size: 12px;
          }

          .info-card p {
            margin: 5px 0 0;

            color: #64748b;

            font-size: 10px;

            line-height: 1.6;
          }


          /* Dark Mode */

          html[data-theme="dark"]
          .alerts-header h1,

          html[data-theme="dark"]
          .alert-summary h2,

          html[data-theme="dark"]
          .section-title h2,

          html[data-theme="dark"]
          .empty-alerts h3,

          html[data-theme="dark"]
          .info-card h3 {

            color: #e2e8f0;
          }


          html[data-theme="dark"]
          .alerts-header p,

          html[data-theme="dark"]
          .alert-summary p,

          html[data-theme="dark"]
          .empty-alerts p,

          html[data-theme="dark"]
          .info-card p {

            color: #94a3b8;
          }


          html[data-theme="dark"]
          .empty-alerts {

            background:
              rgba(15, 23, 42, 0.9);

            border-color:
              rgba(96, 165, 250, 0.15);
          }


          html[data-theme="dark"]
          .info-card {

            background:
              rgba(15, 23, 42, 0.75);

            border-color:
              rgba(96, 165, 250, 0.15);
          }


          html[data-theme="dark"]
          .dashboard-button {

            background: #0f172a;

            border-color: #1e40af;

            color: #60a5fa;
          }


          html[data-theme="dark"]
          .summary-icon {

            background: #0f172a;
          }


          /* Responsive */

          @media (max-width: 600px) {

            .alerts-header {
              align-items: flex-start;
              flex-direction: column;
            }

            .dashboard-button {
              width: 100%;
            }

            .alert-summary {
              align-items: flex-start;
            }

          }

        `}
      </style>

    </div>
  );
}

export default Alerts;