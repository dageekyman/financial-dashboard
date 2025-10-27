// src/components/PersonalInfoSection.jsx
import React, { useEffect } from 'react';
import { useAppContext, useDataFormatting } from '../hooks/useAppContext';

const PersonalInfoSection = () => {
    const { runAllCalculations } = useAppContext();
    
    // Custom hook for each data field (isCurrency=false, as these are ages/years)
    const p1Age = useDataFormatting('personalInfo.currentAge1', false); 
    const p2Age = useDataFormatting('personalInfo.currentAge2', false);
    const retAge = useDataFormatting('personalInfo.retirementAge', false);

    // Effect to trigger main calculation when ages change
    useEffect(() => {
        runAllCalculations(); 
    }, [p1Age.value, p2Age.value, retAge.value, runAllCalculations]);

    // Define a common input class for visual consistency
    const standardInputStyle = "mt-1 block w-full text-lg p-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500";
    // Define a bold input style for the retirement age
    const retirementInputStyle = "mt-1 block w-full text-2xl font-bold text-green-600 p-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500";


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
                
                {/* Placeholder for other assumptions/goals that might be added later */}
                <div className="p-5 border border-gray-200 rounded-lg bg-gray-50">
                    <h3 className="text-xl font-semibold text-gray-700 mb-4">Retirement Goals and Assumptions</h3>
                    <p className="text-sm text-gray-600 italic">Input fields for desired retirement income, tax rates, etc., belong here.</p>
                </div>

            </div>
        </section>
    );
};

export default PersonalInfoSection;