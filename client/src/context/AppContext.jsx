import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

// Create the context
export const AppContext = createContext();

// Create a provider component
export const AppContextProvider = ({ children }) => {
  const [showLogin, setShowLogin] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('accessToken'));
  const [user, setUser] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [userRole, setUserRole] = useState('patient');
  const [loading, setLoading] = useState(false);
  
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
  api.interceptors.request.use((config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Response interceptor for error handling
  api.interceptors.response.use(
    (response) => response.data,
    (error) => {
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        throw new Error('Unable to proceed now, please try after some time.');
      }
      
      const message = error.response?.data?.message || error.message || 'API request failed';
      throw new Error(message);
    }
  );

  // API Helper function
  const apiCall = async (endpoint, options = {}) => {
    try {
      if (options.method === 'POST' || options.method === 'PATCH') {
        return await api[options.method.toLowerCase()](endpoint, options.body ? JSON.parse(options.body) : {});
      } else {
        return await api.get(endpoint);
      }
    } catch (error) {
      throw error;
    }
  };

  // ✅ UPDATED: Registration function - DOES NOT set user state
  const registerUser = async (userData) => {
    setLoading(true);
    try {
      const response = await api.post('/users/register', userData);
      
      // ✅ Show success message but DON'T set user state
      // ✅ Message matches LoginSignUp.jsx
      toast.success('Account created successfully! Please login.');
      
      return response;
    } catch (error) {
      toast.error(error.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ✅ UPDATED: Login function - sets user state
  const loginUser = async (credentials) => {
    setLoading(true);
    try {
      const response = await api.post('/users/login', credentials);
      
      if (response.success && response.data) {
        const { user: userData, accessToken } = response.data;
        setToken(accessToken);
        setUser(userData);
        setUserRole(userData.role);
        localStorage.setItem('accessToken', accessToken);
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

  const checkProfileCompletion = (user, role) => {
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
      await api.post('/users/logout');
      setToken(null);
      setUser(null);
      setUserRole('patient');
      localStorage.removeItem('accessToken');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local state even if API call fails
      setToken(null);
      setUser(null);
      localStorage.removeItem('accessToken');
    }
  };

  const refreshToken = async () => {
    try {
      const response = await api.post('/users/refresh-token');
      if (response.success && response.data) {
        const { accessToken } = response.data;
        setToken(accessToken);
        localStorage.setItem('accessToken', accessToken);
        return accessToken;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      logoutUser();
      throw error;
    }
  };

  const getCurrentUser = async () => {
    try {
      const response = await api.get('/users/current');
      if (response.success && response.data) {
        setUser(response.data);
        setUserRole(response.data.role);
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
      const response = await apiCall('/users/change-password', {
        method: 'POST',
        body: JSON.stringify(passwordData)
      });
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
      const response = await apiCall('/users/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
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
      const response = await apiCall('/users/reset-password', {
        method: 'POST',
        body: JSON.stringify(resetData)
      });
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
      const response = await apiCall('/users/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token })
      });
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
      const response = await apiCall(`/users/doctors?${queryParams}`);
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch doctors');
      throw error;
    }
  };

  // Admin APIs (if user is admin)
  const getDashboardStats = async () => {
    try {
      const response = await apiCall('/admin/dashboard');
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch dashboard stats');
      throw error;
    }
  };

  const getAllUsers = async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await apiCall(`/admin/users?${queryParams}`);
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch users');
      throw error;
    }
  };

  // Initialize user on app load
  useEffect(() => {
    if (token) {
      getCurrentUser().catch(() => {
        // If getting current user fails, clear token
        setToken(null);
        localStorage.removeItem('accessToken');
      });
    }
  }, [token]);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (token) {
      const interval = setInterval(() => {
        refreshToken().catch(() => {
          console.log('Token refresh failed, user will need to login again');
        });
      }, 14 * 60 * 1000); // Refresh every 14 minutes (token expires in 15 minutes)

      return () => clearInterval(interval);
    }
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
    
    // Authentication APIs
    registerUser,
    loginUser,
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
    
    // Utility
    apiCall,
    checkProfileCompletion
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppContextProvider');
  }
  return context;
};

export default AppContextProvider;