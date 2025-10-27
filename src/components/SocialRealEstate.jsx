// src/components/SocialRealEstate.jsx
import React, { useCallback } from 'react';
import { useAppContext, useDataFormatting } from '../hooks/useAppContext';
import { formatCurrency, parseCurrency } from '../utils';

// Helper component for rendering a generic table row with inputs
const GenericInputRow = ({ item, listName, keys, inputs }) => {
    const { handleTableChange } = useDataFormatting(listName);
    const { runAllCalculations, setAppData, calculationResults } = useAppContext();
    
    const isRental = listName === 'rentals';
    const isLifeEvent = listName === 'lifeEvents';
    const prefix = isRental ? 'rental' : (isLifeEvent ? 'event' : '');

    // Define utility class for permanent column separation
    const gridCellClass = "border-r border-gray-300";

    // --- Delete Handler ---
    const deleteItem = useCallback(() => {
        setAppData(prev => ({
            ...prev,
            [listName]: prev[listName].filter(i => i.id !== item.id)
        }));
        runAllCalculations(); 
    }, [item.id, listName, setAppData, runAllCalculations]);

    // --- Change Handler ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        handleTableChange(item.id, name, value); 
        if (isRental || isLifeEvent) {
            runAllCalculations(); 
        }
    };
    
    // Determine which keys are inputs versus read-only outputs 
    const inputKeys = keys.filter(k => !['netCashFlow', 'loanBalance', 'equity', 'netProfitIfSold', 'benefit', 'Monthly Benefit'].includes(k));

    return (
        // Added Zebra Striping and hover effect for readability
        <tr className="odd:bg-gray-50 hover:bg-indigo-50 transition duration-150"> 
            {keys.map((key) => {
                const isNumeric = ['price', 'rehabCosts', 'closingCosts', 'loanAmount', 'interestRate', 'loanTerm', 'paymentsMade', 'arv', 'rent', 'userProvidedMonthlyOpEx', 'monthlyPI', 'amount', 'year'].includes(key);
                const className = `${prefix}-${key}${isNumeric || key.includes('Balance') || key.includes('Equity') ? ' text-right' : ''}`;
                const value = isRental ? (calculationResults.rentalsWithCalculations?.find(r => r.id === item.id)?.[key] || item[key]) : item[key];
                
                const fieldId = `${prefix}-${item.id}-${key}`;
                
                // Determine if this is the last column (Action column has no right border)
                const isLastDataColumn = key === keys[keys.length - 1];
                const cellClasses = isLastDataColumn ? className : `${className} ${gridCellClass}`;
                
                // --- Handle Read-Only Calculated Values ---
                if (!inputKeys.includes(key)) {
                    const formattedValue = value !== undefined && value !== null ? formatCurrency(value) : 'N/A';
                    return <td key={key} className={cellClasses}>{formattedValue}</td>;
                }
                
                // --- Handle Select Elements (Life Events) ---
                if (key === 'type' || key === 'frequency') {
                    const options = key === 'type' ? ['Expense', 'Income', 'Asset Change'] : ['One-Time', 'Annual'];
                    return (
                        <td key={key} className={key === 'type' ? `w-1/6 ${gridCellClass}` : gridCellClass}>
                            <select 
                                className={className} 
                                name={key} 
                                id={fieldId}
                                value={value} 
                                onChange={handleChange}
                                // FIX: Make select background transparent
                                style={{backgroundColor: 'transparent'}}
                            >
                                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </td>
                    );
                }
                
                // --- Regular Input Fields ---
                return (
                    <td key={key} colSpan={key === 'address' ? 2 : 1} className={cellClasses}>
                        <input
                            type={isNumeric ? 'number' : 'text'}
                            className={className}
                            name={key} 
                            id={fieldId}
                            autoComplete={isNumeric ? "off" : (key.includes('address') ? "street-address" : "off")}
                            value={isNumeric && (value === undefined || value === null) ? 0 : value}
                            onChange={handleChange}
                            placeholder={inputs[key]?.placeholder || ''}
                            step={isNumeric ? (key.includes('Rate') || key.includes('amount') || key.includes('PI') ? '0.01' : '1') : undefined}
                            // FIX: Make input background transparent
                            style={{backgroundColor: 'transparent'}}
                        />
                    </td>
                );
            })}
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

// Main Component
const SocialRealEstateSection = () => {
    const { appData, setAppData, calculationResults, runAllCalculations } = useAppContext();
    
    const ssData = appData.socialSecurity;
    const rentalsData = calculationResults.rentalsWithCalculations || appData.rentals;

    const rentalTableKeys = [
        'address', 'purchasePrice', 'rehabCosts', 'closingCosts', 'loanAmount', 'interestRate', 'loanTerm', 
        'paymentsMade', 'arv', 'rent', 'userProvidedMonthlyOpEx', 'monthlyPI', 
        'netCashFlow', 'loanBalance', 'equity', 'netProfitIfSold'
    ];
    const rentalTableInputs = {
        address: { placeholder: '123 Main St' }, purchasePrice: { placeholder: '0' }, rehabCosts: { placeholder: '0' }, 
        closingCosts: { placeholder: '0' }, loanAmount: { placeholder: '0' }, interestRate: { placeholder: '0.0%' }, 
        loanTerm: { placeholder: '30' }, paymentsMade: { placeholder: '0' }, arv: { placeholder: '0' }, 
        rent: { placeholder: '0' }, userProvidedMonthlyOpEx: { placeholder: '0' }, monthlyPI: { placeholder: '0' }
    };
    
    const lifeEventKeys = ['year', 'type', 'description', 'amount', 'frequency', 'notes'];
    const lifeEventInputs = { year: { placeholder: new Date().getFullYear() + 1 }, description: { placeholder: 'Event Name' }, amount: { placeholder: '0' }, notes: { placeholder: 'Details' } };

    // --- Add Handlers ---
    const addItem = useCallback((listName, defaults) => {
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


    // Handler for SS dropdowns (P1 and P2 Start Age)
    const handleSSStartAgeChange = (e) => {
        const { id, value } = e.target;
        setAppData(prev => ({
            ...prev,
            socialSecurity: {
                ...prev.socialSecurity,
                [id]: parseInt(value)
            }
        }));
        runAllCalculations(); 
    };

    // Handler for SS FRA Benefit Inputs
    const handleSSFraBenefitChange = (e) => {
        const { id, value } = e.target;
        setAppData(prev => ({
            ...prev,
            socialSecurity: {
                ...prev.socialSecurity,
                [id]: parseCurrency(value)
            }
        }));
        runAllCalculations(); 
    };

    // Handler for Rental Assumption Change (Selling Cost %)
    const handleRentalAssumptionChange = (e) => {
        const value = parseCurrency(e.target.value);
        setAppData(prev => ({
            ...prev,
            assumptions: {
                ...prev.assumptions,
                rentalSellingCostPercent: value 
            }
        }));
        runAllCalculations(); 
    };
    
    // Define reusable table and button styles
    const headerCellClass = "border-r border-gray-300";
    const addButtonStyles = "action-button save-button mt-4 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-150 shadow-md";


    return (
        <section className="space-y-6"> 
            {/* FIX: Applied consistent main section header style */}
            <h2 className="text-3xl font-bold mb-4 text-indigo-700">5. Retirement Income Sources</h2>

            {/* Section 6: SOCIAL SECURITY */}
            <div className="card-section">
                {/* FIX: Applied consistent subsection header style */}
                <h3 className="text-2xl font-bold text-indigo-700 mt-0">Social Security Benefit Estimates</h3>
                <div className="pt-4">
                    {/* FRA INPUTS (No table formatting needed here) */}
                    <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 mb-6 p-4 border border-gray-200 rounded-md bg-gray-50"> 
                        <div className="input-group"> 
                            {/* FIX: Added space after ($) */}
                            <label htmlFor="person1FRABenefit">Person 1's Estimated FRA Monthly Benefit ($)&nbsp;</label> 
                            <input 
                                type="number" 
                                id="person1FRABenefit" 
                                name="person1FRABenefit"
                                value={ssData.person1FRABenefit} 
                                onChange={handleSSFraBenefitChange}
                                step="1" required 
                            /> 
                        </div> 
                        <div className="input-group"> 
                            {/* FIX: Added space after ($) */}
                            <label htmlFor="person2FRABenefit">Person 2's Estimated FRA Monthly Benefit ($)&nbsp;(If applicable)</label> 
                            <input 
                                type="number" 
                                id="person2FRABenefit" 
                                name="person2FRABenefit"
                                value={ssData.person2FRABenefit} 
                                onChange={handleSSFraBenefitChange}
                                step="1" 
                            /> 
                        </div> 
                    </div>

                    {/* BENEFITS TABLES */}
                    <div className="grid md:grid-cols-2 gap-x-8 gap-y-6"> 
                        {/* Person 1 SS Table */}
                        <div> 
                            <h4 className="subsection-title text-lg font-semibold">Person 1's Estimated Benefits</h4> 
                            <table id="person1SSBenefitsTable" className="mb-4 text-sm w-full md:w-3/4"> 
                                <thead>
                                    <tr>
                                        <th className={headerCellClass}>Start Age</th>
                                        <th>Monthly Benefit</th>
                                    </tr>
                                </thead> 
                                <tbody>
                                    {calculationResults.person1SSData?.map(item => (
                                        // Added Zebra Striping
                                        <tr key={item.age} className="odd:bg-gray-50 hover:bg-indigo-50 transition duration-150">
                                            <td className={`text-center ${headerCellClass}`}>{item.age}</td>
                                            <td className="text-right">{formatCurrency(item.benefit)}</td>
                                        </tr>
                                    ))}
                                </tbody> 
                            </table> 
                            <div className="input-group"> 
                                <label htmlFor="person1SSStartAge">Person 1's Planned SS Start Age:</label> 
                                <select 
                                    id="person1SSStartAge"
                                    name="person1SSStartAge"
                                    value={ssData.person1SSStartAge}
                                    onChange={handleSSStartAgeChange}
                                > 
                                    {Array.from({ length: 9 }, (_, i) => 62 + i).map(age => (
                                        <option key={age} value={age}>{age} {age === 67 ? '(FRA)' : ''}</option>
                                    ))}
                                </select> 
                            </div> 
                            <p className="text-md font-semibold">Person 1's Selected Monthly Benefit: <span id="person1SelectedSSBenefit" className="text-indigo-700">{formatCurrency(calculationResults.person1MonthlyBenefit)}</span></p> 
                        </div> 
                        
                        {/* Person 2 SS Table */}
                        <div> 
                            {/* FIX: Corrected missing quote issue on h4 tag */}
                            <h4 className="subsection-title text-lg font-semibold">Person 2's Estimated Benefits</h4> 
                            <table id="person2SSBenefitsTable" className="mb-4 text-sm w-full md:w-3/4"> 
                                <thead>
                                    <tr>
                                        <th className={headerCellClass}>Start Age</th>
                                        <th>Monthly Benefit (Higher of Own/Spousal)</th>
                                    </tr>
                                </thead> 
                                <tbody>
                                    {calculationResults.person2SSData?.map(item => (
                                        // Added Zebra Striping
                                        <tr key={item.age} className="odd:bg-gray-50 hover:bg-indigo-50 transition duration-150">
                                            <td className={`text-center ${headerCellClass}`}>{item.age}</td>
                                            <td className="text-right">{formatCurrency(item.benefit)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table> 
                            <div className="input-group"> 
                                <label htmlFor="person2SSStartAge">Person 2's Planned SS Start Age:</label> 
                                <select 
                                    id="person2SSStartAge" 
                                    name="person2SSStartAge"
                                    value={ssData.person2SSStartAge}
                                    onChange={handleSSStartAgeChange}
                                > 
                                    {Array.from({ length: 6 }, (_, i) => 62 + i).map(age => (
                                        <option key={age} value={age}>{age} {age === 67 ? '(FRA)' : ''}</option>
                                    ))}
                                </select> 
                            </div> 
                            <p className="text-md font-semibold">Person 2's Selected Monthly Benefit: <span id="person2SelectedSSBenefit" className="text-indigo-700">{formatCurrency(calculationResults.person2MonthlyBenefit)}</span></p> 
                        </div> 
                    </div>
                    
                    {/* COMBINED SS TOTALS */}
                    <div className="mt-6 pt-4 border-t border-gray-200"> 
                        {/* FIX: Corrected missing quote issue */}
                        <h4 className="subsection-title text-center text-lg font-semibold">Combined Social Security Income</h4> 
                        <div className="text-center text-lg"> 
                            <p>Total Combined Monthly SS Benefit: <span id="totalCombinedMonthlySS" className="font-bold text-green-700">{formatCurrency(calculationResults.totalMonthly)}</span></p> 
                            <p>Total Combined Annual SS Benefit: <span id="totalCombinedAnnualSS" className="font-bold text-green-700">{formatCurrency((calculationResults.totalMonthly || 0) * 12)}</span></p> 
                        </div> 
                    </div>
                </div>
            </div>

            {/* Section 7: REAL ESTATE */}
            <div className="card-section">
                {/* FIX: Applied consistent subsection header style */}
                <h3 className="text-2xl font-bold text-indigo-700 mt-0">Real Estate Rental Portfolio</h3>
                <div className="pt-4">
                    <div className="grid md:grid-cols-2 gap-6 mb-6 p-4 border border-gray-200 rounded-md bg-gray-50"> 
                        <div className="input-group"> 
                            {/* FIX: Added non-breaking space after (%) */}
                            <label htmlFor="rentalSellingCostPercent">Assumed Selling Cost (%) for Rentals&nbsp;</label> 
                            <input 
                                type="number" 
                                id="rentalSellingCostPercent" 
                                name="rentalSellingCostPercent"
                                value={appData.assumptions.rentalSellingCostPercent} 
                                onChange={handleRentalAssumptionChange}
                                step="0.1" required 
                            /> 
                        </div> 
                    </div>
                    
                    <div style={{overflowX: 'auto'}}>
                        <table id="rentalPortfolioTable">
                            <thead>
                                <tr>
                                    {/* FIX 1: Change Property Address/Desc. header to colSpan="2" to match the body rows */}
                                    <th className={headerCellClass} colSpan="2">Property Address/Desc.</th>
                                    <th className={`text-right ${headerCellClass}`}>Purchase Price ($)</th>
                                    <th className={`text-right ${headerCellClass}`}>Rehab Cost ($)</th>
                                    <th className={`text-right ${headerCellClass}`}>Closing Costs ($)</th>
                                    <th className={`text-right ${headerCellClass}`}>Loan Amt ($)</th>
                                    <th className={`text-right ${headerCellClass}`}>Interest Rate (%)</th>
                                    <th className={`text-right ${headerCellClass}`}>Loan Term (Yrs)</th>
                                    <th className={`text-right ${headerCellClass}`}>Payments Made</th>
                                    <th className={`text-right ${headerCellClass}`}>Est. Value ($)</th>
                                    <th className={`text-right ${headerCellClass}`}>Monthly Rent ($)</th>
                                    <th className={`text-right ${headerCellClass}`}>Monthly OpEx ($)</th>
                                    <th className={`text-right ${headerCellClass}`}>Monthly P and I ($)</th>
                                    <th className={`text-right ${headerCellClass}`}>Net Cash Flow ($)</th>
                                    <th className={`text-right ${headerCellClass}`}>Est. Loan Bal ($)</th>
                                    <th className={`text-right ${headerCellClass}`}>Est. Equity ($)</th>
                                    <th className={`text-right ${headerCellClass}`}>Net Profit if Sold ($)</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rentalsData.map(item => (
                                    <GenericInputRow 
                                        key={item.id}
                                        item={item}
                                        listName="rentals"
                                        keys={rentalTableKeys}
                                        inputs={rentalTableInputs}
                                    />
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="total-row bg-gray-50">
                                    {/* FIX 2: Change colSpan to 10. The label spans Address (2 cols) + 7 inputs + Est. Value (1 col) = 10 columns total. */}
                                    <td className={`font-semibold text-left pl-4`} colSpan="10">
                                        Total Portfolio Estimated Value:
                                    </td>
                                    
                                    {/* Col 11: Monthly Rent (Aligned correctly) */}
                                    <td id="totalRentalMonthlyRent" className={`text-right font-bold ${headerCellClass}`}>{formatCurrency(calculationResults.totalRentalMonthlyRent || 0)}</td>
                                    {/* Col 12: Monthly OpEx */}
                                    <td id="totalRentalMonthlyOpEx" className={`text-right font-bold ${headerCellClass}`}>{formatCurrency(calculationResults.totalRentalMonthlyOpEx || 0)}</td>
                                    {/* Col 13: Monthly P and I */}
                                    <td id="totalRentalMonthlyPI" className={`text-right font-bold ${headerCellClass}`}>{formatCurrency(calculationResults.totalRentalMonthlyPI || 0)}</td>
                                    {/* Col 14: Net Cash Flow */}
                                    <td id="totalRentalNetCashFlow" className={`text-right font-bold ${headerCellClass}`}>{formatCurrency(calculationResults.totalRentalNetCashFlow || 0)}</td>
                                    {/* Col 15: Est. Loan Bal */}
                                    <td id="totalRentalLoanBalance" className={`text-right font-bold ${headerCellClass}`}>{formatCurrency(calculationResults.totalRentalLoanBalance || 0)}</td>
                                    {/* Col 16: Est. Equity */}
                                    <td id="totalRentalEquity" className={`text-right font-bold ${headerCellClass}`}>{formatCurrency(calculationResults.totalRentalEquity || 0)}</td>
                                    {/* Col 17: Net Profit if Sold */}
                                    <td id="totalRentalNetProfitIfSold" className={`text-right font-bold ${headerCellClass}`}>{formatCurrency(calculationResults.totalRentalNetProfitIfSold || 0)}</td>
                                    {/* Col 18: Action */}
                                    <td></td> 
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    
                    <button 
                        id="addRentalPropertyRow" 
                        className={addButtonStyles}
                        onClick={() => addItem('rentals', { 
                            address: '', purchasePrice: 0, rehabCosts: 0, closingCosts: 0, loanAmount: 0, interestRate: 0, loanTerm: 30, paymentsMade: 0, arv: 0, rent: 0, userProvidedMonthlyOpEx: 0, monthlyPI: 0,
                            netCashFlow: 0, loanBalance: 0, equity: 0, netProfitIfSold: 0
                        })} 
                    >
                        Add Rental Property
                    </button>
                </div>
            </div>

            {/* Section 8: LIFE EVENTS */}
            <div className="card-section">
                {/* FIX: Applied consistent subsection header style */}
                <h3 className="text-2xl font-bold text-indigo-700 mt-0">Life Events Timeline</h3>
                <div className="pt-4">
                     <p className="text-sm text-gray-600 mb-4">Define future one-time or temporary changes to cash flow (e.g., college costs, inheritance, selling property). These are factored into the longevity projections.</p>
                     <table id="lifeEventsTable" className="w-full">
                         <thead>
                             <tr>
                                <th className={headerCellClass}>Year</th>
                                <th className={headerCellClass}>Event Type</th>
                                <th className={headerCellClass}>Description</th>
                                <th className={`text-right ${headerCellClass}`}>Amount ($)</th>
                                <th className={headerCellClass}>Frequency</th>
                                <th className={headerCellClass}>Notes</th>
                                <th>Action</th>
                            </tr>
                         </thead>
                         <tbody>
                             {appData.lifeEvents.map(item => (
                                 <GenericInputRow 
                                     key={item.id}
                                     item={item}
                                     listName="lifeEvents"
                                     keys={lifeEventKeys}
                                     inputs={lifeEventInputs}
                                 />
                             ))}
                         </tbody>
                         <tfoot>
                             <tr className="total-row bg-gray-50"> 
                                 <td colSpan="6" className={`text-right font-semibold ${headerCellClass}`}>
                                     Total Life Event Adjustments (Calculated Annually)
                                 </td>
                                 <td></td> 
                             </tr> 
                         </tfoot> 
                     </table>
                     <button 
                         id="addLifeEventButton" 
                         className={addButtonStyles}
                         onClick={() => addItem('lifeEvents', { year: new Date().getFullYear() + 1, type: 'Expense', description: '', amount: 0, frequency: 'One-Time', notes: '' })}
                     >
                        Add Life Event
                     </button>
                </div>
            </div>
        </section>
    );
};

export default SocialRealEstateSection;