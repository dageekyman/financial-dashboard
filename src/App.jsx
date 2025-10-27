// src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getInitialDataState } from './initialDataState'; 
import { formatCurrency, parseCurrency } from './utils';

// --- Core Calculation Imports (Omitted for brevity) ---
import { 
    calculateSSBenefits, 
    projectInvestmentTable, 
    runMonteCarloSimulation, 
    calculateDeterministicLongevity, 
    calculateLoanBalance,
    runMonteCarloTimeLines 
} from './calculations';

// --- Storage Imports (Omitted for brevity) ---
import { 
    loadInitialScenario, 
    saveCurrentScenario, 
    autoSaveCurrentScenario, 
    getScenarioNames 
} from './storage'; 

// --- Context Hook (Omitted for brevity) ---
import { AppProvider } from './hooks/useAppContext.jsx'; 

// --- Component Imports (All required components) ---
import Header from './components/Header.jsx'; 
import ScenarioManager from './components/ScenarioManager.jsx'; 
import Sidebar from './components/Sidebar.jsx'; 
import Snapshot from './components/Snapshot.jsx'; 
import PersonalInfoSection from './components/PersonalInfoSection.jsx';
import BudgetSection from './components/Budget.jsx';
import AssetsLiabilitiesSection from './components/AssetsLiabilities.jsx';
import InvestmentsSection from './components/Investments.jsx';
import SocialRealEstateSection from './components/SocialRealEstate.jsx';
import ResultsSection from './components/Results.jsx';

// --- Global Config (Omitted for brevity) ---
const DEFAULT_SCENARIO_NAME = 'Base Case';
const DEFAULT_VIEW = 'Snapshot';

// --- CHART DATA PROCESSORS AND MONTE CARLO HELPERS (Omitted for brevity) ---
function calculatePercentile(sortedArray, percentile) {
    if (sortedArray.length === 0) return 0;
    const index = (percentile / 100) * sortedArray.length;
    let result;
    if (Math.floor(index) === index) {
        result = sortedArray[index - 1];
    } else {
        const lower = sortedArray[Math.floor(index)];
        const upper = sortedArray[Math.ceil(index)];
        result = (lower + upper) / 2;
    }
    return result;
}

function processMonteCarloPercentiles(allSimulationPaths, simulationYears, retirementAge, oldestAge) {
    if (!allSimulationPaths || allSimulationPaths.length === 0 || simulationYears <= 0) {
        return { labels: [], p10: [], p50: [], p90: [] };
    }
    const labels = Array.from({ length: simulationYears + 1 }, (_, i) => oldestAge + i);
    const p10 = [];
    const p50 = [];
    const p90 = [];
    for (let yearIndex = 0; yearIndex <= simulationYears; yearIndex++) {
        const balancesForThisYear = allSimulationPaths.map(path => path[yearIndex]);
        const sortedBalances = balancesForThisYear.sort((a, b) => a - b);
        p10.push(calculatePercentile(sortedBalances, 10));
        p50.push(calculatePercentile(sortedBalances, 50));
        p90.push(calculatePercentile(sortedBalances, 90));
    }
    return { labels, p10, p50, p90 };
}
const LifeEventsProcessor = (lifeEvents) => {
    const eventMap = {};
    if (!lifeEvents) return eventMap;
    lifeEvents.forEach(event => {
        const year = parseCurrency(event.year);
        const amount = parseCurrency(event.amount);
        const isExpense = event.type === 'Expense';
        const adjustment = isExpense ? -amount : amount;
        if (year > 0) {
            if (event.frequency === 'One-Time') {
                eventMap[year] = (eventMap[year] || 0) + adjustment;
            } else if (event.frequency === 'Annual') {
                for (let y = year; y <= 2070; y++) { 
                    eventMap[y] = (eventMap[y] || 0) + adjustment;
                }
            }
        }
    });
    return eventMap;
};

