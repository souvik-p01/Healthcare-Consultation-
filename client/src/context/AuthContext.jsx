// AuthContext is a thin wrapper that delegates to AppContext.
// No localStorage usage — all auth state lives in AppContext backed by the backend.
import { useAppContext } from './AppContext';

export const useAuth = () => {
  const {
    user,
    loading,
    isAuthenticated,
    loginUser,
    logoutUser,
    registerUser,
    updateProfile,
    getCurrentUser,
  } = useAppContext();

  return {
    user,
    loading,
    isAuthenticated,
    isDoctor: user?.role === 'doctor',
    isTechnician: user?.role === 'technician',
    isPatient: user?.role === 'patient',
    isAdmin: user?.role === 'admin',
    login: loginUser,
    logout: logoutUser,
    register: registerUser,
    updateProfile,
    refreshUserData: getCurrentUser,
  };
};
