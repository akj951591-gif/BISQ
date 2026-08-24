import { useNavigate } from "react-router-dom";

const tenders = [
  {
    id: "tndr-2026-8842",
    name: "Smart Grid Metering — Phase II",
    ref: "TNDR-2026-8842",
    category: "Electrical",
    standards: 12,
    status: "Verified",
    risk: "Low",
    updated: "2 hours ago",
  },
  {
    id: "tndr-2026-8901",
    name: "Highway Illumination Infrastructure",
    ref: "TNDR-2026-8901",
    category: "Civil / Electrical",
    standards: 8,
    status: "Verified",
    risk: "Low",
    updated: "5 hours ago",
  },
  {
    id: "tndr-2026-9022",
    name: "Public Transit Surveillance System",
    ref: "TNDR-2026-9022",
    category: "IT / Security",
    standards: 4,
    status: "Deviations Found",
    risk: "High",
    updated: "Yesterday",
  },
  {
    id: "tndr-2026-8755",
    name: "Municipal Water Treatment Plant",
    ref: "TNDR-2026-8755",
    category: "Civil",
    standards: 24,
    status: "Pending Review",
    risk: "Medium",
    updated: "2 days ago",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <>
      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <div className="eyebrow">OVERVIEW</div>
          <h1>Compliance Intelligence</h1>
          <p>
            Analyze tender requirements against verified BIS standards and
            regulatory requirements.
          </p>
        </div>

        <div className="actions">
          <button className="secondary-button">Export Summary</button>
          <button
            className="primary-button"
            onClick={() => navigate("/tenders/new")}
          >
            Analyze New Tender
          </button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="stats">
        <div className="stat">
          <div className="stat-label">TENDERS ANALYZED</div>
          <div className="stat-number">124</div>
          <div className="stat-note positive">↑ 12 this week</div>
        </div>

        <div className="stat">
          <div className="stat-label">COMPLIANCE RATE</div>
          <div className="stat-number">92%</div>
          <div className="stat-note">Across active tenders</div>
        </div>

        <div className="stat danger">
          <div className="stat-label">CRITICAL ISSUES</div>
          <div className="stat-number danger-number">3</div>
          <div className="stat-note danger-text">Requires attention</div>
        </div>

        <div className="stat">
          <div className="stat-label">STANDARDS MATCHED</div>
          <div className="stat-number">1,205</div>
          <div className="stat-note">Verified BIS</div>
        </div>
      </div>

      {/* TABLE */}
      <section className="table-card">
        <div className="table-header">
          <div>
            <h2>Recent Tender Analysis</h2>
            <p>Latest compliance verification activity</p>
          </div>
          <button className="more">•••</button>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>TENDER SPECIFICATION</th>
                <th>CATEGORY</th>
                <th>STANDARDS</th>
                <th>COMPLIANCE</th>
                <th>RISK</th>
                <th>UPDATED</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {tenders.map((tender) => (
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

                  <td>
                    <strong className="standard-count">
                      {tender.standards}
                    </strong>
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
            </tbody>
          </table>
        </div>
      </section>

      {/* BOTTOM INSIGHT */}
      <section className="insight">
        <div className="insight-icon">✓</div>

        <div>
          <strong>Verification pipeline healthy</strong>
          <p>
            Standards matching and compliance validation are operating
            normally.
          </p>
        </div>

        <button>View system status →</button>
      </section>
    </>
  );
}