const processProjectionChartData = (mainInvestmentResults, otherInvestmentResults, yearsToRetirement) => {
    if (yearsToRetirement <= 0) return { labels: [], datasets: [] };
    const investments = [
        ...mainInvestmentResults, 
        ...otherInvestmentResults.filter(i => i.treatment === 'Portfolio')
    ].map(inv => ({
        currentValue: parseCurrency(inv.currentValue || 0),
        annualContribution: parseCurrency(inv.monthlyContribution || 0) * 12,
        netReturn: (parseCurrency(inv.expectedReturn || 0) - parseCurrency(inv.expenseRatio || 0)) / 100
    }));
    const labels = [];
    const data = [];
    for (let year = 0; year <= yearsToRetirement; year++) {
        labels.push(`Year ${year}`);
        let totalValue = 0;
        investments.forEach(inv => {
            let projectedValue = inv.currentValue * Math.pow((1 + inv.netReturn), year);
            if (inv.netReturn >= 0) {
                if (inv.netReturn > 0) projectedValue += inv.annualContribution * ((Math.pow((1 + inv.netReturn), year) - 1) / inv.netReturn);
                else projectedValue += inv.annualContribution * year;
            }
            totalValue += projectedValue;
        });
        data.push(totalValue);
    }
    return { labels: labels, datasets: [{ label: 'Projected Portfolio Value', data: data, borderColor: '#4f46e5', backgroundColor: 'rgba(79, 70, 229, 0.1)', fill: true, tension: 0.1 }] };
};

function processMonteCarloChartData(endingBalances) {
    if (!endingBalances || endingBalances.length === 0) return { labels: [], datasets: [] };
    const numBins = 20;
    const minBalance = Math.min(...endingBalances);
    const maxBalance = Math.max(...endingBalances);
    if (minBalance === maxBalance) return { labels: [formatCurrency(minBalance)], datasets: [{ data: [endingBalances.length], backgroundColor: '#10b981' }] };
    const binSize = (maxBalance - minBalance) / numBins;
    const bins = Array(numBins).fill(0);
    const labels = Array(numBins).fill('');
    for (let i = 0; i < numBins; i++) {
        const binMin = minBalance + i * binSize;
        const binMax = binMin + binSize;
        labels[i] = `${formatCurrency(binMin)} - ${formatCurrency(binMax)}`;
    }
    endingBalances.forEach(balance => {
        let binIndex = Math.floor((balance - minBalance) / binSize);
        if (binIndex >= numBins) binIndex = numBins - 1;
        if (binIndex < 0) binIndex = 0;
        bins[binIndex]++;
    });
    return {
        labels: labels,
        datasets: [{
            label: `Count (out of ${endingBalances.length} runs)`,
            data: bins,
            backgroundColor: '#10b981',
            borderColor: '#059669',
            borderWidth: 1
        }]
    };
}

function processIncomeTimelineData(data) {
    const { 
        retirementAge, oldestAge, currentAge1, currentAge2,
        person1SSAge, person2SSAge, portfolioWithdrawalIncome, rentalIncome, otherFixedIncome,
        person1SS, person2SS 
    } = data;
    
    if (isNaN(retirementAge) || isNaN(oldestAge) || oldestAge <= 0 || retirementAge <= 0) {
        return { timelineData: [], finalTotalMonthlyIncome: 0, incomeTimelineChartData: { labels: [], datasets: [] } };
    }
    
    const ageDiff = currentAge1 - currentAge2;
    let keyAgesP1 = new Set();
    keyAgesP1.add(retirementAge);
    // FIX: Corrected "and" to "&&"
    if (!isNaN(person1SSAge) && person1SSAge >= retirementAge) keyAgesP1.add(person1SSAge);
    // FIX: Corrected "and" to "&&"
    if (!isNaN(person2SSAge) && (person2SSAge + ageDiff) >= retirementAge) keyAgesP1.add(person2SSAge + ageDiff);
    
    const uniqueAges = Array.from(new Set([oldestAge, retirementAge, person1SSAge, person2SSAge + ageDiff]))
        .filter(age => !isNaN(age))
        .sort((a, b) => a - b);

    const transitionPoints = uniqueAges.filter(age => age >= retirementAge); 
    
    // FIX: Corrected "and" to "&&"
    if (transitionPoints.length === 0 && retirementAge >= oldestAge) {
        transitionPoints.push(retirementAge);
    }

    const timelineData = [];
    let finalTotalMonthlyIncome = 0;

    transitionPoints.forEach(p1Age => {
        const p2Age = p1Age - ageDiff;

        const currentPortfolioIncome = (p1Age >= retirementAge) ? portfolioWithdrawalIncome : 0;
        const currentRentalCF = (p1Age >= retirementAge) ? rentalIncome : 0;
        const currentOtherFixedIncome = (p1Age >= retirementAge) ? otherFixedIncome : 0;
        
        const currentP1SS = (p1Age >= person1SSAge) ? person1SS : 0;
        const currentP2SS = (p2Age >= person2SSAge) ? person2SS : 0;

        const totalMonthly = currentPortfolioIncome + currentP1SS + currentP2SS + currentRentalCF + currentOtherFixedIncome;
        
        timelineData.push({
            p1Age: Math.max(p1Age, currentAge1), 
            p2Age: Math.max(p2Age, currentAge2), 
            portfolio: currentPortfolioIncome, 
            p1SS: currentP1SS, 
            p2SS: currentP2SS,
            rentalCF: currentRentalCF, 
            otherFixed: otherFixedIncome, 
            totalMonthly: totalMonthly
        });
        
        finalTotalMonthlyIncome = totalMonthly;
    });

    const incomeTimelineChartData = {
        labels: timelineData.map(item => `Ages ${item.p1Age} and ${item.p2Age}`),
        datasets: [
            { label: 'Portfolio Withdrawals', data: timelineData.map(item => item.portfolio), backgroundColor: '#3b82f6' },
            { label: 'P1 SS', data: timelineData.map(item => item.p1SS), backgroundColor: '#10b981' },
            { label: 'P2 SS', data: timelineData.map(item => item.p2SS), backgroundColor: '#f59e0b' },
            { label: 'Rental CF', data: timelineData.map(item => item.rentalCF), backgroundColor: '#6b7280' },
            { label: 'Other Income', data: timelineData.map(item => item.otherFixed), backgroundColor: '#8b5cf6' }
        ]
    };
    return { timelineData, finalTotalMonthlyIncome, incomeTimelineChartData };
}

