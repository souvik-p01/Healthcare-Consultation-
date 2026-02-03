const express = require('express');
const {
  getTests,
  getTest,
  createTest,
  updateTest,
  deleteTest,
  assignTest,
  getTestStatistics
} = require('../controllers/testController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(authorize('technician', 'admin', 'supervisor'), getTests)
  .post(authorize('technician', 'admin', 'supervisor'), createTest);

router.route('/stats')
  .get(authorize('technician', 'admin', 'supervisor'), getTestStatistics);

router.route('/:id')
  .get(authorize('technician', 'admin', 'supervisor'), getTest)
  .put(authorize('technician', 'admin', 'supervisor'), updateTest)
  .delete(authorize('admin'), deleteTest);

router.post('/:id/assign', authorize('admin', 'supervisor'), assignTest);

module.exports = router;