import { useState, useCallback } from 'react';
import { useApi } from '../context/ApiContext';

export const useApiCall = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (apiFunction, ...args) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFunction(...args);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { execute, loading, error, setError };
};

/**
 * Hook for doctor-specific operations
 */
export const useDoctorApi = () => {
  const { doctor } = useApi();
  const { execute, loading, error } = useApiCall();

  return {
    getProfile: useCallback(() => execute(doctor.getProfile), [execute, doctor]),
    updateProfile: useCallback((data) => execute(doctor.updateProfile, data), [execute, doctor]),
    getDashboard: useCallback(() => execute(doctor.getDashboard), [execute, doctor]),
    getPatients: useCallback((params) => execute(doctor.getPatients, params), [execute, doctor]),
    getPatientDetails: useCallback((id) => execute(doctor.getPatientDetails, id), [execute, doctor]),
    getAppointments: useCallback((params) => execute(doctor.getAppointments, params), [execute, doctor]),
    getTodayAppointments: useCallback(() => execute(doctor.getTodayAppointments), [execute, doctor]),
    createPrescription: useCallback((data) => execute(doctor.createPrescription, data), [execute, doctor]),
    updateAvailability: useCallback((data) => execute(doctor.updateAvailability, data), [execute, doctor]),
    loading,
    error,
  };
};

/**
 * Hook for technician-specific operations
 */
export const useTechnicianApi = () => {
  const { technician } = useApi();
  const { execute, loading, error } = useApiCall();

  return {
    getDashboard: useCallback(() => execute(technician.getDashboard), [execute, technician]),
    getTests: useCallback((params) => execute(technician.getTests, params), [execute, technician]),
    startTest: useCallback((id) => execute(technician.startTest, id), [execute, technician]),
    completeTest: useCallback((id, data) => execute(technician.completeTest, id, data), [execute, technician]),
    getEquipment: useCallback(() => execute(technician.getEquipment), [execute, technician]),
    controlEquipment: useCallback((id, action, data) => 
      execute(technician.controlEquipment, id, action, data), [execute, technician]),
    updateProfile: useCallback((data) => execute(technician.updateProfile, data), [execute, technician]),
    getPerformance: useCallback(() => execute(technician.getPerformance), [execute, technician]),
    loading,
    error,
  };
};

/**
 * Hook for test operations
 */
export const useTestApi = () => {
  const { tests } = useApi();
  const { execute, loading, error } = useApiCall();

  return {
    getAll: useCallback((params) => execute(tests.getAll, params), [execute, tests]),
    getById: useCallback((id) => execute(tests.getById, id), [execute, tests]),
    create: useCallback((data) => execute(tests.create, data), [execute, tests]),
    update: useCallback((id, data) => execute(tests.update, id, data), [execute, tests]),
    delete: useCallback((id) => execute(tests.delete, id), [execute, tests]),
    assign: useCallback((id, data) => execute(tests.assign, id, data), [execute, tests]),
    getStatistics: useCallback((params) => execute(tests.getStatistics, params), [execute, tests]),
    loading,
    error,
  };
};

/**
 * Hook for equipment operations
 */
export const useEquipmentApi = () => {
  const { equipment } = useApi();
  const { execute, loading, error } = useApiCall();

  return {
    getAll: useCallback((params) => execute(equipment.getAll, params), [execute, equipment]),
    getById: useCallback((id) => execute(equipment.getById, id), [execute, equipment]),
    create: useCallback((data) => execute(equipment.create, data), [execute, equipment]),
    update: useCallback((id, data) => execute(equipment.update, id, data), [execute, equipment]),
    delete: useCallback((id) => execute(equipment.delete, id), [execute, equipment]),
    scheduleMaintenance: useCallback((id, data) => 
      execute(equipment.scheduleMaintenance, id, data), [execute, equipment]),
    completeMaintenance: useCallback((id, data) => 
      execute(equipment.completeMaintenance, id, data), [execute, equipment]),
    createAlert: useCallback((id, data) => execute(equipment.createAlert, id, data), [execute, equipment]),
    resolveAlert: useCallback((id, alertId, data) => 
      execute(equipment.resolveAlert, id, alertId, data), [execute, equipment]),
    getStatistics: useCallback(() => execute(equipment.getStatistics), [execute, equipment]),
    loading,
    error,
  };
};

/**
 * Hook for notification operations
 */
export const useNotificationApi = () => {
  const { notifications } = useApi();
  const { execute, loading, error } = useApiCall();

  return {
    getAll: useCallback((params) => execute(notifications.getAll, params), [execute, notifications]),
    markAsRead: useCallback((id) => execute(notifications.markAsRead, id), [execute, notifications]),
    markAllAsRead: useCallback(() => execute(notifications.markAllAsRead), [execute, notifications]),
    delete: useCallback((id) => execute(notifications.delete, id), [execute, notifications]),
    getStats: useCallback(() => execute(notifications.getStats), [execute, notifications]),
    loading,
    error,
  };
};

/**
 * Hook for AI operations
 */
export const useAiApi = () => {
  const { ai } = useApi();
  const { execute, loading, error } = useApiCall();

  return {
    analyzeTest: useCallback((data) => execute(ai.analyzeTest, data), [execute, ai]),
    suggestMaintenance: useCallback((data) => execute(ai.suggestMaintenance, data), [execute, ai]),
    qualityCheck: useCallback((data) => execute(ai.qualityCheck, data), [execute, ai]),
    loading,
    error,
  };
};

/**
 * Hook for socket operations
 */
export const useSocket = () => {
  const { socket } = useApi();
  return socket;
};
