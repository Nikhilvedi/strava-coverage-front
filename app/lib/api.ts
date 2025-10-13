import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  timeout: 10000,
});

// Add request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  // Health check
  healthCheck: () => apiClient.get('/api/health'),
};

// Cities API endpoints  
export const citiesAPI = {
  getAll: () => apiClient.get('/api/cities/'),
  getById: (id: number) => apiClient.get(`/api/cities/${id}`),
};

// Import API endpoints
export const importAPI = {
  startImport: (userId: number) => apiClient.post(`/api/import/initial/${userId}`),
  getStatus: (userId: number) => apiClient.get(`/api/import/status/${userId}`),
};

// Detection API endpoints
export const detectionAPI = {
  autoDetect: (userId: number) => apiClient.post(`/api/detection/auto-detect/${userId}`),
};

// Coverage API endpoints
export const coverageAPI = {
  calculateAll: (userId: number) => apiClient.post(`/api/multi-coverage/calculate-all/${userId}`),
  getCityCoverage: (userId: number, cityId: number) => 
    apiClient.get(`/api/coverage/user/${userId}/city/${cityId}`),
  getSummary: (userId: number) => apiClient.get(`/api/multi-coverage/user/${userId}/summary`),
};

// Maps API endpoints
export const mapsAPI = {
  getConfig: () => apiClient.get('/api/maps/config'),
  getCities: () => apiClient.get('/api/maps/cities'),
  getCity: (cityId: number) => apiClient.get(`/api/maps/cities/${cityId}`),
  getActivities: (userId: number) => apiClient.get(`/api/maps/activities/user/${userId}`),
  getCoverage: (userId: number, cityId: number) => 
    apiClient.get(`/api/maps/coverage/user/${userId}/city/${cityId}`),
  getCityBounds: (cityId: number) => apiClient.get(`/api/maps/bounds/city/${cityId}`),
  getUserBounds: (userId: number) => apiClient.get(`/api/maps/bounds/user/${userId}`),
  getStyles: () => apiClient.get('/api/maps/styles'),
};

export default apiClient;