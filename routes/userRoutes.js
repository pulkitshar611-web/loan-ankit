const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { validateUserCreate } = require('../utils/validators');

// All routes require admin role
router.use(auth, roleCheck('admin'));

// @route   POST /api/users/create
router.post('/create', ...validateUserCreate, userController.createUser);

// @route   GET /api/users
router.get('/', userController.getAllUsers);

// @route   PUT /api/users/:id
router.put('/:id', userController.updateUser);

// @route   DELETE /api/users/:id
router.delete('/:id', userController.deleteUser);

module.exports = router;
