import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api/", // change to your backend URL
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔐 Attach token automatically (if using JWT)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🚨 Global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;