const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const auth = require('../middleware/auth');

// All reminder routes require authentication
router.use(auth);

// Get all notification logs
router.get('/logs', reminderController.getLogs);

// Trigger manual reminder check (For testing)
router.post('/trigger', reminderController.triggerReminders);

// Log manual message sent via frontend
router.post('/log-manual', reminderController.logManual);

module.exports = router;
