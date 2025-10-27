// storage.js
import * as dom from './dom.js';
import { addIncomeRow, addExpenseRow, addAssetRow, addLiabilityRow, addInvestmentRow, addOtherInvestmentRow, addRentalPropertyRow, addLifeEventRow } from './ui.js';

const SCENARIOS_KEY = 'financialDashboardScenarios';
const LAST_ACTIVE_SCENARIO_KEY = 'financialDashboardLastActiveScenario';
const DEFAULT_SCENARIO_NAME = 'Base Case';
const AUTO_SAVE_DELAY = 1500;
let autoSaveTimeout = null;

// --- Helper functions ---
function getCurrentAppData() {
    return {
        personalInfo: { currentAge1: dom.currentAge1Input.value, currentAge2: dom.currentAge2Input.value, retirementAge: dom.retirementAgeInput.value, },
        income: getTableData(dom.incomeTableBody, ['income-description', 'income-amount']),
        expenses: getTableData(dom.expensesTableBody, ['expense-category', 'expense-amount']),
        assets: getTableData(dom.currentAssetsTableBody, ['asset-type', 'asset-description', 'asset-value']),
        liabilities: getTableData(dom.liabilitiesTableBodyStandalone, ['liability-type', 'liability-description', 'liability-balance']),
        investments: getTableData(dom.investmentsTableBody, ['investment-holder', 'investment-accountType', 'investment-fund', 'investment-currentValue', 'investment-monthlyContribution', 'investment-expectedReturn', 'investment-stdDev', 'investment-expenseRatio']),
        otherInvestments: getTableData(dom.otherInvestmentsTableBody, ['otherInvestment-holder', 'otherInvestment-accountType', 'otherInvestment-description', 'otherInvestment-currentValue', 'otherInvestment-monthlyContribution', 'otherInvestment-expectedReturn', 'otherInvestment-stdDev', 'otherInvestment-expenseRatio', 'otherInvestment-treatment', 'otherInvestment-notes']),
        socialSecurity: { person1SSStartAge: dom.person1SSStartAgeSelect.value, person2SSStartAge: dom.person2SSStartAgeSelect.value, person1FRABenefit: dom.person1FRABenefitInput.value, person2FRABenefit: dom.person2FRABenefitInput.value },
        rentals: getTableData(dom.rentalPortfolioTableBody, [ 'rental-address', 'rental-purchasePrice', 'rental-rehabCost', 'rental-closingCosts', 'rental-loanAmount', 'rental-interestRate', 'rental-loanTerm', 'rental-paymentsMade', 'rental-estValue', 'rental-monthlyRent', 'rental-monthlyOpEx', 'rental-monthlyPI' ]), // <-- Added paymentsMade
        lifeEvents: getTableData(dom.lifeEventsTableBody, [ 'event-year', 'event-type', 'event-description', 'event-amount', 'event-frequency', 'event-notes' ]), // <-- Added lifeEvents
        assumptions: { inflationRate: dom.inflationRateInput.value, rentalSellingCostPercent: dom.rentalSellingCostPercentInput.value, desiredRetirementIncomeToday: dom.desiredRetirementIncomeTodayInput.value, retirementWithdrawalRate: dom.retirementWithdrawalRateInput.value, assumedTaxRateNonRoth: dom.assumedTaxRateNonRothInput.value, postRetirementReturnRateInput: dom.postRetirementReturnRateInput.value, postRetirementStdDevInput: dom.postRetirementStdDevInput.value, simulationYearsInput: dom.simulationYearsInput.value }
    };
}

function getSavedScenarios() { /* ... */ const d=localStorage.getItem(SCENARIOS_KEY); return d?JSON.parse(d):{}; } // Minified
function saveScenarios(scenarios) { /* ... */ try{localStorage.setItem(SCENARIOS_KEY,JSON.stringify(scenarios));}catch(e){console.error('Error saving:',e);} } // Minified
function saveLastActiveScenarioName(name) { /* ... */ localStorage.setItem(LAST_ACTIVE_SCENARIO_KEY,name); } // Minified
function getLastActiveScenarioName() { /* ... */ return localStorage.getItem(LAST_ACTIVE_SCENARIO_KEY); } // Minified
export function populateScenarioDropdown() { /* ... */ const s=getSavedScenarios(),n=Object.keys(s),l=getLastActiveScenarioName();dom.scenarioSelect.innerHTML='';if(n.length===0){const o=document.createElement('option');o.value=DEFAULT_SCENARIO_NAME;o.textContent=DEFAULT_SCENARIO_NAME;dom.scenarioSelect.appendChild(o);return;}n.sort().forEach(nm=>{const o=document.createElement('option');o.value=nm;o.textContent=nm;if(nm===l)o.selected=true;dom.scenarioSelect.appendChild(o);}); } // Minified

