// --- Import Data ---
import {
    initialOtherAssets, initialLiabilities, initialIncomeSources, initialExpenses,
    initialInvestments,
    initialOtherEmployerInvestments as initialOtherInvestments_part1,
    initialDevkInvestment as initialOtherInvestments_part2,
    initialPprInvestment as initialOtherInvestments_part3,
    initialRentalPropertiesData
} from './data.js';

// Combine initial "Other Investments"
const initialOtherInvestments = [
    ...initialOtherInvestments_part1.map(data => ({ ...data, treatment: 'Portfolio', stdDev: 8.0 })),
    ...initialOtherInvestments_part2.map(data => ({ ...data, treatment: 'LumpSum', stdDev: 0.0 })),
    ...initialOtherInvestments_part3.map(data => ({ ...data, treatment: 'FixedPercent', notes: '10', stdDev: 0.0 }))
];
// Define initial life events (empty for now)
const initialLifeEvents = [];


// --- Import DOM Elements & Initializer ---
import * as dom from './dom.js';

// --- Import UI Functions ---
import {
    addIncomeRow, addExpenseRow, updateBudgetSummary,
    addAssetRow, addLiabilityRow, updateTotalLiabilities,
    addInvestmentRow, updateInvestmentTotals,
    addOtherInvestmentRow, updateOtherInvestmentTotals,
    addRentalPropertyRow, updateAllRentalFinancials, updateRentalPortfolioTotals,
    // Added Life Event function
    addLifeEventRow, updateLifeEvents, // <-- Import addLifeEventRow
    populatePerson1SSDropdown, resetProjectionDisplays, summaryInputsListener,
    updateNetWorthStatementTotals
} from './ui.js';

// --- Import Calculation Functions ---
import {
    calculateSSBenefits, calculateFullProjectionAndSummary,
    runMonteCarloSimulation, calculateDeterministicLongevity
} from './calculations.js';

// --- Import Storage Functions ---
import {
    saveCurrentScenario, saveScenarioAs, loadInitialScenario,
    loadSelectedScenario, deleteCurrentScenario, populateScenarioDropdown,
    autoSaveCurrentScenario
} from './storage.js';

// --- Import Chart Functions ---
import { createNetWorthChart, createProjectionChart, createIncomeTimelineChart, createMonteCarloChart } from './charts.js';

// --- Auto-Save Handler ---
function handleInputChange() {
    autoSaveCurrentScenario();
}


