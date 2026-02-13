const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All routes require authentication
router.use(auth);

// @route   GET /api/dashboard/admin/summary
router.get('/admin/summary', roleCheck('admin'), dashboardController.getAdminSummary);

// @route   GET /api/dashboard/staff/summary
router.get('/staff/summary', dashboardController.getStaffSummary);

module.exports = router;
