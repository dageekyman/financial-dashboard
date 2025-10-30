import * as dom from './dom.js';
import { formatCurrency, parseCurrency } from './utils.js';
import { calculateSSBenefits, calculateRetirementIncome } from './calculations.js';
// Import ALL chart functions now
import { createNetWorthChart, createBudgetChart, createAssetAllocationChart, resetCharts } from './charts.js';
import { handleInputChange } from './main.js';

// --- Amortization Helper ---
function calculateLoanBalance(P, r, n, p) { /* ... */ if(r===undefined||r===null||isNaN(r)||n===undefined||n===null||isNaN(n)||n<=0||p===undefined||p===null||isNaN(p)||p<0||P<=0)return P>0?P:0; p=Math.min(p,n); if(r<=0)return Math.max(0,P-(P/n)*p); const r1n=Math.pow(1+r,n), r1p=Math.pow(1+r,p); if(r1n===1)return P; const b=P*(r1n-r1p)/(r1n-1); return Math.max(0,b); } // Minified

// --- Projection Display Reset --- (Calls resetCharts)
export function resetProjectionDisplays() { resetCharts(); document.querySelectorAll('.investment-projectedValue, .otherInvestment-projectedValue').forEach(c=>c.textContent='N/A'); dom.setElementText(dom.totalProjectedInvestments,'N/A'); dom.setElementText(dom.totalProjectedOtherInvestments,'N/A'); dom.setElementText(dom.yearsToRetirementResult,'N/A'); dom.setElementText(dom.finalProjectedPortfolioValueResultSpan,'N/A'); dom.setElementText(dom.estimatedMonthlyIncomeFromPortfolioSec3Span,'N/A'); dom.setElementText(dom.projectedMonthlyOtherSourcesIncomeSpan,'N/A'); if(dom.incomeTimelineTableBody)dom.incomeTimelineTableBody.innerHTML=''; dom.setElementText(dom.finalTotalMonthlyIncome,'N/A'); dom.setElementText(dom.finalTotalAnnualIncome,'N/A'); dom.setElementText(dom.totalProjectedMonthlyIncomeAllSourcesSpan,'N/A'); dom.setElementText(dom.totalProjectedAnnualIncomeAllSourcesSpan,'N/A'); dom.setElementText(dom.futureDesiredIncomeResultSpan,'N/A'); dom.setElementText(dom.portfolioSuccessRateResult,'N/A'); dom.setElementText(dom.portfolioLongevityResult,'N/A'); if(dom.simulationYearsDisplay)dom.simulationYearsDisplay.textContent=dom.simulationYearsInput?.value||'30'; if(dom.onTrackMessageSpan){dom.onTrackMessageSpan.textContent='Click "Calculate..."'; dom.onTrackMessageSpan.className="text-md mt-2 text-gray-500";} } // Minified

