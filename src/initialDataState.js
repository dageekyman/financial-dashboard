// src/initialDataState.js
export const initialDataState = {
    // 1. Personal & Retirement Info (Simple Inputs)
    personalInfo: {
        currentAge1: 50,
        currentAge2: 49,
        retirementAge: 65,
    },
    // 2. Budget
    income: [
        { id: 1, description: 'Primary Income Source (Net Monthly)', amount: 5441.64 },
        { id: 2, description: 'Rental Income (Net Monthly)', amount: 1125.00 },
    ],
    expenses: [
        { id: 3, category: 'Housing - HOA (Primary)', amount: 1551.38 },
        { id: 4, category: 'Housing - Property Taxes (Primary)', amount: 406.15 },
        { id: 5, category: 'Housing - Homeowners Insurance (Primary)', amount: 235.00 },
        { id: 6, category: 'Car Insurance', amount: 136.00 },
        { id: 7, category: 'Utilities (Home)', amount: 98.00 },
        { id: 8, category: 'Internet', amount: 83.00 },
        { id: 9, category: 'Phone', amount: 15.00 },
        { id: 10, category: 'Transportation (Gas/Fuel)', amount: 85.00 },
        { id: 11, category: 'Food (Groceries & Dining Out)', amount: 514.00 },
        { id: 12, category: 'Retirement Investments', amount: 1733.34 },
        { id: 13, category: 'Paramount+', amount: 5.00 },
        { id: 14, category: 'ESPN+', amount: 9.45 },
        { id: 15, category: 'Netflix', amount: 20.19 },
        { id: 16, category: 'Google Storage', amount: 1.99 },
    ],

    // 3 & 4. Assets & Liabilities
    assets: [
        { id: 17, type: 'Cash', description: 'Total Cash & Savings (Banks, etc.)', value: 108486.17 },
        { id: 18, type: 'Vehicle', description: 'Nissan Versa', value: 2540.00 },
        { id: 19, type: 'Vehicle', description: 'Nissan Altima', value: 5810.00 },
    ],
    liabilities: [
        { id: 20, type: 'Mortgage', description: 'Primary Residence Mortgage', balance: 0 },
        { id: 21, type: 'Car Loan', description: 'Car Loan (if any)', balance: 0 },
        { id: 22, type: 'Credit Card', description: 'Total Credit Card Debt', balance: 0 },
    ],

    // 5. Investments (Main & Other)
    mainInvestments: [
        { id: 23, holder: 'Person 1', accountType: 'Roth IRA', fund: 'Vanguard Roth IRA', currentValue: 108301.57, monthlyContribution: 666.67, expectedReturn: 8.0, stdDev: 12.0, expenseRatio: 0.08 },
        { id: 24, holder: 'Person 2', accountType: 'Roth IRA', fund: 'Vanguard Roth IRA', currentValue: 107329.43, monthlyContribution: 666.67, expectedReturn: 8.0, stdDev: 12.0, expenseRatio: 0.08 },
        { id: 25, holder: 'Person 1', accountType: '401(k)', fund: 'Employer 401k - TDF', currentValue: 43485.69, monthlyContribution: 582.39, expectedReturn: 8.0, stdDev: 10.0, expenseRatio: 0.02 },
        { id: 26, holder: 'Person 1', accountType: '401(a)', fund: 'State Pension Fund', currentValue: 75192.76, monthlyContribution: 0, expectedReturn: 8.0, stdDev: 7.0, expenseRatio: 0.07 },
    ],
    otherInvestments: [
        { id: 27, holder: 'Person 1', accountType: 'Employer Plan', description: 'Supplemental Retirement Acct', currentValue: 5933.96, monthlyContribution: 0, expectedReturn: 5.54, stdDev: 0.0, expenseRatio: 0.00, treatment: 'Portfolio', notes: '' },
        { id: 28, holder: 'Joint', accountType: 'Alternative Investment', description: 'Private Real Estate Fund', currentValue: 75000.00, monthlyContribution: 0, expectedReturn: 10.00, stdDev: 0.0, expenseRatio: 0.00, treatment: 'FixedPercent', notes: '10' },
        { id: 29, holder: 'Person 1', accountType: 'Insurance / Annuity', description: 'Cash Value Policy (Paid up 2040)', currentValue: 52090.19, monthlyContribution: 0, expectedReturn: 0.0, stdDev: 0.0, expenseRatio: 0.00, treatment: 'LumpSum', notes: '' }
    ],

    // 6. Social Security
    socialSecurity: {
        person1SSStartAge: 67,
        person2SSStartAge: 67,
        person1FRABenefit: 2516,
        person2FRABenefit: 0,
    },

    // 7. Real Estate
    rentals: [
        { id: 30, address: "123 Main St", price: 55000, rehabCosts: 5000, closingCosts: 2000, loanAmount: 0, interestRate: 0, loanTerm: 0, paymentsMade: 0, arv: 85000, rent: 900, userProvidedMonthlyOpEx: 300, monthlyPI: 0 },
        { id: 31, address: "456 Oak Ave", price: 120000, rehabCosts: 10000, closingCosts: 4000, loanAmount: 80000, interestRate: 4.5, loanTerm: 30, paymentsMade: 60, arv: 175000, rent: 1400, userProvidedMonthlyOpEx: 500, monthlyPI: 450 },
    ],

    // 8. Life Events
    lifeEvents: [],

    // 9. Global Assumptions
    assumptions: {
        inflationRate: 3.0,
        rentalSellingCostPercent: 6.0,
        desiredRetirementIncomeToday: 80000,
        retirementWithdrawalRate: 4.0,
        assumedTaxRateNonRoth: 12.0,
        postRetirementReturnRateInput: 4.0,
        postRetirementStdDevInput: 8.0,
        simulationYearsInput: 30,
    }
};

let currentId = 100;
const assignIds = (arr) => arr.map(item => ({ ...item, id: item.id || currentId++ }));


export const getInitialDataState = () => {
    // Generates unique IDs for items that were defined without them
    return {
        ...initialDataState,
        income: assignIds([...initialDataState.income]),
        expenses: assignIds([...initialDataState.expenses]),
        assets: assignIds([...initialDataState.assets]),
        liabilities: assignIds([...initialDataState.liabilities]),
        mainInvestments: assignIds([...initialDataState.mainInvestments]),
        otherInvestments: assignIds([...initialDataState.otherInvestments]),
        rentals: assignIds([...initialDataState.rentals]),
        lifeEvents: assignIds([...initialDataState.lifeEvents]),
    };
};