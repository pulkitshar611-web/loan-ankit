const mongoose = require('mongoose');
const Loan = require('./models/Loan');
const Client = require('./models/Client');
const connectDB = require('./config/db');
require('dotenv').config();

const debugLoans = async () => {
    try {
        await connectDB();
        console.log('Connected to DB');

        const loans = await Loan.find().populate('clientId');

        console.log('--- LOAN DATA ---');
        loans.forEach(loan => {
            console.log(`ID: ${loan._id}`);
            console.log(`Client: ${loan.clientId ? loan.clientId.name : 'Unknown'}`);
            console.log(`Loan Amount: ${loan.loanAmount}`);
            console.log(`Status: ${loan.status}`);
            console.log('-----------------');
        });

        const totalLoanAmount = loans.reduce((sum, loan) => sum + loan.loanAmount, 0);
        console.log(`TOTAL CALCULATED LOAN AMOUNT: ${totalLoanAmount}`);

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

debugLoans();
