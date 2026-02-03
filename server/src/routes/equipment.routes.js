const express = require('express');
const {
  getEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  scheduleMaintenance,
  completeMaintenance,
  createAlert,
  resolveAlert,
  getEquipmentStatistics
} = require('../controllers/equipmentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(authorize('technician', 'admin', 'supervisor'), getEquipment)
  .post(authorize('admin', 'supervisor'), createEquipment);

router.route('/stats')
  .get(authorize('technician', 'admin', 'supervisor'), getEquipmentStatistics);

router.route('/:id')
  .get(authorize('technician', 'admin', 'supervisor'), getEquipmentById)
  .put(authorize('technician', 'admin', 'supervisor'), updateEquipment)
  .delete(authorize('admin'), deleteEquipment);

router.post('/:id/maintenance', authorize('technician', 'admin', 'supervisor'), scheduleMaintenance);
router.post('/:id/maintenance/complete', authorize('technician', 'admin', 'supervisor'), completeMaintenance);
router.post('/:id/alerts', authorize('technician', 'admin', 'supervisor'), createAlert);
router.put('/:id/alerts/:alertId/resolve', authorize('technician', 'admin', 'supervisor'), resolveAlert);

module.exports = router;