function loadScenarioDataIntoApp(appData) {
    if (!appData) { console.error("Load failed: null data."); return; }
    clearTableBodies();
    const safeData = {
        personalInfo: appData.personalInfo||{}, income: appData.income||[], expenses: appData.expenses||[], assets: appData.assets||[], liabilities: appData.liabilities||[], investments: appData.investments||[], otherInvestments: appData.otherInvestments||[], socialSecurity: appData.socialSecurity||{}, rentals: appData.rentals||[], lifeEvents: appData.lifeEvents||[], assumptions: appData.assumptions||{}
    };
    dom.currentAge1Input.value=safeData.personalInfo.currentAge1||50; dom.currentAge2Input.value=safeData.personalInfo.currentAge2||49; dom.retirementAgeInput.value=safeData.personalInfo.retirementAge||65;
    setTableData(dom.incomeTableBody,safeData.income,addIncomeRow); setTableData(dom.expensesTableBody,safeData.expenses,addExpenseRow);
    setTableData(dom.currentAssetsTableBody,safeData.assets,addAssetRow); setTableData(dom.liabilitiesTableBodyStandalone,safeData.liabilities,addLiabilityRow);
    setTableData(dom.investmentsTableBody,safeData.investments,addInvestmentRow); setTableData(dom.otherInvestmentsTableBody,safeData.otherInvestments,addOtherInvestmentRow);
    dom.person1SSStartAgeSelect.value=safeData.socialSecurity.person1SSStartAge||67; dom.person2SSStartAgeSelect.value=safeData.socialSecurity.person2SSStartAge||67; dom.person1FRABenefitInput.value=safeData.socialSecurity.person1FRABenefit||2516; dom.person2FRABenefitInput.value=safeData.socialSecurity.person2FRABenefit||0;
    setTableData(dom.rentalPortfolioTableBody,safeData.rentals,addRentalPropertyRow);
    setTableData(dom.lifeEventsTableBody, safeData.lifeEvents, addLifeEventRow); // <-- Load Life Events
    dom.inflationRateInput.value=safeData.assumptions.inflationRate||3; dom.rentalSellingCostPercentInput.value=safeData.assumptions.rentalSellingCostPercent||6; dom.desiredRetirementIncomeTodayInput.value=safeData.assumptions.desiredRetirementIncomeToday||80000; dom.retirementWithdrawalRateInput.value=safeData.assumptions.retirementWithdrawalRate||4; dom.assumedTaxRateNonRothInput.value=safeData.assumptions.assumedTaxRateNonRoth||12; dom.postRetirementReturnRateInput.value=safeData.assumptions.postRetirementReturnRateInput||4; dom.postRetirementStdDevInput.value=safeData.assumptions.postRetirementStdDevInput||8; dom.simulationYearsInput.value=safeData.assumptions.simulationYearsInput||30;
    console.log(`Scenario loaded.`);
}

