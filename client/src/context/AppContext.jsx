import React, { createContext, useState, useContext } from 'react';

// Create the context
export const AppContext = createContext();

// Create a provider component
export const AppContextProvider = ({ children }) => {
  const [showLogin, setShowLogin] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  // You can set your backend URL here or use environment variables
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

  const value = {
    showLogin,
    setShowLogin,
    backendUrl,
    token,
    setToken,
    user,
    setUser,
    showForgotPassword,
    setShowForgotPassword
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export default AppContextProvider;