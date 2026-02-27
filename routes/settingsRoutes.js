const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Controllers
const settingsController = require('../controllers/settingsController');

// Middleware
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

/**
 * BOOTSTRAP CHECK:
 * Verify that all required functions are present before mapping routes.
 * This prevents TypeError: argument handler must be a function.
 */
if (typeof auth !== 'function') throw new Error('Auth middleware is not a function');
if (typeof roleCheck !== 'function') throw new Error('RoleCheck middleware is not a function');
if (typeof settingsController.uploadChecklist !== 'function') throw new Error('uploadChecklist handler is missing');

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './temp';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `check-${Date.now()}.pdf`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

/**
 * ROUTES
 */

// GET
router.get('/checklist', (req, res, next) => settingsController.getChecklist(req, res, next));

// POST - Upload checklist PDF
router.post(
    '/upload-checklist',
    auth,
    roleCheck('admin'),
    upload.single('checklist'),
    (req, res, next) => settingsController.uploadChecklist(req, res, next)
);

// DELETE - Clear checklist
router.delete(
    '/checklist',
    auth,
    roleCheck('admin'),
    (req, res, next) => settingsController.deleteChecklist(req, res, next)
);

module.exports = router;
