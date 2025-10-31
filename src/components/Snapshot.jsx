// src/components/Snapshot.jsx
import React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Doughnut, Line } from 'react-chartjs-2';
import { formatCurrency, parseCurrency } from '../utils';

// Helper to render the Asset Allocation Chart
const AssetAllocationChart = ({ appData, calculationResults }) => {
    // FIX: Destructure formatCurrency from useAppContext is unnecessary and potentially buggy
    // We already imported formatCurrency from '../utils'
    const { formatCurrency: formatCurrencyFromContext } = useAppContext(); 
    
    // Defensive data extraction for calculating totals
    const totalSec5Investments = calculationResults.totalMainPortfolioValue || 0;
    const totalSec5OtherInvestments = calculationResults.totalOtherInvestmentsValue || 0;
    const totalSec7RentalAssetsValue = calculationResults.totalRentalPortfolioValue || 0;
    const totalOtherAssets = (appData?.assets || []).reduce((sum, item) => sum + (item.value || 0), 0);
    
    // Calculate Net Worth totals here for the chart, even though NetWorth is calculated in App.jsx
    const totalAssets = totalOtherAssets + totalSec5Investments + totalSec5OtherInvestments + totalSec7RentalAssetsValue;

    if (totalAssets <= 0) return <p className="text-gray-500 text-center py-4">No assets entered for allocation chart.</p>;

    const chartData = {
        labels: ['Cash/Other Assets', 'Main Investments', 'Other Investments', 'Rental Properties'],
        datasets: [{
            data: [totalOtherAssets, totalSec5Investments, totalSec5OtherInvestments, totalSec7RentalAssetsValue],
            backgroundColor: ['#a8a29e', '#60a5fa', '#8b5cf6', '#f59e0b'],
            borderColor: '#ffffff',
            borderWidth: 2
        }]
    };

    return (
        <div className="h-64">
            <Doughnut
                data={chartData}
                options={{
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' },
                        title: { display: true, text: 'Current Asset Allocation' },
                        tooltip: {
                             callbacks: {
                                 label: (c) => {
                                     const value = c.raw;
                                     const percentage = totalAssets > 0 ? ((value / totalAssets) * 100).toFixed(1) : 0;
                                     // FIX: Changed formatCurrency2 to formatCurrency
                                     return `${c.label}: ${formatCurrency(value)} (${percentage}%)`;
                                 }
                             }
                        }
                    },
                }}
            />
        </div>
    );
};


