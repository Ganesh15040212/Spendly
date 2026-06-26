export type LanguageCode = 'en' | 'hi' | 'ta' | 'es';

export interface TranslationDict {
  // General
  appName: string;
  cancel: string;
  confirm: string;
  yes: string;
  no: string;
  save: string;
  delete: string;
  deleteWarning: string;
  deleteTxConfirm: string;
  deleteSubConfirm: string;
  deleteBudgetConfirm: string;
  deleteGoalConfirm: string;
  success: string;
  saved: string;
  error: string;
  unknown: string;
  close: string;
  loading: string;

  // Tabs
  tabDashboard: string;
  tabBudgets: string;
  tabHistory: string;
  tabAnalytics: string;
  tabProfile: string;

  // Dashboard
  welcome: string;
  currentBalance: string;
  openingBalance: string;
  totalIncome: string;
  totalExpense: string;
  recentTransactions: string;
  noTransactions: string;
  voiceEntry: string;
  scanBill: string;
  healthScore: string;
  healthDescription: string;
  syncSuccess: string;
  syncFailed: string;
  syncing: string;
  syncNow: string;

  // Budgets & Goals
  budgets: string;
  goals: string;
  setBudget: string;
  addGoal: string;
  spentOf: string;
  limitReached75: string;
  limitReached90: string;
  limitExceeded: string;
  addFunds: string;
  target: string;
  savedSoFar: string;
  budgetCategory: string;
  budgetLimit: string;
  goalName: string;
  targetAmount: string;
  initialSavings: string;
  deadline: string;
  addFundsTitle: string;
  budgetFor: string;
  budgetEdit: string;
  goalEdit: string;

  // History
  historyTitle: string;
  searchPlaceholder: string;
  filterAll: string;
  filterToday: string;
  filterWeekly: string;
  filterMonthly: string;
  exportPdf: string;
  exportCsv: string;
  noHistoryFound: string;
  filterCustom: string;
  startDate: string;
  endDate: string;
  adjustFilters: string;
  used: string;
  savedLabel: string;
  completed: string;
  healthExcellent: string;
  healthGood: string;
  healthAverage: string;
  healthImprovement: string;
  trackCategoryLimits: string;
  noSpendingBudgets: string;
  saveSavingsGoals: string;
  noSavingsGoals: string;


  // Analytics & Subscriptions
  analyticsTitle: string;
  monthlyOverview: string;
  activeSubs: string;
  totalCommitment: string;
  addSub: string;
  subName: string;
  billingCost: string;
  billingPeriod: string;
  nextBilling: string;
  monthly: string;
  yearly: string;
  categoryExpenses: string;
  cashFlowTrend: string;
  noExpensesToAnalyze: string;
  noSubsRegistered: string;
  saveSubscription: string;
  renews: string;
  add: string;

  // Profile
  profileTitle: string;
  preferences: string;
  themeMode: string;
  themeLight: string;
  themeDark: string;
  themeVibrant: string;
  currency: string;
  language: string;
  logout: string;
  saveChanges: string;
  editName: string;
  enterName: string;
  logoutTitle: string;
  logoutDesc: string;
  savedPhoto: string;
  resetData: string;
  resetDataTitle: string;
  resetDataDesc: string;
  changePhoto: string;
  photoUpdated: string;
  resetSuccess: string;

  // Add/Edit Transaction
  addTxTitle: string;
  editTxTitle: string;
  type: string;
  income: string;
  expense: string;
  amount: string;
  wallet: string;
  category: string;
  notes: string;
  notesPlaceholder: string;
  date: string;
  selectCategory: string;
  selectWallet: string;

  // Login / Register
  signIn: string;
  signUp: string;
  email: string;
  password: string;
  fullName: string;
  phone: string;
  noAccount: string;
  haveAccount: string;
  signingIn: string;
  registering: string;
  loginPresets: string;
  userPreset: string;
  adminPreset: string;
}

