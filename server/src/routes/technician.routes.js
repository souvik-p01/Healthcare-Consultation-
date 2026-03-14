import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { restrictTo } from '../middlewares/auth.middleware.js';
import {
    getTechnicianDashboard,
    getTechnicianTests,
    startTest,
    completeTest,
    getTechnicianEquipment,
    controlEquipment,
    updateTechnicianProfile,
    getPerformanceMetrics,
} from '../controllers/technician.controller.js';

const router = Router();

router.use(verifyJWT);
router.use(restrictTo('technician', 'admin'));

router.get('/dashboard', getTechnicianDashboard);
router.get('/tests', getTechnicianTests);
router.post('/tests/:id/start', startTest);
router.post('/tests/:id/complete', completeTest);
router.get('/equipment', getTechnicianEquipment);
router.post('/equipment/:id/control', controlEquipment);
router.put('/profile', updateTechnicianProfile);
router.get('/performance', getPerformanceMetrics);

export default router;
