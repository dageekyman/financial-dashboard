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
    
    const currentAge1 = appData?.personalInfo?.currentAge1 || 0;
    const currentAge2 = appData?.personalInfo?.currentAge2 || 0;
    const oldestAge = Math.max(currentAge1, currentAge2);
    const retirementAge = appData?.personalInfo?.retirementAge || 0;
    const yearsUntilRetirement = results.yearsToRetirement || 0;

    // End Age used for the Monte Carlo footnote
    const endAge = (oldestAge < retirementAge ? retirementAge : oldestAge) + (simulationYearsInput || 0);

    // --- Data needed for NEW Summary Structure ---
    const totalWithdrawalPool = results.totalWithdrawalPool || 0;
    const estimatedMonthlyInvestmentIncome = results.estimatedMonthlyInvestmentIncome || 0;
    
    // Extract Rental CF and recalculate Other Fixed Monthly Income
    const totalRentalNetCashFlow = results.totalRentalNetCashFlow || 0;
    const totalOtherFixedMonthlyIncome = (results.totalOtherSourcesMonthlyIncome || 0) - totalRentalNetCashFlow;
    
    // Total SS Monthly Income
    const totalSSMonthlyIncome = (results.person1MonthlyBenefit || 0) + (results.person2MonthlyBenefit || 0);
    
    // 🏆 NEW: Final Total based ONLY on Portfolio Withdrawals
    const finalTotalMonthlyIncomePurePortfolio = estimatedMonthlyInvestmentIncome;
    const finalTotalAnnualIncomePurePortfolio = finalTotalMonthlyIncomePurePortfolio * 12;

    // Existing Final Total (Holistic)
    const finalTotalMonthlyIncomeHolistic = results.finalTotalMonthlyIncome || 0;
    const finalTotalAnnualIncomeHolistic = finalTotalMonthlyIncomeHolistic * 12;

    // Total Monthly Fixed Income (Rental CF + Other Fixed Sources)
    const totalMonthlyFixedIncome = totalRentalNetCashFlow + totalOtherFixedMonthlyIncome;
    
    // 🏆 NEW: Total Monthly Fixed Income Streams (Includes SS)
    const totalMonthlyFixedIncomeStreams = totalMonthlyFixedIncome + totalSSMonthlyIncome;
    const totalAnnualFixedIncomeStreams = totalMonthlyFixedIncomeStreams * 12; // NEW Annual Fixed Income

    // Calculate Desired Annual Income at Retirement (Inflated)
    const inflationRate = appData.assumptions.inflationRate / 100;
    const desiredRetirementIncomeTodayNum = parseCurrency(desiredRetirementIncomeToday);
    const initialAnnualExpenses = desiredRetirementIncomeTodayNum * Math.pow(1 + inflationRate, yearsUntilRetirement);
    const desiredAnnualIncomeInflated = isNaN(initialAnnualExpenses) ? 0 : initialAnnualExpenses;

    // --- Longevity Age Calculation Helper ---
    const getLongevityDisplay = (longevityResult) => {
        let display = longevityResult || 'N/A';
        const ageAtRetirement = Math.max(oldestAge, retirementAge);

        if (typeof longevityResult === 'string' && longevityResult.endsWith('+')) {
            return longevityResult;
        } else {
            const yearsLasting = parseCurrency(longevityResult, 0); // Convert years to a number
            const agePortfolioLastsUntil = ageAtRetirement + yearsLasting;
            
            if (yearsLasting > 0) {
                // FIX: Explicitly add "(P1: Age <age>)" for clarity
                return `${yearsLasting} years (P1: Age ${agePortfolioLastsUntil})`;
            } else if (yearsLasting === 0 && ageAtRetirement > 0) {
                return `0 years (P1: Age ${agePortfolioLastsUntil})`;
            }
        }
        return display;
    };
    
    const portfolioLongevityDisplay = getLongevityDisplay(results.deterministicLongevity);
    const holisticLongevityDisplay = getLongevityDisplay(results.holisticLongevity); // NEW Holistic Longevity

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
            
            {/* --- NEW: Overall Projected Retirement Income Summary (Using a 2-column structure) --- */}
            <div className="results-summary-card p-4 border border-gray-300 rounded-lg bg-gray-50">
                <h3 className="text-xl font-bold mb-4 text-indigo-700">Overall Projected Retirement Income Summary</h3>
                
                {/* 🏆 COLOR CHANGE APPLIED: text-gray-900 */}
                <p className="text-md mb-4">Years until retirement (based on older person): <span className="font-bold text-lg text-gray-900">{yearsToRetirement || 'N/A'}</span></p>

                <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                    
                    {/* LEFT COLUMN: Pure Portfolio & Longevity Focus */}
                    <div className='border-r border-gray-300 pr-8'>
                        <h4 className="text-lg font-bold text-indigo-700 mb-3 border-b border-gray-400 pb-1">1. Liquid Portfolio and Sustainability Focus</h4>
                        
                        <p className="text-md mt-2">Total Projected Investment Portfolio (for withdrawals): <span className="font-bold text-lg text-indigo-700">{formatCurrency(totalWithdrawalPool)}</span></p>

                        <div className="ml-4 space-y-1 mt-2 mb-4">
                            {/* Portfolio Income: Stays text-indigo-700 */}
                            <p className="text-md">Projected Monthly Income from Portfolio (after-tax): <span className="font-bold text-lg text-indigo-700">{formatCurrency(estimatedMonthlyInvestmentIncome)}</span></p>
                        </div>
                        
                        {/* Total Monthly Income (Pure Portfolio Focus) */}
                        <p className="text-md mt-4 font-semibold border-t pt-2">
                            Final Total Monthly Income (Pure Portfolio): <span className="font-extrabold text-xl text-indigo-700 ml-2">{formatCurrency(finalTotalMonthlyIncomePurePortfolio)}</span>
                        </p>
                        <p className="text-md font-semibold">
                            Final Total Annual Income (Pure Portfolio): <span className="font-extrabold text-xl text-indigo-700 ml-2">{formatCurrency(finalTotalAnnualIncomePurePortfolio)}</span>
                        </p>

                        {/* Deterministic Portfolio Longevity */}
                        <p className="text-md mt-4 font-semibold border-t pt-2">
                            Projected Portfolio Longevity (Deterministic): <span className="font-extrabold text-lg text-indigo-700 ml-2">{portfolioLongevityDisplay}</span>
                        </p>
                    </div>

                    {/* RIGHT COLUMN: Holistic Income & Net Worth Security */}
                    <div>
                        <h4 className="text-lg font-bold text-green-700 mb-3 border-b border-gray-400 pb-1">2. Holistic Income and Net Worth Security</h4>
                        
                        {/* List ALL Fixed Income Sources (Including SS and the moved items) - MOVED UP */}
                        <div className="ml-4 space-y-1 mt-2 mb-4">
                             <p className="text-md">Projected Monthly Income from Social Security: <span className="font-bold text-lg text-green-700">{formatCurrency(totalSSMonthlyIncome)}</span></p>

                             <p className="text-md">Projected Monthly Income from Rental Real Estate CF: <span className="font-bold text-lg text-green-700">{formatCurrency(totalRentalNetCashFlow)}</span></p>
                            
                             <p className="text-md">Projected Monthly Income from Other Fixed Sources (Pensions, Annuities): <span className="font-bold text-lg text-green-700">{formatCurrency(totalOtherFixedMonthlyIncome)}</span></p>
                        </div>
                        
                        {/* Total Monthly Fixed Income Line - 🏆 FIX: Changed text size to text-xl */}
                        <p className="text-md font-bold pt-2 border-t border-gray-300">
                           Total Monthly Fixed Income Streams: <span className="font-extrabold text-xl text-green-700 ml-2">{formatCurrency(totalMonthlyFixedIncomeStreams)}</span>
                        </p>
                        
                        {/* 🏆 NEW ANNUAL TOTAL FIXED INCOME STREAMS */}
                        <p className="text-md font-bold">
                           Total Annual Fixed Income Streams: <span className="font-extrabold text-xl text-green-700 ml-2">{formatCurrency(totalAnnualFixedIncomeStreams)}</span>
                        </p>

                        {/* NEW HOLISTIC LONGEVITY METRIC - Primary focus on this side */}
                        <p className="text-md mt-4 font-semibold border-t pt-2">
                            Projected Net Worth Longevity (Holistic): <span className="font-extrabold text-lg text-green-700 ml-2">{holisticLongevityDisplay}</span>
                        </p>
                        <p className="text-sm italic text-gray-600 mt-1 mb-4">
                            (Measures years until all assets, including equity, are liquidated to cover costs.)
                        </p>
                        
                    </div>
                </div>

                {/* 🏆 FIX: Centered Final Totals spanning both columns */}
                <div className='mt-6 border-t-2 border-indigo-700 pt-4 text-center'>
                    <h4 className="text-lg font-bold text-gray-700 mb-2">Final Total Projected Income (Holistic Check)</h4>
                    <p className="text-md font-semibold">Final Total Projected Monthly Income: <span className="font-extrabold text-2xl text-gray-900 ml-2">{formatCurrency(finalTotalMonthlyIncomeHolistic)}</span></p>
                    
                    <p className="text-md font-semibold">Final Total Projected Annual Income: <span className="font-extrabold text-2xl text-gray-900 ml-2">{formatCurrency(finalTotalAnnualIncomeHolistic)}</span></p>
                </div>


                {/* Shared Note at the bottom */}
                <p className="text-sm font-bold text-gray-700 mt-4 border-t pt-3">
                    (Note: All income sources are included in the Holistic Totals. The Portfolio Focus Totals (Left Side) are limited to Portfolio Withdrawals only.)
                </p>
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
                {/* Check now uses the Holistic Annual Income for the pass/fail */}
                <div className={`mt-3 p-3 rounded-md font-bold ${finalTotalAnnualIncomeHolistic >= desiredAnnualIncomeInflated ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                    {finalTotalAnnualIncomeHolistic >= desiredAnnualIncomeInflated 
                        ? '✅ Congratulations! Based on all projected income sources, you appear to be on track to meet your desired retirement income goal.' 
                        : '🛑 Warning: Projected annual income is currently less than your desired retirement income goal.'
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