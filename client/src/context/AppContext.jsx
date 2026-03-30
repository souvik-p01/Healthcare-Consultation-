import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useRef
} from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { paymentAPI } from '../Pages/services/api';

export const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useAppContext must be used within AppContextProvider');
  }

  return context;
};

const createApiClient = (backendUrl) =>
  axios.create({
    baseURL: `${backendUrl}/api/v1`,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json'
    }
  });

// Token stored only in memory — no localStorage dependency
let _memToken = null;
let _memRefreshToken = null;

const getStoredToken = () => _memToken;

const getStoredUser = () => null; // user comes from backend via getCurrentUser

const storeUser = () => {}; // no-op: user lives in React state only

const clearStoredUser = () => {}; // no-op

const storeTokens = (accessToken, refreshToken) => {
  if (accessToken) _memToken = accessToken;
  if (refreshToken) _memRefreshToken = refreshToken;
};

const clearStoredTokens = () => {
  _memToken = null;
  _memRefreshToken = null;
};

const getErrorStatus = (error) => error?.response?.status;

const getErrorMessage = (error, fallbackMessage = 'Request failed') =>
  error?.response?.data?.message || error?.message || fallbackMessage;

const isAuthError = (error) => {
  const status = getErrorStatus(error);
  return status === 401 || status === 403;
};

