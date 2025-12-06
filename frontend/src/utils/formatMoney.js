/**
 * Format monetary values in a compact, readable format
 * 
 * @param {number} value - The monetary value to format
 * @param {number} [decimals=1] - Number of decimal places
 * @param {string} [currencySymbol=''] - Currency symbol prefix (e.g., 'GH₵', '$')
 * @returns {string} Formatted money string
 * 
 * @example
 * formatMoney(14000) // "14K"
 * formatMoney(10000000) // "10M"
 * formatMoney(1500000, 1, 'GH₵') // "GH₵1.5M"
 * formatMoney(2500) // "2.5K"
 * formatMoney(999) // "999"
 * formatMoney(1200000000) // "1.2B"
 * formatMoney(3000000000000) // "3T"
 * formatMoney(-14000) // "-14K"
 * formatMoney(0) // "0"
 */
export function formatMoney(value, decimals = 1, currencySymbol = '') {
  // Handle null, undefined, or non-numeric values
  if (value == null || isNaN(value)) {
    return currencySymbol ? `${currencySymbol}0` : '0';
  }

  // Convert to number if string
  const num = typeof value === 'string' ? parseFloat(value) : value;

  // Handle zero
  if (num === 0) {
    return currencySymbol ? `${currencySymbol}0` : '0';
  }

  // Preserve sign for negative numbers
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  // Determine the appropriate suffix and divisor
  let formattedValue;
  let suffix = '';

  if (absNum >= 1_000_000_000_000) {
    // Trillions
    formattedValue = absNum / 1_000_000_000_000;
    suffix = 'T';
  } else if (absNum >= 1_000_000_000) {
    // Billions
    formattedValue = absNum / 1_000_000_000;
    suffix = 'B';
  } else if (absNum >= 1_000_000) {
    // Millions
    formattedValue = absNum / 1_000_000;
    suffix = 'M';
  } else if (absNum >= 1_000) {
    // Thousands
    formattedValue = absNum / 1_000;
    suffix = 'K';
  } else {
    // Less than 1000, show as-is
    formattedValue = absNum;
  }

  // Round to specified decimal places
  const rounded = Number(formattedValue.toFixed(decimals));

  // Remove unnecessary trailing zeros
  const formatted = rounded.toString().replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');

  // Build the final string
  const sign = isNegative ? '-' : '';
  return `${sign}${currencySymbol}${formatted}${suffix}`;
}

/**
 * Format money with Ghana Cedis symbol (GH₵)
 * 
 * @param {number} value - The monetary value to format
 * @param {number} [decimals=1] - Number of decimal places
 * @returns {string} Formatted money string with GH₵ prefix
 * 
 * @example
 * formatMoneyGHS(14000) // "GH₵14K"
 * formatMoneyGHS(1500000) // "GH₵1.5M"
 */
export function formatMoneyGHS(value, decimals = 1) {
  return formatMoney(value, decimals, 'GH₵');
}

/**
 * Format money with full number tooltip data attribute
 * Returns an object with formatted value and full value for tooltip
 * 
 * @param {number} value - The monetary value to format
 * @param {number} [decimals=1] - Number of decimal places
 * @param {string} [currencySymbol=''] - Currency symbol prefix
 * @returns {object} Object with formatted and full values
 * 
 * @example
 * formatMoneyWithTooltip(14500000, 1, 'GH₵')
 * // { formatted: "GH₵14.5M", full: "GH₵14,500,000" }
 */
export function formatMoneyWithTooltip(value, decimals = 1, currencySymbol = '') {
  const formatted = formatMoney(value, decimals, currencySymbol);
  
  // Format full value with commas
  const fullValue = value != null && !isNaN(value)
    ? `${currencySymbol}${Math.abs(value).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      })}`
    : `${currencySymbol}0`;

  const sign = value < 0 ? '-' : '';
  
  return {
    formatted,
    full: `${sign}${fullValue}`,
    value
  };
}

export default formatMoney;
