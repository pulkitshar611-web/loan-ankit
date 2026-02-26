const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        unique: true
    },
    isBlocked: {
        type: Boolean,
        default: true
    },
    // Optional: targeted slot blocking
    blockedSlots: [{
        type: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Availability', availabilitySchema);
