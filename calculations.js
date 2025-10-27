import * as dom from './dom.js';
import { formatCurrency, parseCurrency } from './utils.js';
import { updateNetWorthStatementTotals } from './ui.js';
import { createMonteCarloChart } from './charts.js';

// --- Module-scoped state variables ---
let currentProjectedRothTotal = 0;
let currentProjectedNonRothTotal = 0;

// --- Standard SSA Factors --- (Unchanged)
const reductionFactors = { 62: 0.70, 63: 0.75, 64: 0.80, 65: 0.867, 66: 0.933, 67: 1.00 };
const delayedCredits = { 68: 1.08, 69: 1.16, 70: 1.24 };
const spousalReductionFactors = { 62: 0.325, 63: 0.35, 64: 0.375, 65: 0.417, 66: 0.458, 67: 0.50 };

// --- Monte Carlo Helper --- (Unchanged)
function gaussianRandom(mean = 0, stdDev = 1) { /* ... */ let u=0,v=0;while(u===0)u=Math.random();while(v===0)v=Math.random();const z=Math.sqrt(-2.0*Math.log(u))*Math.cos(2.0*Math.PI*v);return z*stdDev+mean; } // Minified

// --- Section 6: Social Security Calculations --- (Unchanged)
export function calculateSSBenefits() { /* ... */ const p1FRA=parseCurrency(dom.person1FRABenefitInput.value)||0; const p2FRAOwn=parseCurrency(dom.person2FRABenefitInput.value)||0; const selP1Age=parseInt(dom.person1SSStartAgeSelect.value); let p1MB=0; if(selP1Age>=62&&selP1Age<=66)p1MB=p1FRA*(reductionFactors[selP1Age]||0); else if(selP1Age===67)p1MB=p1FRA; else if(selP1Age>=68&&selP1Age<=70)p1MB=p1FRA*(delayedCredits[selP1Age]||0); dom.setElementText(dom.person1SelectedSSBenefitSpan,formatCurrency(p1MB)); const selP2Age=parseInt(dom.person2SSStartAgeSelect.value); let p2MB_Own=0,p2MB_Sp=0; if(selP2Age>=62&&selP2Age<=67){p2MB_Own=p2FRAOwn*(reductionFactors[selP2Age]||0);const spM=Object.entries(spousalReductionFactors).find(([a,f])=>parseInt(a)===selP2Age)?.[1]||0;p2MB_Sp=p1FRA*spM;} const p2Fin=Math.max(p2MB_Own,p2MB_Sp); dom.setElementText(dom.person2SelectedSSBenefitSpan,formatCurrency(p2Fin)); const totM=p1MB+p2Fin; dom.setElementText(dom.totalCombinedMonthlySSSpan,formatCurrency(totM)); dom.setElementText(dom.totalCombinedAnnualSSSpan,formatCurrency(totM*12)); populateBenefitTable(dom.person1SSBenefitsTableBody,p1FRA,reductionFactors,delayedCredits); populateBenefitTable(dom.person2SSBenefitsTableBody,p1FRA,spousalReductionFactors,null,p2FRAOwn); } // Minified
function populateBenefitTable(tb, fb, ef, lf, ofb=0) { /* ... */ if(!tb)return;tb.innerHTML='';const sa=Object.keys(ef).map(Number);if(lf)sa.push(...Object.keys(lf).map(Number));sa.sort((a,b)=>a-b);sa.forEach(age=>{let mb=0;if(age<67){if(ofb>0&&lf===null){const ob=ofb*(reductionFactors[age]||0);const sb=fb*(ef[age]||0);mb=Math.max(ob,sb);}else{mb=fb*(ef[age]||0);}}else if(age===67){if(ofb>0&&lf===null){const sb=fb*(ef[age]||.5);mb=Math.max(ofb,sb);}else{mb=fb;}}else if(lf&&age>=68){mb=fb*(lf[age]||0);} if(mb>0||age>=62){const r=tb.insertRow();r.insertCell().textContent=age;r.insertCell().textContent=formatCurrency(mb);}}); } // Minified


