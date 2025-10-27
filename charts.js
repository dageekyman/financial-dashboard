import * as dom from './dom.js';
import { parseCurrency, formatCurrency } from './utils.js';

let netWorthChart = null;
let projectionChart = null;
let incomeTimelineChart = null;
let monteCarloChart = null;
let budgetChart = null; // <-- NEW
let assetAllocationChart = null; // <-- NEW

/** Create/Update Net Worth Chart */
export function createNetWorthChart() { const ta=parseCurrency(dom.totalCurrentAssetsAll?.textContent), tl=parseCurrency(dom.totalCurrentLiabilitiesSummary?.textContent); const d={labels:['Assets','Liabilities'],datasets:[{data:[ta,tl],backgroundColor:['#22c55e','#ef4444'],borderColor:'#fff',borderWidth:2}]}; const ctx=document.getElementById('netWorthChart'); if(!ctx)return; if(netWorthChart){netWorthChart.data=d;netWorthChart.update();}else{netWorthChart=new Chart(ctx,{type:'doughnut',data:d,options:{responsive:true,plugins:{legend:{position:'top'},title:{display:true,text:'Net Worth Breakdown',font:{size:16}}},animation:{animateRotate:true,animateScale:true}}});} } // Minified

/** Create/Update Projection Chart */
export function createProjectionChart() { const ytrTxt=document.getElementById('yearsToRetirementResult')?.textContent; if(ytrTxt==='N/A'){if(projectionChart){projectionChart.destroy();projectionChart=null;}return;} const ytr=parseInt(ytrTxt); if(isNaN(ytr)||ytr<0){if(projectionChart){projectionChart.destroy();projectionChart=null;}return;} const inv=[]; dom.investmentsTableBody?.querySelectorAll('tr').forEach(r=>{inv.push({cv:parseCurrency(r.querySelector('.investment-currentValue')?.value||0),ac:parseCurrency(r.querySelector('.investment-monthlyContribution')?.value||0)*12,nr:(parseCurrency(r.querySelector('.investment-expectedReturn')?.value||0)-parseCurrency(r.querySelector('.investment-expenseRatio')?.value||0))/100});}); dom.otherInvestmentsTableBody?.querySelectorAll('tr').forEach(r=>{const t=r.querySelector('.otherInvestment-treatment')?.value; if(t==='Portfolio'){inv.push({cv:parseCurrency(r.querySelector('.otherInvestment-currentValue')?.value||0),ac:parseCurrency(r.querySelector('.otherInvestment-monthlyContribution')?.value||0)*12,nr:(parseCurrency(r.querySelector('.otherInvestment-expectedReturn')?.value||0)-parseCurrency(r.querySelector('.otherInvestment-expenseRatio')?.value||0))/100});}}); const l=[];const d=[]; for(let y=0;y<=ytr;y++){l.push(`Yr ${y}`);let tv=0;inv.forEach(i=>{let pv=i.cv*Math.pow((1+i.nr),y);if(i.nr>=0){if(i.nr>0)pv+=i.ac*((Math.pow((1+i.nr),y)-1)/i.nr);else pv+=i.ac*y;} tv+=pv;});d.push(tv);} const cd={labels:l,datasets:[{label:'Projected Portfolio Value',data:d,borderColor:'#4f46e5',backgroundColor:'rgba(79,70,229,0.1)',fill:true,tension:0.1}]}; if(!dom.projectionChartCanvas)return; if(projectionChart){projectionChart.data=cd;projectionChart.update();}else{projectionChart=new Chart(dom.projectionChartCanvas,{type:'line',data:cd,options:{responsive:true,plugins:{legend:{position:'top'},title:{display:true,text:'Projected Portfolio Growth',font:{size:16}},tooltip:{callbacks:{label:(c)=>`Value: ${formatCurrency(c.parsed.y)}`}}},scales:{y:{ticks:{callback:(v)=>formatCurrency(v)}}}}});} } // Minified

