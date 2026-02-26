const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide your name'],
        trim: true
    },
    role: {
        type: String,
        default: 'Client',
        trim: true
    },
    rating: {
        type: Number,
        required: [true, 'Please provide a rating'],
        min: 1,
        max: 5
    },
    text: {
        type: String,
        required: [true, 'Please provide review text'],
        trim: true
    },
    isApproved: {
        type: Boolean,
        default: false // Admin can approve before showing on landing page if needed
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Review', reviewSchema);
