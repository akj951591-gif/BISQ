// Mock data only — no backend is wired up yet.
// Shape mirrors the pipeline in TechStack_Architecture.docx:
// Input -> AI Document Reader -> Requirement Extraction -> Hybrid Search
// -> RAG Retrieval -> Normative Graph (Neo4j) -> Validation/Rule Engine
// -> Structured Result -> LLM (Llama-3.3-70B) -> Verified Output

export const tenders = [
  {
    id: "tndr-2026-8842",
    name: "Smart Grid Metering — Phase II",
    ref: "TNDR-2026-8842",
    category: "Electrical",
    inputType: "Tender PDF",
    standards: 12,
    status: "Verified",
    risk: "Low",
    updated: "2 hours ago",
    extraction: [
      { spec: "Voltage / Phase", value: "415V, 3-phase" },
      { spec: "Ingress Protection", value: "IP66" },
      { spec: "Meter Class", value: "Class 0.5S" },
      { spec: "Communication", value: "RF Mesh / DLMS-COSEM" },
    ],
    matches: [
      { code: "IS 16444:2015", title: "AC Static Smart Meters", score: 0.94 },
      { code: "IS 13779:1999", title: "AC Static Watt-hour Meters", score: 0.88 },
      { code: "IEC 62056", title: "DLMS/COSEM Data Exchange", score: 0.81 },
    ],
    graph: [
      "IS 16444:2015 → tested per IS 13779 metrological clauses",
      "IS 16444:2015 → certification: BIS ISI mark mandatory (QCO)",
    ],
    validation: [
      { type: "ok", text: "Latest edition referenced — no supersession" },
      { type: "ok", text: "QCO applicable and certification clause present" },
    ],
    llmSummary:
      "The tender's electrical and metrological requirements align with IS 16444:2015 across all matched clauses. No missing certification language detected.",
  },
  {
    id: "tndr-2026-8901",
    name: "Highway Illumination Infrastructure",
    ref: "TNDR-2026-8901",
    category: "Civil / Electrical",
    inputType: "Tender PDF",
    standards: 8,
    status: "Verified",
    risk: "Low",
    updated: "5 hours ago",
    extraction: [
      { spec: "Luminaire Type", value: "LED, 120W" },
      { spec: "Pole Material", value: "Galvanized steel, IS 2629" },
      { spec: "Ingress Protection", value: "IP65" },
    ],
    matches: [
      { code: "IS 10322", title: "Luminaires — General Requirements", score: 0.9 },
      { code: "IS 2629:1985", title: "Hot-dip Galvanizing of Steel", score: 0.86 },
    ],
    graph: [
      "IS 2629:1985 → amended by IS 2629:1985 Amd. 2",
      "IS 10322 → referenced testing standard IS/IEC 60598",
    ],
    validation: [
      { type: "ok", text: "Pole material spec matches latest galvanizing standard" },
      { type: "warn", text: "Amendment 2 to IS 2629 not explicitly cited in tender text" },
    ],
    llmSummary:
      "Core lighting and structural specs are compliant. Recommend adding an explicit reference to IS 2629 Amendment 2 for full traceability.",
  },
  {
    id: "tndr-2026-9022",
    name: "Public Transit Surveillance System",
    ref: "TNDR-2026-9022",
    category: "IT / Security",
    inputType: "Scanned Image",
    standards: 4,
    status: "Deviations Found",
    risk: "High",
    updated: "1 day ago",
    extraction: [
      { spec: "Camera Resolution", value: "4MP minimum" },
      { spec: "Storage Retention", value: "30 days" },
      { spec: "Data Protection", value: "Not specified" },
    ],
    matches: [
      { code: "IS 16910", title: "Video Surveillance Systems", score: 0.77 },
      { code: "IS/ISO 27001", title: "Information Security Management", score: 0.64 },
    ],
    graph: [
      "IS 16910 → references cybersecurity annex (draft, not yet gazetted)",
    ],
    validation: [
      { type: "error", text: "No data-protection / retention-encryption clause found" },
      { type: "error", text: "Cybersecurity annex referenced is still in draft status" },
      { type: "warn", text: "Camera resolution clause below recommended 5MP benchmark" },
    ],
    llmSummary:
      "Three material deviations detected, primarily around data protection and an unratified cybersecurity annex. Manual legal review recommended before award.",
  },
  {
    id: "tndr-2026-8755",
    name: "Municipal Water Treatment Plant",
    ref: "TNDR-2026-8755",
    category: "Civil",
    inputType: "GeM Product URL",
    standards: 24,
    status: "Pending Review",
    risk: "Medium",
    updated: "2 days ago",
    extraction: [
      { spec: "Concrete Grade", value: "M25" },
      { spec: "Reinforcement", value: "Fe 500D, IS 1786" },
      { spec: "Design Code", value: "IS 456:1978 (cited)" },
    ],
    matches: [
      { code: "IS 456:2000", title: "Plain and Reinforced Concrete — Code of Practice", score: 0.92 },
      { code: "IS 1786:2008", title: "High Strength Deformed Steel Bars", score: 0.89 },
    ],
    graph: [
      "IS 456:1978 → superseded by IS 456:2000, Amd. 1–5",
    ],
    validation: [
      { type: "error", text: "Sentinel flag: tender cites superseded IS 456:1978 — should reference IS 456:2000 Amd. 1–5" },
      { type: "ok", text: "Reinforcement grade matches current IS 1786:2008" },
    ],
    llmSummary:
      "Sentinel detected an outdated code reference. Draft replacement clause generated citing IS 456:2000 with Amendments 1–5; awaiting procurement officer approval.",
  },
];

export function getTenderById(id) {
  return tenders.find((t) => t.id === id);
}
