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

  // ✅ Use ref for stable loading guard (prevents concurrent calls even before state updates)
  const isPendingRef = React.useRef(false);

  useEffect(() => {
    console.log("AppContextProvider mounted");
  }, []);
  
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

  // ✅ Configure axios instance with useMemo to keep reference stable
  const api = React.useMemo(() => {
    const instance = axios.create({
      baseURL: `${backendUrl}/api/v1`,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor to add auth token
    instance.interceptors.request.use(
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
    instance.interceptors.response.use(
      (response) => response.data,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
          toast.error('Unable to connect to server. Please try again later.');
          throw new Error('Unable to proceed now, please try after some time.');
        }

        // Handle token refresh on 401 errors
        // Skip refresh for auth routes to prevent loops
        const isAuthRoute = originalRequest.url.includes('/auth/');
        
        if (error.response?.status === 401 && !originalRequest?._retry && !isAuthRoute) {
          originalRequest._retry = true;

          try {
            // Try to refresh the token using a clean axios call (no interceptors)
            const response = await axios.post(
              `${backendUrl}/api/v1/auth/refresh-token`,
              {},
              { 
                withCredentials: true,
                headers: { 'Content-Type': 'application/json' }
              }
            );

            if (response.data?.success && response.data.data?.accessToken) {
              const newToken = response.data.data.accessToken;
              localStorage.setItem('accessToken', newToken);
              setToken(newToken);
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return instance(originalRequest);
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            // Don't call logoutUser here to avoid potential recursion
            localStorage.removeItem('accessToken');
            setToken(null);
            setUser(null);
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

    return instance;
  }, [backendUrl]);

  // ✅ API Helper function - Memoized
  const apiCall = React.useCallback(async (endpoint, options = {}) => {
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
  }, [api]);

  // ✅ Registration function - Memoized & Stable
  const registerUser = React.useCallback(async (userData) => {
    if (isPendingRef.current) return;
    isPendingRef.current = true;
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
      isPendingRef.current = false;
    }
  }, [api]); // ✅ Removed 'loading' dependency

  // ✅ Login function - Memoized & Stable
  const loginUser = React.useCallback(async (credentials) => {
    if (isPendingRef.current) return;
    isPendingRef.current = true;
    setLoading(true);
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.success && response.data) {
        const { user: userData, accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
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
      isPendingRef.current = false;
    }
  }, [api]); // ✅ Removed 'loading' dependency

  // ✅ Google Login function - Memoized & Stable
  const googleLogin = React.useCallback(async ({ credential }) => {
    if (isPendingRef.current) return; // ✅ Guard against double calls using ref
    isPendingRef.current = true;
    setLoading(true);
    try {
      const response = await api.post('/auth/google', { credential });
      
      if (response.success && response.data) {
        const { user: userData, accessToken, refreshToken: newRefreshToken } = response.data;
        
        localStorage.setItem('accessToken', accessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }
        
        setToken(accessToken);
        setUser(userData);
        setUserRole(userData.role?.toLowerCase() || 'patient');
        
        toast.success('Google login successful!');
        return response;
      }
    } catch (error) {
      console.error('Google login error:', error);
      if (error.message !== 'canceled') {
        toast.error(error.message || 'Google login failed');
      }
      throw error;
    } finally {
      setLoading(false);
      isPendingRef.current = false;
    }
  }, [api]); // ✅ Removed 'loading' dependency

  const logoutUser = React.useCallback(async () => {
    try {
      // Use basic axios for logout to avoid interceptor complexity
      await axios.post(`${backendUrl}/api/v1/auth/logout`, {}, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setToken(null);
      setUser(null);
      setUserRole('patient');
      toast.success('Logged out successfully');
    }
  }, [backendUrl]);

  const refreshToken = React.useCallback(async () => {
    try {
      // Use clean axios instance for refresh to avoid loops
      const response = await axios.post(`${backendUrl}/api/v1/auth/refresh-token`, {}, {
        withCredentials: true
      });
      
      if (response.data?.success && response.data.data) {
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
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
  }, [backendUrl]);

  const getCurrentUser = React.useCallback(async () => {
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
  }, [api]);

  const changePassword = React.useCallback(async (passwordData) => {
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
  }, [api]);

  const updateProfile = React.useCallback(async (profileData) => {
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
  }, [api]);

  const forgotPassword = React.useCallback(async (email) => {
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
  }, [api]);

  const resetPassword = React.useCallback(async (resetData) => {
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
  }, [api]);

  const verifyEmail = React.useCallback(async (token) => {
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
  }, [api]);

  // Doctor APIs
  const getAllDoctors = React.useCallback(async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await api.get(`/users/doctors?${queryParams}`);
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch doctors');
      throw error;
    }
  }, [api]);

  // Admin APIs
  const getDashboardStats = React.useCallback(async () => {
    try {
      const response = await api.get('/admin/dashboard');
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch dashboard stats');
      throw error;
    }
  }, [api]);

  const getAllUsers = React.useCallback(async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await api.get(`/admin/users?${queryParams}`);
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch users');
      throw error;
    }
  }, [api]);

  // Payment APIs
  const createPaymentOrder = React.useCallback(async (data) => {
    try {
      const response = await paymentAPI.createOrder(data);
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create payment order');
      throw error;
    }
  }, []);

  const confirmPayment = React.useCallback(async (data) => {
    try {
      const response = await paymentAPI.confirmPayment(data);
      toast.success('Payment confirmed successfully!');
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment confirmation failed');
      throw error;
    }
  }, []);

  const getPayments = React.useCallback(async (params) => {
    try {
      const response = await paymentAPI.getPayments(params);
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch payments');
      throw error;
    }
  }, []);

  const checkProfileCompletion = React.useCallback((user, role) => {
    if (!user) return true;
    if (!user?.phoneNumber || !user?.dateOfBirth || !user?.gender) return true;
    if (role === 'doctor') {
      return !user?.specialization || !user?.qualification || !user?.medicalLicense || !user?.department;
    }
    return false;
  }, []);

  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem("accessToken");
      if (!storedToken) {
        setInitialLoading(false);
        return;
      }

      try {
        const userData = await getCurrentUser();
        if (userData) {
          setUser(userData);
          setUserRole(userData.role?.toLowerCase() || 'patient');
        }
      } catch (error) {
        console.log("Token invalid, attempting refresh...");
        try {
          const newToken = await refreshToken();
          if (newToken) {
            const userData = await getCurrentUser();
            setUser(userData);
            setUserRole(userData.role?.toLowerCase() || 'patient');
          }
        } catch (refreshError) {
          console.log("Refresh failed, clearing auth...");
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
  }, [getCurrentUser, refreshToken]);

  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      refreshToken().catch(() => {
        console.log('Token refresh failed');
      });
    }, 14 * 60 * 1000);
    return () => clearInterval(interval);
  }, [token, refreshToken]);

  const value = {
    showLogin, setShowLogin,
    backendUrl,
    token, setToken,
    user, setUser,
    showForgotPassword, setShowForgotPassword,
    userRole, setUserRole,
    loading, setLoading,
    initialLoading,
    registerUser, loginUser, googleLogin, logoutUser,
    refreshToken, getCurrentUser, changePassword, updateProfile,
    forgotPassword, resetPassword, verifyEmail,
    getAllDoctors, getDashboardStats, getAllUsers,
    createPaymentOrder, confirmPayment, getPayments,
    apiCall, api, checkProfileCompletion
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;