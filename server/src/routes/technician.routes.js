const express = require('express');
const {
  getDashboard,
  getTechnicianTests,
  startTest,
  completeTest,
  getTechnicianEquipment,
  controlEquipment,
  updateProfile,
  getPerformanceMetrics
} = require('../controllers/technicianController');
const { protect, authorize } = require('../middleware/auth');
const { isTechnician } = require('../middleware/roleCheck');

const router = express.Router();

// All routes require authentication and technician role
router.use(protect);
router.use(authorize('technician'));
router.use(isTechnician);

router.get('/dashboard', getDashboard);
router.get('/tests', getTechnicianTests);
router.post('/tests/:id/start', startTest);
router.post('/tests/:id/complete', completeTest);
router.get('/equipment', getTechnicianEquipment);
router.post('/equipment/:id/control', controlEquipment);
router.put('/profile', updateProfile);
router.get('/performance', getPerformanceMetrics);

module.exports = router;