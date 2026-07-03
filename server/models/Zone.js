const mongoose = require('mongoose');

const ZoneSchema = new mongoose.Schema(
  {
    zoneName: {
      type: String,
      required: [true, 'Please provide a zone name'],
      unique: true,
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'Please provide a city'],
      trim: true,
    },
    pincodes: {
      type: [String],
      required: [true, 'Please provide pincodes for this zone'],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'A zone must contain at least one pincode',
      },
    },
  },
  { timestamps: true }
);

// Create compound index for pincodes to quickly lookup zones by pincode
ZoneSchema.index({ pincodes: 1 });

module.exports = mongoose.model('Zone', ZoneSchema);
