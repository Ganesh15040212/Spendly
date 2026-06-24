const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    id: {
      type: String,
      required: false,
    },
    name: {
      type: String,
      required: [true, 'Please add subscription service name'],
      trim: true,
    },
    cost: {
      type: Number,
      required: [true, 'Please add subscription cost'],
    },
    period: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
    },
    nextBillingDate: {
      type: String, // Format: YYYY-MM-DD
      required: [true, 'Please select the next billing renewal date'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Subscription', SubscriptionSchema);
