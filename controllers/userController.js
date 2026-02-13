const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @route   POST /api/users/create
// @desc    Create new staff user (Admin only)
// @access  Private/Admin
exports.createUser = async (req, res, next) => {
    try {
        const { name, email, password, phone, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Create new user
        const user = new User({
            name,
            email,
            password,
            phone,
            role: role || 'staff'
        });

        await user.save();

        // Return user without password
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({
            message: 'User created successfully',
            user: userResponse
        });
    } catch (error) {
        next(error);
    }
};

// @route   GET /api/users
// @desc    Get all staff users (Admin only)
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });

        res.json({
            count: users.length,
            users
        });
    } catch (error) {
        next(error);
    }
};

// @route   PUT /api/users/:id
// @desc    Update staff user (Admin only)
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email, phone, password } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update fields
        if (name) user.name = name;
        if (email) user.email = email;
        if (phone) user.phone = phone;
        if (password) {
            user.password = await bcrypt.hash(password, 10);
        }

        await user.save();

        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({
            message: 'User updated successfully',
            user: userResponse
        });
    } catch (error) {
        next(error);
    }
};

// @route   DELETE /api/users/:id
// @desc    Delete user permanently (Admin only)
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await User.findByIdAndDelete(id);

        res.json({
            message: 'User deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};
