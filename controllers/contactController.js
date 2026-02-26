const Inquiry = require('../models/Inquiry');

const submitInquiry = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        const newInquiry = new Inquiry({
            name,
            email,
            subject,
            message
        });

        await newInquiry.save();
        res.status(201).json({ message: 'Inquiry submitted successfully', inquiry: newInquiry });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting inquiry', error: error.message });
    }
};

const getInquiries = async (req, res) => {
    try {
        const inquiries = await Inquiry.find().sort({ createdAt: -1 });
        res.status(200).json(inquiries);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching inquiries', error: error.message });
    }
};

const updateInquiryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const inquiry = await Inquiry.findByIdAndUpdate(id, { status }, { new: true });
        if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });

        res.status(200).json({ message: 'Status updated', inquiry });
    } catch (error) {
        res.status(500).json({ message: 'Error updating status', error: error.message });
    }
};

const deleteInquiry = async (req, res) => {
    try {
        const { id } = req.params;
        await Inquiry.findByIdAndDelete(id);
        res.status(200).json({ message: 'Inquiry deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting inquiry', error: error.message });
    }
};

module.exports = {
    submitInquiry,
    getInquiries,
    updateInquiryStatus,
    deleteInquiry
};
