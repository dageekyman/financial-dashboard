// src/calculations.js
import { formatCurrency, parseCurrency } from './utils';

// --- Internal SSA Factors ---
const reductionFactors = { 62: 0.70, 63: 0.75, 64: 0.80, 65: 0.867, 66: 1.00 };
const delayedCredits = { 68: 1.08, 69: 1.16, 70: 1.24 };
const spousalReductionFactors = { 62: 0.325, 63: 0.35, 64: 0.375, 65: 0.417, 66: 0.458, 67: 0.50 }; 

// --- Monte Carlo Helper ---
function gaussianRandom(mean = 0, stdDev = 1) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdDev + mean;
}

/**
 * Calculates the remaining balance of a loan.
 */
function calculateLoanBalance(P, r, n, p) { 
    if (r === undefined || r === null || isNaN(r) || n === undefined || n === null || isNaN(n) || n <= 0 || p === undefined || p === null || isNaN(p) || p < 0 || P <= 0) {
        return P > 0 ? P : 0; 
    }
    p = Math.min(p, n);
    if (r <= 0) { 
        return Math.max(0, P - (P / n) * p);
    }
    const onePlusR_N = Math.pow(1 + r, n);
    const onePlusR_P = Math.pow(1 + r, p);
    if (onePlusR_N === 1) { 
        return P; 
    }
    const balance = P * (onePlusR_N - onePlusR_P) / (onePlusR_N - 1);
    return Math.max(0, balance);
}


function calculateSSBenefits(p1FRA, p2FRAOwn, selectedP1Age, selectedP2Age) {
    let person1MonthlyBenefit = 0;
    if (selectedP1Age >= 62 && selectedP1Age <= 66) person1MonthlyBenefit = p1FRA * (reductionFactors[selectedP1Age] || 0);
    else if (selectedP1Age === 67) person1MonthlyBenefit = p1FRA;
    else if (selectedP1Age >= 68 && selectedP1Age <= 70) person1MonthlyBenefit = p1FRA * (delayedCredits[selectedP1Age] || 0);

    let person2MonthlyBenefitOwnCalc = 0;
    if (selectedP2Age >= 62 && selectedP2Age <= 67) person2MonthlyBenefitOwnCalc = p2FRAOwn * (reductionFactors[selectedP2Age] || 0);
    const spousalMultiplier = spousalReductionFactors[selectedP2Age] || 0;
    const person2MonthlyBenefitSpousalCalc = p1FRA * spousalMultiplier;

    const person2FinalBenefit = Math.max(person2MonthlyBenefitOwnCalc, person2MonthlyBenefitSpousalCalc);
    const totalMonthly = person1MonthlyBenefit + person2FinalBenefit;

    const generateBenefitTable = (fraBenefit, earlyFactors, lateFactors, ownFraBenefit = 0) => {
        const tableData = [];
        const startAges = Object.keys(earlyFactors).map(Number).sort((a, b) => a - b);
        if (lateFactors) startAges.push(...Object.keys(lateFactors).map(Number).sort((a, b) => a - b));
        
        const uniqueStartAges = Array.from(new Set(startAges)).sort((a, b) => a - b);
        
        uniqueStartAges.forEach(age => {
            let monthlyBenefit = 0;
            const isSpousalCalc = ownFraBenefit > 0 && lateFactors === null;
            
            if (age < 67) {
                if (isSpousalCalc) { 
                     const ownBenefitAtAge = ownFraBenefit * (reductionFactors[age] || 0);
                     const spousalBenefitAtAge = fraBenefit * (earlyFactors[age] || 0);
                     monthlyBenefit = Math.max(ownBenefitAtAge, spousalBenefitAtAge);
                } else {
                     monthlyBenefit = fraBenefit * (earlyFactors[age] || 0);
                }
            } else if (age === 67) {
                 if (isSpousalCalc) {
                     const spousalBenefitAtAge = fraBenefit * (earlyFactors[age] || 0.5);
                     monthlyBenefit = Math.max(ownFraBenefit, spousalBenefitAtAge);
                 } else {
                    monthlyBenefit = fraBenefit;
                 }
            } else if (lateFactors && age >= 68) {
                monthlyBenefit = fraBenefit * (delayedCredits[age] || 0);
            }

            if (monthlyBenefit > 0 || age >= 62) {
                tableData.push({ age, benefit: monthlyBenefit });
            }
        });
        return tableData;
    };


    return {
        person1MonthlyBenefit,
        person2MonthlyBenefit: person2FinalBenefit,
        totalMonthly,
        person1SSData: generateBenefitTable(p1FRA, reductionFactors, delayedCredits),
        person2SSData: generateBenefitTable(p1FRA, spousalReductionFactors, null, p2FRAOwn)
    };
}