// --- Section 2: Monthly Budget --- (Calls createBudgetChart)
export function addIncomeRow(income = {}) { /* ... */ const r=dom.incomeTableBody.insertRow(), d=income.description||income['income-description']||'', a=(income.amount||income['income-amount']||0)+''; r.innerHTML=`<td><input class="income-description" value="${d}"></td><td><input type="number" class="income-amount text-right" value="${a}" step=".01"></td><td><button type="button" class="remove-btn income-remove-btn text-xs">X</button></td>`; r.querySelector('.income-remove-btn').addEventListener('click',()=>{r.remove();updateBudgetSummary();handleInputChange();}); r.querySelectorAll('input').forEach(i=>i.addEventListener('input',()=>{updateBudgetSummary();handleInputChange();})); } // Minified
export function addExpenseRow(expense = {}) { /* ... */ const r=dom.expensesTableBody.insertRow(), c=expense.category||expense['expense-category']||'', a=(expense.amount||expense['expense-amount']||0)+''; r.innerHTML=`<td><input class="expense-category" value="${c}"></td><td><input type="number" class="expense-amount text-right" value="${a}" step=".01"></td><td><button type="button" class="remove-btn expense-remove-btn text-xs">X</button></td>`; r.querySelector('.expense-remove-btn').addEventListener('click',()=>{r.remove();updateBudgetSummary();handleInputChange();}); r.querySelectorAll('input').forEach(i=>i.addEventListener('input',()=>{updateBudgetSummary();handleInputChange();})); } // Minified
export function updateTotalIncome() { /* ... */ let t=0; dom.incomeTableBody.querySelectorAll('tr .income-amount').forEach(i=>t+=parseCurrency(i.value)); dom.setElementText(dom.totalMonthlyIncomeSpan,formatCurrency(t)); return t; } // Minified
export function updateTotalExpenses() { /* ... */ let t=0; dom.expensesTableBody.querySelectorAll('tr .expense-amount').forEach(i=>t+=parseCurrency(i.value)); dom.setElementText(dom.totalMonthlyExpensesSpan,formatCurrency(t)); return t; } // Minified
export function updateBudgetSummary() { /* ... */ const i=updateTotalIncome(),e=updateTotalExpenses(),n=i-e; dom.setElementText(dom.summaryTotalIncomeSpan,formatCurrency(i)); dom.setElementText(dom.summaryTotalExpensesSpan,formatCurrency(e)); dom.setElementText(dom.summaryNetSavingsSpan,formatCurrency(n)); if(dom.summaryNetSavingsSpan)dom.summaryNetSavingsSpan.className=n>=0?'font-bold text-green-600':'font-bold text-red-600'; createBudgetChart(); /* <-- Call budget chart update */ } // Minified

// --- Section 3: "Other Assets" --- (No changes)
export function addAssetRow(asset = {}) { /* ... */ const r=dom.currentAssetsTableBody.insertRow(), t=asset.type||asset['asset-type']||'', d=asset.description||asset['asset-description']||'', v=(asset.value||asset['asset-value']||0)+''; r.innerHTML=`<td><input class="asset-type" value="${t}"></td><td><input class="asset-description" value="${d}"></td><td><input type="number" class="asset-value text-right" value="${v}" step=".01"></td><td><button type="button" class="remove-btn asset-remove-btn text-xs">X</button></td>`; r.querySelector('.asset-remove-btn').addEventListener('click',()=>{r.remove();updateNetWorthStatementTotals();handleInputChange();}); r.querySelectorAll('input').forEach(i=>i.addEventListener('input',()=>{updateNetWorthStatementTotals();handleInputChange();})); } // Minified
export function updateSubtotalOtherAssets() { /* ... */ let t=0; dom.currentAssetsTableBody.querySelectorAll('tr .asset-value').forEach(i=>t+=parseCurrency(i.value)); dom.setElementText(dom.subtotalOtherAssets,formatCurrency(t)); return t; } // Minified

// --- Section 4: Current Liabilities --- (No changes)
export function addLiabilityRow(liability = {}) { /* ... */ const r=dom.liabilitiesTableBodyStandalone.insertRow(), t=liability.type||liability['liability-type']||'', d=liability.description||liability['liability-description']||'', b=(liability.balance||liability['liability-balance']||0)+''; r.innerHTML=`<td><input class="liability-type" value="${t}"></td><td><input class="liability-description" value="${d}"></td><td><input type="number" class="liability-balance text-right" value="${b}" step=".01"></td><td><button type="button" class="remove-btn liability-remove-btn text-xs">X</button></td>`; r.querySelector('.liability-remove-btn').addEventListener('click',()=>{r.remove();updateTotalLiabilities();handleInputChange();}); r.querySelectorAll('input').forEach(i=>i.addEventListener('input',()=>{updateTotalLiabilities();handleInputChange();})); } // Minified
export function updateTotalLiabilities() { /* ... */ let t=0; dom.liabilitiesTableBodyStandalone.querySelectorAll('tr .liability-balance').forEach(i=>t+=parseCurrency(i.value)); dom.setElementText(dom.totalLiabilitiesStandalone,formatCurrency(t)); dom.setElementText(dom.totalCurrentLiabilitiesSummary,formatCurrency(t)); updateNetWorthStatementTotals(); return t; } // Minified

