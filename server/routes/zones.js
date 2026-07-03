const express = require('express');
const router = express.Router();
const { getZones, createZone, updateZone, deleteZone } = require('../controllers/zoneController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All authenticated users can view zones
router.get('/', protect, getZones);

// Admin-only write/delete endpoints
router.post('/', protect, authorize('admin'), createZone);
router.put('/:id', protect, authorize('admin'), updateZone);
router.delete('/:id', protect, authorize('admin'), deleteZone);

module.exports = router;
