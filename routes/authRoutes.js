const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { validateLogin } = require('../utils/validators');

// @route   POST /api/auth/login
router.post('/login', ...validateLogin, authController.login);

// @route   POST /api/auth/logout
router.post('/logout', authController.logout);

// @route   GET /api/auth/profile
router.get('/profile', auth, authController.getProfile);

// @route   PUT /api/auth/profile
router.put('/profile', auth, authController.updateProfile);

module.exports = router;
