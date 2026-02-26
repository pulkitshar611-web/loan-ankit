const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    subject: {
        type: String,
        required: true,
        enum: [
            'General Inquiry',
            'Immigration Consultation',
            'Document Review',
            'Interview Prep',
            'Jamaican Passport Renewal',
            'Request For Evidence (RFE)',
            'Marriage Petition Checklist',
            'I-864 Affidavit Checklist'
        ]
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['unread', 'read', 'replied'],
        default: 'unread'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Inquiry', inquirySchema);
