// src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getInitialDataState } from './initialDataState';
import { formatCurrency, parseCurrency } from './utils';
import {
  calculateSSBenefits,
  projectInvestmentTable,
  runMonteCarloSimulation,
  calculateDeterministicLongevity,
  calculateLoanBalance,
  runMonteCarloTimeLines,
  calculateRentalMetrics
} from './calculations';
import {
  loadInitialScenario,
  saveCurrentScenario,
  autoSaveCurrentScenario,
  getScenarioNames
} from './storage';
import { AppProvider } from './hooks/useAppContext.jsx';
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

const DEFAULT_SCENARIO_NAME = 'Base Case';
const DEFAULT_VIEW = 'Snapshot';

/* --------------------------------------------------------
   Helper Functions (Chart + Data Processors)
-------------------------------------------------------- */

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

function processMonteCarloPercentiles(allSimulationPaths, simulationYears) {
  if (!allSimulationPaths || allSimulationPaths.length === 0 || simulationYears <= 0) {
    return { labels: [], p10: [], p50: [], p90: [] };
  }

  const labels = Array.from({ length: simulationYears + 1 }, (_, i) => `Year ${i} (from retirement)`);
  const p10 = [];
  const p50 = [];
  const p90 = [];

  for (let yearIndex = 0; yearIndex <= simulationYears; yearIndex++) {
    const balancesForThisYear = allSimulationPaths.map((path) => path[yearIndex]);
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

  lifeEvents.forEach((event) => {
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
    ...otherInvestmentResults.filter((i) => i.treatment === 'Portfolio')
  ].map((inv) => ({
    currentValue: parseCurrency(inv.currentValue || 0),
    annualContribution: parseCurrency(inv.monthlyContribution || 0) * 12,
    netReturn: (parseCurrency(inv.expectedReturn || 0) - parseCurrency(inv.expenseRatio || 0)) / 100
  }));

  const labels = [];
  const data = [];

  for (let year = 0; year <= yearsToRetirement; year++) {
    labels.push(`Year ${year}`);
    let totalValue = 0;
    investments.forEach((inv) => {
      let projectedValue = inv.currentValue * Math.pow(1 + inv.netReturn, year);
      if (inv.netReturn >= 0) {
        if (inv.netReturn > 0)
          projectedValue += inv.annualContribution * ((Math.pow(1 + inv.netReturn, year) - 1) / inv.netReturn);
        else projectedValue += inv.annualContribution * year;
      }
      totalValue += projectedValue;
    });
    data.push(totalValue);
  }

  return {
    labels,
    datasets: [
      {
        label: 'Projected Portfolio Value',
        data,
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true,
        tension: 0.1
      }
    ]
  };
};

function processMonteCarloChartData(endingBalances) {
  if (!endingBalances || endingBalances.length === 0) return { labels: [], datasets: [] };
  const numBins = 20;
  const minBalance = Math.min(...endingBalances);
  const maxBalance = Math.max(...endingBalances);

  if (minBalance === maxBalance)
    return {
      labels: [formatCurrency(minBalance)],
      datasets: [{ data: [endingBalances.length], backgroundColor: '#10b981' }]
    };

  const binSize = (maxBalance - minBalance) / numBins;
  const bins = Array(numBins).fill(0);
  const labels = Array(numBins).fill('');

  for (let i = 0; i < numBins; i++) {
    const binMin = minBalance + i * binSize;
    const binMax = binMin + binSize;
    labels[i] = `${formatCurrency(binMin)} - ${formatCurrency(binMax)}`;
  }

  endingBalances.forEach((balance) => {
    let binIndex = Math.floor((balance - minBalance) / binSize);
    if (binIndex >= numBins) binIndex = numBins - 1;
    if (binIndex < 0) binIndex = 0;
    bins[binIndex]++;
  });

  return {
    labels,
    datasets: [
      {
        label: `Count (out of ${endingBalances.length} runs)`,
        data: bins,
        backgroundColor: '#10b981',
        borderColor: '#059669',
        borderWidth: 1
      }
    ]
  };
}

function processIncomeTimelineData(data) {
  const {
    retirementAge,
    oldestAge,
    currentAge1,
    currentAge2,
    person1SSAge,
    person2SSAge,
    portfolioWithdrawalIncome,
    rentalIncome,
    otherFixedIncome,
    person1SS,
    person2SS
  } = data;

  if (isNaN(retirementAge) || isNaN(oldestAge) || oldestAge <= 0 || retirementAge <= 0) {
    return {
      timelineData: [],
      finalTotalMonthlyIncome: 0,
      incomeTimelineChartData: { labels: [], datasets: [] }
    };
  }

  const ageDiff = currentAge1 - currentAge2;
  const uniqueAges = Array.from(new Set([oldestAge, retirementAge, person1SSAge, person2SSAge + ageDiff]))
    .filter((age) => !isNaN(age))
    .sort((a, b) => a - b);

  const transitionPoints = uniqueAges.filter((age) => age >= retirementAge);
  if (transitionPoints.length === 0 && retirementAge >= oldestAge) {
    transitionPoints.push(retirementAge);
  }

  const timelineData = [];
  let finalTotalMonthlyIncome = 0;

  transitionPoints.forEach((p1Age, idx) => {
    const p2Age = p1Age - ageDiff;

    const currentPortfolioIncome = p1Age >= retirementAge ? portfolioWithdrawalIncome : 0;
    const currentRentalCF = p1Age >= retirementAge ? rentalIncome : 0;
    const currentOtherFixedIncome = p1Age >= retirementAge ? otherFixedIncome : 0;

    const currentP1SS = p1Age >= person1SSAge ? person1SS : 0;
    const currentP2SS = p2Age >= person2SSAge ? person2SS : 0;

    const totalMonthly =
      currentPortfolioIncome + currentP1SS + currentP2SS + currentRentalCF + currentOtherFixedIncome;

    timelineData.push({
      p1Age,
      p2Age,
      portfolio: currentPortfolioIncome,
      p1SS: currentP1SS,
      p2SS: currentP2SS,
      rentalCF: currentRentalCF,
      otherFixed: otherFixedIncome,
      totalMonthly
    });

    finalTotalMonthlyIncome = totalMonthly;
  });

  const incomeTimelineChartData = {
    labels: timelineData.map((_, idx) => `Year ${idx} (from retirement)`),
    datasets: [
      { label: 'Portfolio Withdrawals', data: timelineData.map((i) => i.portfolio), backgroundColor: '#3b82f6' },
      { label: 'P1 SS', data: timelineData.map((i) => i.p1SS), backgroundColor: '#10b981' },
      { label: 'P2 SS', data: timelineData.map((i) => i.p2SS), backgroundColor: '#f59e0b' },
      { label: 'Rental CF', data: timelineData.map((i) => i.rentalCF), backgroundColor: '#6b7280' },
      { label: 'Other Income', data: timelineData.map((i) => i.otherFixed), backgroundColor: '#8b5cf6' }
    ]
  };

  return { timelineData, finalTotalMonthlyIncome, incomeTimelineChartData };
}

/* --------------------------------------------------------
   Fixed Control Bar
-------------------------------------------------------- */
const FixedControlBar = ({ appData, scenarioState, runAllCalculations }) => {
  const controlButtonStyles =
    'control-button-style px-4 py-2 text-sm md:text-base rounded-lg transition-colors duration-200 shadow-md';

  return (
    <div className="w-full bg-white border-b border-gray-300 shadow-lg sticky top-0 z-40">
      <div className="flex flex-col md:flex-row items-center justify-end px-4 md:px-8 py-3">
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
              if (
                window.confirm(
                  'Are you sure you want to delete ALL saved scenarios and reset to default values?'
                )
              ) {
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

/* --------------------------------------------------------
   Main App Component
-------------------------------------------------------- */
const App = () => {
  const [appData, setAppData] = useState(getInitialDataState());
  const [calculationResults, setCalculationResults] = useState({});
  const [scenarioState, setScenarioState] = useState({
    activeName: DEFAULT_SCENARIO_NAME,
    names: [DEFAULT_SCENARIO_NAME]
  });
  const [activeView, setActiveView] = useState(DEFAULT_VIEW);

  useEffect(() => {
    const { activeData, activeName, names } = loadInitialScenario();
    setAppData(activeData);
    setScenarioState({ activeName, names });
  }, []);

  const retirementAge = appData.personalInfo.retirementAge;
  const oldestAge = Math.max(appData.personalInfo.currentAge1, appData.personalInfo.currentAge2);
  const yearsToRetirement = Math.max(0, retirementAge - oldestAge);
  const todayYear = new Date().getFullYear();

  const runAllCalculations = useCallback(() => {
    if (isNaN(retirementAge) || isNaN(oldestAge) || oldestAge <= 0 || retirementAge <= 0) {
      console.warn('Skipping calculations due to invalid Age or Retirement inputs.');
      return;
    }

    const lifeEventsMap = LifeEventsProcessor(appData.lifeEvents);

    const mainInvestmentProjection = projectInvestmentTable(appData.mainInvestments, yearsToRetirement);
    const otherInvestmentProjection = projectInvestmentTable(appData.otherInvestments, yearsToRetirement);

    // FIX: Calculate current total investment values for Net Worth
    const totalCurrentMainInvestments = appData.mainInvestments.reduce(
        (sum, item) => sum + parseCurrency(item.currentValue || 0),
        0
    );
    const totalCurrentOtherInvestments = appData.otherInvestments.reduce(
        (sum, item) => sum + parseCurrency(item.currentValue || 0),
        0
    );
    
    let totalRothPool = 0;
    let totalNonRothPool = 0;
    let totalOtherSourcesMonthlyIncome = 0;
    
    let totalProjectedOtherInvestmentValue = 0; // Total projected value of ALL other investments

    mainInvestmentProjection.results.forEach((item) => {
      if (item.isRoth) totalRothPool += item.projectedValue;
      else totalNonRothPool += item.projectedValue;
    });

    otherInvestmentProjection.results.forEach((item) => {
      // 1. Accumulate ALL projected values from Other Investments
      totalProjectedOtherInvestmentValue += item.projectedValue;

      // 2. Determine how the asset contributes to the withdrawal pool or fixed income
      if (item.treatment === 'Portfolio') {
        if (item.isRoth) totalRothPool += item.projectedValue;
        else totalNonRothPool += item.projectedValue;
      } else if (item.treatment === 'FixedPercent') {
        const percent = parseCurrency(item.notes || 0) / 100;
        totalOtherSourcesMonthlyIncome += (item.projectedValue * percent) / 12;
      } else if (item.treatment === 'FixedAmount') {
        const amount = parseCurrency(item.notes || 0);
        totalOtherSourcesMonthlyIncome += amount;
      }
      // LumpSum treatment contributes neither to the pool nor fixed income.
    });

    const totalWithdrawalPool = totalRothPool + totalNonRothPool;

    const ssData = appData.socialSecurity;
    const ssResults = calculateSSBenefits(
      ssData.person1FRABenefit,
      ssData.person2FRABenefit,
      ssData.person1SSStartAge,
      ssData.person2SSStartAge
    );

    const rentalResults = calculateRentalMetrics(
      appData.rentals,
      appData.assumptions.rentalSellingCostPercent
    );

    const totalRentalPortfolioValue = rentalResults.reduce(
      (sum, r) => sum + parseCurrency(r.arv || 0),
      0
    );
    const totalRentalLoanBalance = rentalResults.reduce((sum, r) => sum + (r.loanBalance || 0), 0);
    const totalRentalEquity = rentalResults.reduce((sum, r) => sum + (r.equity || 0), 0);
    const totalRentalMonthlyRent = rentalResults.reduce(
      (sum, r) => sum + parseCurrency(r.rent || 0),
      0
    );
    const totalRentalMonthlyOpEx = rentalResults.reduce(
      (sum, r) => sum + parseCurrency(r.userProvidedMonthlyOpEx || 0),
      0
    );
    const totalRentalMonthlyPI = rentalResults.reduce(
      (sum, r) => sum + parseCurrency(r.monthlyPI || 0),
      0
    );
    const totalRentalNetCashFlow = rentalResults.reduce(
      (sum, r) => sum + (r.netCashFlow || 0),
      0
    );
    const totalRentalNetProfitIfSold = rentalResults.reduce(
      (sum, r) => sum + (r.netProfitIfSold || 0),
      0
    );
    
    // Total other assets from section 3 (Cash, cars, etc.)
    const totalOtherAssetsFromSection3 = appData.assets.reduce((sum, i) => sum + (i.value || 0), 0);

    // Calculate the HOLISTIC NET WORTH STARTING BALANCE (All projected investments + Rental Equity + Other Assets)
    const holisticStartingBalance = 
        mainInvestmentProjection.totalValue + 
        totalProjectedOtherInvestmentValue + // All projected values, regardless of treatment
        totalRentalEquity + // Use current equity of rentals
        totalOtherAssetsFromSection3; // Cash, car value, etc.


    totalOtherSourcesMonthlyIncome += totalRentalNetCashFlow;

    const portfolioWithdrawalRate = appData.assumptions.retirementWithdrawalRate / 100;
    const taxRate = appData.assumptions.assumedTaxRateNonRoth / 100;
    const estimatedMonthlyInvestmentIncome =
      (totalRothPool * portfolioWithdrawalRate +
        totalNonRothPool * portfolioWithdrawalRate * (1 - taxRate)) /
      12;

    const inflationRate = appData.assumptions.inflationRate / 100;
    const initialAnnualExpenses =
      parseCurrency(appData.assumptions.desiredRetirementIncomeToday) *
      Math.pow(1 + inflationRate, yearsToRetirement);

    const rawTimelineData = {
      retirementAge,
      oldestAge,
      currentAge1: appData.personalInfo.currentAge1,
      currentAge2: appData.personalInfo.currentAge2,
      person1SSAge: ssData.person1SSStartAge,
      person2SSAge: ssData.person2SSStartAge,
      portfolioWithdrawalIncome: estimatedMonthlyInvestmentIncome,
      rentalIncome: totalRentalNetCashFlow,
      otherFixedIncome: totalOtherSourcesMonthlyIncome - totalRentalNetCashFlow,
      person1SS: ssResults.person1MonthlyBenefit,
      person2SS: ssResults.person2MonthlyBenefit
    };

    const { timelineData, finalTotalMonthlyIncome, incomeTimelineChartData } =
      processIncomeTimelineData(rawTimelineData);

    const totalAnnualOtherIncome = totalOtherSourcesMonthlyIncome * 12;

    const mcSimResults = runMonteCarloSimulation(
      lifeEventsMap,
      appData.assumptions.simulationYearsInput,
      initialAnnualExpenses,
      totalWithdrawalPool,
      inflationRate,
      appData.assumptions.postRetirementReturnRateInput / 100,
      appData.assumptions.postRetirementStdDevInput / 100,
      totalAnnualOtherIncome,
      todayYear + yearsToRetirement
    );

    const deterministicLongevity = calculateDeterministicLongevity(
      lifeEventsMap,
      totalAnnualOtherIncome,
      initialAnnualExpenses,
      totalWithdrawalPool,
      inflationRate,
      appData.assumptions.postRetirementReturnRateInput / 100,
      todayYear + yearsToRetirement
    );
    
    // NEW: Calculate HOLISTIC LONGEVITY using the combined Net Worth as the starting balance
    const holisticLongevity = calculateDeterministicLongevity(
      lifeEventsMap,
      totalAnnualOtherIncome,
      initialAnnualExpenses,
      holisticStartingBalance, // Use the significantly larger Holistic Net Worth pool
      inflationRate,
      appData.assumptions.postRetirementReturnRateInput / 100,
      todayYear + yearsToRetirement
    );


    const mcTimeLines = runMonteCarloTimeLines(
      lifeEventsMap,
      appData.assumptions.simulationYearsInput,
      initialAnnualExpenses,
      totalWithdrawalPool,
      inflationRate,
      appData.assumptions.postRetirementReturnRateInput / 100,
      appData.assumptions.postRetirementStdDevInput / 100,
      totalAnnualOtherIncome,
      todayYear + yearsToRetirement
    );

    const sortedBalances = [...mcSimResults.endingBalances].sort((a, b) => a - b);
    const p10Balance = calculatePercentile(sortedBalances, 10);
    const p50Balance = calculatePercentile(sortedBalances, 50);
    const p90Balance = calculatePercentile(sortedBalances, 90);

    const mcTimeLineData = processMonteCarloPercentiles(
      mcTimeLines,
      appData.assumptions.simulationYearsInput
    );

    const totalAssetsFromSources =
      appData.assets.reduce((sum, i) => sum + (i.value || 0), 0) +
      totalCurrentMainInvestments +
      totalCurrentOtherInvestments +
      totalRentalPortfolioValue;

    setCalculationResults({
      ...ssResults,
      mainInvestmentResults: mainInvestmentProjection.results,
      otherInvestmentResults: otherInvestmentProjection.results,
      totalMainPortfolioValue: mainInvestmentProjection.totalValue,
      totalOtherInvestmentsValue: otherInvestmentProjection.totalValue,
      totalCurrentMainInvestments,
      totalCurrentOtherInvestments,
      totalWithdrawalPool,
      estimatedMonthlyInvestmentIncome,
      rentalsWithCalculations: rentalResults,
      totalRentalPortfolioValue,
      totalRentalLoanBalance,
      totalRentalEquity,
      totalRentalMonthlyRent,
      totalRentalMonthlyOpEx,
      totalRentalMonthlyPI,
      totalRentalNetCashFlow,
      totalRentalNetProfitIfSold,
      totalOtherSourcesMonthlyIncome,
      finalTotalMonthlyIncome,
      yearsToRetirement,
      successRate: mcSimResults.successRate,
      deterministicLongevity,
      holisticLongevity, // NEW: Holistic Longevity result
      p10Balance,
      p50Balance,
      p90Balance,
      mcTimeLineData,
      totalCurrentAssets: totalAssetsFromSources,
      projectionChartData: processProjectionChartData(
        mainInvestmentProjection.results,
        otherInvestmentProjection.results,
        yearsToRetirement
      ),
      incomeTimelineChartData,
      monteCarloChartData: processMonteCarloChartData(mcSimResults.endingBalances),
      timelineData
    });
  }, [appData, yearsToRetirement, oldestAge]);

  useEffect(() => {
    runAllCalculations();
  }, [runAllCalculations]);

  const handleInputChange = useCallback(() => {
    const scenarioName = scenarioState.activeName;
    if (scenarioName) {
      autoSaveCurrentScenario(appData, scenarioName);
    }
  }, [appData, scenarioState.activeName]);

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
    setActiveView
  };

  return (
    <AppProvider appLogic={appLogic}>
      <div className="w-full h-full bg-gray-100 min-h-screen">
        <div className="w-full p-4 md:px-8 border-b border-gray-200 bg-white shadow-sm">
          <Header />
        </div>
        <div className="w-full px-4 md:px-8 bg-white pb-4">
          <ScenarioManager />
        </div>
        <FixedControlBar
          appData={appData}
          scenarioState={scenarioState}
          runAllCalculations={runAllCalculations}
        />
        <div className="flex flex-col lg:flex-row w-full">
          <div className="lg:w-64 w-full bg-white lg:shadow-xl lg:min-h-screen border-r border-gray-200 z-30">
            <Sidebar />
          </div>
          <main className="flex-1 min-w-0 p-4 md:p-8">
            <div className="bg-white p-6 rounded-xl shadow-lg w-full">{renderView()}</div>
          </main>
        </div>
      </div>
    </AppProvider>
  );
};

export default App;