// In your API setup file
import axios from 'axios';
import { checkAndRefreshToken } from './tokenRefresh';

const api = axios.create({
  baseURL: 'http://54.169.81.75:8000'
});

api.interceptors.request.use(
  async (config) => {
    await checkAndRefreshToken();
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;