// --- Section 5: Main Investments Portfolio --- (No changes)
export function addInvestmentRow(inv = {}) { /* ... */ const p='investment',h=inv[`${p}-holder`]||inv.holder||'P1',a=inv[`${p}-accountType`]||inv.accountType||'',f=inv[`${p}-fund`]||inv.fund||'',cv=(inv[`${p}-currentValue`]||inv.currentValue||0)+'',mc=(inv[`${p}-monthlyContribution`]||inv.monthlyContribution||0)+'',er=(inv[`${p}-expectedReturn`]||inv.expectedReturn||8)+'',sd=(inv[`${p}-stdDev`]||inv.stdDev||12)+'',ex=(inv[`${p}-expenseRatio`]||inv.expenseRatio||0.05)+'',r=dom.investmentsTableBody.insertRow(); r.innerHTML=`<td><select class="${p}-holder"><option value="Person 1" ${h==='P1'?'selected':''}>P1</option><option value="Person 2" ${h==='P2'?'selected':''}>P2</option><option value="Joint" ${h==='Joint'?'selected':''}>Joint</option></select></td><td><input type="text" class="${p}-accountType" value="${a}"></td><td><input type="text" class="${p}-fund" value="${f}"></td><td><input type="number" class="${p}-currentValue text-right" value="${cv}" step=".01"></td><td><input type="number" class="${p}-monthlyContribution text-right" value="${mc}" step=".01"></td><td><input type="number" class="${p}-expectedReturn text-right" value="${er}" step=".1"></td><td><input type="number" class="${p}-stdDev text-right" value="${sd}" step=".1"></td><td><input type="number" class="${p}-expenseRatio text-right" value="${ex}" step=".01"></td><td class="${p}-projectedValue text-right">N/A</td><td><button type="button" class="remove-btn ${p}-remove-btn text-xs">X</button></td>`; const is=r.querySelectorAll(`.${p}-holder, .${p}-accountType, .${p}-fund, .${p}-currentValue, .${p}-monthlyContribution, .${p}-expectedReturn, .${p}-stdDev, .${p}-expenseRatio`); is.forEach(i=>{const et=(i.tagName==='SELECT')?'change':'input'; i.addEventListener(et,()=>{updateInvestmentTotals(); resetProjectionDisplays(); handleInputChange();});}); r.querySelector(`.${p}-remove-btn`).addEventListener('click',()=>{r.remove();updateInvestmentTotals();resetProjectionDisplays();handleInputChange();}); } // Minified
export function updateInvestmentTotals() {
let currentTotal = 0;
    let monthlyTotal = 0;

    // Iterate main investments rows
    dom.investmentsTableBody.querySelectorAll('tr').forEach((row) => {
        const currentValueInput = row.querySelector('.investment-currentValue');
        const monthlyContributionInput = row.querySelector('.investment-monthlyContribution');

        const currentValue = parseCurrency(currentValueInput?.value || '0');
        const monthlyContribution = parseCurrency(monthlyContributionInput?.value || '0');

        currentTotal += currentValue;
        monthlyTotal += monthlyContribution;
    });

    // Set totals for Section 4 → used by Section 3
    dom.setElementText(dom.totalSec5InvestmentsForSummary, formatCurrency(currentTotal));
    dom.setElementText(dom.totalInvestmentMonthlyContribution, formatCurrency(monthlyTotal));

    // Refresh Section 3 net worth statement
    updateNetWorthStatementTotals();
}); dom.setElementText(dom.totalCurrentInvestments,formatCurrency(ct)); dom.setElementText(dom.totalMonthlyContributions,formatCurrency(mt)); dom.setElementText(dom.totalSec5InvestmentsForSummary,formatCurrency(ct)); updateNetWorthStatementTotals(); } // Minified