// --- Main Projection Calculation & Overall Summary Update ---
export function projectInvestmentTable(tbody, prefix, yearsToRetirement) { /* ... */ const results=[]; if(!tbody)return results; tbody.querySelectorAll('tr').forEach(row=>{const rowData={}; row.querySelectorAll(`input[class*="${prefix}-"], select[class*="${prefix}-"]`).forEach(el=>{const key=el.className.split(' ').find(cls=>cls.startsWith(prefix))?.replace(prefix+'-',''); if(key)rowData[key]=el.value;}); const cell=row.querySelector(`.${prefix}-projectedValue`); if(!cell)return; let projectedValue=0; if(yearsToRetirement<=0){cell.textContent='N/A';} else {const cv=parseCurrency(rowData['currentValue']||0);const mc=parseCurrency(rowData['monthlyContribution']||0);const ac=mc*12;const gr=parseCurrency(rowData['expectedReturn']||0);const er=parseCurrency(rowData['expenseRatio']||0);const nr=(gr-er)/100; projectedValue=cv*Math.pow((1+nr),yearsToRetirement); if(nr>=0){if(nr>0)projectedValue+=ac*((Math.pow((1+nr),yearsToRetirement)-1)/nr);else projectedValue+=ac*yearsToRetirement;} cell.textContent=formatCurrency(projectedValue);} rowData.projectedValue=projectedValue; rowData.stdDev=parseCurrency(rowData['stdDev']||0)/100; rowData.netReturn=(parseCurrency(rowData['expectedReturn']||0)-parseCurrency(rowData['expenseRatio']||0))/100; results.push(rowData);}); return results; } // Minified

export function calculateFullProjectionAndSummary() { /* ... */ calculateSSBenefits(); const age1=parseInt(dom.currentAge1Input.value)||0; const age2=parseInt(dom.currentAge2Input.value)||0; const retAge=parseInt(dom.retirementAgeInput.value)||0; const olderAge=Math.max(age1,age2); let yrs=retAge-olderAge; if(yrs<0)yrs=0; dom.setElementText(document.getElementById('yearsToRetirementResult'),yrs); currentProjectedRothTotal=0; currentProjectedNonRothTotal=0; let mainPV=0, otherPV_port=0, otherIncomeMonthly=0; const mainRes=projectInvestmentTable(dom.investmentsTableBody,'investment',yrs); mainRes.forEach(inv=>{mainPV+=inv.projectedValue; const at=inv.accountType?.toLowerCase()||''; if(at.includes('roth'))currentProjectedRothTotal+=inv.projectedValue; else currentProjectedNonRothTotal+=inv.projectedValue;}); dom.setElementText(dom.totalProjectedInvestments,formatCurrency(mainPV)); const otherRes=projectInvestmentTable(dom.otherInvestmentsTableBody,'otherInvestment',yrs); let otherPV_total=0; otherRes.forEach(inv=>{otherPV_total+=inv.projectedValue; const treat=inv.treatment; if(treat==='Portfolio'){otherPV_port+=inv.projectedValue; const at=inv.accountType?.toLowerCase()||''; if(at.includes('roth'))currentProjectedRothTotal+=inv.projectedValue; else currentProjectedNonRothTotal+=inv.projectedValue;}else if(treat==='FixedPercent'){const pct=parseCurrency(inv.notes||0)/100; if(pct>0)otherIncomeMonthly+=(inv.projectedValue*pct)/12;}else if(treat==='FixedAmount'){const amt=parseCurrency(inv.notes||0); if(amt>0)otherIncomeMonthly+=amt;}}); dom.setElementText(dom.totalProjectedOtherInvestments,formatCurrency(otherPV_total)); const withdrawPV=mainPV+otherPV_port; dom.setElementText(dom.finalProjectedPortfolioValueResultSpan,formatCurrency(withdrawPV)); const resArea=document.getElementById('resultsArea'); if(resArea)resArea.classList.remove('hidden'); calculateRetirementIncome(otherIncomeMonthly); updateNetWorthStatementTotals(); } // Minified

