import axios from 'axios';

// Base URL for API requests
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.get('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/forgotpassword', { email }),
  resetPassword: (token, password) => api.put(`/auth/resetpassword/${token}`, { password }),
};

// Technician services
export const technicianAPI = {
  getDashboard: () => api.get('/technicians/dashboard'),
  getTechnicianTests: (params) => api.get('/technicians/tests', { params }),
  startTest: (testId) => api.post(`/technicians/tests/${testId}/start`),
  completeTest: (testId, data) => api.post(`/technicians/tests/${testId}/complete`, data),
  getTechnicianEquipment: () => api.get('/technicians/equipment'),
  controlEquipment: (equipmentId, action, data) => 
    api.post(`/technicians/equipment/${equipmentId}/control`, { action, ...data }),
  updateProfile: (data) => api.put('/technicians/profile', data),
  getPerformanceMetrics: () => api.get('/technicians/performance'),
};

// Test services
export const testAPI = {
  getTests: (params) => api.get('/tests', { params }),
  getTest: (id) => api.get(`/tests/${id}`),
  createTest: (data) => api.post('/tests', data),
  updateTest: (id, data) => api.put(`/tests/${id}`, data),
  deleteTest: (id) => api.delete(`/tests/${id}`),
  assignTest: (id, data) => api.post(`/tests/${id}/assign`, data),
  getTestStatistics: (params) => api.get('/tests/stats', { params }),
};

// Equipment services
export const equipmentAPI = {
  getEquipment: (params) => api.get('/equipment', { params }),
  getEquipmentById: (id) => api.get(`/equipment/${id}`),
  createEquipment: (data) => api.post('/equipment', data),
  updateEquipment: (id, data) => api.put(`/equipment/${id}`, data),
  deleteEquipment: (id) => api.delete(`/equipment/${id}`),
  scheduleMaintenance: (id, data) => api.post(`/equipment/${id}/maintenance`, data),
  completeMaintenance: (id, data) => api.post(`/equipment/${id}/maintenance/complete`, data),
  createAlert: (id, data) => api.post(`/equipment/${id}/alerts`, data),
  resolveAlert: (id, alertId, data) => 
    api.put(`/equipment/${id}/alerts/${alertId}/resolve`, data),
  getEquipmentStatistics: () => api.get('/equipment/stats'),
};

// Notification services
export const notificationAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  getNotificationStats: () => api.get('/notifications/stats'),
};

// AI Assistant services
export const aiAPI = {
  analyzeTestResults: (testData) => api.post('/ai/analyze-test', testData),
  suggestMaintenance: (equipmentData) => api.post('/ai/suggest-maintenance', equipmentData),
  qualityCheck: (testResults) => api.post('/ai/quality-check', testResults),
};

export default api;