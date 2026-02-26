const Availability = require('../models/Availability');

// @route   POST /api/availability/toggle
// @desc    Block or unblock a specific date
// @access  Private (Admin)
exports.toggleDate = async (req, res, next) => {
    try {
        const { date, isBlocked } = req.body;
        if (!date) {
            return res.status(400).json({ message: 'Date is required' });
        }

        // Normalize date to YYYY-MM-DD
        const targetDate = new Date(date);
        targetDate.setUTCHours(0, 0, 0, 0);

        let availability = await Availability.findOne({ date: targetDate });

        if (availability) {
            availability.isBlocked = isBlocked;
            await availability.save();
        } else {
            availability = new Availability({
                date: targetDate,
                isBlocked
            });
            await availability.save();
        }

        res.json({ message: `Date ${isBlocked ? 'blocked' : 'unblocked'} successfully`, availability });
    } catch (error) {
        next(error);
    }
};

// @route   GET /api/availability
// @desc    Get all availability records
// @access  Private (Admin)
exports.getAllAvailability = async (req, res, next) => {
    try {
        const records = await Availability.find().sort({ date: 1 });
        res.json(records);
    } catch (error) {
        next(error);
    }
};

// @route   GET /api/availability/blocked
// @desc    Get only blocked dates for public calendar
// @access  Public
exports.getBlockedDates = async (req, res, next) => {
    try {
        const blockedRecords = await Availability.find({ isBlocked: true }).select('date -_id');
        const dates = blockedRecords.map(r => r.date.toISOString().split('T')[0]);
        res.json(dates);
    } catch (error) {
        next(error);
    }
};
