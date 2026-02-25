const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Public route to create booking
router.post('/', bookingController.createBooking);

// Public route to get available slots
router.get('/available-slots', bookingController.getAvailableSlots);

// Protected routes (Admin only)
router.get('/', auth, roleCheck('admin'), bookingController.getBookings);
router.patch('/:id/status', auth, roleCheck('admin'), bookingController.updateBookingStatus);
router.delete('/:id', auth, roleCheck('admin'), bookingController.deleteBooking);

module.exports = router;