/** Create/Update Income Timeline Chart */
export function createIncomeTimelineChart() { const l=[],id=[],p1d=[],p2d=[],rd=[],od=[]; dom.incomeTimelineTableBody?.querySelectorAll('tr').forEach(r=>{const c=r.querySelectorAll('td');if(c.length<8)return;const a1=c[0].textContent,a2=c[1].textContent;l.push(`Ages ${a1}/${a2}`);id.push(parseCurrency(c[2].textContent));p1d.push(parseCurrency(c[3].textContent));p2d.push(parseCurrency(c[4].textContent));rd.push(parseCurrency(c[5].textContent));od.push(parseCurrency(c[6].textContent));}); if(l.length===0){if(incomeTimelineChart){incomeTimelineChart.destroy();incomeTimelineChart=null;}return;} const cd={labels:l,datasets:[{label:'Portfolio',data:id,backgroundColor:'#3b82f6'},{label:'P1 SS',data:p1d,backgroundColor:'#10b981'},{label:'P2 SS',data:p2d,backgroundColor:'#f59e0b'},{label:'Rental',data:rd,backgroundColor:'#6b7280'},{label:'Other',data:od,backgroundColor:'#8b5cf6'}]}; if(!dom.incomeTimelineChartCanvas)return; if(incomeTimelineChart){incomeTimelineChart.data=cd;incomeTimelineChart.update();}else{incomeTimelineChart=new Chart(dom.incomeTimelineChartCanvas,{type:'bar',data:cd,options:{responsive:true,plugins:{legend:{position:'top'},title:{display:true,text:'Projected Monthly Income Sources',font:{size:16}},tooltip:{callbacks:{label:(c)=>`${c.dataset.label}: ${formatCurrency(c.parsed.y)}`}}},scales:{x:{stacked:true},y:{stacked:true,ticks:{callback:(v)=>formatCurrency(v)},title:{display:true,text:'Monthly Income ($)'}}}}});} } // Minified

/** Create/Update Monte Carlo Chart */
export function createMonteCarloChart(endBalances) { if(!endBalances||endBalances.length===0){if(monteCarloChart){monteCarloChart.destroy();monteCarloChart=null;}return;} if(!dom.monteCarloChartCanvas)return; const nb=20;const minB=Math.min(...endBalances);const maxB=Math.max(...endBalances); if(minB===maxB){if(monteCarloChart){monteCarloChart.destroy();monteCarloChart=null;} console.warn("MC results flat.");return;} const bs=(maxB-minB)/nb;const bins=Array(nb).fill(0);const l=Array(nb).fill(''); for(let i=0;i<nb;i++){const bm=minB+i*bs;const bx=bm+bs;l[i]=`${formatCurrency(bm)} - ${formatCurrency(bx)}`;} endBalances.forEach(b=>{let bi=Math.floor((b-minB)/bs);if(bi>=nb)bi=nb-1;if(bi<0)bi=0;bins[bi]++;}); const cd={labels:l,datasets:[{label:`Count (of ${endBalances.length})`,data:bins,backgroundColor:'#10b981',borderColor:'#059669',borderWidth:1}]}; if(monteCarloChart){monteCarloChart.data=cd;monteCarloChart.options.plugins.title.text=`Distribution of Ending Balances (after ${dom.simulationYearsInput?.value||30} yrs)`;monteCarloChart.update();}else{monteCarloChart=new Chart(dom.monteCarloChartCanvas,{type:'bar',data:cd,options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},title:{display:true,text:`Distribution of Ending Balances (after ${dom.simulationYearsInput?.value||30} yrs)`,font:{size:16}},tooltip:{callbacks:{title:(ti)=>ti[0].label,label:(c)=>`${c.dataset.label}: ${c.parsed.y}`}}},scales:{y:{beginAtZero:true,title:{display:true,text:'Simulations'}},x:{title:{display:true,text:'Ending Balance Range ($)'}}}}});} } // Minified

/**
 * Creates or updates the simple Budget doughnut chart.
 */
