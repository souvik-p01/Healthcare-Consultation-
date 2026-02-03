import React from 'react';
import { AuthProvider } from './AuthContext';
import { ApiProvider } from './ApiContext';

/**
 * Combined provider wrapper for all contexts
 * Wraps the app with AuthContext and ApiContext
 */
export const AppProviders = ({ children }) => {
  return (
    <AuthProvider>
      <ApiProvider>
        {children}
      </ApiProvider>
    </AuthProvider>
  );
};

export default AppProviders;