export const TRANSLATIONS: Record<LanguageCode, TranslationDict> = {
  en: {
    appName: 'Spendly',
    cancel: 'Cancel',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    save: 'Save',
    delete: 'Delete',
    deleteWarning: 'Delete Warning',
    deleteTxConfirm: 'Are you sure you want to delete this transaction?',
    deleteSubConfirm: 'Are you sure you want to delete this subscription?',
    deleteBudgetConfirm: 'Are you sure you want to delete this budget?',
    deleteGoalConfirm: 'Are you sure you want to delete this goal?',
    success: 'Success',
    saved: 'Settings updated successfully!',
    error: 'Error',
    unknown: 'Unknown',
    close: 'Close',
    loading: 'Loading...',

    tabDashboard: 'Dashboard',
    tabBudgets: 'Budgets & Goals',
    tabHistory: 'History',
    tabAnalytics: 'Analytics',
    tabProfile: 'Profile',

    welcome: 'Hello',
    currentBalance: 'Current Balance',
    openingBalance: 'Opening',
    totalIncome: 'Total Income',
    totalExpense: 'Total Expense',
    recentTransactions: 'Recent Transactions',
    noTransactions: 'No transactions recorded yet.',
    voiceEntry: 'Voice Entry',
    scanBill: 'Scan Bill OCR',
    healthScore: 'Financial Health',
    healthDescription: 'Your overall financial score based on savings & budgets.',
    syncSuccess: 'Synced successfully',
    syncFailed: 'Sync failed',
    syncing: 'Syncing data...',
    syncNow: 'Sync Now',

    budgets: 'Budgets',
    goals: 'Savings Goals',
    setBudget: 'Set Budget',
    addGoal: 'Add Goal',
    spentOf: 'spent of',
    limitReached75: '⚠️ 75% Limit Reached',
    limitReached90: '⚠️ 90% Limit Reached',
    limitExceeded: '🚨 Budget Exceeded!',
    addFunds: 'Add Funds',
    target: 'Target',
    savedSoFar: 'saved so far',
    budgetCategory: 'BUDGET CATEGORY',
    budgetLimit: 'BUDGET LIMIT AMOUNT',
    goalName: 'SAVINGS GOAL NAME',
    targetAmount: 'TARGET SAVINGS AMOUNT',
    initialSavings: 'INITIAL SAVINGS',
    deadline: 'DEADLINE DATE',
    addFundsTitle: 'Add Funds to',
    budgetFor: 'Budget for',
    budgetEdit: 'Edit Budget',
    goalEdit: 'Edit Goal',

    historyTitle: 'Transaction History',
    searchPlaceholder: 'Search notes...',
    filterAll: 'All',
    filterToday: 'Today',
    filterWeekly: 'Weekly',
    filterMonthly: 'Monthly',
    exportPdf: 'Export PDF',
    exportCsv: 'Export CSV',
    noHistoryFound: 'No transactions found matching filters.',
    filterCustom: 'Custom',
    startDate: 'Start Date',
    endDate: 'End Date',
    adjustFilters: 'Try adjusting your filters or search terms.',
    used: 'Used',
    savedLabel: 'saved',
    completed: 'Completed',
    healthExcellent: 'Excellent',
    healthGood: 'Good',
    healthAverage: 'Average',
    healthImprovement: 'Needs Improvement',
    trackCategoryLimits: 'Track category spending limits for the current month.',
    noSpendingBudgets: 'No spending budgets configured.',
    saveSavingsGoals: 'Save up money systematically for future expenses.',
    noSavingsGoals: 'No savings goals added yet.',


    analyticsTitle: 'Analytics & Subs',
    monthlyOverview: 'Monthly Overview (Last 6 Months)',
    activeSubs: 'Active Subscriptions',
    totalCommitment: 'Total monthly commitment',
    addSub: 'Add Subscription',
    subName: 'SUBSCRIPTION NAME',
    billingCost: 'BILLING COST',
    billingPeriod: 'BILLING PERIOD',
    nextBilling: 'NEXT BILLING DATE',
    monthly: 'Monthly',
    yearly: 'Yearly',
    categoryExpenses: 'Category Expenses',
    cashFlowTrend: 'Cash Flow Trend',
    noExpensesToAnalyze: 'No expenses recorded to analyze.',
    noSubsRegistered: 'No active subscription plans registered.',
    saveSubscription: 'Save Subscription',
    renews: 'Renews',
    add: 'Add',

    profileTitle: 'Profile Settings',
    preferences: 'PREFERENCES',
    themeMode: 'Theme Mode',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeVibrant: 'Vibrant Indigo',
    currency: 'Preferred Currency',
    language: 'Language',
    logout: 'Log Out',
    saveChanges: 'Save Profile Changes',
    editName: 'EDIT USERNAME',
    enterName: 'Enter your name',
    logoutTitle: 'Logout Confirmation',
    logoutDesc: 'Are you sure you want to log out from Spendly? Your active offline data will remain saved on this device.',
    savedPhoto: 'Choose Gallery Photo',
    resetData: 'Reset All Data',
    resetDataTitle: 'Reset Confirmation',
    resetDataDesc: 'Are you sure you want to reset all data? This will permanently delete all your transactions, budgets, goals, and subscriptions from the local device and server.',
    changePhoto: 'Change Photo',
    photoUpdated: 'Profile picture updated!',
    resetSuccess: 'Database and cache reset successfully!',

    addTxTitle: 'Add Transaction',
    editTxTitle: 'Edit Transaction',
    type: 'TYPE',
    income: 'Income',
    expense: 'Expense',
    amount: 'Amount',
    wallet: 'PAYMENT WALLET',
    category: 'CATEGORY',
    notes: 'NOTES / DESCRIPTION',
    notesPlaceholder: 'Enter transaction details...',
    date: 'DATE',
    selectCategory: 'Select Category',
    selectWallet: 'Select Wallet',

    signIn: 'Sign In',
    signUp: 'Sign Up',
    email: 'Email Address',
    password: 'Password',
    fullName: 'Full Name',
    phone: 'Phone Number',
    noAccount: "Don't have an account?",
    haveAccount: 'Already have an account?',
    signingIn: 'Signing in...',
    registering: 'Creating account...',
    loginPresets: 'DEMO PRESETS',
    userPreset: 'User Demo',
    adminPreset: 'Admin Demo'
  },
  hi: {
    appName: 'स्पेंडली',
    cancel: 'रद्द करें',
    confirm: 'पुष्टि करें',
    yes: 'हाँ',
    no: 'नहीं',
    save: 'सहेजें',
    delete: 'हटाएं',
    deleteWarning: 'हटाने की चेतावनी',
    deleteTxConfirm: 'क्या आप वाकई इस लेन-देन को हटाना चाहते हैं?',
    deleteSubConfirm: 'क्या आप वाकई इस सदस्यता को हटाना चाहते हैं?',
    deleteBudgetConfirm: 'क्या आप वाकई इस बजट को हटाना चाहते हैं?',
    deleteGoalConfirm: 'क्या आप वाकई इस लक्ष्य को हटाना चाहते हैं?',
    success: 'सफलता',
    saved: 'सेटिंग्स सफलतापूर्वक अपडेट की गईं!',
    error: 'त्रुटि',
    unknown: 'अअज्ञात',
    close: 'बंद करें',
    loading: 'लोड हो रहा है...',

    tabDashboard: 'डैशबोर्ड',
    tabBudgets: 'बजट और लक्ष्य',
    tabHistory: 'इतिहास',
    tabAnalytics: 'विश्लेषण',
    tabProfile: 'प्रोफ़ाइल',

    welcome: 'नमस्ते',
    currentBalance: 'वर्तमान शेष',
    openingBalance: 'शुरुआती',
    totalIncome: 'कुल आय',
    totalExpense: 'कुल खर्च',
    recentTransactions: 'हाल के लेन-देन',
    noTransactions: 'अभी तक कोई लेन-देन दर्ज नहीं किया गया है।',
    voiceEntry: 'आवाज प्रविष्टि',
    scanBill: 'बिल स्कैन OCR',
    healthScore: 'वित्तीय स्वास्थ्य',
    healthDescription: 'बचत और बजट के आधार पर आपका समग्र वित्तीय स्कोर।',
    syncSuccess: 'सफलतापूर्वक सिंक किया गया',
    syncFailed: 'सिंक विफल रहा',
    syncing: 'डेटा सिंक हो रहा है...',
    syncNow: 'सिंक करें',

    budgets: 'बजट',
    goals: 'बचत लक्ष्य',
    setBudget: 'बजट सेट करें',
    addGoal: 'लक्ष्य जोड़ें',
    spentOf: 'का खर्च',
    limitReached75: '⚠️ 75% सीमा पार',
    limitReached90: '⚠️ 90% सीमा पार',
    limitExceeded: '🚨 बजट समाप्त!',
    addFunds: 'फंड जोड़ें',
    target: 'लक्ष्य',
    savedSoFar: 'अब तक बचाया',
    budgetCategory: 'बजट श्रेणी',
    budgetLimit: 'बजट सीमा राशि',
    goalName: 'बचत लक्ष्य का नाम',
    targetAmount: 'लक्षित बचत राशि',
    initialSavings: 'प्रारंभिक बचत',
    deadline: 'समय सीमा तिथि',
    addFundsTitle: 'फंड जोड़ें',
    budgetFor: 'बजट के लिए',
    budgetEdit: 'बजट बदलें',
    goalEdit: 'लक्ष्य बदलें',

    historyTitle: 'लेन-देन इतिहास',
    searchPlaceholder: 'खोजें...',
    filterAll: 'सभी',
    filterToday: 'आज',
    filterWeekly: 'साप्ताहिक',
    filterMonthly: 'मासिक',
    exportPdf: 'पीडीएफ एक्सपोर्ट',
    exportCsv: 'सीएसवी एक्सपोर्ट',
    noHistoryFound: 'कोई लेन-देन नहीं मिला।',
    filterCustom: 'कस्टम',
    startDate: 'शुरुआत तारीख',
    endDate: 'अंत तारीख',
    adjustFilters: 'फ़िल्टर या खोज शब्द बदलें।',
    used: 'उपयोग',
    savedLabel: 'बचत',
    completed: 'पूर्ण',
    healthExcellent: 'उत्कृष्ट',
    healthGood: 'अच्छा',
    healthAverage: 'औसत',
    healthImprovement: 'सुधार की आवश्यकता',
    trackCategoryLimits: 'इस महीने की श्रेणी सीमाओं को ट्रैक करें।',
    noSpendingBudgets: 'कोई बजट निर्धारित नहीं है।',
    saveSavingsGoals: 'भविष्य के लिए व्यवस्थित रूप से बचत करें।',
    noSavingsGoals: 'अभी तक कोई बचत लक्ष्य नहीं जोड़ा गया।',


    analyticsTitle: 'विश्लेषण व सब्स',
    monthlyOverview: 'मासिक समीक्षा (पिछले 6 महीने)',
    activeSubs: 'सक्रिय सदस्यताएँ',
    totalCommitment: 'कुल मासिक प्रतिबद्धता',
    addSub: 'सदस्यता जोड़ें',
    subName: 'सदस्यता का नाम',
    billingCost: 'बिलिंग लागत',
    billingPeriod: 'बिलिंग अवधि',
    nextBilling: 'अगली बिलिंग तिथि',
    monthly: 'मासिक',
    yearly: 'वार्षिक',
    categoryExpenses: 'श्रेणीवार खर्च',
    cashFlowTrend: 'नकद प्रवाह प्रवृत्ति',
    noExpensesToAnalyze: 'विश्लेषण करने के लिए कोई खर्च दर्ज नहीं है।',
    noSubsRegistered: 'कोई सक्रिय सदस्यता योजना पंजीकृत नहीं है।',
    saveSubscription: 'सदस्यता सहेजें',
    renews: 'नवीनीकरण',
    add: 'जोड़ें',

    profileTitle: 'प्रोफ़ाइल सेटिंग्स',
    preferences: 'प्राथमिकताएं',
    themeMode: 'थीम मोड',
    themeLight: 'लाइट',
    themeDark: 'डार्क',
    themeVibrant: 'वाइब्रेंट इंडिगो',
    currency: 'पसंदीदा मुद्रा',
    language: 'भाषा',
    logout: 'लॉग आउट',
    saveChanges: 'बदलाव सहेजें',
    editName: 'उपयोगकर्ता नाम बदलें',
    enterName: 'अपना नाम दर्ज करें',
    logoutTitle: 'लॉगआउट पुष्टि',
    logoutDesc: 'क्या आप वाकई स्पेंडली से लॉग आउट करना चाहते हैं? आपका स्थानीय डेटा इस डिवाइस पर सुरक्षित रहेगा।',
    savedPhoto: 'गैलरी फोटो चुनें',
    resetData: 'सभी डेटा मिटाएं',
    resetDataTitle: 'रीसेट की पुष्टि',
    resetDataDesc: 'क्या आप वाकई सभी डेटा मिटाना चाहते हैं? यह इस डिवाइस और सर्वर से आपके सभी लेनदेन, बजट, लक्ष्यों और सदस्यताओं को स्थायी रूप से हटा देगा।',
    changePhoto: 'फोटो बदलें',
    photoUpdated: 'प्रोफ़ाइल चित्र अपडेट किया गया!',
    resetSuccess: 'डेटाबेस और कैश सफलतापूर्वक रीसेट किया गया!',

    addTxTitle: 'लेन-देन जोड़ें',
    editTxTitle: 'लेन-देना संपादित करें',
    type: 'प्रकार',
    income: 'आय',
    expense: 'खर्च',
    amount: 'राशि',
    wallet: 'भुगतान वॉलेट',
    category: 'श्रेणी',
    notes: 'टिप्पणी / विवरण',
    notesPlaceholder: 'लेन-देन का विवरण लिखें...',
    date: 'तिथि',
    selectCategory: 'श्रेणी चुनें',
    selectWallet: 'वॉलेट चुनें',

    signIn: 'साइन इन',
    signUp: 'साइन अप',
    email: 'ईमेल पता',
    password: 'पासवर्ड',
    fullName: 'पूरा नाम',
    phone: 'फ़ोन नंबर',
    noAccount: 'खाता नहीं है?',
    haveAccount: 'पहले से खाता है?',
    signingIn: 'लॉग इन हो रहा है...',
    registering: 'खाता बन रहा है...',
    loginPresets: 'डेमो क्रेडेंशियल्स',
    userPreset: 'यूज़र डेमो',
    adminPreset: 'एडमिन डेमो'
  },
  ta: {
    appName: 'ஸ்பெண்ட்லி',
    cancel: 'ரத்து செய்',
    confirm: 'உறுதிப்படுத்து',
    yes: 'ஆம்',
    no: 'இல்லை',
    save: 'சேமி',
    delete: 'நீக்கு',
    deleteWarning: 'நீக்குதல் எச்சரிக்கை',
    deleteTxConfirm: 'இந்த பரிவர்த்தனையை நீக்க விரும்புகிறீர்களா?',
    deleteSubConfirm: 'இந்த சந்தாவை நீக்க விரும்புகிறீர்களா?',
    deleteBudgetConfirm: 'இந்த வரவுசெலவுத் திட்டத்தை நீக்க விரும்புகிறீர்களா?',
    deleteGoalConfirm: 'இந்த இலக்கை நீக்க விரும்புகிறீர்களா?',
    success: 'வெற்றி',
    saved: 'அமைப்புகள் வெற்றிகரமாக சேமிக்கப்பட்டன!',
    error: 'பிழை',
    unknown: 'தெரியாதது',
    close: 'மூடு',
    loading: 'ஏற்றப்படுகிறது...',

    tabDashboard: 'முகப்பு',
    tabBudgets: 'திட்டம் & இலக்கு',
    tabHistory: 'வரலாறு',
    tabAnalytics: 'பகுப்பாய்வு',
    tabProfile: 'சுயவிவரம்',

    welcome: 'வணக்கம்',
    currentBalance: 'தற்போதைய இருப்பு',
    openingBalance: 'தொடக்க இருப்பு',
    totalIncome: 'மொத்த வருமானம்',
    totalExpense: 'மொத்த செலவு',
    recentTransactions: 'சமீபத்திய பரிவர்த்தனைகள்',
    noTransactions: 'பரிவர்த்தனைகள் எதுவும் பதிவு செய்யப்படவில்லை.',
    voiceEntry: 'குரல் பதிவு',
    scanBill: 'பில் ஸ்கேன் OCR',
    healthScore: 'நிதி நிலைமை',
    healthDescription: 'உங்கள் சேமிப்பு மற்றும் வரவு செலவுத் திட்டங்களின் அடிப்படையில் நிதி மதிப்பெண்.',
    syncSuccess: 'வெற்றிகரமாக ஒத்திசைக்கப்பட்டது',
    syncFailed: 'ஒத்திசைவு தோல்வியடைந்தது',
    syncing: 'ஒத்திசைக்கப்படுகிறது...',
    syncNow: 'ஒத்திசை',

    budgets: 'திட்டங்கள்',
    goals: 'சேமிப்பு இலக்கு',
    setBudget: 'திட்டத்தை அமை',
    addGoal: 'இலக்கைச் சேர்',
    spentOf: 'செலவு செய்யப்பட்டது',
    limitReached75: '⚠️ 75% வரம்பு எட்டப்பட்டது',
    limitReached90: '⚠️ 90% வரம்பு எட்டப்பட்டது',
    limitExceeded: '🚨 வரம்பு மீறப்பட்டது!',
    addFunds: 'பணம் சேர்',
    target: 'இலக்கு',
    savedSoFar: 'சேமிக்கப்பட்டது',
    budgetCategory: 'வரவுசெலவு வகை',
    budgetLimit: 'வரவுசெலவு வரம்பு தொகை',
    goalName: 'சேமிப்பு இலக்கு பெயர்',
    targetAmount: 'இலக்கு சேமிப்பு தொகை',
    initialSavings: 'தொடக்க சேமிப்பு',
    deadline: 'இறுதி தேதி',
    addFundsTitle: 'பணம் சேர்க்கவும்',
    budgetFor: 'திட்டம்',
    budgetEdit: 'திட்டத்தை மாற்று',
    goalEdit: 'இலக்கை மாற்று',

    historyTitle: 'பரிவர்த்தனை வரலாறு',
    searchPlaceholder: 'தேடுக...',
    filterAll: 'அனைத்தும்',
    filterToday: 'இன்று',
    filterWeekly: 'வாரம்',
    filterMonthly: 'மாதம்',
    exportPdf: 'PDF ஏற்றுமதி',
    exportCsv: 'CSV ஏற்றுமதி',
    noHistoryFound: 'பரிவர்த்தனைகள் எதுவும் இல்லை.',
    filterCustom: 'தனிப்பயன்',
    startDate: 'தொடக்க தேதி',
    endDate: 'இறுதி தேதி',
    adjustFilters: 'வடிப்பான்கள் அல்லது தேடல் சொற்களை சரிசெய்யுங்கள்.',
    used: 'பயன்படுத்தப்பட்டது',
    savedLabel: 'சேமிக்கப்பட்டது',
    completed: 'பூர்த்தி',
    healthExcellent: 'சிறப்பானது',
    healthGood: 'நல்லது',
    healthAverage: 'சராசரி',
    healthImprovement: 'மேம்பாடு தேவை',
    trackCategoryLimits: 'இந்த மாதம் வகை செலவு வரம்புகளை கண்காணிக்கவும்.',
    noSpendingBudgets: 'செலவு திட்டமிட்டப்படவில்லை.',
    saveSavingsGoals: 'சேமிப்பு இலக்குகளை திட்டமிட்டு எடுங்கள்.',
    noSavingsGoals: 'சேமிப்பு இலக்குகள் எதுவும் சேர்க்கப்படவில்லை.',


    analyticsTitle: 'பகுப்பாய்வு',
    monthlyOverview: 'மாதாந்திர மேலோட்டம் (கடந்த 6 மாதங்கள்)',
    activeSubs: 'செயலில் உள்ள சந்தாக்கள்',
    totalCommitment: 'மொத்த மாதாந்திர செலவு',
    addSub: 'சந்தாவைச் சேர்',
    subName: 'சந்தா பெயர்',
    billingCost: 'பில்லிங் கட்டணம்',
    billingPeriod: 'பில்லிங் காலம்',
    nextBilling: 'அடுத்த பில்லிங் தேதி',
    monthly: 'மாதம்',
    yearly: 'வருடம்',
    categoryExpenses: 'வகை வாரியான செலவுகள்',
    cashFlowTrend: 'பணப் புழக்கப் போக்கு',
    noExpensesToAnalyze: 'பகுப்பாய்வு செய்ய செலவுகள் எதுவும் பதிவு செய்யப்படவில்லை.',
    noSubsRegistered: 'செயலில் உள்ள சந்தா திட்டங்கள் எதுவும் பதிவு செய்யப்படவில்லை.',
    saveSubscription: 'சந்தாவைச் சேமி',
    renews: 'புதுப்பித்தல்',
    add: 'சேர்',

    profileTitle: 'சுயவிவர அமைப்புகள்',
    preferences: 'விருப்பங்கள்',
    themeMode: 'தீம் முறை',
    themeLight: 'பகல் முறை',
    themeDark: 'இரவு முறை',
    themeVibrant: 'இண்டிகோ முறை',
    currency: 'விருப்பமான நாணயம்',
    language: 'மொழி',
    logout: 'வெளியேறு',
    saveChanges: 'அமைப்புகளைச் சேமி',
    editName: 'பயனர் பெயரை மாற்றுக',
    enterName: 'உங்கள் பெயரை உள்ளிடுக',
    logoutTitle: 'வெளியேறுதல் உறுதிப்படுத்தல்',
    logoutDesc: 'நீங்கள் நிச்சயமாக ஸ்பெண்ட்லியில் இருந்து வெளியேற விரும்புகிறீர்களா? உங்கள் ஆஃப்லைன் தரவு இந்த சாதனத்தில் சேமிக்கப்படும்.',
    savedPhoto: 'கேலரி படம்',
    resetData: 'தரவை மீட்டமை',
    resetDataTitle: 'மீட்டமைப்பு உறுதிப்படுத்தல்',
    resetDataDesc: 'நீங்கள் நிச்சயமாக எல்லா தரவையும் அழிக்க விரும்புகிறீர்களா? இது சாதனத்திலும் சர்வரிலும் உள்ள உங்கள் பரிவர்த்தனைகள், திட்டங்கள், இலக்குகள் மற்றும் சந்தாக்கள் அனைத்தையும் நிரந்தரமாக நீக்கிவிடும்.',
    changePhoto: 'படம் மாற்று',
    photoUpdated: 'சுயவிவர படம் மாற்றப்பட்டது!',
    resetSuccess: 'தரவுத்தளம் வெற்றிகரமாக மீட்டமைக்கப்பட்டது!',

    addTxTitle: 'பரிவர்த்தனை சேர்',
    editTxTitle: 'பரிவர்த்தனை திருத்து',
    type: 'வகை',
    income: 'வரவு',
    expense: 'செலவு',
    amount: 'தொகை',
    wallet: 'பணப்பை',
    category: 'பிரிவு',
    notes: 'குறிப்புகள் / விளக்கம்',
    notesPlaceholder: 'விவரத்தை உள்ளிடவும்...',
    date: 'தேதி',
    selectCategory: 'பிரிவைத் தேர்ந்தெடு',
    selectWallet: 'பணப்பையைத் தேர்ந்தெடு',

    signIn: 'உள்நுழை',
    signUp: 'பதிவு செய்',
    email: 'மின்னஞ்சல் முகவரி',
    password: 'கடவுச்சொல்',
    fullName: 'முழு பெயர்',
    phone: 'தொலைபேசி எண்',
    noAccount: 'கணக்கு இல்லையா?',
    haveAccount: 'ஏற்கனவே கணக்கு உள்ளதா?',
    signingIn: 'உள்நுழைகிறது...',
    registering: 'பதிவு செய்யப்படுகிறது...',
    loginPresets: 'மாதிரி கணக்குகள்',
    userPreset: 'பயனர் மாதிரி',
    adminPreset: 'நிர்வாகி மாதிரி'
  },
  es: {
    appName: 'Spendly',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    yes: 'Sí',
    no: 'No',
    save: 'Guardar',
    delete: 'Eliminar',
    deleteWarning: 'Advertencia de eliminación',
    deleteTxConfirm: '¿Está seguro de que desea eliminar esta transacción?',
    deleteSubConfirm: '¿Está seguro de que desea eliminar esta suscripción?',
    deleteBudgetConfirm: '¿Está seguro de que desea eliminar este presupuesto?',
    deleteGoalConfirm: '¿Está seguro de que desea eliminar este objetivo?',
    success: 'Éxito',
    saved: '¡Ajustes guardados con éxito!',
    error: 'Error',
    unknown: 'Desconocido',
    close: 'Cerrar',
    loading: 'Cargando...',

    tabDashboard: 'Inicio',
    tabBudgets: 'Presupuestos',
    tabHistory: 'Historial',
    tabAnalytics: 'Análisis',
    tabProfile: 'Perfil',

    welcome: 'Hola',
    currentBalance: 'Saldo Actual',
    openingBalance: 'Saldo Inicial',
    totalIncome: 'Ingresos Totales',
    totalExpense: 'Gastos Totales',
    recentTransactions: 'Transacciones Recientes',
    noTransactions: 'Aún no hay transacciones registradas.',
    voiceEntry: 'Entrada de Voz',
    scanBill: 'Escanear Factura',
    healthScore: 'Salud Financiera',
    healthDescription: 'Tu puntuación financiera basada en ahorros y presupuestos.',
    syncSuccess: 'Sincronizado con éxito',
    syncFailed: 'Fallo al sincronizar',
    syncing: 'Sincronizando datos...',
    syncNow: 'Sincronizar ahora',

    budgets: 'Presupuestos',
    goals: 'Objetivos de Ahorro',
    setBudget: 'Establecer Presupuesto',
    addGoal: 'Añadir Objetivo',
    spentOf: 'gastado de',
    limitReached75: '⚠️ Límite del 75% alcanzado',
    limitReached90: '⚠️ Límite del 90% alcanzado',
    limitExceeded: '🚨 ¡Presupuesto Excedido!',
    addFunds: 'Añadir Fondos',
    target: 'Meta',
    savedSoFar: 'ahorrado',
    budgetCategory: 'CATEGORÍA DE PRESUPUESTO',
    budgetLimit: 'MONTO LÍMITE',
    goalName: 'NOMBRE DEL OBJETIVO',
    targetAmount: 'MONTO OBJETIVO',
    initialSavings: 'AHORRO INICIAL',
    deadline: 'FECHA LÍMITE',
    addFundsTitle: 'Añadir fondos a',
    budgetFor: 'Presupuesto para',
    budgetEdit: 'Editar Presupuesto',
    goalEdit: 'Editar Objetivo',

    historyTitle: 'Historial de Transacciones',
    searchPlaceholder: 'Buscar notas...',
    filterAll: 'Todo',
    filterToday: 'Hoy',
    filterWeekly: 'Semanal',
    filterMonthly: 'Mensual',
    exportPdf: 'Exportar PDF',
    exportCsv: 'Exportar CSV',
    noHistoryFound: 'No se encontraron transacciones.',
    filterCustom: 'Personalizado',
    startDate: 'Fecha Inicio',
    endDate: 'Fecha Fin',
    adjustFilters: 'Ajuste sus filtros o términos de búsqueda.',
    used: 'Usado',
    savedLabel: 'ahorrado',
    completed: 'Completado',
    healthExcellent: 'Excelente',
    healthGood: 'Bueno',
    healthAverage: 'Promedio',
    healthImprovement: 'Necesita mejorar',
    trackCategoryLimits: 'Controla los límites de gasto por categoría del mes.',
    noSpendingBudgets: 'No hay presupuestos configurados.',
    saveSavingsGoals: 'Ahorra dinero para gastos futuros.',
    noSavingsGoals: 'Aún no se han agregado metas de ahorro.',


    analyticsTitle: 'Análisis y Subs',
    monthlyOverview: 'Resumen Mensual (Últimos 6 Meses)',
    activeSubs: 'Suscripciones Activas',
    totalCommitment: 'Compromiso mensual total',
    addSub: 'Añadir Suscripción',
    subName: 'NOMBRE DE SUSCRIPCIÓN',
    billingCost: 'COSTO DE FACTURACIÓN',
    billingPeriod: 'PERIODO DE FACTURACIÓN',
    nextBilling: 'PRÓXIMA FECHA DE PAGO',
    monthly: 'Mensual',
    yearly: 'Anual',
    categoryExpenses: 'Gastos por Categoría',
    cashFlowTrend: 'Tendencia de Flujo de Caja',
    noExpensesToAnalyze: 'No hay gastos registrados para analizar.',
    noSubsRegistered: 'No hay planes de suscripción activos registrados.',
    saveSubscription: 'Guardar Suscripción',
    renews: 'Renueva',
    add: 'Añadir',

    profileTitle: 'Ajustes de Perfil',
    preferences: 'PREFERENCIAS',
    themeMode: 'Modo de Tema',
    themeLight: 'Claro',
    themeDark: 'Oscuro',
    themeVibrant: 'Indigo Vibrante',
    currency: 'Moneda Preferida',
    language: 'Idioma',
    logout: 'Cerrar Sesión',
    saveChanges: 'Guardar Ajustes',
    editName: 'EDITAR NOMBRE',
    enterName: 'Ingresa tu nombre',
    logoutTitle: 'Confirmación de Salida',
    logoutDesc: '¿Está seguro de que desea cerrar sesión en Spendly? Sus datos locales seguirán guardados en este dispositivo.',
    savedPhoto: 'Elegir de la Galería',
    resetData: 'Restablecer Datos',
    resetDataTitle: 'Confirmación de Restablecimiento',
    resetDataDesc: '¿Está seguro de que desea borrar todos los datos? Esto eliminará de forma permanente todas sus transacciones, presupuestos, metas y suscripciones del dispositivo local y del servidor.',
    changePhoto: 'Cambiar Foto',
    photoUpdated: '¡Foto de perfil actualizada!',
    resetSuccess: '¡Datos restablecidos con éxito!',

    addTxTitle: 'Añadir Transacción',
    editTxTitle: 'Editar Transacción',
    type: 'TIPO',
    income: 'Ingresos',
    expense: 'Gastos',
    amount: 'Monto',
    wallet: 'BILLETERA',
    category: 'CATEGORÍA',
    notes: 'NOTAS / DESCRIPCIÓN',
    notesPlaceholder: 'Detalles de la transacción...',
    date: 'FECHA',
    selectCategory: 'Seleccionar Categoría',
    selectWallet: 'Seleccionar Billetera',

    signIn: 'Iniciar Sesión',
    signUp: 'Registrarse',
    email: 'Correo Electrónico',
    password: 'Contraseña',
    fullName: 'Nombre Completo',
    phone: 'Número de Teléfono',
    noAccount: '¿No tienes una cuenta?',
    haveAccount: '¿Ya tienes una cuenta?',
    signingIn: 'Iniciando sesión...',
    registering: 'Creando cuenta...',
    loginPresets: 'PREAJUSTES DE DEMO',
    userPreset: 'Demo de Usuario',
    adminPreset: 'Demo de Admin'
  }
};

