const express = require('express');
const router = express.Router();
const { getAgents, getAvailableAgents, updateAgent } = require('../controllers/agentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// Admin-only listing of agents
router.get('/', authorize('admin'), getAgents);
router.get('/available', authorize('admin'), getAvailableAgents);

// Agent updating their own profile details (coordinates, availability) or Admin overriding zone
router.put('/:id', authorize('delivery_agent', 'admin'), updateAgent);

module.exports = router;
