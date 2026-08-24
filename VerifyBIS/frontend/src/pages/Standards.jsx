import { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { tenders } from "../data/mockTenders.js";

const EXTRA_STANDARDS = [
  { code: "IS 456:2000", title: "Plain and Reinforced Concrete — Code of Practice", status: "Current", category: "Civil" },
  { code: "IS 1786:2008", title: "High Strength Deformed Steel Bars for Concrete", status: "Current", category: "Civil" },
  { code: "IS 16444:2015", title: "AC Static Smart Meters — Class 0.5S and 1", status: "Current", category: "Electrical" },
  { code: "IS 13779:1999", title: "AC Static Watt-hour Meters, Class 1 & 2", status: "Current", category: "Electrical" },
  { code: "IS 2629:1985", title: "Recommended Practice for Hot-dip Galvanizing", status: "Amended", category: "Civil" },
  { code: "IS 10322", title: "Luminaires — General Requirements and Tests", status: "Current", category: "Electrical" },
  { code: "IS 16910", title: "Video Surveillance Systems — Requirements", status: "Current", category: "IT / Security" },
  { code: "IS 456:1978", title: "Plain and Reinforced Concrete (superseded)", status: "Superseded", category: "Civil" },
];

function buildCatalog() {
  const fromTenders = tenders.flatMap((t) =>
    t.matches.map((m) => ({
      code: m.code,
      title: m.title,
      status: "Current",
      category: t.category,
    }))
  );

  const merged = [...EXTRA_STANDARDS, ...fromTenders];
  const seen = new Map();
  merged.forEach((s) => {
    if (!seen.has(s.code)) seen.set(s.code, s);
  });
  return Array.from(seen.values());
}

const CATALOG = buildCatalog();

export default function Standards() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      CATALOG.filter(
        (s) =>
          query.trim() === "" ||
          s.code.toLowerCase().includes(query.toLowerCase()) ||
          s.title.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  );

  return (
    <>
      <div className="page-header">
        <div>
          <div className="eyebrow">KNOWLEDGE BASE</div>
          <h1>BIS Standards</h1>
          <p>Explore verified standards, amendments and references.</p>
        </div>
      </div>

      <div className="filter-bar">
        <input
          className="filter-search"
          placeholder="Search by IS code or title..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <section className="table-card">
        <div className="table-header">
          <div>
            <h2>Standards Catalog</h2>
            <p>{filtered.length} of {CATALOG.length} standards indexed</p>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>CODE</th>
                <th>TITLE</th>
                <th>CATEGORY</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.code}>
                  <td>
                    <span className="mono standard-code">
                      <ShieldCheck size={12} style={{ marginRight: 5, verticalAlign: -2 }} />
                      {s.code}
                    </span>
                  </td>
                  <td>{s.title}</td>
                  <td>{s.category}</td>
                  <td>
                    <span
                      className={
                        s.status === "Superseded"
                          ? "badge deviation"
                          : s.status === "Amended"
                          ? "badge medium"
                          : "badge verified"
                      }
                    >
                      {s.status}
                    </span>
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