// --- Section 5: Other Investments --- (No changes)
export function addOtherInvestmentRow(inv = {}) { /* ... */ const p='otherInvestment',h=inv[`${p}-holder`]||inv.holder||'P1',a=inv[`${p}-accountType`]||inv.accountType||'',d=inv[`${p}-description`]||inv.description||'',cv=(inv[`${p}-currentValue`]||inv.currentValue||0)+'',mc=(inv[`${p}-monthlyContribution`]||inv.monthlyContribution||0)+'',er=(inv[`${p}-expectedReturn`]||inv.expectedReturn||5)+'',sd=(inv[`${p}-stdDev`]||inv.stdDev||8)+'',ex=(inv[`${p}-expenseRatio`]||inv.expenseRatio||0)+'',t=inv[`${p}-treatment`]||inv.treatment||'Portfolio',n=inv[`${p}-notes`]||inv.notes||'',r=dom.otherInvestmentsTableBody.insertRow(); r.innerHTML=`<td><select class="${p}-holder"><option value="Person 1" ${h==='P1'?'selected':''}>P1</option><option value="Person 2" ${h==='P2'?'selected':''}>P2</option><option value="Joint" ${h==='Joint'?'selected':''}>Joint</option></select></td><td><input type="text" class="${p}-accountType" value="${a}"></td><td><input type="text" class="${p}-description" value="${d}"></td><td><input type="number" class="${p}-currentValue text-right" value="${cv}" step=".01"></td><td><input type="number" class="${p}-monthlyContribution text-right" value="${mc}" step=".01"></td><td><input type="number" class="${p}-expectedReturn text-right" value="${er}" step=".01"></td><td><input type="number" class="${p}-stdDev text-right" value="${sd}" step=".1"></td><td><input type="number" class="${p}-expenseRatio text-right" value="${ex}" step=".01"></td><td><select class="${p}-treatment"><option value="Portfolio" ${t==='Portfolio'?'selected':''}>Portfolio</option><option value="LumpSum" ${t==='LumpSum'?'selected':''}>Lump Sum</option><option value="FixedPercent" ${t==='FixedPercent'?'selected':''}>Fixed %</option><option value="FixedAmount" ${t==='FixedAmount'?'selected':''}>Fixed $</option></select></td><td class="${p}-projectedValue text-right">N/A</td><td><input type="text" class="${p}-notes" value="${n}" placeholder="%/$"></td><td><button type="button" class="remove-btn ${p}-remove-btn text-xs">X</button></td>`; const uf=updateOtherInvestmentTotals; const is=r.querySelectorAll(`.${p}-holder, .${p}-accountType, .${p}-description, .${p}-currentValue, .${p}-monthlyContribution, .${p}-expectedReturn, .${p}-stdDev, .${p}-expenseRatio, .${p}-treatment, .${p}-notes`); is.forEach(i=>{const et=(i.tagName==='SELECT')?'change':'input'; i.addEventListener(et,()=>{if(uf)uf(); resetProjectionDisplays(); handleInputChange();});}); r.querySelector(`.${p}-remove-btn`).addEventListener('click',()=>{r.remove(); if(uf)uf(); resetProjectionDisplays(); handleInputChange();}); } // Minified
export function updateOtherInvestmentTotals() {
let currentTotal = 0;
    let monthlyTotal = 0;

    // Iterate other investments rows
    dom.otherInvestmentsTableBody.querySelectorAll('tr').forEach((row) => {
        const currentValueInput = row.querySelector('.otherInvestment-currentValue');
        const monthlyContributionInput = row.querySelector('.otherInvestment-monthlyContribution');

        const currentValue = parseCurrency(currentValueInput?.value || '0');
        const monthlyContribution = parseCurrency(monthlyContributionInput?.value || '0');

        currentTotal += currentValue;
        monthlyTotal += monthlyContribution;
    });

    // Set totals for Section 4 → used by Section 3
    dom.setElementText(dom.totalSec5OtherInvestmentsForSummary, formatCurrency(currentTotal));
    dom.setElementText(dom.totalOtherInvestmentMonthlyContribution, formatCurrency(monthlyTotal));

    // Refresh Section 3 net worth statement
    updateNetWorthStatementTotals();
}); dom.setElementText(dom.totalCurrentOtherInvestments,formatCurrency(ct)); dom.setElementText(dom.totalMonthlyOtherContributions,formatCurrency(mt)); dom.setElementText(dom.totalSec5OtherInvestmentsForSummary,formatCurrency(ct)); updateNetWorthStatementTotals(); } // Minified

