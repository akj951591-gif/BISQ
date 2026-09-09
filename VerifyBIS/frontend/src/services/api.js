const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000/api";


/* =========================================================
   GENERIC REQUEST HELPER
========================================================= */

async function request(endpoint, options = {}) {
  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      credentials: "include",
      ...options,
    }
  );

  if (!response.ok) {
    let message = `API Error: ${response.status}`;

    try {
      const data = await response.json();

      if (data?.detail) {
        message =
          typeof data.detail === "string"
            ? data.detail
            : JSON.stringify(data.detail);
      }
    } catch {
      // Response had no JSON body
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}


/* =========================================================
   QUERY STRING HELPER
========================================================= */

function queryString(params = {}) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      search.set(key, String(value));
    }
  });

  const result = search.toString();

  return result ? `?${result}` : "";
}


/* =========================================================
   API
========================================================= */

export const api = {

  // =======================================================
  // AUTH
  // =======================================================

  googleLogin(credential) {
    return request("/auth/google", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        credential,
      }),
    });
  },


  login(email, password) {
    return request("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });
  },


  register(name, email, password) {
    return request("/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });
  },


  getMe() {
    return request("/auth/me");
  },


  logout() {
    return request("/auth/logout", {
      method: "POST",
    });
  },


  // =======================================================
  // HEALTH
  // =======================================================

  health() {
    return request("/health");
  },


  // =======================================================
  // DASHBOARD
  // =======================================================

  getDashboard() {
    return request("/dashboard");
  },


  // =======================================================
  // TENDERS
  // =======================================================

  getTenders() {
    return request("/tenders");
  },


  getTender(id) {
    return request(
      `/tenders/${encodeURIComponent(id)}`
    );
  },


  getTenderCompliance(id) {
    return request(
      `/tenders/${encodeURIComponent(id)}/compliance`
    );
  },


  // Compatibility with existing frontend
  getCompliance(id) {
    return request(
      `/tenders/${encodeURIComponent(id)}/compliance`
    );
  },


  analyzeTender(file, metadata = {}) {
    const formData = new FormData();

    if (file) {
      formData.append("file", file);
    }

    Object.entries(metadata).forEach(
      ([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          formData.append(
            key,
            value
          );
        }
      }
    );

    return request(
      "/tenders/analyze",
      {
        method: "POST",
        body: formData,
      }
    );
  },


  analyzeTenderText(
    text,
    metadata = {}
  ) {
    return request(
      "/tenders/analyze-text",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          ...metadata,
        }),
      }
    );
  },


  // =======================================================
  // BIS STANDARDS
  // =======================================================

  getStandards(params = {}) {
    return request(
      `/standards${queryString(params)}`
    );
  },


  getStandard(id) {
    return request(
      `/standards/${encodeURIComponent(id)}`
    );
  },


  searchStandards(
    query,
    limit = 20,
    offset = 0
  ) {
    return request(
      `/standards/search${queryString({
        q: query,
        limit,
        offset,
      })}`
    );
  },


  // =======================================================
  // NEO4J KNOWLEDGE GRAPH
  // =======================================================

  getStandardGraph(documentId) {
    return request(
      `/graph/standard/${encodeURIComponent(
        documentId
      )}`
    );
  },


  getGraphHealth() {
    return request("/graph/health");
  },


  getGraphStats() {
    return request("/graph/stats");
  },


  getGraphRelationships() {
    return request("/graph/relationships");
  },


  // =======================================================
  // HYBRID BIS SEARCH
  // =======================================================

  search(
    query,
    limit = 5
  ) {
    return request(
      `/search${queryString({
        q: query,
        limit,
      })}`
    );
  },


  // =======================================================
  // RAG / AI ASK
  // =======================================================

  ask(
    query,
    limit = 5
  ) {
    return request(
      `/search/ask${queryString({
        q: query,
        limit,
      })}`
    );
  },


  // =======================================================
  // AI COMPLIANCE ANALYSIS
  // =======================================================

  analyzeCompliance(
    product,
    limit = 8
  ) {
    return request(
      `/search/compliance${queryString({
        product,
        limit,
      })}`
    );
  },


  // =======================================================
  // REPORTS
  // =======================================================

  getReports() {
    return request("/reports");
  },


  generateReport(
    type,
    params = {}
  ) {
    return request(
      `/reports/generate${queryString({
        type,
        ...params,
      })}`,
      {
        method: "POST",
      }
    );
  },


  downloadReport(id) {
    return `${API_URL}/reports/${encodeURIComponent(
      id
    )}/download`;
  },


  // =======================================================
  // GENERIC GET
  // =======================================================

  get(endpoint) {
    return request(endpoint);
  },


  // =======================================================
  // GENERIC POST
  // =======================================================

  post(
    endpoint,
    body
  ) {
    return request(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  },


  // =======================================================
  // GENERIC DELETE
  // =======================================================

  delete(endpoint) {
    return request(endpoint, {
      method: "DELETE",
    });
  },

};