// --- Component: Global Fixed Control Bar ---
const FixedControlBar = ({ appData, scenarioState, runAllCalculations }) => {
    // Shared styling for the utility buttons
    const controlButtonStyles = "control-button-style px-4 py-2 text-sm md:text-base rounded-lg transition-colors duration-200 shadow-md";

    return (
        <div className="w-full bg-white border-b border-gray-300 shadow-lg sticky top-0 z-40">
            <div className="flex flex-col md:flex-row items-center justify-end px-4 md:px-8 py-3">
                {/* Note: ScenarioManager logic remains in App.jsx flow for now to simplify component changes */}
                <div className="flex justify-center gap-3 mt-3 md:mt-0">
                    <button 
                        id="saveDataButton" 
                        className={`${controlButtonStyles} bg-indigo-500 text-white hover:bg-indigo-600`} 
                        onClick={() => {
                            if (saveCurrentScenario(appData, scenarioState.activeName)) {
                                console.log(`Scenario '${scenarioState.activeName}' saved.`);
                            }
                        }}
                    > 
                        💾 Save Scenario
                    </button>
                    <button 
                        id="resetDataButton" 
                        className={`${controlButtonStyles} bg-red-500 text-white hover:bg-red-600`} 
                        onClick={() => { 
                            if (window.confirm('Are you sure you want to delete ALL saved scenarios and reset to the default values?')) { 
                                localStorage.removeItem('financialDashboardScenarios'); 
                                localStorage.removeItem('financialDashboardLastActiveScenario'); 
                                window.location.reload(); 
                            } 
                        }}
                    >
                        🗑️ Reset All
                    </button>
                    <button 
                        id="calculateProjectionButton" 
                        className={`${controlButtonStyles} text-lg px-6 py-2 ml-4 bg-green-500 text-white hover:bg-green-600 font-semibold`} 
                        onClick={runAllCalculations} 
                    >
                        Calculate Full Projection 🚀
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main App Component ---
const App = () => {
    const [appData, setAppData] = useState(getInitialDataState());
    const [calculationResults, setCalculationResults] = useState({});
    const [scenarioState, setScenarioState] = useState({ 
        activeName: DEFAULT_SCENARIO_NAME, 
        names: [DEFAULT_SCENARIO_NAME] 
    });
    
    const [activeView, setActiveView] = useState(DEFAULT_VIEW); 

    // --- Initial Load Effect (Omitted for brevity) ---
    useEffect(() => {
        const { activeData, activeName, names } = loadInitialScenario();
        setAppData(activeData);
        setScenarioState({ activeName, names });
    }, []); 

    const retirementAge = appData.personalInfo.retirementAge;
    const oldestAge = Math.max(appData.personalInfo.currentAge1, appData.personalInfo.currentAge2);
    const yearsToRetirement = Math.max(0, retirementAge - oldestAge);
    const todayYear = new Date().getFullYear();


    // --- Core Calculation Runner (Omitted for brevity) ---
    const runAllCalculations = useCallback(() => {
        
        if (isNaN(retirementAge) || isNaN(oldestAge) || oldestAge <= 0 || retirementAge <= 0) {
            console.warn("Skipping calculations due to invalid Age or Retirement inputs.");
            return;
        }

        // --- 1. Investment Projection and Processing ---
        const lifeEventsMap = LifeEventsProcessor(appData.lifeEvents); 

        const mainInvestmentProjection = projectInvestmentTable(appData.mainInvestments, yearsToRetirement);
        const otherInvestmentProjection = projectInvestmentTable(appData.otherInvestments, yearsToRetirement);
        
        let totalRothPool = 0;
        let totalNonRothPool = 0;
        let totalOtherSourcesMonthlyIncome = 0;
        
        mainInvestmentProjection.results.forEach(item => { if (item.isRoth) totalRothPool += item.projectedValue; else totalNonRothPool += item.projectedValue; });
        otherInvestmentProjection.results.forEach(item => {
            if (item.treatment === 'Portfolio') { 
                if (item.isRoth) totalRothPool += item.projectedValue; 
                else totalNonRothPool += item.projectedValue; 
            }
            else if (item.treatment === 'FixedPercent') { 
                const percent = parseCurrency(item.notes || 0) / 100; 
                totalOtherSourcesMonthlyIncome += (item.projectedValue * percent) / 12; 
            }
            else if (item.treatment === 'FixedAmount') { 
                const amount = parseCurrency(item.notes || 0); 
                totalOtherSourcesMonthlyIncome += amount; 
            }
        });
        
        const totalWithdrawalPool = totalRothPool + totalNonRothPool;
        
        // 2. SS Calculation
        const ssData = appData.socialSecurity;
        const ssResults = calculateSSBenefits(
            ssData.person1FRABenefit, 
            ssData.person2FRABenefit, 
            ssData.person1SSStartAge, 
            ssData.person2SSStartAge
        );
        
        // 3. Real Estate Calculation
        const rentalSellingCostPercent = appData.assumptions.rentalSellingCostPercent / 100;
        const rentalResults = appData.rentals.map(property => {
             const P = parseCurrency(property.loanAmount); 
             const r = parseCurrency(property.interestRate) / 12 / 100;
             const n = parseCurrency(property.loanTerm) * 12; 
             const p = parseCurrency(property.paymentsMade);
             const estValue = parseCurrency(property.arv);
             const closingCosts = parseCurrency(property.closingCosts);
             
             const loanBalance = calculateLoanBalance(P, r, n, p);
             const sellingCost = estValue * rentalSellingCostPercent;

             return {
                 ...property,
                 netCashFlow: parseCurrency(property.rent) - parseCurrency(property.userProvidedMonthlyOpEx) - parseCurrency(property.monthlyPI),
                 loanBalance: loanBalance,
                 equity: estValue - loanBalance,
                 netProfitIfSold: estValue - closingCosts - sellingCost - loanBalance,
             };
        });
        
        // Rental Totals
        const totalRentalPortfolioValue = rentalResults.reduce((sum, r) => sum + parseCurrency(r.arv || 0), 0);
        const totalRentalLoanBalance = rentalResults.reduce((sum, r) => sum + (r.loanBalance || 0), 0);
        const totalRentalEquity = rentalResults.reduce((sum, r) => sum + (r.equity || 0), 0);
        const totalRentalMonthlyRent = rentalResults.reduce((sum, r) => sum + parseCurrency(r.rent || 0), 0);
        const totalRentalMonthlyOpEx = rentalResults.reduce((sum, r) => sum + parseCurrency(r.userProvidedMonthlyOpEx || 0), 0);
        const totalRentalMonthlyPI = rentalResults.reduce((sum, r) => sum + parseCurrency(r.monthlyPI || 0), 0);
        const totalRentalNetCashFlow = rentalResults.reduce((sum, r) => sum + (r.netCashFlow || 0), 0);
        const totalRentalNetProfitIfSold = rentalResults.reduce((sum, r) => sum + (r.netProfitIfSold || 0), 0);

        // Add Net Rental Cash Flow to Other Income Sources
        totalOtherSourcesMonthlyIncome += totalRentalNetCashFlow;


        // 4. Retirement Income and Longevity Simulation Setup
        const portfolioWithdrawalRate = appData.assumptions.retirementWithdrawalRate / 100;
        const taxRate = appData.assumptions.assumedTaxRateNonRoth / 100;
        const estimatedMonthlyInvestmentIncome = (totalRothPool * portfolioWithdrawalRate + totalNonRothPool * portfolioWithdrawalRate * (1 - taxRate)) / 12;

        const inflationRate = appData.assumptions.inflationRate / 100;
        const initialAnnualExpenses = parseCurrency(appData.assumptions.desiredRetirementIncomeToday) * Math.pow((1 + inflationRate), yearsToRetirement);

        // --- Prepare Timeline Data ---
        const rawTimelineData = {
            retirementAge: retirementAge, oldestAge: oldestAge, currentAge1: appData.personalInfo.currentAge1, currentAge2: appData.personalInfo.currentAge2,
            person1SSAge: ssData.person1SSStartAge, person2SSAge: ssData.person2SSStartAge,
            portfolioWithdrawalIncome: estimatedMonthlyInvestmentIncome, rentalIncome: totalRentalNetCashFlow, 
            otherFixedIncome: totalOtherSourcesMonthlyIncome - totalRentalNetCashFlow, 
            person1SS: ssResults.person1MonthlyBenefit, person2SS: ssResults.person2MonthlyBenefit,
        };
        const { timelineData, finalTotalMonthlyIncome, incomeTimelineChartData } = processIncomeTimelineData(rawTimelineData);

        // CRITICAL FIX: Annualize the monthly other income correctly for the simulation
        const totalAnnualOtherIncome = totalOtherSourcesMonthlyIncome * 12;

        // 5. Run Simulations
        const mcSimResults = runMonteCarloSimulation(
            LifeEventsProcessor(appData.lifeEvents), 
            appData.assumptions.simulationYearsInput, 
            initialAnnualExpenses,
            totalWithdrawalPool,
            inflationRate,
            appData.assumptions.postRetirementReturnRateInput / 100,
            appData.assumptions.postRetirementStdDevInput / 100,
            totalAnnualOtherIncome, // Correctly annualized fixed income
            todayYear + yearsToRetirement
        );
        
        const deterministicLongevity = calculateDeterministicLongevity(
            LifeEventsProcessor(appData.lifeEvents),
            totalAnnualOtherIncome, // Correctly annualized fixed income
            initialAnnualExpenses,
            totalWithdrawalPool,
            inflationRate,
            appData.assumptions.postRetirementReturnRateInput / 100,
            todayYear + yearsToRetirement
        );

        // NEW: Generate Monte Carlo Time Series for the Portfolio Value Over Time chart
        const mcTimeLines = runMonteCarloTimeLines(
            LifeEventsProcessor(appData.lifeEvents), 
            appData.assumptions.simulationYearsInput, 
            initialAnnualExpenses,
            totalWithdrawalPool,
            inflationRate,
            appData.assumptions.postRetirementReturnRateInput / 100,
            appData.assumptions.postRetirementStdDevInput / 100,
            totalAnnualOtherIncome,
            todayYear + yearsToRetirement
        );

        // --- Monte Carlo Percentile Calculation ---
        const sortedBalances = [...mcSimResults.endingBalances].sort((a, b) => a - b);
        const p10Balance = calculatePercentile(sortedBalances, 10);
        const p50Balance = calculatePercentile(sortedBalances, 50);
        const p90Balance = calculatePercentile(sortedBalances, 90);

        // NEW: Process time series data for P10, P50, P90 lines
        const mcTimeLineData = processMonteCarloPercentiles(
            mcTimeLines, 
            appData.assumptions.simulationYearsInput, 
            retirementAge,
            oldestAge
        );

        // Calculate actual total assets from primary sources
        const totalAssetsFromSources = (appData.assets.reduce((sum, i) => sum + (i.value || 0), 0) + 
                                       mainInvestmentProjection.totalValue + 
                                       otherInvestmentProjection.totalValue + 
                                       totalRentalPortfolioValue);


        // 6. Update the final results state
        setCalculationResults(prev => ({
            ...prev, ...ssResults,
            
            // Investment Results
            mainInvestmentResults: mainInvestmentProjection.results, 
            otherInvestmentResults: otherInvestmentProjection.results, 
            totalMainPortfolioValue: mainInvestmentProjection.totalValue,
            totalOtherInvestmentsValue: otherInvestmentProjection.totalValue,
            totalWithdrawalPool: totalWithdrawalPool,
            estimatedMonthlyInvestmentIncome: estimatedMonthlyInvestmentIncome,
            
            // Rental Results
            rentalsWithCalculations: rentalResults,
            totalRentalPortfolioValue: totalRentalPortfolioValue, totalRentalLoanBalance: totalRentalLoanBalance, totalRentalEquity: totalRentalEquity, 
            totalRentalMonthlyRent: totalRentalMonthlyRent, totalRentalMonthlyOpEx: totalRentalMonthlyOpEx, totalRentalMonthlyPI: totalRentalMonthlyPI, 
            totalRentalNetCashFlow: totalRentalNetCashFlow, totalRentalNetProfitIfSold: totalRentalNetProfitIfSold,

            // Income
            totalOtherSourcesMonthlyIncome: totalOtherSourcesMonthlyIncome,
            finalTotalMonthlyIncome: finalTotalMonthlyIncome,
            
            // Goals and Longevity
            yearsToRetirement: yearsToRetirement,
            successRate: mcSimResults.successRate,
            deterministicLongevity: deterministicLongevity,
            p10Balance: p10Balance, 
            p50Balance: p50Balance, 
            p90Balance: p90Balance, 
            
            // NEW CHART DATA
            mcTimeLineData: mcTimeLineData, 

            // Calculated Totals needed for Snapshot/AssetsLiabilities section
            totalCurrentAssets: totalAssetsFromSources,
            
            // Chart Data
            projectionChartData: processProjectionChartData(mainInvestmentProjection.results, otherInvestmentProjection.results, yearsToRetirement),
            incomeTimelineChartData: incomeTimelineChartData,
            monteCarloChartData: processMonteCarloChartData(mcSimResults.endingBalances), 
            timelineData: timelineData,
        }));
        
    }, [appData, yearsToRetirement, oldestAge]);

    // Trigger initial calculation on data load and whenever key inputs change
    useEffect(() => {
        runAllCalculations(); 
    }, [runAllCalculations]);
    
    // --- Auto-Save Handler (Debounced) ---
    const handleInputChange = useCallback(() => { 
        const scenarioName = scenarioState.activeName;
        if (scenarioName) {
            autoSaveCurrentScenario(appData, scenarioName); 
        }
    }, [appData, scenarioState.activeName]);
    
    // Renders the current view based on activeView state
    const renderView = () => {
        switch (activeView) {
            case 'Snapshot':
                return <Snapshot />;
            case 'Personal':
                return <PersonalInfoSection />;
            case 'Budget':
                return <BudgetSection />;
            case 'AssetsLiabilities':
                return <AssetsLiabilitiesSection />;
            case 'Investments':
                return <InvestmentsSection />;
            case 'SocialRealEstate':
                return <SocialRealEstateSection />;
            case 'Results':
                return <ResultsSection />; 
            default:
                return <Snapshot />;
        }
    };


    // Combine state and logic handlers for easy passing to children
    const appLogic = {
        appData, 
        setAppData, 
        runAllCalculations, 
        calculationResults,
        handleInputChange, 
        yearsToRetirement,
        scenarioState, 
        setScenarioState,
        activeView, 
        setActiveView, 
    };

    return (
        <AppProvider appLogic={appLogic}>
            {/* Outer container: FULL SCREEN, 100% width and height */}
            <div className="w-full h-full bg-gray-100 min-h-screen"> 
                
                {/* Global Header/Controls Wrapper: Full width, top padding/margin */}
                <div className="w-full p-4 md:px-8 border-b border-gray-200 bg-white shadow-sm"> 
                    <Header />
                </div>
                
                {/* Global Scenario and Control Buttons: Full width - MOVED SCENARIOMANAGER BACK HERE */}
                <div className="w-full px-4 md:px-8 bg-white pb-4">
                    <ScenarioManager />
                </div>

                {/* NEW FIXED CONTROL BAR (Contains Save/Reset/Calculate) */}
                <FixedControlBar 
                    appData={appData} 
                    scenarioState={scenarioState} 
                    runAllCalculations={runAllCalculations} 
                />

                {/* TWO-COLUMN LAYOUT (Full Width) */}
                <div className="flex flex-col lg:flex-row w-full">
                    {/* LEFT SIDEBAR (Fixed Width Navigation) */}
                    <div className="lg:w-64 w-full bg-white lg:shadow-xl lg:min-h-screen border-r border-gray-200 z-30">
                        <Sidebar />
                    </div>
                    
                    {/* MAIN CONTENT AREA (Takes up remaining width) */}
                    <main className="flex-1 min-w-0 p-4 md:p-8"> 
                        {/* Content Wrapper for visual separation */}
                        <div className="bg-white p-6 rounded-xl shadow-lg w-full">
                            {renderView()}
                        </div>
                    </main>
                </div>
            </div>
        </AppProvider>
    );
};

export default App;