export const translateCategory = (category: string, lang: LanguageCode): string => {
  const translations: Record<string, Record<LanguageCode, string>> = {
    Salary: { en: 'Salary', hi: 'वेतन', ta: 'சம்பளம்', es: 'Salario' },
    Bonus: { en: 'Bonus', hi: 'बोनस', ta: 'போனஸ்', es: 'Bono' },
    Business: { en: 'Business', hi: 'व्यवसाय', ta: 'வணிகம்', es: 'Negocios' },
    PeerShare: { en: 'Peer Transfer', hi: 'सहकर्मी स्थानांतरण', ta: 'நண்பர்கள் பரிமாற்றம்', es: 'Transferencia de pares' },
    'Peer Transfer': { en: 'Peer Transfer', hi: 'सहकर्मी स्थानांतरण', ta: 'நண்பர்கள் பரிமாற்றம்', es: 'Transferencia de pares' },
    Freelance: { en: 'Freelance', hi: 'स्वतंत्र कार्य', ta: 'சுயதொழில்', es: 'Trabajo freelance' },
    Investments: { en: 'Investments', hi: 'निवेश', ta: 'முதலீடுகள்', es: 'Inversiones' },
    RentIncome: { en: 'Rental Income', hi: 'किराया आय', ta: 'வாடகை வருமானம்', es: 'Ingresos por alquiler' },
    'Rental Income': { en: 'Rental Income', hi: 'किराया आय', ta: 'வாடகை வருமானம்', es: 'Ingresos por alquiler' },
    Refund: { en: 'Refunds/Cashback', hi: 'धनवापसी/कैशबैक', ta: 'பணத்தைத் திரும்பப் பெறுதல்', es: 'Reembolsos/Cashback' },
    'Refunds/Cashback': { en: 'Refunds/Cashback', hi: 'धनवापसी/कैशबैक', ta: 'பணத்தைத் திரும்பப் பெறுதல்', es: 'Reembolsos/Cashback' },
    Other: { en: 'Other', hi: 'अन्य', ta: 'இதர', es: 'Otro' },
    Food: { en: 'Food', hi: 'भोजन', ta: 'உணவு', es: 'Comida' },
    Travel: { en: 'Travel', hi: 'यात्रा', ta: 'பயணம்', es: 'Viaje' },
    Shopping: { en: 'Shopping', hi: 'खरीदारी', ta: 'ஷாப்பிங்', es: 'Compras' },
    Medical: { en: 'Medical', hi: 'चिकित्सा', ta: 'மருத்துவம்', es: 'Médico' },
    Entertainment: { en: 'Entertainment', hi: 'मनोरंजन', ta: 'பொழுதுபோக்கு', es: 'Entretenimiento' },
    Bills: { en: 'Bills', hi: 'विधेयक', ta: 'பில்கள்', es: 'Facturas' },
    Groceries: { en: 'Groceries', hi: 'किराना', ta: 'மளிகை பொருட்கள்', es: 'Comestibles' },
    Fuel: { en: 'Fuel', hi: 'ईंधन', ta: 'எரிபொருள்', es: 'Combustible' },
    Education: { en: 'Education', hi: 'शिक्षा', ta: 'கல்வி', es: 'Educación' },
    Subscriptions: { en: 'Subscriptions', hi: 'सदस्यता', ta: 'சந்தாக்கள்', es: 'Suscripciones' },
    RentEMI: { en: 'Rent & Loans', hi: 'किराया और ऋण', ta: 'வாடகை & கடன்கள்', es: 'Alquiler y Préstamos' },
    'Rent & Loans': { en: 'Rent & Loans', hi: 'किराया और ऋण', ta: 'வாடகை & கடன்கள்', es: 'Alquiler y Préstamos' },
    Insurance: { en: 'Insurance', hi: 'बीमा', ta: 'காப்பீடு', es: 'Seguro' },
    GiftsCharity: { en: 'Gifts & Charity', hi: 'उपहार और दान', ta: 'பரிசுகள் & தொண்டு', es: 'Regalos y Caridad' },
    'Gifts & Charity': { en: 'Gifts & Charity', hi: 'उपहार और दान', ta: 'பரிசுகள் & தொண்டு', es: 'Regalos y Caridad' },
    Taxes: { en: 'Taxes', hi: 'कर', ta: 'வரிகள்', es: 'Impuestos' },
  };
  return translations[category]?.[lang] || category;
};

export const translateWallet = (wallet: string, lang: LanguageCode): string => {
  const translations: Record<string, Record<LanguageCode, string>> = {
    Cash: { en: 'Cash', hi: 'नकद', ta: 'ரோக்கம்', es: 'Efectivo' },
    Bank: { en: 'Bank', hi: 'बैंक', ta: 'வங்கி', es: 'Banco' },
    UPI: { en: 'UPI', hi: 'UPI', ta: 'UPI', es: 'UPI' },
    'Credit Card': { en: 'Credit Card', hi: 'क्रेडिट कार्ड', ta: 'கிரெடிட் கார்டு', es: 'Tarjeta de crédito' },
    'Digital Wallet': { en: 'Digital Wallet', hi: 'डिजिटल वॉलेट', ta: 'டிஜிட்டல் வாலட்', es: 'Monedero digital' }
  };
  return translations[wallet]?.[lang] || wallet;
};


