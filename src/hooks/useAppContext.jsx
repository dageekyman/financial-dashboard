// src/hooks/useAppContext.js
import React, { createContext, useContext, useCallback } from 'react';
import { formatCurrency, parseCurrency } from '../utils';
import { autoSaveCurrentScenario } from '../storage'; // Import final auto-save logic

// 1. Create the Context
const AppContext = createContext();

// 2. Create the Provider component (wraps the entire app in main.jsx)
export const AppProvider = ({ appLogic, children }) => {
    return (
        <AppContext.Provider value={appLogic}>
            {children}
        </AppContext.Provider>
    );
};

// 3. Create a Custom Hook to use the Context easily
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};

// 4. Create a Custom Hook for Formatting and Input Handling
/**
 * Provides centralized formatting and input change handlers.
 * @param {string} listOrInputKey - Dot-notated string for state path (e.g., 'personalInfo.currentAge1' or 'income').
 * @param {boolean} isPercentage - True if the value should be treated/displayed as a percentage.
 * @returns {object} - Handlers for updating state and formatted display values.
 */
export const useDataFormatting = (listOrInputKey, isPercentage = false) => {
    const { appData, setAppData, handleInputChange } = useAppContext();
    
    // Determine which nested object the field belongs to
    const keys = listOrInputKey.split('.'); 
    const contextKey = keys[0];

    // Get the current value from the state object
    const value = listOrInputKey.split('.').reduce((obj, key) => obj?.[key], appData);

    const formatValue = (val) => {
        // If it's a numeric field but not money, display cleanly (e.g., age, term)
        if (!isPercentage && !listOrInputKey.includes('amount') && !listOrInputKey.includes('value') && !listOrInputKey.includes('balance') && typeof val === 'number') {
             return val;
        }
        // Handle currencies and percentages
        return isPercentage ? parseCurrency(val).toFixed(1) : parseCurrency(val).toFixed(2);
    }
    
    // --- Input Change Handler for Simple Fields (PersonalInfo, Assumptions, SS FRA) ---
    const handleChange = useCallback((e) => {
        const { id, value, type } = e.target;
        
        let targetValue;
        if (type === 'number' || type === 'select-one') {
             // Use parseCurrency to handle commas/symbols, but keep as a float/int
             targetValue = type === 'number' && !id.includes('Age') ? parseCurrency(value) : parseInt(value) || 0;
        } else {
             targetValue = value; // Keep as string for text fields
        }

        if (contextKey) {
            setAppData(prev => ({
                ...prev,
                [contextKey]: {
                    ...prev[contextKey],
                    [id]: targetValue
                }
            }));
        }
        handleInputChange(); // Trigger auto-save/recalc
    }, [contextKey, setAppData, handleInputChange, isPercentage]);
    
    // --- Input Change Handler for Table Row Fields (Arrays) ---
    const handleTableChange = useCallback((id, key, rawValue) => {
        // key is the field name (e.g., 'amount', 'description')
        const isNumeric = ['amount', 'balance', 'value', 'currentValue', 'monthlyContribution', 'expectedReturn', 'stdDev', 'expenseRatio', 'interestRate', 'loanAmount', 'loanTerm', 'paymentsMade', 'arv', 'rent', 'userProvidedMonthlyOpEx', 'monthlyPI', 'year'].some(k => key.includes(k));
        
        let targetValue = isNumeric ? parseCurrency(rawValue) : rawValue;

        setAppData(prev => ({
            ...prev,
            [contextKey]: prev[contextKey].map(item => 
                item.id === id ? { ...item, [key]: targetValue } : item
            )
        }));
        handleInputChange(); // Trigger auto-save/recalc
    }, [contextKey, setAppData, handleInputChange]);

    return {
        value: value,
        formatted: formatCurrency(value),
        handleChange,
        handleTableChange,
        formatCurrency,
        parseCurrency
    };
};