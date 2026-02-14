/**
 * Generate payment schedule for a loan
 * @param {Number} totalAmount - Total amount to be paid (Principal + Interest)
 * @param {Date} startDate - Loan start date
 * @param {String} frequency - 'Monthly', 'Bi-Weekly', 'Weekly'
 * @returns {Array} Array of payment objects
 */
const generateSchedule = (totalAmount, startDate, frequency = 'Weekly', tenure = null) => {
    let totalInstallments;
    let intervalDays = 0;
    let intervalMonths = 0;

    // Determine interval rules
    switch (frequency) {
        case 'Weekly':
            intervalDays = 7;
            break;
        case 'Bi-Weekly':
            intervalDays = 14;
            break;
        case 'Monthly':
        default:
            intervalMonths = 1;
            break;
    }

    // Use provided tenure or derive from frequency (legacy/fallback)
    if (tenure) {
        totalInstallments = parseInt(tenure);
    } else {
        switch (frequency) {
            case 'Weekly': totalInstallments = 16; break;
            case 'Bi-Weekly': totalInstallments = 8; break;
            case 'Monthly': default: totalInstallments = 4; break;
        }
    }

    const installmentAmount = totalAmount / totalInstallments;
    const payments = [];
    const start = new Date(startDate);

    for (let i = 1; i <= totalInstallments; i++) {
        const dueDate = new Date(start);

        if (intervalMonths > 0) {
            dueDate.setMonth(dueDate.getMonth() + (i * intervalMonths));
        } else {
            dueDate.setDate(dueDate.getDate() + (i * intervalDays));
        }

        payments.push({
            installmentNo: i,
            amount: parseFloat(installmentAmount.toFixed(2)), // Ensure 2 decimal places
            dueDate,
            status: 'Pending'
        });
    }

    // Adjust last payment to handle rounding errors
    const totalScheduled = payments.reduce((sum, p) => sum + p.amount, 0);
    const diff = totalAmount - totalScheduled;
    if (Math.abs(diff) > 0.001) {
        payments[payments.length - 1].amount += diff;
        payments[payments.length - 1].amount = parseFloat(payments[payments.length - 1].amount.toFixed(2));
    }

    return payments;
};

module.exports = generateSchedule;
