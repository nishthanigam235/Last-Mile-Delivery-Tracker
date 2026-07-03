const mongoose = require('mongoose');

const TrackingSchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  remarks: {
    type: String,
    default: '',
  },
});

const OrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      sparse: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please associate a customer with this order'],
    },
    pickupAddress: {
      type: String,
      required: [true, 'Please provide a pickup address'],
    },
    pickupPincode: {
      type: String,
      required: [true, 'Please provide a pickup pincode'],
    },
    pickupZone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
      default: null,
    },
    dropAddress: {
      type: String,
      required: [true, 'Please provide a drop address'],
    },
    dropPincode: {
      type: String,
      required: [true, 'Please provide a drop pincode'],
    },
    dropZone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
      default: null,
    },
    packageDimensions: {
      length: { type: Number, required: [true, 'Please specify length in cm'] },
      breadth: { type: Number, required: [true, 'Please specify breadth in cm'] },
      height: { type: Number, required: [true, 'Please specify height in cm'] },
    },
    actualWeight: {
      type: Number,
      required: [true, 'Please specify actual weight in kg'],
    },
    volumetricWeight: {
      type: Number,
      default: 0.0,
    },
    billableWeight: {
      type: Number,
      default: 0.0,
    },
    orderType: {
      type: String,
      enum: ['B2B', 'B2C'],
      required: [true, 'Please specify order type (B2B or B2C)'],
    },
    paymentType: {
      type: String,
      enum: ['Prepaid', 'COD'],
      required: [true, 'Please specify payment type (Prepaid or COD)'],
    },
    deliveryCharge: {
      type: Number,
      default: 0.0,
    },
    status: {
      type: String,
      enum: ['Created', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered', 'Failed', 'Rescheduled'],
      default: 'Created',
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    trackingHistory: [TrackingSchema],
    rescheduleDate: {
      type: Date,
      default: null,
    },
    failReason: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Pre-save to auto-generate human readable Order ID if not present
OrderSchema.pre('save', async function (next) {
  if (!this.orderId) {
    // Generate a unique format like LMD-123456
    const random = Math.floor(100000 + Math.random() * 900000);
    this.orderId = `LMD-${random}`;
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema);
