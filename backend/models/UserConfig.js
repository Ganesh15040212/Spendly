const mongoose = require('mongoose');

const UserConfigSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    openingBalance: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// A user can only have one configuration file
UserConfigSchema.index({ user: 1 }, { unique: true });

module.exports = mongoose.model('UserConfig', UserConfigSchema);