export function createBudgetChart() {
    const totalIncome = parseCurrency(dom.totalMonthlyIncomeSpan?.textContent || 0);
    const totalExpenses = parseCurrency(dom.totalMonthlyExpensesSpan?.textContent || 0);

    // Only draw if we have valid data
    if (isNaN(totalIncome) || isNaN(totalExpenses) || (totalIncome === 0 && totalExpenses === 0)) {
         if (budgetChart) { budgetChart.destroy(); budgetChart = null; } // Destroy if exists but data is invalid
        return;
    }

    const chartData = {
        labels: ['Total Income', 'Total Expenses'],
        datasets: [{
            data: [totalIncome, totalExpenses],
            backgroundColor: ['#22c55e', '#ef4444'], // Green, Red
            borderColor: '#ffffff',
            borderWidth: 2
        }]
    };

    if (!dom.budgetChartCanvas) return; // Exit if canvas not found

    if (budgetChart) {
        budgetChart.data = chartData;
        budgetChart.update();
    } else {
        budgetChart = new Chart(dom.budgetChartCanvas, {
            type: 'doughnut', // Doughnut or Pie
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false, // Allow it to fit in smaller container
                plugins: {
                    legend: {
                        position: 'bottom', // Position legend below
                        labels: { boxWidth: 12 }
                    },
                    title: {
                        display: true,
                        text: 'Monthly Budget Breakdown',
                        font: { size: 14 } // Smaller title
                    },
                    tooltip: {
                         callbacks: { label: (c) => `${c.label}: ${formatCurrency(c.raw)}` }
                    }
                },
                animation: { animateRotate: true, animateScale: false } // Simple rotation
            }
        });
    }
}

/**
 * Creates or updates the Asset Allocation doughnut chart.
 */
export function createAssetAllocationChart() {
    // Get asset subtotals from the Net Worth section
    const otherAssets = parseCurrency(dom.subtotalOtherAssets?.textContent || 0);
    const mainInvestments = parseCurrency(dom.totalSec5InvestmentsForSummary?.textContent || 0);
    const otherInvestments = parseCurrency(dom.totalSec5OtherInvestmentsForSummary?.textContent || 0);
    const rentalValue = parseCurrency(dom.totalSec7RentalAssetsValueForSummary?.textContent || 0);
    const totalAssets = otherAssets + mainInvestments + otherInvestments + rentalValue;

     // Only draw if we have valid total assets > 0
    if (isNaN(totalAssets) || totalAssets <= 0) {
         if (assetAllocationChart) { assetAllocationChart.destroy(); assetAllocationChart = null; }
        return;
    }

    const chartData = {
        labels: ['Other Assets (Cash/Vehicles)', 'Main Investments', 'Other Investments', 'Rental Properties'],
        datasets: [{
            data: [otherAssets, mainInvestments, otherInvestments, rentalValue],
            backgroundColor: [
                '#a8a29e', // Stone 400 (for Cash/Other)
                '#60a5fa', // Blue 400 (for Main Inv)
                '#8b5cf6', // Violet 500 (for Other Inv)
                '#f59e0b'  // Amber 500 (for Rentals)
            ],
            borderColor: '#ffffff',
            borderWidth: 2
        }]
    };

    if (!dom.assetAllocationChartCanvas) return; // Exit if canvas not found

    if (assetAllocationChart) {
        assetAllocationChart.data = chartData;
        assetAllocationChart.update();
    } else {
        assetAllocationChart = new Chart(dom.assetAllocationChartCanvas, {
            type: 'pie', // Pie or Doughnut
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { boxWidth: 12 }
                    },
                    title: {
                        display: true,
                        text: 'Current Asset Allocation',
                        font: { size: 16 }
                    },
                    tooltip: {
                         callbacks: {
                             label: (c) => {
                                 const value = c.raw;
                                 const percentage = totalAssets > 0 ? ((value / totalAssets) * 100).toFixed(1) : 0;
                                 return `${c.label}: ${formatCurrency(value)} (${percentage}%)`;
                             }
                         }
                    }
                },
                animation: { animateRotate: true, animateScale: true }
            }
        });
    }
}


/** Destroys all charts */
export function resetCharts() {
    if (netWorthChart) { netWorthChart.destroy(); netWorthChart = null; }
    if (projectionChart) { projectionChart.destroy(); projectionChart = null; }
    if (incomeTimelineChart) { incomeTimelineChart.destroy(); incomeTimelineChart = null; }
    if (monteCarloChart) { monteCarloChart.destroy(); monteCarloChart = null; }
    if (budgetChart) { budgetChart.destroy(); budgetChart = null; } // <-- NEW
    if (assetAllocationChart) { assetAllocationChart.destroy(); assetAllocationChart = null; } // <-- NEW
}