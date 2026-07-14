import axios from 'axios';

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  const backendEnvUrl = import.meta.env.VITE_BACKEND_URL;
  if (import.meta.env.PROD) {
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return envUrl;
    }
    if (backendEnvUrl && !backendEnvUrl.includes('localhost') && !backendEnvUrl.includes('127.0.0.1')) {
      return `${backendEnvUrl}/api/v1`;
    }
    return 'https://healthcare-backend-ltkv.onrender.com/api/v1';
  }
  if (envUrl) return envUrl;
  if (backendEnvUrl) return `${backendEnvUrl}/api/v1`;
  return 'http://localhost:8001/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: `${API_BASE_URL}/monitoring`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== HEALTH METRICS ====================

export const healthMetricsService = {
  addMetric: (data) => api.post('/metrics', data),
  getMetrics: (params) => api.get('/metrics', { params }),
  getLatestMetrics: () => api.get('/metrics/latest'),
  getMetricsTrend: (metricType, days = 7) =>
    api.get('/metrics/trend', { params: { metricType, days } })
};

// ==================== DEVICES ====================

export const deviceService = {
  addDevice: (data) => api.post('/devices', data),
  getDevices: () => api.get('/devices'),
  updateDevice: (deviceId, data) => api.put(`/devices/${deviceId}`, data),
  deleteDevice: (deviceId) => api.delete(`/devices/${deviceId}`)
};

// ==================== MEDICATIONS ====================

export const medicationService = {
  addMedication: (data) => api.post('/medications', data),
  getMedications: () => api.get('/medications'),
  toggleMedicationTaken: (medicationId) =>
    api.put(`/medications/${medicationId}/toggle`)
};

// ==================== REMINDERS ====================

export const reminderService = {
  addReminder: (data) => api.post('/reminders', data),
  getReminders: () => api.get('/reminders'),
  toggleReminder: (reminderId) =>
    api.put(`/reminders/${reminderId}/toggle`)
};

// ==================== HEALTH ALERTS ====================

export const healthAlertService = {
  addAlert: (data) => api.post('/alerts', data),
  getAlerts: () => api.get('/alerts'),
  updateAlert: (alertId, data) => api.put(`/alerts/${alertId}`, data)
};

// ==================== HEALTH GOALS ====================

export const healthGoalService = {
  addGoal: (data) => api.post('/goals', data),
  getGoals: (params) => api.get('/goals', { params }),
  updateGoal: (goalId, data) => api.put(`/goals/${goalId}`, data)
};

// ==================== HEALTH SETTINGS ====================

export const healthSettingsService = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.patch('/settings', data)
};

export default api;
