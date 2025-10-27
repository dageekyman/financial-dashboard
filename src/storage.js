// src/storage.js
import { getInitialDataState } from './initialDataState.js';

const SCENARIOS_KEY = 'financialDashboardScenarios';
// FIX: Ensure this is singular
const LAST_ACTIVE_SCENARIO_KEY = 'financialDashboardLastActiveScenario'; 
const DEFAULT_SCENARIO_NAME = 'Base Case';
const AUTO_SAVE_DELAY = 1500;
let autoSaveTimeout = null;

// --- Helper functions for managing scenarios object in localStorage ---

/**
 * Retrieves the scenarios object from localStorage.
 * @returns {object} - An object containing all saved scenarios, or an empty object.
 */
function getSavedScenarios() {
    const savedData = localStorage.getItem(SCENARIOS_KEY);
    return savedData ? JSON.parse(savedData) : {};
}

/**
 * Saves the scenarios object to localStorage.
 * @param {object} scenarios - The object containing all scenarios.
 */
function saveScenarios(scenarios) {
    try {
        localStorage.setItem(SCENARIOS_KEY, JSON.stringify(scenarios));
    } catch (error) {
        console.error('Error saving scenarios to localStorage:', error);
    }
}

/**
 * Saves the name of the currently active scenario.
 * @param {string} scenarioName - The name of the active scenario.
 */
function saveLastActiveScenarioName(scenarioName) {
    localStorage.setItem(LAST_ACTIVE_SCENARIO_KEY, scenarioName);
}

/**
 * Gets the name of the last active scenario.
 * @returns {string | null} - The name or null if none saved.
 */
function getLastActiveScenarioName() {
    return localStorage.getItem(LAST_ACTIVE_SCENARIO_KEY); 
}


// =======================================================
// EXPORTED FUNCTIONS (for App.jsx to use)
// =======================================================

/**
 * Saves the current state object into the active scenario.
 */
export function saveCurrentScenario(appData, scenarioName) {
    if (!scenarioName || (scenarioName === DEFAULT_SCENARIO_NAME && !getSavedScenarios()[DEFAULT_SCENARIO_NAME])) {
        console.warn("Save skipped: Invalid scenario name or trying to overwrite unsaved default placeholder.");
        return false;
    }

    const scenarios = getSavedScenarios();
    scenarios[scenarioName] = appData; 
    saveScenarios(scenarios);
    saveLastActiveScenarioName(scenarioName);
    return true;
}

/**
 * Debounced function to trigger saving the current scenario state.
 */
export function autoSaveCurrentScenario(appData, scenarioName) {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
        if(saveCurrentScenario(appData, scenarioName)) {
           console.log(`Auto-saved scenario: ${scenarioName}`);
        }
    }, AUTO_SAVE_DELAY);
}

/**
 * Loads the initial state (last active scenario or default data).
 */
export function loadInitialScenario() {
    const scenarios = getSavedScenarios();
    const scenarioNames = Object.keys(scenarios).sort();
    const lastActiveName = getLastActiveScenarioName();

    let activeData = getInitialDataState();
    let activeName = DEFAULT_SCENARIO_NAME;
    let names = scenarioNames.length > 0 ? scenarioNames : [DEFAULT_SCENARIO_NAME];

    // Case 1: Load last active scenario
    if (lastActiveName && scenarios[lastActiveName]) {
        activeData = scenarios[lastActiveName];
        activeName = lastActiveName;
    }
    // Case 2: Load the first available scenario if none are explicitly set
    else if (scenarioNames.length > 0) {
        activeName = scenarioNames[0];
        activeData = scenarios[activeName];
        saveLastActiveScenarioName(activeName);
    }
    // Case 3: Load default data (already set above)

    return { activeData, activeName, names };
}

/**
 * Loads a specific scenario by name.
 */
export function loadSelectedScenario(name) {
    const scenarios = getSavedScenarios();
    if (scenarios[name]) {
        saveLastActiveScenarioName(name);
        return scenarios[name];
    }
    return null;
}

/**
 * Saves the current state as a new scenario.
 */
export function saveScenarioAs(appData, newName) {
    const scenarios = getSavedScenarios();
    scenarios[newName] = appData;
    saveScenarios(scenarios);
    saveLastActiveScenarioName(newName);
    return true;
}

/**
 * Deletes a scenario.
 */
export function deleteScenario(name) {
    const scenarios = getSavedScenarios();
    if (scenarios[name]) {
        delete scenarios[name];
        saveScenarios(scenarios);
        if (getLastActiveScenarioName() === name) {
            localStorage.removeItem(LAST_ACTIVE_SCENARIO_KEY);
        }
        return true;
    }
    return false;
}

/**
 * Retrieves only the list of scenario names.
 */
export function getScenarioNames() {
    const scenarios = getSavedScenarios();
    const names = Object.keys(scenarios).sort();
    return names.length > 0 ? names : [DEFAULT_SCENARIO_NAME];
}