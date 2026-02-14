const Booking = require('../models/Booking');

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Public
exports.createBooking = async (req, res, next) => {
    try {
        const { name, email, phone, date, interest } = req.body;

        const newBooking = new Booking({
            name,
            email,
            phone,
            date,
            interest
        });

        await newBooking.save();

        res.status(201).json({
            message: 'Booking request submitted successfully',
            booking: newBooking
        });
    } catch (error) {
        next(error);
    }
};

// @route   GET /api/bookings
// @desc    Get all bookings (Admin only)
// @access  Private (Admin)
exports.getBookings = async (req, res, next) => {
    try {
        const bookings = await Booking.find().sort({ date: 1 }); // Sort by date ascending (soonest first)
        res.json(bookings);
    } catch (error) {
        next(error);
    }
};

// @route   PATCH /api/bookings/:id/status
// @desc    Update booking status
// @access  Private (Admin)
exports.updateBookingStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        res.json(booking);
    } catch (error) {
        next(error);
    }
};
