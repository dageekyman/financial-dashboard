// --- DOM Element Variables ---
export let currentAssetsTableBody, liabilitiesTableBodyStandalone,
    investmentsTableBody, rentalPortfolioTableBody,
    otherInvestmentsTableBody,
    rentalSellingCostPercentInput,
    person1SSStartAgeSelect, person1SelectedSSBenefitSpan, person1SSBenefitsTableBody,
    person2SSStartAgeSelect, person2SelectedSSBenefitSpan, person2SSBenefitsTableBody,
    totalCombinedMonthlySSSpan, totalCombinedAnnualSSSpan,
    currentAge1Input, currentAge2Input, retirementAgeInput, inflationRateInput,
    desiredRetirementIncomeTodayInput, retirementWithdrawalRateInput,
    estimatedMonthlyIncomeFromPortfolioSec3Span,
    projectedMonthlyOtherSourcesIncomeSpan,
    totalProjectedMonthlyIncomeAllSourcesSpan, totalProjectedAnnualIncomeAllSourcesSpan,
    futureDesiredIncomeResultSpan, onTrackMessageSpan,
    calculateProjectionButton, finalProjectedPortfolioValueResultSpan,
    postRetirementReturnRateInput, portfolioLongevityResultSpan, assumedTaxRateNonRothInput,
    incomeTableBody, expensesTableBody, totalMonthlyIncomeSpan, totalMonthlyExpensesSpan,
    summaryTotalIncomeSpan, summaryTotalExpensesSpan, summaryNetSavingsSpan, incomeTimelineTableBody,
    saveDataButton, resetDataButton,
    projectionChartCanvas,
    scenarioSelect, loadScenarioButton, saveScenarioAsButton, deleteScenarioButton,
    incomeTimelineChartCanvas,
    person1FRABenefitInput, person2FRABenefitInput,
    postRetirementStdDevInput, simulationYearsInput,
    simulationYearsDisplay, portfolioSuccessRateResult,
    monteCarloChartCanvas,
    totalRentalLoanBalanceSpan, totalRentalEquitySpan,
    // Life Events
    lifeEventsTableBody, addLifeEventButton, // <-- ADD THESE
    // Chart Canvases
    budgetChartCanvas, assetAllocationChartCanvas; // <-- ADD THESE

// --- Helper Function ---
export function setElementText(element, text) { if (element) element.textContent = text; }