function projectInvestmentTable(investments, yearsToRetirement) {
    const results = [];
    if (!investments) return { results: [], totalValue: 0 };

    let totalProjectedValue = 0;

    investments.forEach(inv => {
        let projectedValue = 0;
        
        const currentValue = parseCurrency(inv.currentValue || 0);
        const monthlyContribution = parseCurrency(inv.monthlyContribution || 0);
        const annualContribution = monthlyContribution * 12;
        const grossExpectedReturn = parseCurrency(inv.expectedReturn || 0);
        const expenseRatio = parseCurrency(inv.expenseRatio || 0);
        const netAnnualReturnRate = (grossExpectedReturn - expenseRatio) / 100;
        const stdDevDecimal = parseCurrency(inv.stdDev || 0) / 100;

        if (yearsToRetirement <= 0) { projectedValue = currentValue; }
        else {
            projectedValue = currentValue * Math.pow((1 + netAnnualReturnRate), yearsToRetirement);
            if (netAnnualReturnRate >= 0) {
                if (netAnnualReturnRate > 0) projectedValue += annualContribution * ((Math.pow((1 + netAnnualReturnRate), yearsToRetirement) - 1) / netAnnualReturnRate);
                else projectedValue += annualContribution * yearsToRetirement;
            }
        }
        
        totalProjectedValue += projectedValue;
        
        results.push({
            ...inv,
            projectedValue: projectedValue,
            projectedValueFormatted: formatCurrency(projectedValue),
            stdDev: stdDevDecimal,
            netReturn: netAnnualReturnRate,
            isRoth: (inv.accountType || '').toLowerCase().includes('roth')
        });
    });
    
    return { results: results, totalValue: totalProjectedValue };
}

/**
 * Calculates all derived metrics for the Real Estate Rental Portfolio!
 */