export function calculateRetirementIncome(otherIncomeSourcesMonthlyTotal = 0) { /* ... */ const wdRate=(parseFloat(dom.retirementWithdrawalRateInput.value)||0)/100; const taxRate=(parseCurrency(dom.assumedTaxRateNonRothInput.value)||0)/100; let wdRoth=currentProjectedRothTotal*wdRate; let wdNonRothPre=currentProjectedNonRothTotal*wdRate; let wdNonRothPost=wdNonRothPre*(1-taxRate); let totAnnInvInc=(wdRoth||0)+(wdNonRothPost||0); let estMonIncPort=totAnnInvInc/12; dom.setElementText(dom.estimatedMonthlyIncomeFromPortfolioSec3Span,formatCurrency(estMonIncPort)); const rentInc=parseCurrency(document.getElementById('totalRentalNetCashFlow').textContent)||0; const totOthSrc=otherIncomeSourcesMonthlyTotal+rentInc; dom.setElementText(dom.projectedMonthlyOtherSourcesIncomeSpan,formatCurrency(totOthSrc)); updateIncomeTimelineTable(otherIncomeSourcesMonthlyTotal); runMonteCarloSimulation(otherIncomeSourcesMonthlyTotal); calculateDeterministicLongevity(otherIncomeSourcesMonthlyTotal); } // Minified
function updateIncomeTimelineTable(otherIncomeSourcesMonthlyTotal = 0) { /* ... */ if(!dom.incomeTimelineTableBody)return;dom.incomeTimelineTableBody.innerHTML='';const a1v=parseInt(dom.currentAge1Input.value)||0;const a2v=parseInt(dom.currentAge2Input.value)||0;const rAV=parseInt(dom.retirementAgeInput.value)||0;const p1SA=parseInt(dom.person1SSStartAgeSelect.value);const p2SA=parseInt(dom.person2SSStartAgeSelect.value);const aD=a1v-a2v;const portInc=parseCurrency(dom.estimatedMonthlyIncomeFromPortfolioSec3Span.textContent)||0;const rentInc=parseCurrency(document.getElementById('totalRentalNetCashFlow').textContent)||0;const p1SS=parseCurrency(dom.person1SelectedSSBenefitSpan.textContent)||0;const p2SS=parseCurrency(dom.person2SelectedSSBenefitSpan.textContent)||0;let kAges=new Set();kAges.add(rAV);if(!isNaN(p1SA))kAges.add(p1SA);if(!isNaN(p2SA))kAges.add(p2SA+aD);const skA=[...kAges].filter(a=>a>=rAV&&a>=Math.min(a1v,a2v)).sort((a,b)=>a-b);let fm=0,fa=0;if(skA.length===0&&rAV>0)skA.push(rAV);skA.forEach(p1A=>{const p2A=p1A-aD;const cPI=(p1A>=rAV)?portInc:0;const cRI=(p1A>=rAV)?rentInc:0;const cOI=(p1A>=rAV)?otherIncomeSourcesMonthlyTotal:0;const cP1S=(p1A>=p1SA)?p1SS:0;const cP2S=(p2A>=p2SA)?p2SS:0;const tM=cPI+cP1S+cP2S+cRI+cOI;const r=dom.incomeTimelineTableBody.insertRow();r.innerHTML=`<td class="tc">${p1A}</td><td class="tc">${p2A}</td><td class="tr">${formatCurrency(cPI)}</td><td class="tr">${formatCurrency(cP1S)}</td><td class="tr">${formatCurrency(cP2S)}</td><td class="tr">${formatCurrency(cRI)}</td><td class="tr">${formatCurrency(cOI)}</td><td class="tr fw-bold">${formatCurrency(tM)}</td>`;fm=tM;});fa=fm*12;dom.setElementText(dom.finalTotalMonthlyIncome,formatCurrency(fm));dom.setElementText(dom.finalTotalAnnualIncome,formatCurrency(fa));dom.setElementText(dom.totalProjectedMonthlyIncomeAllSourcesSpan,formatCurrency(fm));dom.setElementText(dom.totalProjectedAnnualIncomeAllSourcesSpan,formatCurrency(fa));updateOnTrackMessage(fa);} // Minified (tc=text-center, tr=text-right, fw-bold=font-semibold)
function updateOnTrackMessage(finalAnnualIncome) { /* ... */ const infR=(parseFloat(dom.inflationRateInput.value)||0)/100; const yrsTxt=document.getElementById('yearsToRetirementResult').textContent; if(yrsTxt==='N/A'){dom.setElementText(dom.futureDesiredIncomeResultSpan,'N/A');if(dom.onTrackMessageSpan)dom.onTrackMessageSpan.textContent='Calc projections.';return;} const yrs=parseInt(yrsTxt); if(isNaN(yrs)||yrs<0){dom.setElementText(dom.futureDesiredIncomeResultSpan,'N/A');return;} const desInc=parseCurrency(dom.desiredRetirementIncomeTodayInput.value); if(desInc<=0){dom.setElementText(dom.futureDesiredIncomeResultSpan,'N/A');return;} const futDesInc=desInc*Math.pow((1+infR),yrs); dom.setElementText(dom.futureDesiredIncomeResultSpan,formatCurrency(futDesInc)); if(dom.onTrackMessageSpan){if(finalAnnualIncome!==null&&!isNaN(finalAnnualIncome)&&finalAnnualIncome>=futDesInc){dom.onTrackMessageSpan.textContent="On track (deterministic)!";dom.onTrackMessageSpan.className="text-md mt-2 font-semibold text-green-700";}else if(finalAnnualIncome!==null&&!isNaN(finalAnnualIncome)){const sf=futDesInc-finalAnnualIncome;dom.onTrackMessageSpan.textContent=`Shortfall (deterministic): ${formatCurrency(sf)}/yr.`;dom.onTrackMessageSpan.className="text-md mt-2 font-semibold text-red-700";}else{dom.onTrackMessageSpan.textContent='Goal comparison pending.';dom.onTrackMessageSpan.className="text-md mt-2 text-gray-500";}} } // Minified

