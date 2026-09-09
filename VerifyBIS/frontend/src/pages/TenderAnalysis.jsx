import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  FileText,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { api } from "../services/api.js";

function getStatusClass(status = "") {
  const value = status.toUpperCase();

  if (value.includes("COMPLIANT") && !value.includes("NON")) {
    return "badge verified";
  }

  if (value.includes("NON_COMPLIANT") || value.includes("NON-COMPLIANT")) {
    return "badge high";
  }

  if (value.includes("DEVIATION")) {
    return "badge deviation";
  }

  return "badge pending";
}

function getFindingIcon(assessment = "") {
  const value = assessment.toLowerCase();

  if (
    value.includes("compliant") &&
    !value.includes("not compliant") &&
    !value.includes("non-compliant")
  ) {
    return <CheckCircle2 size={15} className="v-ok" />;
  }

  if (
    value.includes("non-compliant") ||
    value.includes("not compliant") ||
    value.includes("fail")
  ) {
    return <XCircle size={15} className="v-error" />;
  }

  return <AlertTriangle size={15} className="v-warn" />;
}

function formatDate(value) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function TenderAnalysis() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tender, setTender] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadTender() {
      try {
        setLoading(true);
        setError("");

        const data = await api.getTender(id);

        if (mounted) {
          setTender(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "Failed to load tender analysis.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadTender();

    return () => {
      mounted = false;
    };
  }, [id]);

  async function handleGenerateReport() {
    try {
      setGeneratingReport(true);

      const report = await api.generateReport("compliance", {
        tender_id: id,
      });

      if (report?.id) {
        navigate("/reports");
      }
    } catch (err) {
      alert(err.message || "Failed to generate report.");
    } finally {
      setGeneratingReport(false);
    }
  }

  if (loading) {
    return (
      <div className="page-header">
        <div>
          <div className="eyebrow">ANALYSIS</div>
          <h1>Loading tender analysis...</h1>
          <p>Retrieving compliance findings and BIS evidence.</p>
        </div>

        <Loader2 className="spin" size={20} />
      </div>
    );
  }

  if (error || !tender) {
    return (
      <div className="page-header">
        <div>
          <div className="eyebrow">ANALYSIS</div>
          <h1>Tender not found</h1>
          <p>
            {error ||
              "This tender doesn't exist in the current workspace."}
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={() => navigate("/tenders")}
        >
          <ArrowLeft size={14} />
          Back to Tenders
        </button>
      </div>
    );
  }

  const findings = Array.isArray(tender.findings) ? tender.findings : [];
  const sources = Array.isArray(tender.sources) ? tender.sources : [];

  const status = tender.status || "NEEDS_EVIDENCE";

  return (
    <>
      <button
        className="back-link"
        onClick={() => navigate("/tenders")}
      >
        <ArrowLeft size={13} />
        Back to Tenders
      </button>

      <div className="page-header">
        <div>
          <div className="eyebrow">TENDER ANALYSIS</div>

          <h1>
            {tender.filename ||
              tender.title ||
              `Tender #${tender.id}`}
          </h1>

          <p>
            Analysis ID #{tender.id} · Created{" "}
            {formatDate(tender.created_at)}
          </p>
        </div>

        <div className="actions">
          <span className={getStatusClass(status)}>
            {status.replaceAll("_", " ")}
          </span>
        </div>
      </div>

      {/* Overview */}
      <section className="table-card llm-card">
        <div className="table-header">
          <div>
            <h2>Compliance Summary</h2>
            <p>
              AI-assisted analysis grounded in retrieved BIS
              standards
            </p>
          </div>

          <div className="actions">
            <button
              className="primary-button"
              onClick={handleGenerateReport}
              disabled={generatingReport}
            >
              {generatingReport ? (
                <>
                  <Loader2 size={14} className="spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText size={14} />
                  Export Compliance Report
                </>
              )}
            </button>
          </div>
        </div>

        <div className="llm-text">
          {tender.summary ||
            "No compliance summary was generated for this tender."}
        </div>
      </section>

      <div className="analysis-grid">
        {/* Findings */}
        <section className="table-card">
          <div className="table-header">
            <div>
              <h2>Compliance Findings</h2>
              <p>
                Requirement-level assessment based on BIS
                evidence
              </p>
            </div>

            <span className="badge pending">
              {findings.length} finding
              {findings.length === 1 ? "" : "s"}
            </span>
          </div>

          {findings.length === 0 ? (
            <div className="empty-state">
              No compliance findings were returned.
            </div>
          ) : (
            <div className="validation-list">
              {findings.map((finding, index) => (
                <div
                  className="validation-row finding-row"
                  key={index}
                >
                  <div className="finding-icon">
                    {getFindingIcon(
                      finding.assessment
                    )}
                  </div>

                  <div className="finding-content">
                    <strong>
                      {finding.requirement ||
                        "Requirement"}
                    </strong>

                    <p>
                      {finding.assessment ||
                        "No assessment provided."}
                    </p>

                    {finding.evidence && (
                      <div className="evidence-box">
                        <span>Evidence</span>
                        <p>{finding.evidence}</p>
                      </div>
                    )}

                    <div className="finding-source">
                      {finding.source && (
                        <span>
                          Source: {finding.source}
                        </span>
                      )}

                      {finding.page && (
                        <span>
                          Page: {finding.page}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* BIS Sources */}
        <section className="table-card">
          <div className="table-header">
            <div>
              <h2>Matched BIS Standards</h2>
              <p>
                Standards retrieved during compliance
                analysis
              </p>
            </div>
          </div>

          {sources.length === 0 ? (
            <div className="empty-state">
              No BIS sources were returned.
            </div>
          ) : (
            <div className="match-list">
              {sources.map((source, index) => (
                <div
                  className="match-row"
                  key={
                    source.document_id ||
                    source.is_number ||
                    index
                  }
                >
                  <div>
                    <strong className="mono">
                      {source.is_number ||
                        source.document_id ||
                        `Source ${index + 1}`}
                    </strong>

                    <span>
                      {source.title ||
                        "BIS Standard"}
                    </span>

                    <small>
                      {source.year
                        ? `Year: ${source.year}`
                        : ""}

                      {source.page_number
                        ? ` · Page ${source.page_number}`
                        : ""}
                    </small>
                  </div>

                  <div className="source-actions">
                    {source.pdf_url ? (
                      <a
                        href={source.pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        className="icon-button"
                        title="Open BIS document"
                      >
                        <ExternalLink size={14} />
                      </a>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Analysis metadata */}
        <section className="table-card">
          <div className="table-header">
            <div>
              <h2>Analysis Information</h2>
              <p>Details about this compliance assessment</p>
            </div>
          </div>

          <div className="kv-list">
            <div className="kv-row">
              <span>Status</span>
              <strong>
                {status.replaceAll("_", " ")}
              </strong>
            </div>

            <div className="kv-row">
              <span>Analysis ID</span>
              <strong>#{tender.id}</strong>
            </div>

            <div className="kv-row">
              <span>Created</span>
              <strong>
                {formatDate(tender.created_at)}
              </strong>
            </div>

            <div className="kv-row">
              <span>Findings</span>
              <strong>{findings.length}</strong>
            </div>

            <div className="kv-row">
              <span>BIS Sources</span>
              <strong>{sources.length}</strong>
            </div>
          </div>
        </section>

        {/* Evidence status */}
        <section className="table-card">
          <div className="table-header">
            <div>
              <h2>Evidence Review</h2>
              <p>
                Evidence availability across findings
              </p>
            </div>
          </div>

          <div className="validation-list">
            {findings.map((finding, index) => {
              const hasEvidence =
                Boolean(finding.evidence?.trim());

              return (
                <div
                  className="validation-row"
                  key={index}
                >
                  {hasEvidence ? (
                    <CheckCircle2
                      size={14}
                      className="v-ok"
                    />
                  ) : (
                    <AlertTriangle
                      size={14}
                      className="v-warn"
                    />
                  )}

                  <span>
                    {hasEvidence
                      ? "Evidence available"
                      : "Evidence missing or insufficient"}
                  </span>
                </div>
              );
            })}

            {findings.length === 0 && (
              <div className="empty-state">
                No findings available for evidence review.
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Sources */}
      {sources.length > 0 && (
        <section className="table-card">
          <div className="table-header">
            <div>
              <h2>Source Evidence</h2>
              <p>
                BIS standards used to support this analysis
              </p>
            </div>
          </div>

          <div className="source-grid">
            {sources.map((source, index) => (
              <div
                className="source-card"
                key={
                  source.document_id ||
                  source.is_number ||
                  index
                }
              >
                <div className="source-card-top">
                  <span className="source-number">
                    Source {index + 1}
                  </span>

                  {source.pdf_url && (
                    <a
                      href={source.pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      className="source-link"
                    >
                      Open PDF
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>

                <strong>
                  {source.is_number ||
                    source.document_id ||
                    "BIS Standard"}
                </strong>

                <p>
                  {source.title ||
                    "No standard title available."}
                </p>

                <small>
                  {source.year
                    ? `Year ${source.year}`
                    : "Year unavailable"}

                  {source.page_number
                    ? ` · Page ${source.page_number}`
                    : ""}
                </small>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}