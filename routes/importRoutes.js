const express = require('express');
const router = express.Router();
const importController = require('../controllers/importController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Admin only
router.use(auth, roleCheck('admin'));

// @route   GET /api/import/template
router.get('/template', importController.downloadTemplate);

// @route   POST /api/import/excel
router.post('/excel', importController.uploadMiddleware, importController.importExcel);

module.exports = router;
