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

        const { name, email, phone, assignedStaff, loanAmount, loanStartDate, installmentFrequency } = req.body;

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

        console.log('3. Creating loan...');
        // Create loan
        const installmentsCount = installmentFrequency === 'Bi-Weekly' ? 8 : 4;
        const installmentAmount = loanAmount / installmentsCount;
        const loan = new Loan({
            clientId: client._id,
            loanAmount,
            loanStartDate,
            tenure: installmentsCount, // Now using tenure as installments count
            monthlyInstallment: installmentAmount, // Renamed in local logic but keeping model field
            remainingAmount: loanAmount,
            status: 'In Progress'
        });

        await loan.save();
        console.log('4. Loan created:', loan._id);

        console.log('5. Generating payment schedule...');
        // Generate payment schedule based on frequency
        const schedule = generateSchedule(loanAmount, loanStartDate, installmentFrequency);
        console.log('Schedule generated:', schedule);

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
        next(error);
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
exports.updateClient = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email, phone, status, loanAmount, loanStartDate } = req.body;

        const client = await Client.findById(id);

        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        // Check if staff can update this client
        if (req.user.role === 'staff' && client.assignedStaff.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Update client
        if (name) client.name = name;
        if (email) client.email = email;
        if (phone) client.phone = phone;
        if (status) client.status = status;

        await client.save();

        // Update loan if provided
        if (loanAmount || loanStartDate) {
            const loan = await Loan.findOne({ clientId: id });

            if (loan) {
                if (loanAmount) {
                    loan.loanAmount = loanAmount;
                    loan.monthlyInstallment = loanAmount / 4;
                    loan.remainingAmount = loanAmount - loan.totalPaid;
                }
                if (loanStartDate) {
                    loan.loanStartDate = loanStartDate;
                }

                await loan.save();

                // Regenerate payment schedule if loan amount changed
                if (loanAmount) {
                    await Payment.deleteMany({ loanId: loan._id, status: 'Pending' });
                    const schedule = generateSchedule(loanAmount, loan.loanStartDate);
                    const payments = schedule.map(payment => ({
                        ...payment,
                        loanId: loan._id,
                        clientId: client._id
                    }));
                    await Payment.insertMany(payments);
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
