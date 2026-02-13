const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { validateClientCreate } = require('../utils/validators');

// All routes require authentication
router.use(auth);

// @route   POST /api/clients
router.post('/', ...validateClientCreate, clientController.createClient);

// @route   GET /api/clients
router.get('/', clientController.getAllClients);

// @route   GET /api/clients/:id
router.get('/:id', clientController.getClientById);

// @route   PUT /api/clients/:id
router.put('/:id', clientController.updateClient);

// @route   DELETE /api/clients/:id (Admin only)
router.delete('/:id', roleCheck('admin'), clientController.deleteClient);

module.exports = router;
