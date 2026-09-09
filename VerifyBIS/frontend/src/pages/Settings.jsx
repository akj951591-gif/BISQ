import { AlertTriangle } from "lucide-react";

export default function Settings() {
  return (
    <>
      <div className="page-header">
        <div>
          <div className="eyebrow">SYSTEM</div>
          <h1>Settings</h1>
          <p>Configure your BISQ workspace.</p>
        </div>
      </div>

      <section className="table-card" style={{ marginBottom: 14 }}>
        <div className="table-header">
          <div>
            <h2>Backend Connection</h2>
            <p>Ingestion, retrieval and LLM services</p>
          </div>
        </div>
        <div className="validation-row" style={{ padding: "14px 17px" }}>
          <AlertTriangle size={14} className="v-warn" />
          <span>
            No backend connected yet — the app is currently running on mock
            data. Set <code>VITE_API_BASE_URL</code> in <code>.env</code> once
            the ingestion/retrieval/LLM services are deployed.
          </span>
        </div>
      </section>

      <section className="table-card">
        <div className="table-header">
          <div>
            <h2>Workspace</h2>
            <p>Organization details</p>
          </div>
        </div>
        <div className="kv-list">
          <div className="kv-row">
            <span>Organization</span>
            <strong>Government Procurement Division</strong>
          </div>
          <div className="kv-row">
            <span>Default language</span>
            <strong>English (12+ Indic languages via Bhashini)</strong>
          </div>
          <div className="kv-row">
            <span>Standards source</span>
            <strong>Bureau of Indian Standards (BIS)</strong>
          </div>
        </div>
      </section>
    </>
  );
}