export const AppContextProvider = ({ children }) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  const [showLogin, setShowLogin] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [userRole, setUserRole] = useState('patient');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const apiRef = useRef(null);
  const refreshPromiseRef = useRef(null);

  if (!apiRef.current) {
    apiRef.current = createApiClient(backendUrl);
  }

  const api = apiRef.current;

  const updateUserState = useCallback((userData) => {
    setUser(userData || null);
    setUserRole(userData?.role?.toLowerCase() || 'patient');

    if (userData) {
      storeUser(userData);
    } else {
      clearStoredUser();
    }
  }, []);

  const clearAuthState = useCallback((showToast = false) => {
    setToken(null);
    updateUserState(null);
    clearStoredTokens();

    if (showToast) {
      toast.success('Logged out successfully');
    }
  }, [updateUserState]);

  const refreshAuthToken = useCallback(async () => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const storedRefreshToken = _memRefreshToken;

    refreshPromiseRef.current = axios
      .post(
        `${backendUrl}/api/v1/auth/refresh-token`,
        { refreshToken: storedRefreshToken },
        {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        }
      )
      .then((response) => {
        const accessToken = response?.data?.data?.accessToken;
        const newRefreshToken = response?.data?.data?.refreshToken;

        if (!response?.data?.success || !accessToken) {
          throw new Error('Refresh token failed');
        }

        storeTokens(accessToken, newRefreshToken);
        setToken(accessToken);

        return accessToken;
      })
      .catch((error) => {
        clearAuthState(false);
        throw error;
      })
      .finally(() => {
        refreshPromiseRef.current = null;
      });

    return refreshPromiseRef.current;
  }, [backendUrl, clearAuthState]);

  const logoutUser = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthState(true);
    }
  }, [api, clearAuthState]);

  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        const storedToken = getStoredToken();

        if (storedToken) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${storedToken}`;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = api.interceptors.response.use(
      (response) => response.data,
      async (error) => {
        const originalRequest = error.config;
        const status = getErrorStatus(error);

        if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
          return Promise.reject(
            new Error('Unable to connect to server. Please try again later.')
          );
        }

        if (
          status === 401 &&
          originalRequest &&
          !originalRequest._retry &&
          !originalRequest.url?.includes('/auth/refresh-token')
        ) {
          originalRequest._retry = true;

          try {
            const newToken = await refreshAuthToken();
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          } catch (refreshError) {
            return Promise.reject(refreshError);
          }
        }

        if (status === 401 && originalRequest?.url?.includes('/auth/refresh-token')) {
          clearAuthState(false);
        }

        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [api, clearAuthState, refreshAuthToken]);

  const apiCall = useCallback(
    async (endpoint, options = {}) => {
      const method = (options.method || 'GET').toUpperCase();

      if (method === 'POST' || method === 'PATCH' || method === 'PUT') {
        const payload = options.body
          ? typeof options.body === 'string'
            ? JSON.parse(options.body)
            : options.body
          : {};

        return api[method.toLowerCase()](endpoint, payload);
      }

      if (method === 'DELETE') {
        return api.delete(endpoint);
      }

      return api.get(endpoint);
    },
    [api]
  );

  const registerUser = async (userData) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', userData);

      if (response?.success) {
        toast.success('Account created successfully! Please login.');
      }

      return response;
    } catch (error) {
      toast.error(getErrorMessage(error, 'Registration failed'));
      throw new Error(getErrorMessage(error, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  const loginUser = async (credentials) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', credentials);

      if (!response?.success || !response?.data) {
        throw new Error('Login failed');
      }

      const { user: userData, accessToken, refreshToken } = response.data;

      storeTokens(accessToken, refreshToken);
      setToken(accessToken);
      updateUserState(userData || null);

      toast.success('Login successful!');
      return response;
    } catch (error) {
      toast.error(getErrorMessage(error, 'Login failed'));
      throw new Error(getErrorMessage(error, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async ({ credential }) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/google', { credential });

      if (!response?.success || !response?.data) {
        throw new Error('Google login failed');
      }

      const { user: userData, accessToken, refreshToken } = response.data;

      storeTokens(accessToken, refreshToken);
      setToken(accessToken);
      updateUserState(userData || null);

      toast.success('Google login successful!');
      return response;
    } catch (error) {
      console.error('Google login error:', error);
      toast.error(getErrorMessage(error, 'Google login failed'));
      throw new Error(getErrorMessage(error, 'Google login failed'));
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = useCallback(async () => refreshAuthToken(), [refreshAuthToken]);

  const getCurrentUser = useCallback(async () => {
    try {
      const response = await api.get('/users/me');

      if (!response?.success || !response?.data) {
        throw new Error('Failed to get user data');
      }

      updateUserState(response.data);
      return response.data;
    } catch (error) {
      console.error('Get current user failed:', error);
      throw error;
    }
  }, [api, updateUserState]);

  const changePassword = async (passwordData) => {
    setLoading(true);
    try {
      const response = await api.post('/users/change-password', passwordData);
      toast.success('Password changed successfully');
      return response;
    } catch (error) {
      toast.error(getErrorMessage(error, 'Password change failed'));
      throw new Error(getErrorMessage(error, 'Password change failed'));
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    setLoading(true);
    try {
      const response = await api.patch('/users/complete-profile', profileData);

      if (response?.success && response?.data) {
        updateUserState(response.data);
        toast.success('Profile updated successfully');
        return response.data;
      }

      throw new Error('Profile update failed');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Profile update failed'));
      throw new Error(getErrorMessage(error, 'Profile update failed'));
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
      toast.error(getErrorMessage(error, 'Failed to send reset link'));
      throw new Error(getErrorMessage(error, 'Failed to send reset link'));
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
      toast.error(getErrorMessage(error, 'Password reset failed'));
      throw new Error(getErrorMessage(error, 'Password reset failed'));
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (verifyToken) => {
    setLoading(true);
    try {
      const response = await api.post('/users/verify-email', { token: verifyToken });
      toast.success('Email verified successfully');
      return response;
    } catch (error) {
      toast.error(getErrorMessage(error, 'Email verification failed'));
      throw new Error(getErrorMessage(error, 'Email verification failed'));
    } finally {
      setLoading(false);
    }
  };

  const getAllDoctors = useCallback(
    async (filters = {}) => {
      try {
        const queryParams = new URLSearchParams(filters).toString();
        return await api.get(queryParams ? `/users/doctors?${queryParams}` : '/users/doctors');
      } catch (error) {
        toast.error(getErrorMessage(error, 'Failed to fetch doctors'));
        throw new Error(getErrorMessage(error, 'Failed to fetch doctors'));
      }
    },
    [api]
  );

  const getDashboardStats = useCallback(async () => {
    try {
      return await api.get('/admin/dashboard');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to fetch dashboard stats'));
      throw new Error(getErrorMessage(error, 'Failed to fetch dashboard stats'));
    }
  }, [api]);

  const getAllUsers = useCallback(
    async (filters = {}) => {
      try {
        const queryParams = new URLSearchParams(filters).toString();
        return await api.get(queryParams ? `/admin/users?${queryParams}` : '/admin/users');
      } catch (error) {
        toast.error(getErrorMessage(error, 'Failed to fetch users'));
        throw new Error(getErrorMessage(error, 'Failed to fetch users'));
      }
    },
    [api]
  );

  const createPaymentOrder = async (data) => {
    try {
      const response = await paymentAPI.createOrder(data);
      return response.data;
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to create payment order'));
      throw error;
    }
  };

  const confirmPayment = async (data) => {
    try {
      const response = await paymentAPI.confirmPayment(data);
      toast.success('Payment confirmed successfully!');
      return response.data;
    } catch (error) {
      toast.error(getErrorMessage(error, 'Payment confirmation failed'));
      throw error;
    }
  };

  const getPayments = async (params) => {
    try {
      const response = await paymentAPI.getPayments(params);
      return response.data;
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to fetch payments'));
      throw error;
    }
  };

  const checkProfileCompletion = useCallback((currentUser, role) => {
    if (!currentUser) {
      return true;
    }

    if (!currentUser.phoneNumber || !currentUser.dateOfBirth || !currentUser.gender) {
      return true;
    }

    if (role === 'doctor') {
      return (
        !currentUser.specialization ||
        !currentUser.qualification ||
        !currentUser.medicalLicense ||
        !currentUser.department
      );
    }

    return false;
  }, []);

  useEffect(() => {
    let isMounted = true;

    const verifyAuth = async () => {
      const storedToken = getStoredToken();

      if (!storedToken) {
        // Try refreshing via cookie-based refresh token
        try {
          await refreshAuthToken();
          await getCurrentUser();
        } catch {
          // Not logged in — that's fine
        } finally {
          if (isMounted) setInitialLoading(false);
        }
        return;
      }

      try {
        await getCurrentUser();
      } catch (error) {
        if (isAuthError(error)) {
          try {
            await refreshAuthToken();
            await getCurrentUser();
          } catch {
            clearAuthState(false);
          }
        } else {
          console.error('User fetch failed due to server error:', error);
        }
      } finally {
        if (isMounted) setInitialLoading(false);
      }
    };

    verifyAuth();

    return () => {
      isMounted = false;
    };
  }, [clearAuthState, getCurrentUser, refreshAuthToken, updateUserState, user]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const interval = setInterval(() => {
      refreshAuthToken().catch((error) => {
        console.error('Token refresh failed, user will need to login again:', error);
      });
    }, 14 * 60 * 1000);

    return () => clearInterval(interval);
  }, [token, refreshAuthToken]);

  const isAuthenticated = !!token && !!user;

  const value = useMemo(
    () => ({
      showLogin,
      setShowLogin,
      backendUrl,
      token,
      setToken,
      user,
      setUser: updateUserState,
      showForgotPassword,
      setShowForgotPassword,
      userRole,
      setUserRole,
      loading,
      setLoading,
      initialLoading,
      isAuthenticated,
      registerUser,
      loginUser,
      googleLogin,
      logoutUser,
      refreshToken,
      getCurrentUser,
      changePassword,
      updateProfile,
      forgotPassword,
      resetPassword,
      verifyEmail,
      getAllDoctors,
      getDashboardStats,
      getAllUsers,
      createPaymentOrder,
      confirmPayment,
      getPayments,
      apiCall,
      api,
      checkProfileCompletion
    }),
    [
      showLogin,
      backendUrl,
      token,
      user,
      showForgotPassword,
      userRole,
      loading,
      initialLoading,
      isAuthenticated,
      updateUserState,
      logoutUser,
      refreshToken,
      getCurrentUser,
      getAllDoctors,
      getDashboardStats,
      getAllUsers,
      apiCall,
      api,
      checkProfileCompletion
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContextProvider;
