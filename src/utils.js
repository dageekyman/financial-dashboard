// src/utils.js
// --- Helper Functions ---
export function formatCurrency(amount) {
    if (isNaN(amount) || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

export function parseCurrency(value) {
    const cleanStr = String(value).replace(/[^0-9.-]+/g,"");
    if (cleanStr === "" || cleanStr === "." || cleanStr === "-" || cleanStr === "-.") {
        return 0;
    }
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
}