import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { tenders } from "../data/mockTenders.js";

const FILTERS = ["All", "Verified", "Deviations Found", "Pending Review"];

export default function Tenders() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");

  const filtered = tenders.filter((t) => {
    const matchesFilter = filter === "All" || t.status === filter;
    const matchesQuery =
      query.trim() === "" ||
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.ref.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <>
      <div className="page-header">
        <div>
          <div className="eyebrow">WORKSPACE</div>
          <h1>Tenders</h1>
          <p>Manage and review tender compliance analyses.</p>
        </div>

        <div className="actions">
          <button className="primary-button" onClick={() => navigate("/tenders/new")}>
            + Analyze New Tender
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <input
          className="filter-search"
          placeholder="Search by name or reference..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="chip-row">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`chip ${filter === f ? "chip-active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <section className="table-card">
        <div className="table-header">
          <div>
            <h2>All Tenders</h2>
            <p>{filtered.length} of {tenders.length} tenders</p>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>TENDER SPECIFICATION</th>
                <th>CATEGORY</th>
                <th>INPUT TYPE</th>
                <th>STANDARDS</th>
                <th>COMPLIANCE</th>
                <th>RISK</th>
                <th>UPDATED</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((tender) => (
                <tr
                  key={tender.ref}
                  className={tender.risk === "High" ? "warning-row" : ""}
                  onClick={() => navigate(`/tenders/${tender.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <td>
                    <strong className="tender-name">{tender.name}</strong>
                    <small className="tender-ref">{tender.ref}</small>
                  </td>
                  <td>{tender.category}</td>
                  <td>{tender.inputType}</td>
                  <td>
                    <strong className="standard-count">{tender.standards}</strong>
                  </td>
                  <td>
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
                  </td>
                  <td>
                    <span
                      className={
                        tender.risk === "Low"
                          ? "badge low"
                          : tender.risk === "Medium"
                          ? "badge medium"
                          : "badge high"
                      }
                    >
                      {tender.risk}
                    </span>
                  </td>
                  <td className="updated">{tender.updated}</td>
                  <td className="arrow">→</td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "28px" }}>
                    No tenders match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
