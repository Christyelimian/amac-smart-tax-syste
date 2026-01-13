import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Payers
  getPayers: async (params?: {
    skip?: number;
    limit?: number;
    search?: string;
    zone?: string;
    business_type?: string;
  }) => {
    const response = await api.get('/payers', { params });
    return response.data;
  },

  getPayer: async (payerId: string) => {
    const response = await api.get(`/payers/${payerId}`);
    return response.data;
  },

  // Analytics
  getAnalyticsOverview: async () => {
    const response = await api.get('/analytics/overview');
    return response.data;
  },

  // Scraping
  getScrapingStatus: async () => {
    const response = await api.get('/scraping/status');
    return response.data;
  },

  startScrapingJob: async (dataSource: string) => {
    const response = await api.post('/scraping/start', { data_source: dataSource });
    return response.data;
  },
};

export default api;
