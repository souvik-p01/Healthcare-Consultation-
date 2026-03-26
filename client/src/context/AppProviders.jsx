import React from 'react';
import { ApiProvider } from './ApiContext';

export const AppProviders = ({ children }) => {
  return (
    <ApiProvider>
      {children}
    </ApiProvider>
  );
};

export default AppProviders;
