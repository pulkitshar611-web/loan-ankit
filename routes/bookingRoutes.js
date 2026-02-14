const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Public route to create booking
router.post('/', bookingController.createBooking);

// Protected routes (Admin only)
router.get('/', auth, roleCheck('admin'), bookingController.getBookings);
router.patch('/:id/status', auth, roleCheck('admin'), bookingController.updateBookingStatus);

module.exports = router;
