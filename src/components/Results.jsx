// src/components/Results.jsx
import React from 'react';
import { formatCurrency, parseCurrency } from '../utils';
import { Doughnut, Line, Bar } from 'react-chartjs-2'; 
import { useAppContext } from '../hooks/useAppContext'; 

// --- Helper Components for Chart Rendering (KEEP NetWorthChart here for reference, but it won't be called) ---

const NetWorthChart = ({ totalAssets, totalLiabilities, netWorth }) => {
    // Only render if we have meaningful data
    if ((totalAssets || 0) + (totalLiabilities || 0) <= 0) return null; 

    const data = {
        labels: ['Total Assets', 'Total Liabilities'],
        datasets: [{
            data: [totalAssets || 0, totalLiabilities || 0],
            backgroundColor: ['#22c55e', '#ef4444'], // Green, Red
            borderColor: netWorth >= 0 ? '#10b981' : '#dc2626',
            borderWidth: 2
        }]
    };
    return (
        // FIX: Reduced the maximum size of the Doughnut chart wrapper (w-1/2 -> w-2/5)
        <div className="w-full sm:w-2/3 md:w-2/5 mx-auto my-6">
            <Doughnut data={data} options={{ 
                plugins: { 
                    title: { display: true, text: 'Net Worth Breakdown (Assets versus Liabilities)', font: { size: 16 } },
                    tooltip: {
                         callbacks: {
                            label: (context) => `${context.label}: ${formatCurrency(context.parsed)}`
                         }
                    }
                } 
            }} />
        </div>
    );
};