// --- Monte Carlo Simulation (Integrates Life Events) ---
function runMonteCarloSimulation(otherIncomeSourcesMonthlyTotal = 0) {
    const numSimulations = 1000;
    let successfulRuns = 0;
    const endingBalances = [];

    // Get parameters
    const inflationRate = (parseFloat(dom.inflationRateInput.value) || 0) / 100;
    const postRetirementAvgReturn = (parseCurrency(dom.postRetirementReturnRateInput.value) || 0) / 100;
    const postRetirementStdDev = (parseCurrency(dom.postRetirementStdDevInput.value) || 0) / 100;
    const simulationYears = parseInt(dom.simulationYearsInput.value) || 30;
    const initialPortfolioBalance = parseCurrency(dom.finalProjectedPortfolioValueResultSpan?.textContent || '0');
    let initialAnnualExpenses = parseCurrency(dom.futureDesiredIncomeResultSpan?.textContent || '0'); // Base expenses (desired income goal)

    // Get fixed annual other income
     const person1SS = parseCurrency(dom.person1SelectedSSBenefitSpan.textContent) || 0;
     const person2SS = parseCurrency(dom.person2SelectedSSBenefitSpan.textContent) || 0;
     const rentalIncome = parseCurrency(document.getElementById('totalRentalNetCashFlow').textContent) || 0;
     const annualSSIncome = (person1SS + person2SS) * 12;
     const annualRentalCF = rentalIncome * 12;
     const annualOtherFixedIncome = otherIncomeSourcesMonthlyTotal * 12; // From Fixed%, Fixed$ investments
     const baseAnnualOtherIncome = annualSSIncome + annualRentalCF + annualOtherFixedIncome;

    if (isNaN(initialAnnualExpenses) || isNaN(initialPortfolioBalance) || simulationYears <= 0) {
        dom.setElementText(dom.portfolioSuccessRateResult, 'N/A'); createMonteCarloChart([]); return;
    }
    dom.setElementText(dom.simulationYearsDisplay, simulationYears);

    // --- Process Life Events ---
    const lifeEvents = [];
    const currentYear = new Date().getFullYear(); // Needed to map event year to simulation year
    const yearsToRetirement = parseInt(document.getElementById('yearsToRetirementResult')?.textContent || '0');
    const retirementYear = currentYear + yearsToRetirement;

    dom.lifeEventsTableBody?.querySelectorAll('tr').forEach(row => {
        const eventYear = parseInt(row.querySelector('.event-year')?.value || '0');
        const eventType = row.querySelector('.event-type')?.value;
        const amountText = row.querySelector('.event-amount')?.value;
        const frequency = row.querySelector('.event-frequency')?.value;

        if (eventYear >= retirementYear && amountText && eventType && frequency) {
            const amount = parseCurrency(amountText); // Negative for Expense, Positive for Income
             // Calculate the simulation year this event starts (1 = first year of retirement)
             const startSimYear = eventYear - retirementYear + 1;

            if (startSimYear > 0 && amount !== 0) { // Only consider events during retirement simulation
                 lifeEvents.push({
                     startSimYear: startSimYear,
                     type: eventType,
                     amount: amount, // Annual amount
                     frequency: frequency
                 });
            }
        }
    });
    // Sort events by year they start
    lifeEvents.sort((a, b) => a.startSimYear - b.startSimYear);


    // --- Run Simulations ---
    for (let i = 0; i < numSimulations; i++) {
        let currentBalance = initialPortfolioBalance;
        let currentAnnualExpenses = initialAnnualExpenses; // Start with base desired income
        let currentAnnualOtherIncome = baseAnnualOtherIncome; // Start with base other income
        let activeAnnualEvents = []; // Track ongoing annual events
        let survived = true;

        for (let year = 1; year <= simulationYears; year++) {
             // --- Apply Life Events for this year ---
             let oneTimeExpense = 0;
             let oneTimeIncome = 0;

            // Check for new annual events starting this year
            lifeEvents.forEach(event => {
                if (event.startSimYear === year && event.frequency === 'Annual') {
                     activeAnnualEvents.push(event);
                 }
            });

             // Apply active annual events
             activeAnnualEvents.forEach(event => {
                  if (event.type === 'Expense') currentAnnualExpenses += Math.abs(event.amount); // Add annual expense
                  else if (event.type === 'Income') currentAnnualOtherIncome += event.amount; // Add annual income
                  // Asset Change deferred for now
             });

             // Apply one-time events for this year
             lifeEvents.forEach(event => {
                  if (event.startSimYear === year && event.frequency === 'One-Time') {
                      if (event.type === 'Expense') oneTimeExpense += Math.abs(event.amount);
                      else if (event.type === 'Income') oneTimeIncome += event.amount;
                      // Asset Change deferred for now
                  }
             });

            // Adjust expenses and income for one-time events for this year only
            let expensesThisYear = currentAnnualExpenses + oneTimeExpense;
            let otherIncomeThisYear = currentAnnualOtherIncome + oneTimeIncome;


            // --- Standard Simulation Steps ---
            let netWithdrawalNeeded = expensesThisYear - otherIncomeThisYear;
            if (netWithdrawalNeeded < 0) netWithdrawalNeeded = 0;
            currentBalance -= netWithdrawalNeeded;

            if (currentBalance < 0) { survived = false; break; }

            const annualReturn = gaussianRandom(postRetirementAvgReturn, postRetirementStdDev);
            currentBalance *= (1 + annualReturn);

            // Inflate base expenses for next year, annual event amounts are NOT inflated here (simplification)
            currentAnnualExpenses *= (1 + inflationRate);

        } // End year loop

        endingBalances.push(currentBalance < 0 ? 0 : currentBalance);
        if (survived) successfulRuns++;

    } // End simulation loop

    const successRate = (successfulRuns / numSimulations) * 100;
    dom.setElementText(dom.portfolioSuccessRateResult, successRate.toFixed(1));
    createMonteCarloChart(endingBalances); // Draw histogram
}


