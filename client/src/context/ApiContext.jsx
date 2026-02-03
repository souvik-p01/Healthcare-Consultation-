import React, { createContext, useContext, useCallback } from 'react';
import { doctorService } from '../Pages/services/DoctorApi';
import { technicianAPI, testAPI, equipmentAPI, notificationAPI, aiAPI } from '../Pages/services/api';
import socketService from '../Pages/services/socket';

const ApiContext = createContext({});

export const useApi = () => useContext(ApiContext);

export const ApiProvider = ({ children }) => {
  // Doctor API methods
  const doctor = {
    getProfile: useCallback(() => doctorService.getProfile(), []),
    updateProfile: useCallback((data) => doctorService.updateProfile(data), []),
    getDashboard: useCallback(() => doctorService.getDashboard(), []),
    getPatients: useCallback((params) => doctorService.getPatients(params), []),
    getPatientDetails: useCallback((patientId) => doctorService.getPatientDetails(patientId), []),
    getAppointments: useCallback((params) => doctorService.getAppointments(params), []),
    getTodayAppointments: useCallback(() => doctorService.getTodayAppointments(), []),
    createPrescription: useCallback((data) => doctorService.createPrescription(data), []),
    updateAvailability: useCallback((data) => doctorService.updateAvailability(data), []),
  };

  // Technician API methods
  const technician = {
    getDashboard: useCallback(() => technicianAPI.getDashboard(), []),
    getTests: useCallback((params) => technicianAPI.getTechnicianTests(params), []),
    startTest: useCallback((testId) => technicianAPI.startTest(testId), []),
    completeTest: useCallback((testId, data) => technicianAPI.completeTest(testId, data), []),
    getEquipment: useCallback(() => technicianAPI.getTechnicianEquipment(), []),
    controlEquipment: useCallback((equipmentId, action, data) => 
      technicianAPI.controlEquipment(equipmentId, action, data), []),
    updateProfile: useCallback((data) => technicianAPI.updateProfile(data), []),
    getPerformance: useCallback(() => technicianAPI.getPerformanceMetrics(), []),
  };

  // Test API methods
  const tests = {
    getAll: useCallback((params) => testAPI.getTests(params), []),
    getById: useCallback((id) => testAPI.getTest(id), []),
    create: useCallback((data) => testAPI.createTest(data), []),
    update: useCallback((id, data) => testAPI.updateTest(id, data), []),
    delete: useCallback((id) => testAPI.deleteTest(id), []),
    assign: useCallback((id, data) => testAPI.assignTest(id, data), []),
    getStatistics: useCallback((params) => testAPI.getTestStatistics(params), []),
  };

  // Equipment API methods
  const equipment = {
    getAll: useCallback((params) => equipmentAPI.getEquipment(params), []),
    getById: useCallback((id) => equipmentAPI.getEquipmentById(id), []),
    create: useCallback((data) => equipmentAPI.createEquipment(data), []),
    update: useCallback((id, data) => equipmentAPI.updateEquipment(id, data), []),
    delete: useCallback((id) => equipmentAPI.deleteEquipment(id), []),
    scheduleMaintenance: useCallback((id, data) => equipmentAPI.scheduleMaintenance(id, data), []),
    completeMaintenance: useCallback((id, data) => equipmentAPI.completeMaintenance(id, data), []),
    createAlert: useCallback((id, data) => equipmentAPI.createAlert(id, data), []),
    resolveAlert: useCallback((id, alertId, data) => equipmentAPI.resolveAlert(id, alertId, data), []),
    getStatistics: useCallback(() => equipmentAPI.getEquipmentStatistics(), []),
  };

  // Notification API methods
  const notifications = {
    getAll: useCallback((params) => notificationAPI.getNotifications(params), []),
    markAsRead: useCallback((id) => notificationAPI.markAsRead(id), []),
    markAllAsRead: useCallback(() => notificationAPI.markAllAsRead(), []),
    delete: useCallback((id) => notificationAPI.deleteNotification(id), []),
    getStats: useCallback(() => notificationAPI.getNotificationStats(), []),
  };

  // AI API methods
  const ai = {
    analyzeTest: useCallback((testData) => aiAPI.analyzeTestResults(testData), []),
    suggestMaintenance: useCallback((equipmentData) => aiAPI.suggestMaintenance(equipmentData), []),
    qualityCheck: useCallback((testResults) => aiAPI.qualityCheck(testResults), []),
  };

  // Socket methods
  const socket = {
    connect: useCallback((token) => socketService.connect(token), []),
    disconnect: useCallback(() => socketService.disconnect(), []),
    on: useCallback((event, callback) => socketService.on(event, callback), []),
    off: useCallback((event, callback) => socketService.off(event, callback), []),
    emit: useCallback((event, data) => socketService.emit(event, data), []),
  };

  const value = {
    doctor,
    technician,
    tests,
    equipment,
    notifications,
    ai,
    socket,
  };

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
};
