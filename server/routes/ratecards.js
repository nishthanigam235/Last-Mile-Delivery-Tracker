const express = require('express');
const router = express.Router();
const {
  getRateCards,
  createRateCard,
  updateRateCard,
  deleteRateCard,
} = require('../controllers/rateCardController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Lock all rate-card configurations to admin role
router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(getRateCards)
  .post(createRateCard);

router.route('/:id')
  .put(updateRateCard)
  .delete(deleteRateCard);

module.exports = router;
