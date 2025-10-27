// src/components/Budget.jsx
import React, { useCallback } from 'react';
import { useAppContext, useDataFormatting } from '../hooks/useAppContext'; 
import { formatCurrency, parseCurrency } from '../utils';

// Helper component for a single budget row
const BudgetRow = ({ item, type }) => {
    const { handleTableChange } = useDataFormatting(type);
    const { runAllCalculations, setAppData } = useAppContext();
    const isIncome = type === 'income';
    const descriptionKey = isIncome ? 'description' : 'category';

    const handleChange = (e) => {
        const { name, value } = e.target;
        handleTableChange(item.id, name, value); 
        runAllCalculations();
    };

    const deleteItem = useCallback(() => {
        setAppData(prev => ({
            ...prev,
            [type]: prev[type].filter(i => i.id !== item.id)
        }));
        runAllCalculations(); 
    }, [item.id, type, setAppData, runAllCalculations]);

    const descriptionId = `${type}-${item.id}-${descriptionKey}`;
    const amountId = `${type}-${item.id}-amount`;
    
    // Define utility classes for permanent column separation and hover/striping
    const gridCellClass = "border-r border-gray-300";


    return (
        // Added Zebra Striping and hover effect for readability
        <tr className="odd:bg-gray-50 hover:bg-indigo-50 transition duration-150"> 
            {/* FIX: Set a width for the description/category cell for better control */}
            <td className={`${gridCellClass} w-2/3`}>
                <input 
                    type="text" 
                    id={descriptionId} // ADDED ID
                    name={descriptionKey} // ADDED NAME
                    // FIX: Ensure input takes full width of cell
                    className={`${type}-${descriptionKey} w-full`} 
                    value={item[descriptionKey]} 
                    onChange={handleChange}
                    placeholder={isIncome ? "e.g., Salary, Bonus" : "e.g., Housing, Food"}
                    autoComplete="off" // Added for autofill warning
                />
            </td>
            {/* FIX: Set a width for the amount cell to ensure enough space for $ amounts */}
            <td className={`text-right ${gridCellClass} w-1/4`}>
                <input 
                    type="number" 
                    id={amountId} // ADDED ID
                    name="amount" // ADDED NAME
                    // FIX: Ensure input takes full width of cell
                    className={`${type}-amount text-right w-full`} 
                    value={item.amount} 
                    onChange={handleChange}
                    step="0.01" 
                    placeholder="0.00"
                    autoComplete="off" // Added for autofill warning
                />
            </td>
            {/* Action column is small, remaining width */}
            <td className="w-1/12">
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

// Main Budget Section Component
const BudgetSection = () => {
    const { appData, setAppData, runAllCalculations } = useAppContext();
    const { formatCurrency } = useDataFormatting('income'); 

    const listNames = { income: 'income', expenses: 'expenses' };

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

    
    // --- Calculation ---
    const calculateTotals = (list) => (list || []).reduce((sum, item) => sum + (item.amount || 0), 0);
    
    const totalIncome = calculateTotals(appData.income);
    const totalExpenses = calculateTotals(appData.expenses);
    const netSavings = totalIncome - totalExpenses;

    const summaryNetSavingsClass = netSavings >= 0 ? 'font-bold text-green-600' : 'font-bold text-red-600';

    // Define a utility class for permanent column separation on header cells
    const headerCellClass = "border-r border-gray-300";

    // Define a robust button style for Add Budget buttons (similar to Investment buttons)
    const addButtonStyles = "action-button save-button mt-4 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-150 shadow-md";


    // --- Render Helper ---
    const renderTable = (listName) => {
        const isIncome = listName === 'income';
        const list = appData[listName];
        const total = isIncome ? totalIncome : totalExpenses;
        const descriptionLabel = isIncome ? 'Description' : 'Category';
        const buttonLabel = isIncome ? 'Add Income Source' : 'Add Expense Item';

        const defaultItem = isIncome ? 
            { description: '', amount: 0 } : 
            { category: '', amount: 0 };

        const tableContent = (
             <table id={`${listName}Table`} className="w-full">
                    <thead>
                        <tr>
                            {/* FIX: Apply width to TH elements */}
                            <th className={`${headerCellClass} w-2/3`}>{descriptionLabel}</th> 
                            <th className={`text-right ${headerCellClass} w-1/4`}>Monthly Amount ($)</th>
                            <th className="w-1/12">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.map(item => (
                            <BudgetRow 
                                key={item.id}
                                item={item}
                                type={listName}
                            />
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="total-row bg-gray-50">
                            {/* FIX: Ensure column spacing matches header/body. Total label spans description column. */}
                            <td className={`text-right font-semibold ${headerCellClass} w-2/3`}>
                                {`Total Monthly ${isIncome ? 'Income' : 'Expenses'}:`}
                            </td>
                            {/* Total amount cell must match amount column width */}
                            <td id={`totalMonthly${isIncome ? 'Income' : 'Expenses'}`} className="text-right font-bold w-1/4">
                                {formatCurrency(total)}
                            </td>
                            {/* Empty Action column */}
                            <td className="w-1/12"></td>
                        </tr>
                    </tfoot>
                </table>
        );


        return (
            <div>
                {/* FIX: Updated h3 to use consistent subsection header style */}
                <h3 className="text-2xl font-bold text-indigo-700 mb-4">{isIncome ? 'Income Sources' : 'Expenses'}</h3>
                {tableContent}
                <button 
                    type="button" 
                    onClick={() => addItem(listName, defaultItem)} 
                    // Applied the standardized button style
                    className={addButtonStyles}
                >
                    {buttonLabel}
                </button>
            </div>
        );
    };


    return (
        <section className="card-section">
            {/* FIX: Updated h2 to use consistent main section header style */}
            <h2 className="text-3xl font-bold mb-4 text-indigo-700">2. Monthly Budget</h2>
            <div className="pt-4">
                <div className="grid md:grid-cols-2 gap-x-8">
                    {renderTable(listNames.income)}
                    {renderTable(listNames.expenses)}
                </div>
                
                {/* BUDGET SUMMARY */}
                <div className="mt-6 pt-4 border-t-2 border-indigo-200">
                    <h3 className="text-xl font-semibold text-center">Budget Summary</h3>
                    <p className="text-center text-lg mt-2">Total Monthly Income: <span id="summaryTotalIncome" className="font-bold text-green-600">{formatCurrency(totalIncome)}</span></p>
                    <p className="text-center text-lg">Total Monthly Expenses: <span id="summaryTotalExpenses" className="font-bold text-red-600">{formatCurrency(totalExpenses)}</span></p>
                    <p className="text-center text-xl font-bold mt-1">Net Monthly Savings / (Shortfall): <span id="summaryNetSavings" className={summaryNetSavingsClass}>{formatCurrency(netSavings)}</span></p>
                </div>
            </div>
        </section>
    );
};

export default BudgetSection;