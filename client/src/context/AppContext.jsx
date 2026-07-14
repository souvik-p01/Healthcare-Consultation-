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

  // ✅ Flag to suppress the interceptor's auto-refresh during the startup verifyAuth flow
  //    so we don't get a double-refresh race condition.
  const skipInterceptorRefreshRef = React.useRef(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8001";

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

        // Server down — don't spam toasts for background/auth requests
        if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || !error.response) {
          const isBackground = originalRequest?.url?.includes('/users/current') ||
                               originalRequest?.url?.includes('/users/me') ||
                               originalRequest?.url?.includes('/auth/refresh-token');
          if (!isBackground) {
            toast.error('Server unavailable. Please check your connection.');
          }
          throw error;
        }

        // Handle token refresh on 401 errors
        // Skip refresh for auth routes to prevent loops
        const isAuthRoute = originalRequest.url.includes('/auth/');

        // ✅ Key fix: Don't auto-refresh if:
        //    1. Already retried (prevents infinite loop)
        //    2. This IS an auth route (prevents refresh-on-refresh loop)
        //    3. We're in the startup verifyAuth flow (prevents double-refresh)
        //    4. No refresh token is available (nothing to refresh with)
        const hasRefreshToken = !!localStorage.getItem('refreshToken');

        if (
          error.response?.status === 401 &&
          !originalRequest?._retry &&
          !isAuthRoute &&
          !skipInterceptorRefreshRef.current &&
          hasRefreshToken
        ) {
          originalRequest._retry = true;

          try {
            // Try to refresh the token using a clean axios call (no interceptors)
            const response = await axios.post(
              `${backendUrl}/api/v1/auth/refresh-token`,
              { refreshToken: localStorage.getItem('refreshToken') },
              {
                withCredentials: true,
                headers: {
                  'Content-Type': 'application/json',
                  'x-refresh-token': localStorage.getItem('refreshToken')
                }
              }
            );

            if (response.data?.success && response.data.data?.accessToken) {
              const newToken = response.data.data.accessToken;
              const newRefreshToken = response.data.data.refreshToken;
              localStorage.setItem('accessToken', newToken);
              if (newRefreshToken) {
                localStorage.setItem('refreshToken', newRefreshToken);
              }
              setToken(newToken);
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return instance(originalRequest);
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setToken(null);
            setUser(null);
            return Promise.reject(refreshError);
          }
        }

        const message = error.response?.data?.message || error.message || 'API request failed';

        // Don't show toast for 401/background errors
        if (error.response?.status !== 401) {
          toast.error(message);
        }

        throw error;
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
  }, [api]);

  // ✅ Login function - Memoized & Stable
  const loginUser = React.useCallback(async (credentials) => {
    if (isPendingRef.current) return;
    isPendingRef.current = true;
    setLoading(true);
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.success && response.data) {
        const { user: userData, accessToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }
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
  }, [api]);

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
  }, [api]);

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
    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (!storedRefreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      // Use clean axios instance for refresh to avoid loops
      const response = await axios.post(`${backendUrl}/api/v1/auth/refresh-token`, {
        refreshToken: storedRefreshToken
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'x-refresh-token': storedRefreshToken
        }
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

      throw new Error('Refresh response missing token data');
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }, [backendUrl]);

  const getCurrentUser = React.useCallback(async () => {
    try {
      const response = await api.get('/users/current');
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
      // Sanitize amount before sending to prevent 400 errors
      const sanitizedData = { ...data };
      if (sanitizedData.amount !== undefined) {
        const raw = sanitizedData.amount;
        if (typeof raw !== 'number') {
          const cleaned = String(raw || 0).replace(/[^0-9.]/g, '');
          sanitizedData.amount = parseFloat(cleaned) || 0;
        }
      }
      const response = await paymentAPI.createOrder(sanitizedData);
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

  // ✅ Single startup auth verification — no double-refresh, no interceptor conflicts
  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('accessToken');
      const storedRefreshToken = localStorage.getItem('refreshToken');

      // No tokens at all — user is logged out, nothing to do
      if (!storedToken && !storedRefreshToken) {
        setInitialLoading(false);
        return;
      }

      // ✅ Tell the axios interceptor NOT to auto-refresh during this flow
      //    We handle refresh ourselves below, once, explicitly.
      skipInterceptorRefreshRef.current = true;

      try {
        if (storedToken) {
          // Try fetching the current user with the existing access token
          // using a raw axios call to completely bypass our custom interceptor
          const response = await axios.get(`${backendUrl}/api/v1/users/current`, {
            withCredentials: true,
            headers: {
              'Authorization': `Bearer ${storedToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.data?.success && response.data?.data) {
            const userData = response.data.data;
            setUser(userData);
            setUserRole(userData.role?.toLowerCase() || 'patient');
            setToken(storedToken);
            setInitialLoading(false);
            return; // ✅ Happy path — token valid, user loaded
          }
        }

        // Access token missing or the above didn't return — try refresh
        throw new Error('Access token invalid or missing');

      } catch (error) {
        // If server is unreachable, keep the stored token and don't clear auth
        const isNetworkError = !error.response || error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED';
        if (isNetworkError) {
          console.warn('Server unavailable during auth check — will retry when server is up.');
          setInitialLoading(false);
          skipInterceptorRefreshRef.current = false;
          return;
        }

        // Access token was rejected (401) — attempt a single refresh if we have a refresh token
        if (storedRefreshToken) {
          console.log('Access token invalid, attempting refresh...');
          try {
            const refreshResponse = await axios.post(
              `${backendUrl}/api/v1/auth/refresh-token`,
              { refreshToken: storedRefreshToken },
              {
                withCredentials: true,
                headers: {
                  'Content-Type': 'application/json',
                  'x-refresh-token': storedRefreshToken
                }
              }
            );

            if (refreshResponse.data?.success && refreshResponse.data?.data?.accessToken) {
              const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshResponse.data.data;
              localStorage.setItem('accessToken', newAccessToken);
              if (newRefreshToken) {
                localStorage.setItem('refreshToken', newRefreshToken);
              }
              setToken(newAccessToken);

              // Fetch user with the new token
              const userResponse = await axios.get(`${backendUrl}/api/v1/users/current`, {
                withCredentials: true,
                headers: {
                  'Authorization': `Bearer ${newAccessToken}`,
                  'Content-Type': 'application/json'
                }
              });

              if (userResponse.data?.success && userResponse.data?.data) {
                const userData = userResponse.data.data;
                setUser(userData);
                setUserRole(userData.role?.toLowerCase() || 'patient');
              }
            } else {
              throw new Error('Refresh response missing token');
            }
          } catch (refreshError) {
            console.log('Refresh failed, clearing auth...', refreshError.message);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setToken(null);
            setUser(null);
            setUserRole('patient');
          }
        } else {
          // No refresh token — access token is invalid, clear everything
          console.log('No refresh token, clearing auth...');
          localStorage.removeItem('accessToken');
          setToken(null);
          setUser(null);
          setUserRole('patient');
        }
      } finally {
        // ✅ Re-enable interceptor auto-refresh for normal runtime requests
        skipInterceptorRefreshRef.current = false;
        setInitialLoading(false);
      }
    };

    verifyAuth();
  }, []); // ← empty deps: run once on mount only

  // ✅ Proactive token refresh every 14 minutes (before the 1-day expiry)
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      refreshToken().catch((err) => {
        // Silently ignore network errors — server might be temporarily down
        if (err?.code !== 'ERR_NETWORK' && err?.code !== 'ECONNREFUSED') {
          console.warn('Proactive token refresh failed:', err?.message);
        }
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