export function loadInitialScenario() { /* ... */ populateScenarioDropdown(); const s=getSavedScenarios(),l=getLastActiveScenarioName(); let stl=null; if(l&&s[l]){stl=s[l];console.log(`Loading last: "${l}"`);}else if(Object.keys(s).length>0){const fn=Object.keys(s).sort()[0];stl=s[fn];saveLastActiveScenarioName(fn);dom.scenarioSelect.value=fn;console.log(`Loading first: "${fn}"`);} if(stl){try{loadScenarioDataIntoApp(stl);return true;}catch(e){console.error('Err load initial:',e);localStorage.removeItem(SCENARIOS_KEY);localStorage.removeItem(LAST_ACTIVE_SCENARIO_KEY);return false;}}else{console.log('No saved scenarios.');return false;} } // Minified
export function loadSelectedScenario() { /* ... */ const sn=dom.scenarioSelect.value, s=getSavedScenarios(); if(s[sn]){try{loadScenarioDataIntoApp(s[sn]);saveLastActiveScenarioName(sn);return true;}catch(e){console.error(`Err load "${sn}":`,e);return false;}}else{alert(`"${sn}" not found.`);localStorage.removeItem(LAST_ACTIVE_SCENARIO_KEY);populateScenarioDropdown();if(!loadInitialScenario()){return false;}return true;} } // Minified
export function saveCurrentScenario() { /* ... */ const sn=dom.scenarioSelect.value; if(!sn){console.warn("Save skip: No scenario");return false;} const s=getSavedScenarios(); if(dom.scenarioSelect.options.length===1&&sn===DEFAULT_SCENARIO_NAME&&!s[DEFAULT_SCENARIO_NAME]){console.warn("Save skip: Default placeholder");return false;} s[sn]=getCurrentAppData(); saveScenarios(s); saveLastActiveScenarioName(sn); console.log(`"${sn}" saved.`); return true; } // Minified
export function autoSaveCurrentScenario() { /* ... */ clearTimeout(autoSaveTimeout); autoSaveTimeout=setTimeout(()=>{console.log("Auto-saving...");if(saveCurrentScenario()){/* Feedback */}},AUTO_SAVE_DELAY); } // Minified
export function saveScenarioAs() { /* ... */ const cn=dom.scenarioSelect.value||DEFAULT_SCENARIO_NAME; let nn=prompt("Name:",`Copy of ${cn}`); if(nn){nn=nn.trim();if(nn===""){alert("Name empty.");return;} const s=getSavedScenarios();if(s[nn]&&!confirm(`Overwrite "${nn}"?`)){return;} s[nn]=getCurrentAppData(); saveScenarios(s); saveLastActiveScenarioName(nn); populateScenarioDropdown(); dom.scenarioSelect.value=nn; console.log(`"${nn}" saved.`);} } // Minified
export function deleteCurrentScenario() { /* ... */ const sn=dom.scenarioSelect.value; if(!sn){alert("No scenario.");return false;} const s=getSavedScenarios(), sc=Object.keys(s).length; if(sc===1&&!s[sn]){alert(`Cannot delete placeholder.`);return false;}else if(sc===1&&!confirm(`Delete last "${sn}"? Reset.`)){return false;}else if(sc>1&&!confirm(`Delete "${sn}"?`)){return false;} if(s[sn]){delete s[sn]; saveScenarios(s); if(getLastActiveScenarioName()===sn)localStorage.removeItem(LAST_ACTIVE_SCENARIO_KEY); populateScenarioDropdown(); console.log(`"${sn}" deleted.`); return true;}else{alert(`"${sn}" not found.`); populateScenarioDropdown(); return false;} } // Minified

// --- Internal Helper Functions ---
function clearTableBodies() { /* ... */ dom.incomeTableBody.innerHTML=''; dom.expensesTableBody.innerHTML=''; dom.currentAssetsTableBody.innerHTML=''; dom.liabilitiesTableBodyStandalone.innerHTML=''; dom.investmentsTableBody.innerHTML=''; dom.otherInvestmentsTableBody.innerHTML=''; dom.rentalPortfolioTableBody.innerHTML=''; if(dom.lifeEventsTableBody)dom.lifeEventsTableBody.innerHTML=''; } // Minified
function getTableData(tb, cns) { /* ... */ const d=[]; if(!tb)return d; tb.querySelectorAll('tr').forEach(r=>{const rd={};let hd=false;cns.forEach(cn=>{const e=r.querySelector(`.${cn}`);if(e){rd[cn]=e.value;if(e.value&&e.value.trim()!=='')hd=true;}else{rd[cn]='';}});const isInv=cns.some(cn=>cn.includes('investment'));const isEv=cns.some(cn=>cn.includes('event'));if(hd||isInv||isEv){d.push(rd);}}); return d; } // Minified
function setTableData(tbody, data, addRowFn) { /* ... */ if (!data || !tbody) return; data.forEach(rowData => { addRowFn(rowData); }); } // Minified