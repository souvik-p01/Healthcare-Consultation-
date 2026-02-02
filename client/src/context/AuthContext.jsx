import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../Pages/services/api';
import socketService from '../Pages/services/socket';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      // Connect socket with token
      socketService.connect(token);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await authAPI.login(email, password);
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      // Connect socket after login
      socketService.connect(token);
      
      return response.data;
    } catch (error) {
      setError(error.response?.data?.error || 'Login failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      socketService.disconnect();
      window.location.href = '/login';
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await authAPI.register(userData);
      const { token, user: newUser } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      
      socketService.connect(token);
      
      return response.data;
    } catch (error) {
      setError(error.response?.data?.error || 'Registration failed');
      throw error;
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.getMe();
      const updatedUser = { ...user, ...response.data.user };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Update profile error:', error);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    register,
    updateProfile,
    isAuthenticated: !!user,
    isTechnician: user?.role === 'technician',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};