// --- Initialization Function ---
export function initializeDOMElementVariables() {
    incomeTableBody = document.getElementById('incomeTable')?.getElementsByTagName('tbody')[0];
    expensesTableBody = document.getElementById('expensesTable')?.getElementsByTagName('tbody')[0];
    totalMonthlyIncomeSpan = document.getElementById('totalMonthlyIncome');
    totalMonthlyExpensesSpan = document.getElementById('totalMonthlyExpenses');
    summaryTotalIncomeSpan = document.getElementById('summaryTotalIncome');
    summaryTotalExpensesSpan = document.getElementById('summaryTotalExpenses');
    summaryNetSavingsSpan = document.getElementById('summaryNetSavings');
    currentAssetsTableBody = document.getElementById('currentAssetsTable')?.getElementsByTagName('tbody')[0];
    liabilitiesTableBodyStandalone = document.getElementById('liabilitiesTableStandalone')?.getElementsByTagName('tbody')[0];
    investmentsTableBody = document.getElementById('investmentsTable')?.getElementsByTagName('tbody')[0];
    otherInvestmentsTableBody = document.getElementById('otherInvestmentsTable')?.getElementsByTagName('tbody')[0];
    rentalPortfolioTableBody = document.getElementById('rentalPortfolioTable')?.getElementsByTagName('tbody')[0];
    rentalSellingCostPercentInput = document.getElementById('rentalSellingCostPercent');
    person1SSBenefitsTableBody = document.getElementById('person1SSBenefitsTable')?.getElementsByTagName('tbody')[0];
    person1SSStartAgeSelect = document.getElementById('person1SSStartAge');
    person1SelectedSSBenefitSpan = document.getElementById('person1SelectedSSBenefit');
    person2SSBenefitsTableBody = document.getElementById('person2SSBenefitsTable')?.getElementsByTagName('tbody')[0];
    person2SSStartAgeSelect = document.getElementById('person2SSStartAge');
    person2SelectedSSBenefitSpan = document.getElementById('person2SelectedSSBenefit');
    totalCombinedMonthlySSSpan = document.getElementById('totalCombinedMonthlySS');
    totalCombinedAnnualSSSpan = document.getElementById('totalCombinedAnnualSS');
    currentAge1Input = document.getElementById('currentAge1');
    currentAge2Input = document.getElementById('currentAge2');
    retirementAgeInput = document.getElementById('retirementAge');
    inflationRateInput = document.getElementById('inflationRate');
    desiredRetirementIncomeTodayInput = document.getElementById('desiredRetirementIncomeToday');
    retirementWithdrawalRateInput = document.getElementById('retirementWithdrawalRate');
    assumedTaxRateNonRothInput = document.getElementById('assumedTaxRateNonRoth');
    estimatedMonthlyIncomeFromPortfolioSec3Span = document.getElementById('estimatedMonthlyIncomeFromPortfolioSec3');
    projectedMonthlyOtherSourcesIncomeSpan = document.getElementById('projectedMonthlyOtherSourcesIncome');
    totalProjectedMonthlyIncomeAllSourcesSpan = document.getElementById('totalProjectedMonthlyIncomeAllSources');
    totalProjectedAnnualIncomeAllSourcesSpan = document.getElementById('totalProjectedAnnualIncomeAllSources');
    futureDesiredIncomeResultSpan = document.getElementById('futureDesiredIncomeResult');
    onTrackMessageSpan = document.getElementById('onTrackMessage');
    calculateProjectionButton = document.getElementById('calculateProjectionButton');
    finalProjectedPortfolioValueResultSpan = document.getElementById('projectedSec3ValueDisplay');
    postRetirementReturnRateInput = document.getElementById('postRetirementReturnRateInput');
    portfolioLongevityResultSpan = document.getElementById('portfolioLongevityResult');
    incomeTimelineTableBody = document.getElementById('incomeTimelineTable')?.getElementsByTagName('tbody')[0];
    saveDataButton = document.getElementById('saveDataButton');
    resetDataButton = document.getElementById('resetDataButton');
    projectionChartCanvas = document.getElementById('projectionChart');
    scenarioSelect = document.getElementById('scenarioSelect');
    loadScenarioButton = document.getElementById('loadScenarioButton');
    saveScenarioAsButton = document.getElementById('saveScenarioAsButton');
    deleteScenarioButton = document.getElementById('deleteScenarioButton');
    incomeTimelineChartCanvas = document.getElementById('incomeTimelineChart');
    person1FRABenefitInput = document.getElementById('person1FRABenefit');
    person2FRABenefitInput = document.getElementById('person2FRABenefit');
    postRetirementStdDevInput = document.getElementById('postRetirementStdDevInput');
    simulationYearsInput = document.getElementById('simulationYearsInput');
    simulationYearsDisplay = document.getElementById('simulationYearsDisplay');
    portfolioSuccessRateResult = document.getElementById('portfolioSuccessRateResult');
    monteCarloChartCanvas = document.getElementById('monteCarloChart');
    totalRentalLoanBalanceSpan = document.getElementById('totalRentalLoanBalance');
    totalRentalEquitySpan = document.getElementById('totalRentalEquity');

    // Life Events
    lifeEventsTableBody = document.getElementById('lifeEventsTable')?.getElementsByTagName('tbody')[0];
    addLifeEventButton = document.getElementById('addLifeEventButton');

    // New Chart Canvases
    budgetChartCanvas = document.getElementById('budgetChartCanvas');
    assetAllocationChartCanvas = document.getElementById('assetAllocationChartCanvas');
}