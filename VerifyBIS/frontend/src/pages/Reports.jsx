import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  async function loadReports() {
    try {
      setLoading(true);
      setError("");

      const data = await api.getReports();

      setReports(data?.reports || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  async function handleGenerate() {
    try {
      setGenerating(true);
      setError("");

      const report = await api.generateReport("compliance");

      setReports((current) => [report, ...current]);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to generate report.");
    } finally {
      setGenerating(false);
    }
  }

  function handleDownload(reportId) {
    const url = api.downloadReport(reportId);

    const link = document.createElement("a");

    link.href = url;
    link.download = `BISQ-report-${reportId}.pdf`;
    link.rel = "noopener noreferrer";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function formatDate(value) {
    if (!value) return "Unknown";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString();
  }

  function getReportTypeLabel(type) {
    if (type === "compliance") {
      return "Compliance Report";
    }

    if (type === "tender_summary") {
      return "Tender Summary";
    }

    return type || "Report";
  }

  const complianceReports = reports.filter(
    (report) => report.report_type === "compliance"
  ).length;

  const tenderReports = reports.filter(
    (report) => report.report_type === "tender_summary"
  ).length;

  return (
    <div className="reports-page">
      {/* =========================
          HEADER
      ========================== */}
      <div className="reports-header">
        <div className="reports-header-content">
          <div className="reports-eyebrow">
            <span className="eyebrow-dot"></span>
            BISQ INTELLIGENCE
          </div>

          <h1>Reports</h1>

          <p>
            Generate, review and download compliance intelligence
            reports from your BISQ tender analyses.
          </p>
        </div>

        <button
          className="reports-generate-button"
          onClick={handleGenerate}
          disabled={generating}
        >
          <span className="button-icon">
            {generating ? "◌" : "+"}
          </span>

          <span>
            {generating
              ? "Generating..."
              : "Generate Report"}
          </span>
        </button>
      </div>

      {/* =========================
          ERROR
      ========================== */}
      {error && (
        <div className="reports-error">
          <div className="reports-error-icon">!</div>

          <div>
            <strong>Something went wrong</strong>
            <p>{error}</p>
          </div>

          <button onClick={loadReports}>
            Retry
          </button>
        </div>
      )}

      {/* =========================
          STATS
      ========================== */}
      {!loading && (
        <div className="reports-stats">
          <div className="report-stat-card">
            <div className="stat-icon stat-icon-primary">
              <span>▤</span>
            </div>

            <div className="stat-content">
              <span className="stat-label">
                Total Reports
              </span>

              <strong>{reports.length}</strong>

              <span className="stat-description">
                Generated reports
              </span>
            </div>
          </div>

          <div className="report-stat-card">
            <div className="stat-icon stat-icon-blue">
              <span>✓</span>
            </div>

            <div className="stat-content">
              <span className="stat-label">
                Compliance
              </span>

              <strong>{complianceReports}</strong>

              <span className="stat-description">
                Compliance reports
              </span>
            </div>
          </div>

          <div className="report-stat-card">
            <div className="stat-icon stat-icon-purple">
              <span>≡</span>
            </div>

            <div className="stat-content">
              <span className="stat-label">
                Tender Summaries
              </span>

              <strong>{tenderReports}</strong>

              <span className="stat-description">
                Tender intelligence
              </span>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          CONTENT HEADER
      ========================== */}
      {!loading && reports.length > 0 && (
        <div className="reports-section-header">
          <div>
            <h2>Generated Reports</h2>
            <p>
              Your latest BISQ compliance intelligence documents.
            </p>
          </div>

          <span className="reports-count">
            {reports.length}{" "}
            {reports.length === 1 ? "report" : "reports"}
          </span>
        </div>
      )}

      {/* =========================
          LOADING
      ========================== */}
      {loading ? (
        <div className="reports-loading">
          <div className="loading-spinner"></div>

          <div>
            <strong>Loading reports</strong>
            <p>Fetching your BISQ reports...</p>
          </div>
        </div>
      ) : reports.length === 0 ? (
        /* =========================
            EMPTY STATE
        ========================== */
        <div className="reports-empty">
          <div className="empty-illustration">
            <div className="empty-document">
              <div className="document-fold"></div>

              <div className="document-line long"></div>
              <div className="document-line"></div>
              <div className="document-line short"></div>

              <div className="document-check">
                ✓
              </div>
            </div>

            <div className="empty-glow"></div>
          </div>

          <div className="empty-content">
            <span className="empty-badge">
              REPORT CENTER
            </span>

            <h2>No reports yet</h2>

            <p>
              Your generated BISQ compliance reports will
              appear here. Start by analyzing a tender and
              generate your first intelligence report.
            </p>

            <Link
              to="/tenders/new"
              className="empty-primary-button"
            >
              <span>Analyze Tender</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      ) : (
        /* =========================
            REPORT LIST
        ========================== */
        <div className="reports-list">
          {reports.map((report, index) => (
            <div
              key={report.id}
              className="report-card"
              style={{
                animationDelay: `${index * 40}ms`,
              }}
            >
              <div className="report-card-left">
                <div className="report-document-icon">
                  <div className="document-corner"></div>

                  <span>PDF</span>
                </div>

                <div className="report-info">
                  <div className="report-title-row">
                    <h3>
                      {report.title || "Untitled Report"}
                    </h3>

                    <span className="report-status">
                      <span></span>
                      Ready
                    </span>
                  </div>

                  <div className="report-meta">
                    <span className="report-type">
                      {getReportTypeLabel(
                        report.report_type
                      )}
                    </span>

                    <span className="meta-divider"></span>

                    <span>
                      Report #{report.id}
                    </span>

                    <span className="meta-divider"></span>

                    <span>
                      {formatDate(report.created_at)}
                    </span>

                    {report.tender_id && (
                      <>
                        <span className="meta-divider"></span>

                        <Link
                          to={`/tenders/${report.tender_id}`}
                          className="tender-link"
                        >
                          Tender #{report.tender_id}
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="report-actions">
                {report.tender_id && (
                  <Link
                    to={`/tenders/${report.tender_id}`}
                    className="report-secondary-button"
                  >
                    <span>View Analysis</span>
                    <span>→</span>
                  </Link>
                )}

                <button
                  className="report-download-button"
                  onClick={() =>
                    handleDownload(report.id)
                  }
                >
                  <span className="download-icon">
                    ↓
                  </span>

                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}