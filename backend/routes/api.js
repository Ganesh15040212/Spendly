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

// ==================== TRANSACTION CRUD ROUTES ====================

router.get('/transactions', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/transactions', protect, async (req, res) => {
  try {
    const newTransaction = new Transaction({ ...req.body, user: req.user.id });
    const savedTransaction = await newTransaction.save();
    res.status(201).json(savedTransaction);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/transactions/:id', protect, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user.id });
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    
    const updated = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/transactions/:id', protect, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user.id });
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    
    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== BUDGET CRUD ROUTES ====================

router.get('/budgets', protect, async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user.id });
    res.json(budgets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/budgets', protect, async (req, res) => {
  try {
    const { category, limitAmount, period } = req.body;
    // Overwrite existing budget if user attempts to save duplicate category in month
    let budget = await Budget.findOne({ user: req.user.id, category, period });
    if (budget) {
      budget.limitAmount = limitAmount;
      await budget.save();
    } else {
      budget = await Budget.create({ user: req.user.id, category, limitAmount, period });
    }
    res.json(budget);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/budgets/:id', protect, async (req, res) => {
  try {
    await Budget.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== GOAL CRUD ROUTES ====================

router.get('/goals', protect, async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user.id });
    res.json(goals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/goals', protect, async (req, res) => {
  try {
    const newGoal = new Goal({ ...req.body, user: req.user.id });
    await newGoal.save();
    res.status(201).json(newGoal);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/goals/:id', protect, async (req, res) => {
  try {
    const updated = await Goal.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/goals/:id', protect, async (req, res) => {
  try {
    await Goal.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== SUBSCRIPTION CRUD ROUTES ====================

router.get('/subscriptions', protect, async (req, res) => {
  try {
    const subs = await Subscription.find({ user: req.user.id });
    res.json(subs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/subscriptions', protect, async (req, res) => {
  try {
    const newSub = new Subscription({ ...req.body, user: req.user.id });
    await newSub.save();
    res.status(201).json(newSub);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/subscriptions/:id', protect, async (req, res) => {
  try {
    await Subscription.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// ==================== BULK DATA SYNCHRONIZATION ====================

router.post('/sync', protect, async (req, res) => {
  try {
    const { transactions, budgets, goals, subscriptions, openingBalance, profilePicture, customCategories } = req.body;
    const userId = req.user.id;

    // Update User Profile details if sent
    if (profilePicture || customCategories) {
      const user = await User.findById(userId);
      if (user) {
        if (profilePicture) user.profilePicture = profilePicture;
        if (customCategories) user.customCategories = customCategories;
        await user.save();
      }
    }

    // 1. Sync User Opening Balance Configuration
    let config = await UserConfig.findOne({ user: userId });
    if (config) {
      config.openingBalance = typeof openingBalance === 'number' ? openingBalance : config.openingBalance;
      await config.save();
    } else {
      config = await UserConfig.create({ user: userId, openingBalance: openingBalance || 0 });
    }

    // 2. Sync Transactions
    if (Array.isArray(transactions)) {
      // Upsert each transaction from client
      for (const t of transactions) {
        if (!t.id) continue;
        await Transaction.findOneAndUpdate(
          { user: userId, id: t.id },
          {
            amount: t.amount,
            type: t.type,
            category: t.category,
            wallet: t.wallet || 'Cash',
            note: t.note || '',
            date: t.date,
          },
          { upsert: true }
        );
      }
      // Delete server-side transactions NOT in client list (user deleted them locally)
      const clientTxIds = transactions.map(t => t.id).filter(Boolean);
      if (clientTxIds.length > 0) {
        await Transaction.deleteMany({ user: userId, id: { $nin: clientTxIds } });
      } else {
        // Client sent empty list: delete all server-side transactions for this user
        await Transaction.deleteMany({ user: userId });
      }
    }

    // 3. Sync Budgets
    if (Array.isArray(budgets)) {
      for (const b of budgets) {
        await Budget.findOneAndUpdate(
          { user: userId, category: b.category, period: b.period },
          { limitAmount: b.limitAmount },
          { upsert: true }
        );
      }
      // Delete server budgets that are not in client list
      if (budgets.length > 0) {
        const clientBudgetKeys = budgets.map(b => `${b.category}::${b.period}`);
        const serverBudgets = await Budget.find({ user: userId });
        const toDeleteBudgets = serverBudgets.filter(b => !clientBudgetKeys.includes(`${b.category}::${b.period}`));
        if (toDeleteBudgets.length > 0) {
          await Budget.deleteMany({ _id: { $in: toDeleteBudgets.map(b => b._id) } });
        }
      } else {
        await Budget.deleteMany({ user: userId });
      }
    }

    // 4. Sync Savings Goals
    if (Array.isArray(goals)) {
      for (const g of goals) {
        if (!g.id) continue;
        await Goal.findOneAndUpdate(
          { user: userId, id: g.id },
          {
            name: g.name,
            targetAmount: g.targetAmount,
            currentAmount: g.currentAmount || 0,
            deadline: g.deadline,
          },
          { upsert: true }
        );
      }
      // Delete server goals not in client list
      const clientGoalIds = goals.map(g => g.id).filter(Boolean);
      if (clientGoalIds.length > 0) {
        await Goal.deleteMany({ user: userId, id: { $nin: clientGoalIds } });
      } else {
        await Goal.deleteMany({ user: userId });
      }
    }

    // 5. Sync Subscriptions
    if (Array.isArray(subscriptions)) {
      for (const s of subscriptions) {
        if (!s.id) continue;
        await Subscription.findOneAndUpdate(
          { user: userId, id: s.id },
          {
            name: s.name,
            cost: s.cost,
            period: s.period || 'monthly',
            nextBillingDate: s.nextBillingDate,
          },
          { upsert: true }
        );
      }
      // Delete server subscriptions not in client list
      const clientSubIds = subscriptions.map(s => s.id).filter(Boolean);
      if (clientSubIds.length > 0) {
        await Subscription.deleteMany({ user: userId, id: { $nin: clientSubIds } });
      } else {
        await Subscription.deleteMany({ user: userId });
      }
    }

    // Return Server Consolidated Data state
    const currentTransactions = await Transaction.find({ user: userId }).sort({ date: -1 });
    const currentBudgets = await Budget.find({ user: userId });
    const currentGoals = await Goal.find({ user: userId });
    const currentSubs = await Subscription.find({ user: userId });

    const updatedUser = await User.findById(userId);
    res.json({
      success: true,
      config,
      transactions: currentTransactions,
      budgets: currentBudgets,
      goals: currentGoals,
      subscriptions: currentSubs,
      profilePicture: updatedUser ? updatedUser.profilePicture : 'avatar1',
      customCategories: updatedUser ? updatedUser.customCategories : { income: {}, expense: {} },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   POST /api/auth/reset-data
// @desc    Wipe all transactions, budgets, goals, and subscriptions for the logged-in user
router.post('/auth/reset-data', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Delete user specific collections
    await Transaction.deleteMany({ user: userId });
    await Budget.deleteMany({ user: userId });
    await Goal.deleteMany({ user: userId });
    await Subscription.deleteMany({ user: userId });
    
    // Reset opening balance configuration
    await UserConfig.findOneAndUpdate(
      { user: userId },
      { openingBalance: 0 },
      { upsert: true }
    );
    
    res.json({ success: true, message: 'All user transaction data reset successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
