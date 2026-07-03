const express = require('express');
const router = express.Router();
const {
  calculatePreview,
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  assignAgent,
  rescheduleOrder,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// Pre-calculate preview (all logged in users)
router.post('/calculate', calculatePreview);

// List/create orders
router.route('/')
  .get(getOrders)
  .post(authorize('customer', 'admin'), createOrder);

// Single order details
router.get('/:id', getOrderById);

// Update status (Agent and Admin)
router.put('/:id/status', authorize('delivery_agent', 'admin'), updateOrderStatus);

// Assign agent (Admin only)
router.put('/:id/assign-agent', authorize('admin'), assignAgent);

// Reschedule failed order (Customer and Admin)
router.put('/:id/reschedule', authorize('customer', 'admin'), rescheduleOrder);

module.exports = router;
