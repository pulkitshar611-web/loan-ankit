const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    loanAmount: {
        type: Number,
        required: [true, 'Loan amount is required'],
        min: 0
    },
    loanStartDate: {
        type: Date,
        required: [true, 'Loan start date is required']
    },
    tenure: {
        type: Number,
        default: 4, // months
        required: true
    },
    monthlyInstallment: {
        type: Number,
        required: true
    },
    totalPaid: {
        type: Number,
        default: 0
    },
    remainingAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['In Progress', 'Pending Approval', 'Overdue', 'Completed'],
        default: 'Pending Approval'
    }
}, {
    timestamps: true
});

// Calculate remaining amount before saving
loanSchema.pre('save', function () {
    this.remainingAmount = this.loanAmount - this.totalPaid;
});

module.exports = mongoose.model('Loan', loanSchema);
