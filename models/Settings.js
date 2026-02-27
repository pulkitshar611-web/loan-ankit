const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        default: 'app_settings'
    },
    checklistPdfPath: {
        type: String,
        default: ''
    },
    checklistPdfOriginalName: {
        type: String,
        default: ''
    },
    checklistPdfPublicId: {
        type: String,
        default: ''
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
