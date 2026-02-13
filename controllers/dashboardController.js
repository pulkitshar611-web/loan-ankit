const Client = require('../models/Client');
const Loan = require('../models/Loan');
const Payment = require('../models/Payment');

// @route   GET /api/dashboard/admin/summary
// @desc    Get admin dashboard summary
// @access  Private/Admin
exports.getAdminSummary = async (req, res, next) => {
    try {
        // Total clients
        const totalClients = await Client.countDocuments();

        // Total Staff
        const totalStaff = await require('../models/User').countDocuments({ role: 'staff' });

        // Total loans and amounts
        const loans = await Loan.find();
        const totalLoanAmount = loans.reduce((sum, loan) => sum + loan.loanAmount, 0);
        const totalCollected = loans.reduce((sum, loan) => sum + loan.totalPaid, 0);
        const totalPending = loans.reduce((sum, loan) => sum + loan.remainingAmount, 0);

        // Overdue payments
        const today = new Date();
        const overduePayments = await Payment.find({
            status: 'Pending',
            dueDate: { $lt: today }
        });
        const totalOverdue = overduePayments.reduce((sum, payment) => sum + payment.amount, 0);

        // Active loans
        const activeLoans = await Loan.countDocuments({ status: 'In Progress' });

        // Completed loans
        const completedLoans = await Loan.countDocuments({ status: 'Completed' });

        // --- Team Performance (Based on Collections) ---
        // 1. Get all payments
        const allPayments = await Payment.find().populate({
            path: 'clientId',
            select: 'assignedStaff',
            populate: { path: 'assignedStaff', select: 'name' }
        });

        // 2. Aggregate per staff
        const staffPerformance = {};
        allPayments.forEach(payment => {
            const staff = payment.clientId?.assignedStaff;
            if (staff) {
                const staffId = staff._id.toString();
                if (!staffPerformance[staffId]) {
                    staffPerformance[staffId] = {
                        name: staff.name,
                        amount: 0
                    };
                }
                staffPerformance[staffId].amount += payment.amount;
            }
        });

        // 3. Convert to array and sort
        const teamPerformance = Object.values(staffPerformance)
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5) // Top 5
            .map(staff => {
                // Determine status/percentage based on some logic (e.g., relative to top performer)
                // For now, let's normalize against the top performer = 100%
                const topAmount = Object.values(staffPerformance).reduce((max, s) => Math.max(max, s.amount), 0) || 1;
                const percentage = Math.round((staff.amount / topAmount) * 100);

                let status = 'Active';
                if (percentage >= 90) status = 'Elite';
                else if (percentage >= 75) status = 'Senior';

                return {
                    name: staff.name,
                    val: percentage,
                    status: status,
                    totalCollected: staff.amount
                };
            });

        // --- Recent Ecosystem Activity ---
        // 1. Recent Clients
        const recentClients = await Client.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('assignedStaff', 'name');

        // 2. Recent Payments
        const recentPayments = await Payment.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate({
                path: 'clientId',
                select: 'name assignedStaff',
                populate: { path: 'assignedStaff', select: 'name' }
            });

        // 3. Merge and format
        const recentActivity = [
            ...recentClients.map(c => ({
                id: c._id,
                type: 'client', // mapped to 'users' icon roughly
                name: 'New Client Added',
                user: c.name, // The client name
                staff: c.assignedStaff?.name || 'Admin',
                time: c.createdAt,
                amount: '-',
                status: 'Success'
            })),
            ...recentPayments.map(p => ({
                id: p._id,
                type: 'payment',
                name: 'Payment Received',
                user: p.clientId?.name || 'Unknown',
                staff: p.clientId?.assignedStaff?.name || 'System',
                time: p.createdAt,
                amount: `$${p.amount}`,
                status: 'Verified'
            }))
        ]
            .sort((a, b) => new Date(b.time) - new Date(a.time))
            .slice(0, 5); // Keep only top 5 mixed events

        res.json({
            totalClients,
            totalStaff,
            totalLoans: loans.length,
            totalLoanAmount,
            totalCollected,
            totalPending,
            totalOverdue,
            activeLoans,
            completedLoans,
            collectionRate: totalLoanAmount > 0 ? ((totalCollected / totalLoanAmount) * 100).toFixed(2) : 0,
            teamPerformance,
            recentActivity
        });
    } catch (error) {
        next(error);
    }
};

// @route   GET /api/dashboard/staff/summary
// @desc    Get staff dashboard summary
// @access  Private/Staff
exports.getStaffSummary = async (req, res, next) => {
    try {
        const staffId = req.user.id;

        // Assigned clients
        const assignedClients = await Client.find({ assignedStaff: staffId });
        const clientIds = assignedClients.map(c => c._id);

        // Loans for assigned clients
        const loans = await Loan.find({ clientId: { $in: clientIds } });
        const totalAssigned = loans.reduce((sum, loan) => sum + loan.loanAmount, 0);
        const totalCollected = loans.reduce((sum, loan) => sum + loan.totalPaid, 0);

        // Upcoming dues (next 7 days)
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);

        const upcomingPayments = await Payment.find({
            clientId: { $in: clientIds },
            status: 'Pending',
            dueDate: { $gte: today, $lte: nextWeek }
        });

        // Overdue clients
        const overduePayments = await Payment.find({
            clientId: { $in: clientIds },
            status: 'Pending',
            dueDate: { $lt: today }
        }).populate('clientId');

        const overdueClients = [...new Set(overduePayments.map(p => p.clientId._id.toString()))];

        res.json({
            assignedClients: assignedClients.length,
            totalAssigned,
            totalCollected,
            upcomingDues: upcomingPayments.length,
            overdueClients: overdueClients.length,
            activeLoans: loans.filter(l => l.status === 'In Progress').length
        });
    } catch (error) {
        next(error);
    }
};
