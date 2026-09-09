import { useEffect, useMemo, useState } from "react";
import {
  Search,
  FileText,
  Loader2,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api.js";

function StatusBadge({ status }) {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "COMPLIANT") {
    return (
      <span className="tender-status compliant">
        <CheckCircle2 size={12} />
        Compliant
      </span>
    );
  }

  if (normalized === "NON_COMPLIANT") {
    return (
      <span className="tender-status non-compliant">
        <XCircle size={12} />
        Non-compliant
      </span>
    );
  }

  return (
    <span className="tender-status evidence">
      <AlertTriangle size={12} />
      Needs evidence
    </span>
  );
}

function getStatus(tender) {
  return String(tender?.status || "NEEDS_EVIDENCE").toUpperCase();
}

export default function Tenders() {
  const navigate = useNavigate();

  const [tenders, setTenders] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadTenders() {
    try {
      setLoading(true);
      setError("");

      const data = await api.getTenders();

      const items =
        data?.tenders ||
        data?.results ||
        data ||
        [];

      setTenders(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error(err);

      setError(
        err?.message || "Failed to load tenders."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTenders();
  }, []);

  const filteredTenders = useMemo(() => {
    const value = query.trim().toLowerCase();

    return tenders.filter((tender) => {
      const filename = String(
        tender?.filename || ""
      ).toLowerCase();

      const status = String(
        tender?.status || ""
      ).toLowerCase();

      const summary = String(
        tender?.summary || ""
      ).toLowerCase();

      const matchesSearch =
        !value ||
        filename.includes(value) ||
        status.includes(value) ||
        summary.includes(value) ||
        String(tender?.id || "").includes(value);

      const matchesStatus =
        statusFilter === "ALL" ||
        getStatus(tender) === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [query, statusFilter, tenders]);

  const stats = useMemo(() => {
    return {
      total: tenders.length,

      compliant: tenders.filter(
        (tender) =>
          getStatus(tender) === "COMPLIANT"
      ).length,

      nonCompliant: tenders.filter(
        (tender) =>
          getStatus(tender) === "NON_COMPLIANT"
      ).length,

      evidence: tenders.filter(
        (tender) =>
          getStatus(tender) === "NEEDS_EVIDENCE"
      ).length,
    };
  }, [tenders]);

  function openTender(id) {
    navigate(`/tenders/${id}`);
  }

  return (
    <div className="tenders-page">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="tenders-header">
        <div>
          <div className="tenders-eyebrow">
            <span className="tenders-eyebrow-dot" />
            TENDER MANAGEMENT
          </div>

          <h1>Tenders</h1>

          <p>
            Review analyzed tender documents and
            their BIS compliance intelligence.
          </p>
        </div>

        <button
          className="tender-primary-button"
          onClick={() =>
            navigate("/tender-upload")
          }
        >
          <FileText size={15} />
          Analyze Tender
        </button>
      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="tenders-error">
          <div className="tenders-error-icon">
            <AlertTriangle size={16} />
          </div>

          <div className="tenders-error-content">
            <strong>
              Unable to load tenders
            </strong>

            <p>{error}</p>
          </div>

          <button
            onClick={loadTenders}
            className="tenders-retry-button"
          >
            <RefreshCw size={13} />
            Retry
          </button>
        </div>
      )}

      {/* =====================================================
          STAT CARDS
      ====================================================== */}

      {!loading && (
        <div className="tenders-stats">

          <div className="tender-stat-card">
            <div className="tender-stat-icon total">
              <FileText size={19} />
            </div>

            <div>
              <span>Total tenders</span>
              <strong>{stats.total}</strong>
              <small>Analyzed documents</small>
            </div>
          </div>

          <div className="tender-stat-card">
            <div className="tender-stat-icon compliant">
              <CheckCircle2 size={19} />
            </div>

            <div>
              <span>Compliant</span>
              <strong>{stats.compliant}</strong>
              <small>Passed assessment</small>
            </div>
          </div>

          <div className="tender-stat-card">
            <div className="tender-stat-icon danger">
              <XCircle size={19} />
            </div>

            <div>
              <span>Non-compliant</span>
              <strong>{stats.nonCompliant}</strong>
              <small>Issues identified</small>
            </div>
          </div>

          <div className="tender-stat-card">
            <div className="tender-stat-icon warning">
              <AlertTriangle size={19} />
            </div>

            <div>
              <span>Needs evidence</span>
              <strong>{stats.evidence}</strong>
              <small>Requires verification</small>
            </div>
          </div>

        </div>
      )}

      {/* =====================================================
          MAIN TABLE
      ====================================================== */}

      <section className="tenders-table-card">

        <div className="tenders-table-header">

          <div>
            <div className="tenders-section-title">
              <h2>Analyzed Tenders</h2>

              {!loading && (
                <span>
                  {filteredTenders.length}
                </span>
              )}
            </div>

            <p>
              Search and review your tender
              compliance assessments.
            </p>
          </div>

          <button
            className="tenders-refresh"
            onClick={loadTenders}
            disabled={loading}
            title="Refresh tenders"
          >
            <RefreshCw
              size={14}
              className={
                loading ? "tender-spin" : ""
              }
            />
          </button>

        </div>

        {/* =====================================================
            FILTER BAR
        ====================================================== */}

        <div className="tenders-toolbar">

          <div className="tenders-search">
            <Search size={15} />

            <input
              type="text"
              placeholder="Search by filename, status or summary..."
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
            />

            {query && (
              <button
                className="tenders-clear-search"
                onClick={() => setQuery("")}
              >
                ×
              </button>
            )}
          </div>

          <div className="tender-filter-group">

            {[
              ["ALL", "All"],
              ["COMPLIANT", "Compliant"],
              ["NON_COMPLIANT", "Non-compliant"],
              ["NEEDS_EVIDENCE", "Needs evidence"],
            ].map(([value, label]) => (
              <button
                key={value}
                className={
                  statusFilter === value
                    ? "tender-filter active"
                    : "tender-filter"
                }
                onClick={() =>
                  setStatusFilter(value)
                }
              >
                {label}
              </button>
            ))}

          </div>

        </div>

        {/* =====================================================
            LOADING
        ====================================================== */}

        {loading ? (
          <div className="tenders-loading">
            <Loader2
              size={25}
              className="tender-spin"
            />

            <div>
              <strong>
                Loading tenders
              </strong>

              <p>
                Fetching your analyzed documents...
              </p>
            </div>
          </div>
        ) : filteredTenders.length === 0 ? (

          /* ===================================================
             EMPTY STATE
          ==================================================== */

          <div className="tenders-empty">

            <div className="tenders-empty-icon">
              {query || statusFilter !== "ALL" ? (
                <Search size={24} />
              ) : (
                <FileText size={24} />
              )}
            </div>

            <h3>
              {query || statusFilter !== "ALL"
                ? "No matching tenders"
                : "No analyzed tenders yet"}
            </h3>

            <p>
              {query || statusFilter !== "ALL"
                ? "Try changing your search or status filter."
                : "Upload a tender document to start your BIS compliance analysis."}
            </p>

            {query || statusFilter !== "ALL" ? (
              <button
                className="tender-empty-button"
                onClick={() => {
                  setQuery("");
                  setStatusFilter("ALL");
                }}
              >
                Clear filters
              </button>
            ) : (
              <button
                className="tender-empty-button"
                onClick={() =>
                  navigate("/tender-upload")
                }
              >
                Analyze Tender
              </button>
            )}

          </div>

        ) : (

          /* ===================================================
             TABLE
          ==================================================== */

          <div className="tenders-table-scroll">
            <table className="tenders-table">

              <thead>
                <tr>
                  <th>DOCUMENT</th>
                  <th>STATUS</th>
                  <th>SUMMARY</th>
                  <th>FINDINGS</th>
                  <th>DATE</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>

                {filteredTenders.map(
                  (tender, index) => {

                    const findings = Array.isArray(
                      tender.findings
                    )
                      ? tender.findings.length
                      : 0;

                    return (
                      <tr
                        key={tender.id}
                        className="tender-row"
                        style={{
                          animationDelay:
                            `${index * 35}ms`,
                        }}
                        onClick={() =>
                          openTender(tender.id)
                        }
                      >

                        {/* DOCUMENT */}

                        <td>
                          <div className="tender-document">

                            <div className="tender-document-icon">
                              <FileText size={16} />
                            </div>

                            <div className="tender-document-info">
                              <strong>
                                {tender.filename ||
                                  `Tender #${tender.id}`}
                              </strong>

                              <span>
                                Tender #{tender.id}
                              </span>
                            </div>

                          </div>
                        </td>

                        {/* STATUS */}

                        <td>
                          <StatusBadge
                            status={tender.status}
                          />
                        </td>

                        {/* SUMMARY */}

                        <td>
                          <div className="tender-summary">
                            {tender.summary ||
                              "No summary available."}
                          </div>
                        </td>

                        {/* FINDINGS */}

                        <td>
                          <span className="findings-count">
                            {findings}
                          </span>
                        </td>

                        {/* DATE */}

                        <td>
                          <span className="tender-date">
                            {tender.created_at
                              ? new Date(
                                  tender.created_at
                                ).toLocaleDateString(
                                  undefined,
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )
                              : "—"}
                          </span>
                        </td>

                        {/* ACTION */}

                        <td>
                          <button
                            className="tender-open-button"
                            title="Open analysis"
                            onClick={(event) => {
                              event.stopPropagation();

                              openTender(
                                tender.id
                              );
                            }}
                          >
                            <ChevronRight
                              size={15}
                            />
                          </button>
                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>
          </div>
        )}

      </section>
    </div>
  );
}