function calculateRentalMetrics(rentals, rentalSellingCostPercent) {
    const calculatedRentals = [];
    // Ensure selling cost rate is always a number
    const sellingCostRate = parseCurrency(rentalSellingCostPercent || 0) / 100;
    
    rentals.forEach(rental => {
        // --- Parse Inputs (Using const for strict local scope and defaulting to 0) ---
        // Ensure all values used in math are properly parsed from the object
        const arv = parseCurrency(rental.arv || 0);
        const loanAmount = parseCurrency(rental.loanAmount || 0);
        const interestRate = parseCurrency(rental.interestRate || 0) / 100 / 12; 
        const loanTerm = parseCurrency(rental.loanTerm || 0) * 12; 
        const paymentsMade = parseCurrency(rental.paymentsMade || 0);
        const monthlyPI = parseCurrency(rental.monthlyPI || 0);
        const rent = parseCurrency(rental.rent || 0);
        const userProvidedMonthlyOpEx = parseCurrency(rental.userProvidedMonthlyOpEx || 0);
        
        const purchasePrice = parseCurrency(rental.price || 0); 
        const rehabCosts = parseCurrency(rental.rehabCosts || 0);
        const closingCosts = parseCurrency(rental.closingCosts || 0);
        
        // --- Loan Balance Calculation ---
        let loanBalance = 0;
        if (loanAmount > 0) {
            loanBalance = calculateLoanBalance(loanAmount, interestRate, loanTerm, paymentsMade);
        }

        // --- Core Metrics ---
        const netCashFlow = rent - userProvidedMonthlyOpEx - monthlyPI;
        const equity = arv - loanBalance;
        
        // --- Net Profit Calculation (Basis & Proceeds) ---
        
        // Final attempt to fix the phantom loan contamination
        // If loanAmount is > 0, use the loanAmount, otherwise use 0.
        // This is the cleanest mathematical solution.
        const basisDeduction = loanAmount > 0 ? loanAmount : 0;
        
        // Net Initial Cash Investment (Basis) = Price + Rehab + Closing - Basis Deduction
        const netInitialInvestment = purchasePrice + rehabCosts + closingCosts - basisDeduction;

        // Cash Received at Closing
        const sellingCost = arv * sellingCostRate;
        const cashReceived = arv - loanBalance - sellingCost;
        
        // Total Profit (Gain) = Cash Received at Closing - Net Initial Cash Investment
        const netProfitIfSold = cashReceived - netInitialInvestment;
        
        calculatedRentals.push({
            ...rental,
            loanBalance,
            netCashFlow,
            equity,
            netProfitIfSold 
        });
    });

    return calculatedRentals;
}


/**
 * Monte Carlo Simulation: Returns success rate and final balances.
 */
function runMonteCarloSimulation(
    eventMap, simulationYears, initialAnnualExpenses, initialPortfolioBalance, 
    inflationRate, postRetirementAvgReturn, postRetirementStdDev,
    totalAnnualOtherIncomeFromSSAndRent, startYear
) {
    const numSimulations = 1000;
    let successfulRuns = 0;
    const endingBalances = [];

    if (initialAnnualExpenses <= 0 || initialPortfolioBalance <= 0 || simulationYears <= 0) {
        return { successRate: 'N/A', endingBalances: [], monteCarloChartData: { labels: [], datasets: [] } };
    }

    for (let i = 0; i < numSimulations; i++) {
        let currentBalance = initialPortfolioBalance;
        let annualExpensesCurrentYear = initialAnnualExpenses;
        let survived = true;

        for (let year = 1; year <= simulationYears; year++) {
            const currentYear = startYear + year - 1;
            const eventCashFlow = eventMap[currentYear] || 0; 

            let withdrawalNeeded = annualExpensesCurrentYear - totalAnnualOtherIncomeFromSSAndRent + eventCashFlow;
            let netWithdrawal = Math.max(0, withdrawalNeeded);

            const annualReturn = gaussianRandom(postRetirementAvgReturn, postRetirementStdDev);
            
            // CRITICAL FIX SEQUENCE:
            currentBalance *= (1 + annualReturn); 
            currentBalance -= netWithdrawal;
            
            if (currentBalance <= 0) {
                survived = false;
                currentBalance = 0;
                break;
            }

            annualExpensesCurrentYear *= (1 + inflationRate);
        }

        endingBalances.push(currentBalance < 0 ? 0 : currentBalance);
        if (survived) { successfulRuns++; }
    }

    const successRate = (successfulRuns / numSimulations) * 100;
    
    return {
        successRate: successRate.toFixed(1),
        endingBalances: endingBalances,
        monteCarloChartData: { labels: [], datasets: [] } 
    };
}

/**
 * Time-Series Monte Carlo Simulation. Returns array of annual balance arrays.
 */
