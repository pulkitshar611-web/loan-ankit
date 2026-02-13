const Payment = require('../models/Payment');
const Loan = require('../models/Loan');
const Client = require('../models/Client');

// @route   POST /api/payments/manual
// @desc    Record manual payment (Cash/Bank Transfer) -- Waterfall Logic
// @access  Private
exports.recordManualPayment = async (req, res, next) => {
    try {
        const { clientId, amount, paymentMode } = req.body;
        console.log(`Recording payment: Client ${clientId}, Amount ${amount}, Mode ${paymentMode}`);

        let remainingPayment = Number(amount);

        // Find the client's loan
        const loan = await Loan.findOne({ clientId });

        if (!loan) {
            return res.status(404).json({ message: 'Loan not found for this client' });
        }

        // Get all pending payments sorted by installment number
        const pendingPayments = await Payment.find({
            loanId: loan._id,
            status: 'Pending'
        }).sort({ installmentNo: 1 });

        if (pendingPayments.length === 0) {
            return res.status(400).json({ message: 'Loan is already fully paid. No pending installments found.' });
        }

        const processedPayments = [];

        for (let payment of pendingPayments) {
            if (remainingPayment <= 0) break;

            if (remainingPayment < payment.amount) {
                // PARTIAL PAYMENT
                console.log(`Partial Payment on Inst #${payment.installmentNo}: Paying ${remainingPayment} of ${payment.amount}`);

                const originalAmount = payment.amount;
                const paidAmount = remainingPayment;
                const outstandingAmount = originalAmount - paidAmount;

                // 1. Update current payment (MARK AS PAID)
                payment.amount = paidAmount;
                payment.status = 'Paid';
                payment.paidDate = new Date();
                payment.paymentMode = paymentMode || 'Cash';

                try {
                    await payment.save();
                } catch (err) {
                    console.error('Failed to save partial payment update:', err);
                    throw err; // Stop here
                }

                processedPayments.push(payment);

                // 2. Create NEW Pending payment for remainder
                const newPayment = new Payment({
                    loanId: loan._id,
                    clientId: loan.clientId,
                    installmentNo: payment.installmentNo,
                    amount: outstandingAmount,
                    dueDate: payment.dueDate,
                    status: 'Pending'
                });

                try {
                    await newPayment.save();
                    console.log(`Created new pending payment for remainder: ${outstandingAmount} (Inst #${payment.installmentNo})`);
                } catch (err) {
                    console.error('CRITICAL: Failed to create new pending payment! Rolling back partial payment...', err);
                    // Rollback: Revert the original payment to Pending and original amount
                    payment.amount = originalAmount;
                    payment.status = 'Pending';
                    payment.paidDate = undefined;
                    payment.paymentMode = undefined;
                    await payment.save();
                    throw new Error('Failed to record partial payment. Please try again.');
                }

                remainingPayment = 0;
            } else {
                // FULL PAYMENT
                console.log(`Full Payment on Inst #${payment.installmentNo}: Paying ${payment.amount}`);
                const amountToPay = payment.amount;

                payment.status = 'Paid';
                payment.paidDate = new Date();
                payment.paymentMode = paymentMode || 'Cash';
                await payment.save();
                processedPayments.push(payment);

                remainingPayment -= amountToPay;
            }
        }

        // Handle overpayment
        if (remainingPayment > 0) {
            console.log(`Overpayment detected: ${remainingPayment}`);
            const overpayment = new Payment({
                loanId: loan._id,
                clientId: loan.clientId,
                installmentNo: 99,
                amount: remainingPayment,
                dueDate: new Date(),
                paidDate: new Date(),
                status: 'Paid',
                paymentMode: paymentMode || 'Cash'
            });
            await overpayment.save();
            processedPayments.push(overpayment);
        }

        // Update loan totals
        const allPaidPayments = await Payment.find({ loanId: loan._id, status: 'Paid' });
        loan.totalPaid = allPaidPayments.reduce((sum, p) => sum + p.amount, 0);
        loan.remainingAmount = loan.loanAmount - loan.totalPaid;

        // Check if loan is completed
        if (loan.remainingAmount <= 0) {
            loan.status = 'Completed';
            await Client.findByIdAndUpdate(clientId, { status: 'Paid' });
        }

        await loan.save();
        console.log('Loan totals updated:', loan.totalPaid, loan.remainingAmount);

        res.json({
            message: 'Payment recorded successfully',
            processedPayments,
            loan
        });
    } catch (error) {
        console.error('Error in recordManualPayment:', error);
        next(error);
    }
};

// @route   POST /api/payments/stripe/webhook
// @desc    Stripe webhook for payment confirmation
// @access  Public (Stripe only)
exports.stripeWebhook = async (req, res, next) => {
    try {
        const sig = req.headers['stripe-signature'];
        // In production, verify Stripe signature here

        const { clientId, amount, transactionId } = req.body;

        // Find the client's loan
        const loan = await Loan.findOne({ clientId });

        if (!loan) {
            return res.status(404).json({ message: 'Loan not found' });
        }

        // Find next pending payment
        const payment = await Payment.findOne({
            loanId: loan._id,
            status: 'Pending'
        }).sort({ installmentNo: 1 });

        if (payment) {
            payment.status = 'Paid';
            payment.paidDate = new Date();
            payment.paymentMode = 'Stripe';
            payment.transactionId = transactionId;
            await payment.save();

            // Update loan
            loan.totalPaid += amount;
            loan.remainingAmount = loan.loanAmount - loan.totalPaid;

            if (loan.remainingAmount <= 0) {
                loan.status = 'Completed';
                await Client.findByIdAndUpdate(clientId, { status: 'Paid' });
            }

            await loan.save();
        }

        res.json({ received: true });
    } catch (error) {
        next(error);
    }
};

// @route   GET /api/payments/client/:clientId
// @desc    Get payment history for a client
// @access  Private
exports.getClientPayments = async (req, res, next) => {
    try {
        const { clientId } = req.params;

        const client = await Client.findById(clientId);

        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        // Check if staff can access this client
        if (req.user.role === 'staff' && client.assignedStaff.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const payments = await Payment.find({ clientId })
            .populate('loanId')
            .sort({ installmentNo: 1 });

        res.json({
            count: payments.length,
            payments
        });
    } catch (error) {
        next(error);
    }
};
