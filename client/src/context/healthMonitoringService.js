import axios from 'axios';

const API_BASE_URL = 'http://localhost:8001/api/v1';

const api = axios.create({
  baseURL: `${API_BASE_URL}/monitoring`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
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

export default api;
