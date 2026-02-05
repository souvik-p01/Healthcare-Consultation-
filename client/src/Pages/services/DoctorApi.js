import axios from 'axios';

// ====================
// ENVIRONMENT CONFIGURATION
// ====================

// For development - use hardcoded values or check if running in browser
const isBrowser = typeof window !== 'undefined';

// Get API URL from environment or use default
const getApiBaseUrl = () => {
    // Check if we're in development mode (React app)
    if (isBrowser) {
        // Check for environment variable (set in build process)
        if (window.__ENV && window.__ENV.REACT_APP_API_URL) {
            return window.__ENV.REACT_APP_API_URL;
        }
        
        // Check for injected config (from public/config.js)
        if (window.APP_CONFIG && window.APP_CONFIG.API_URL) {
            return window.APP_CONFIG.API_URL;
        }
        
        // Check localStorage for custom API URL (for development)
        const customApiUrl = localStorage.getItem('api_base_url');
        if (customApiUrl) {
            return customApiUrl;
        }
    }
    
    // Default development URL
    return 'http://localhost:5000/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

// Check if we're in development mode
const isDevelopment = () => {
    if (isBrowser) {
        // Check URL for localhost
        if (window.location.hostname === 'localhost' || 
            window.location.hostname === '127.0.0.1') {
            return true;
        }
        
        // Check for development flag
        if (window.__ENV && window.__ENV.NODE_ENV === 'development') {
            return true;
        }
    }
    return false;
};

const IS_DEV = isDevelopment();

// ====================
// AXIOS INSTANCE
// ====================

const doctorApi = axios.create({
    baseURL: `${API_BASE_URL}/doctors`,
    timeout: 15000, // 15 seconds timeout
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// ====================
// REQUEST INTERCEPTOR
// ====================
doctorApi.interceptors.request.use(
    (config) => {
        // Get token from localStorage
        const token = localStorage.getItem('access_token') || 
                      localStorage.getItem('doctor_token') || 
                      localStorage.getItem('token');
        
        // Add token to headers if exists
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add request ID for tracking
        config.headers['X-Request-ID'] = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Log request in development
        if (IS_DEV) {
            console.group(`📤 API Request [${config.method?.toUpperCase()}]`);
            console.log('URL:', config.url);
            console.log('Data:', config.data || '(no data)');
            console.log('Headers:', config.headers);
            console.groupEnd();
        }
        
        return config;
    },
    (error) => {
        console.error('Request Error:', error);
        return Promise.reject(error);
    }
);

// =====================
// RESPONSE INTERCEPTOR  
// =====================
doctorApi.interceptors.response.use(
    (response) => {
        // Log response in development
        if (IS_DEV) {
            console.group(`📥 API Response [${response.status}]`);
            console.log('URL:', response.config.url);
            console.log('Data:', response.data);
            console.log('Headers:', response.headers);
            console.groupEnd();
        }
        
        // Return the full response (frontend expects data in response.data)
        return response;
    },
    (error) => {
        // Log error in development
        if (IS_DEV) {
            console.group('❌ API Error');
            console.log('URL:', error.config?.url);
            console.log('Method:', error.config?.method?.toUpperCase());
            console.log('Status:', error.response?.status);
            console.log('Error Data:', error.response?.data || error.message);
            console.groupEnd();
        }
        
        // Handle specific error cases
        if (error.response) {
            switch (error.response.status) {
                case 401: // Unauthorized
                    handleUnauthorized();
                    break;
                    
                case 403: // Forbidden
                    showToast('Access denied. You do not have permission.', 'error');
                    break;
                    
                case 404: // Not Found
                    showToast('Resource not found.', 'warning');
                    break;
                    
                case 422: // Validation Error
                    handleValidationError(error.response.data);
                    break;
                    
                case 429: // Too Many Requests
                    showToast('Too many requests. Please slow down.', 'warning');
                    break;
                    
                case 500: // Server Error
                    showToast('Server error. Please try again later.', 'error');
                    break;
                    
                case 502: // Bad Gateway
                case 503: // Service Unavailable
                case 504: // Gateway Timeout
                    showToast('Service temporarily unavailable. Please try again.', 'error');
                    break;
                    
                default:
                    showToast(error.response.data?.message || 'An unexpected error occurred', 'error');
            }
        } else if (error.request) {
            // Network error - no response received
            showToast('Network error. Please check your internet connection.', 'error');
        } else {
            // Request setup error
            console.error('Request Setup Error:', error.message);
        }
        
        return Promise.reject(error);
    }
);

// ====================
// HELPER FUNCTIONS
// ====================

/**
 * Handle unauthorized errors
 */
const handleUnauthorized = () => {
    // Clear auth data
    localStorage.removeItem('access_token');
    localStorage.removeItem('doctor_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('doctor_profile');
    
    // Show message
    showToast('Session expired. Please login again.', 'warning');
    
    // Redirect to login after delay
    setTimeout(() => {
        // Check if we're already on login page
        if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login?session_expired=true';
        }
    }, 2000);
};

/**
 * Handle validation errors
 */
const handleValidationError = (errorData) => {
    if (errorData.errors && Array.isArray(errorData.errors)) {
        const errorMessages = errorData.errors.map(err => err.msg || err.message).join(', ');
        showToast(`Validation error: ${errorMessages}`, 'error');
    } else if (errorData.message) {
        showToast(errorData.message, 'error');
    }
};

/**
 * Show toast notification
 */
const showToast = (message, type = 'info') => {
    // Check if toast library is available
    if (window.toast && typeof window.toast[type] === 'function') {
        window.toast[type](message);
    } 
    // Check if notification API is available
    else if (window.Notification && window.Notification.permission === 'granted') {
        new Notification('Doctor Portal', { body: message });
    }
    // Fallback to alert
    else if (IS_DEV) {
        alert(`${type.toUpperCase()}: ${message}`);
    }
    
    // Log to console
    console.log(`[${type.toUpperCase()}] ${message}`);
};

/**
 * Get auth token
 */
export const getAuthToken = () => {
    return localStorage.getItem('access_token') || 
           localStorage.getItem('doctor_token') || 
           localStorage.getItem('token');
};

/**
 * Set auth token
 */
export const setAuthToken = (token) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('doctor_token', token);
};

/**
 * Clear auth data
 */
export const clearAuthData = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('doctor_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('doctor_profile');
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
    const token = getAuthToken();
    if (!token) return false;
    
    // Optional: Check token expiry if JWT
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp && payload.exp < Date.now() / 1000) {
            clearAuthData();
            return false;
        }
        return true;
    } catch {
        return true; // If not JWT, assume valid
    }
};

