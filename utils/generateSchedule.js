/**
 * Generate payment schedule for a loan
 * @param {Number} loanAmount - Total loan amount
 * @param {Date} startDate - Loan start date
 * @param {String} frequency - 'Monthly' or 'Bi-Weekly'
 * @returns {Array} Array of payment objects
 */
const generateSchedule = (loanAmount, startDate, frequency = 'Monthly') => {
    const isBiWeekly = frequency === 'Bi-Weekly';
    const totalInstallments = isBiWeekly ? 8 : 4;
    const installmentAmount = loanAmount / totalInstallments;
    const payments = [];
    const start = new Date(startDate);

    for (let i = 1; i <= totalInstallments; i++) {
        const dueDate = new Date(start);

        if (isBiWeekly) {
            // Every 14 days
            dueDate.setDate(dueDate.getDate() + (i * 14));
        } else {
            // Every month
            dueDate.setMonth(dueDate.getMonth() + i);
        }

        payments.push({
            installmentNo: i,
            amount: installmentAmount,
            dueDate,
            status: 'Pending'
        });
    }

    return payments;
};

module.exports = generateSchedule;
