import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { getScenarioNames, loadSelectedScenario, saveScenarioAs, deleteScenario } from '../storage'; // Import storage helpers

const ScenarioManager = () => {
    const { appData, setAppData, runAllCalculations, scenarioState, setScenarioState } = useAppContext();
    const [newName, setNewName] = useState('');
    const { activeName, names } = scenarioState;

    // Define a consistent button style for scenario controls
    const scenarioControlButton = "scenario-control-button px-3 py-1.5 text-sm rounded-lg transition-colors duration-200 shadow-sm font-medium";

    // Load scenario names on mount or whenever scenario state changes
    useEffect(() => {
        setScenarioState(prev => ({ ...prev, names: getScenarioNames() }));
    }, [setScenarioState]);

    const handleLoad = useCallback(() => {
        // Use activeName directly from state, which is bound to the <select> element

        const data = loadSelectedScenario(activeName);
        if (data) {
            setAppData(data);
            // No need to set activeName again, as it's already set by the onChange event on the select element
            runAllCalculations();
            console.log(`Scenario "${activeName}" successfully loaded.`);
        } else {
            console.error(`Scenario "${activeName}" not found in storage.`);
        }
        
    }, [activeName, setAppData, runAllCalculations]);

    const handleSaveAs = useCallback(() => {
        const trimmedName = newName.trim();
        
        if (!trimmedName || trimmedName === 'Base Case') {
            console.warn('Save failed: Please enter a valid, unique name (cannot be "Base Case").');
            return;
        }
        
        if (saveScenarioAs(appData, trimmedName)) {
            setScenarioState({ activeName: trimmedName, names: getScenarioNames() });
            setNewName(''); // Clear input field after successful save
            console.log(`Scenario saved as: ${trimmedName}`);
        }
    }, [appData, newName, setScenarioState]);

    const handleDelete = useCallback(() => {
        if (names.length === 1) {
            console.warn('Cannot delete the last remaining scenario.');
            return;
        }
        
        if (window.confirm(`Are you sure you want to delete the scenario "${activeName}"?`)) {
            if (deleteScenario(activeName)) {
                const updatedNames = getScenarioNames();
                // Find the new active scenario (the first one in the list, or "Base Case" if it exists)
                const newActiveName = updatedNames[0] || 'Base Case';
                
                const data = loadSelectedScenario(newActiveName); // Load the new active scenario
                
                setAppData(data);
                setScenarioState({ activeName: newActiveName, names: updatedNames });
                runAllCalculations();
                console.log(`Scenario '${activeName}' deleted. Switched to '${newActiveName}'.`);
            } else {
                console.error(`Failed to delete scenario: ${activeName}`);
            }
        }
    }, [activeName, names, setAppData, setScenarioState, runAllCalculations]);


    return (
        <div className="card-section mb-6">
            <h3 className="subsection-title mt-0">Scenario Manager</h3>
            <div className="flex flex-col md:flex-row items-center gap-4">
                
                {/* Load/Active Scenario */}
                <div className="flex items-center gap-3">
                    <label htmlFor="scenarioSelect" className="text-sm font-medium">Active Scenario:</label>
                    <select 
                        id="scenarioSelect" 
                        className="p-2 border border-gray-300 rounded-md shadow-sm"
                        value={activeName}
                        onChange={(e) => setScenarioState(prev => ({ ...prev, activeName: e.target.value }))}
                    >
                        {names.map(name => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>
                    {/* LOAD Button Styling (Primary Blue) */}
                    <button 
                        id="loadScenarioButton" 
                        className={`${scenarioControlButton} bg-blue-500 text-white hover:bg-blue-600`} 
                        onClick={handleLoad}
                    >
                        Load
                    </button>
                </div>

                {/* Save As */}
                <div className="flex items-center gap-3 mt-2 md:mt-0">
                    <input 
                        type="text" 
                        placeholder="New Scenario Name" 
                        value={newName} 
                        onChange={(e) => setNewName(e.target.value)}
                        className="p-2 border border-gray-300 rounded-md shadow-sm"
                    />
                    {/* SAVE AS Button Styling (Secondary Indigo) */}
                    <button 
                        id="saveScenarioAsButton" 
                        className={`${scenarioControlButton} bg-indigo-200 text-indigo-800 hover:bg-indigo-300`} 
                        onClick={handleSaveAs}
                    >
                        Save As
                    </button>
                </div>

                {/* Delete */}
                <div className="mt-2 md:mt-0">
                    {/* DELETE Button Styling (Warning Red) */}
                    <button 
                        id="deleteScenarioButton" 
                        className={`${scenarioControlButton} bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed`} 
                        onClick={handleDelete} 
                        disabled={activeName === 'Base Case' || names.length === 1}
                    >
                        Delete Current
                    </button>
                </div>
            </div>
        </div>
    );
};
export default ScenarioManager;