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
        required: true
    },
    interestRate: {
        type: Number,
        default: 0
    },
    frequency: {
        type: String,
        enum: ['Weekly', 'Bi-Weekly', 'Monthly'],
        default: 'Monthly'
    },
    interestType: {
        type: String,
        enum: ['Installment', 'Flat'],
        default: 'Installment'
    },
    installmentAmount: {
        type: Number,
        required: true
    },
    totalInterest: {
        type: Number,
        default: 0
    },
    totalPayable: {
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
        enum: ['Active', 'Pending', 'Overdue', 'Completed'],
        default: 'Active'
    }
}, {
    timestamps: true
});

// Calculate remaining amount based on totalPayable
loanSchema.pre('save', function () {
    if (this.isModified('totalPayable') || this.isModified('totalPaid')) {
        this.remainingAmount = this.totalPayable - this.totalPaid;
    }
});

module.exports = mongoose.model('Loan', loanSchema);
