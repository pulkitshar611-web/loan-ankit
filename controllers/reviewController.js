const Review = require('../models/Review');

// @desc    Submit a new review
// @route   POST /api/reviews
// @access  Public
exports.submitReview = async (req, res) => {
    try {
        const { name, role, rating, text } = req.body;

        const review = await Review.create({
            name,
            role,
            rating,
            text,
            isApproved: true // Setting true for now as requested "koi-koi aakar review submit kare to vo bhi ho jaye"
        });

        res.status(201).json({
            success: true,
            data: review
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all approved reviews
// @route   GET /api/reviews
// @access  Public
exports.getReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ isApproved: true }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all reviews (Admin only)
// @route   GET /api/reviews/admin
// @access  Private/Admin
exports.getAllReviewsAdmin = async (req, res) => {
    try {
        const reviews = await Review.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update review status (Admin only)
// @route   PUT /api/reviews/:id
// @access  Private/Admin
exports.updateReviewStatus = async (req, res) => {
    try {
        const review = await Review.findByIdAndUpdate(
            req.params.id,
            { isApproved: req.body.isApproved },
            { new: true, runValidators: true }
        );

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        res.status(200).json({
            success: true,
            data: review
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete a review (Admin only)
// @route   DELETE /api/reviews/:id
// @access  Private/Admin
exports.deleteReview = async (req, res) => {
    try {
        const review = await Review.findByIdAndDelete(req.params.id);

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
