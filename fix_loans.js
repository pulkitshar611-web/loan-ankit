const mongoose = require('mongoose');
const Loan = require('./models/Loan');
const connectDB = require('./config/db');
require('dotenv').config();

const fixLoans = async () => {
    try {
        await connectDB();
        console.log('Connected to DB');

        const badLoanId = '698ddb3edbadd1ec862da95e'; // The ID from debug output

        const result = await Loan.deleteOne({ _id: badLoanId });
        console.log(`Deleted loan ${badLoanId}:`, result);

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixLoans();
