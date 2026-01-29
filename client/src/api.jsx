// api.js or similar helper
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000'
});

// Automatically add token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;