function runMonteCarloTimeLines( 
    eventMap, simulationYears, initialAnnualExpenses, initialPortfolioBalance, 
    inflationRate, postRetirementAvgReturn, postRetirementStdDev,
    totalAnnualOtherIncomeFromSSAndRent, startYear
) {
    const numSimulations = 100; // Use fewer simulations for time series tracking for performance
    const allSimulationPaths = []; // Array of arrays: [[Year 1 Bal, Year 2 Bal...], [Year 1 Bal, ...], ...]

    for (let i = 0; i < numSimulations; i++) {
        let currentBalance = initialPortfolioBalance;
        let annualExpensesCurrentYear = initialAnnualExpenses;
        const path = [initialPortfolioBalance]; // Start with Year 0 balance

        for (let year = 1; year <= simulationYears; year++) {
            const currentYear = startYear + year - 1;
            const eventCashFlow = eventMap[currentYear] || 0; 

            let withdrawalNeeded = annualExpensesCurrentYear - totalAnnualOtherIncomeFromSSAndRent + eventCashFlow;
            let netWithdrawal = Math.max(0, withdrawalNeeded);

            const annualReturn = gaussianRandom(postRetirementAvgReturn, postRetirementStdDev);
            
            // CRITICAL FIX SEQUENCE:
            currentBalance *= (1 + annualReturn); 
            currentBalance -= netWithdrawal;

            if (currentBalance <= 0) {
                currentBalance = 0;
                path.push(0); 
                // Fill the rest of the path with 0 if failure occurs
                for (let j = year + 1; j <= simulationYears; j++) {
                    path.push(0);
                }
                break; 
            }
            
            path.push(currentBalance);
            annualExpensesCurrentYear *= (1 + inflationRate);
        }
        allSimulationPaths.push(path);
    }
    return allSimulationPaths;
}


/**
 * Deterministic Longevity (Calculates one straight-line path).
 */
function calculateDeterministicLongevity(
    eventMap,
    totalAnnualOtherIncomeFromSSAndRent, 
    initialAnnualExpenses, 
    initialPortfolioBalance, 
    inflationRate, 
    postRetirementAvgReturn,
    startYear
) {
    let portfolioBalance = initialPortfolioBalance;
    let annualExpensesCurrentYear = initialAnnualExpenses;
    let yearsLasting = 0;
    const MAX_LONGEVITY_YEARS = 100;

    if (initialAnnualExpenses <= 0 || initialPortfolioBalance <= 0) { return 'N/A'; }
    
    // Quick exit check for perpetual income generation
    if (portfolioBalance >= 0 && (1 + postRetirementAvgReturn) > (1 + inflationRate) && initialAnnualExpenses <= totalAnnualOtherIncomeFromSSAndRent) { 
         return `${MAX_LONGEVITY_YEARS}+`; 
    }
    if (portfolioBalance <= 0) { return '0'; }

    while (portfolioBalance > 0 && yearsLasting < MAX_LONGEVITY_YEARS) {
        yearsLasting++;
        const currentYear = startYear + yearsLasting - 1;
        const eventCashFlow = eventMap[currentYear] || 0; // Annual event cash flow (can be +/-)

        // 1. Calculate Net Withdrawal Needed (Annual)
        let withdrawalNeeded = annualExpensesCurrentYear - totalAnnualOtherIncomeFromSSAndRent + eventCashFlow;
        let netWithdrawal = Math.max(0, withdrawalNeeded);

        const annualReturn = postRetirementAvgReturn; // Use deterministic average return
            
        // 2. Apply Market Return
        portfolioBalance *= (1 + annualReturn);
        
        // 3. Apply Withdrawal
        portfolioBalance -= netWithdrawal;
        
        if (portfolioBalance <= 0) break;
        
        // 4. Inflate Expenses for Next Year
        annualExpensesCurrentYear *= (1 + inflationRate);
    }

    if (portfolioBalance > 0) {
        return `${MAX_LONGEVITY_YEARS}+`;
    } else {
        return `${yearsLasting - 1}`;
    }
}
// Final Export: Include all functions exactly once
export { 
    calculateSSBenefits, 
    projectInvestmentTable, 
    runMonteCarloSimulation, 
    calculateDeterministicLongevity, 
    calculateLoanBalance, 
    runMonteCarloTimeLines,
    calculateRentalMetrics 
};