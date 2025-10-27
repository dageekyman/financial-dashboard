export const initialOtherAssets = [
    { type: 'Cash', description: 'Total Cash & Savings (Banks, etc.)', value: 108486.17 },
    { type: 'Vehicle', description: 'Nissan Versa', value: 2540.00 },
    { type: 'Vehicle', description: 'Nissan Altima', value: 5810.00 },
];

export const initialLiabilities = [
    { type: 'Mortgage', description: 'Primary Residence Mortgage', balance: 0 },
    { type: 'Car Loan', description: 'Car Loan (if any)', balance: 0 },
    { type: 'Credit Card', description: 'Total Credit Card Debt', balance: 0 },
];

export const initialIncomeSources = [
    // Description changed slightly to be generic
    { description: 'Primary Income Source (Net Monthly)', amount: 5441.64 },
    { description: 'Rental Income (Net Monthly)', amount: 1125.00 },
];

export const initialExpenses = [
    { category: 'Housing - HOA (Primary)', amount: 1551.38 },
    { category: 'Housing - Property Taxes (Primary)', amount: 406.15 },
    { category: 'Housing - Homeowners Insurance (Primary)', amount: 235.00 },
    { category: 'Car Insurance', amount: 136.00 },
    { category: 'Utilities (Home)', amount: 98.00 },
    { category: 'Internet', amount: 83.00 },
    { category: 'Phone', amount: 15.00 },
    { category: 'Transportation (Gas/Fuel)', amount: 85.00 },
    { category: 'Food (Groceries & Dining Out)', amount: 514.00 },
    { category: 'Retirement Investments', amount: 1733.34 },
    { category: 'Paramount+', amount: 5.00 },
    { category: 'ESPN+', amount: 9.45 },
    { category: 'Netflix', amount: 20.19 },
    { category: 'Google Storage', amount: 1.99 },
];


export const initialInvestments = [ // Section 5 Main Portfolio investments
    // Holder names changed slightly to be generic
    { holder: 'Person 1', accountType: 'Roth IRA', fund: 'Vanguard Roth IRA', currentValue: 108301.57, monthlyContribution: 666.67, expectedReturn: 8, expenseRatio: 0.08 },
    { holder: 'Person 2', accountType: 'Roth IRA', fund: 'Vanguard Roth IRA', currentValue: 107329.43, monthlyContribution: 666.67, expectedReturn: 8, expenseRatio: 0.08 },
    { holder: 'Person 1', accountType: '401(k)', fund: 'Employer 401k - Target Date', currentValue: 43485.69, monthlyContribution: 582.39, expectedReturn: 8, expenseRatio: 0.02 },
    { holder: 'Person 1', accountType: '401(a)', fund: 'State Pension Fund', currentValue: 75192.76, monthlyContribution: 0, expectedReturn: 8, expenseRatio: 0.07 },
    { holder: 'Person 1', accountType: 'Brokerage', fund: 'VTI (Total Stock Market ETF)', currentValue: 97667.97, monthlyContribution: 200.00, expectedReturn: 8, expenseRatio: 0.03 },
    { holder: 'Person 2', accountType: 'Brokerage', fund: 'VOO (S&P 500 ETF)', currentValue: 102040.38, monthlyContribution: 200.00, expectedReturn: 8, expenseRatio: 0.03 },
    { holder: 'Person 2', accountType: 'Brokerage', fund: 'VOO (S&P 500 ETF)', currentValue: 10404.91, monthlyContribution: 0.00, expectedReturn: 8, expenseRatio: 0.03 }
];

export const initialOtherEmployerInvestments = [
    // Holder names changed slightly
    { holder: 'Person 1', accountType: 'Employer Plan', description: 'Supplemental Retirement Acct', currentValue: 5933.96, monthlyContribution: 0, expectedReturn: 5.54, expenseRatio: 0.00, notes: '' },
    { holder: 'Person 1', accountType: 'Employer Plan', description: 'Employer Contribution Plan', currentValue: 16838.84, monthlyContribution: 538.04, expectedReturn: 5.54, expenseRatio: 0.00, notes: 'Company contributes 8% (salary).' }
];

export const initialDevkInvestment = [
    // Holder name changed
    { holder: 'Person 1', accountType: 'Insurance / Annuity', description: 'Cash Value Policy (Paid up 2040)', currentValue: 52090.19, monthlyContribution: 0, expectedReturn: 0, expenseRatio: 0.00, notes: 'Treated as lump sum asset.' }
];

export const initialPprInvestment = [
     { holder: 'Joint', accountType: 'Alternative Investment', description: 'Private Real Estate Fund', currentValue: 75000.00, monthlyContribution: 0, expectedReturn: 10.00, expenseRatio: 0.00, notes: 'Assumes 10% annual distribution.' }
];

export const initialRentalPropertiesData = [
    { address: "123 Main St, Anytown USA", price: 55000, rehabCosts: 5000, closingCosts: 2000, arv: 85000, rent: 900, userProvidedMonthlyOpEx: 300, monthlyPI: 0 },
    { address: "456 Oak Ave, Anytown USA", price: 120000, rehabCosts: 10000, closingCosts: 4000, arv: 175000, rent: 1400, userProvidedMonthlyOpEx: 500, monthlyPI: 450 },
    { address: "789 Pine Ln, Anytown USA", price: 26500, rehabCosts: 15297, closingCosts: 1500, arv: 165000, rent: 1250, userProvidedMonthlyOpEx: 435.82, monthlyPI: 0 },
];

// --- REMOVED HARDCODED SS DATA ---
// const danielSSBenefitData = { ... };
// const DANIEL_FRA_BENEFIT = danielSSBenefitData[67];
// --- These values will now come from user input ---