const Booking = require('../models/Booking');
const Availability = require('../models/Availability');

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Public
exports.createBooking = async (req, res, next) => {
    try {
        const { name, email, phone, address, date, interest, timeSlot } = req.body;

        // Check if date is blocked by admin
        const targetDate = new Date(date);
        targetDate.setUTCHours(0, 0, 0, 0);
        const availability = await Availability.findOne({ date: targetDate });
        if (availability && availability.isBlocked) {
            return res.status(400).json({ message: 'This date is not available for booking.' });
        }

        // Check if slot is already booked for the given date
        const existingBooking = await Booking.findOne({ date, timeSlot });
        if (existingBooking) {
            return res.status(400).json({ message: 'This time slot is already booked.' });
        }

        const newBooking = new Booking({
            name,
            email,
            phone,
            address,
            date,
            interest,
            timeSlot
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
// @route   GET /api/bookings/available-slots?date=...
// @desc    Get available time slots for a specific date
// @access  Public
exports.getAvailableSlots = async (req, res, next) => {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ message: 'Date is required' });
        }

        // Check if date is blocked by admin
        const targetDate = new Date(date);
        targetDate.setUTCHours(0, 0, 0, 0);
        const availability = await Availability.findOne({ date: targetDate });
        if (availability && availability.isBlocked) {
            return res.json([]); // Return no slots if date is blocked
        }

        // Define all possible slots
        const allSlots = [
            '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
            '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
            '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
            '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
        ];

        // Create start and end of day in UTC to match the stored format
        const queryDate = new Date(date);
        // Ensure we are comparing 'YYYY-MM-DD' as UTC start of day
        const startOfDay = new Date(Date.UTC(queryDate.getUTCFullYear(), queryDate.getUTCMonth(), queryDate.getUTCDate()));
        const endOfDay = new Date(startOfDay);
        endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

        // Find booked slots for this date
        const bookings = await Booking.find({
            date: { $gte: startOfDay, $lt: endOfDay },
            status: { $ne: 'Cancelled' }
        });

        const bookedSlots = bookings.map(b => b.timeSlot);
        const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

        res.json(availableSlots);
    } catch (error) {
        next(error);
    }
};

// @route   DELETE /api/bookings/:id
// @desc    Delete a booking
// @access  Private (Admin)
exports.deleteBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findByIdAndDelete(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        res.json({ message: 'Booking deleted successfully' });
    } catch (error) {
        next(error);
    }
};
