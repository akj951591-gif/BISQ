import { useState } from "react";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api.js";


function StatusIcon({ status }) {
  if (status === "COMPLIANT") {
    return <CheckCircle2 size={18} />;
  }

  if (status === "NON_COMPLIANT") {
    return <XCircle size={18} />;
  }

  return <AlertTriangle size={18} />;
}


export default function TenderUpload() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);


  function handleFile(selectedFile) {
    if (!selectedFile) {
      return;
    }

    const isPdf =
      selectedFile.type === "application/pdf" ||
      selectedFile.name
        .toLowerCase()
        .endsWith(".pdf");

    const isTxt =
      selectedFile.type === "text/plain" ||
      selectedFile.name
        .toLowerCase()
        .endsWith(".txt");

    if (!isPdf && !isTxt) {
      setError(
        "Please upload a PDF or TXT tender."
      );
      return;
    }

    setError("");
    setResult(null);
    setFile(selectedFile);
  }


  function handleDrop(event) {
    event.preventDefault();

    setDragging(false);

    const droppedFile =
      event.dataTransfer.files?.[0];

    handleFile(droppedFile);
  }


  async function handleAnalyze() {
    if (!file) {
      setError(
        "Please select a tender file first."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const response =
        await api.analyzeTender(file);

      setResult(response);

    } catch (err) {
      setError(
        err?.message ||
        "Tender analysis failed."
      );
    } finally {
      setLoading(false);
    }
  }


  function statusClass(status) {
    if (status === "COMPLIANT") {
      return "success";
    }

    if (status === "NON_COMPLIANT") {
      return "danger";
    }

    return "warning";
  }


  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">
            TENDER ANALYSIS
          </div>

          <h1>Analyze Tender</h1>

          <p>
            Upload a tender document and compare
            its requirements against BIS standards.
          </p>
        </div>
      </div>


      {!result && (
        <section className="table-card">
          <div className="table-header">
            <div>
              <h2>Upload Tender</h2>

              <p>
                PDF and TXT files are supported.
              </p>
            </div>
          </div>


          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => {
              setDragging(false);
            }}
            onDrop={handleDrop}
            style={{
              margin: "20px",
              padding: "50px 30px",
              border: "2px dashed var(--border)",
              borderRadius: "12px",
              textAlign: "center",
              background: dragging
                ? "var(--surface-alt)"
                : "transparent",
              transition: "0.2s",
            }}
          >
            <Upload
              size={32}
              style={{
                marginBottom: "12px",
              }}
            />

            <h3>
              {file
                ? file.name
                : "Drop your tender here"}
            </h3>

            <p>
              {file
                ? `${(
                    file.size /
                    1024 /
                    1024
                  ).toFixed(2)} MB`
                : "or choose a PDF or TXT file"}
            </p>


            <label
              className="primary-button"
              style={{
                display: "inline-flex",
                cursor: "pointer",
                marginTop: "12px",
              }}
            >
              <FileText size={14} />

              Choose File

              <input
                type="file"
                accept=".pdf,.txt,application/pdf,text/plain"
                hidden
                onChange={(event) =>
                  handleFile(
                    event.target.files?.[0]
                  )
                }
              />
            </label>
          </div>


          {error && (
            <div
              style={{
                margin: "20px",
                padding: "14px",
                borderRadius: "8px",
                background:
                  "var(--danger-bg)",
                color: "var(--danger)",
              }}
            >
              {error}
            </div>
          )}


          <div
            style={{
              padding: "0 20px 20px",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              className="primary-button"
              disabled={!file || loading}
              onClick={handleAnalyze}
            >
              {loading ? (
                <>
                  <Loader2
                    size={14}
                    className="spin"
                  />

                  Analyzing...
                </>
              ) : (
                <>
                  <FileText size={14} />

                  Analyze Tender
                </>
              )}
            </button>
          </div>
        </section>
      )}


      {result && (
        <div
          style={{
            display: "grid",
            gap: "20px",
          }}
        >
          <section className="table-card">
            <div
              style={{
                padding: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "20px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div className="eyebrow">
                  ANALYSIS RESULT
                </div>

                <h2>
                  {file?.name ||
                    result.filename ||
                    "Tender"}
                </h2>

                <p>
                  {result.summary ||
                    "Analysis completed."}
                </p>
              </div>


              <div
                className={`badge ${statusClass(
                  result.status
                )}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 12px",
                }}
              >
                <StatusIcon
                  status={result.status}
                />

                {result.status ||
                  "NEEDS_EVIDENCE"}
              </div>
            </div>
          </section>


          <section className="table-card">
            <div className="table-header">
              <div>
                <h2>
                  Compliance Findings
                </h2>

                <p>
                  {result.findings?.length || 0}{" "}
                  findings identified.
                </p>
              </div>
            </div>


            <div style={{ padding: "20px" }}>
              {result.findings?.length ? (
                result.findings.map(
                  (finding, index) => (
                    <div
                      key={index}
                      style={{
                        padding: "18px",
                        border: "1px solid var(--border)",
                        borderRadius: "10px",
                        marginBottom: "12px",
                      }}
                    >
                      <h3>
                        {index + 1}.{" "}
                        {finding.requirement}
                      </h3>

                      <p>
                        <strong>
                          Assessment:
                        </strong>{" "}
                        {finding.assessment}
                      </p>

                      <p>
                        <strong>
                          Evidence:
                        </strong>{" "}
                        {finding.evidence}
                      </p>

                      <p>
                        <strong>
                          Source:
                        </strong>{" "}
                        {finding.source}

                        {finding.page
                          ? ` — Page ${finding.page}`
                          : ""}
                      </p>
                    </div>
                  )
                )
              ) : (
                <div
                  style={{
                    padding: "30px",
                    textAlign: "center",
                  }}
                >
                  No specific findings were
                  generated.
                </div>
              )}
            </div>
          </section>


          <section className="table-card">
            <div className="table-header">
              <div>
                <h2>
                  Relevant BIS Standards
                </h2>

                <p>
                  Standards retrieved from the
                  BIS knowledge base.
                </p>
              </div>
            </div>


            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>STANDARD</th>
                    <th>TITLE</th>
                    <th>YEAR</th>
                    <th>PAGE</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {result.sources?.map(
                    (source, index) => (
                      <tr key={index}>
                        <td>
                          <span className="mono">
                            {source.is_number ||
                              source.document_id ||
                              "—"}
                          </span>
                        </td>

                        <td>
                          {source.title ||
                            "Untitled"}
                        </td>

                        <td>
                          {source.year || "—"}
                        </td>

                        <td>
                          {source.page_number ||
                            "—"}
                        </td>

                        <td>
                          {source.pdf_url && (
                            <a
                              href={
                                source.pdf_url
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="source-link"
                            >
                              Open
                            </a>
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </section>


          <div
            style={{
              display: "flex",
              gap: "10px",
              justifyContent: "flex-end",
            }}
          >
            <button
              className="secondary-button"
              onClick={() => {
                setResult(null);
                setFile(null);
              }}
            >
              Analyze Another
            </button>

            <button
              className="primary-button"
              onClick={() =>
                navigate("/reports")
              }
            >
              View Reports
            </button>
          </div>
        </div>
      )}
    </div>
  );
}