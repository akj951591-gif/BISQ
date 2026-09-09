import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  FileText,
  ExternalLink,
} from "lucide-react";
import { api } from "../services/api.js";

const STATUS_CONFIG = {
  COMPLIANT: {
    icon: CheckCircle2,
    className: "verified",
    label: "COMPLIANT",
  },
  "NON-COMPLIANT": {
    icon: XCircle,
    className: "high",
    label: "NON-COMPLIANT",
  },
  "NEEDS EVIDENCE": {
    icon: AlertTriangle,
    className: "medium",
    label: "NEEDS EVIDENCE",
  },
};

export default function Compliance() {
  const [product, setProduct] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAnalyze(event) {
    event.preventDefault();

    if (!product.trim()) {
      setError("Enter a product description.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await api.analyzeCompliance(product.trim());
      setResult(data);
    } catch (err) {
      setError(err.message || "Compliance analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  const statusConfig = result
    ? STATUS_CONFIG[result.status] || STATUS_CONFIG["NEEDS EVIDENCE"]
    : null;

  const StatusIcon = statusConfig?.icon;

  return (
    <>
      <div className="page-header">
        <div>
          <div className="eyebrow">AI COMPLIANCE</div>
          <h1>Compliance</h1>
          <p>
            Analyze a product against relevant BIS standards and requirements.
          </p>
        </div>
      </div>

      <section className="table-card compliance-input-card">
        <div className="table-header">
          <div>
            <h2>Product Analysis</h2>
            <p>
              Describe the product, material, dimensions, specifications, or
              other available evidence.
            </p>
          </div>
        </div>

        <form onSubmit={handleAnalyze} className="compliance-form">
          <label htmlFor="product-description">
            PRODUCT DESCRIPTION
          </label>

          <textarea
            id="product-description"
            value={product}
            onChange={(event) => setProduct(event.target.value)}
            placeholder="Example: National flag made from cotton khadi, size 1500 mm × 1000 mm, saffron-white-green panels, navy blue Ashoka Chakra..."
            rows={5}
          />

          <div className="compliance-form-footer">
            <span>
              {product.length > 0
                ? `${product.length} characters`
                : "Enter product information"}
            </span>

            <button
              type="submit"
              className="primary-button compliance-analyze-button"
              disabled={loading}
            >
              <Search size={14} />

              {loading ? "Analyzing..." : "Analyze Compliance"}
            </button>
          </div>
        </form>

        {error && (
          <div className="compliance-error">
            <AlertTriangle size={15} />
            <span>{error}</span>
          </div>
        )}
      </section>

      {loading && (
        <section className="table-card compliance-loading">
          <div className="loading-spinner" />
          <div>
            <strong>Analyzing product...</strong>
            <p>
              Searching BIS standards and evaluating the supplied evidence.
            </p>
          </div>
        </section>
      )}

      {result && !loading && (
        <>
          <section className="compliance-status-card">
            <div className="compliance-status-top">
              <div>
                <div className="eyebrow">OVERALL STATUS</div>

                <div className="compliance-status">
                  {StatusIcon && <StatusIcon size={22} />}

                  <span>{statusConfig.label}</span>
                </div>
              </div>

              <div className="compliance-source-count">
                <FileText size={15} />
                <span>
                  {result.sources?.length || 0} BIS sources
                </span>
              </div>
            </div>

            <div className="compliance-summary">
              <strong>Summary</strong>
              <p>{result.summary}</p>
            </div>
          </section>

          <section className="table-card">
            <div className="table-header">
              <div>
                <h2>Compliance Findings</h2>
                <p>
                  Requirements identified from the retrieved BIS source
                  material.
                </p>
              </div>

              <span className="finding-count">
                {result.findings?.length || 0} findings
              </span>
            </div>

            <div className="compliance-findings">
              {result.findings?.length ? (
                result.findings.map((finding, index) => (
                  <div
                    className="compliance-finding"
                    key={`${finding.source}-${index}`}
                  >
                    <div className="finding-number">
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <div className="finding-content">
                      <h3>{finding.requirement}</h3>

                      <div className="finding-field">
                        <span>ASSESSMENT</span>
                        <p>{finding.assessment}</p>
                      </div>

                      {finding.evidence && (
                        <div className="finding-field">
                          <span>EVIDENCE</span>
                          <p>{finding.evidence}</p>
                        </div>
                      )}

                      <div className="finding-meta">
                        <span>
                          {finding.source}
                        </span>

                        {finding.page && (
                          <span>
                            Page {finding.page}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-findings">
                  No specific findings were returned.
                </div>
              )}
            </div>
          </section>

          <section className="table-card">
            <div className="table-header">
              <div>
                <h2>Source Documents</h2>
                <p>
                  BIS documents used during the compliance analysis.
                </p>
              </div>
            </div>

            <div className="source-list">
              {result.sources?.map((source) => (
                <div
                  className="source-row"
                  key={`${source.source}-${source.document_id}`}
                >
                  <div className="source-icon">
                    <FileText size={16} />
                  </div>

                  <div className="source-info">
                    <strong>
                      {source.is_number || source.document_id}
                    </strong>

                    <span>
                      {source.title || "BIS Standard"}
                    </span>

                    <small>
                      {source.year && `${source.year} • `}
                      {source.page_number
                        ? `Page ${source.page_number}`
                        : "Page unavailable"}
                    </small>
                  </div>

                  {source.pdf_url && (
                    <a
                      href={source.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="source-link"
                      title="Open BIS document"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}