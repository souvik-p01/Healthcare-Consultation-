import { Router } from 'express';
import {
  getTests,
  getTest,
  createTest,
  updateTest,
  deleteTest,
  assignTest,
  getTestStatistics
} from '../controllers/test.controller.js';
import { verifyJWT, restrictTo } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.route('/')
  .get(restrictTo('technician', 'admin', 'supervisor'), getTests)
  .post(restrictTo('technician', 'admin', 'supervisor'), createTest);

router.route('/stats')
  .get(restrictTo('technician', 'admin', 'supervisor'), getTestStatistics);

router.route('/:id')
  .get(restrictTo('technician', 'admin', 'supervisor'), getTest)
  .put(restrictTo('technician', 'admin', 'supervisor'), updateTest)
  .delete(restrictTo('admin'), deleteTest);

router.post('/:id/assign', restrictTo('admin', 'supervisor'), assignTest);

export default router;