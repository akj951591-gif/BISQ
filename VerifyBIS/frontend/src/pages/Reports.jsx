import { FileText, Download } from "lucide-react";
import { tenders } from "../data/mockTenders.js";

const REPORT_TYPES = [
  { name: "Weekly Compliance Digest", desc: "Summary of all tenders analyzed this week", period: "Generated every Monday" },
  { name: "Critical Findings Report", desc: "All high-risk deviations across active tenders", period: "Generated on demand" },
  { name: "Standards Coverage Report", desc: "Which BIS standards were matched, and how often", period: "Generated monthly" },
];

export default function Reports() {
  return (
    <>
      <div className="page-header">
        <div>
          <div className="eyebrow">REPORTING</div>
          <h1>Reports</h1>
          <p>Export compliance summaries for audit and procurement records.</p>
        </div>
      </div>

      <div className="report-grid">
        {REPORT_TYPES.map((r) => (
          <div className="report-card" key={r.name}>
            <div className="insight-icon" style={{ marginBottom: 10 }}>
              <FileText size={14} />
            </div>
            <strong>{r.name}</strong>
            <p>{r.desc}</p>
            <small>{r.period}</small>
            <button className="secondary-button" style={{ marginTop: 12 }}>
              <Download size={12} style={{ verticalAlign: -2, marginRight: 5 }} />
              Export
            </button>
          </div>
        ))}
      </div>

      <section className="table-card" style={{ marginTop: 14 }}>
        <div className="table-header">
          <div>
            <h2>Per-Tender Compliance Records</h2>
            <p>Individual verified output for each analyzed tender</p>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>TENDER</th>
                <th>STATUS</th>
                <th>UPDATED</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tenders.map((t) => (
                <tr key={t.ref}>
                  <td>
                    <strong className="tender-name">{t.name}</strong>
                    <small className="tender-ref">{t.ref}</small>
                  </td>
                  <td>
                    <span
                      className={
                        t.status === "Verified"
                          ? "badge verified"
                          : t.status === "Deviations Found"
                          ? "badge deviation"
                          : "badge pending"
                      }
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="updated">{t.updated}</td>
                  <td>
                    <button className="secondary-button">
                      <Download size={12} style={{ verticalAlign: -2, marginRight: 5 }} />
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
