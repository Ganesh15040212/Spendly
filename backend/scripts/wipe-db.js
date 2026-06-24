const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');
const Subscription = require('../models/Subscription');
const UserConfig = require('../models/UserConfig');

dotenv.config();

const wipeDatabase = async () => {
  try {
    const connStr = process.env.MONGO_URI || 'mongodb://localhost:27017/spendly';
    console.log(`Connecting to MongoDB at: ${connStr}`);
    await mongoose.connect(connStr);
    
    console.log('Wiping Transactions...');
    await Transaction.deleteMany({});
    
    console.log('Wiping Budgets...');
    await Budget.deleteMany({});
    
    console.log('Wiping Goals...');
    await Goal.deleteMany({});
    
    console.log('Wiping Subscriptions...');
    await Subscription.deleteMany({});
    
    console.log('Resetting User Configs...');
    await UserConfig.deleteMany({});
    
    console.log('Database wiped successfully! (User accounts are preserved so you can still log in).');
    process.exit(0);
  } catch (err) {
    console.error('Error wiping database:', err);
    process.exit(1);
  }
};

wipeDatabase();
