const express = require('express');
const router = express.Router();
const availabilityController = require('../controllers/availabilityController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Public route to get blocked dates for calendar
router.get('/blocked', availabilityController.getBlockedDates);

// Protected routes (Admin only)
router.get('/', auth, roleCheck('admin'), availabilityController.getAllAvailability);
router.post('/toggle', auth, roleCheck('admin'), availabilityController.toggleDate);

module.exports = router;
