const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000/api";


async function request(
  endpoint,
  options = {}
) {

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      credentials: "include",
      ...options
    }
  );

  if (!response.ok) {

    let message = `API Error: ${response.status}`;

    try {
      const data = await response.json();
      if (data?.detail) message = data.detail;
    } catch {
      // response had no JSON body
    }

    throw new Error(message);

  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}


export const api = {

  googleLogin(credential) {
    return request("/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential })
    });
  },


  login(email, password) {
    return request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
  },


  register(name, email, password) {
    return request("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });
  },


  getMe() {
    return request("/auth/me");
  },


  logout() {
    return request("/auth/logout", {
      method: "POST"
    });
  },


  getDashboard() {
    return request("/dashboard");
  },


  getTenders() {
    return request("/tenders");
  },


  getTender(id) {
    return request(`/tenders/${id}`);
  },


  getCompliance(id) {
    return request(
      `/tenders/${id}/compliance`
    );
  },


  getStandards() {
    return request("/standards");
  },


  getReports() {
    return request("/reports");
  },


  analyzeTender(file, metadata = {}) {

    const formData = new FormData();

    formData.append("file", file);

    Object.entries(metadata).forEach(
      ([key, value]) => {

        formData.append(
          key,
          value
        );

      }
    );

    return request(
      "/tenders/analyze",
      {
        method: "POST",
        body: formData
      }
    );

  }

};