// --- Section 7: Real Estate Rental Portfolio --- (Updated for Payments Made)
export function calculateRentalPropertyFinancials(row) { /* ... */ const mr=parseCurrency(row.querySelector('.rental-monthlyRent')?.value||0), mo=parseCurrency(row.querySelector('.rental-monthlyOpEx')?.value||0), mp=parseCurrency(row.querySelector('.rental-monthlyPI')?.value||0), cf=mr-mo-mp; dom.setElementText(row.querySelector('.rental-netCashFlow'),formatCurrency(cf)); const ev=parseCurrency(row.querySelector('.rental-estValue')?.value||0), op=parseCurrency(row.querySelector('.rental-purchasePrice')?.value||0), rc=parseCurrency(row.querySelector('.rental-rehabCost')?.value||0), cc=parseCurrency(row.querySelector('.rental-closingCosts')?.value||0), tac=op+rc+cc, scp=(parseCurrency(dom.rentalSellingCostPercentInput?.value||'6')||6)/100, sa=ev*scp, np=ev-sa-tac; dom.setElementText(row.querySelector('.rental-netProfitIfSold'),formatCurrency(np)); const la=parseCurrency(row.querySelector('.rental-loanAmount')?.value||0), air=parseCurrency(row.querySelector('.rental-interestRate')?.value||0), lt=parseInt(row.querySelector('.rental-loanTerm')?.value||0), pm=parseInt(row.querySelector('.rental-paymentsMade')?.value||0), lbc=row.querySelector('.rental-loanBalance'), ec=row.querySelector('.rental-equity'); let clb=0, eq=ev; if(la>0&&air>=0&&lt>0){const mr=air/12/100, npt=lt*12; clb=calculateLoanBalance(la,mr,npt,pm); eq=ev-clb;} dom.setElementText(lbc,formatCurrency(clb)); dom.setElementText(ec,formatCurrency(eq)); } // Minified
export function addRentalPropertyRow(propData = {}) { /* ... */ const p='rental', ad=propData[`${p}-address`]||propData.address||'', pr=(propData[`${p}-purchasePrice`]||propData.price||0)+'', rh=(propData[`${p}-rehabCost`]||propData.rehabCosts||0)+'', cl=(propData[`${p}-closingCosts`]||propData.closingCosts||0)+'', la=(propData[`${p}-loanAmount`]||propData.loanAmount||0)+'', ir=(propData[`${p}-interestRate`]||propData.interestRate||0)+'', lt=(propData[`${p}-loanTerm`]||propData.loanTerm||0)+'', pm=(propData[`${p}-paymentsMade`]||propData.paymentsMade||0)+'', av=(propData[`${p}-estValue`]||propData.arv||0)+'', rt=(propData[`${p}-monthlyRent`]||propData.rent||0)+'', uo=(propData[`${p}-monthlyOpEx`]||propData.userProvidedMonthlyOpEx||0)+'', mp=(propData[`${p}-monthlyPI`]||propData.monthlyPI||0)+'', r=dom.rentalPortfolioTableBody.insertRow(); r.innerHTML=`<td><input class="${p}-address" value="${ad}"></td><td><input type="number" class="${p}-purchasePrice text-right" value="${pr}" step=".01"></td><td><input type="number" class="${p}-rehabCost text-right" value="${rh}" step=".01"></td><td><input type="number" class="${p}-closingCosts text-right" value="${cl}" step=".01"></td><td><input type="number" class="${p}-loanAmount text-right" value="${la}" step=".01"></td><td><input type="number" class="${p}-interestRate text-right" value="${ir}" step=".01"></td><td><input type="number" class="${p}-loanTerm text-right" value="${lt}" step="1"></td><td><input type="number" class="${p}-paymentsMade text-right" value="${pm}" step="1"></td><td><input type="number" class="${p}-estValue text-right" value="${av}" step=".01"></td><td><input type="number" class="${p}-monthlyRent text-right" value="${rt}" step=".01"></td><td><input type="number" class="${p}-monthlyOpEx text-right" value="${uo}" step=".01"></td><td><input type="number" class="${p}-monthlyPI text-right" value="${mp}" step=".01"></td><td class="${p}-netCashFlow text-right">N/A</td><td class="${p}-loanBalance text-right">N/A</td><td class="${p}-equity text-right">N/A</td><td class="${p}-netProfitIfSold text-right">N/A</td><td><button type="button" class="remove-btn ${p}-remove-btn text-xs">X</button></td>`; r.querySelector(`.${p}-remove-btn`).addEventListener('click',()=>{r.remove();updateRentalPortfolioTotals();resetProjectionDisplays();handleInputChange();}); const is=r.querySelectorAll(`.${p}-address, .${p}-purchasePrice, .${p}-rehabCost, .${p}-closingCosts, .${p}-loanAmount, .${p}-interestRate, .${p}-loanTerm, .${p}-paymentsMade, .${p}-estValue, .${p}-monthlyRent, .${p}-monthlyOpEx, .${p}-monthlyPI`); is.forEach(i=>{i.addEventListener('input',()=>{calculateRentalPropertyFinancials(r);updateRentalPortfolioTotals();handleInputChange();});}); calculateRentalPropertyFinancials(r); } // Minified
export function updateAllRentalFinancials() { /* ... */ dom.rentalPortfolioTableBody.querySelectorAll('tr').forEach(calculateRentalPropertyFinancials); updateRentalPortfolioTotals(); } // Minified
export function updateRentalPortfolioTotals() { /* ... */ let tv=0,tr=0,to=0,tp=0,tc=0,tn=0,tl=0,te=0; dom.rentalPortfolioTableBody.querySelectorAll('tr').forEach(r=>{tv+=parseCurrency(r.querySelector('.rental-estValue').value);tr+=parseCurrency(r.querySelector('.rental-monthlyRent').value);to+=parseCurrency(r.querySelector('.rental-monthlyOpEx').value);tp+=parseCurrency(r.querySelector('.rental-monthlyPI').value);tc+=parseCurrency(r.querySelector('.rental-netCashFlow').textContent);tn+=parseCurrency(r.querySelector('.rental-netProfitIfSold').textContent);tl+=parseCurrency(r.querySelector('.rental-loanBalance').textContent);te+=parseCurrency(r.querySelector('.rental-equity').textContent);}); dom.setElementText(dom.totalRentalPortfolioValue,formatCurrency(tv)); dom.setElementText(dom.totalRentalMonthlyRent,formatCurrency(tr)); dom.setElementText(dom.totalRentalMonthlyOpEx,formatCurrency(to)); dom.setElementText(dom.totalRentalMonthlyPI,formatCurrency(tp)); dom.setElementText(dom.totalRentalNetCashFlow,formatCurrency(tc)); dom.setElementText(dom.totalRentalNetProfitIfSold,formatCurrency(tn)); dom.setElementText(dom.totalRentalLoanBalanceSpan,formatCurrency(tl)); dom.setElementText(dom.totalRentalEquitySpan,formatCurrency(te)); dom.setElementText(dom.totalSec7RentalAssetsValueForSummary,formatCurrency(tv)); updateNetWorthStatementTotals(); } // Minified

