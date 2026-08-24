import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, Type, Link2, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { getTenderById } from "../data/mockTenders.js";

const INPUT_MODES = [
  { key: "pdf", label: "Tender PDF", icon: FileText, hint: "PDF or scanned document" },
  { key: "text", label: "Free Text", icon: Type, hint: "Paste specification text" },
  { key: "gem", label: "GeM Product URL", icon: Link2, hint: "Link to a GeM listing" },
];

// Mirrors the pipeline in TechStack_Architecture.docx
const PIPELINE_STAGES = [
  { title: "AI Document Reader", detail: "Layout parsing via PyMuPDF / DocLayout-YOLO + OCR" },
  { title: "Requirement Extraction", detail: "Segmenting spec tables from boilerplate clauses" },
  { title: "Hybrid Search Engine", detail: "BM25 sparse + BGE-M3 dense, RRF re-ranking" },
  { title: "RAG Retrieval", detail: "Pulling matched BIS standards, scope & amendments" },
  { title: "Normative Graph (Neo4j)", detail: "Resolving related & certification standards" },
  { title: "Validation / Rule Engine", detail: "Checking versioning, QCO & missing requirements" },
  { title: "Structured Result", detail: "Assembling verified, database-grounded record" },
  { title: "LLM Reasoning", detail: "Llama-3.3-70B, Pydantic-constrained generation" },
  { title: "Verified Output", detail: "Publishing audit-ready compliance record" },
];

const DEMO_RESULT_ID = "tndr-2026-8755";

export default function TenderUpload() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("pdf");
  const [tenderName, setTenderName] = useState("");
  const [freeText, setFreeText] = useState("");
  const [gemUrl, setGemUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState(-1);
  const [done, setDone] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const hasInput =
    (mode === "pdf" && fileName) ||
    (mode === "text" && freeText.trim().length > 0) ||
    (mode === "gem" && gemUrl.trim().length > 0);

  function runAnalysis() {
    if (!hasInput || running) return;
    setRunning(true);
    setDone(false);
    setStage(0);

    let i = 0;
    timerRef.current = setInterval(() => {
      i += 1;
      if (i >= PIPELINE_STAGES.length) {
        clearInterval(timerRef.current);
        setStage(PIPELINE_STAGES.length - 1);
        setRunning(false);
        setDone(true);
        return;
      }
      setStage(i);
    }, 550);
  }

  const demo = getTenderById(DEMO_RESULT_ID);

  return (
    <>
      <div className="page-header">
        <div>
          <div className="eyebrow">ANALYSIS</div>
          <h1>Analyze New Tender</h1>
          <p>
            Submit a tender document, scanned image, free text, or GeM
            product link to run it through the compliance pipeline.
          </p>
        </div>
      </div>

      <div className="upload-grid">
        <section className="table-card upload-card">
          <div className="table-header">
            <div>
              <h2>Tender Input</h2>
              <p>Choose how you'd like to submit this tender</p>
            </div>
          </div>

          <div style={{ padding: "18px" }}>
            <label className="field-label">Tender name</label>
            <input
              className="field-input"
              placeholder="e.g. Smart Grid Metering — Phase III"
              value={tenderName}
              onChange={(e) => setTenderName(e.target.value)}
            />

            <div className="mode-tabs">
              {INPUT_MODES.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.key}
                    className={`mode-tab ${mode === m.key ? "mode-tab-active" : ""}`}
                    onClick={() => setMode(m.key)}
                  >
                    <Icon size={13} />
                    {m.label}
                  </button>
                );
              })}
            </div>

            {mode === "pdf" && (
              <label className="dropzone">
                <Upload size={20} />
                <strong>{fileName || "Click to upload a PDF or image"}</strong>
                <span>Supports scanned tenders — OCR runs automatically</span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  style={{ display: "none" }}
                  onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
                />
              </label>
            )}

            {mode === "text" && (
              <textarea
                className="field-textarea"
                placeholder="Paste tender specification text here..."
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
              />
            )}

            {mode === "gem" && (
              <input
                className="field-input"
                placeholder="https://gem.gov.in/product/..."
                value={gemUrl}
                onChange={(e) => setGemUrl(e.target.value)}
              />
            )}

            <button
              className="primary-button run-button"
              disabled={!hasInput || running}
              onClick={runAnalysis}
            >
              {running ? "Analyzing…" : "Run Compliance Analysis"}
            </button>
          </div>
        </section>

        <section className="table-card">
          <div className="table-header">
            <div>
              <h2>Pipeline Progress</h2>
              <p>Ingestion → retrieval → graph validation → generation</p>
            </div>
          </div>

          <div className="pipeline-list">
            {PIPELINE_STAGES.map((s, idx) => {
              const isDone = done || (running && idx < stage);
              const isActive = running && idx === stage;

              return (
                <div
                  key={s.title}
                  className={`pipeline-step ${isActive ? "pipeline-step-active" : ""} ${
                    isDone ? "pipeline-step-done" : ""
                  }`}
                >
                  <div className="pipeline-step-icon">
                    {isDone ? (
                      <CheckCircle2 size={15} />
                    ) : isActive ? (
                      <Loader2 size={15} className="spin" />
                    ) : (
                      <Circle size={15} />
                    )}
                  </div>

                  <div>
                    <strong>{s.title}</strong>
                    <p>{s.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {done && demo && (
        <section className="insight" style={{ marginTop: 14 }}>
          <div className="insight-icon">✓</div>

          <div>
            <strong>Analysis complete — {demo.standards} standards matched</strong>
            <p>
              This is a sample result from the compliance pipeline. Open the
              full report to see requirement extraction, graph relations and
              validation findings.
            </p>
          </div>

          <button onClick={() => navigate(`/tenders/${demo.id}`)}>
            View Full Report →
          </button>
        </section>
      )}
    </>
  );
}
