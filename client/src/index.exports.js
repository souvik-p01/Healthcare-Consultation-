// Export all contexts
export { AuthProvider, useAuth } from './context/AuthContext';
export { ApiProvider, useApi } from './context/ApiContext';
export { AppProviders } from './context/AppProviders';

// Export all hooks
export {
  useApiCall,
  useDoctorApi,
  useTechnicianApi,
  useTestApi,
  useEquipmentApi,
  useNotificationApi,
  useAiApi,
  useSocket
} from './hooks/useApi';

// Export services (for direct access if needed)
export { doctorService } from './Pages/services/DoctorApi';
export { 
  technicianAPI, 
  testAPI, 
  equipmentAPI, 
  notificationAPI, 
  aiAPI,
  authAPI 
} from './Pages/services/api';
export { default as socketService } from './Pages/services/socket';
