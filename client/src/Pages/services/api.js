import axios from 'axios';

// Base URL for API requests
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api/v1` : '') ||
  (import.meta.env.PROD ? 'https://healthcare-backend-ltkv.onrender.com/api/v1' : 'http://localhost:8001/api/v1');

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send cookies for JWT auth
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
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
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth services (matches /api/v1/users/* routes used by AppContext)
export const authAPI = {
  login: (email, password) => api.post('/users/login', { email, password }),
  register: (data) => api.post('/users/register', data),
  getMe: () => api.get('/users/current'),
  logout: () => api.post('/users/logout'),
  forgotPassword: (email) => api.post('/users/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/users/reset-password', { token, newPassword: password, confirmPassword: password }),
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

// Payment services
export const paymentAPI = {
  createOrder: (data) => api.post('/payments/create-order', data),
  confirmPayment: (data) => api.post('/payments/confirm', data),
  getPayments: (params) => api.get('/payments', { params }),
  getPaymentById: (id) => api.get(`/payments/${id}`),
  processRefund: (id, data) => api.post(`/payments/${id}/refund`, data),
  getStatistics: () => api.get('/payments/statistics'),
  getPaymentMethods: () => api.get('/payments/payment-methods'),
};

// Emergency services
export const emergencyAPI = {
  getHospitals: (params) => api.get('/emergency/hospitals', { params }),
  requestAmbulance: (data) => api.post('/emergency/request-ambulance', data),
  getAmbulanceRequest: (requestId) => api.get(`/emergency/ambulance-request/${requestId}`),
  cancelAmbulanceRequest: (requestId) => api.post(`/emergency/ambulance-request/${requestId}/cancel`),
};

// Medicine services
export const medicineAPI = {
  getMedicines: (params) => api.get('/medicine', { params }),
  getPharmacies: (params) => api.get('/medicine/pharmacies', { params }),
};

// Pharmacy Order services
export const pharmacyOrderAPI = {
  getOrder: (orderId) => api.get(`/pharmacy-orders/${orderId}`),
  listOrders: (params) => api.get('/pharmacy-orders', { params }),
  updateStatus: (orderId, status, note) =>
    api.patch(`/pharmacy-orders/${orderId}/status`, { status, note }),
  getStats: () => api.get('/pharmacy-orders/stats'),
};

// Health Monitoring services
export const monitoringAPI = {
  getVitals: () => api.get('/monitoring/vitals'),
  getMetrics: (params) => api.get('/monitoring/metrics', { params }),
  addMetric: (data) => api.post('/monitoring/metrics', data),
  getWeeklyReport: () => api.get('/monitoring/weekly-report'),
  // Devices
  getDevices: () => api.get('/monitoring/devices'),
  addDevice: (data) => api.post('/monitoring/devices', data),
  updateDevice: (id, data) => api.patch(`/monitoring/devices/${id}`, data),
  deleteDevice: (id) => api.delete(`/monitoring/devices/${id}`),
  // Reminders
  getReminders: () => api.get('/monitoring/reminders'),
  addReminder: (data) => api.post('/monitoring/reminders', data),
  updateReminder: (id, data) => api.patch(`/monitoring/reminders/${id}`, data),
  deleteReminder: (id) => api.delete(`/monitoring/reminders/${id}`),
  // Goals
  getGoals: () => api.get('/monitoring/goals'),
  addGoal: (data) => api.post('/monitoring/goals', data),
  updateGoal: (id, data) => api.patch(`/monitoring/goals/${id}`, data),
  deleteGoal: (id) => api.delete(`/monitoring/goals/${id}`),
  // Alerts
  getAlerts: () => api.get('/monitoring/alerts'),
  saveAlerts: (alerts) => api.post('/monitoring/alerts', { alerts }),
  // Settings
  getSettings: () => api.get('/monitoring/settings'),
  updateSettings: (data) => api.patch('/monitoring/settings', data),
};

// Appointment services
export const appointmentAPI = {
  schedule: (data) => api.post('/patients/appointments/schedule', data),
  getPatientAppointments: (params) => api.get('/patients/appointments', { params }),
  cancel: (id, reason) => api.post(`/patients/appointments/${id}/cancel`, { cancellationReason: reason }),
  reschedule: (id, date, time) => api.post(`/patients/appointments/${id}/reschedule`, { newDate: date, newTime: time }),
  getMessages: (consultationId) => api.get(`/patients/consultations/${consultationId}/messages`),
};

export default api;