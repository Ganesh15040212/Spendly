const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');
const Subscription = require('../models/Subscription');
const UserConfig = require('../models/UserConfig');

// JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET || 'spendly_super_secret_key_123';

// Generate Token Utility
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
};

// JWT Authentication Protect Middleware
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ error: 'User account not found' });
      }
      return next();
    } catch (err) {
      return res.status(401).json({ error: 'Not authorized, token validation failed' });
    }
  }
  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no auth token provided' });
  }
};

// ==================== AUTHENTICATION ROUTES ====================

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: 'user',
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profilePicture: user.profilePicture || 'avatar1',
        customCategories: user.customCategories || { income: {}, expense: {} },
      },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user with password selected
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profilePicture: user.profilePicture || 'avatar1',
        customCategories: user.customCategories || { income: {}, expense: {} },
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   GET /api/auth/profile
// @desc    Get user profile data
router.get('/auth/profile', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// @route   POST /api/auth/backup
// @desc    Store encrypted backup payload for the user
router.post('/auth/backup', protect, async (req, res) => {
  try {
    const { backupData } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.backupData = backupData || '';
    await user.save();

    res.json({ success: true, message: 'Backup saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   GET /api/auth/backup
// @desc    Retrieve encrypted backup payload for the user
router.get('/auth/backup', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ success: true, backupData: user.backupData || '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== STUBBED OUT SYNC & DATA MANAGEMENT ====================

router.post('/sync', protect, async (req, res) => {
  res.json({
    success: true,
    message: 'Sync deactivated under local-first architecture.',
    transactions: [],
    budgets: [],
    goals: [],
    subscriptions: [],
    config: { openingBalance: 0 }
  });
});

router.post('/auth/reset-data', protect, async (req, res) => {
  res.json({
    success: true,
    message: 'Reset ignored. Data is managed locally.'
  });
});

module.exports = router;
