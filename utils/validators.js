const { body, param, validationResult } = require('express-validator');

// Validation middleware to check for errors
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    if (typeof next === 'function') {
        next();
    } else {
        console.error('ERROR: next is not a function in validate middleware');
        res.status(500).json({ message: 'Internal server error in validation' });
    }
};

// Login validation
const validateLogin = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validate
];

// User creation validation
const validateUserCreate = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['admin', 'staff']).withMessage('Invalid role'),
    validate
];

// Client creation validation
const validateClientCreate = [
    body('name').trim().notEmpty().withMessage('Client name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('loanAmount').isNumeric().withMessage('Loan amount must be a number'),
    body('loanStartDate').isISO8601().withMessage('Valid start date is required'),
    body('assignedStaff').notEmpty().withMessage('Assigned staff is required'),
    validate
];

// Payment validation
const validatePayment = [
    body('clientId').notEmpty().withMessage('Client ID is required'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('paymentMode').isIn(['Cash', 'Bank Transfer', 'Stripe']).withMessage('Invalid payment mode'),
    validate
];

module.exports = {
    validateLogin,
    validateUserCreate,
    validateClientCreate,
    validatePayment
};