// --- Update Net Worth Statement Totals --- (Calls Asset Allocation chart)
export function updateNetWorthStatementTotals() {
// Gather CURRENT asset totals only
    const otherAssetsTotal = updateSubtotalOtherAssets(); // Section 2/Other Assets subtotal (current)
    const mainInvestmentsCurrent = parseCurrency(dom.totalSec5InvestmentsForSummary?.textContent || 0);
    const otherInvestmentsCurrent = parseCurrency(dom.totalSec5OtherInvestmentsForSummary?.textContent || 0);
    const rentalPortfolioCurrent = parseCurrency(dom.totalSec7RentalAssetsValueForSummary?.textContent || 0);

    const totalAssetsCurrent = otherAssetsTotal
        + mainInvestmentsCurrent
        + otherInvestmentsCurrent
        + rentalPortfolioCurrent;

    dom.setElementText(dom.totalCurrentAssetsAll, formatCurrency(totalAssetsCurrent));

    // Liabilities (current balances)
    const totalLiabilitiesCurrent = parseCurrency(dom.totalCurrentLiabilitiesSummary?.textContent || 0);

    const netWorth = totalAssetsCurrent - totalLiabilitiesCurrent;
    dom.setElementText(dom.estimatedNetWorthDisplay, formatCurrency(netWorth));

    // Keep charts in sync
    createNetWorthChart();
    createAssetAllocationChart();
}