// --- Main Results Section Component ---
const ResultsSection = () => {
    // FIX: Get appData and calculationResults directly from Context
    const { appData, calculationResults, yearsToRetirement } = useAppContext();
    
    // Define reusable class for header cell borders
    const headerCellClass = "border-r border-gray-300";

    // --- Data Extraction (Defensive Check) ---
    const results = calculationResults || {};
    const assumptions = appData?.assumptions || {}; 

    const { 
        simulationYearsInput = 30, 
        postRetirementReturnRateInput = 0, 
        postRetirementStdDevInput = 0,
        desiredRetirementIncomeToday = 0,
        retirementWithdrawalRate = 0,
        assumedTaxRateNonRoth = 0
    } = assumptions;

    // Totals for Net Worth Chart (Defensive reading of nested state)
    // Note: totalCurrentAssets is now calculated and stored in results state by App.jsx
    const totalCurrentAssets = results.totalCurrentAssets || 0;
    const totalLiabilities = (appData?.liabilities || []).reduce((sum, item) => sum + (item.balance || 0), 0);
    const netWorth = totalCurrentAssets - totalLiabilities;
    
    const hasProjectionData = yearsToRetirement !== undefined && yearsToRetirement !== null;
    const successRate = parseCurrency(results.successRate); 
    const totalSimulations = 1000;
    const successfulSims = Math.round((successRate / 100) * totalSimulations);
    
    const oldestAge = appData?.personalInfo?.currentAge1 > appData?.personalInfo?.currentAge2 ? appData.personalInfo.currentAge1 : appData.personalInfo.currentAge2;
    const retirementAge = appData?.personalInfo?.retirementAge || 0;
    const endAge = (oldestAge < retirementAge ? retirementAge : oldestAge) + (simulationYearsInput || 0);

    // --- Data needed for NEW Summary Structure ---
    const totalWithdrawalPool = results.totalWithdrawalPool || 0;
    const estimatedMonthlyInvestmentIncome = results.estimatedMonthlyInvestmentIncome || 0;
    
    // 🏆 FIX: Extract Rental CF and recalculate Other Fixed Monthly Income
    const totalRentalNetCashFlow = results.totalRentalNetCashFlow || 0;
    // Recalculate Other Fixed Monthly Income (Total Other Sources minus Rental CF)
    const totalOtherFixedMonthlyIncome = (results.totalOtherSourcesMonthlyIncome || 0) - totalRentalNetCashFlow;
    
    const finalTotalMonthlyIncome = results.finalTotalMonthlyIncome || 0;
    const finalTotalAnnualIncome = finalTotalMonthlyIncome * 12;

    // Calculate Desired Annual Income at Retirement (Inflated)
    // This requires the inflation rate from assumptions which is in Investments.jsx
    const inflationRate = appData.assumptions.inflationRate / 100;
    const initialAnnualExpenses = parseCurrency(desiredRetirementIncomeToday) * Math.pow(1 + inflationRate, yearsToRetirement);
    const desiredAnnualIncomeInflated = isNaN(initialAnnualExpenses) ? 0 : initialAnnualExpenses;
    
    // --- Monte Carlo Time Series Data Setup ---
    const mcTimeLineData = results.mcTimeLineData || { labels: [], p10: [], p50: [], p90: [] };

    const createTimeLineChartData = () => {
        if (!mcTimeLineData.labels || mcTimeLineData.labels.length === 0) return { labels: [], datasets: [] };
        
        return {
            labels: mcTimeLineData.labels, // Ages
            datasets: [
                { label: '90th Percentile (Top Outcome)', data: mcTimeLineData.p90, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: false, borderDash: [5, 5], tension: 0.1, pointRadius: 0 },
                { label: '50th Percentile (Median)', data: mcTimeLineData.p50, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.2)', fill: false, tension: 0.1, pointRadius: 0 },
                { label: '10th Percentile (Worst Outcome)', data: mcTimeLineData.p10, borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', fill: false, borderDash: [5, 5], tension: 0.1, pointRadius: 0 }
            ]
        };
    };

    const timeLineChartData = createTimeLineChartData();


    return (
        <section className="space-y-6"> 
            
            <h2 className="text-3xl font-bold mb-4 text-indigo-700">6. Detailed Results</h2>
            
            {/* --- NEW: Overall Projected Retirement Income Summary (Matching Screenshot) --- */}
            <div className="results-summary-card p-4 border border-gray-300 rounded-lg bg-gray-50">
                <h3 className="text-xl font-bold mb-4 text-indigo-700">Overall Projected Retirement Income Summary</h3>
                
                <p className="text-md mb-2">Years until retirement (based on older person): <span className="font-bold text-lg text-indigo-700">{yearsToRetirement || 'N/A'}</span></p>
                
                <p className="text-md mb-2">Total Projected Investment Portfolio (for withdrawals): <span className="font-bold text-lg text-indigo-700">{formatCurrency(totalWithdrawalPool)}</span></p>

                <p className="text-md ml-4">Projected Monthly Income from Portfolio (after-tax): <span className="font-bold text-lg text-green-700">{formatCurrency(estimatedMonthlyInvestmentIncome)}</span></p>
                
                {/* 🏆 Rental CF as its own line item */}
                <p className="text-md ml-4">Projected Monthly Income from Rental Real Estate CF: <span className="font-bold text-lg text-green-700">{formatCurrency(totalRentalNetCashFlow)}</span></p>
                
                {/* 🏆 Adjusted label to reflect exclusion of Rental CF */}
                <p className="text-md ml-4 mb-1">Projected Monthly Income from Other Fixed Sources (Pensions, Annuities): <span className="font-bold text-lg text-green-700">{formatCurrency(totalOtherFixedMonthlyIncome)}</span></p>
                
                {/* 🏆 NEW CLARIFYING NOTE FOR SS - Made bigger/bolder, removed redundancy */}
                <p className="text-md font-bold text-gray-700 mb-3">(Note: Social Security income starts at selected ages and is included in the final total income numbers below.)</p>
                
                {/* Longevity added here */}
                <p className="text-md mt-3 font-semibold border-t pt-3">
                    Projected Portfolio Longevity (Deterministic): <span className="font-extrabold text-xl text-indigo-700 ml-2">{results.deterministicLongevity || 'N/A'} years</span>
                </p>

                <p className="text-md mt-4 font-semibold">Final Total Projected Monthly Income: <span className="font-extrabold text-xl text-green-700 ml-2">{formatCurrency(finalTotalMonthlyIncome)}</span></p>
                
                <p className="text-md">Final Total Projected Annual Income: <span className="font-extrabold text-xl text-green-700 ml-2">{formatCurrency(finalTotalAnnualIncome)}</span></p>

                {/* REMOVED REDUNDANT FINAL NOTE */}
            </div>
            
            <hr className="my-3 border-indigo-300"/>

            {/* --- NEW: Retirement Goal Comparison --- */}
            <div className="retirement-goal-comparison-card p-4 border border-green-300 rounded-lg bg-green-50">
                <h3 className="text-xl font-bold text-green-700 mb-4">Retirement Goal Comparison</h3>
                
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div className="input-group">
                        <label className="block text-sm font-medium text-gray-700">Desired Annual Retirement Income (in today's dollars)</label>
                        <input type="text" readOnly value={formatCurrency(desiredRetirementIncomeToday, {minimumFractionDigits: 0})} className="read-only-input font-bold" />
                    </div>
                    <div className="input-group">
                        <label className="block text-sm font-medium text-gray-700">Sustainable Withdrawal Rate from Investments (%)</label>
                        <input type="text" readOnly value={retirementWithdrawalRate} className="read-only-input font-bold" />
                    </div>
                    <div className="input-group">
                        <label className="block text-sm font-medium text-gray-700">Assumed Tax Rate on Non-Roth Withdrawals (%)</label>
                        <input type="text" readOnly value={assumedTaxRateNonRoth} className="read-only-input font-bold" />
                    </div>
                </div>

                <p className="text-lg font-semibold border-t pt-2">
                    Desired annual income at retirement (adjusted for inflation): <span className="font-extrabold text-xl text-green-800">{formatCurrency(desiredAnnualIncomeInflated, {minimumFractionDigits: 0})}</span>
                </p>
                <div className={`mt-3 p-3 rounded-md font-bold ${finalTotalAnnualIncome >= desiredAnnualIncomeInflated ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                    {finalTotalAnnualIncome >= desiredAnnualIncomeInflated 
                        ? '✅ Congratulations! Based on all projected income sources, you appear to be on track to meet your desired retirement income goal.' 
                        : '🛑 Warning: Projected annual income is currently less than your desired goal at retirement.'
                    }
                </div>
            </div>

            <hr className="my-3 border-indigo-300"/>


            {/* --- MONTE CARLO FORECAST SUMMARY CARD (USER-FRIENDLY DISPLAY) --- */}
            <div className="results-card bg-white p-6 shadow-xl rounded-xl border border-green-200">
                <h2 className="text-2xl font-bold text-indigo-700 mb-6">Retirement Success Forecast</h2>
                
                <div className="text-center mb-6">
                    <p className="text-lg font-medium">Plan Success Rate:</p>
                    <p className={`text-6xl font-extrabold mt-1 ${successRate >= 90 ? 'text-green-600' : successRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {results.successRate || 'N/A'}%
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                        Based on {totalSimulations} simulations, your plan succeeded {successfulSims} times.
                    </p>
                    <p className="text-xs text-gray-500">
                        (Success = Portfolio lasts through {simulationYearsInput} years, up to age ~{endAge})
                    </p>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center border-t pt-4">
                    <div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">WORST 10% OUTCOME</p>
                        <p className="text-xl font-bold text-red-600">
                            {formatCurrency(results.p10Balance || 0)}
                        </p>
                        <p className="text-xs text-gray-500">Portfolio at end of simulation</p>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">MEDIAN OUTCOME (50%)</p>
                        <p className="text-2xl font-bold text-green-700">
                            {formatCurrency(results.p50Balance || 0)}
                        </p>
                        <p className="text-xs text-gray-500">Portfolio at end of simulation</p>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">TOP 10% OUTCOME</p>
                        <p className="text-xl font-bold text-blue-600">
                            {formatCurrency(results.p90Balance || 0)}
                        </p>
                        <p className="text-xs text-gray-500">Portfolio at end of simulation</p>
                    </div>
                </div>
            </div>
            
            <hr className="my-3 border-indigo-300"/>

            {/* --- Monte Carlo Portfolio Value Over Time Chart --- */}
            <h3 className="text-2xl font-bold text-indigo-700 mt-6">Projected Portfolio Value Over Time (P10/P50/P90)</h3>
            <p className="text-sm text-gray-600 mb-4">The simulation runs 100 paths post-retirement to show the range of possible portfolio values.</p>
            
            {/* Chart Container */}
            <div className="w-full lg:w-2/3 mx-auto my-6 h-80"> 
                 {timeLineChartData.labels.length > 0 ? 
                    <Line 
                        data={timeLineChartData} 
                        options={{ 
                            responsive: true,
                            maintainAspectRatio: false, // Ensures height: 100% works inside h-80 container
                            plugins: { 
                                title: { display: true, text: 'Portfolio Balance Across Market Scenarios', font: { size: 16 } }, 
                                tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${formatCurrency(c.parsed.y)}` } }
                            }, 
                            scales: { 
                                x: { 
                                    title: { display: true, text: `Age of Older Person` },
                                    ticks: { callback: (val, index) => `Age ${mcTimeLineData.labels[index]}` }
                                },
                                y: { beginAtZero: true, ticks: { callback: (value) => formatCurrency(value) } } 
                            } 
                        }} 
                    />
                     : <p className="text-gray-500 text-center">Run projections to see the portfolio risk visualization.</p>}
            </div>
            <hr className="my-3 border-indigo-300"/>


            <h4 className="text-lg font-semibold mt-3 mb-1">Projected Monthly Income Timeline (After-Tax):</h4>
            
            {/* Income Timeline Table (Applying new styles) */}
            <div style={{overflowX: 'auto'}}>
                 <table id="incomeTimelineTable" className="w-full mt-2 mb-4 text-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className={headerCellClass}>Age (P1)</th>
                            <th className={headerCellClass}>Age (P2)</th>
                            <th className={`text-right ${headerCellClass}`}>Portfolio Withdrawals ($)</th>
                            <th className={`text-right ${headerCellClass}`}>P1 SS ($)</th>
                            <th className={`text-right ${headerCellClass}`}>P2 SS ($)</th>
                            <th className={`text-right ${headerCellClass}`}>Rental CF ($)</th>
                            <th className={`text-right ${headerCellClass}`}>Other Income ($)</th>
                            <th className="text-right">Total Monthly ($)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.timelineData?.map((item, index) => {
                             // Determine if this is the last item for border logic
                             const isLastItem = index === results.timelineData.length - 1;
                             return (
                                 // Apply Zebra Striping and Hover effect
                                 <tr key={index} className="odd:bg-gray-50 hover:bg-indigo-50 transition duration-150">
                                     {/* Apply right border to all but the last column */}
                                     <td className={`text-center ${headerCellClass}`}>{item.p1Age}</td>
                                     <td className={`text-center ${headerCellClass}`}>{item.p2Age}</td>
                                     <td className={`text-right ${headerCellClass}`}>{formatCurrency(item.portfolio)}</td>
                                     <td className={`text-right ${headerCellClass}`}>{formatCurrency(item.p1SS)}</td>
                                     <td className={`text-right ${headerCellClass}`}>{formatCurrency(item.p2SS)}</td>
                                     <td className={`text-right ${headerCellClass}`}>{formatCurrency(item.rentalCF)}</td>
                                     <td className={`text-right ${headerCellClass}`}>{formatCurrency(item.otherFixed)}</td>
                                     <td className="text-right font-semibold">{formatCurrency(item.totalMonthly)}</td>
                                 </tr>
                             )
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="total-row bg-indigo-50">
                            {/* FIX: Colspan is now 7 for the label */}
                            <td colSpan="7" className={`text-right font-semibold py-2 px-1 ${headerCellClass}`}>Final Total Projected Monthly Income:</td>
                            <td id="finalTotalMonthlyIncome" className="text-right font-bold py-2 px-1">{formatCurrency(results.finalTotalMonthlyIncome || 0)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            {/* Income Bar Chart */}
            {/* FIX: Added fixed height h-96 for a better-looking stacked bar chart */}
            <div className="w-full my-6 h-96"> 
                {hasProjectionData && results.incomeTimelineChartData?.labels?.length > 0 ?
                    <Bar 
                        data={results.incomeTimelineChartData} 
                        options={{ 
                            maintainAspectRatio: false, // Ensures height: 100% works inside h-96 container
                            plugins: { title: { display: true, text: 'Projected Monthly Income Sources in Retirement', font: { size: 16 } } },
                            scales: { 
                                // 🏆 FIX: Use P1 Age for the label on the X-axis
                                x: { 
                                    stacked: true,
                                    title: { display: true, text: 'Age of Person 1' },
                                    ticks: {
                                        callback: (val, index) => `Age ${results.timelineData[index]?.p1Age}`
                                    }
                                }, 
                                y: { 
                                    stacked: true, 
                                    ticks: { callback: (value) => formatCurrency(value) } 
                                } 
                            }
                        }} 
                    />
                    : <p className="text-gray-500 text-center">Income Timeline Chart pending calculation.</p>
                }
            </div>
            <hr className="my-3 border-indigo-300"/>


            {/* Projection Chart (Deterministic) */}
            <h3 className="text-2xl font-bold text-indigo-700 mt-6">Deterministic Growth Path</h3>
            {/* FIX: Reduced max width to lg:w-2/3 and added fixed height h-80 */}
            <div className="w-full lg:w-2/3 mx-auto my-6 h-80"> 
                 {hasProjectionData && results.projectionChartData?.labels?.length > 0 ? 
                    <Line 
                        data={results.projectionChartData} 
                        options={{ 
                            maintainAspectRatio: false, // Ensures height: 100% works inside h-80 container
                            plugins: { title: { display: true, text: 'Projected Portfolio Growth (Deterministic)', font: { size: 16 } } }, 
                            scales: { y: { ticks: { callback: (value) => formatCurrency(value) } } } 
                        }} 
                    />
                     : <p className="text-gray-500 text-center">Enter ages and investment data, then click 'Calculate Projections' to see the chart.</p>}
            </div>
            <hr className="my-3 border-indigo-300"/>

        </section>
    );
};

export default ResultsSection;