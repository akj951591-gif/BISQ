import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  ShieldCheck,
  Database,
  BarChart3,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { api } from "../services/api.js";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadDashboard(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const result = await api.getDashboard();
      setData(result);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="page dashboard-page">
        <div className="dashboard-loading">
          <div className="loading-spinner" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentTenders = data?.recent_tenders || [];

  return (
    <div className="page dashboard-page">

      {/* HEADER */}
      <div className="dashboard-header">
        <div>
          <div className="dashboard-eyebrow">
            BIS COMPLIANCE PLATFORM
          </div>

          <h1>BISQ Dashboard</h1>

          <p>
            BIS Compliance & Intelligence overview.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button refresh-button"
          onClick={() => loadDashboard(true)}
          disabled={refreshing}
        >
          <RefreshCw
            size={15}
            className={refreshing ? "spin" : ""}
          />

          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="error-message dashboard-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* STAT CARDS */}
      <div className="stats-grid">

        <div className="stat-card">
          <div className="stat-card-icon standards-icon">
            <ShieldCheck size={22} />
          </div>

          <div className="stat-card-content">
            <span className="stat-card-label">
              Total BIS Standards
            </span>

            <strong className="stat-card-value">
              {stats.total_standards ?? 0}
            </strong>

            <span className="stat-card-description">
              Standards available in BISQ
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon chunks-icon">
            <Database size={22} />
          </div>

          <div className="stat-card-content">
            <span className="stat-card-label">
              Indexed Chunks
            </span>

            <strong className="stat-card-value">
              {stats.total_chunks ?? 0}
            </strong>

            <span className="stat-card-description">
              Searchable knowledge chunks
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon tender-icon">
            <FileText size={22} />
          </div>

          <div className="stat-card-content">
            <span className="stat-card-label">
              Tender Analyses
            </span>

            <strong className="stat-card-value">
              {stats.total_tenders ?? 0}
            </strong>

            <span className="stat-card-description">
              Compliance analyses completed
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon reports-icon">
            <BarChart3 size={22} />
          </div>

          <div className="stat-card-content">
            <span className="stat-card-label">
              Reports Generated
            </span>

            <strong className="stat-card-value">
              {stats.total_reports ?? 0}
            </strong>

            <span className="stat-card-description">
              Compliance reports created
            </span>
          </div>
        </div>

      </div>

      {/* TWO COLUMN SECTION */}
      <div className="dashboard-grid">

        {/* COMPLIANCE */}
        <section className="dashboard-card compliance-card">
          <div className="section-header">
            <div>
              <h2>Compliance Overview</h2>
              <p>
                Current tender analysis results.
              </p>
            </div>

            <ShieldCheck size={21} />
          </div>

          <div className="compliance-stats">

            <div className="compliance-stat compliant">
              <div className="compliance-stat-icon">
                <CheckCircle2 size={19} />
              </div>

              <div>
                <strong>
                  {stats.compliant ?? 0}
                </strong>

                <span>Compliant</span>
              </div>
            </div>

            <div className="compliance-stat evidence">
              <div className="compliance-stat-icon">
                <AlertCircle size={19} />
              </div>

              <div>
                <strong>
                  {stats.needs_evidence ?? 0}
                </strong>

                <span>Needs Evidence</span>
              </div>
            </div>

            <div className="compliance-stat non-compliant">
              <div className="compliance-stat-icon">
                <XCircle size={19} />
              </div>

              <div>
                <strong>
                  {stats.non_compliant ?? 0}
                </strong>

                <span>Non-Compliant</span>
              </div>
            </div>

          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section className="dashboard-card quick-actions-card">
          <div className="section-header">
            <div>
              <h2>Quick Actions</h2>
              <p>
                Start a new compliance workflow.
              </p>
            </div>
          </div>

          <div className="quick-actions">

            <Link
              to="/tenders/new"
              className="primary-button quick-action-primary"
            >
              <FileText size={17} />
              <span>Analyze Tender</span>
              <ArrowRight size={15} />
            </Link>

            <Link
              to="/standards"
              className="secondary-button"
            >
              <ShieldCheck size={16} />
              Search BIS Standards
            </Link>

            <Link
              to="/reports"
              className="secondary-button"
            >
              <BarChart3 size={16} />
              View Reports
            </Link>

          </div>
        </section>

      </div>

      {/* RECENT ANALYSES */}
      <section className="dashboard-card recent-card">

        <div className="section-header">
          <div>
            <h2>Recent Tender Analyses</h2>
            <p>
              Latest compliance analyses processed by BISQ.
            </p>
          </div>

          <Link
            to="/tenders"
            className="view-all-link"
          >
            View all
            <ArrowRight size={15} />
          </Link>
        </div>

        {recentTenders.length === 0 ? (
          <div className="empty-state dashboard-empty-state">

            <div className="empty-state-icon">
              <FileText size={25} />
            </div>

            <h3>No tender analyses yet</h3>

            <p>
              Upload a tender to start your first
              compliance analysis.
            </p>

            <Link
              to="/tenders/new"
              className="primary-button"
            >
              Analyze Tender
              <ArrowRight size={15} />
            </Link>

          </div>
        ) : (
          <div className="recent-tenders">

            {recentTenders.map((tender) => (
              <Link
                key={tender.id}
                to={`/tenders/${tender.id}`}
                className="recent-tender-row"
              >
                <div className="recent-tender-info">

                  <div className="recent-tender-icon">
                    <FileText size={18} />
                  </div>

                  <div>
                    <strong>
                      {tender.filename ||
                        `Tender #${tender.id}`}
                    </strong>

                    <span>
                      {tender.findings_count ?? 0} findings
                    </span>
                  </div>

                </div>

                <div className="recent-tender-right">

                  <span
                    className={`status-badge status-${String(
                      tender.status || "NEEDS_EVIDENCE"
                    )
                      .toLowerCase()
                      .replaceAll("_", "-")}`}
                  >
                    {tender.status || "NEEDS_EVIDENCE"}
                  </span>

                  <ArrowRight size={16} />

                </div>
              </Link>
            ))}

          </div>
        )}

      </section>

    </div>
  );
}