const cron = require('node-cron');
const nodemailer = require('nodemailer');
const Client = require('../models/Client');
const Loan = require('../models/Loan');
const Payment = require('../models/Payment');
const NotificationLog = require('../models/NotificationLog');

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Helper: Send Email
const sendEmail = async (to, subject, text, clientId, category) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('Skipping Email: No credentials in .env');
            return false;
        }

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            text
        });

        // Log notification
        await NotificationLog.create({
            clientId,
            type: 'Email',
            category,
            message: `Subject: ${subject}`,
            status: 'Sent'
        });

        return true;
    } catch (error) {
        console.error('Email Error:', error);
        await NotificationLog.create({
            clientId,
            type: 'Email',
            category,
            message: `Failed: ${error.message}`,
            status: 'Failed'
        });
        return false;
    }
};

// Check for due payments
const checkReminders = async () => {
    console.log('Running Daily Reminder Check...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    try {
        // Find all pending payments
        const pendingPayments = await Payment.find({ status: { $ne: 'Paid' } }).populate('clientId');

        for (const payment of pendingPayments) {
            const dueDate = new Date(payment.dueDate);
            dueDate.setHours(0, 0, 0, 0);

            let category = null;
            let message = '';

            // 1. Due in 3 Days
            if (dueDate.getTime() === threeDaysFromNow.getTime()) {
                category = 'Due Soon';
                message = `Hello ${payment.clientId.name}, your payment of $${payment.amount} is due on ${dueDate.toLocaleDateString()}.`;
            }
            // 2. Due Today
            else if (dueDate.getTime() === today.getTime()) {
                category = 'Due Today';
                message = `URGENT: Hello ${payment.clientId.name}, your payment of $${payment.amount} is due TODAY.`;
            }
            // 3. Overdue (Check every day after due date?) - Let's just check 1 day after
            else if (dueDate < today && payment.status === 'Pending') {
                // Mark as Overdue if not already
                if (payment.status !== 'Overdue') {
                    payment.status = 'Overdue';
                    await payment.save();
                }

                // Send reminder on specific days (Example: 1 day after)
                const oneDayAfter = new Date(dueDate);
                oneDayAfter.setDate(dueDate.getDate() + 1);

                if (today.getTime() === oneDayAfter.getTime()) {
                    category = 'Overdue';
                    message = `OVERDUE ALERT: ${payment.clientId.name}, your payment of $${payment.amount} was due on ${dueDate.toLocaleDateString()}. Please pay immediately.`;
                }
            }

            if (category && payment.clientId.email) {
                console.log(`Sending ${category} reminder to ${payment.clientId.name}`);
                await sendEmail(payment.clientId.email, `Payment Reminder: ${category}`, message, payment.clientId._id, category);
            }
        }
    } catch (error) {
        console.error('Reminder Check Error:', error);
    }
};

// Initialize Cron Job (Runs every day at 9:00 AM)
const initCron = () => {
    cron.schedule('0 9 * * *', checkReminders, {
        timezone: "Asia/Kolkata"
    });
    console.log('Initialized Reminder Cron Job (09:00 AM IST)');
};

// API: Get Notification Logs
exports.getLogs = async (req, res) => {
    try {
        let query = {};

        // If staff, only show logs for their assigned clients
        if (req.user.role === 'staff') {
            const assignedClients = await Client.find({ assignedStaff: req.user.id }).select('_id');
            const clientIds = assignedClients.map(c => c._id);
            query.clientId = { $in: clientIds };
        }

        const logs = await NotificationLog.find(query)
            .populate('clientId', 'name')
            .sort({ sentAt: -1 })
            .limit(50);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// API: Force Run Reminders (Manual Bulk Trigger)
exports.triggerReminders = async (req, res) => {
    console.log('Running Manual Bulk Reminder Trigger...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    let sentCount = 0;

    try {
        let query = { status: { $ne: 'Paid' } };

        // If staff, only trigger for their assigned clients
        if (req.user.role === 'staff') {
            const assignedClients = await Client.find({ assignedStaff: req.user.id }).select('_id');
            const clientIds = assignedClients.map(c => c._id);
            query.clientId = { $in: clientIds };
        }

        // Find pending payments
        const pendingPayments = await Payment.find(query).populate('clientId');

        for (const payment of pendingPayments) {
            const dueDate = new Date(payment.dueDate);
            dueDate.setHours(0, 0, 0, 0);

            let category = null;
            let message = '';

            // Logic: Send to EVERYONE who is due/overdue, regardless of specific day checks
            if (dueDate < today) {
                category = 'Overdue';
                message = `OVERDUE ALERT: ${payment.clientId.name}, your payment of $${payment.amount} was due on ${dueDate.toLocaleDateString()}. Please pay immediately.`;
            } else if (dueDate.getTime() === today.getTime()) {
                category = 'Due Today';
                message = `URGENT: Hello ${payment.clientId.name}, your payment of $${payment.amount} is due TODAY.`;
            } else if (dueDate <= threeDaysFromNow && dueDate > today) {
                category = 'Due Soon';
                message = `Hello ${payment.clientId.name}, your payment of $${payment.amount} is due on ${dueDate.toLocaleDateString()}.`;
            }

            // Send Email if category matched
            if (category && payment.clientId.email) {
                await sendEmail(payment.clientId.email, `Payment Reminder: ${category}`, message, payment.clientId._id, category);
                sentCount++;
            }
        }

        res.json({ message: `Bulk automation completed. Sent ${sentCount} emails.` });
    } catch (error) {
        console.error('Manual Trigger Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// API: Log Manual Reminder (e.g., via WhatsApp button)
exports.logManual = async (req, res) => {
    try {
        const { clientId, type, message } = req.body;
        await NotificationLog.create({
            clientId,
            type,
            category: 'Manual',
            message,
            status: 'Sent' // Assume sent since it opens the app
        });
        res.json({ message: 'Log created' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.initCron = initCron;
