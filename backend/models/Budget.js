const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      required: [true, 'Please select a category for this budget'],
      trim: true,
    },
    limitAmount: {
      type: Number,
      required: [true, 'Please specify a budget limit amount'],
    },
    period: {
      type: String, // Format: YYYY-MM (e.g. "2026-06") to track monthly budgets
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user can only have one budget per category per month
BudgetSchema.index({ user: 1, category: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('Budget', BudgetSchema);
