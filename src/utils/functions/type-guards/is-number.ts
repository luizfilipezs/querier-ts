/**
 * Determines if the given value is a number.
 * 
 * @param {any} value The value to check.
 * 
 * @returns {boolean} Validation result.
 */
export const isNumber = (value: any): value is Number => typeof value === 'number';
