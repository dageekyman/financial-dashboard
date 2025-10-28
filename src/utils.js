// utils.js

/**
 * Format a number as currency. Returns "$0" for falsy/NaN values.
 */
export function formatCurrency(value, options = {}) {
  const n = Number(value);
  const safe = isFinite(n) && !isNaN(n) ? n : 0;
  const {
    currency = 'USD',
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
  } = options;

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(safe);
  } catch {
    // Fallback
    return `$${safe.toFixed(0)}`;
  }
}

/**
 * Parse currency-like strings safely.
 * - Strips non-numeric characters except digits, minus, and period.
 * - Returns defaultValue (0 by default) on NaN.
 */
export function parseCurrency(value, defaultValue = 0) {
  if (typeof value === 'number') return isFinite(value) ? value : defaultValue;
  if (value == null) return defaultValue;

  const cleaned = String(value).replace(/[^0-9.-]+/g, '');
  const parsed = parseFloat(cleaned);
  return isFinite(parsed) && !isNaN(parsed) ? parsed : defaultValue;
}

/**
 * Accepts either 7 or 0.07 and returns 0.07
 * (Re-exported here for convenience in UI code, identical to calculations.js)
 */
export function normalizePercent(value) {
  const x = typeof value === 'number' ? value : parseFloat(String(value));
  if (!isFinite(x) || isNaN(x)) return 0;
  return x <= 1 ? x : x / 100;
}
