// src/components/PersonalInfoSection.jsx
import React, { useEffect } from 'react';
import { useAppContext, useDataFormatting } from '../hooks/useAppContext';

const PersonalInfoSection = () => {
    const { runAllCalculations } = useAppContext();
    
    // Custom hook for each data field (isCurrency=false, as these are ages/years)
    const p1Age = useDataFormatting('personalInfo.currentAge1', false); 
    const p2Age = useDataFormatting('personalInfo.currentAge2', false);
    const retAge = useDataFormatting('personalInfo.retirementAge', false);

    // Custom hooks for Assumption fields (all are numbers/percentages)
    // NOTE: inflationRate is handled in Investments.jsx, so we skip it here.
    const desiredIncome = useDataFormatting('assumptions.desiredRetirementIncomeToday', false);
    const taxRate = useDataFormatting('assumptions.assumedTaxRateNonRoth', true); // isPercentage = true for display
    const postRetReturn = useDataFormatting('assumptions.postRetirementReturnRateInput', true); // isPercentage = true
    const postRetStdDev = useDataFormatting('assumptions.postRetirementStdDevInput', true); // isPercentage = true
    const withdrawalRate = useDataFormatting('assumptions.retirementWithdrawalRate', true); // isPercentage = true
    const simYears = useDataFormatting('assumptions.simulationYearsInput', false); // Not a currency/percent

    // Effect to trigger main calculation when ages or key assumptions change
    useEffect(() => {
        runAllCalculations(); 
    }, [
        p1Age.value, 
        p2Age.value, 
        retAge.value, 
        desiredIncome.value, 
        taxRate.value, 
        postRetReturn.value, 
        postRetStdDev.value, // Included in dependencies
        withdrawalRate.value, 
        simYears.value, 
        runAllCalculations
    ]);

    // Define a common input class for visual consistency
    const standardInputStyle = "mt-1 block w-full text-lg p-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500";
    // Define a bold input style for the retirement age
    const retirementInputStyle = "mt-1 block w-full text-2xl font-bold text-green-600 p-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500";

    // Tooltip Data
    const tooltipData = {
        desiredIncome: "The annual income you desire in retirement, stated in TODAY's dollars. This amount will be adjusted for inflation up to retirement.",
        taxRate: "The assumed marginal tax rate applied to withdrawals from non-Roth investment accounts in retirement.",
        postRetReturn: "The average expected annual return rate for your portfolio AFTER retirement.",
        postRetStdDev: "The assumed volatility (Standard Deviation) of your portfolio returns in retirement. Used for Monte Carlo simulation.",
        withdrawalRate: "The initial percentage of your portfolio you plan to withdraw in the first year of retirement (e.g., 4% Rule). This withdrawal amount is then adjusted for inflation each subsequent year.",
        simYears: "The number of years the retirement simulation should run for (e.g., 30 years for a typical retirement span)."
    };


    return (
        <section className="card-section">
            <h2 className="text-2xl font-bold mb-4 text-indigo-700">1. Personal Info and Assumptions</h2>
            <div className="pt-4 space-y-8">
                
                {/* --- 1. CURRENT AGES --- */}
                <div className="p-5 border border-gray-200 rounded-lg bg-gray-50">
                    <h3 className="text-xl font-semibold text-gray-700 mb-4">Current Status</h3>
                    
                    <div className="grid md:grid-cols-3 gap-6">
                        
                        {/* Person 1's Age */}
                        <div className="input-group p-4 border border-indigo-200 rounded-md bg-white shadow-sm">
                            <label htmlFor="currentAge1" className="block text-md font-medium text-indigo-700">Person 1's Current Age</label>
                            <input
                                type="number"
                                id="currentAge1"
                                name="currentAge1"
                                value={p1Age.value}
                                onChange={p1Age.handleChange}
                                required
                                autoComplete="off"
                                className={standardInputStyle} // Applied standard input style
                            />
                        </div>

                        {/* Person 2's Age */}
                        <div className="input-group p-4 border border-indigo-200 rounded-md bg-white shadow-sm">
                            <label htmlFor="currentAge2" className="block text-md font-medium text-indigo-700">Person 2's Current Age</label>
                            <input
                                type="number"
                                id="currentAge2"
                                name="currentAge2"
                                value={p2Age.value}
                                onChange={p2Age.handleChange}
                                required
                                autoComplete="off"
                                className={standardInputStyle} // Applied standard input style
                            />
                        </div>
                        
                        {/* Retirement Age */}
                        <div className="input-group p-4 border border-green-400 rounded-md bg-white shadow-sm">
                            <label htmlFor="retirementAge" className="block text-md font-bold text-green-700">Desired Retirement Age</label>
                            <input
                                type="number"
                                id="retirementAge"
                                name="retirementAge"
                                value={retAge.value}
                                onChange={retAge.handleChange}
                                required
                                autoComplete="off"
                                className={retirementInputStyle} // Applied bold input style
                            />
                            <p className="text-xs text-gray-500 mt-1 italic">(Used for the Older Person)</p>
                        </div>
                    </div>
                </div>
                
                {/* --- 2. RETIREMENT GOALS AND ASSUMPTIONS (FIXED) --- */}
                <div className="p-5 border border-gray-200 rounded-lg bg-gray-50">
                    <h3 className="text-xl font-semibold text-gray-700 mb-4">Retirement Goals and Assumptions</h3>
                    
                    {/* Replaced placeholder with actual inputs */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        
                        {/* Desired Retirement Income (Today's $) */}
                        <div className="input-group">
                            <label htmlFor="desiredRetirementIncomeToday" className="block text-sm font-medium text-gray-700">Desired Annual Income (Today's $) 
                                <span className="tooltip text-xs text-gray-500 ml-1">(?)<span className="tooltiptext">{tooltipData.desiredIncome}</span></span>
                            </label>
                            <input
                                type="number"
                                id="desiredRetirementIncomeToday"
                                name="desiredRetirementIncomeToday"
                                value={desiredIncome.value}
                                onChange={desiredIncome.handleChange}
                                step="1000"
                                required
                                autoComplete="off"
                                className={standardInputStyle}
                            />
                        </div>

                        {/* Assumed Tax Rate Non-Roth (%) */}
                        <div className="input-group">
                            <label htmlFor="assumedTaxRateNonRoth" className="block text-sm font-medium text-gray-700">Assumed Tax Rate Non-Roth (%)
                                <span className="tooltip text-xs text-gray-500 ml-1">(?)<span className="tooltiptext">{tooltipData.taxRate}</span></span>
                            </label>
                            <input
                                type="number"
                                id="assumedTaxRateNonRoth"
                                name="assumedTaxRateNonRoth"
                                value={taxRate.value}
                                onChange={taxRate.handleChange}
                                step="1"
                                required
                                autoComplete="off"
                                className={standardInputStyle}
                            />
                        </div>
                        
                        {/* Post-Retirement Return Rate (%) */}
                        <div className="input-group">
                            <label htmlFor="postRetirementReturnRateInput" className="block text-sm font-medium text-gray-700">Post-Ret. Avg. Return (%)
                                <span className="tooltip text-xs text-gray-500 ml-1">(?)<span className="tooltiptext">{tooltipData.postRetReturn}</span></span>
                            </label>
                            <input
                                type="number"
                                id="postRetirementReturnRateInput"
                                name="postRetirementReturnRateInput"
                                value={postRetReturn.value}
                                onChange={postRetReturn.handleChange}
                                step="0.1"
                                required
                                autoComplete="off"
                                className={standardInputStyle}
                            />
                        </div>

                        {/* Post-Retirement Standard Deviation (%) */}
                        <div className="input-group">
                            <label htmlFor="postRetirementStdDevInput" className="block text-sm font-medium text-gray-700">Post-Ret. Std. Dev. (%)
                                <span className="tooltip text-xs text-gray-500 ml-1">(?)<span className="tooltiptext">{tooltipData.postRetStdDev}</span></span>
                            </label>
                            <input
                                type="number"
                                id="postRetirementStdDevInput"
                                name="postRetirementStdDevInput"
                                value={postRetStdDev.value}
                                onChange={postRetStdDev.handleChange}
                                step="0.1"
                                required
                                autoComplete="off"
                                className={standardInputStyle}
                            />
                        </div>

                        {/* Retirement Withdrawal Rate (%) */}
                        <div className="input-group">
                            <label htmlFor="retirementWithdrawalRate" className="block text-sm font-medium text-gray-700">Retirement Withdrawal Rate (%)
                                <span className="tooltip text-xs text-gray-500 ml-1">(?)<span className="tooltiptext">{tooltipData.withdrawalRate}</span></span>
                            </label>
                            <input
                                type="number"
                                id="retirementWithdrawalRate"
                                name="retirementWithdrawalRate"
                                value={withdrawalRate.value}
                                onChange={withdrawalRate.handleChange}
                                step="0.1"
                                required
                                autoComplete="off"
                                className={standardInputStyle}
                            />
                        </div>

                        {/* Simulation Years */}
                        <div className="input-group">
                            <label htmlFor="simulationYearsInput" className="block text-sm font-medium text-gray-700">Simulation Years
                                <span className="tooltip text-xs text-gray-500 ml-1">(?)<span className="tooltiptext">{tooltipData.simYears}</span></span>
                            </label>
                            <input
                                type="number"
                                id="simulationYearsInput"
                                name="simulationYearsInput"
                                value={simYears.value}
                                onChange={simYears.handleChange}
                                step="1"
                                required
                                autoComplete="off"
                                className={standardInputStyle}
                            />
                        </div>

                    </div>
                    {/* The inflation rate assumption is deliberately placed in the Investments.jsx section (Section 4) 
                        because it is most relevant to asset growth calculations. */}

                </div>

            </div>
        </section>
    );
};

export default PersonalInfoSection;