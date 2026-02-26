const express = require('express');
const router = express.Router();
const {
    submitInquiry,
    getInquiries,
    updateInquiryStatus,
    deleteInquiry
} = require('../controllers/contactController');

const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All backend endpoints would ideally have authentication, 
// using public for submission and protected for management.
router.post('/', submitInquiry);
router.get('/', auth, roleCheck('admin'), getInquiries);
router.put('/:id', auth, roleCheck('admin'), updateInquiryStatus);
router.delete('/:id', auth, roleCheck('admin'), deleteInquiry);

module.exports = router;
