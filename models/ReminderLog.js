const mongoose = require('mongoose');

const reminderLogSchema = new mongoose.Schema({
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    type: {
        type: String,
        enum: ['email', 'whatsapp'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    sentDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Sent', 'Failed'],
        default: 'Sent'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ReminderLog', reminderLogSchema);
