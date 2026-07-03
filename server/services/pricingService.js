const Zone = require('../models/Zone');
const RateCard = require('../models/RateCard');

/**
 * Detect zone by pincode
 * @param {string} pincode 
 * @returns {Promise<Object|null>}
 */
const detectZone = async (pincode) => {
  if (!pincode) return null;
  const cleanedPincode = pincode.toString().trim();
  const zone = await Zone.findOne({ pincodes: cleanedPincode });
  return zone;
};

/**
 * Core pricing engine logic
 * @param {Object} params
 * @param {string} params.pickupPincode
 * @param {string} params.dropPincode
 * @param {number} params.length
 * @param {number} params.breadth
 * @param {number} params.height
 * @param {number} params.actualWeight
 * @param {string} params.orderType B2B or B2C
 * @param {string} params.paymentType Prepaid or COD
 * @returns {Promise<Object>} pricing details breakdown
 */
const calculateCharges = async ({
  pickupPincode,
  dropPincode,
  length,
  breadth,
  height,
  actualWeight,
  orderType,
  paymentType,
}) => {
  // Validate dimensions and actual weight
  const l = parseFloat(length);
  const b = parseFloat(breadth);
  const h = parseFloat(height);
  const actWt = parseFloat(actualWeight);

  if (isNaN(l) || isNaN(b) || isNaN(h) || l <= 0 || b <= 0 || h <= 0) {
    throw new Error('Invalid dimensions. All dimensions must be greater than zero.');
  }
  if (isNaN(actWt) || actWt <= 0) {
    throw new Error('Invalid actual weight. Weight must be greater than zero.');
  }
  if (!['B2B', 'B2C'].includes(orderType)) {
    throw new Error('Invalid order type. Must be B2B or B2C.');
  }
  if (!['Prepaid', 'COD'].includes(paymentType)) {
    throw new Error('Invalid payment type. Must be Prepaid or COD.');
  }

  // 1. Detect zones
  const pickupZone = await detectZone(pickupPincode);
  const dropZone = await detectZone(dropPincode);

  if (!pickupZone) {
    throw new Error(`Pickup pincode (${pickupPincode}) is not mapped to any shipping zone. Contact admin.`);
  }
  if (!dropZone) {
    throw new Error(`Drop pincode (${dropPincode}) is not mapped to any shipping zone. Contact admin.`);
  }

  // 2. Volumetric Weight Calculation
  // length * breadth * height / 5000
  const volumetricWeight = parseFloat(((l * b * h) / 5000).toFixed(2));
  const billableWeight = parseFloat(Math.max(actWt, volumetricWeight).toFixed(2));

  // 3. Determine trip zone type (intra vs inter)
  const zoneType = pickupZone._id.toString() === dropZone._id.toString() ? 'intra' : 'inter';

  // 4. Query rate card
  const rateCard = await RateCard.findOne({ zoneType, orderType });
  if (!rateCard) {
    throw new Error(`No rate card configured for combination of ZoneType: ${zoneType} and OrderType: ${orderType}.`);
  }

  // 5. Calculate base cost
  const baseCharge = parseFloat((billableWeight * rateCard.pricePerKg).toFixed(2));

  // 6. COD Surcharge check
  const codSurcharge = paymentType === 'COD' ? rateCard.codCharge : 0;
  const deliveryCharge = parseFloat((baseCharge + codSurcharge).toFixed(2));

  return {
    pickupZone: {
      _id: pickupZone._id,
      zoneName: pickupZone.zoneName,
      city: pickupZone.city,
    },
    dropZone: {
      _id: dropZone._id,
      zoneName: dropZone.zoneName,
      city: dropZone.city,
    },
    volumetricWeight,
    billableWeight,
    zoneType,
    rateUsed: {
      pricePerKg: rateCard.pricePerKg,
      codCharge: rateCard.codCharge,
    },
    baseCharge,
    codSurcharge,
    deliveryCharge,
  };
};

module.exports = {
  detectZone,
  calculateCharges,
};
