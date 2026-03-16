// src/main.jsx (without StrictMode)
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AppContextProvider } from './context/AppContext.jsx';
import App from './App.jsx';
import './index.css';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={googleClientId}>
    <BrowserRouter>
      <AppContextProvider>
        <App />
      </AppContextProvider>
    </BrowserRouter>
  </GoogleOAuthProvider>
);