// --- Section 6: Social Security --- (No changes needed)
export function populatePerson1SSDropdown() { /* ... */ if(!dom.person1SSStartAgeSelect)return;dom.person1SSStartAgeSelect.innerHTML='';for(let a=62;a<=70;a++){const o=document.createElement('option');o.value=a;o.textContent=a;if(a===67)o.selected=true;dom.person1SSStartAgeSelect.appendChild(o);} } // Minified

// --- Summary Inputs Listener --- (No changes needed)
export function summaryInputsListener() { /* ... */ const rc=dom.yearsToRetirementResult.textContent!=='N/A'; if(rc)calculateRetirementIncome();else resetProjectionDisplays(); } // Minified


// --- NEW Section 8: Life Events ---
export function addLifeEventRow(event = {}) {
    if (!dom.lifeEventsTableBody) return;
    const p = 'event'; // prefix
    const year = event[`${p}-year`] || event.year || new Date().getFullYear() + 1;
    const type = event[`${p}-type`] || event.type || 'Expense';
    const description = event[`${p}-description`] || event.description || '';
    const amount = (event[`${p}-amount`] || event.amount || 0).toString();
    const frequency = event[`${p}-frequency`] || event.frequency || 'One-Time';
    const notes = event[`${p}-notes`] || event.notes || '';

    const row = dom.lifeEventsTableBody.insertRow();
    row.innerHTML = `
        <td><input type="number" class="${p}-year" value="${year}" step="1"></td>
        <td>
            <select class="${p}-type">
                <option value="Expense" ${type === 'Expense' ? 'selected' : ''}>Expense</option>
                <option value="Income" ${type === 'Income' ? 'selected' : ''}>Income</option>
                </select>
        </td>
        <td><input type="text" class="${p}-description" value="${description}" placeholder="e.g., College, Inheritance"></td>
        <td><input type="number" class="${p}-amount text-right" value="${amount}" step="0.01" placeholder="(- expense/+ income)"></td>
        <td>
             <select class="${p}-frequency">
                <option value="One-Time" ${frequency === 'One-Time' ? 'selected' : ''}>One-Time</option>
                <option value="Annual" ${frequency === 'Annual' ? 'selected' : ''}>Annual (Ongoing)</option>
            </select>
        </td>
        <td><input type="text" class="${p}-notes" value="${notes}" placeholder="Details"></td>
        <td><button type="button" class="remove-btn ${p}-remove-btn text-xs">X</button></td>
    `;
    row.querySelector(`.${p}-remove-btn`).addEventListener('click', () => {
        row.remove(); updateLifeEvents(); handleInputChange();
    });
    row.querySelectorAll('input, select').forEach(input => {
        const eventType = (input.tagName === 'SELECT') ? 'change' : 'input';
        input.addEventListener(eventType, () => { updateLifeEvents(); handleInputChange(); });
    });
}

export function updateLifeEvents() {
    console.log("Life events updated (placeholder)");
    // Future: Could recalculate projections if needed, but likely better done via main Calculate button
    // For now, changes trigger auto-save via handleInputChange in listeners
}