// --- Deterministic Longevity Calculation (Integrates Life Events) ---
 function calculateDeterministicLongevity(otherIncomeSourcesMonthlyTotal = 0) {
    const inflationRate = (parseFloat(dom.inflationRateInput.value) || 0) / 100;
    const postRetirementReturnRate = (parseCurrency(dom.postRetirementReturnRateInput.value) || 0) / 100;
    const futureDesiredIncomeText = dom.futureDesiredIncomeResultSpan.textContent;
    const totalProjectedPortfolioText = dom.finalProjectedPortfolioValueResultSpan ? dom.finalProjectedPortfolioValueResultSpan.textContent : 'N/A';
    const person1SS = parseCurrency(dom.person1SelectedSSBenefitSpan.textContent) || 0;
    const person2SS = parseCurrency(dom.person2SelectedSSBenefitSpan.textContent) || 0;
    const rentalIncome = parseCurrency(document.getElementById('totalRentalNetCashFlow').textContent) || 0;

    let initialPortfolioBalance = parseCurrency(totalProjectedPortfolioText);
    let initialAnnualExpenses = parseCurrency(futureDesiredIncomeText);
    const annualSSIncome = (person1SS + person2SS) * 12;
    const annualRentalCF = rentalIncome * 12;
    const annualOtherFixedIncome = otherIncomeSourcesMonthlyTotal * 12;
    const baseAnnualOtherIncome = annualSSIncome + annualRentalCF + annualOtherFixedIncome;

    let yearsLasting = 0;
    const MAX_LONGEVITY_YEARS = 100;

    if (isNaN(initialAnnualExpenses) || initialAnnualExpenses <= 0 || isNaN(initialPortfolioBalance)) {
         dom.setElementText(dom.portfolioLongevityResult, 'N/A'); return;
    }

    // --- Process Life Events (same logic as Monte Carlo) ---
    const lifeEvents = [];
    const currentYear = new Date().getFullYear();
    const yearsToRetirement = parseInt(document.getElementById('yearsToRetirementResult')?.textContent || '0');
    const retirementYear = currentYear + yearsToRetirement;

    dom.lifeEventsTableBody?.querySelectorAll('tr').forEach(row => { /* ... */ const eventYear=parseInt(row.querySelector('.event-year')?.value||'0'); const eventType=row.querySelector('.event-type')?.value; const amountText=row.querySelector('.event-amount')?.value; const frequency=row.querySelector('.event-frequency')?.value; if(eventYear>=retirementYear&&amountText&&eventType&&frequency){const amount=parseCurrency(amountText); const startSimYear=eventYear-retirementYear+1; if(startSimYear>0&&amount!==0){lifeEvents.push({startSimYear:startSimYear,type:eventType,amount:amount,frequency:frequency});}} }); // Minified event parsing
    lifeEvents.sort((a, b) => a.startSimYear - b.startSimYear);

    // --- Simulate Deterministic Path ---
    let currentBalance = initialPortfolioBalance;
    let currentAnnualExpenses = initialAnnualExpenses;
    let currentAnnualOtherIncome = baseAnnualOtherIncome;
    let activeAnnualEvents = [];

    while (currentBalance > 0 && yearsLasting < MAX_LONGEVITY_YEARS) {
        yearsLasting++;
        const simYear = yearsLasting; // Simulation year (1 = first year of retirement)

        // Apply Life Events
        let oneTimeExpense = 0; let oneTimeIncome = 0;
        lifeEvents.forEach(event => { if (event.startSimYear === simYear && event.frequency === 'Annual') activeAnnualEvents.push(event); });
        activeAnnualEvents.forEach(event => { if (event.type === 'Expense') currentAnnualExpenses += Math.abs(event.amount); else if (event.type === 'Income') currentAnnualOtherIncome += event.amount; });
        lifeEvents.forEach(event => { if (event.startSimYear === simYear && event.frequency === 'One-Time') { if (event.type === 'Expense') oneTimeExpense += Math.abs(event.amount); else if (event.type === 'Income') oneTimeIncome += event.amount; } });
        let expensesThisYear = currentAnnualExpenses + oneTimeExpense;
        let otherIncomeThisYear = currentAnnualOtherIncome + oneTimeIncome;

        // Standard Steps
        let netWithdrawalNeeded = expensesThisYear - otherIncomeThisYear;
        if (netWithdrawalNeeded < 0) netWithdrawalNeeded = 0;
        currentBalance -= netWithdrawalNeeded;
        if (currentBalance <= 0) break;
        currentBalance *= (1 + postRetirementReturnRate); // Use fixed return
        currentAnnualExpenses *= (1 + inflationRate); // Inflate base expenses
        // Note: Annual event amounts are NOT inflated in this simple model
    }

    // Display result
    if (yearsLasting >= MAX_LONGEVITY_YEARS && currentBalance > 0) { dom.setElementText(dom.portfolioLongevityResult, `${MAX_LONGEVITY_YEARS}+`); }
    else if (currentBalance <= 0 && yearsLasting > 0) { dom.setElementText(dom.portfolioLongevityResult, yearsLasting -1); }
    else { dom.setElementText(dom.portfolioLongevityResult, yearsLasting); }
}