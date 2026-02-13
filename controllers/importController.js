const multer = require('multer');
const xlsx = require('xlsx');
const Client = require('../models/Client');
const Loan = require('../models/Loan');
const Payment = require('../models/Payment');
const User = require('../models/User');
const generateSchedule = require('../utils/generateSchedule');

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files are allowed'), false);
        }
    }
});

// Helper: Excel Date to JS Date
const parseExcelDate = (excelDate) => {
    if (!excelDate) return new Date();
    if (typeof excelDate === 'number') {
        return new Date(Math.ceil((excelDate - 25569) * 86400 * 1000));
    }
    return new Date(excelDate);
};

// @route   GET /api/import/template
// @desc    Download sample Excel template
// @access  Private
exports.downloadTemplate = async (req, res, next) => {
    try {
        const wb = xlsx.utils.book_new();
        const wsData = [
            ['Name', 'Email', 'Phone', 'Loan Amount', 'Loan Start Date (YYYY-MM-DD)', 'Assigned Staff (Name)'],
            ['John Doe', 'john@example.com', '9876543210', '10000', '2023-10-01', 'Admin'],
            ['Jane Smith', 'jane@example.com', '9123456780', '5000', '2023-11-15', 'Sarah Jones']
        ];
        const ws = xlsx.utils.aoa_to_sheet(wsData);
        xlsx.utils.book_append_sheet(wb, ws, "Template");

        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', 'attachment; filename="Loan_Import_Template.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (error) {
        next(error);
    }
};

// @route   POST /api/import/excel
// @desc    Import clients and loans from Excel file
// @access  Private/Admin
exports.importExcel = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Parse Excel file
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        const imported = [];
        const errors = [];

        // Fetch all staff for lookup
        const allStaff = await User.find({});

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNum = i + 2; // Excel row number (1-based, +1 for header)

            try {
                // Map columns (Flexible matching)
                const name = row['Name'] || row['name'];
                const email = row['Email'] || row['email'];
                const phone = row['Phone'] || row['phone'];
                const loanAmount = row['Loan Amount'] || row['loanAmount'];
                const startDateRaw = row['Loan Start Date (YYYY-MM-DD)'] || row['Loan Start Date'] || row['loanStartDate'];
                const staffName = row['Assigned Staff (Name)'] || row['Assigned Staff'] || row['assignedStaff'];

                // Validate required fields
                if (!name || !email || !loanAmount) {
                    errors.push({ row: rowNum, message: 'Missing Name, Email, or Loan Amount' });
                    continue;
                }

                // Check duplicate email
                const existingClient = await Client.findOne({ email });
                if (existingClient) {
                    errors.push({ row: rowNum, message: `Client with email ${email} already exists` });
                    continue;
                }

                // Find Staff ID
                let assignedStaffId = req.user.id; // Default to uploader (Admin)
                if (staffName) {
                    const staff = allStaff.find(s => s.name.toLowerCase() === staffName.toLowerCase());
                    if (staff) assignedStaffId = staff._id;
                }

                // Create client
                const client = new Client({
                    name,
                    email,
                    phone: phone ? String(phone) : '',
                    assignedStaff: assignedStaffId,
                    status: 'Active'
                });

                await client.save();

                // Create loan & Payments
                const amount = parseFloat(loanAmount);
                const startDate = parseExcelDate(startDateRaw);

                const loan = new Loan({
                    clientId: client._id,
                    loanAmount: amount,
                    loanStartDate: startDate,
                    tenure: 4,
                    monthlyInstallment: amount / 4,
                    remainingAmount: amount, // Assuming new loan import, full amount pending
                    totalPaid: 0,
                    status: 'In Progress'
                });

                await loan.save();

                // Generate payment schedule
                const schedule = generateSchedule(amount, startDate);
                const payments = schedule.map(payment => ({
                    ...payment,
                    loanId: loan._id,
                    clientId: client._id
                }));

                await Payment.insertMany(payments);

                imported.push({ client, loan });
            } catch (error) {
                errors.push({ row: rowNum, message: error.message });
            }
        }

        res.json({
            message: `Import completed. ${imported.length} imported, ${errors.length} failed.`,
            imported: imported.length,
            errors: errors
        });
    } catch (error) {
        next(error);
    }
};

// Export multer upload middleware
exports.uploadMiddleware = upload.single('file');
