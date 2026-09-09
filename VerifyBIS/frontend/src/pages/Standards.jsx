import { useEffect, useState } from "react";
import {
  Search,
  ShieldCheck,
  FileText,
  ExternalLink,
  RefreshCw,
  Database,
  Network,
  X,
} from "lucide-react";
import { api } from "../services/api.js";

export default function Standards() {
  const [standards, setStandards] = useState([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Knowledge graph state
  const [selectedStandard, setSelectedStandard] = useState(null);
  const [graph, setGraph] = useState(null);
  const [graphLoading, setGraphLoading] = useState(false);
  const [graphError, setGraphError] = useState("");

  async function loadStandards(search = "") {
    try {
      setLoading(true);
      setError("");

      const data = search.trim()
        ? await api.searchStandards(search.trim(), 50)
        : await api.getStandards({ limit: 50 });

      setStandards(data?.standards || []);
      setTotal(data?.total ?? data?.count ?? 0);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load BIS standards.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStandards();
  }, []);

  function handleSearch(event) {
    event.preventDefault();
    loadStandards(query);
  }

  function getStatus(standard) {
    if (standard.superseding || standard.supersede_by) {
      return "Referenced";
    }

    if (standard.amendments) {
      return "Amended";
    }

    return "Current";
  }

  async function handleViewGraph(standard) {
    try {
      setSelectedStandard(standard);
      setGraph(null);
      setGraphError("");
      setGraphLoading(true);

      const data = await api.getStandardGraph(
        standard.document_id
      );

      setGraph(data);
    } catch (err) {
      console.error(err);

      setGraphError(
        err.message || "Failed to load knowledge graph."
      );
    } finally {
      setGraphLoading(false);
    }
  }

  function closeGraph() {
    setSelectedStandard(null);
    setGraph(null);
    setGraphError("");
    setGraphLoading(false);
  }

  function getConnectedEntityName(relationship) {
    const properties = relationship?.properties || {};

    return (
      properties.name ||
      properties.committee ||
      properties.division ||
      properties.value ||
      properties.document_id ||
      properties.is_number ||
      "Connected entity"
    );
  }

  return (
    <div className="page standards-page">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="page-header standards-header">
        <div>
          <div className="eyebrow">
            KNOWLEDGE BASE
          </div>

          <h1>BIS Standards</h1>

          <p>
            Search and explore standards from the BIS
            knowledge base.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => loadStandards(query)}
          disabled={loading}
        >
          <RefreshCw
            size={14}
            className={loading ? "spin" : ""}
          />

          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="error-message standards-error">
          {error}
        </div>
      )}

      {/* =====================================================
          STATS
      ====================================================== */}

      <div className="standards-overview">

        <div className="standards-overview-card">
          <div className="standards-overview-icon">
            <Database size={20} />
          </div>

          <div>
            <span>Total Standards</span>

            <strong>
              {total.toLocaleString()}
            </strong>
          </div>
        </div>

        <div className="standards-overview-card">
          <div className="standards-overview-icon">
            <ShieldCheck size={20} />
          </div>

          <div>
            <span>Showing</span>

            <strong>
              {standards.length}
            </strong>
          </div>
        </div>

        <div className="standards-overview-card">
          <div className="standards-overview-icon">
            <FileText size={20} />
          </div>

          <div>
            <span>Searchable Database</span>

            <strong>
              Active
            </strong>
          </div>
        </div>

      </div>

      {/* =====================================================
          SEARCH
      ====================================================== */}

      <section className="standards-search-card">

        <form
          className="standards-search-form"
          onSubmit={handleSearch}
        >

          <div className="standards-search-input">

            <Search size={17} />

            <input
              type="text"
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Search by IS number, title, committee or division..."
            />

            {query && (
              <button
                type="button"
                className="standards-search-clear"
                onClick={() => {
                  setQuery("");
                  loadStandards("");
                }}
              >
                Clear
              </button>
            )}

          </div>

          <button
            type="submit"
            className="primary-button standards-search-button"
            disabled={loading}
          >
            <Search size={15} />
            Search Standards
          </button>

        </form>

        <div className="standards-search-hint">
          Try searches such as{" "}
          <strong>IS 456</strong>,
          <strong> electrical</strong>, or a standard title.
        </div>

      </section>

      {/* =====================================================
          RESULTS
      ====================================================== */}

      <section className="table-card standards-table-card">

        <div className="table-header standards-table-header">

          <div>
            <h2>
              Standards Catalog
            </h2>

            <p>
              {query
                ? `Search results for "${query}"`
                : "Latest standards from the BIS database"}
            </p>
          </div>

          <div className="standards-result-count">
            {standards.length} results
          </div>

        </div>

        {/* LOADING */}

        {loading ? (
          <div className="standards-loading">

            <div className="loading-spinner" />

            <div>
              <strong>
                Loading BIS standards
              </strong>

              <p>
                Fetching standards from the database...
              </p>
            </div>

          </div>
        ) : standards.length === 0 ? (

          /* EMPTY */

          <div className="standards-empty">

            <div className="standards-empty-icon">
              <Search size={24} />
            </div>

            <h3>
              No standards found
            </h3>

            <p>
              Try a different IS number, title,
              committee, or division.
            </p>

            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setQuery("");
                loadStandards("");
              }}
            >
              Clear Search
            </button>

          </div>
        ) : (

          /* RESULTS */

          <div className="standards-list">

            {standards.map((standard) => {

              const status = getStatus(standard);

              return (
                <div
                  key={
                    standard.document_id ||
                    standard.id
                  }
                  className="standard-result"
                >

                  {/* STANDARD CONTENT */}

                  <div className="standard-result-main">

                    <div className="standard-result-icon">
                      <ShieldCheck size={19} />
                    </div>

                    <div className="standard-result-content">

                      <div className="standard-result-top">

                        <span className="standard-number">
                          {standard.is_number ||
                            standard.document_id ||
                            "BIS Standard"}
                        </span>

                        <span
                          className={`badge ${
                            status === "Amended"
                              ? "medium"
                              : status === "Referenced"
                              ? "pending"
                              : "verified"
                          }`}
                        >
                          {status}
                        </span>

                      </div>

                      <h3>
                        {standard.title ||
                          "Untitled BIS Standard"}
                      </h3>

                      <div className="standard-meta">

                        {standard.year && (
                          <span>
                            Year: {standard.year}
                          </span>
                        )}

                        {standard.committee && (
                          <span>
                            Committee:{" "}
                            {standard.committee}
                          </span>
                        )}

                        {standard.division && (
                          <span>
                            Division:{" "}
                            {standard.division}
                          </span>
                        )}

                      </div>

                      {standard.amendments && (
                        <div className="standard-amendment">
                          <strong>
                            Amendments:
                          </strong>{" "}
                          {standard.amendments}
                        </div>
                      )}

                    </div>

                  </div>

                  {/* ACTIONS */}

                  <div className="standard-result-actions">

                    {/* GRAPH */}

                    <button
                      type="button"
                      className="secondary-button standard-graph-button"
                      onClick={() =>
                        handleViewGraph(standard)
                      }
                    >
                      <Network size={14} />
                      Graph
                    </button>

                    {/* PDF */}

                    {standard.pdf_url && (
                      <a
                        href={standard.pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        className="secondary-button standard-open-button"
                      >
                        <FileText size={14} />

                        PDF

                        <ExternalLink size={12} />
                      </a>
                    )}

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </section>

      {/* =====================================================
          KNOWLEDGE GRAPH MODAL
      ====================================================== */}

      {selectedStandard && (
        <div
          className="graph-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeGraph();
            }
          }}
        >

          <div className="graph-modal">

            {/* MODAL HEADER */}

            <div className="graph-modal-header">

              <div>

                <div className="eyebrow">
                  KNOWLEDGE GRAPH
                </div>

                <h2>
                  {selectedStandard.is_number ||
                    selectedStandard.document_id ||
                    "BIS Standard"}
                </h2>

                <p>
                  {selectedStandard.title ||
                    "BIS Standard"}
                </p>

              </div>

              <button
                type="button"
                className="graph-close-button"
                onClick={closeGraph}
                aria-label="Close knowledge graph"
              >
                <X size={18} />
              </button>

            </div>

            {/* GRAPH LOADING */}

            {graphLoading && (
              <div className="graph-loading">

                <div className="loading-spinner" />

                <div>
                  <strong>
                    Loading knowledge graph
                  </strong>

                  <p>
                    Fetching relationships from Neo4j...
                  </p>
                </div>

              </div>
            )}

            {/* GRAPH ERROR */}

            {graphError && !graphLoading && (
              <div className="graph-error-wrapper">

                <div className="error-message">
                  {graphError}
                </div>

              </div>
            )}

            {/* GRAPH */}

            {!graphLoading &&
              !graphError &&
              graph && (
                <div className="graph-visual">

                  {/* MAIN STANDARD NODE */}

                  <div className="graph-main-node">

                    <div className="graph-node-icon">
                      <ShieldCheck size={20} />
                    </div>

                    <div>

                      <span className="graph-node-type">
                        BIS STANDARD
                      </span>

                      <strong>
                        {graph.standard?.properties
                          ?.is_number ||
                          selectedStandard.is_number ||
                          selectedStandard.document_id}
                      </strong>

                      <p>
                        {graph.standard?.properties
                          ?.title ||
                          selectedStandard.title ||
                          "BIS Standard"}
                      </p>

                    </div>

                  </div>

                  {/* CONNECTIONS */}

                  <div className="graph-relationships">

                    {graph.relationships &&
                    graph.relationships.length > 0 ? (

                      graph.relationships.map(
                        (relationship, index) => {

                          const entityName =
                            getConnectedEntityName(
                              relationship
                            );

                          return (
                            <div
                              className="graph-relationship-card"
                              key={`${relationship.relationship}-${index}`}
                            >

                              {/* RELATIONSHIP */}

                              <div className="graph-relationship-line">

                                <span className="graph-node-dot" />

                                <span className="graph-relationship-type">
                                  {relationship.relationship ||
                                    "RELATED_TO"}
                                </span>

                                <span className="graph-node-dot" />

                              </div>

                              {/* CONNECTED ENTITY */}

                              <div className="graph-connected-node">

                                <span className="graph-node-type">
                                  {relationship.labels?.[0] ||
                                    "ENTITY"}
                                </span>

                                <strong>
                                  {entityName}
                                </strong>

                              </div>

                            </div>
                          );
                        }
                      )

                    ) : (

                      <div className="graph-empty">

                        <Network size={24} />

                        <strong>
                          No relationships found
                        </strong>

                        <p>
                          This standard does not
                          currently have connected
                          entities in the graph.
                        </p>

                      </div>

                    )}

                  </div>

                  {/* GRAPH FOOTER */}

                  <div className="graph-footer">

                    <div className="graph-footer-item">

                      <span className="graph-footer-dot" />

                      <span>
                        Neo4j Knowledge Graph
                      </span>

                    </div>

                    <span>
                      {graph.relationships?.length || 0}{" "}
                      relationships
                    </span>

                  </div>

                </div>
              )}

          </div>

        </div>
      )}

    </div>
  );
}