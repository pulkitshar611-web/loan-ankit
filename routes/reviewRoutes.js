const express = require('express');
const router = express.Router();
const {
    submitReview,
    getReviews,
    updateReviewStatus,
    getAllReviewsAdmin,
    deleteReview
} = require('../controllers/reviewController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/roleCheck');

router.route('/')
    .post(submitReview)
    .get(getReviews);

router.get('/admin', protect, authorize('admin'), getAllReviewsAdmin);

router.route('/:id')
    .put(protect, authorize('admin'), updateReviewStatus)
    .delete(protect, authorize('admin'), deleteReview);

module.exports = router;
