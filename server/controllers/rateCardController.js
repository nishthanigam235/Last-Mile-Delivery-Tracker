const RateCard = require('../models/RateCard');

/**
 * @desc Get all rate cards
 * @route GET /api/rate-cards
 * @access Private/Admin
 */
exports.getRateCards = async (req, res) => {
  try {
    const rateCards = await RateCard.find().sort({ zoneType: 1, orderType: 1 });
    res.status(200).json({ success: true, count: rateCards.length, data: rateCards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Create new rate card
 * @route POST /api/rate-cards
 * @access Private/Admin
 */
exports.createRateCard = async (req, res) => {
  try {
    const { zoneType, orderType, pricePerKg, codCharge } = req.body;

    // Check if configuration already exists
    const rateExists = await RateCard.findOne({ zoneType, orderType });
    if (rateExists) {
      return res.status(400).json({
        success: false,
        message: `Rate card configuration for zone type "${zoneType}" and order type "${orderType}" already exists`,
      });
    }

    const rateCard = await RateCard.create({
      zoneType,
      orderType,
      pricePerKg: parseFloat(pricePerKg),
      codCharge: parseFloat(codCharge),
    });

    res.status(201).json({ success: true, data: rateCard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Update rate card
 * @route PUT /api/rate-cards/:id
 * @access Private/Admin
 */
exports.updateRateCard = async (req, res) => {
  try {
    const { pricePerKg, codCharge } = req.body;

    let rateCard = await RateCard.findById(req.params.id);
    if (!rateCard) {
      return res.status(404).json({ success: false, message: 'Rate card not found' });
    }

    const updates = {};
    if (pricePerKg !== undefined) updates.pricePerKg = parseFloat(pricePerKg);
    if (codCharge !== undefined) updates.codCharge = parseFloat(codCharge);

    rateCard = await RateCard.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: rateCard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Delete rate card
 * @route DELETE /api/rate-cards/:id
 * @access Private/Admin
 */
exports.deleteRateCard = async (req, res) => {
  try {
    const rateCard = await RateCard.findById(req.params.id);
    if (!rateCard) {
      return res.status(404).json({ success: false, message: 'Rate card not found' });
    }

    await rateCard.deleteOne();
    res.status(200).json({ success: true, message: 'Rate card deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
