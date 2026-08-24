import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { getTenderById } from "../data/mockTenders.js";

const VALIDATION_ICON = {
  ok: <CheckCircle2 size={14} className="v-ok" />,
  warn: <AlertTriangle size={14} className="v-warn" />,
  error: <XCircle size={14} className="v-error" />,
};

export default function TenderAnalysis() {
  const { id } = useParams();
  const navigate = useNavigate();
  const tender = getTenderById(id);

  if (!tender) {
    return (
      <div className="page-header">
        <div>
          <div className="eyebrow">ANALYSIS</div>
          <h1>Tender not found</h1>
          <p>This tender doesn't exist in the current workspace.</p>
        </div>
        <button className="secondary-button" onClick={() => navigate("/tenders")}>
          ← Back to Tenders
        </button>
      </div>
    );
  }

  return (
    <>
      <button className="back-link" onClick={() => navigate("/tenders")}>
        <ArrowLeft size={13} /> Back to Tenders
      </button>

      <div className="page-header">
        <div>
          <div className="eyebrow">{tender.category.toUpperCase()}</div>
          <h1>{tender.name}</h1>
          <p>
            {tender.ref} · Submitted as {tender.inputType} · Updated {tender.updated}
          </p>
        </div>

        <div className="actions">
          <span
            className={
              tender.status === "Verified"
                ? "badge verified"
                : tender.status === "Deviations Found"
                ? "badge deviation"
                : "badge pending"
            }
          >
            {tender.status}
          </span>
          <span
            className={
              tender.risk === "Low" ? "badge low" : tender.risk === "Medium" ? "badge medium" : "badge high"
            }
          >
            {tender.risk} risk
          </span>
        </div>
      </div>

      <div className="analysis-grid">
        {/* Requirement extraction */}
        <section className="table-card">
          <div className="table-header">
            <div>
              <h2>Requirement Extraction</h2>
              <p>Spec tokens segmented from tender text</p>
            </div>
          </div>
          <div className="kv-list">
            {tender.extraction.map((e) => (
              <div className="kv-row" key={e.spec}>
                <span>{e.spec}</span>
                <strong>{e.value}</strong>
              </div>
            ))}
          </div>
        </section>

        {/* Hybrid search matches */}
        <section className="table-card">
          <div className="table-header">
            <div>
              <h2>Matched BIS Standards</h2>
              <p>BM25 + BGE-M3, RRF re-ranked</p>
            </div>
          </div>
          <div className="match-list">
            {tender.matches.map((m) => (
              <div className="match-row" key={m.code}>
                <div>
                  <strong className="mono">{m.code}</strong>
                  <span>{m.title}</span>
                </div>
                <div className="score-bar">
                  <div className="score-fill" style={{ width: `${m.score * 100}%` }} />
                  <small>{Math.round(m.score * 100)}%</small>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Normative graph */}
        <section className="table-card">
          <div className="table-header">
            <div>
              <h2>Normative Graph</h2>
              <p>Related & certification standards (Neo4j)</p>
            </div>
          </div>
          <ul className="graph-list">
            {tender.graph.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        </section>

        {/* Validation results */}
        <section className="table-card">
          <div className="table-header">
            <div>
              <h2>Validation / Rule Engine</h2>
              <p>Versioning, QCO & missing-requirement checks</p>
            </div>
          </div>
          <div className="validation-list">
            {tender.validation.map((v, i) => (
              <div className="validation-row" key={i}>
                {VALIDATION_ICON[v.type]}
                <span>{v.text}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* LLM summary */}
      <section className="table-card llm-card">
        <div className="table-header">
          <div>
            <h2>Compliance Summary</h2>
            <p>Llama-3.3-70B · Pydantic-constrained · no hallucinated IS codes</p>
          </div>
        </div>
        <p className="llm-text">{tender.llmSummary}</p>
        <div className="actions" style={{ padding: "0 17px 17px" }}>
          <button className="secondary-button">Draft Missing Clauses</button>
          <button className="primary-button">Export Compliance Record</button>
        </div>
      </section>
    </>
  );
}