// --- Main Dashboard Initialization ---
function initializeDashboard() {
    // 1. Initialize DOM elements
    dom.initializeDOMElementVariables();

    // 2. Setup Event Listeners

    // Add Row Buttons
    document.getElementById('addIncomeRow').addEventListener('click', () => { addIncomeRow(); handleInputChange(); });
    document.getElementById('addExpenseRow').addEventListener('click', () => { addExpenseRow(); handleInputChange(); });
    document.getElementById('addAssetRow').addEventListener('click', () => { addAssetRow(); handleInputChange(); });
    document.getElementById('addStandaloneLiabilityRow').addEventListener('click', () => { addLiabilityRow(); handleInputChange(); });
    document.getElementById('addInvestmentRow').addEventListener('click', () => { addInvestmentRow(); updateInvestmentTotals(); resetProjectionDisplays(); handleInputChange(); });
    document.getElementById('addOtherInvestmentRow').addEventListener('click', () => { addOtherInvestmentRow(); updateOtherInvestmentTotals(); resetProjectionDisplays(); handleInputChange(); });
    document.getElementById('addRentalPropertyRow').addEventListener('click', () => { addRentalPropertyRow(); updateRentalPortfolioTotals(); resetProjectionDisplays(); handleInputChange(); });
    // Add listener for Life Event button
    if (dom.addLifeEventButton) dom.addLifeEventButton.addEventListener('click', () => { addLifeEventRow(); handleInputChange(); }); // <-- NEW


    // Calculate Button
    if(dom.calculateProjectionButton) {
        dom.calculateProjectionButton.addEventListener('click', () => {
            calculateFullProjectionAndSummary();
            createProjectionChart();
            createIncomeTimelineChart();
            // Simulations are called within calculateFullProjectionAndSummary flow
        });
    }

    // Input Listeners
    dom.currentAge1Input.addEventListener('input', handleInputChange);
    dom.currentAge2Input.addEventListener('input', handleInputChange);
    dom.retirementAgeInput.addEventListener('input', () => { resetProjectionDisplays(); handleInputChange(); });
    dom.inflationRateInput.addEventListener('input', () => { summaryInputsListener(); handleInputChange(); });
    dom.rentalSellingCostPercentInput.addEventListener('input', () => { updateAllRentalFinancials(); handleInputChange(); });

    // SS Input Listeners
    dom.person1SSStartAgeSelect.addEventListener('change', () => { calculateSSBenefits(); resetProjectionDisplays(); handleInputChange(); });
    dom.person2SSStartAgeSelect.addEventListener('change', () => { calculateSSBenefits(); resetProjectionDisplays(); handleInputChange(); });
    dom.person1FRABenefitInput.addEventListener('input', () => { calculateSSBenefits(); resetProjectionDisplays(); handleInputChange(); });
    dom.person2FRABenefitInput.addEventListener('input', () => { calculateSSBenefits(); resetProjectionDisplays(); handleInputChange(); });

    // Results Area / Assumption Inputs
    dom.desiredRetirementIncomeTodayInput.addEventListener('input', () => { summaryInputsListener(); handleInputChange(); });
    dom.retirementWithdrawalRateInput.addEventListener('input', () => { summaryInputsListener(); handleInputChange(); });
    if (dom.assumedTaxRateNonRothInput) dom.assumedTaxRateNonRothInput.addEventListener('input', () => { summaryInputsListener(); handleInputChange(); });
    // Simulation Inputs
    if (dom.postRetirementReturnRateInput) dom.postRetirementReturnRateInput.addEventListener('input', () => { summaryInputsListener(); handleInputChange(); });
    if (dom.postRetirementStdDevInput) dom.postRetirementStdDevInput.addEventListener('input', () => { summaryInputsListener(); handleInputChange(); });
    if (dom.simulationYearsInput) dom.simulationYearsInput.addEventListener('input', () => { summaryInputsListener(); handleInputChange(); });


    // Scenario Button Listeners
    dom.loadScenarioButton.addEventListener('click', () => { if(loadSelectedScenario()) runAllCalculationsAndDrawCharts(); });
    dom.saveScenarioAsButton.addEventListener('click', saveScenarioAs);
    dom.deleteScenarioButton.addEventListener('click', () => { if(deleteCurrentScenario()) runAllCalculationsAndDrawCharts(); });

    // Save Button Listener
    dom.saveDataButton.textContent = 'Save Current Scenario';
    dom.saveDataButton.addEventListener('click', () => { if (saveCurrentScenario()) { dom.saveDataButton.textContent = 'Scenario Saved!'; dom.saveDataButton.classList.remove('add-btn'); dom.saveDataButton.classList.add('bg-indigo-600'); setTimeout(() => { dom.saveDataButton.textContent = 'Save Current Scenario'; dom.saveDataButton.classList.add('add-btn'); dom.saveDataButton.classList.remove('bg-indigo-600'); }, 1500); } else { dom.saveDataButton.textContent = 'Save Failed!'; dom.saveDataButton.classList.remove('add-btn'); dom.saveDataButton.classList.add('bg-red-600'); setTimeout(() => { dom.saveDataButton.textContent = 'Save Current Scenario'; dom.saveDataButton.classList.add('add-btn'); dom.saveDataButton.classList.remove('bg-red-600'); }, 2000); } });

    // Reset Button
    dom.resetDataButton.addEventListener('click', () => { if (confirm('Delete ALL scenarios and reset?')) { localStorage.removeItem('financialDashboardScenarios'); localStorage.removeItem('financialDashboardLastActiveScenario'); location.reload(); } });


    // 3. Populate Static Data
    populatePerson1SSDropdown();

    // 4. Load Initial Scenario or Populate Defaults
    const dataLoaded = loadInitialScenario();

    if (!dataLoaded) {
        console.log("Loading default data set and saving as 'Base Case'...");
        initialIncomeSources.forEach(addIncomeRow);
        initialExpenses.forEach(addExpenseRow);
        initialOtherAssets.forEach(addAssetRow);
        initialLiabilities.forEach(addLiabilityRow);
        initialInvestments.forEach(addInvestmentRow);
        initialOtherInvestments.forEach(addOtherInvestmentRow);
        initialRentalPropertiesData.forEach(addRentalPropertyRow);
        initialLifeEvents.forEach(addLifeEventRow); // <-- Load default (empty) life events

        if (dom.scenarioSelect.options.length > 0 && dom.scenarioSelect.value === DEFAULT_SCENARIO_NAME) saveCurrentScenario();
        else { populateScenarioDropdown(); if (dom.scenarioSelect.options.length > 0) { dom.scenarioSelect.value = DEFAULT_SCENARIO_NAME; saveCurrentScenario(); } else console.error("Failed to save default scenario."); }
    }

    // 5. Run Initial Calculations and Draw Charts
    runAllCalculationsAndDrawCharts();

    // 6. Attach auto-save listeners AFTER initial load/population
    const elementsToAutoSave = document.querySelectorAll('.container input, .container select');
    elementsToAutoSave.forEach(element => { if (element.type !== 'button' && element.id !== 'scenarioSelect') { const eventType = (element.tagName === 'SELECT') ? 'change' : 'input'; element.removeEventListener(eventType, handleInputChange); element.addEventListener(eventType, handleInputChange); } });
     console.log(`Attached auto-save listeners.`);
}

/** Helper function to run all calculations and update charts. */
function runAllCalculationsAndDrawCharts() {
    updateBudgetSummary();
    updateInvestmentTotals();
    updateOtherInvestmentTotals();
    updateRentalPortfolioTotals();
    updateAllRentalFinancials();
    updateTotalLiabilities();
    calculateSSBenefits();
    updateNetWorthStatementTotals(); // Draws net worth chart
    updateLifeEvents(); // Call placeholder update for life events
    resetProjectionDisplays(); // Clears old projection data & charts

    // Try to run full projection flow if ages are valid
    try {
        const age1 = parseInt(dom.currentAge1Input.value);
        const retAge = parseInt(dom.retirementAgeInput.value);
        if (!isNaN(age1) && !isNaN(retAge)) {
             calculateFullProjectionAndSummary(); // Runs deterministic, income calc, MC sim, longevity
             createProjectionChart();
             createIncomeTimelineChart();
             // MC Chart is drawn inside runMonteCarloSimulation
        }
    } catch (error) { console.warn("Could not draw projection charts:", error); }
}

// --- Start the App ---
window.addEventListener('DOMContentLoaded', initializeDashboard);