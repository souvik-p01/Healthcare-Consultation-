// src/context/AppContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { paymentAPI } from '../Pages/services/api'; // Verify this path is correct

// Create and export the context (for backward compatibility)
export const AppContext = createContext();

// Custom hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppContextProvider');
  }
  return context;
};

// Create a provider component
export const AppContextProvider = ({ children }) => {
  const [showLogin, setShowLogin] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('accessToken'));
  const [user, setUser] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [userRole, setUserRole] = useState('patient');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

  // Configure axios instance
  const api = axios.create({
    baseURL: `${backendUrl}/api/v1`,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Request interceptor to add auth token
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

  // Response interceptor for error handling and token refresh
  api.interceptors.response.use(
    (response) => response.data,
    async (error) => {
      const originalRequest = error.config;
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        toast.error('Unable to connect to server. Please try again later.');
        throw new Error('Unable to proceed now, please try after some time.');
      }

      // Handle token refresh on 401 errors
      if (error.response?.status === 401 && !originalRequest?._retry) {
        originalRequest._retry = true;

        try {
          // Try to refresh the token
          const response = await axios.post(
            `${backendUrl}/api/v1/auth/refresh-token`,
            {},
            { 
              withCredentials: true,
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );

          if (response.data?.success && response.data.data?.accessToken) {
            const newToken = response.data.data.accessToken;
            localStorage.setItem('accessToken', newToken);
            setToken(newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // Refresh failed, logout user
          await logoutUser();
          return Promise.reject(refreshError);
        }
      }
      
      const message = error.response?.data?.message || error.message || 'API request failed';
      
      // Don't show toast for 401 errors as they'll be handled by refresh
      if (error.response?.status !== 401) {
        toast.error(message);
      }
      
      throw new Error(message);
    }
  );

  // API Helper function
  const apiCall = async (endpoint, options = {}) => {
    try {
      if (options.method === 'POST' || options.method === 'PATCH' || options.method === 'PUT') {
        const method = options.method.toLowerCase();
        const data = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : {};
        return await api[method](endpoint, data);
      } else if (options.method === 'DELETE') {
        return await api.delete(endpoint);
      } else {
        return await api.get(endpoint);
      }
    } catch (error) {
      throw error;
    }
  };

  // ✅ Registration function - DOES NOT set user state
  const registerUser = async (userData) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.success) {
        toast.success('Account created successfully! Please login.');
      }
      
      return response;
    } catch (error) {
      toast.error(error.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ✅ Login function - sets user state
  const loginUser = async (credentials) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', credentials);
      
      if (response.success && response.data) {
        const { user: userData, accessToken } = response.data;
        
        // Save to localStorage
        localStorage.setItem('accessToken', accessToken);
        
        // Update state
        setToken(accessToken);
        setUser(userData);
        setUserRole(userData.role?.toLowerCase() || 'patient');
        
        toast.success('Login successful!');
        return response;
      }
    } catch (error) {
      toast.error(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Google Login function
  const googleLogin = async ({ credential }) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/google', { credential });
      
      if (response.success && response.data) {
        const { user: userData, accessToken, refreshToken} = response.data;
        
        // Save to localStorage
        localStorage.setItem('accessToken', accessToken);
        // Store refresh token if provided
      if (refreshToken) {
        localStorage.setItem("accessToken", accessToken);
      }
        
        // Update state
        setToken(accessToken);
        setUser(userData);
        setUserRole(userData.role?.toLowerCase() || 'patient');
        
        toast.success('Google login successful!');
        return response;
      }
    } catch (error) {
      console.error('Google login error:', error);
      toast.error(error.message || 'Google login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const checkProfileCompletion = (user, role) => {
    if (!user) return true;
    
    if (!user?.phoneNumber || !user?.dateOfBirth || !user?.gender) {
      return true;
    }
    
    if (role === 'doctor') {
      return !user?.specialization || !user?.qualification || !user?.medicalLicense || !user?.department;
    }
    
    return false;
  };

  const logoutUser = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state
      setToken(null);
      setUser(null);
      setUserRole('patient');
      localStorage.removeItem('accessToken');
      toast.success('Logged out successfully');
    }
  };

// In AppContext.jsx - Update refreshToken function

const refreshToken = async () => {
  try {
    const response = await api.post('/auth/refresh-token');
    
    if (response.success && response.data) {
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      
      // Update tokens
      localStorage.setItem('accessToken', accessToken);
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }
      
      setToken(accessToken);
      return accessToken;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw error;
  }
};

  const getCurrentUser = async () => {
    try {
      const response = await api.get('/users/me');
      if (response.success && response.data) {
        setUser(response.data);
        setUserRole(response.data.role?.toLowerCase() || 'patient');
        return response.data;
      }
    } catch (error) {
      console.error('Get current user failed:', error);
      throw error;
    }
  };

  const changePassword = async (passwordData) => {
    setLoading(true);
    try {
      const response = await api.post('/users/change-password', passwordData);
      toast.success('Password changed successfully');
      return response;
    } catch (error) {
      toast.error(error.message || 'Password change failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    setLoading(true);
    try {
      const response = await api.patch('/users/complete-profile', profileData);
      if (response.success && response.data) {
        setUser(response.data);
        setUserRole(response.data.role?.toLowerCase() || 'patient');
        toast.success('Profile updated successfully');
        return response.data;
      }
    } catch (error) {
      toast.error(error.message || 'Profile update failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    setLoading(true);
    try {
      const response = await api.post('/users/forgot-password', { email });
      toast.success('Password reset link sent to your email');
      return response;
    } catch (error) {
      toast.error(error.message || 'Failed to send reset link');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (resetData) => {
    setLoading(true);
    try {
      const response = await api.post('/users/reset-password', resetData);
      toast.success('Password reset successfully');
      return response;
    } catch (error) {
      toast.error(error.message || 'Password reset failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (token) => {
    setLoading(true);
    try {
      const response = await api.post('/users/verify-email', { token });
      toast.success('Email verified successfully');
      return response;
    } catch (error) {
      toast.error(error.message || 'Email verification failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Doctor APIs
  const getAllDoctors = async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await api.get(`/users/doctors?${queryParams}`);
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch doctors');
      throw error;
    }
  };

  // Admin APIs (if user is admin)
  const getDashboardStats = async () => {
    try {
      const response = await api.get('/admin/dashboard');
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch dashboard stats');
      throw error;
    }
  };

  const getAllUsers = async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await api.get(`/admin/users?${queryParams}`);
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch users');
      throw error;
    }
  };

  // Payment APIs
  const createPaymentOrder = async (data) => {
    try {
      const response = await paymentAPI.createOrder(data);
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create payment order');
      throw error;
    }
  };

  const confirmPayment = async (data) => {
    try {
      const response = await paymentAPI.confirmPayment(data);
      toast.success('Payment confirmed successfully!');
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment confirmation failed');
      throw error;
    }
  };

  const getPayments = async (params) => {
    try {
      const response = await paymentAPI.getPayments(params);
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch payments');
      throw error;
    }
  };

// In AppContext.jsx - Replace your verifyAuth useEffect

useEffect(() => {
  const verifyAuth = async () => {
    const storedToken = localStorage.getItem("accessToken");
    
    if (!storedToken) {
      setInitialLoading(false);
      return;
    }

    try {
      // Try to get current user with existing token
      const userData = await getCurrentUser();
      
      if (userData) {
        setUser(userData);
        setUserRole(userData.role?.toLowerCase() || 'patient');
      }
    } catch (error) {
      console.log("Token invalid, attempting refresh...");
      
      // Try to refresh the token
      try {
        const newToken = await refreshToken();
        if (newToken) {
          // If refresh successful, try getCurrentUser again
          const userData = await getCurrentUser();
          setUser(userData);
          setUserRole(userData.role?.toLowerCase() || 'patient');
        }
      } catch (refreshError) {
        console.log("Refresh failed, clearing auth...");
        // Clear all auth data
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setToken(null);
        setUser(null);
        setUserRole('patient');
      }
    } finally {
      setInitialLoading(false);
    }
  };

  verifyAuth();
}, []); // Empty dependency array - run once on mount

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!token) return;
    
    const interval = setInterval(() => {
      refreshToken().catch(() => {
        console.log('Token refresh failed, user will need to login again');
      });
    }, 14 * 60 * 1000); // 14 minutes
    
    return () => clearInterval(interval);
  }, [token]);

  const value = {
    // State
    showLogin,
    setShowLogin,
    backendUrl,
    token,
    setToken,
    user,
    setUser,
    showForgotPassword,
    setShowForgotPassword,
    userRole,
    setUserRole,
    loading,
    setLoading,
    initialLoading,
    
    // Authentication APIs
    registerUser,
    loginUser,
    googleLogin,      // ✅ ADDED: Google login function
    logoutUser,
    refreshToken,
    getCurrentUser,
    changePassword,
    updateProfile,
    forgotPassword,
    resetPassword,
    verifyEmail,
    
    // Other APIs
    getAllDoctors,
    getDashboardStats,
    getAllUsers,
    
    // Payment APIs
    createPaymentOrder,
    confirmPayment,
    getPayments,
    
    // Utility
    apiCall,
    api,
    checkProfileCompletion
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Default export for backward compatibility
export default AppContextProvider;