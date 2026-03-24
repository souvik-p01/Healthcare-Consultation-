import { Router } from 'express';
import { verifyJWT, restrictTo } from '../middlewares/auth.middleware.js';
import {
    getEquipment,
    getEquipmentById,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    scheduleMaintenance,
    completeMaintenance,
    createAlert,
    resolveAlert,
    getEquipmentStatistics,
} from '../controllers/equipment.controller.js';

const router = Router();

router.use(verifyJWT);

router.route('/')
    .get(restrictTo('technician', 'admin'), getEquipment)
    .post(restrictTo('admin'), createEquipment);

router.get('/stats', restrictTo('technician', 'admin'), getEquipmentStatistics);

router.route('/:id')
    .get(restrictTo('technician', 'admin'), getEquipmentById)
    .put(restrictTo('technician', 'admin'), updateEquipment)
    .delete(restrictTo('admin'), deleteEquipment);

router.post('/:id/maintenance', restrictTo('technician', 'admin'), scheduleMaintenance);
router.post('/:id/maintenance/complete', restrictTo('technician', 'admin'), completeMaintenance);
router.post('/:id/alerts', restrictTo('technician', 'admin'), createAlert);
router.put('/:id/alerts/:alertId/resolve', restrictTo('technician', 'admin'), resolveAlert);

export default router;