// =====================
// API SERVICE FUNCTIONS
// =====================

export const doctorService = {
    // ================
    // AUTH & PROFILE
    // ================
    getProfile: () => doctorApi.get('/profile'),
    
    updateProfile: (data) => doctorApi.patch('/profile', data),
    
    // ================
    // DASHBOARD
    // ================
    getDashboard: () => doctorApi.get('/dashboard/data'),
    
    getDashboardStats: () => doctorApi.get('/dashboard/stats'),
    
    // ================
    // PATIENTS
    // ================
    getPatients: (params = {}) => {
        const defaultParams = { 
            page: 1, 
            limit: 10, 
            sort: 'lastVisit',
            order: 'desc',
            ...params 
        };
        return doctorApi.get('/patients', { params: defaultParams });
    },
    
    searchPatients: (query) => doctorApi.get('/patients/search', { 
        params: { q: query } 
    }),
    
    getPatientDetails: (patientId) => doctorApi.get(`/patients/${patientId}`),
    
    getPatientHistory: (patientId, params = {}) => 
        doctorApi.get(`/patients/${patientId}/medical-history`, { params }),
    
    // ================
    // APPOINTMENTS
    // ================
    getAppointments: (params = {}) => {
        const defaultParams = { 
            page: 1, 
            limit: 20, 
            status: 'scheduled,confirmed',
            sort: 'appointmentDate',
            order: 'asc',
            ...params 
        };
        return doctorApi.get('/appointments', { params: defaultParams });
    },
    
    getTodayAppointments: () => doctorApi.get('/appointments/today'),
    
    getUpcomingAppointments: (days = 7) => 
        doctorApi.get('/appointments/upcoming', { params: { days } }),
    
    updateAppointment: (appointmentId, data) => 
        doctorApi.patch(`/appointments/${appointmentId}`, data),
    
    cancelAppointment: (appointmentId, reason) => 
        doctorApi.patch(`/appointments/${appointmentId}/cancel`, { reason }),
    
    // ================
    // SCHEDULE
    // ================
    getSchedule: () => doctorApi.get('/schedule'),
    
    updateSchedule: (scheduleData) => doctorApi.patch('/schedule', scheduleData),
    
    updateAvailability: (availabilityData) => 
        doctorApi.patch('/availability', availabilityData),
    
    // ================
    // PRESCRIPTIONS
    // ================
    createPrescription: (data) => doctorApi.post('/prescriptions', data),
    
    getPrescriptions: (patientId) => 
        doctorApi.get('/prescriptions', { params: { patientId } }),
    
    // ================
    // MEDICAL RECORDS
    // ================
    createMedicalRecord: (data) => doctorApi.post('/medical-records', data),
    
    getMedicalRecords: (patientId, params = {}) => 
        doctorApi.get('/medical-records', { 
            params: { patientId, ...params } 
        }),
    
    // ================
    // FILE UPLOADS
    // ================
    uploadDocument: (formData, onProgress) => 
        doctorApi.post('/documents/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: onProgress
        }),
    
    // ================
    // NOTIFICATIONS
    // ================
    getNotifications: () => doctorApi.get('/notifications'),
    
    markNotificationRead: (notificationId) => 
        doctorApi.patch(`/notifications/${notificationId}/read`),
    
    markAllNotificationsRead: () => 
        doctorApi.patch('/notifications/read-all'),
    
    // ================
    // STATISTICS
    // ================
    getStatistics: (period = 'month') => 
        doctorApi.get('/statistics', { params: { period } }),
    
    // ================
    // UTILITIES
    // ================
    /**
     * Test API connection
     */
    testConnection: () => doctorApi.get('/health'),
    
    /**
     * Get API configuration
     */
    getConfig: () => ({
        baseURL: API_BASE_URL,
        isDevelopment: IS_DEV,
        timestamp: new Date().toISOString()
    }),
    
    /**
     * Set custom API URL (for development)
     */
    setCustomApiUrl: (url) => {
        if (IS_DEV) {
            localStorage.setItem('api_base_url', url);
            window.location.reload();
        }
    }
};

// =====================
// REACT HOOKS
// =====================

/**
 * Custom hook for API calls with loading/error states
 * Note: This is a pattern, actual implementation depends on React setup
 */
export const createApiHook = (apiFunction) => {
    return (params) => {
        // This is a pattern - in real use, you'd use React hooks
        return {
            call: async (...args) => {
                try {
                    const response = await apiFunction(...args);
                    return response.data;
                } catch (error) {
                    throw error;
                }
            }
        };
    };
};

/**
 * Hook for fetching dashboard data
 */
export const useDashboardData = () => {
    return {
        fetch: async () => {
            try {
                const [dashboardRes, appointmentsRes] = await Promise.all([
                    doctorService.getDashboard(),
                    doctorService.getTodayAppointments()
                ]);
                
                return {
                    dashboard: dashboardRes.data,
                    appointments: appointmentsRes.data
                };
            } catch (error) {
                throw error;
            }
        }
    };
};

export default doctorApi;