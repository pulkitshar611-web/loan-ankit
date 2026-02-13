const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    loanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Loan'
    },
    type: {
        type: String,
        enum: ['Email', 'WhatsApp'],
        required: true
    },
    category: {
        type: String,
        enum: ['Due Soon', 'Due Today', 'Overdue', 'Manual'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Sent', 'Failed', 'Opened'],
        default: 'Sent'
    },
    sentAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
