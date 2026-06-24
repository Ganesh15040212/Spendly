const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema(
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
    amount: {
      type: Number,
      required: [true, 'Please add a transaction amount'],
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Please specify if transaction is income or expense'],
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      trim: true,
    },
    wallet: {
      type: String,
      enum: ['Cash', 'Bank', 'UPI', 'Credit Card', 'Digital Wallet'],
      default: 'Cash',
      required: [true, 'Please select a payment wallet source'],
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
    date: {
      type: String, // Format: YYYY-MM-DD
      required: [true, 'Please select a date'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Transaction', TransactionSchema);
