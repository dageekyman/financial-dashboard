// src/components/Investments.jsx
import React, { useCallback } from 'react';
import { formatCurrency, parseCurrency } from '../utils';
import { useAppContext, useDataFormatting } from '../hooks/useAppContext'; 

// Helper component for a single Investment row
const InvestmentRow = ({ item, type }) => {
    // We only need handleTableChange and runAllCalculations here
    const { handleTableChange } = useDataFormatting(type);
    const { runAllCalculations, setAppData } = useAppContext();
    const isMain = type === 'mainInvestments';
    const prefix = isMain ? 'investment' : 'otherInvestment';
    
    // Define the fields that need standard handling
    const fields = [
        'holder', 'accountType', 'description', 'fund', 'currentValue', 'monthlyContribution',
        'expectedReturn', 'stdDev', 'expenseRatio', 'treatment', 'notes'
    ].filter(key => {
        if (isMain && (key === 'treatment' || key === 'notes' || key === 'description')) return false;
        if (!isMain && key === 'fund') return false;
        return true;
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        const isNumeric = ['currentValue', 'monthlyContribution', 'expectedReturn', 'stdDev', 'expenseRatio'].includes(name);
        const newValue = isNumeric ? parseCurrency(value) : value;

        handleTableChange(item.id, name, newValue); 
        
        if (isNumeric || name === 'treatment') {
             runAllCalculations(); 
        }
    };

    const deleteItem = useCallback(() => {
        setAppData(prev => ({
            ...prev,
            [type]: prev[type].filter(i => i.id !== item.id)
        }));
        runAllCalculations(); 
    }, [item.id, type, setAppData, runAllCalculations]);
    
    // Define a utility class for permanent column separation
    const gridCellClass = "border-r border-gray-300";

    
    // Render the row
    return (
        // Added Zebra Striping for readability
        <tr className="odd:bg-gray-100 hover:bg-indigo-50 transition duration-150"> 
            {/* Holder Select */}
            <td className={gridCellClass}>
                <select 
                    id={`${prefix}-${item.id}-holder`}
                    name="holder" // ACCESSIBILITY FIX
                    // FIX: Set background to transparent to allow row hover color to show
                    style={{backgroundColor: 'transparent'}}
                    className={`${prefix}-holder`} 
                    value={item.holder} 
                    onChange={handleChange}
                >
                    <option value="Person 1">Person 1</option>
                    <option value="Person 2">Person 2</option>
                    <option value="Joint">Joint</option>
                </select>
            </td>
            {/* Account Type Input */}
            <td className={gridCellClass}>
                <input 
                    type="text" 
                    id={`${prefix}-${item.id}-accountType`}
                    name="accountType" // ACCESSIBILITY FIX
                    // FIX: Set background to transparent
                    style={{backgroundColor: 'transparent'}}
                    className={`${prefix}-accountType`} 
                    value={item.accountType} 
                    onChange={handleChange} 
                    placeholder="e.g., Roth IRA"
                    autoComplete="off"
                />
            </td>
            {/* Fund/Description Input */}
            {isMain ? (
                <td className={`${gridCellClass} w-[15%]`}> {/* FIX 1: Added relative width class for Main Portfolio */}
                    <input 
                        type="text" 
                        id={`${prefix}-${item.id}-fund`}
                        name="fund" // ACCESSIBILITY FIX
                        // FIX: Set background to transparent
                        style={{backgroundColor: 'transparent'}}
                        className={`${prefix}-fund w-full`} // Ensure input fills cell
                        value={item.fund} 
                        onChange={handleChange} 
                        placeholder="Fund Name/Ticker" 
                        autoComplete="off"
                    />
                </td>
            ) : (
                <td className={`${gridCellClass} w-[15%]`}> {/* Maintained relative width class for Other Investments */}
                    <input 
                        type="text" 
                        id={`${prefix}-${item.id}-description`}
                        name="description" // ACCESSIBILITY FIX
                        // FIX: Set background to transparent
                        style={{backgroundColor: 'transparent'}}
                        className={`${prefix}-description w-full`} // Ensure input fills cell
                        value={item.description} 
                        onChange={handleChange} 
                        placeholder="Pension, Annuity, SRA" 
                        autoComplete="off"
                    />
                </td>
            )}
            
            {/* Current Value */}
            <td className={gridCellClass}>
                <input 
                    type="number" 
                    id={`${prefix}-${item.id}-currentValue`}
                    name="currentValue" // ACCESSIBILITY FIX
                    // FIX: Set background to transparent
                    style={{backgroundColor: 'transparent'}}
                    className={`${prefix}-currentValue text-right`} 
                    value={item.currentValue} 
                    onChange={handleChange} 
                    step="0.01" 
                    autoComplete="off"
                />
            </td>
            {/* Monthly Contribution */}
            <td className={gridCellClass}>
                <input 
                    type="number" 
                    id={`${prefix}-${item.id}-monthlyContribution`}
                    name="monthlyContribution" // ACCESSIBILITY FIX
                    // FIX: Set background to transparent
                    style={{backgroundColor: 'transparent'}}
                    className={`${prefix}-monthlyContribution text-right`} 
                    value={item.monthlyContribution} 
                    onChange={handleChange} 
                    step="0.01" 
                    autoComplete="off"
                />
            </td>
            {/* Expected Return */}
            <td className={gridCellClass}>
                <input 
                    type="number" 
                    id={`${prefix}-${item.id}-expectedReturn`}
                    name="expectedReturn" // ACCESSIBILITY FIX
                    // FIX: Set background to transparent
                    style={{backgroundColor: 'transparent'}}
                    className={`${prefix}-expectedReturn text-right`} 
                    value={item.expectedReturn} 
                    onChange={handleChange} 
                    step="0.1" 
                    autoComplete="off"
                />
            </td>
            {/* Standard Deviation */}
            <td className={gridCellClass}>
                <input 
                    type="number" 
                    id={`${prefix}-${item.id}-stdDev`}
                    name="stdDev" // ACCESSIBILITY FIX
                    // FIX: Set background to transparent
                    style={{backgroundColor: 'transparent'}}
                    className={`${prefix}-stdDev text-right`} 
                    value={item.stdDev} 
                    onChange={handleChange} 
                    step="0.1" 
                    autoComplete="off"
                />
            </td>
            {/* Expense Ratio */}
            <td className={gridCellClass}>
                <input 
                    type="number" 
                    id={`${prefix}-${item.id}-expenseRatio`}
                    name="expenseRatio" // ACCESSIBILITY FIX
                    // FIX: Set background to transparent
                    style={{backgroundColor: 'transparent'}}
                    className={`${prefix}-expenseRatio text-right`} 
                    value={item.expenseRatio} 
                    onChange={handleChange} 
                    step="0.01" 
                    autoComplete="off"
                />
            </td>

            {/* Other Investment Specific Fields */}
            {!isMain && (
                <td className={gridCellClass}>
                    <select 
                        id={`${prefix}-${item.id}-treatment`}
                        name="treatment" // ACCESSIBILITY FIX
                        // FIX: Set background to transparent
                        style={{backgroundColor: 'transparent'}}
                        className={`${prefix}-treatment`} 
                        value={item.treatment} 
                        onChange={handleChange}
                    >
                        <option value="Portfolio">Portfolio</option>
                        <option value="LumpSum">Lump Sum</option>
                        <option value="FixedPercent">Fixed % Dist</option>
                        <option value="FixedAmount">Fixed $ Amount</option>
                    </select>
                </td>
            )}

            {!isMain && (
                <td className={gridCellClass}>
                    <input 
                        type="text" 
                        id={`${prefix}-${item.id}-notes`}
                        name="notes" // ACCESSIBILITY FIX
                        // FIX: Set background to transparent
                        style={{backgroundColor: 'transparent'}}
                        className={`${prefix}-notes`} 
                        value={item.notes} 
                        onChange={handleChange} 
                        placeholder="% or $" 
                        autoComplete="off"
                    />
                </td>
            )}
            
            {/* Projected Value @ Retirement (Read-only output) */}
            <td className={`${prefix}-projectedValue text-right ${gridCellClass}`}>{formatCurrency(item.projectedValue || 0)}</td>

            <td>
                <button 
                    type="button" 
                    className="action-button delete-button text-xs px-2 py-1" 
                    onClick={deleteItem}
                >
                    X
                </button>
            </td>
        </tr>
    );
};

// Main Investments Section Component (assuming this is the main export)
const InvestmentsSection = () => {
    // Access state, setters, and results via context
    const { appData, setAppData, runAllCalculations, calculationResults } = useAppContext();
    const { formatCurrency } = useDataFormatting('mainInvestments'); // Use hook for formatting helpers

    
    // --- Data Mapping and Totals (Same logic as provided) ---
    
    // Map the projection results back onto the state items for display
    const mapResults = (list, results) => {
        if (!results || results.length === 0) return list;
        return list.map(item => {
            const resultItem = results.find(r => r.id === item.id);
            // Use projected value from results, otherwise use the existing state value
            return { ...item, projectedValue: resultItem ? resultItem.projectedValue : item.projectedValue };
        });
    };

    const mainInvestmentsWithResults = mapResults(appData.mainInvestments, calculationResults.mainInvestmentResults);
    const otherInvestmentsWithResults = mapResults(appData.otherInvestments, calculationResults.otherInvestmentResults);

    // Calculate total contributions (monthly)
    const totalMonthlyMain = mainInvestmentsWithResults.reduce((sum, i) => sum + parseCurrency(i.monthlyContribution || 0), 0);
    const totalMonthlyOther = otherInvestmentsWithResults.reduce((sum, i) => sum + parseCurrency(i.monthlyContribution || 0), 0);
    const totalMonthlyContributions = totalMonthlyMain + totalMonthlyOther;

    // Get footer totals
    const totalCurrentInvestments = mainInvestmentsWithResults.reduce((sum, i) => sum + parseCurrency(i.currentValue || 0), 0);
    const totalCurrentOtherInvestments = otherInvestmentsWithResults.reduce((sum, i) => sum + parseCurrency(i.currentValue || 0), 0);
    const totalProjectedInvestments = mainInvestmentsWithResults.reduce((sum, i) => sum + parseCurrency(i.projectedValue || 0), 0);
    const totalProjectedOtherInvestments = otherInvestmentsWithResults.reduce((sum, i) => sum + parseCurrency(i.projectedValue || 0), 0);


    // Generic handler to add a new item to a list
    const addInvestmentItem = useCallback((listName, defaults) => {
        setAppData(prev => {
            const list = prev[listName];
            const nextId = list.length > 0 ? Math.max(...list.map(i => i.id)) + 1 : 1;
            
            const newList = [...list, { 
                ...defaults, 
                id: nextId
            }];
            return { ...prev, [listName]: newList };
        });
        runAllCalculations(); 
    }, [setAppData, runAllCalculations]);

    // Handler for global assumption changes (inflation rate)
    const handleAssumptionChange = (e) => {
        const value = parseCurrency(e.target.value);
        setAppData(prev => ({
            ...prev,
            assumptions: {
                ...prev.assumptions,
                [e.target.id]: value // Use e.target.id for inflationRate
            }
        }));
        runAllCalculations(); // Rerun all calcs when assumption changes
    };

    // Define a utility class for permanent column separation on header cells
    const headerCellClass = "border-r border-gray-300";

    // Define a robust button style for Add Investment buttons
    const addButtonStyles = "action-button save-button mt-4 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-150 shadow-md";

    // Tooltip data
    const tooltipData = {
        avgReturn: "Average annual expected investment return.",
        stdDev: "Standard Deviation (volatility) measures how much the return fluctuates. Higher number means higher risk.",
        expenseRatio: "Annual fee charged by the fund. This reduces your net return.",
        treatment: "How this asset is factored into the retirement plan (Lump Sum, Fixed Distribution, or part of the Portfolio withdrawal pool)."
    };


    return (
        <section className="card-section">
            {/* FIX: Updated h2 to use consistent main section header style */}
            <h2 className="text-3xl font-bold mb-4 text-indigo-700">4. Investment Portfolio</h2>
            <div className="pt-4">
                <div className="grid md:grid-cols-1 gap-6 mb-6 p-4 border border-gray-200 rounded-md bg-gray-50"> 
                    <div className="input-group"> 
                        <label htmlFor="inflationRate">Expected Avg. Annual Inflation Rate (%) <span className="tooltip text-xs text-gray-500">(?)<span className="tooltiptext">The anticipated average rate at which prices will increase (e.g., 2-3%). Used for future income goal and longevity calc.</span></span> </label> 
                        <input 
                            type="number" 
                            id="inflationRate" 
                            name="inflationRate" // FIX: Added name attribute here
                            value={appData.assumptions.inflationRate} 
                            onChange={handleAssumptionChange}
                            step="0.1" 
                            required 
                            autoComplete="off"
                        /> 
                    </div> 
                </div>

                {/* Main Investments Table */}
                {/* FIX: Applied consistent prominent header style */}
                <h3 className="text-2xl font-bold text-indigo-700 mb-4">Main Investment Portfolio (Used for Retirement Withdrawals)</h3> 
                <p className="text-sm text-gray-600 -mt-2 mb-2">Assets here are projected and contribute to the income calculated via the sustainable withdrawal rate.</p> 
                <div style={{overflowX: 'auto'}}>
                    <table id="investmentsTable"> 
                        <thead> 
                            <tr> 
                                <th className={headerCellClass}>Holder</th> 
                                <th className={headerCellClass}>Account Type</th> 
                                <th className={`${headerCellClass} w-[15%]`}>Fund/Description</th> 
                                <th className={`text-right ${headerCellClass}`}>Current Value ($)</th> 
                                <th className={`text-right ${headerCellClass}`}>Monthly Contrib. ($)</th> 
                                <th className={`text-right ${headerCellClass}`}>Avg. Return (%) <span className="tooltip text-xs text-gray-500">(?)<span className="tooltiptext">{tooltipData.avgReturn}</span></span> </th> 
                                <th className={`text-right ${headerCellClass}`}>Std. Deviation (%) <span className="tooltip text-xs text-gray-500">(?)<span className="tooltiptext">{tooltipData.stdDev}</span></span> </th> 
                                <th className={`text-right ${headerCellClass}`}>Expense Ratio (%)</th> 
                                <th className={`text-right ${headerCellClass}`}>Projected Value @ Retirement ($)</th> 
                                <th>Action</th> 
                            </tr> 
                        </thead> 
                        <tbody>
                            {mainInvestmentsWithResults.map(item => (
                                <InvestmentRow
                                    key={item.id}
                                    item={item}
                                    type="mainInvestments"
                                />
                            ))}
                        </tbody> 
                        <tfoot> 
                            <tr className="total-row bg-gray-50"> 
                                {/* 1. Total Current Investments Label (Spans 3 Columns) */}
                                {/* FIX: Removed text-right alignment here for left alignment */}
                                <td colSpan="3" className={`font-semibold ${headerCellClass}`}>Total Current Investments (Main Portfolio):</td> 
                                
                                {/* 2. Total Current Investments Value (Column 4) */}
                                <td id="totalCurrentInvestments" className={`text-right font-bold ${headerCellClass}`}>
                                    {formatCurrency(totalCurrentInvestments)}
                                </td> 
                                
                                {/* 3. Total Monthly Contributions Value (Column 5) */}
                                <td id="totalMonthlyContributions" className={`text-right font-bold ${headerCellClass}`}>
                                    {formatCurrency(totalMonthlyContributions)}
                                </td> 
                                
                                {/* 4. EMPTY SPACER CELL (Spans Columns 6, 7, 8) */}
                                <td colSpan="3"></td> 
                                
                                {/* 5. Projected Value Total (Column 9) */}
                                <td id="totalProjectedInvestments" className="text-right font-bold">
                                    {formatCurrency(totalProjectedInvestments)}
                                </td> 
                                
                                {/* 6. Action Column (Column 10) */}
                                <td></td> 
                            </tr> 
                        </tfoot> 
                    </table> 
                </div>
                <button 
                    id="addInvestmentRow" 
                    className={addButtonStyles}
                    onClick={() => addInvestmentItem('mainInvestments', { holder: 'Person 1', accountType: '', fund: '', currentValue: 0, monthlyContribution: 0, expectedReturn: 8.0, stdDev: 12.0, expenseRatio: 0.05 })}
                >
                    Add to Main Portfolio
                </button>

                {/* Other Investments Table */}
                {/* FIX: Applied consistent prominent header style */}
                <h3 className="text-2xl font-bold text-indigo-700 mb-4 mt-8">Other Investments (Pensions, Annuities, Alternatives)</h3> 
                <p className="text-sm text-gray-600 -mt-2 mb-2">Assets here are projected separately. Choose how they are treated in retirement income calculations.</p> 
                <div style={{overflowX: 'auto'}}>
                    <table id="otherInvestmentsTable" className="other-investments-table"> 
                        <thead> 
                            <tr> 
                                <th className={headerCellClass}>Holder</th> 
                                <th className={headerCellClass}>Account Type</th> 
                                <th className={`text-left ${headerCellClass} w-[15%]`}>Description</th> 
                                <th className={`text-right ${headerCellClass}`}>Current Value ($)</th> 
                                <th className={`text-right ${headerCellClass}`}>Monthly Contrib. ($)</th> 
                                <th className={`text-right ${headerCellClass}`}>Avg. Return (%) <span className="tooltip text-xs text-gray-500">(?)<span className="tooltiptext">{tooltipData.avgReturn}</span></span> </th> 
                                <th className={`text-right ${headerCellClass}`}>Std. Deviation (%) <span className="tooltip text-xs text-gray-500">(?)<span className="tooltiptext">{tooltipData.stdDev}</span></span> </th> 
                                <th className={`text-right ${headerCellClass}`}>Annual Exp. Ratio (%)</th> 
                                <th className={headerCellClass}>Treatment <span className="tooltip text-xs text-gray-500">(?)<span className="tooltiptext">{tooltipData.treatment}</span></span> </th> 
                                <th className={`text-left ${headerCellClass} w-[12%]`}>Notes (% or $ for Fixed types)</th> 
                                <th className={`text-right ${headerCellClass}`}>Projected Value @ Retirement ($)</th> 
                                <th>Action</th> 
                            </tr> 
                        </thead> 
                        <tbody>
                            {otherInvestmentsWithResults.map(item => (
                                <InvestmentRow
                                    key={item.id}
                                    item={item}
                                    type="otherInvestments"
                                />
                            ))}
                        </tbody> 
                        <tfoot> 
                            <tr className="total-row bg-gray-50"> 
                                {/* 1. Total Other Investments Label (Spans 2 Columns) */}
                                {/* FIX: Removed text-right alignment here for left alignment */}
                                <td colSpan="2" className={`font-semibold ${headerCellClass}`}>Total Other Investments:</td> 
                                
                                {/* 2. Spacer for Description column */}
                                <td colSpan="1" className={headerCellClass}></td> 
                                
                                {/* 3. Total Current Value */}
                                <td id="totalCurrentOtherInvestments" className={`text-right font-bold ${headerCellClass}`}>{formatCurrency(totalCurrentOtherInvestments)}</td> 
                                
                                {/* 4. Total Monthly Contributions */}
                                <td id="totalMonthlyOtherContributions" className={`text-right font-bold ${headerCellClass}`}>{formatCurrency(totalMonthlyOther)}</td> 
                                
                                {/* 5. Spacer cells for Avg Return, SD, Exp Ratio (3 cols) */}
                                <td colSpan="3" className={headerCellClass}></td> 

                                {/* 6. Spacer for Treatment */}
                                <td className={headerCellClass}></td> 
                                
                                {/* 7. Spacer for Notes */}
                                <td className={headerCellClass}></td> 
                                
                                {/* 8. Projected Value column (Final data column) */}
                                <td id="totalProjectedOtherInvestments" className={`text-right font-bold`}>{formatCurrency(totalProjectedOtherInvestments)}</td> 
                                
                                <td></td> {/* Action column */}
                            </tr> 
                        </tfoot> 
                    </table> 
                </div>
                <button 
                    id="addOtherInvestmentRow" 
                    className={addButtonStyles}
                    onClick={() => addInvestmentItem('otherInvestments', { holder: 'Person 1', accountType: '', description: '', currentValue: 0, monthlyContribution: 0, expectedReturn: 5.0, stdDev: 8.0, expenseRatio: 0.00, treatment: 'LumpSum', notes: '' })}
                >
                    Add Other Investment
                </button>
            </div>
        </section>
    );
};

export default InvestmentsSection;