// src/components/AssetsLiabilities.jsx
import React, { useCallback } from 'react';
import { useAppContext, useDataFormatting } from '../hooks/useAppContext';
import { Doughnut } from 'react-chartjs-2';
import { formatCurrency, parseCurrency } from '../utils';

// Helper component for a single Asset or Liability row
const AssetLiabilityRow = ({ item, type }) => {
    const listName = type === 'asset' ? 'assets' : 'liabilities';
    const { handleTableChange } = useDataFormatting(listName);
    const { runAllCalculations, setAppData } = useAppContext();
    const valueKey = type === 'asset' ? 'value' : 'balance';

    const handleChange = (e) => {
        const { name, value } = e.target;
        runAllCalculations(); // Always recalculate net worth on change
        handleTableChange(item.id, name, value);
    };

    const deleteItem = useCallback(() => {
        setAppData(prev => ({
            ...prev,
            [listName]: prev[listName].filter(i => i.id !== item.id)
        }));
        runAllCalculations(); 
    }, [item.id, listName, setAppData, runAllCalculations]);
    
    // Create unique IDs 
    const typeId = `${listName}-${item.id}-type`;
    const descriptionId = `${listName}-${item.id}-description`;
    const valueId = `${listName}-${item.id}-${valueKey}`;

    // Define utility class for permanent column separation
    const gridCellClass = "border-r border-gray-300";


    return (
        // Added Zebra Striping and hover effect for readability
        <tr className="odd:bg-gray-50 hover:bg-indigo-50 transition duration-150"> 
            <td className={gridCellClass}>
                <input 
                    type="text" 
                    id={typeId} 
                    name="type" 
                    className={`${type}-type`} 
                    value={item.type} 
                    onChange={handleChange}
                    placeholder={type === 'asset' ? "e.g., Cash, Vehicle" : "e.g., Mortgage, Loan"}
                    autoComplete="off" 
                />
            </td>
            <td className={gridCellClass}>
                <input 
                    type="text" 
                    id={descriptionId} 
                    name="description" 
                    className={`${type}-description`} 
                    value={item.description} 
                    onChange={handleChange}
                    placeholder="Description"
                    autoComplete="off" 
                />
            </td>
            <td className={`text-right ${gridCellClass}`}>
                <input 
                    type="number" 
                    id={valueId} 
                    name={valueKey} 
                    className={`${type}-${valueKey} text-right`} 
                    value={item[valueKey]} 
                    onChange={handleChange}
                    step="0.01" 
                    placeholder="0.00"
                    autoComplete="off" 
                />
            </td>
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


// Helper component for Net Worth Chart
const NetWorthChartHelper = ({ totalAssets, totalLiabilities, netWorth }) => {
    const { formatCurrency } = useDataFormatting('assets');
    if ((totalAssets || 0) + (totalLiabilities || 0) <= 0) return null; 

    const data = {
        labels: ['Total Assets', 'Total Liabilities'],
        datasets: [{
            data: [totalAssets || 0, totalLiabilities || 0],
            backgroundColor: ['#22c55e', '#ef4444'], 
            borderColor: netWorth >= 0 ? '#10b981' : '#dc2626', 
            borderWidth: 2
        }]
    };
    return (
        <div className="w-full md:w-1/2 lg:w-1/3 mx-auto my-6">
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


// Main Assets and Liabilities Component
const AssetsLiabilitiesSection = () => {
    const { appData, setAppData, calculationResults, runAllCalculations } = useAppContext();
    const { formatCurrency } = useDataFormatting('assets'); 

    
    // Generic handler to add a new item to a list
    const addItem = useCallback((listName, defaults) => {
    setAppData(prev => {
        const list = prev[listName];
        const nextId = list.length > 0 ? Math.max(...list.map(i => i.id)) + 1 : 1; // Simple incrementing ID
        
        const newList = [...list, { 
            ...defaults, 
            id: nextId // Use the new incrementing ID
        }];
        return { ...prev, [listName]: newList };
    });
    runAllCalculations(); 
}, [setAppData, runAllCalculations]);

    
    // --- Calculations (Now pulling from the central results state) ---

    // Primary Asset Totals
    const totalOtherAssets = (appData.assets || []).reduce((sum, item) => sum + (item.value || 0), 0);
    const totalLiabilitiesStandalone = (appData.liabilities || []).reduce((sum, item) => sum + (item.balance || 0), 0);
    
    // Linked Totals (Calculated in App.jsx)
    const totalSec5InvestmentsForSummary = calculationResults.totalMainPortfolioValue || 0;
    const totalSec5OtherInvestmentsForSummary = calculationResults.totalOtherInvestmentsValue || 0;
    const totalSec7RentalAssetsValueForSummary = calculationResults.totalRentalPortfolioValue || 0;


    const totalAssets = totalOtherAssets + totalSec5InvestmentsForSummary + totalSec5OtherInvestmentsForSummary + totalSec7RentalAssetsValueForSummary;
    const netWorth = totalAssets - totalLiabilitiesStandalone;

    // Define reusable table and button styles
    const headerCellClass = "border-r border-gray-300";
    const addButtonStyles = "action-button save-button mt-4 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-150 shadow-md";


    return (
        // REMOVED DETAILS/SUMMARY WRAPPER
        <section className="card-section p-0 m-0 shadow-none"> 
            
            {/* Section 3: NET WORTH STATEMENT */}
            <h2 className="text-2xl font-bold mb-4 text-indigo-700">3. Assets and Liabilities</h2>
            <div className="pt-4">
                <h3 className="subsection-title mt-2">Assets</h3>
                <table id="currentAssetsTable">
                    <thead>
                        <tr>
                            <th className={headerCellClass}>Asset Type</th>
                            <th className={headerCellClass}>Description</th>
                            <th className={`text-right ${headerCellClass}`}>Current Value ($)</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(appData.assets || []).map(item => (
                            <AssetLiabilityRow
                                key={item.id}
                                item={item}
                                type="asset"
                            />
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="subtotal-row">
                            <td colSpan="2" className={`text-right font-semibold ${headerCellClass}`}>Subtotal Other Assets:</td>
                            <td id="subtotalOtherAssets" className={`text-right font-bold ${headerCellClass}`}>{formatCurrency(totalOtherAssets)}</td>
                            <td></td>
                        </tr>
                        <tr className="subtotal-row">
                            {/* CORRECTION: Changed from Sec 5 to Sec 4 to match sidebar */}
                            <td colSpan="2" className={`text-right font-semibold ${headerCellClass}`}>Total Main Investments (from Sec 4):</td>
                            <td id="totalSec5InvestmentsForSummary" className={`text-right font-bold ${headerCellClass}`}>{formatCurrency(totalSec5InvestmentsForSummary)}</td>
                            <td></td>
                        </tr>
                        <tr className="subtotal-row">
                            {/* CORRECTION: Added section reference (Sec 4) */}
                            <td colSpan="2" className={`text-right font-semibold ${headerCellClass}`}>Total Other Investments (from Sec 4):</td>
                            <td id="totalSec5OtherInvestmentsForSummary" className={`text-right font-bold ${headerCellClass}`}>{formatCurrency(totalSec5OtherInvestmentsForSummary)}</td>
                            <td></td>
                        </tr>
                        <tr className="subtotal-row">
                            {/* CORRECTION: Changed from Sec 7 to Sec 5 to match sidebar */}
                            <td colSpan="2" className={`text-right font-semibold ${headerCellClass}`}>Total Rental Portfolio Value (from Sec 5):</td>
                            <td id="totalSec7RentalAssetsValueForSummary" className={`text-right font-bold ${headerCellClass}`}>{formatCurrency(totalSec7RentalAssetsValueForSummary)}</td>
                            <td></td>
                        </tr>
                        <tr className="total-row bg-gray-100">
                            <td colSpan="2" className={`text-right font-semibold text-lg ${headerCellClass}`}>Total Current Assets (All):</td>
                            <td id="totalCurrentAssetsAll" className={`text-right font-bold text-lg ${headerCellClass}`}>{formatCurrency(totalAssets)}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
                <button 
                    id="addAssetRow" 
                    className={addButtonStyles}
                    onClick={() => addItem('assets', { type: 'Cash', description: '', value: 0 })} 
                >
                    Add Other Asset
                </button>

                <NetWorthChartHelper totalAssets={totalAssets} totalLiabilities={totalLiabilitiesStandalone} netWorth={netWorth} />

                <h3 className="subsection-title mt-6">Liabilities Summary</h3> 
                <table className="w-full md:w-1/2 lg:w-1/3 mx-auto"> 
                    <tbody> 
                        <tr className="grand-total-row"> 
                            <td className="text-right font-semibold text-lg">Total Current Liabilities (from Sec 4):</td> 
                            <td id="totalCurrentLiabilitiesSummary" className="text-right font-bold text-lg">{formatCurrency(totalLiabilitiesStandalone)}</td> 
                        </tr> 
                    </tbody> 
                </table>
                <div className="mt-6 pt-6 border-t-4 border-indigo-600"> 
                    <h3 className="text-2xl font-bold text-center text-indigo-700">Estimated Net Worth</h3> 
                    <p 
                        className={`text-3xl text-center font-bold mt-2 ${netWorth >= 0 ? 'text-green-700' : 'text-red-700'}`} 
                        id="estimatedNetWorthDisplay">
                        {formatCurrency(netWorth)}
                    </p> 
                </div>
             </div>

            <hr className="my-8 border-gray-200"/>

            {/* Section 4: STANDALONE LIABILITIES */}
            <h2 className="text-2xl font-bold mb-4 text-indigo-700">Standalone Liabilities (Non-Rental)</h2>
            <div className="pt-4">
                <table id="liabilitiesTableStandalone">
                     <thead> 
                        <tr> 
                            <th className={headerCellClass}>Liability Type</th> 
                            <th className={headerCellClass}>Description</th> 
                            <th className={`text-right ${headerCellClass}`}>Current Balance ($)</th> 
                            <th>Action</th> 
                        </tr> 
                     </thead> 
                     <tbody>
                        {(appData.liabilities || []).map(item => (
                            <AssetLiabilityRow
                                key={item.id}
                                item={item}
                                type="liability"
                            />
                        ))}
                     </tbody> 
                     <tfoot> 
                        <tr className="total-row bg-gray-50"> 
                            {/* Added column separation class to footer cells */}
                            <td colSpan="2" className={`text-right font-semibold ${headerCellClass}`}>Total Standalone Liabilities:</td> 
                            <td id="totalLiabilitiesStandalone" className={`text-right font-bold ${headerCellClass}`}>{formatCurrency(totalLiabilitiesStandalone)}</td> 
                            <td></td> 
                        </tr> 
                     </tfoot> 
                </table>
                <button 
                    id="addStandaloneLiabilityRow" 
                    className={addButtonStyles}
                    onClick={() => addItem('liabilities', { type: 'Loan', description: '', balance: 0 })} 
                >
                    Add Liability Item
                </button>
            </div>
        </section>
    );
};

export default AssetsLiabilitiesSection;