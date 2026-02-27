const Client = require('../models/Client');
const Loan = require('../models/Loan');
const Payment = require('../models/Payment');
const generateSchedule = require('../utils/generateSchedule');

// @route   POST /api/clients
// @desc    Create client with loan and auto-generate payment schedule
// @access  Private
exports.createClient = async (req, res, next) => {
    try {
        console.log('=== CREATE CLIENT REQUEST ===');
        console.log('Request body:', req.body);

        const { name, email, phone, assignedStaff, loanAmount, loanStartDate, installmentFrequency, interestRate = 0 } = req.body;

        console.log('1. Creating client...');
        // Create client
        const client = new Client({
            name,
            email,
            phone,
            assignedStaff,
            status: 'Active'
        });

        await client.save();
        console.log('2. Client created:', client._id);

        console.log('3. Calculating loan details...');
        // Calculate Loan Details
        let installmentsCount;
        let frequency = installmentFrequency || 'Weekly';

        // Use explicit loanDuration if provided, otherwise fallback to defaults
        if (req.body.loanDuration) {
            const weeks = parseInt(req.body.loanDuration);
            switch (frequency) {
                case 'Weekly': installmentsCount = weeks; break;
                case 'Bi-Weekly': installmentsCount = Math.floor(weeks / 2); break;
                case 'Monthly': installmentsCount = Math.floor(weeks / 4); break;
                default: installmentsCount = weeks;
            }
        } else {
            switch (frequency) {
                case 'Weekly': installmentsCount = 16; break;
                case 'Bi-Weekly': installmentsCount = 8; break;
                case 'Monthly': default: installmentsCount = 4; break;
            }
        }

        const principal = parseFloat(loanAmount);
        const rate = parseFloat(interestRate);
        const interestType = req.body.interestType || 'Installment';

        let totalInterest = 0;
        if (interestType === 'Flat') {
            totalInterest = principal * (rate / 100);
        } else {
            // Interest rate applies per installment period
            totalInterest = principal * (rate / 100) * installmentsCount;
        }

        const totalPayable = principal + totalInterest;
        const installmentAmount = totalPayable / installmentsCount;

        console.log(`Loan Amount: ${principal}, Rate: ${rate}%, Type: ${interestType}, Installments: ${installmentsCount}`);
        console.log(`Total Int: ${totalInterest}, Payable: ${totalPayable}, EMI: ${installmentAmount}`);

        // Create loan
        const loan = new Loan({
            clientId: client._id,
            loanAmount: principal,
            loanStartDate,
            tenure: installmentsCount,
            interestRate: rate,
            frequency: frequency,
            interestType: interestType,
            installmentAmount: parseFloat(installmentAmount.toFixed(2)),
            totalInterest: parseFloat(totalInterest.toFixed(2)),
            totalPayable: parseFloat(totalPayable.toFixed(2)),
            totalPaid: 0,
            remainingAmount: parseFloat(totalPayable.toFixed(2)),
            status: 'Active'
        });

        await loan.save();
        console.log('4. Loan created:', loan._id);

        console.log('5. Generating payment schedule...');
        // Generate payment schedule based on frequency and exact tenure
        const schedule = generateSchedule(totalPayable, loanStartDate, frequency, installmentsCount);
        console.log(`Schedule generated: ${schedule.length} installments`);

        const payments = schedule.map(payment => ({
            ...payment,
            loanId: loan._id,
            clientId: client._id
        }));

        console.log('6. Inserting payments...');
        await Payment.insertMany(payments);
        console.log('7. Payments inserted successfully');

        res.status(201).json({
            message: 'Client created successfully with loan and payment schedule',
            client,
            loan,
            payments
        });
    } catch (error) {
        console.error('ERROR in createClient:', error);
        res.status(500).json({
            message: error.message || 'Failed to create client',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// @route   GET /api/clients
// @desc    Get all clients (role-based filtering)
// @access  Private
exports.getAllClients = async (req, res, next) => {
    try {
        let query = {};

        // Staff can only see assigned clients
        if (req.user.role === 'staff') {
            query.assignedStaff = req.user.id;
        }

        const clients = await Client.find(query)
            .populate('assignedStaff', 'name email')
            .sort({ createdAt: -1 });

        // Get loan details for each client
        const clientsWithLoans = await Promise.all(
            clients.map(async (client) => {
                const loan = await Loan.findOne({ clientId: client._id });
                const payments = await Payment.find({ clientId: client._id }).sort({ dueDate: 1 });

                // Calculate nextDue
                const nextPayment = payments.find(p => p.status === 'Pending' || p.status === 'Overdue');

                let nextDue = '-';
                if (nextPayment) {
                    nextDue = new Date(nextPayment.dueDate).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric'
                    }); // e.g., 15 Oct 2023
                } else if (loan && loan.status === 'Completed') {
                    nextDue = 'All Paid';
                }

                return {
                    ...client.toObject(),
                    loan,
                    payments,
                    nextDue
                };
            })
        );

        res.json({
            count: clientsWithLoans.length,
            clients: clientsWithLoans
        });
    } catch (error) {
        next(error);
    }
};

// @route   GET /api/clients/:id
// @desc    Get client profile with loan and payment details
// @access  Private
exports.getClientById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const client = await Client.findById(id).populate('assignedStaff', 'name email');

        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        // Check if staff can access this client
        if (req.user.role === 'staff' && client.assignedStaff._id.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const loan = await Loan.findOne({ clientId: id });
        const payments = await Payment.find({ clientId: id }).sort({ installmentNo: 1 });

        res.json({
            client,
            loan,
            payments
        });
    } catch (error) {
        next(error);
    }
};

// @route   PUT /api/clients/:id
// @desc    Update client and loan details
// @access  Private
// @route   PUT /api/clients/:id
// @desc    Update client and loan details
// @access  Private
exports.updateClient = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email, phone, status, loanAmount, loanStartDate, interestRate, installmentFrequency } = req.body;

        const client = await Client.findById(id);

        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        // Check if staff can update this client
        if (req.user.role === 'staff' && client.assignedStaff.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Update client details
        if (name) client.name = name;
        if (email) client.email = email;
        if (phone) client.phone = phone;
        if (status) client.status = status;

        await client.save();

        // Update loan if any financial details provided
        if (loanAmount || loanStartDate || interestRate !== undefined || installmentFrequency) {
            const loan = await Loan.findOne({ clientId: id });

            if (loan) {
                let shouldRecalculate = false;

                // Update basic fields
                if (loanStartDate) {
                    loan.loanStartDate = loanStartDate;
                    shouldRecalculate = true; // Date change affects schedule dates
                }

                // Determine new values or keep existing
                const newPrincipal = loanAmount ? parseFloat(loanAmount) : loan.loanAmount;
                const newRate = interestRate !== undefined ? parseFloat(interestRate) : (loan.interestRate || 0);
                const newFrequency = installmentFrequency || loan.frequency || 'Monthly';

                // Check if recalculation is needed
                if (loanAmount || interestRate !== undefined || installmentFrequency || req.body.interestType) {
                    shouldRecalculate = true;

                    let installmentsCount;
                    switch (newFrequency) {
                        case 'Weekly': installmentsCount = 16; break;
                        case 'Bi-Weekly': installmentsCount = 8; break;
                        case 'Monthly': default: installmentsCount = 4; break;
                    }

                    const newInterestType = req.body.interestType || loan.interestType || 'Installment';

                    // Calculate new financial details
                    let totalInterest = 0;
                    if (newInterestType === 'Flat') {
                        totalInterest = newPrincipal * (newRate / 100);
                    } else {
                        // Interest rate applies per installment period
                        totalInterest = newPrincipal * (newRate / 100) * installmentsCount;
                    }

                    const totalPayable = newPrincipal + totalInterest;
                    const installmentAmount = totalPayable / installmentsCount;

                    // Update loan model
                    loan.loanAmount = newPrincipal;
                    loan.interestRate = newRate;
                    loan.frequency = newFrequency;
                    loan.interestType = newInterestType;
                    loan.tenure = installmentsCount;
                    loan.installmentAmount = parseFloat(installmentAmount.toFixed(2));
                    loan.totalInterest = parseFloat(totalInterest.toFixed(2));
                    loan.totalPayable = parseFloat(totalPayable.toFixed(2));

                    // Update remaining amount logic
                    loan.remainingAmount = parseFloat((totalPayable - loan.totalPaid).toFixed(2));
                }

                await loan.save();

                // Regenerate payment schedule if financial parameters changed
                if (shouldRecalculate) {
                    // Delete PENDING payments only. Keep Paid/Overdue? 
                    // If we change loan structure, existing paid installments might not match.
                    // For now, let's delete PENDING and regenerate from start date? 
                    // Or regenerate future payments?
                    // Implementation Plan says "Regenerate payment schedule". 
                    // Simplest approach: Delete all pending and non-paid, and recreate sufficient installments to cover remaining?
                    // Actually, `generateSchedule` generates the whole schedule. 
                    // If we have paid installments, we should keep them and only generate remaining?
                    // Use case: User made a mistake in entry. They want to fix it.
                    // We should probably wipe pending payments and regenerate the schedule.
                    // But if some are already paid, we can't change history easily.
                    // Lets stick to the previous logic: Cancel Pending, Generate New from Start Date?
                    // Or better: Generate full schedule, then mark existing paid ones as paid?
                    // Previous logic: `await Payment.deleteMany({ loanId: loan._id, status: 'Pending' });`

                    await Payment.deleteMany({ loanId: loan._id, status: 'Pending' });

                    // We need to know how many installments are left or if we are resetting the whole thing.
                    // If we assume this is for "fixing data", we can regenerate the whole schedule if nothing is paid yet.
                    // If something is paid, it's tricky. 
                    // For this scope ("Editable anytime"), let's assume we regenerate the full schedule and reconcile?
                    // Or just regenerate pending ones?
                    // Previous logic: `const schedule = generateSchedule(loanAmount, loan.loanStartDate);` 
                    // This generates from start date.

                    const schedule = generateSchedule(loan.totalPayable, loan.loanStartDate, loan.frequency);

                    // Filter out installments that match currently paid/overdue ones?
                    // Or just insert all and let user handle duplicates? No.
                    // Let's perform a smart update:
                    // 1. Get existing non-pending payments.
                    // 2. If any exist, we might have a conflict.
                    // 3. Simple approach: Delete Pending. Generate all. Filter out those with installmentNo <= max existing installmentNo?

                    const existingPayments = await Payment.find({ loanId: loan._id, status: { $ne: 'Pending' } });
                    const maxPaidInstallment = existingPayments.reduce((max, p) => Math.max(max, p.installmentNo), 0);

                    const newPayments = schedule
                        .filter(p => p.installmentNo > maxPaidInstallment) // Only future installments
                        .map(payment => ({
                            ...payment,
                            loanId: loan._id,
                            clientId: client._id
                        }));

                    if (newPayments.length > 0) {
                        await Payment.insertMany(newPayments);
                    }
                }
            }
        }

        res.json({
            message: 'Client updated successfully',
            client
        });
    } catch (error) {
        next(error);
    }
};

// @route   DELETE /api/clients/:id
// @desc    Delete client (Admin only)
// @access  Private/Admin
exports.deleteClient = async (req, res, next) => {
    try {
        const { id } = req.params;

        const client = await Client.findById(id);

        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        // Delete associated loan and payments
        await Loan.deleteMany({ clientId: id });
        await Payment.deleteMany({ clientId: id });
        await client.deleteOne();

        res.json({ message: 'Client and associated data deleted successfully' });
    } catch (error) {
        next(error);
    }
};
