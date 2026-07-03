const User = require('../models/User');
const Order = require('../models/Order');

// Static lookup for coordinates to simulate GPS mapping for pincodes
const PINCODE_COORDINATES = {
  // Delhi
  '110001': { lat: 28.6139, lng: 77.2090 },
  '110020': { lat: 28.5355, lng: 77.2639 },
  '110092': { lat: 28.6304, lng: 77.3008 },
  // Mumbai
  '400001': { lat: 18.9220, lng: 72.8347 },
  '400011': { lat: 18.9750, lng: 72.8258 },
  '400072': { lat: 19.1170, lng: 72.8906 },
  // Bangalore
  '560001': { lat: 12.9716, lng: 77.5946 },
  '560034': { lat: 12.9208, lng: 77.6244 },
  '560103': { lat: 12.9317, lng: 77.6788 },
};

/**
 * Helper to generate mock coordinates from pincode if not explicitly mapped
 */
const getCoordinatesForPincode = (pincode) => {
  const code = pincode.toString().trim();
  if (PINCODE_COORDINATES[code]) {
    return PINCODE_COORDINATES[code];
  }
  // Fallback: Generate semi-random repeatable lat/lng from pincode hash
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = code.charCodeAt(i) + ((hash << 5) - hash);
  }
  const lat = 20.0 + (hash % 100) / 10.0;
  const lng = 78.0 + ((hash >> 8) % 100) / 10.0;
  return { lat, lng };
};

/**
 * Calculate geodesic distance between two points using the Haversine formula (in km)
 */
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

/**
 * Automatically assign the best available agent for an order
 * @param {Object} order order document
 * @returns {Promise<Object|null>} assigned agent document or null if none available
 */
const autoAssignAgent = async (order) => {
  // 1. Fetch available agents
  const availableAgents = await User.find({
    role: 'delivery_agent',
    isAvailable: true,
  });

  if (availableAgents.length === 0) {
    return null;
  }

  // Get order pickup coordinates
  const pickupCoords = getCoordinatesForPincode(order.pickupPincode);

  // 2. Fetch active order counts for each available agent to implement load balancing
  const activeOrdersCounts = await Order.aggregate([
    {
      $match: {
        assignedAgent: { $in: availableAgents.map(a => a._id) },
        status: { $in: ['Picked Up', 'In Transit', 'Out for Delivery'] },
      },
    },
    {
      $group: {
        _id: '$assignedAgent',
        count: { $sum: 1 },
      },
    },
  ]);

  const loadMap = {};
  activeOrdersCounts.forEach((item) => {
    loadMap[item._id.toString()] = item.count;
  });

  // 3. Score and rank agents
  const rankedAgents = availableAgents.map((agent) => {
    let distance = Infinity;
    let locationAvailable = false;

    // Check if agent location is specified
    if (agent.currentLocation && agent.currentLocation.lat !== 0 && agent.currentLocation.lng !== 0) {
      distance = calculateHaversineDistance(
        pickupCoords.lat,
        pickupCoords.lng,
        agent.currentLocation.lat,
        agent.currentLocation.lng
      );
      locationAvailable = true;
    }

    // Zone match check (fallback criteria)
    const isSameZone =
      agent.zone && order.pickupZone && agent.zone.toString() === order.pickupZone.toString();

    // Active load count
    const activeLoad = loadMap[agent._id.toString()] || 0;

    return {
      agent,
      distance,
      locationAvailable,
      isSameZone,
      activeLoad,
    };
  });

  // Sort logic:
  // Primary: If GPS location is available on agents, prioritize nearest (within 100km).
  // Secondary: Fallback to same zone if GPS not available or equal.
  // Tertiary: Fallback to the agent with the lowest load (number of active orders).
  rankedAgents.sort((a, b) => {
    // If both have GPS coordinates, sort by distance
    if (a.locationAvailable && b.locationAvailable) {
      if (Math.abs(a.distance - b.distance) > 0.1) {
        return a.distance - b.distance;
      }
    } else if (a.locationAvailable) {
      return -1; // agent 'a' has GPS, agent 'b' does not, prefer 'a'
    } else if (b.locationAvailable) {
      return 1; // agent 'b' has GPS, agent 'a' does not, prefer 'b'
    }

    // Fallback 1: Zone-based matching
    if (a.isSameZone && !b.isSameZone) return -1;
    if (!a.isSameZone && b.isSameZone) return 1;

    // Fallback 2: Load-based matching (least active orders)
    return a.activeLoad - b.activeLoad;
  });

  const selectedAgent = rankedAgents[0].agent;

  // Update order status with assigned agent
  order.assignedAgent = selectedAgent._id;
  await order.save();

  return selectedAgent;
};

module.exports = {
  autoAssignAgent,
  getCoordinatesForPincode,
  calculateHaversineDistance,
};