const Snapshot = () => {
    const { appData, calculationResults, setActiveView } = useAppContext();
    const results = calculationResults || {};
    const assumptions = appData?.assumptions || {};

    // --- Calculated Summary Stats ---
    // Net Worth is a high-level summary, calculating it here for display cards
    const totalAssets = (results.totalMainPortfolioValue || 0) + (results.totalOtherInvestmentsValue || 0) + (results.totalRentalPortfolioValue || 0) + (appData?.assets || []).reduce((sum, item) => sum + (item.value || 0), 0);
    const totalLiabilities = (appData?.liabilities || []).reduce((sum, item) => sum + (item.balance || 0), 0);
    const netWorth = totalAssets - totalLiabilities;
    
    const oldestAge = Math.max(appData?.personalInfo?.currentAge1 || 0, appData?.personalInfo?.currentAge2 || 0);
    const retirementAge = appData?.personalInfo?.retirementAge || 0;
    const yearsToRetirement = results.yearsToRetirement || 'N/A';
    
    // --- Monte Carlo Data ---
    const successRate = parseCurrency(results.successRate);
    const simulationYearsInput = assumptions.simulationYearsInput || 30;

    // Calculate end age for summary text
    const endAge = (oldestAge < retirementAge ? retirementAge : oldestAge) + (simulationYearsInput || 0);

    // --- Monte Carlo Portfolio Value Over Time Chart Data Setup ---
    const mcTimeLineData = results.mcTimeLineData || { labels: [], p10: [], p50: [], p90: [] };
    const hasMCData = mcTimeLineData.labels?.length > 0;

    const createTimeLineChartData = () => {
        if (!hasMCData) return { labels: [], datasets: [] };
        
        return {
            labels: mcTimeLineData.labels, // Ages
            datasets: [
                {
                    label: '90th Percentile (Top Outcome)',
                    data: mcTimeLineData.p90,
                    borderColor: '#3b82f6', // Blue
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: false,
                    borderDash: [5, 5], 
                    tension: 0.1,
                    pointRadius: 0
                },
                {
                    label: '50th Percentile (Median)',
                    data: mcTimeLineData.p50,
                    borderColor: '#10b981', // Green
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    fill: false,
                    tension: 0.1,
                    pointRadius: 0
                },
                {
                    label: '10th Percentile (Worst Outcome)',
                    data: mcTimeLineData.p10,
                    borderColor: '#ef4444', // Red
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: false,
                    borderDash: [5, 5], 
                    tension: 0.1,
                    pointRadius: 0
                }
            ]
        };
    };

    const timeLineChartData = createTimeLineChartData();

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-indigo-700">Financial Overview Snapshot</h2>

            {/* Top Stat Cards */}
            <div className="grid md:grid-cols-4 gap-4">
                 {/* Net Worth */}
                <div className={`card-section text-center p-4 ${netWorth >= 0 ? 'border-green-300' : 'border-red-300'}`}>
                    <p className="text-sm text-gray-500 font-medium">Current Net Worth</p>
                    <h3 className={`text-3xl font-bold mt-1 ${netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(netWorth)}</h3>
                    <button onClick={() => setActiveView('AssetsLiabilities')} className="text-xs text-indigo-500 hover:text-indigo-800 underline mt-1">View Details</button>
                </div>
                
                {/* Projected Withdrawal Income */}
                <div className="card-section text-center p-4 border-indigo-300">
                    <p className="text-sm text-gray-500 font-medium">Est. Monthly Portfolio Income</p>
                    <h3 className="text-3xl font-bold mt-1 text-indigo-600">{formatCurrency(results.estimatedMonthlyInvestmentIncome || 0)}</h3>
                    <p className="text-xs text-gray-400">Based on {assumptions.retirementWithdrawalRate}% withdrawal</p>
                </div>

                {/* Years to Retirement */}
                <div className="card-section text-center p-4 border-indigo-300">
                    <p className="text-sm text-gray-500 font-medium">Years to Retirement (Age {retirementAge})</p>
                    <h3 className="text-3xl font-bold mt-1 text-indigo-600">{yearsToRetirement}</h3>
                    <p className="text-xs text-gray-400">Current Age: {oldestAge}</p>
                </div>

                {/* Success Rate */}
                <div className={`card-section text-center p-4 ${successRate >= 50 ? 'border-green-300' : 'border-red-300'}`}>
                    <p className="text-sm text-gray-500 font-medium">Plan Success Rate ({simulationYearsInput} yrs)</p>
                    <h3 className={`text-3xl font-bold mt-1 ${successRate >= 90 ? 'text-green-600' : successRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {results.successRate || 'N/A'}%
                    </h3>
                    <button onClick={() => setActiveView('Results')} className="text-xs text-indigo-500 hover:text-indigo-800 underline mt-1">View Forecast</button>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid lg:grid-cols-3 gap-6">
                
                {/* Chart 1: Asset Allocation (Smaller column) */}
                <div className="lg:col-span-1 card-section">
                    <h3 className="subsection-title">Current Asset Mix</h3>
                    <AssetAllocationChart appData={appData} calculationResults={results} />
                    <button onClick={() => setActiveView('AssetsLiabilities')} className="w-full text-sm text-indigo-600 hover:text-indigo-800 underline mt-2">Edit Allocation</button>
                </div>

                {/* Chart 2: Monte Carlo Time Series (Wider column) */}
                <div className="lg:col-span-2 card-section">
                    <h3 className="subsection-title">Projected Portfolio Risk Over Time</h3>
                    <div className="h-96 p-2">
                        {hasMCData ? 
                            <Line 
                                data={timeLineChartData} 
                                options={{ 
                                    responsive: true, maintainAspectRatio: false,
                                    plugins: { legend: { position: 'bottom' } }, 
                                    scales: { 
                                        x: { 
                                            title: { display: true, text: `Age of Older Person` },
                                            ticks: { callback: (val, index) => `${timeLineChartData.labels[index]}` }
                                        },
                                        y: { beginAtZero: true, ticks: { callback: (value) => formatCurrency(value) } } 
                                    } 
                                }} 
                            />
                            : <p className="text-gray-500 text-center py-20">Monte Carlo data pending. Click 'Calculate Projections' below.</p>}
                        <button onClick={() => setActiveView('Results')} className="w-full text-sm text-indigo-600 hover:text-indigo-800 underline mt-2">View Full Forecast Summary</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Snapshot;