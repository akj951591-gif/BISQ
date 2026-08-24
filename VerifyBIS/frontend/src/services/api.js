const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000/api";


async function request(
  endpoint,
  options = {}
) {

  const response = await fetch(
    `${API_URL}${endpoint}`,
    options
  );

  if (!response.ok) {

    throw new Error(
      `API Error: ${response.status}`
    );

  }

  return response.json();
}


export const api = {

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