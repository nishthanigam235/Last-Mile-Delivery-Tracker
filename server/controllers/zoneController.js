const Zone = require('../models/Zone');

/**
 * @desc Get all zones
 * @route GET /api/zones
 * @access Private/Admin
 */
exports.getZones = async (req, res) => {
  try {
    const zones = await Zone.find().sort({ zoneName: 1 });
    res.status(200).json({ success: true, count: zones.length, data: zones });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Create new zone
 * @route POST /api/zones
 * @access Private/Admin
 */
exports.createZone = async (req, res) => {
  try {
    const { zoneName, city, pincodes } = req.body;

    // Check if zone name already exists
    const zoneExists = await Zone.findOne({ zoneName });
    if (zoneExists) {
      return res.status(400).json({ success: false, message: 'Zone name already exists' });
    }

    // Clean and split pincodes
    let parsedPincodes = [];
    if (Array.isArray(pincodes)) {
      parsedPincodes = pincodes.map(p => p.toString().trim());
    } else if (typeof pincodes === 'string') {
      parsedPincodes = pincodes.split(',').map(p => p.trim()).filter(Boolean);
    }

    const zone = await Zone.create({
      zoneName,
      city,
      pincodes: parsedPincodes,
    });

    res.status(201).json({ success: true, data: zone });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Update zone details or pincodes
 * @route PUT /api/zones/:id
 * @access Private/Admin
 */
exports.updateZone = async (req, res) => {
  try {
    const { zoneName, city, pincodes } = req.body;

    let zone = await Zone.findById(req.params.id);
    if (!zone) {
      return res.status(404).json({ success: false, message: 'Zone not found' });
    }

    // Prepare update payload
    const updates = {};
    if (zoneName) updates.zoneName = zoneName;
    if (city) updates.city = city;
    if (pincodes) {
      if (Array.isArray(pincodes)) {
        updates.pincodes = pincodes.map(p => p.toString().trim());
      } else if (typeof pincodes === 'string') {
        updates.pincodes = pincodes.split(',').map(p => p.trim()).filter(Boolean);
      }
    }

    zone = await Zone.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: zone });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Delete zone
 * @route DELETE /api/zones/:id
 * @access Private/Admin
 */
exports.deleteZone = async (req, res) => {
  try {
    const zone = await Zone.findById(req.params.id);
    if (!zone) {
      return res.status(404).json({ success: false, message: 'Zone not found' });
    }

    await zone.deleteOne();
    res.status(200).json({ success: true, message: 'Zone deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
