const mongoose = require('mongoose');

const RateCardSchema = new mongoose.Schema(
  {
    zoneType: {
      type: String,
      enum: ['intra', 'inter'],
      required: [true, 'Please specify zone type (intra or inter)'],
    },
    orderType: {
      type: String,
      enum: ['B2B', 'B2C'],
      required: [true, 'Please specify order type (B2B or B2C)'],
    },
    pricePerKg: {
      type: Number,
      required: [true, 'Please specify price per kg'],
      min: [0, 'Price per kg cannot be negative'],
    },
    codCharge: {
      type: Number,
      required: [true, 'Please specify COD charge'],
      min: [0, 'COD charge cannot be negative'],
    },
  },
  { timestamps: true }
);

// Unique combination index for zoneType + orderType
RateCardSchema.index({ zoneType: 1, orderType: 1 }, { unique: true });

module.exports = mongoose.model('RateCard', RateCardSchema);
