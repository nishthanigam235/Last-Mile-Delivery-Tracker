const User = require('../models/User');

/**
 * @desc Get all delivery agents
 * @route GET /api/agents
 * @access Private/Admin
 */
exports.getAgents = async (req, res) => {
  try {
    const agents = await User.find({ role: 'delivery_agent' })
      .populate('zone', 'zoneName city')
      .sort({ name: 1 });
    res.status(200).json({ success: true, count: agents.length, data: agents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Get currently available agents
 * @route GET /api/agents/available
 * @access Private/Admin
 */
exports.getAvailableAgents = async (req, res) => {
  try {
    const agents = await User.find({ role: 'delivery_agent', isAvailable: true })
      .populate('zone', 'zoneName city')
      .sort({ name: 1 });
    res.status(200).json({ success: true, count: agents.length, data: agents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Admin updates agent details (availability, location, zone)
 * @route PUT /api/agents/:id
 * @access Private
 */
exports.updateAgent = async (req, res) => {
  try {
    const { isAvailable, currentLocation, zone } = req.body;

    let agent = await User.findById(req.params.id);
    if (!agent || agent.role !== 'delivery_agent') {
      return res.status(404).json({ success: false, message: 'Delivery agent not found' });
    }

    // Role boundary checks: agents can update their own availability or location, but zone updates are admin only.
    if (req.user.role === 'delivery_agent' && req.user.id !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Access denied: cannot update other agents' });
    }

    const updates = {};
    if (isAvailable !== undefined) {
      updates.isAvailable = isAvailable;
    }
    if (currentLocation) {
      updates.currentLocation = {
        lat: parseFloat(currentLocation.lat || 0),
        lng: parseFloat(currentLocation.lng || 0),
      };
    }
    if (req.user.role === 'admin' && zone !== undefined) {
      updates.zone = zone || null;
    }

    agent = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate('zone', 'zoneName city');

    res.status(200).json({ success: true, data: agent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
