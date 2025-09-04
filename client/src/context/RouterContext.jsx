import React, { createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

// Create Router Context
export const AppContext = createContext();

// Custom hook for app-specific state
export const useAppContext = () => {
  return useContext(AppContext);
};

// App Provider Component
export const AppProvider = ({ children }) => {
  const navigate = useNavigate();
  
  // Add any global state you need here
  const value = {
    // Add any global functions or state
    navigate, // You can use react-router-dom's navigate directly
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};